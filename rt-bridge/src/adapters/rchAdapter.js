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
  interpretaConfigurazione
} = require("./rchConfig");

const {
  creaComandiDocumentoRch
} = require("./rchDocumento");

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
    const risultato =
      await eseguiRichiestaSingola(
        richiestaConfigurazione()
      );

    if (!risultato.stato.ok) {
      return Object.assign(
        {},
        risultato,
        {
          configurazione: null
        }
      );
    }

    const configurazioneRch =
      interpretaConfigurazione(
        risultato.xml_risposta
      );

    return Object.assign(
      {},
      risultato,
      {
        configurazione:
          configurazioneRch
      }
    );
  }

  function preparaDocumento(
    documento,
    contextoAdapter,
    configurazioneRch
  ) {
    const comandi =
      creaComandiDocumentoRch(
        documento,
        contextoAdapter,
        configurazioneRch
      );

    const xml =
      creaServiceXml(
        comandi
      );

    return {
      comandi: comandi,
      xml: xml
    };
  }

  return Object.freeze({
    nome: "rch",
    fabricante: "RCH",
    leggiStato,
    leggiConfigurazione,
    preparaDocumento
  });
}

module.exports = {
  creaAdapterRch
};
