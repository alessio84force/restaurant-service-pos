"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const {
  collegaRistorante
} = require("../desktopPairing");

const pagina = path.join(__dirname, "index.html");

function rispondiJson(res, headers, stato, dati) {
  res.writeHead(stato, {
    ...headers,
    "Content-Type": "application/json; charset=utf-8"
  });

  res.end(JSON.stringify(dati));
}

function avviaDesktop(opzioni = {}) {
  const collega =
    typeof opzioni.collega === "function"
      ? opzioni.collega
      : collegaRistorante;

  let collegamentoInCorso = false;

  const server = http.createServer((req, res) => {
    const indirizzo =
      "127.0.0.1:" + server.address().port;

    const origine =
      "http://" + indirizzo;

    if (req.headers.host !== indirizzo) {
      res.writeHead(403);
      res.end();
      return;
    }

    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'none'; " +
        "style-src 'unsafe-inline'; " +
        "script-src 'self'; " +
        "connect-src 'self'; " +
        "base-uri 'none'; " +
        "frame-ancestors 'none'; " +
        "form-action 'none'"
    };

    if (
      req.method === "POST" &&
      req.url === "/api/collega"
    ) {
      if (req.headers.origin !== origine) {
        rispondiJson(res, headers, 403, {
          ok: false,
          error: "Richiesta non autorizzata."
        });
        return;
      }

      const tipo =
        String(req.headers["content-type"] || "");

      if (
        !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(tipo)
      ) {
        rispondiJson(res, headers, 415, {
          ok: false,
          error: "Formato della richiesta non valido."
        });
        return;
      }

      if (collegamentoInCorso) {
        rispondiJson(res, headers, 409, {
          ok: false,
          error: "Collegamento gia in corso."
        });
        return;
      }

      let contenuto = "";
      let troppoGrande = false;

      req.setEncoding("utf8");

      req.on("data", (pezzo) => {
        if (troppoGrande) return;

        contenuto += pezzo;

        if (
          Buffer.byteLength(contenuto, "utf8") > 2048
        ) {
          troppoGrande = true;
          contenuto = "";
        }
      });

      req.on("end", async () => {
        if (troppoGrande) {
          rispondiJson(res, headers, 413, {
            ok: false,
            error: "Richiesta troppo grande."
          });
          return;
        }

        let dati;

        try {
          dati = JSON.parse(contenuto);
        } catch (_) {
          dati = null;
        }

        if (
          !dati ||
          typeof dati.codice !== "string" ||
          dati.codice.length > 32
        ) {
          rispondiJson(res, headers, 400, {
            ok: false,
            error: "Inserisci un codice valido."
          });
          return;
        }

        if (collegamentoInCorso) {
          rispondiJson(res, headers, 409, {
            ok: false,
            error: "Collegamento gia in corso."
          });
          return;
        }

        collegamentoInCorso = true;

        try {
          const risultato =
            await collega(dati.codice);

          if (
            !risultato ||
            risultato.ok !== true ||
            !Number.isSafeInteger(
              risultato.restaurante_id
            ) ||
            risultato.restaurante_id <= 0
          ) {
            throw new Error(
              "Risposta del collegamento non valida."
            );
          }

          // Non restituire mai il token al browser.
          rispondiJson(res, headers, 200, {
            ok: true,
            restaurante_id:
              risultato.restaurante_id,
            bridge_nome:
              String(risultato.bridge_nome || "")
                .slice(0, 200)
          });

        } catch (err) {
          const messaggio =
            String(err && err.message || "");

          if (
            messaggio ===
            "Inserisci un codice valido di 10 caratteri."
          ) {
            rispondiJson(res, headers, 400, {
              ok: false,
              error: messaggio
            });

          } else if (
            messaggio.startsWith(
              "Codice non valido, scaduto o gia utilizzato."
            )
          ) {
            rispondiJson(res, headers, 401, {
              ok: false,
              error: "Codice non valido o scaduto. Generane uno nuovo sul sito."
            });

          } else {
            rispondiJson(res, headers, 500, {
              ok: false,
              error:
                "Collegamento non riuscito. Verifica la connessione e riprova."
            });
          }

        } finally {
          collegamentoInCorso = false;
        }
      });

      return;
    }

    if (req.method !== "GET") {
      res.writeHead(405, headers);
      res.end();
      return;
    }

    if (req.url === "/health") {
      rispondiJson(res, headers, 200, {
        ok: true,
        versione: "2.15.0",
        modalita: "anteprima"
      });
      return;
    }

    if (req.url !== "/") {
      res.writeHead(404, headers);
      res.end();
      return;
    }

    fs.readFile(pagina, (err, contenuto) => {
      if (err) {
        res.writeHead(500, headers);
        res.end("Interfaccia non disponibile");
        return;
      }

      res.writeHead(200, {
        ...headers,
        "Content-Type": "text/html; charset=utf-8"
      });

      res.end(contenuto);
    });
  });

  server.listen(0, "127.0.0.1", () => {
    const porta = server.address().port;

    console.log("");
    console.log("PRINT BRIDGE DESKTOP - ANTEPRIMA");
    console.log("http://127.0.0.1:" + porta + "/");
    console.log("");
    console.log("Per arrestare: CTRL+C");
  });

  return server;
}

if (require.main === module) {
  avviaDesktop();
}

module.exports = {
  avviaDesktop
};
