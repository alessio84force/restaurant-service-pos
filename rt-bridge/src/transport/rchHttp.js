"use strict";

const http = require("http");
const https = require("https");

function creaUrl(configurazione) {
  if (
    !configurazione ||
    typeof configurazione !== "object"
  ) {
    throw new Error(
      "Configurazione trasporto RCH mancante"
    );
  }

  const protocollo =
    String(
      configurazione.protocollo || ""
    ).toLowerCase();

  if (
    protocollo !== "http" &&
    protocollo !== "https"
  ) {
    throw new Error(
      "Protocollo RCH non valido"
    );
  }

  const host =
    String(
      configurazione.host || ""
    ).trim();

  if (!host) {
    throw new Error(
      "Host RCH non configurato"
    );
  }

  const endpoint =
    String(
      configurazione.endpoint ||
      "/service.cgi"
    ).trim();

  if (!endpoint.startsWith("/")) {
    throw new Error(
      "Endpoint RCH non valido"
    );
  }

  return new URL(
    protocollo +
    "://" +
    host +
    endpoint
  );
}

function inviaXml(
  configurazione,
  xml
) {
  if (
    typeof xml !== "string" ||
    xml.trim() === ""
  ) {
    return Promise.reject(
      new Error(
        "Documento XML RCH mancante"
      )
    );
  }

  let url;

  try {
    url = creaUrl(configurazione);
  } catch (err) {
    return Promise.reject(err);
  }

  const timeoutMs =
    Number(
      configurazione.timeout_ms ||
      10000
    );

  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    return Promise.reject(
      new Error(
        "Timeout RCH non valido"
      )
    );
  }

  const corpo = Buffer.from(
    xml,
    "utf8"
  );

  const opzioni = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || undefined,
    path:
      url.pathname +
      url.search,
    method: "POST",
    headers: {
      "Content-Type":
        "application/xml",
      "Content-Length":
        corpo.length,
      "Connection":
        "close"
    }
  };

  if (
    url.protocol === "https:" &&
    configurazione.ca
  ) {
    opzioni.ca =
      configurazione.ca;
  }

  const client =
    url.protocol === "https:"
      ? https
      : http;

  return new Promise(
    function (resolve, reject) {
      const richiesta =
        client.request(
          opzioni,
          function (risposta) {
            const parti = [];

            risposta.on(
              "data",
              function (parte) {
                parti.push(parte);
              }
            );

            risposta.on(
              "end",
              function () {
                const body =
                  Buffer.concat(parti)
                    .toString("utf8");

                const statusCode =
                  Number(
                    risposta.statusCode ||
                    0
                  );

                if (
                  statusCode < 200 ||
                  statusCode >= 300
                ) {
                  reject(
                    new Error(
                      "RCH HTTP status " +
                      statusCode
                    )
                  );
                  return;
                }

                resolve({
                  statusCode:
                    statusCode,
                  headers:
                    risposta.headers,
                  body:
                    body
                });
              }
            );
          }
        );

      richiesta.setTimeout(
        timeoutMs,
        function () {
          richiesta.destroy(
            new Error(
              "Timeout comunicazione RCH"
            )
          );
        }
      );

      richiesta.on(
        "error",
        function (err) {
          reject(err);
        }
      );

      richiesta.write(corpo);
      richiesta.end();
    }
  );
}

module.exports = {
  inviaXml,
  creaUrl
};
