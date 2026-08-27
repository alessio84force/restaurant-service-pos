"use strict";

const bridgeInfo = Object.freeze({
  nome: "Restaurant Service POS RT Bridge",
  versione: "2.13.0"
});

function avvia() {
  console.log(
    "[" + bridgeInfo.nome + "] Avvio versione " +
    bridgeInfo.versione
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
