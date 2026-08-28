"use strict";

function interoInIntervallo(
  nome,
  valore,
  minimo,
  massimo
) {
  const numero = Number(valore);

  if (
    !Number.isInteger(numero) ||
    numero < minimo ||
    numero > massimo
  ) {
    throw new Error(
      nome +
      " deve essere un intero tra " +
      minimo +
      " e " +
      massimo
    );
  }

  return numero;
}

function centesimi(valore) {
  const numero = Number(valore);

  if (
    !Number.isInteger(numero) ||
    numero < 0
  ) {
    throw new Error(
      "Importo RCH non valido"
    );
  }

  return numero;
}

function quantita(valore) {
  if (
    valore == null ||
    valore === ""
  ) {
    return "1";
  }

  const testo = String(valore)
    .trim()
    .replace(",", ".");

  if (
    !/^\d+(?:\.\d{1,3})?$/.test(testo) ||
    Number(testo) <= 0
  ) {
    throw new Error(
      "Quantita RCH non valida"
    );
  }

  return testo;
}

function descrizione(valore) {
  if (
    valore == null ||
    String(valore).trim() === ""
  ) {
    return "";
  }

  const testo = String(valore)
    .replace(/\s+/g, " ")
    .trim();

  if (testo.length > 36) {
    throw new Error(
      "Descrizione RCH oltre 36 caratteri"
    );
  }

  return testo;
}

function venditaReparto(opzioni) {
  const dati = opzioni || {};

  const reparto = interoInIntervallo(
    "Reparto RCH",
    dati.reparto,
    1,
    99
  );

  const importo = centesimi(
    dati.importo_centesimi
  );

  const qta = quantita(
    dati.quantita
  );

  const testo = descrizione(
    dati.descrizione
  );

  let comando =
    "=R" +
    reparto +
    "/$" +
    importo;

  if (qta !== "1") {
    comando += "/*" + qta;
  }

  if (testo) {
    comando += "/(" + testo + ")";
  }

  return comando;
}

function pagamento(opzioni) {
  const dati = opzioni || {};

  const numero = interoInIntervallo(
    "Pagamento RCH",
    dati.numero,
    1,
    30
  );

  let comando =
    "=T" +
    numero;

  if (
    dati.importo_centesimi != null
  ) {
    comando +=
      "/$" +
      centesimi(
        dati.importo_centesimi
      );
  }

  return comando;
}

function richiestaStato() {
  return "<</?s";
}

function richiestaConfigurazione() {
  return "<</?C";
}

module.exports = {
  venditaReparto,
  pagamento,
  richiestaStato,
  richiestaConfigurazione
};
