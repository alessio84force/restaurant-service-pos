"use strict";

const fs = require("fs");
const path = require("path");

const { leggiStato } = require("./stato");

const {
  configDesktopDefault
} = require("../desktopPairing");

function creaControlloreServizio(opzioni = {}) {
  const configFile =
    opzioni.configFile || configDesktopDefault;

  const workerFile =
    opzioni.workerFile ||
    path.resolve(__dirname, "../worker.js");

  const lancia = opzioni.lancia;

  const intervalloMs = Math.max(
    1000,
    Number(opzioni.intervalloMs) || 3000
  );

  if (
    typeof lancia !== "function" ||
    !path.isAbsolute(configFile) ||
    !path.isAbsolute(workerFile)
  ) {
    throw new Error("Configurazione controllore non valida");
  }

  let richiesto = false;
  let processo = null;
  let timer = null;
  let arrestoInCorso = false;
  let errore = false;
  let atteseFineWorker = [];

  function completaAttese() {
    const attese = atteseFineWorker;
    atteseFineWorker = [];

    for (const risolvi of attese) {
      risolvi();
    }
  }

  function attendiArresto() {
    if (!processo) return Promise.resolve();

    return new Promise(risolvi => {
      atteseFineWorker.push(risolvi);
    });
  }

  function stato() {
    return {
      attivo: richiesto,
      in_esecuzione: Boolean(processo),
      arresto_in_corso: arrestoInCorso,
      errore
    };
  }

  function programma() {
    if (!richiesto) return;

    timer = setTimeout(() => {
      timer = null;
      esegui();
    }, intervalloMs);
  }

  function esegui() {
    if (!richiesto || processo) return;

    try {
      const ambiente = { ...process.env };

      // Nessuna impostazione della vecchia installazione.
      for (const nome of Object.keys(ambiente)) {
        if (nome.startsWith("RSP_PRINT_BRIDGE_")) {
          delete ambiente[nome];
        }
      }

      // Solo il profilo esplicitamente assegnato al Desktop.
      ambiente.RSP_PRINT_BRIDGE_CONFIG = configFile;

      const figlio = lancia(workerFile, {
        env: ambiente,
        stdio: "ignore"
      });

      if (!figlio || typeof figlio.once !== "function") {
        throw new Error("Processo non valido");
      }

      processo = figlio;
      let terminato = false;

      function termina(codice) {
        if (terminato) return;
        terminato = true;

        if (processo === figlio) {
          processo = null;
        }

        if (!richiesto) {
          arrestoInCorso = false;
          completaAttese();
          return;
        }

        completaAttese();

        if (codice !== 0 && codice !== 2) {
          richiesto = false;
          errore = true;
          return;
        }

        programma();
      }

      figlio.once("exit", codice => termina(codice));
      figlio.once("error", () => termina(-1));

    } catch (_) {
      processo = null;
      richiesto = false;
      errore = true;
      completaAttese();
    }
  }

  function avvia() {
    if (richiesto || processo || arrestoInCorso) {
      return { ok: false, ...stato() };
    }

    if (
      leggiStato(configFile).configurato !== true ||
      !fs.existsSync(workerFile)
    ) {
      return { ok: false, ...stato() };
    }

    richiesto = true;
    errore = false;
    esegui();

    return { ok: richiesto, ...stato() };
  }

  function arresta() {
    richiesto = false;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    // Non interrompiamo una stampa in corso.
    arrestoInCorso = Boolean(processo);

    return { ok: true, ...stato() };
  }

  return Object.freeze({
    avvia,
    arresta,
    attendiArresto,
    stato
  });
}

module.exports = {
  creaControlloreServizio
};
