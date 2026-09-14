const { execFileSync } = require("child_process");
const crypto = require("crypto");
const os = require("os");

const {
  elencaUsbEscposMacOS
} = require("./usbEscposMac");

function esegui(comando, args) {
  try {
    return execFileSync(
      comando,
      args || [],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      }
    ).trim();
  } catch (err) {
    return "";
  }
}

function creaIdStabile(nome, uri) {
  return crypto
    .createHash("sha256")
    .update(
      String(nome || "") +
      "|" +
      String(uri || "")
    )
    .digest("hex")
    .slice(0, 16);
}

function tipoConnessione(uri) {
  const valore =
    String(uri || "")
      .trim()
      .toLowerCase();

  if (
    valore.startsWith("usb:") ||
    valore.startsWith("serial:")
  ) {
    return "usb";
  }

  if (
    valore.startsWith("dnssd:") ||
    valore.startsWith("ipp:") ||
    valore.startsWith("ipps:") ||
    valore.startsWith("socket:") ||
    valore.startsWith("lpd:") ||
    valore.startsWith("http:") ||
    valore.startsWith("https:")
  ) {
    return "rete";
  }

  return "sistema";
}

function descrizioneConnessione(tipo, uri) {
  if (tipo === "usb") {
    return "USB";
  }

  if (tipo === "rete") {
    if (
      String(uri || "")
        .toLowerCase()
        .startsWith("dnssd:")
    ) {
      return "Rete / Bonjour";
    }

    return "Rete";
  }

  return "Sistema";
}

function stampantiMacOS() {
  const output =
    esegui("/usr/bin/lpstat", ["-v"]);

  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((riga) => riga.trim())
    .filter(Boolean)
    .map((riga) => {
      const separatore =
        riga.indexOf(": ");

      if (separatore === -1) {
        return null;
      }

      const sinistra =
        riga
          .slice(0, separatore)
          .trim();

      const uri =
        riga
          .slice(separatore + 2)
          .trim();

      const parti =
        sinistra.split(/\s+/);

      const nome =
        parti[parti.length - 1] || "";

      if (!nome || !uri) {
        return null;
      }

      const tipo =
        tipoConnessione(uri);

      return {
        id: creaIdStabile(nome, uri),
        nome: nome,
        tipo: tipo,
        connessione:
          descrizioneConnessione(
            tipo,
            uri
          ),
        uri: uri
      };
    })
    .filter(Boolean);
}


function stampantiUsbDiretteMacOS() {
  return elencaUsbEscposMacOS()
    .map((dispositivo) => {
      const identita =
        dispositivo.seriale ||
        (
          "if" +
          dispositivo.interfaccia
        );

      const uri =
        "usb-escpos://" +
        dispositivo.vendor_id +
        "/" +
        dispositivo.product_id +
        "/" +
        encodeURIComponent(
          identita
        );

      return {
        id: creaIdStabile(
          "usb_escpos",
          uri
        ),
        nome:
          dispositivo.nome,
        tipo: "usb",
        connessione:
          "USB diretto / ESC-POS",
        uri: uri,
        trasporto:
          "usb_escpos",
        vendor_id:
          dispositivo.vendor_id,
        product_id:
          dispositivo.product_id,
        seriale:
          dispositivo.seriale,
        interfaccia:
          dispositivo.interfaccia,
        pipe_out:
          dispositivo.pipe_out,
        pipe_in:
          dispositivo.pipe_in
      };
    });
}

function scopriStampanti() {
  const piattaforma =
    os.platform();

  if (piattaforma === "darwin") {
    return stampantiMacOS()
      .concat(
        stampantiUsbDiretteMacOS()
      );
  }

  throw new Error(
    "Sistema operativo non ancora supportato: " +
    piattaforma
  );
}

module.exports = {
  scopriStampanti,
  tipoConnessione
};
