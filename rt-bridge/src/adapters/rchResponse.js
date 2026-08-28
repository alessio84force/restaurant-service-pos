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

module.exports = {
  interpretaRisposta
};
