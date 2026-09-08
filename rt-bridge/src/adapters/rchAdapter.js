"use strict";

const {
  creaServiceXml
} = require("./rchXml");

const {
  richiestaStato,
  richiestaConfigurazione
} = require("./rchCommands");

const {
  interpretaRisposta,
  verificaDocumentoCompletato
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

  async function emitir(
    documento,
    contextoAdapter
  ) {
    let invioFiscaleAvviato = false;

    try {
      const risultatoConfigurazione =
        await leggiConfigurazione();

      if (
        !risultatoConfigurazione.stato.ok ||
        !risultatoConfigurazione.configurazione
      ) {
        throw new Error(
          "Configurazione RCH non disponibile"
        );
      }

      const preparato =
        preparaDocumento(
          documento,
          contextoAdapter,
          risultatoConfigurazione.configurazione
        );

      /*
       * Da questo punto il documento fiscale
       * puo essere arrivato al registratore.
       * Qualunque errore successivo deve essere
       * trattato come esito potenzialmente incerto.
       */
      invioFiscaleAvviato = true;

      const rispostaHttp =
        await inviaXml(
          configurazione,
          preparato.xml
        );

      const stato =
        interpretaRisposta(
          rispostaHttp.body
        );

      verificaDocumentoCompletato(
        stato,
        preparato.comandi.length
      );

      return {
        ok: true,
        fabricante: "RCH",
        http_status:
          rispostaHttp.statusCode,
        stato: stato,
        comandi:
          preparato.comandi,
        xml_richiesta:
          preparato.xml,
        xml_risposta:
          rispostaHttp.body
      };
    } catch (err) {
      if (
        err &&
        typeof err === "object"
      ) {
        err.rt_invio_avviato =
          invioFiscaleAvviato;
      }

      throw err;
    }
  }

  return Object.freeze({
    nome: "rch",
    fabricante: "RCH",
    leggiStato,
    leggiConfigurazione,
    preparaDocumento,
    emitir
  });
}

module.exports = {
  creaAdapterRch
};
