const express = require("express");

const {
  autenticaTokenBridge,
  registraContattoBridge
} = require(
  "../printing/printBridgeAuth"
);

const {
  reclamaProssimoLavoro,
  segnaImpreso,
  segnaErrore
} = require(
  "../printing/printBridgeQueue"
);

const {
  sincronizzaStampanti
} = require(
  "../printing/printBridgePrinters"
);

function tokenBearer(req) {
  const header = String(
    req.headers.authorization || ""
  ).trim();

  const match =
    header.match(
      /^Bearer\s+(.+)$/i
    );

  return match
    ? String(match[1]).trim()
    : "";
}

function bridgeIdFromReq(req) {
  return String(
    req.headers["x-rsp-bridge-id"] ||
    ""
  ).trim();
}

module.exports =
function printBridgeApiRoutes(db) {
  const router =
    express.Router();

  router.use(
    express.json({
      limit: "64kb"
    })
  );

  async function richiedeToken(
    req,
    res,
    next
  ) {
    try {
      const auth =
        await autenticaTokenBridge(
          db,
          tokenBearer(req)
        );

      if (!auth) {
        return res.status(401).json({
          ok: false,
          error:
            "print_bridge_non_autorizzato"
        });
      }

      req.printBridgeAuth =
        auth;

      next();
    } catch (err) {
      console.error(
        "[PRINT BRIDGE AUTH]",
        err.message
      );

      res.status(500).json({
        ok: false,
        error: "errore_autenticazione"
      });
    }
  }

  function richiedeBridgeId(
    req,
    res,
    next
  ) {
    const bridgeId =
      bridgeIdFromReq(req);

    if (!bridgeId) {
      return res.status(400).json({
        ok: false,
        error: "bridge_id_obbligatorio"
      });
    }

    if (bridgeId.length > 120) {
      return res.status(400).json({
        ok: false,
        error: "bridge_id_non_valido"
      });
    }

    req.printBridgeId =
      bridgeId;

    next();
  }

  router.get(
    "/api/print-bridge/ping",
    richiedeToken,
    (req, res) => {
      res.json({
        ok: true,
        restaurante_id:
          req.printBridgeAuth
            .restaurante_id
      });
    }
  );

  router.post(
    "/api/print-bridge/heartbeat",
    richiedeToken,
    richiedeBridgeId,
    async (req, res) => {
      try {
        const risultato =
          await registraContattoBridge(
            db,
            req.printBridgeAuth
              .restaurante_id,
            {
              bridge_nome:
                req.body &&
                req.body.bridge_nome,
              bridge_version:
                req.body &&
                req.body.bridge_version,
              ultimo_error:
                req.body &&
                req.body.ultimo_error
            }
          );

        res.json({
          ok: true,
          ultimo_contacto:
            risultato
              .ultimo_contacto
        });
      } catch (err) {
        console.error(
          "[PRINT BRIDGE HEARTBEAT]",
          err.message
        );

        res.status(500).json({
          ok: false,
          error: "errore_heartbeat"
        });
      }
    }
  );

  router.post(
    "/api/print-bridge/printers/sync",
    richiedeToken,
    richiedeBridgeId,
    async (req, res) => {
      try {
        const risultato =
          await sincronizzaStampanti(
            db,
            req.printBridgeAuth
              .restaurante_id,
            req.printBridgeId,
            req.body &&
            req.body.stampanti
          );

        res.json({
          ok: true,
          rilevate:
            risultato.rilevate,
          ultimo_contacto:
            risultato
              .ultimo_contacto
        });
      } catch (err) {
        console.error(
          "[PRINT BRIDGE PRINTERS]",
          err.message
        );

        res.status(400).json({
          ok: false,
          error:
            "errore_sync_stampanti"
        });
      }
    }
  );

  router.post(
    "/api/print-bridge/jobs/claim",
    richiedeToken,
    richiedeBridgeId,
    async (req, res) => {
      try {
        const lavoro =
          await reclamaProssimoLavoro(
            db,
            req.printBridgeAuth
              .restaurante_id,
            req.printBridgeId,
            60
          );

        res.json({
          ok: true,
          lavoro: lavoro || null
        });
      } catch (err) {
        console.error(
          "[PRINT BRIDGE CLAIM]",
          err.message
        );

        res.status(500).json({
          ok: false,
          error: "errore_claim"
        });
      }
    }
  );

  router.post(
    "/api/print-bridge/jobs/:id/printed",
    richiedeToken,
    richiedeBridgeId,
    async (req, res) => {
      try {
        const ok =
          await segnaImpreso(
            db,
            req.printBridgeAuth
              .restaurante_id,
            Number(req.params.id),
            req.printBridgeId
          );

        if (!ok) {
          return res.status(409).json({
            ok: false,
            error:
              "lavoro_non_confermabile"
          });
        }

        res.json({
          ok: true,
          estado: "impreso"
        });
      } catch (err) {
        console.error(
          "[PRINT BRIDGE ACK]",
          err.message
        );

        res.status(500).json({
          ok: false,
          error: "errore_ack"
        });
      }
    }
  );

  router.post(
    "/api/print-bridge/jobs/:id/error",
    richiedeToken,
    richiedeBridgeId,
    async (req, res) => {
      try {
        const messaggio =
          String(
            (req.body &&
             req.body.error) ||
            "Errore stampa"
          ).slice(0, 1000);

        const ok =
          await segnaErrore(
            db,
            req.printBridgeAuth
              .restaurante_id,
            Number(req.params.id),
            req.printBridgeId,
            messaggio
          );

        if (!ok) {
          return res.status(409).json({
            ok: false,
            error:
              "lavoro_non_aggiornabile"
          });
        }

        res.json({
          ok: true,
          estado: "error"
        });
      } catch (err) {
        console.error(
          "[PRINT BRIDGE ERROR]",
          err.message
        );

        res.status(500).json({
          ok: false,
          error:
            "errore_registrazione"
        });
      }
    }
  );

  return router;
};
