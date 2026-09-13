const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  heartbeat,
  claim,
  confermaStampa,
  segnalaErrore
} = require("./clientApi");

const {
  stampaTesto
} = require("./stampaLocale");

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
      "Configurazione Print Bridge non trovata"
    );
  }

  const config =
    JSON.parse(
      fs.readFileSync(
        file,
        "utf8"
      )
    );

  if (
    !config.server_url ||
    !config.token ||
    !config.bridge_id
  ) {
    throw new Error(
      "Configurazione Print Bridge incompleta"
    );
  }

  return config;
}

async function main() {
  const config =
    caricaConfig();

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "RSP PRINT BRIDGE - WORKER"
  );
  console.log(
    "========================================"
  );

  const hb =
    await heartbeat(config);

  if (
    hb.status !== 200 ||
    !hb.json ||
    hb.json.ok !== true
  ) {
    throw new Error(
      "Heartbeat fallito HTTP " +
      hb.status
    );
  }

  console.log(
    "HEARTBEAT: OK"
  );

  const risposta =
    await claim(config);

  if (
    risposta.status !== 200 ||
    !risposta.json ||
    risposta.json.ok !== true
  ) {
    throw new Error(
      "Claim fallito HTTP " +
      risposta.status
    );
  }

  const lavoro =
    risposta.json.lavoro;

  if (!lavoro) {
    console.log(
      "CODA: nessun lavoro"
    );

    return;
  }

  console.log(
    "LAVORO:",
    lavoro.id
  );

  console.log(
    "DESTINO:",
    lavoro.destino
  );

  console.log(
    "STAMPANTE:",
    lavoro.printer_id ||
      lavoro.printer_nombre ||
      "NON ASSEGNATA"
  );

  const stampante =
    lavoro.printer_id ||
    lavoro.printer_nombre;

  if (!stampante) {
    const errore =
      "Nessuna stampante assegnata al lavoro";

    const ack =
      await segnalaErrore(
        config,
        lavoro.id,
        errore
      );

    if (
      ack.status !== 200 ||
      !ack.json ||
      ack.json.ok !== true
    ) {
      throw new Error(
        errore +
        " e impossibile registrare l'errore sul server"
      );
    }

    console.log(
      "ERRORE REGISTRATO:",
      errore
    );

    return;
  }

  try {
    console.log(
      "INVIO A STAMPANTE..."
    );

    const risultato =
      await stampaTesto(
        stampante,
        lavoro.contenido,
        {
          timeoutMs: 10000,
          intervalloMs: 1000
        }
      );

    console.log(
      "CUPS COMPLETATO:",
      risultato.job_id
    );

    let ack = null;
    let ultimoErroreAck = null;

    for (let tentativo = 1; tentativo <= 3; tentativo++) {
      try {
        ack =
          await confermaStampa(
            config,
            lavoro.id
          );

        if (
          ack.status === 200 &&
          ack.json &&
          ack.json.ok === true
        ) {
          ultimoErroreAck = null;
          break;
        }

        ultimoErroreAck =
          new Error(
            "ACK HTTP " +
            ack.status +
            " " +
            ack.testo
          );
      } catch (errAck) {
        ultimoErroreAck =
          errAck;
      }

      if (tentativo < 3) {
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 1500)
        );
      }
    }

    if (ultimoErroreAck) {
      console.log(
        "ATTENZIONE: stampa completata ma ACK server incerto:",
        ultimoErroreAck.message
      );

      process.exitCode = 2;
      return;
    }

    console.log(
      "SERVER: lavoro marcato IMPRESO"
    );
  } catch (err) {
    console.log(
      "STAMPA FALLITA:",
      err.message
    );

    const ack =
      await segnalaErrore(
        config,
        lavoro.id,
        err.message
      );

    if (
      ack.status !== 200 ||
      !ack.json ||
      ack.json.ok !== true
    ) {
      throw new Error(
        "Errore stampa e impossibile aggiornare il server: " +
        err.message
      );
    }

    console.log(
      "SERVER: errore registrato"
    );
  }
}

main().catch((err) => {
  console.error("");
  console.error(
    "ERRORE WORKER:",
    err.message
  );

  process.exitCode = 1;
});
