"use strict";

function testoTag(xml, nome) {
  const regex = new RegExp(
    "<" + nome + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + nome + ">",
    "i"
  );

  const match = regex.exec(xml);

  if (!match) {
    return null;
  }

  return String(match[1]).trim();
}

function valoreNodo(xml, nome) {
  const blocco = testoTag(
    xml,
    nome
  );

  if (blocco == null) {
    return null;
  }

  return testoTag(
    blocco,
    "value"
  );
}

function enabledNodo(xml, nome) {
  const blocco = testoTag(
    xml,
    nome
  );

  if (blocco == null) {
    return null;
  }

  const valore = testoTag(
    blocco,
    "enabled"
  );

  if (valore == null) {
    return null;
  }

  if (valore === "1") {
    return true;
  }

  if (valore === "0") {
    return false;
  }

  return null;
}

function blocchiConId(xml, nome) {
  const regex = new RegExp(
    "<" +
      nome +
      "\\s+id=[\"'](\\d+)[\"'][^>]*>" +
      "([\\s\\S]*?)</" +
      nome +
      ">",
    "gi"
  );

  const risultati = [];
  let match;

  while ((match = regex.exec(xml))) {
    risultati.push({
      id: Number(match[1]),
      xml: match[2]
    });
  }

  return risultati;
}

function interpretaConfigurazione(xml) {
  if (
    typeof xml !== "string" ||
    xml.trim() === ""
  ) {
    throw new Error(
      "Configurazione XML RCH mancante"
    );
  }

  const prg =
    testoTag(xml, "Prg");

  if (prg == null) {
    throw new Error(
      "Risposta RCH senza blocco Prg"
    );
  }

  const reparti =
    blocchiConId(
      prg,
      "Department"
    ).map(function (blocco) {
      return {
        id: blocco.id,
        nome:
          testoTag(
            blocco.xml,
            "txt"
          ),
        vat_code:
          valoreNodo(
            blocco.xml,
            "vatCode"
          ),
        group_code:
          valoreNodo(
            blocco.xml,
            "groupCode"
          )
      };
    });

  const aliquote =
    blocchiConId(
      prg,
      "VAT"
    ).map(function (blocco) {
      const valore =
        testoTag(
          blocco.xml,
          "value"
        );

      return {
        id: blocco.id,
        percentuale:
          valore == null
            ? null
            : Number(valore)
      };
    });

  const pagamenti =
    blocchiConId(
      prg,
      "Payment"
    ).map(function (blocco) {
      return {
        id: blocco.id,
        nome:
          testoTag(
            blocco.xml,
            "txt"
          ),
        resto:
          enabledNodo(
            blocco.xml,
            "change"
          ),
        cassa:
          enabledNodo(
            blocco.xml,
            "cash"
          ),
        credito:
          enabledNodo(
            blocco.xml,
            "credit"
          ),
        cassetto:
          enabledNodo(
            blocco.xml,
            "drawer"
          )
      };
    });

  return {
    reparti:
      reparti,
    aliquote:
      aliquote,
    pagamenti:
      pagamenti
  };
}

module.exports = {
  interpretaConfigurazione
};
