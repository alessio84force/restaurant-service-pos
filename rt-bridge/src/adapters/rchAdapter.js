"use strict";

const {
  creaServiceXml
} = require("./rchXml");

const {
  richiestaStato,
  richiestaConfigurazione
} = require("./rchCommands");

const {
  interpretaRisposta
} = require("./rchResponse");

const {
  inviaXml
} = require("../transport/rchHttp");

function creaAdapterRch(configurazione) {
  if (
    !configurazione ||
    typeof configurazione !== "object"
  ) {
    throw new Error(
      "Configurazione adapter RCH mancante"
    );
  }

  async function eseguiRichiestaSingola(
    comando
  ) {
    const xmlRichiesta =
      creaServiceXml([
        comando
      ]);

    const rispostaHttp =
      await inviaXml(
        configurazione,
        xmlRichiesta
      );

    const stato =
      interpretaRisposta(
        rispostaHttp.body
      );

    return {
      http_status:
        rispostaHttp.statusCode,

      stato:
        stato,

      xml_richiesta:
        xmlRichiesta,

      xml_risposta:
        rispostaHttp.body
    };
  }

  async function leggiStato() {
    return eseguiRichiestaSingola(
      richiestaStato()
    );
  }

  async function leggiConfigurazione() {
    return eseguiRichiestaSingola(
      richiestaConfigurazione()
    );
  }

  return Object.freeze({
    nome: "rch",
    fabricante: "RCH",
    leggiStato,
    leggiConfigurazione
  });
}

module.exports = {
  creaAdapterRch
};
