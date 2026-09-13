const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  ping,
  heartbeat,
  claim
} = require("./clientApi");

function caricaConfig() {
  const file =
    process.env
      .RSP_PRINT_BRIDGE_CONFIG ||
    path.join(
      os.homedir(),
      ".rsp-print-bridge",
      "config.json"
    );

  if (!fs.existsSync(file)) {
    throw new Error(
      "Configurazione Print Bridge non trovata: " +
      file
    );
  }

  const config =
    JSON.parse(
      fs.readFileSync(
        file,
        "utf8"
      )
    );

  if (!config.server_url) {
    throw new Error(
      "server_url mancante"
    );
  }

  if (!config.token) {
    throw new Error(
      "token mancante"
    );
  }

  if (!config.bridge_id) {
    throw new Error(
      "bridge_id mancante"
    );
  }

  return config;
}

async function main() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "RSP PRINT BRIDGE - TEST CLIENT"
  );
  console.log(
    "========================================"
  );

  const config =
    caricaConfig();

  console.log("");
  console.log(
    "CONFIGURAZIONE: OK"
  );

  console.log(
    "Server:",
    config.server_url
  );

  console.log(
    "Bridge:",
    config.bridge_id
  );

  console.log(
    "Token: caricato in modo sicuro"
  );

  console.log("");
  console.log(
    "PING SERVER..."
  );

  const rispostaPing =
    await ping(config);

  if (
    rispostaPing.status !== 200 ||
    !rispostaPing.json ||
    rispostaPing.json.ok !== true
  ) {
    throw new Error(
      "PING fallito: HTTP " +
      rispostaPing.status +
      " " +
      rispostaPing.testo
    );
  }

  console.log(
    "PING: OK - ristorante",
    rispostaPing.json
      .restaurante_id
  );

  console.log("");
  console.log(
    "HEARTBEAT..."
  );

  const rispostaHeartbeat =
    await heartbeat(config);

  if (
    rispostaHeartbeat.status !==
      200 ||
    !rispostaHeartbeat.json ||
    rispostaHeartbeat.json.ok !==
      true
  ) {
    throw new Error(
      "HEARTBEAT fallito: HTTP " +
      rispostaHeartbeat.status +
      " " +
      rispostaHeartbeat.testo
    );
  }

  console.log(
    "HEARTBEAT: OK"
  );

  console.log("");
  console.log(
    "RICERCA LAVORO..."
  );

  const rispostaClaim =
    await claim(config);

  if (
    rispostaClaim.status !== 200 ||
    !rispostaClaim.json ||
    rispostaClaim.json.ok !== true
  ) {
    throw new Error(
      "CLAIM fallito: HTTP " +
      rispostaClaim.status +
      " " +
      rispostaClaim.testo
    );
  }

  if (
    rispostaClaim.json.lavoro
  ) {
    console.log(
      "CLAIM: lavoro ricevuto"
    );

    console.log(
      "ID:",
      rispostaClaim.json
        .lavoro.id
    );

    console.log(
      "Destinazione:",
      rispostaClaim.json
        .lavoro.destino
    );
  } else {
    console.log(
      "CLAIM: OK - nessun lavoro in coda"
    );
  }

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "CLIENT PRINT BRIDGE: CONNESSIONE OK"
  );
  console.log(
    "========================================"
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
