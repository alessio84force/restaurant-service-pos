"use strict";

const express = require("express");
const crypto = require("crypto");

function get(db, sql, params) {
  return new Promise(function(resolve, reject) {
    db.get(sql, params || [], function(err, row) {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function run(db, sql, params) {
  return new Promise(function(resolve, reject) {
    db.run(sql, params || [], function(err) {
      if (err) return reject(err);

      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token || ""), "utf8")
    .digest("hex");
}

function tokenBearer(req) {
  const header =
    String(req.headers.authorization || "").trim();

  const match =
    /^Bearer\s+(.+)$/i.exec(header);

  return match
    ? String(match[1]).trim()
    : "";
}

function claimTokenNuovo() {
  return crypto
    .randomBytes(24)
    .toString("hex");
}

module.exports = function rtBridgeApiRoutes(db) {
  const router = express.Router();

  async function autenticaBridge(req, res, next) {
    try {
      const token = tokenBearer(req);

      if (!token) {
        return res.status(401).json({
          ok: false,
          error: "Token RT Bridge mancante"
        });
      }

      const tokenHash = hashToken(token);

      const configurazione = await get(
        db,
        `SELECT
           restaurante_id,
           rt_activo,
           rt_modo,
           rt_fabricante,
           rt_modelo
         FROM configurazione
         WHERE rt_bridge_token_hash=?
         LIMIT 1`,
        [tokenHash]
      );

      if (!configurazione) {
        return res.status(401).json({
          ok: false,
          error: "Token RT Bridge non valido"
        });
      }

      req.rtBridge = {
        restaurante_id:
          Number(configurazione.restaurante_id),
        configurazione:
          configurazione
      };

      await run(
        db,
        `UPDATE configurazione
         SET rt_bridge_ultimo_contatto=CURRENT_TIMESTAMP
         WHERE restaurante_id=?`,
        [req.rtBridge.restaurante_id]
      );

      next();
    } catch (err) {
      console.error(
        "[RT Bridge API] Errore autenticazione:",
        err && err.message ? err.message : err
      );

      res.status(500).json({
        ok: false,
        error: "Errore autenticazione RT Bridge"
      });
    }
  }

  router.post(
    "/heartbeat",
    autenticaBridge,
    async function(req, res) {
      res.json({
        ok: true,
        restaurante_id:
          req.rtBridge.restaurante_id,
        server_time:
          new Date().toISOString()
      });
    }
  );

  router.post(
    "/jobs/claim",
    autenticaBridge,
    async function(req, res) {
      const restauranteId =
        req.rtBridge.restaurante_id;

      try {
        const job = await get(
          db,
          `SELECT
             id,
             pedido_id,
             idempotency_key,
             payload_json,
             intentos,
             creado_en
           FROM rt_bridge_jobs
           WHERE restaurante_id=?
             AND estado='pendiente'
           ORDER BY id
           LIMIT 1`,
          [restauranteId]
        );

        if (!job) {
          return res.json({
            ok: true,
            job: null
          });
        }

        const claimToken =
          claimTokenNuovo();

        const actualizado = await run(
          db,
          `UPDATE rt_bridge_jobs
           SET
             estado='reclamado',
             claim_token=?,
             reclamado_en=CURRENT_TIMESTAMP,
             actualizado_en=CURRENT_TIMESTAMP,
             intentos=intentos+1
           WHERE id=?
             AND restaurante_id=?
             AND estado='pendiente'`,
          [
            claimToken,
            job.id,
            restauranteId
          ]
        );

        if (actualizado.changes !== 1) {
          return res.status(409).json({
            ok: false,
            error:
              "Job RT già reclamato da un altro processo"
          });
        }

        let payload;

        try {
          payload =
            JSON.parse(job.payload_json);
        } catch (err) {
          await run(
            db,
            `UPDATE rt_bridge_jobs
             SET
               estado='error',
               ultimo_error=?,
               finalizado_en=CURRENT_TIMESTAMP,
               actualizado_en=CURRENT_TIMESTAMP
             WHERE id=?
               AND restaurante_id=?`,
            [
              "Payload RT non valido",
              job.id,
              restauranteId
            ]
          );

          return res.status(500).json({
            ok: false,
            error: "Payload RT non valido"
          });
        }

        res.json({
          ok: true,
          job: {
            id: job.id,
            pedido_id: job.pedido_id,
            idempotency_key:
              job.idempotency_key,
            claim_token:
              claimToken,
            payload: payload,
            creado_en:
              job.creado_en
          }
        });
      } catch (err) {
        console.error(
          "[RT Bridge API] Errore claim:",
          err && err.message ? err.message : err
        );

        res.status(500).json({
          ok: false,
          error: "Errore claim job RT"
        });
      }
    }
  );

  router.post(
    "/jobs/:id/start",
    autenticaBridge,
    async function(req, res) {
      const restauranteId =
        req.rtBridge.restaurante_id;

      const jobId =
        Number(req.params.id || 0);

      const body =
        req.body &&
        typeof req.body === "object"
          ? req.body
          : {};

      const claimToken =
        String(
          body.claim_token || ""
        ).trim();

      if (!jobId || !claimToken) {
        return res.status(400).json({
          ok: false,
          error:
            "Job o claim_token RT non valido"
        });
      }

      try {
        const job = await get(
          db,
          `SELECT
             id,
             pedido_id,
             idempotency_key,
             estado,
             claim_token
           FROM rt_bridge_jobs
           WHERE id=?
             AND restaurante_id=?
           LIMIT 1`,
          [
            jobId,
            restauranteId
          ]
        );

        if (!job) {
          return res.status(404).json({
            ok: false,
            error: "Job RT non trovato"
          });
        }

        if (
          String(job.claim_token || "") !==
            claimToken
        ) {
          return res.status(409).json({
            ok: false,
            error:
              "Claim RT non valido"
          });
        }

        /*
         * Endpoint idempotente:
         * se il bridge ha gia comunicato
         * l'avvio fiscale, rispondiamo OK.
         */
        if (job.estado === "inviando") {
          return res.json({
            ok: true,
            job_id: jobId,
            estado: "inviando"
          });
        }

        if (job.estado !== "reclamado") {
          return res.status(409).json({
            ok: false,
            error:
              "Job RT non reclamato"
          });
        }

        const aggiornamento =
          await run(
            db,
            `UPDATE rt_bridge_jobs
             SET
               estado='inviando',
               invio_avviato_en=COALESCE(invio_avviato_en,CURRENT_TIMESTAMP),
               actualizado_en=CURRENT_TIMESTAMP
             WHERE id=?
               AND restaurante_id=?
               AND estado IN ('reclamado','inviando')
               AND claim_token=?`,
            [
              jobId,
              restauranteId,
              claimToken
            ]
          );

        if (
          aggiornamento.changes !== 1
        ) {
          return res.status(409).json({
            ok: false,
            error:
              "Impossibile avviare job RT"
          });
        }

        res.json({
          ok: true,
          job_id: jobId,
          estado: "inviando"
        });
      } catch (err) {
        console.error(
          "[RT Bridge API] Errore avvio fiscale:",
          err && err.message
            ? err.message
            : err
        );

        res.status(500).json({
          ok: false,
          error:
            "Errore avvio fiscale RT"
        });
      }
    }
  );

  router.post(
    "/jobs/:id/result",
    autenticaBridge,
    async function(req, res) {
      const restauranteId =
        req.rtBridge.restaurante_id;

      const jobId =
        Number(req.params.id || 0);

      const body =
        req.body && typeof req.body === "object"
          ? req.body
          : {};

      const claimToken =
        String(body.claim_token || "").trim();

      if (!jobId || !claimToken) {
        return res.status(400).json({
          ok: false,
          error:
            "Job o claim_token RT non valido"
        });
      }

      try {
        const job = await get(
          db,
          `SELECT
             id,
             pedido_id,
             idempotency_key,
             estado,
             claim_token
           FROM rt_bridge_jobs
           WHERE id=?
             AND restaurante_id=?
           LIMIT 1`,
          [jobId, restauranteId]
        );

        if (!job) {
          return res.status(404).json({
            ok: false,
            error: "Job RT non trovato"
          });
        }

        if (
          (
            job.estado !== "reclamado" &&
            job.estado !== "inviando"
          ) ||
          String(job.claim_token || "") !==
            claimToken
        ) {
          return res.status(409).json({
            ok: false,
            error:
              "Claim RT non valido o non più attivo"
          });
        }

        const invioDichiarato =
          body.invio_fiscale_avviato === true;

        /*
         * La fonte autorevole sull'avvio fiscale
         * e lo stato registrato dal SaaS tramite
         * /jobs/:id/start, non il valore dichiarato
         * successivamente dal bridge.
         */
        const invioRegistrato =
          job.estado === "inviando";

        const documentoId =
          String(
            body.documento_id || ""
          ).trim();

        const rispostaOk =
          body.ok === true;

        if (
          (
            rispostaOk ||
            invioDichiarato
          ) &&
          !invioRegistrato
        ) {
          return res.status(409).json({
            ok: false,
            error:
              "Invio fiscale RT non marcato come avviato"
          });
        }

        let statoFinale;
        let errore = null;

        if (
          rispostaOk &&
          documentoId
        ) {
          statoFinale = "completato";
        } else if (
          rispostaOk &&
          !documentoId
        ) {
          statoFinale =
            invioRegistrato
              ? "incerto"
              : "error";

          errore =
            "Risposta RT completata senza documento_id";
        } else {
          statoFinale =
            invioRegistrato
              ? "incerto"
              : "error";

          errore = String(
            body.error ||
            "Errore RT Bridge"
          );
        }

        const statoPedido =
          statoFinale === "completato"
            ? "emitido"
            : statoFinale;

        await run(db, "BEGIN IMMEDIATE", []);

        try {
          const aggiornamentoJob = await run(
            db,
            `UPDATE rt_bridge_jobs
             SET
               estado=?,
               resultado_json=?,
               ultimo_error=?,
               finalizado_en=CURRENT_TIMESTAMP,
               actualizado_en=CURRENT_TIMESTAMP
             WHERE id=?
               AND restaurante_id=?
               AND estado IN ('reclamado','inviando')
               AND claim_token=?`,
            [
              statoFinale,
              JSON.stringify(body),
              errore,
              jobId,
              restauranteId,
              claimToken
            ]
          );

          if (aggiornamentoJob.changes !== 1) {
            throw new Error(
              "Job RT non più reclamabile"
            );
          }

          let aggiornamentoPedido;

          if (statoPedido === "emitido") {
            aggiornamentoPedido = await run(
              db,
              `UPDATE pedidos
               SET
                 rt_estado='emitido',
                 rt_documento_id=?,
                 rt_emitido_en=CURRENT_TIMESTAMP,
                 rt_ultimo_error=NULL,
                 rt_enviando_desde=NULL
               WHERE id=?
                 AND COALESCE(restaurante_id,1)=?
                 AND rt_idempotency_key=?
                 AND rt_estado='enviando'`,
              [
                documentoId,
                job.pedido_id,
                restauranteId,
                job.idempotency_key
              ]
            );
          } else {
            aggiornamentoPedido = await run(
              db,
              `UPDATE pedidos
               SET
                 rt_estado=?,
                 rt_ultimo_error=?,
                 rt_enviando_desde=NULL
               WHERE id=?
                 AND COALESCE(restaurante_id,1)=?
                 AND rt_idempotency_key=?
                 AND rt_estado='enviando'`,
              [
                statoPedido,
                errore,
                job.pedido_id,
                restauranteId,
                job.idempotency_key
              ]
            );
          }

          if (aggiornamentoPedido.changes !== 1) {
            throw new Error(
              "Pedido RT non aggiornabile dallo stato enviando"
            );
          }

          await run(
            db,
            `INSERT INTO rt_eventos (
               restaurante_id,
               pedido_id,
               tipo,
               estado_anterior,
               estado_nuevo,
               documento_id,
               idempotency_key,
               nota
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              restauranteId,
              job.pedido_id,
              "bridge_resultado",
              "enviando",
              statoPedido,
              documentoId || null,
              job.idempotency_key,
              errore
            ]
          );

          await run(db, "COMMIT", []);
        } catch (err) {
          try {
            await run(db, "ROLLBACK", []);
          } catch (_) {
          }

          throw err;
        }

        res.json({
          ok: true,
          job_id: jobId,
          estado: statoFinale,
          pedido_estado: statoPedido,
          documento_id:
            documentoId || null
        });
      } catch (err) {
        console.error(
          "[RT Bridge API] Errore risultato:",
          err && err.message ? err.message : err
        );

        res.status(500).json({
          ok: false,
          error:
            "Errore salvataggio risultato RT"
        });
      }
    }
  );

  return router;
};
