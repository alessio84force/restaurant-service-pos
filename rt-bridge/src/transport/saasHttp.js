"use strict";

const http = require("http");
const https = require("https");

function richiestaJson(configurazione, percorso, body) {
  return new Promise(function(resolve, reject) {
    const baseUrl =
      String(configurazione.saasUrl || "")
        .trim()
        .replace(/\/+$/, "");

    const token =
      String(configurazione.bridgeToken || "")
        .trim();

    if (!baseUrl) {
      return reject(
        new Error("RT_SAAS_URL non configurato")
      );
    }

    if (!token) {
      return reject(
        new Error("RT_BRIDGE_TOKEN non configurato")
      );
    }

    let url;

    try {
      url = new URL(
        baseUrl +
        "/api/rt-bridge" +
        percorso
      );
    } catch (err) {
      return reject(
        new Error("RT_SAAS_URL non valido")
      );
    }

    const client =
      url.protocol === "https:"
        ? https
        : http;

    const payload =
      JSON.stringify(body || {});

    const opzioni = {
      protocol: url.protocol,
      hostname: url.hostname,
      port:
        url.port ||
        (
          url.protocol === "https:"
            ? 443
            : 80
        ),
      method: "POST",
      path:
        url.pathname +
        url.search,
      headers: {
        "Authorization":
          "Bearer " + token,
        "Content-Type":
          "application/json",
        "Content-Length":
          Buffer.byteLength(payload)
      },
      timeout: 15000
    };

    const req =
      client.request(
        opzioni,
        function(res) {
          let testo = "";

          res.setEncoding("utf8");

          res.on(
            "data",
            function(chunk) {
              testo += chunk;
            }
          );

          res.on(
            "end",
            function() {
              let json = null;

              if (testo.trim()) {
                try {
                  json =
                    JSON.parse(testo);
                } catch (err) {
                  return reject(
                    new Error(
                      "Risposta SaaS non JSON"
                    )
                  );
                }
              }

              const statusCode =
                Number(
                  res.statusCode || 0
                );

              if (
                statusCode < 200 ||
                statusCode >= 300
              ) {
                const messaggio =
                  json &&
                  json.error
                    ? json.error
                    : (
                        "SaaS HTTP status " +
                        statusCode
                      );

                const errore =
                  new Error(messaggio);

                errore.statusCode =
                  statusCode;

                errore.risposta =
                  json;

                return reject(errore);
              }

              resolve({
                statusCode:
                  statusCode,
                body:
                  json || {}
              });
            }
          );
        }
      );

    req.on(
      "timeout",
      function() {
        req.destroy(
          new Error(
            "Timeout comunicazione SaaS"
          )
        );
      }
    );

    req.on(
      "error",
      reject
    );

    req.write(payload);
    req.end();
  });
}

function creaClientSaas(configurazione) {
  return {
    async heartbeat() {
      const risposta =
        await richiestaJson(
          configurazione,
          "/heartbeat",
          {}
        );

      return risposta.body;
    },

    async claim() {
      const risposta =
        await richiestaJson(
          configurazione,
          "/jobs/claim",
          {}
        );

      return risposta.body;
    },

    async start(jobId, claimToken) {
      const risposta =
        await richiestaJson(
          configurazione,
          "/jobs/" +
            encodeURIComponent(jobId) +
            "/start",
          {
            claim_token:
              claimToken
          }
        );

      return risposta.body;
    },

    async result(
      jobId,
      claimToken,
      risultato
    ) {
      const body =
        Object.assign(
          {},
          risultato || {},
          {
            claim_token:
              claimToken
          }
        );

      const risposta =
        await richiestaJson(
          configurazione,
          "/jobs/" +
            encodeURIComponent(jobId) +
            "/result",
          body
        );

      return risposta.body;
    }
  };
}

module.exports = {
  creaClientSaas
};
