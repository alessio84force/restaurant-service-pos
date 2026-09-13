const {
  execFile
} = require("child_process");

const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  scopriStampanti
} = require("./scopriStampanti");

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

function stampaTest(idONome) {
  return new Promise(
    (resolve, reject) => {
      let stampante;

      try {
        stampante =
          trovaStampante(idONome);
      } catch (err) {
        return reject(err);
      }

      if (!stampante) {
        return reject(
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
        "Stampante: " + stampante.nome,
        "ID: " + stampante.id,
        "Connessione: " +
          stampante.connessione,
        "",
        "Se stai leggendo questo foglio,",
        "il Print Bridge comunica",
        "correttamente con la stampante.",
        "",
        new Date().toISOString(),
        "",
        ""
      ].join("\n");

      const nomeFile =
        "rsp-print-test-" +
        Date.now() +
        ".txt";

      const file =
        path.join(
          os.tmpdir(),
          nomeFile
        );

      fs.writeFileSync(
        file,
        testo,
        "utf8"
      );

      execFile(
        "/usr/bin/lp",
        [
          "-d",
          stampante.nome,
          file
        ],
        {
          encoding: "utf8"
        },
        (err, stdout, stderr) => {
          try {
            fs.unlinkSync(file);
          } catch (_) {}

          if (err) {
            return reject(
              new Error(
                String(
                  stderr ||
                  err.message ||
                  "Errore di stampa"
                ).trim()
              )
            );
          }

          resolve({
            ok: true,
            stampante:
              stampante.nome,
            id:
              stampante.id,
            risposta:
              String(stdout || "")
                .trim()
          });
        }
      );
    }
  );
}

module.exports = {
  trovaStampante,
  stampaTest
};
