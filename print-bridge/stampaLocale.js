const {
  execFile
} = require("child_process");

const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  scopriStampanti
} = require("./scopriStampanti");

function esegui(comando, args) {
  return new Promise(
    (resolve, reject) => {
      execFile(
        comando,
        args || [],
        {
          encoding: "utf8"
        },
        (err, stdout, stderr) => {
          if (err) {
            err.stdout =
              String(stdout || "");

            err.stderr =
              String(stderr || "");

            return reject(err);
          }

          resolve({
            stdout:
              String(stdout || ""),
            stderr:
              String(stderr || "")
          });
        }
      );
    }
  );
}

function aspetta(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

function trovaStampante(idONome) {
  const cercata =
    String(idONome || "").trim();

  if (!cercata) {
    return null;
  }

  const stampanti =
    scopriStampanti();

  return (
    stampanti.find(
      (s) => s.id === cercata
    ) ||
    stampanti.find(
      (s) => s.nome === cercata
    ) ||
    null
  );
}

function estraiJobId(
  risposta,
  nomeStampante
) {
  const escaped =
    String(nomeStampante)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

  const match =
    String(risposta || "")
      .match(
        new RegExp(
          escaped + "-(\\d+)"
        )
      );

  if (!match) {
    return null;
  }

  return (
    nomeStampante +
    "-" +
    match[1]
  );
}

async function lavoroAncoraInCoda(
  nomeStampante,
  jobId
) {
  const risultato =
    await esegui(
      "/usr/bin/lpstat",
      [
        "-W",
        "not-completed",
        "-o",
        nomeStampante
      ]
    );

  return risultato.stdout
    .split(/\r?\n/)
    .some(
      (riga) =>
        riga.trim()
          .startsWith(
            jobId + " "
          ) ||
        riga.trim() === jobId
    );
}

async function cancellaLavoro(
  jobId
) {
  try {
    await esegui(
      "/usr/bin/cancel",
      [jobId]
    );
  } catch (_) {}
}

async function stampaTesto(
  idONome,
  testo,
  opzioni
) {
  const stampante =
    trovaStampante(idONome);

  if (!stampante) {
    throw new Error(
      "Stampante non trovata: " +
      idONome
    );
  }

  const contenuto =
    String(testo || "");

  if (!contenuto) {
    throw new Error(
      "Contenuto stampa vuoto"
    );
  }

  const timeoutMs =
    Number(
      opzioni &&
      opzioni.timeoutMs
    ) || 15000;

  const intervalloMs =
    Number(
      opzioni &&
      opzioni.intervalloMs
    ) || 1000;

  const file =
    path.join(
      os.tmpdir(),
      "rsp-print-" +
        Date.now() +
        "-" +
        Math.random()
          .toString(16)
          .slice(2) +
        ".txt"
    );

  fs.writeFileSync(
    file,
    contenuto,
    "utf8"
  );

  let jobId = null;

  try {
    const invio =
      await esegui(
        "/usr/bin/lp",
        [
          "-d",
          stampante.nome,
          file
        ]
      );

    jobId =
      estraiJobId(
        invio.stdout,
        stampante.nome
      );

    if (!jobId) {
      throw new Error(
        "CUPS ha accettato il lavoro ma non e' stato possibile leggere il job ID"
      );
    }

    const inizio =
      Date.now();

    while (
      Date.now() - inizio <
      timeoutMs
    ) {
      const ancora =
        await lavoroAncoraInCoda(
          stampante.nome,
          jobId
        );

      if (!ancora) {
        return {
          ok: true,
          stampante:
            stampante.nome,
          printer_id:
            stampante.id,
          job_id:
            jobId,
          risposta:
            invio.stdout.trim()
        };
      }

      await aspetta(
        intervalloMs
      );
    }

    await cancellaLavoro(
      jobId
    );

    throw new Error(
      "Timeout stampa: il lavoro " +
      jobId +
      " e' rimasto nella coda CUPS ed e' stato cancellato"
    );
  } finally {
    try {
      fs.unlinkSync(file);
    } catch (_) {}
  }
}

function stampaTest(idONome) {
  const stampante =
    trovaStampante(idONome);

  if (!stampante) {
    return Promise.reject(
      new Error(
        "Stampante non trovata: " +
        idONome
      )
    );
  }

  const testo = [
    "",
    "RESTAURANT SERVICE POS",
    "PRINT BRIDGE",
    "",
    "PROVA DI STAMPA",
    "------------------------------",
    "Stampante: " +
      stampante.nome,
    "ID: " +
      stampante.id,
    "",
    "Test Print Bridge V2.14.0",
    "",
    new Date().toISOString(),
    "",
    ""
  ].join("\n");

  return stampaTesto(
    stampante.id,
    testo
  );
}

module.exports = {
  trovaStampante,
  stampaTesto,
  stampaTest
};
