const os = require("os");

const {
  scopriStampanti
} = require("./scopriStampanti");

console.log("");
console.log(
  "========================================"
);
console.log(
  "RESTAURANT SERVICE POS - PRINT BRIDGE"
);
console.log(
  "========================================"
);

console.log("");
console.log(
  "Computer:",
  os.hostname()
);

console.log(
  "Sistema:",
  os.platform(),
  os.release()
);

console.log("");

let stampanti;

try {
  stampanti =
    scopriStampanti();
} catch (err) {
  console.error(
    "ERRORE:",
    err.message
  );

  process.exit(1);
}

if (!stampanti.length) {
  console.log(
    "Nessuna stampante configurata nel sistema."
  );

  process.exit(0);
}

console.log(
  "Stampanti rilevate:",
  stampanti.length
);

console.log("");

stampanti.forEach(
  (stampante, indice) => {
    console.log(
      (indice + 1) + ". " +
      stampante.nome
    );

    console.log(
      "   ID: " +
      stampante.id
    );

    console.log(
      "   Connessione: " +
      stampante.connessione
    );

    console.log(
      "   Tipo: " +
      stampante.tipo
    );

    console.log(
      "   URI: " +
      stampante.uri
    );

    console.log("");
  }
);
