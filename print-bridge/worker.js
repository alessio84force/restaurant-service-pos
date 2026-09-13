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

const {
  caricaStato,
  salvaStato,
  cancellaStato
} = require("./statoLocale");

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

function rispostaOk(risposta) {
  return Boolean(
    risposta &&
    risposta.status === 200 &&
    risposta.json &&
    risposta.json.ok === true
  );
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

async function confermaConRetry(
  config,
  lavoroId
) {
  let ultimoErrore = null;

  for (
    let tentativo = 1;
    tentativo <= 3;
    tentativo++
  ) {
    try {
      const risposta =
        await confermaStampa(
          config,
          lavoroId
        );

      if (
        rispostaOk(risposta)
      ) {
        return {
          ok: true
        };
      }

      ultimoErrore =
        new Error(
          "ACK HTTP " +
          risposta.status +
          " " +
          risposta.testo
        );
    } catch (err) {
      ultimoErrore = err;
    }

    if (tentativo < 3) {
      await aspetta(1500);
    }
  }

  return {
    ok: false,
    errore:
      ultimoErrore
  };
}

async function recuperaStatoLocale(
  config
) {
  const stato =
    caricaStato();

  if (!stato) {
    return false;
  }

  console.log("");
  console.log(
    "RECUPERO STATO LOCALE"
  );

  console.log(
    "LAVORO:",
    stato.lavoro_id
  );

  console.log(
    "STATO:",
    stato.stato
  );

  if (
    stato.stato ===
    "stampato_ack_pendente"
  ) {
    console.log(
      "La stampa era gia completata."
    );

    console.log(
      "Ritento SOLO l'ACK."
    );

    const risultato =
      await confermaConRetry(
        config,
        stato.lavoro_id
      );

    if (risultato.ok) {
      cancellaStato();

      console.log(
        "ACK RECUPERATO: OK"
      );

      return true;
    }

    console.log(
      "ACK ANCORA PENDENTE:",
      risultato.errore
        ? risultato.errore.message
        : "errore sconosciuto"
    );

    process.exitCode = 2;
    return true;
  }

  if (
    stato.stato ===
    "stampa_in_corso"
  ) {
    const messaggio = [
      "Esito stampa incerto.",
      "Il Print Bridge e' stato interrotto",
      "durante una stampa.",
      "Nessuna ristampa automatica eseguita."
    ].join(" ");

    console.log(
      "ESITO INCERTO:"
    );

    console.log(
      "nessuna ristampa automatica."
    );

    try {
      const risposta =
        await segnalaErrore(
          config,
          stato.lavoro_id,
          messaggio
        );

      if (
        rispostaOk(risposta)
      ) {
        cancellaStato();

        console.log(
          "SERVER: esito incerto registrato"
        );

        return true;
      }

      console.log(
        "Impossibile registrare esito incerto:",
        "HTTP " +
          risposta.status
      );
    } catch (err) {
      console.log(
        "Impossibile registrare esito incerto:",
        err.message
      );
    }

    process.exitCode = 3;
    return true;
  }

  console.log(
    "Stato locale sconosciuto."
  );

  console.log(
    "Per sicurezza nessun nuovo lavoro verra stampato."
  );

  process.exitCode = 4;
  return true;
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

  if (!rispostaOk(hb)) {
    throw new Error(
      "Heartbeat fallito HTTP " +
      hb.status
    );
  }

  console.log(
    "HEARTBEAT: OK"
  );

  const recuperato =
    await recuperaStatoLocale(
      config
    );

  if (recuperato) {
    return;
  }

  const risposta =
    await claim(config);

  if (!rispostaOk(risposta)) {
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

    if (!rispostaOk(ack)) {
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

  salvaStato({
    stato:
      "stampa_in_corso",
    lavoro_id:
      lavoro.id,
    bridge_id:
      config.bridge_id,
    destino:
      lavoro.destino,
    printer_id:
      lavoro.printer_id ||
      null,
    printer_nombre:
      lavoro.printer_nombre ||
      null
  });

  console.log(
    "STATO LOCALE: stampa_in_corso"
  );

  let risultatoStampa;

  try {
    console.log(
      "INVIO A STAMPANTE..."
    );

    risultatoStampa =
      await stampaTesto(
        stampante,
        lavoro.contenido,
        {
          timeoutMs: 10000,
          intervalloMs: 1000
        }
      );
  } catch (err) {
    console.log(
      "STAMPA FALLITA:",
      err.message
    );

    let ackErrore;

    try {
      ackErrore =
        await segnalaErrore(
          config,
          lavoro.id,
          err.message
        );
    } catch (errServer) {
      console.log(
        "SERVER NON RAGGIUNGIBILE:"
      );

      console.log(
        "stato locale mantenuto per sicurezza."
      );

      throw errServer;
    }

    if (
      !rispostaOk(ackErrore)
    ) {
      throw new Error(
        "Errore stampa registrato localmente, ma ACK errore server fallito"
      );
    }

    cancellaStato();

    console.log(
      "SERVER: errore registrato"
    );

    console.log(
      "STATO LOCALE: rimosso"
    );

    return;
  }

  console.log(
    "CUPS COMPLETATO:",
    risultatoStampa.job_id
  );

  try {
    salvaStato({
      stato:
        "stampato_ack_pendente",
      lavoro_id:
        lavoro.id,
      bridge_id:
        config.bridge_id,
      destino:
        lavoro.destino,
      printer_id:
        lavoro.printer_id ||
        null,
      printer_nombre:
        lavoro.printer_nombre ||
        null,
      cups_job_id:
        risultatoStampa.job_id
    });
  } catch (errStato) {
    console.log(
      "CRITICO: stampa completata ma impossibile aggiornare lo stato locale."
    );

    console.log(
      "Per sicurezza NON verra effettuata alcuna ristampa automatica in questa esecuzione."
    );

    console.log(
      "ERRORE STATO:",
      errStato.message
    );

    process.exitCode = 4;
    return;
  }

  console.log(
    "STATO LOCALE: stampato_ack_pendente"
  );

  const risultatoAck =
    await confermaConRetry(
      config,
      lavoro.id
    );

  if (!risultatoAck.ok) {
    console.log(
      "ATTENZIONE: stampa completata ma ACK server ancora pendente:"
    );

    console.log(
      risultatoAck.errore
        ? risultatoAck.errore.message
        : "errore sconosciuto"
    );

    console.log(
      "Il prossimo avvio ritentera SOLO l'ACK."
    );

    process.exitCode = 2;
    return;
  }

  cancellaStato();

  console.log(
    "SERVER: lavoro marcato IMPRESO"
  );

  console.log(
    "STATO LOCALE: rimosso"
  );
}

main().catch((err) => {
  console.error("");
  console.error(
    "ERRORE WORKER:",
    err.message
  );

  process.exitCode = 1;
});
