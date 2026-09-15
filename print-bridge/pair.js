const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const https = require("https");
const crypto = require("crypto");

function argValore(nome) {
  const indice =
    process.argv.indexOf(nome);

  if (
    indice < 0 ||
    indice + 1 >= process.argv.length
  ) {
    return "";
  }

  return String(
    process.argv[indice + 1] || ""
  );
}

function codiceDaArgomenti() {
  return String(
    process.argv
      .slice(2)
      .find(
        (v) =>
          v &&
          !String(v).startsWith("--") &&
          v !== argValore("--server") &&
          v !== argValore("--config")
      ) || ""
  ).trim();
}

function richiestaPairing(
  serverUrl,
  dati
) {
  return new Promise(
    (resolve, reject) => {
      const url =
        new URL(
          "/api/print-bridge/pair",
          serverUrl
        );

      const modulo =
        url.protocol === "https:"
          ? https
          : http;

      const contenuto =
        JSON.stringify(dati);

      const req =
        modulo.request(
          url,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              "Content-Length":
                Buffer.byteLength(
                  contenuto
                )
            }
          },
          (res) => {
            let testo = "";

            res.setEncoding("utf8");

            res.on(
              "data",
              (chunk) => {
                testo += chunk;
              }
            );

            res.on(
              "end",
              () => {
                let json = null;

                try {
                  json =
                    JSON.parse(testo);
                } catch (_) {}

                resolve({
                  status:
                    res.statusCode,
                  json,
                  testo
                });
              }
            );
          }
        );

      req.on(
        "error",
        reject
      );

      req.write(contenuto);
      req.end();
    }
  );
}

function configEsistente(file) {
  if (!fs.existsSync(file)) {
    return {};
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        file,
        "utf8"
      )
    ) || {};
  } catch (_) {
    return {};
  }
}

function bridgeIdDefault() {
  return (
    "rsp-" +
    crypto
      .createHash("sha256")
      .update(os.hostname())
      .digest("hex")
      .slice(0, 12)
  );
}

function salvaConfig(
  file,
  config
) {
  const cartella =
    path.dirname(file);

  fs.mkdirSync(
    cartella,
    {
      recursive: true,
      mode: 0o700
    }
  );

  fs.chmodSync(
    cartella,
    0o700
  );

  if (fs.existsSync(file)) {
    const backup =
      file +
      ".bak-" +
      Date.now();

    fs.copyFileSync(
      file,
      backup
    );

    fs.chmodSync(
      backup,
      0o600
    );

    console.log(
      "Backup configurazione precedente:",
      backup
    );
  }

  const temporaneo =
    file +
    ".tmp-" +
    process.pid;

  fs.writeFileSync(
    temporaneo,
    JSON.stringify(
      config,
      null,
      2
    ) + "\n",
    {
      encoding: "utf8",
      mode: 0o600
    }
  );

  fs.chmodSync(
    temporaneo,
    0o600
  );

  fs.renameSync(
    temporaneo,
    file
  );

  fs.chmodSync(
    file,
    0o600
  );
}

async function main() {
  const codice =
    codiceDaArgomenti();

  if (!codice) {
    throw new Error(
      "Codice pairing mancante. " +
      "Uso: node print-bridge/pair.js ABCDE-FGHIJ"
    );
  }

  const configFile =
    argValore("--config") ||
    process.env
      .RSP_PRINT_BRIDGE_CONFIG ||
    path.join(
      os.homedir(),
      ".rsp-print-bridge",
      "config.json"
    );

  const precedente =
    configEsistente(
      configFile
    );

  const serverUrl =
    argValore("--server") ||
    process.env
      .RSP_PRINT_BRIDGE_SERVER_URL ||
    precedente.server_url ||
    "https://restaurantservicepos.com";

  const bridgeId =
    precedente.bridge_id ||
    bridgeIdDefault();

  const bridgeNome =
    precedente.bridge_nome ||
    os.hostname();

  const bridgeVersion =
    "2.14.0";

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "RSP PRINT BRIDGE - COLLEGAMENTO"
  );
  console.log(
    "========================================"
  );
  console.log(
    "Server:",
    serverUrl
  );
  console.log(
    "Bridge:",
    bridgeId
  );
  console.log(
    "Codice: ricevuto"
  );
  console.log(
    "Token: non verra mostrato"
  );

  const risposta =
    await richiestaPairing(
      serverUrl,
      {
        codice,
        bridge_id:
          bridgeId,
        bridge_nome:
          bridgeNome,
        bridge_version:
          bridgeVersion
      }
    );

  if (
    risposta.status !== 200 ||
    !risposta.json ||
    risposta.json.ok !== true ||
    !risposta.json.token
  ) {
    throw new Error(
      "Pairing fallito: HTTP " +
      risposta.status +
      " " +
      (
        risposta.json &&
        risposta.json.error
          ? risposta.json.error
          : risposta.testo
      )
    );
  }

  salvaConfig(
    configFile,
    {
      server_url:
        serverUrl,
      token:
        risposta.json.token,
      bridge_id:
        bridgeId,
      bridge_nome:
        bridgeNome,
      bridge_version:
        bridgeVersion,
      restaurante_id:
        Number(
          risposta.json
            .restaurante_id
        )
    }
  );

  console.log("");
  console.log(
    "PAIRING: OK"
  );
  console.log(
    "Ristorante:",
    risposta.json.restaurante_id
  );
  console.log(
    "Configurazione:",
    configFile
  );
  console.log(
    "Token salvato in modo sicuro e NON mostrato."
  );
}

main().catch((err) => {
  console.error("");
  console.error(
    "ERRORE:",
    err.message
  );

  process.exitCode = 1;
});
