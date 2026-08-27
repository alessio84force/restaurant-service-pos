"use strict";

const {
  caricaConfigurazione
} = require("./config");

const bridgeInfo = Object.freeze({
  nome: "Restaurant Service POS RT Bridge",
  versione: "2.13.0"
});

function avvia() {
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

  console.log(
    "[" + bridgeInfo.nome + "] Stato: inizializzazione completata"
  );
}

if (require.main === module) {
  avvia();
}

module.exports = {
  avvia,
  bridgeInfo
};
