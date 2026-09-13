const {
  scopriStampanti
} = require("./scopriStampanti");

const {
  stampaTest
} = require("./stampaLocale");

async function main() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "RSP PRINT BRIDGE - PROVA STAMPA"
  );
  console.log(
    "========================================"
  );

  const stampanti =
    scopriStampanti();

  if (!stampanti.length) {
    throw new Error(
      "Nessuna stampante disponibile"
    );
  }

  console.log("");
  console.log(
    "Stampante selezionata:"
  );
  console.log(
    stampanti[0].nome
  );
  console.log(
    "ID:",
    stampanti[0].id
  );

  console.log("");
  console.log(
    "Invio prova di stampa..."
  );

  const risultato =
    await stampaTest(
      stampanti[0].id
    );

  console.log("");
  console.log("RISULTATO:");
  console.log(risultato);

  console.log("");
  console.log(
    "========================================"
  );

  if (risultato.ok) {
    console.log(
      "PRINT BRIDGE: LAVORO INVIATO"
    );
  }

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
