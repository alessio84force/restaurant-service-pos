const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const {
  execFileSync
} = require("child_process");

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

function percorsoCache() {

  return path.join(
    directoryBridge(),
    "stampanti-rete.json"
  );
}

function ipPrivato(ip) {

  const parti =
    String(ip || "")
      .split(".")
      .map(Number);

  if (
    parti.length !== 4 ||
    parti.some(
      (n) =>
        !Number.isInteger(n) ||
        n < 0 ||
        n > 255
    )
  ) {
    return false;
  }

  if (parti[0] === 10) {
    return true;
  }

  if (
    parti[0] === 172 &&
    parti[1] >= 16 &&
    parti[1] <= 31
  ) {
    return true;
  }

  if (
    parti[0] === 192 &&
    parti[1] === 168
  ) {
    return true;
  }

  return false;
}

function interfacciaDefaultMacOS() {

  if (os.platform() !== "darwin") {
    return "";
  }

  try {

    const output =
      execFileSync(
        "/sbin/route",
        [
          "-n",
          "get",
          "default"
        ],
        {
          encoding: "utf8",
          stdio: [
            "ignore",
            "pipe",
            "ignore"
          ]
        }
      );

    const match =
      output.match(
        /^\s*interface:\s*(\S+)/m
      );

    return match
      ? match[1]
      : "";

  } catch (_) {

    return "";

  }
}

function trovaReteLocale() {

  const interfacce =
    os.networkInterfaces();

  const preferita =
    interfacciaDefaultMacOS();

  const nomi =
    preferita
      ? [
          preferita,
          ...Object.keys(
            interfacce
          ).filter(
            (n) =>
              n !== preferita
          )
        ]
      : Object.keys(
          interfacce
        );

  for (
    const nome of nomi
  ) {

    const indirizzi =
      interfacce[nome] || [];

    for (
      const info of indirizzi
    ) {

      if (
        info.family !== "IPv4" ||
        info.internal ||
        !ipPrivato(
          info.address
        )
      ) {
        continue;
      }

      return {
        interfaccia:
          nome,

        ip:
          info.address,

        netmask:
          info.netmask ||
          ""
      };
    }
  }

  return null;
}

function provaPorta(
  host,
  porta,
  timeoutMs
) {

  return new Promise(
    (resolve) => {

      const socket =
        new net.Socket();

      let concluso =
        false;

      function fine(aperta) {

        if (concluso) {
          return;
        }

        concluso =
          true;

        try {
          socket.destroy();
        } catch (_) {}

        resolve(
          aperta
        );
      }

      socket.setTimeout(
        timeoutMs
      );

      socket.once(
        "connect",
        () => fine(true)
      );

      socket.once(
        "timeout",
        () => fine(false)
      );

      socket.once(
        "error",
        () => fine(false)
      );

      socket.connect(
        porta,
        host
      );
    }
  );
}

async function scansionaTcp9100(
  opzioni
) {

  const rete =
    trovaReteLocale();

  if (!rete) {

    return {
      rete: null,
      stampanti: []
    };
  }

  const timeoutMs =
    Math.max(
      100,
      Math.min(
        2000,
        Number(
          opzioni &&
          opzioni.timeoutMs
        ) || 250
      )
    );

  const concorrenza =
    Math.max(
      1,
      Math.min(
        64,
        Number(
          opzioni &&
          opzioni.concorrenza
        ) || 24
      )
    );

  /*
   * Per sicurezza limitiamo la
   * discovery automatica alla /24
   * dell'indirizzo locale.
   *
   * Evitiamo scansioni enormi su
   * reti aziendali, VPN o subnet
   * molto grandi.
   */
  const parti =
    rete.ip.split(".");

  const prefisso =
    parti
      .slice(0, 3)
      .join(".");

  const indirizzi = [];

  for (
    let ultimo = 1;
    ultimo <= 254;
    ultimo++
  ) {

    const host =
      prefisso +
      "." +
      ultimo;

    if (
      host !== rete.ip
    ) {
      indirizzi.push(
        host
      );
    }
  }

  const trovati = [];

  let indice = 0;

  async function worker() {

    while (
      indice <
      indirizzi.length
    ) {

      const posizione =
        indice++;

      const host =
        indirizzi[
          posizione
        ];

      const aperta =
        await provaPorta(
          host,
          9100,
          timeoutMs
        );

      if (aperta) {

        trovati.push({
          host:
            host,

          port:
            9100,

          nome:
            "Dispositivo POS rete " +
            host,

          compatibilita:
            "da_verificare"
        });
      }
    }
  }

  const workers = [];

  for (
    let i = 0;
    i < concorrenza;
    i++
  ) {
    workers.push(
      worker()
    );
  }

  await Promise.all(
    workers
  );

  trovati.sort(
    (a, b) =>
      a.host.localeCompare(
        b.host,
        undefined,
        {
          numeric: true
        }
      )
  );

  return {
    rete:
      rete,
    stampanti:
      trovati
  };
}

function salvaCache(
  risultato
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
    percorsoCache();

  const dati = {
    aggiornato_en:
      new Date()
        .toISOString(),

    rete:
      risultato &&
      risultato.rete
        ? risultato.rete
        : null,

    stampanti:
      risultato &&
      Array.isArray(
        risultato.stampanti
      )
        ? risultato.stampanti
        : []
  };

  const temporaneo =
    file +
    ".tmp-" +
    process.pid;

  fs.writeFileSync(
    temporaneo,
    JSON.stringify(
      dati,
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

  return dati;
}

function leggiCacheReteEscpos() {

  const file =
    percorsoCache();

  if (!fs.existsSync(file)) {
    return [];
  }

  try {

    const dati =
      JSON.parse(
        fs.readFileSync(
          file,
          "utf8"
        )
      );

    return Array.isArray(
      dati.stampanti
    )
      ? dati.stampanti
      : [];

  } catch (_) {

    return [];

  }
}

async function aggiornaCacheReteEscpos(
  opzioni
) {

  const risultato =
    await scansionaTcp9100(
      opzioni
    );

  salvaCache(
    risultato
  );

  return risultato;
}

module.exports = {
  percorsoCache,
  trovaReteLocale,
  scansionaTcp9100,
  salvaCache,
  leggiCacheReteEscpos,
  aggiornaCacheReteEscpos
};
