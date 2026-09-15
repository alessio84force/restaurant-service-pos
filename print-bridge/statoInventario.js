const fs = require("fs");
const os = require("os");
const path = require("path");

function directoryBridge() {

  const configPersonalizzata =
    String(
      process.env
        .RSP_PRINT_BRIDGE_CONFIG ||
      ""
    ).trim();

  if (configPersonalizzata) {
    return path.dirname(
      path.resolve(
        configPersonalizzata
      )
    );
  }

  return path.join(
    os.homedir(),
    ".rsp-print-bridge"
  );
}

function percorsoStatoInventario() {

  return path.join(
    directoryBridge(),
    "inventario-sync.json"
  );
}

function caricaStatoInventario() {

  const file =
    percorsoStatoInventario();

  if (!fs.existsSync(file)) {
    return null;
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        file,
        "utf8"
      )
    );
  } catch (_) {
    return null;
  }
}

function deveSincronizzare(
  intervalloMs
) {

  const intervallo =
    Math.max(
      10000,
      Number(intervalloMs) ||
      60000
    );

  const stato =
    caricaStatoInventario();

  if (
    !stato ||
    !stato.ultimo_tentativo
  ) {
    return true;
  }

  const ultimo =
    Date.parse(
      stato.ultimo_tentativo
    );

  if (!Number.isFinite(ultimo)) {
    return true;
  }

  return (
    Date.now() - ultimo >=
    intervallo
  );
}

function registraTentativo(
  successo,
  dettaglio
) {

  const directory =
    directoryBridge();

  fs.mkdirSync(
    directory,
    {
      recursive: true,
      mode: 0o700
    }
  );

  try {
    fs.chmodSync(
      directory,
      0o700
    );
  } catch (_) {}

  const file =
    percorsoStatoInventario();

  const precedente =
    caricaStatoInventario() ||
    {};

  const adesso =
    new Date().toISOString();

  const stato = {
    ultimo_tentativo:
      adesso,

    ultimo_successo:
      successo
        ? adesso
        : (
            precedente
              .ultimo_successo ||
            null
          ),

    esito:
      successo
        ? "ok"
        : "errore",

    dettaglio:
      dettaglio
        ? String(dettaglio)
            .slice(0, 500)
        : null
  };

  const temporaneo =
    file +
    ".tmp-" +
    process.pid;

  fs.writeFileSync(
    temporaneo,
    JSON.stringify(
      stato,
      null,
      2
    ),
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

  return stato;
}

module.exports = {
  percorsoStatoInventario,
  caricaStatoInventario,
  deveSincronizzare,
  registraTentativo
};
