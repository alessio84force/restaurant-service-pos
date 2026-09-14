const {
  spawn
} = require("child_process");

const path = require("path");

const worker =
  path.join(
    __dirname,
    "worker.js"
  );

const intervalloMs =
  Math.max(
    1000,
    Number(
      process.env
        .RSP_PRINT_BRIDGE_INTERVAL_MS
    ) || 3000
  );

let fermando = false;
let processoAttivo = null;

function ora() {
  return new Date()
    .toISOString();
}

function aspetta(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  );
}

function eseguiWorker() {
  return new Promise(
    (resolve) => {
      if (fermando) {
        resolve();
        return;
      }

      processoAttivo =
        spawn(
          process.execPath,
          [worker],
          {
            stdio: "inherit",
            env:
              process.env
          }
        );

      processoAttivo.on(
        "error",
        (err) => {
          console.error(
            "",
            "[" + ora() + "]",
            "Errore avvio worker:",
            err.message
          );

          processoAttivo = null;

          resolve();
        }
      );

      processoAttivo.on(
        "exit",
        (codice, segnale) => {
          if (
            codice &&
            codice !== 0
          ) {
            console.log(
              "",
              "[" + ora() + "]",
              "Worker terminato con codice",
              codice
            );
          }

          if (segnale) {
            console.log(
              "",
              "[" + ora() + "]",
              "Worker terminato con segnale",
              segnale
            );
          }

          processoAttivo = null;

          resolve();
        }
      );
    }
  );
}

async function ciclo() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "RSP PRINT BRIDGE - SERVIZIO"
  );
  console.log(
    "========================================"
  );
  console.log(
    "Intervallo:",
    intervalloMs + " ms"
  );
  console.log(
    "Worker:",
    worker
  );

  while (!fermando) {
    await eseguiWorker();

    if (fermando) {
      break;
    }

    await aspetta(
      intervalloMs
    );
  }

  console.log("");
  console.log(
    "RSP PRINT BRIDGE - servizio arrestato"
  );
}

function arresta(segnale) {
  if (fermando) {
    return;
  }

  fermando = true;

  console.log("");
  console.log(
    "Ricevuto",
    segnale,
    "- arresto sicuro..."
  );

  if (processoAttivo) {
    processoAttivo.kill(
      "SIGTERM"
    );
  }
}

process.on(
  "SIGINT",
  () => arresta("SIGINT")
);

process.on(
  "SIGTERM",
  () => arresta("SIGTERM")
);

ciclo().catch((err) => {
  console.error("");
  console.error(
    "ERRORE SERVIZIO:",
    err.message
  );

  process.exitCode = 1;
});
