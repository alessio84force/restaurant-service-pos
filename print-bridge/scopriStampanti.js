const { execFileSync } = require("child_process");
const crypto = require("crypto");
const os = require("os");

const {
  elencaUsbEscposMacOS
} = require("./usbEscposMac");

const {
  leggiCacheReteEscpos
} = require("./reteEscpos");

const {
  applicaProfiloStampante
} = require("./profiliStampanti");

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
          dispositivo.compatibilita ===
            "verificata"
            ? "USB diretto / ESC-POS"
            : "USB diretto / ESC-POS - da verificare",

        uri: uri,

        marca:
          dispositivo.marca || "",

        compatibilita:
          dispositivo.compatibilita ||
          "da_verificare",

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


function stampantiWindows() {

  const comando = [
    '[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false);',
    '$OutputEncoding = [Console]::OutputEncoding;',
    'Get-CimInstance Win32_Printer |',
    'Select-Object Name,PortName,DriverName,WorkOffline |',
    'ConvertTo-Json -Compress'
  ].join(" ");

  const output =
    esegui(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        comando
      ]
    );

  if (!output) {
    return [];
  }

  let dati;

  try {
    dati =
      JSON.parse(output);
  } catch (_) {
    return [];
  }

  const elenco =
    Array.isArray(dati)
      ? dati
      : [dati];

  return elenco
    .map((dispositivo) => {

      const nome =
        String(
          dispositivo.Name || ""
        ).trim();

      const porta =
        String(
          dispositivo.PortName || ""
        ).trim();

      if (!nome) {
        return null;
      }

      if (
        /Microsoft Print to PDF/i.test(nome) ||
        /Microsoft XPS Document Writer/i.test(nome) ||
        /OneNote/i.test(nome) ||
        /^Fax$/i.test(nome)
      ) {
        return null;
      }

      let tipo =
        "sistema";

      if (
        /^(USB|DOT4)/i.test(porta)
      ) {
        tipo =
          "usb";
      } else if (
        /^(IP_|WSD-)/i.test(porta) ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(porta)
      ) {
        tipo =
          "rete";
      }

      const uri =
        "winspool://" +
        encodeURIComponent(nome) +
        "?port=" +
        encodeURIComponent(porta);

      return {
        id:
          creaIdStabile(
            nome,
            uri
          ),

        nome:
          nome,

        tipo:
          tipo,

        connessione:
          tipo === "usb"
            ? "Windows / USB"
            : (
                tipo === "rete"
                  ? "Windows / rete"
                  : "Windows / spooler"
              ),

        uri:
          uri,

        trasporto:
          "winspool_raw",

        porta_sistema:
          porta,

        driver_sistema:
          String(
            dispositivo.DriverName || ""
          ),

        compatibilita:
          "da_verificare",

        profilo:
          "generic_escpos"
      };
    })
    .filter(Boolean);
}

function stampantiReteDiretteCache() {

  return leggiCacheReteEscpos()
    .map((dispositivo) => {

      const host =
        String(
          dispositivo.host ||
          ""
        ).trim();

      const port =
        Number(
          dispositivo.port ||
          9100
        );

      if (
        !host ||
        !Number.isInteger(port) ||
        port <= 0 ||
        port > 65535
      ) {
        return null;
      }

      const uri =
        "tcp-escpos://" +
        host +
        ":" +
        port;

      return {
        id:
          creaIdStabile(
            "tcp_escpos",
            uri
          ),

        nome:
          dispositivo.nome ||
          (
            "Dispositivo POS rete " +
            host
          ),

        tipo:
          "rete",

        connessione:
          "Rete / TCP 9100 - da verificare",

        uri:
          uri,

        trasporto:
          "tcp_escpos",

        host:
          host,

        port:
          port,

        marca:
          dispositivo.marca ||
          "",

        compatibilita:
          "da_verificare"
      };
    })
    .filter(Boolean);
}

function scopriStampanti() {
  const piattaforma =
    os.platform();

  if (piattaforma === "darwin") {
    return stampantiMacOS()
      .concat(
        stampantiUsbDiretteMacOS()
      )
      .concat(
        stampantiReteDiretteCache()
      )
      .map(
        applicaProfiloStampante
      );
  }

  if (piattaforma === "win32") {
    return stampantiWindows()
      .concat(
        stampantiReteDiretteCache()
      )
      .map(
        applicaProfiloStampante
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
