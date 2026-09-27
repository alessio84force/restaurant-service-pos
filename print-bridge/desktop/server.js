"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const pagina = path.join(__dirname, "index.html");

function avviaDesktop() {
  const server = http.createServer((req, res) => {
    const indirizzo =
      "127.0.0.1:" + server.address().port;

    // Accetta soltanto richieste indirizzate al servizio locale.
    if (req.headers.host !== indirizzo) {
      res.writeHead(403);
      res.end();
      return;
    }

    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy":
        "default-src 'none'; " +
        "style-src 'unsafe-inline'; " +
        "base-uri 'none'; " +
        "frame-ancestors 'none'; " +
        "form-action 'none'"
    };

    if (req.method !== "GET") {
      res.writeHead(405, headers);
      res.end();
      return;
    }

    if (req.url === "/health") {
      res.writeHead(200, {
        ...headers,
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(JSON.stringify({
        ok: true,
        versione: "2.15.0",
        modalita: "anteprima"
      }));

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
