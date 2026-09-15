const fs = require("fs");
const os = require("os");
const path = require("path");

function cartellaDefault() {
  return path.join(
    os.homedir(),
    ".rsp-print-bridge"
  );
}

function percorsoStato() {

  const esplicito =
    String(
      process.env
        .RSP_PRINT_BRIDGE_STATE ||
      ""
    ).trim();

  if (esplicito) {
    return esplicito;
  }

  const configPersonalizzata =
    String(
      process.env
        .RSP_PRINT_BRIDGE_CONFIG ||
      ""
    ).trim();

  if (configPersonalizzata) {
    return path.join(
      path.dirname(
        configPersonalizzata
      ),
      "stato.json"
    );
  }

  return path.join(
    cartellaDefault(),
    "stato.json"
  );
}

function preparaCartella(file) {
  const cartella =
    path.dirname(file);

  if (!fs.existsSync(cartella)) {
    fs.mkdirSync(
      cartella,
      {
        recursive: true,
        mode: 0o700
      }
    );
  }

  if (
    cartella ===
    cartellaDefault()
  ) {
    try {
      fs.chmodSync(
        cartella,
        0o700
      );
    } catch (_) {}
  }
}

function caricaStato() {
  const file =
    percorsoStato();

  if (!fs.existsSync(file)) {
    return null;
  }

  const contenuto =
    fs.readFileSync(
      file,
      "utf8"
    );

  const stato =
    JSON.parse(contenuto);

  if (
    !stato ||
    !stato.stato ||
    !stato.lavoro_id
  ) {
    throw new Error(
      "Stato locale Print Bridge non valido"
    );
  }

  return stato;
}

function salvaStato(stato) {
  if (
    !stato ||
    !stato.stato ||
    !stato.lavoro_id
  ) {
    throw new Error(
      "Stato locale Print Bridge incompleto"
    );
  }

  const file =
    percorsoStato();

  preparaCartella(file);

  const temporaneo =
    file + ".tmp";

  const dati =
    Object.assign(
      {},
      stato,
      {
        aggiornato_en:
          new Date()
            .toISOString()
      }
    );

  fs.writeFileSync(
    temporaneo,
    JSON.stringify(
      dati,
      null,
      2
    ) + "\n",
    {
      encoding: "utf8",
      mode: 0o600
    }
  );

  fs.renameSync(
    temporaneo,
    file
  );

  try {
    fs.chmodSync(
      file,
      0o600
    );
  } catch (_) {}

  return dati;
}

function cancellaStato() {
  const file =
    percorsoStato();

  try {
    fs.unlinkSync(file);
  } catch (err) {
    if (
      err &&
      err.code !== "ENOENT"
    ) {
      throw err;
    }
  }
}

module.exports = {
  percorsoStato,
  caricaStato,
  salvaStato,
  cancellaStato
};
