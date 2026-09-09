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
          job.estado !== "reclamado" ||
          String(job.claim_token || "") !==
            claimToken
        ) {
          return res.status(409).json({
            ok: false,
            error:
              "Claim RT non valido o non più attivo"
          });
        }

        const esitoOk =
          body.ok === true;

        const invioAvviato =
          body.invio_fiscale_avviato === true;

        const statoFinale =
          esitoOk
            ? "completato"
            : (
                invioAvviato
                  ? "incerto"
                  : "error"
              );

        const errore =
          esitoOk
            ? null
            : String(
                body.error ||
                "Errore RT Bridge"
              );

        await run(
          db,
          `UPDATE rt_bridge_jobs
           SET
             estado=?,
             risultato_json=?,
             ultimo_error=?,
             finalizado_en=CURRENT_TIMESTAMP,
             actualizado_en=CURRENT_TIMESTAMP
           WHERE id=?
             AND restaurante_id=?
             AND estado='reclamado'
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

        res.json({
          ok: true,
          job_id: jobId,
          estado: statoFinale
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
