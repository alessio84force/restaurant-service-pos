const http = require("http");
const https = require("https");

function richiesta(
  config,
  metodo,
  percorso,
  body
) {
  return new Promise(
    (resolve, reject) => {
      const url =
        new URL(
          percorso,
          config.server_url
        );

      const modulo =
        url.protocol === "https:"
          ? https
          : http;

      const contenuto =
        body == null
          ? ""
          : JSON.stringify(body);

      const headers = {
        Authorization:
          "Bearer " + config.token,
        "X-RSP-Bridge-ID":
          config.bridge_id
      };

      if (contenuto) {
        headers["Content-Type"] =
          "application/json";

        headers["Content-Length"] =
          Buffer.byteLength(
            contenuto
          );
      }

      const req =
        modulo.request(
          {
            protocol:
              url.protocol,
            hostname:
              url.hostname,
            port:
              url.port ||
              (url.protocol ===
              "https:"
                ? 443
                : 80),
            path:
              url.pathname +
              url.search,
            method:
              metodo,
            headers
          },
          (res) => {
            let testo = "";

            res.setEncoding(
              "utf8"
            );

            res.on(
              "data",
              (chunk) => {
                testo += chunk;
              }
            );

            res.on(
              "end",
              () => {
                let json = null;

                try {
                  json =
                    JSON.parse(
                      testo
                    );
                } catch (_) {}

                resolve({
                  status:
                    res.statusCode,
                  json,
                  testo
                });
              }
            );
          }
        );

      req.setTimeout(
        5000,
        () => {
          req.destroy(
            new Error(
              "Timeout connessione Print Bridge"
            )
          );
        }
      );

      req.on(
        "error",
        reject
      );

      if (contenuto) {
        req.write(
          contenuto
        );
      }

      req.end();
    }
  );
}

function ping(config) {
  return richiesta(
    config,
    "GET",
    "/api/print-bridge/ping"
  );
}

function heartbeat(config) {
  return richiesta(
    config,
    "POST",
    "/api/print-bridge/heartbeat",
    {
      bridge_nome:
        config.bridge_nome,
      bridge_version:
        config.bridge_version
    }
  );
}

function sincronizzaStampanti(
  config,
  stampanti
) {
  return richiesta(
    config,
    "POST",
    "/api/print-bridge/printers/sync",
    {
      stampanti:
        Array.isArray(stampanti)
          ? stampanti
          : []
    }
  );
}

function claim(config) {
  return richiesta(
    config,
    "POST",
    "/api/print-bridge/jobs/claim"
  );
}

function confermaStampa(
  config,
  lavoroId
) {
  return richiesta(
    config,
    "POST",
    "/api/print-bridge/jobs/" +
      Number(lavoroId) +
      "/printed"
  );
}

function segnalaErrore(
  config,
  lavoroId,
  errore
) {
  return richiesta(
    config,
    "POST",
    "/api/print-bridge/jobs/" +
      Number(lavoroId) +
      "/error",
    {
      error:
        String(
          errore ||
          "Errore stampa"
        )
    }
  );
}

module.exports = {
  ping,
  heartbeat,
  sincronizzaStampanti,
  claim,
  confermaStampa,
  segnalaErrore
};
