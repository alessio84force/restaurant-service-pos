"use strict";

const {
  caricaConfigurazione
} = require("./config");

const {
  creaWorker
} = require("./worker");

const bridgeInfo = Object.freeze({
  nome: "Restaurant Service POS RT Bridge",
  versione: "2.13.0"
});

async function avvia() {
  console.log(
    "[" + bridgeInfo.nome + "] Avvio versione " +
    bridgeInfo.versione
  );

  const configurazione =
    caricaConfigurazione();

  console.log(
    "[" + bridgeInfo.nome + "] Adapter: " +
    configurazione.adapter
  );

  console.log(
    "[" + bridgeInfo.nome + "] Dispositivo: " +
    configurazione.fabricante + " " +
    configurazione.modello
  );

  console.log(
    "[" + bridgeInfo.nome + "] Protocollo: " +
    configurazione.protocollo
  );

  console.log(
    "[" + bridgeInfo.nome + "] Host: " +
    (
      configurazione.host ||
      "non configurato"
    )
  );

  console.log(
    "[" + bridgeInfo.nome + "] Endpoint: " +
    configurazione.endpoint
  );

  if (!configurazione.workerAttivo) {
    console.log(
      "[" + bridgeInfo.nome +
      "] Worker SaaS: disattivato"
    );

    console.log(
      "[" + bridgeInfo.nome +
      "] Stato: inizializzazione completata"
    );

    return;
  }

  if (!configurazione.saasUrl) {
    throw new Error(
      "RT_SAAS_URL obbligatorio con RT_WORKER_ATTIVO=1"
    );
  }

  if (!configurazione.bridgeToken) {
    throw new Error(
      "RT_BRIDGE_TOKEN obbligatorio con RT_WORKER_ATTIVO=1"
    );
  }

  const worker =
    creaWorker(configurazione);

  function arresta() {
    console.log(
      "[" + bridgeInfo.nome +
      "] Arresto worker..."
    );

    worker.ferma();
  }

  process.once(
    "SIGINT",
    arresta
  );

  process.once(
    "SIGTERM",
    arresta
  );

  console.log(
    "[" + bridgeInfo.nome +
    "] Worker SaaS: attivo"
  );

  await worker.avvia();
}

if (require.main === module) {
  avvia().catch(function(err) {
    console.error(
      "[" + bridgeInfo.nome + "] Errore avvio:",
      err && err.message
        ? err.message
        : err
    );

    process.exitCode = 1;
  });
}

module.exports = {
  avvia,
  bridgeInfo
};
