const {
  execFileSync,
  spawnSync
} = require("child_process");

const fs = require("fs");
const os = require("os");
const path = require("path");

const sorgente = path.join(
  __dirname,
  "native",
  "macosUsbEscpos.c"
);

const directoryBin = path.join(
  os.homedir(),
  ".rsp-print-bridge",
  "bin"
);

const binario = path.join(
  directoryBin,
  "rsp-macos-usb-escpos"
);

function deveCompilare() {
  if (!fs.existsSync(binario)) {
    return true;
  }

  if (!fs.existsSync(sorgente)) {
    throw new Error(
      "Sorgente helper USB macOS non trovato: " +
      sorgente
    );
  }

  const statSorgente =
    fs.statSync(sorgente);

  const statBinario =
    fs.statSync(binario);

  return (
    statSorgente.mtimeMs >
    statBinario.mtimeMs
  );
}

function assicuraHelper() {
  if (os.platform() !== "darwin") {
    throw new Error(
      "Helper USB ESC/POS disponibile solo su macOS"
    );
  }

  if (!fs.existsSync(sorgente)) {
    throw new Error(
      "Sorgente helper USB macOS non trovato"
    );
  }

  fs.mkdirSync(
    directoryBin,
    {
      recursive: true,
      mode: 0o700
    }
  );

  try {
    fs.chmodSync(
      directoryBin,
      0o700
    );
  } catch (_) {}

  if (deveCompilare()) {
    execFileSync(
      "/usr/bin/clang",
      [
        "-Wall",
        "-framework",
        "IOKit",
        "-framework",
        "CoreFoundation",
        sorgente,
        "-o",
        binario
      ],
      {
        encoding: "utf8",
        stdio: [
          "ignore",
          "pipe",
          "pipe"
        ]
      }
    );

    fs.chmodSync(
      binario,
      0o700
    );
  }

  return binario;
}

function elencaUsbEscposMacOS() {
  if (os.platform() !== "darwin") {
    return [];
  }

  let helper;

  try {
    helper =
      assicuraHelper();
  } catch (_) {
    return [];
  }

  let output = "";

  try {
    output =
      execFileSync(
        helper,
        ["--list"],
        {
          encoding: "utf8",
          stdio: [
            "ignore",
            "pipe",
            "pipe"
          ]
        }
      );
  } catch (_) {
    return [];
  }

  return String(output || "")
    .split(/\r?\n/)
    .map(
      (riga) =>
        riga.trim()
    )
    .filter(Boolean)
    .map((riga) => {
      const campi =
        riga.split("\t");

      if (
        campi.length !== 8 ||
        campi[0] !== "EPSON_POS"
      ) {
        return null;
      }

      const nome =
        String(campi[1] || "")
          .trim();

      const vendorId =
        String(campi[2] || "")
          .trim()
          .toLowerCase();

      const productId =
        String(campi[3] || "")
          .trim()
          .toLowerCase();

      const seriale =
        String(campi[4] || "")
          .trim();

      const interfaccia =
        Number(campi[5]);

      const pipeOut =
        Number(campi[6]);

      const pipeIn =
        Number(campi[7]);

      if (
        !nome ||
        !vendorId ||
        !productId ||
        !Number.isInteger(interfaccia) ||
        !Number.isInteger(pipeOut) ||
        pipeOut <= 0
      ) {
        return null;
      }

      return {
        nome: nome,
        vendor_id: vendorId,
        product_id: productId,
        seriale: seriale,
        interfaccia: interfaccia,
        pipe_out: pipeOut,
        pipe_in:
          Number.isInteger(pipeIn)
            ? pipeIn
            : 0
      };
    })
    .filter(Boolean);
}


function inviaUsbEscposMacOS(
  dispositivo,
  dati,
  opzioni
) {
  if (os.platform() !== "darwin") {
    throw new Error(
      "Stampa USB ESC/POS disponibile solo su macOS"
    );
  }

  if (!dispositivo) {
    throw new Error(
      "Dispositivo USB ESC/POS mancante"
    );
  }

  const buffer =
    Buffer.isBuffer(dati)
      ? dati
      : Buffer.from(dati || "");

  if (!buffer.length) {
    throw new Error(
      "Contenuto USB vuoto"
    );
  }

  const vendorId =
    String(
      dispositivo.vendor_id || ""
    ).trim();

  const productId =
    String(
      dispositivo.product_id || ""
    ).trim();

  const seriale =
    String(
      dispositivo.seriale || ""
    ).trim();

  const interfaccia =
    Number(
      dispositivo.interfaccia
    );

  if (
    !vendorId ||
    !productId ||
    !Number.isInteger(interfaccia)
  ) {
    throw new Error(
      "Identificazione stampante USB incompleta"
    );
  }

  const helper =
    assicuraHelper();

  const timeoutMs =
    Number(
      opzioni &&
      opzioni.timeoutMs
    ) || 15000;

  const risultato =
    spawnSync(
      helper,
      [
        "--write",
        vendorId,
        productId,
        seriale,
        String(interfaccia)
      ],
      {
        input: buffer,
        encoding: "utf8",
        timeout: timeoutMs,
        maxBuffer:
          1024 * 1024
      }
    );

  if (risultato.error) {
    throw risultato.error;
  }

  if (risultato.status !== 0) {
    const dettaglio =
      String(
        risultato.stderr ||
        risultato.stdout ||
        ""
      ).trim();

    throw new Error(
      "Invio USB ESC/POS fallito" +
      (
        dettaglio
          ? ": " + dettaglio
          : " (codice " +
            risultato.status +
            ")"
      )
    );
  }

  return {
    ok: true,
    stdout:
      String(
        risultato.stdout || ""
      ).trim()
  };
}

module.exports = {
  assicuraHelper,
  elencaUsbEscposMacOS,
  inviaUsbEscposMacOS
};
