"use strict";

const fs = require("fs");
const path = require("path");
const Module = require("module");

const root = path.resolve(__dirname, "../..");

const files = Object.freeze([
  "print-bridge/pair.js",
  "print-bridge/desktopPairing.js",
  "print-bridge/desktop/electronMain.js",
  "print-bridge/desktop/server.js",
  "print-bridge/desktop/app.js",
  "print-bridge/desktop/i18n.js",
  "print-bridge/desktop/index.html",
  "print-bridge/desktop/stato.js",
  "print-bridge/desktop/preferenze.js"
]);

function verificaDistribuzione() {
  const autorizzati = new Set(files);
  const integrati = new Set(Module.builtinModules);

  for (const file of files) {
    const completo = path.join(root, file);
    const stat = fs.lstatSync(completo);

    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error("File non sicuro: " + file);
    }

    if (!file.endsWith(".js")) continue;

    const sorgente = fs.readFileSync(completo, "utf8");

    const importazioni = sorgente.matchAll(
      /require\s*\(\s*["']([^"']+)["']\s*\)/g
    );

    for (const risultato of importazioni) {
      const nome = risultato[1];

      if (nome === "electron" || integrati.has(nome)) {
        continue;
      }

      if (!nome.startsWith(".")) {
        throw new Error(
          "Dipendenza esterna inattesa: " + nome
        );
      }

      const destinazione = path.relative(
        root,
        path.resolve(path.dirname(completo), nome)
      ) + ".js";

      if (!autorizzati.has(destinazione)) {
        throw new Error(
          "Dipendenza assente dal pacchetto: " +
          destinazione
        );
      }
    }
  }

  const vietati = [
    "worker.js",
    "servizio.js",
    "config.json",
    "preferenze.json",
    ".env",
    "database.sqlite"
  ];

  for (const file of files) {
    if (vietati.some(nome =>
      file === nome || file.endsWith("/" + nome)
    )) {
      throw new Error("File vietato: " + file);
    }
  }

  return {
    ok: true,
    files: [...files]
  };
}

module.exports = {
  verificaDistribuzione
};
