"use strict";

function testoTag(xml, nome) {
  const regex = new RegExp(
    "<" + nome + ">([\\s\\S]*?)</" + nome + ">",
    "i"
  );

  const match = regex.exec(xml);

  if (!match) {
    return null;
  }

  return String(match[1]).trim();
}

function numeroTag(xml, nome) {
  const testo = testoTag(xml, nome);

  if (testo == null || testo === "") {
    return null;
  }

  const numero = Number(testo);

  if (!Number.isFinite(numero)) {
    throw new Error(
      "Valore RCH non valido per " + nome
    );
  }

  return numero;
}

function interpretaRisposta(xml) {
  if (
    typeof xml !== "string" ||
    xml.trim() === ""
  ) {
    throw new Error(
      "Risposta XML RCH mancante"
    );
  }

  if (
    !/<Service(?:\s|>)/i.test(xml) ||
    !/<Request(?:\s|>)/i.test(xml)
  ) {
    throw new Error(
      "Risposta XML RCH non riconosciuta"
    );
  }

  const risultato = {
    errorCode:
      numeroTag(xml, "errorCode"),

    printerError:
      numeroTag(xml, "printerError"),

    paperEnd:
      numeroTag(xml, "paperEnd"),

    coverOpen:
      numeroTag(xml, "coverOpen"),

    lastCmd:
      numeroTag(xml, "lastCmd"),

    mode:
      testoTag(xml, "mode"),

    idleState:
      numeroTag(xml, "idleState"),

    lastZ:
      numeroTag(xml, "lastZ"),

    lastDocF:
      numeroTag(xml, "lastDocF"),

    lastDocNF:
      numeroTag(xml, "lastDocNF"),

    lastCreditNoteN:
      numeroTag(
        xml,
        "lastCreditNoteN"
      ),

    lastInvoiceN:
      numeroTag(
        xml,
        "lastInvoiceN"
      ),

    busy:
      numeroTag(xml, "busy")
  };

  if (risultato.errorCode == null) {
    throw new Error(
      "Risposta RCH senza errorCode"
    );
  }

  risultato.ok =
    risultato.errorCode === 0 &&
    risultato.printerError !== 1 &&
    risultato.paperEnd !== 1 &&
    risultato.coverOpen !== 1;

  return risultato;
}

function verificaDocumentoCompletato(
  risultato,
  numeroComandi
) {
  if (
    !risultato ||
    typeof risultato !== "object"
  ) {
    throw new Error(
      "Esito documento RCH mancante"
    );
  }

  if (
    !Number.isInteger(numeroComandi) ||
    numeroComandi <= 0
  ) {
    throw new Error(
      "Numero comandi RCH non valido"
    );
  }

  if (risultato.errorCode !== 0) {
    throw new Error(
      "Errore RCH durante emissione: errorCode " +
      risultato.errorCode
    );
  }

  if (risultato.printerError !== 0) {
    throw new Error(
      "Errore stampante RCH durante emissione"
    );
  }

  if (risultato.paperEnd !== 0) {
    throw new Error(
      "Carta RCH terminata durante emissione"
    );
  }

  if (risultato.coverOpen !== 0) {
    throw new Error(
      "Coperchio RCH aperto durante emissione"
    );
  }

  if (risultato.lastCmd !== numeroComandi) {
    throw new Error(
      "Documento RCH non completato: lastCmd " +
      risultato.lastCmd +
      " di " +
      numeroComandi
    );
  }

  if (risultato.idleState !== 0) {
    throw new Error(
      "Documento RCH non chiuso: idleState " +
      risultato.idleState
    );
  }

  if (risultato.busy !== 0) {
    throw new Error(
      "RCH occupato dopo emissione: busy " +
      risultato.busy
    );
  }

  return true;
}

module.exports = {
  interpretaRisposta,
  verificaDocumentoCompletato
};
