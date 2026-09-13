const fs = require("fs");
const os = require("os");
const path = require("path");

const sqlite3 =
  require("sqlite3").verbose();

const {
  prepararPrintBridge
} = require(
  "../server/migrations/printBridge"
);

const {
  accodaLavoro,
  reclamaProssimoLavoro,
  segnaImpreso,
  segnaErrore
} = require(
  "../server/printing/printBridgeQueue"
);

const dbFile =
  path.join(
    os.tmpdir(),
    "rsp-print-bridge-queue-test.db"
  );

try {
  fs.unlinkSync(dbFile);
} catch (_) {}

const db =
  new sqlite3.Database(dbFile);

function prepara() {
  return new Promise(
    (resolve, reject) => {
      prepararPrintBridge(
        db,
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    }
  );
}

function all(sql, params) {
  return new Promise(
    (resolve, reject) => {
      db.all(
        sql,
        params || [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    }
  );
}

function assert(condizione, messaggio) {
  if (!condizione) {
    throw new Error(
      "TEST FALLITO: " + messaggio
    );
  }
}

async function main() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "TEST PRINT BRIDGE QUEUE"
  );
  console.log(
    "========================================"
  );

  await prepara();

  const primo =
    await accodaLavoro(
      db,
      {
        restaurante_id: 14,
        idempotency_key:
          "test:r14:comanda:1",
        tipo: "comanda",
        destino: "cocina",
        contenuto:
          "COMANDA TEST CUCINA"
      }
    );

  assert(
    primo.creato === true,
    "primo lavoro non creato"
  );

  const duplicato =
    await accodaLavoro(
      db,
      {
        restaurante_id: 14,
        idempotency_key:
          "test:r14:comanda:1",
        tipo: "comanda",
        destino: "cocina",
        contenuto:
          "COMANDA DUPLICATA"
      }
    );

  assert(
    duplicato.creato === false,
    "idempotenza non rispettata"
  );

  assert(
    duplicato.lavoro.id ===
      primo.lavoro.id,
    "duplicato con ID diverso"
  );

  const secondo =
    await accodaLavoro(
      db,
      {
        restaurante_id: 14,
        idempotency_key:
          "test:r14:comanda:2",
        tipo: "comanda",
        destino: "bar",
        contenuto:
          "COMANDA TEST BAR"
      }
    );

  const altroRistorante =
    await accodaLavoro(
      db,
      {
        restaurante_id: 15,
        idempotency_key:
          "test:r15:comanda:1",
        tipo: "comanda",
        destino: "cocina",
        contenuto:
          "NON DEVE ESSERE VISTO DA R14"
      }
    );

  const reclamato1 =
    await reclamaProssimoLavoro(
      db,
      14,
      "bridge-r14-test",
      60
    );

  assert(
    reclamato1 &&
      reclamato1.id ===
        primo.lavoro.id,
    "ordine coda errato"
  );

  assert(
    Number(
      reclamato1.restaurante_id
    ) === 14,
    "isolamento ristorante fallito"
  );

  const confermato =
    await segnaImpreso(
      db,
      14,
      reclamato1.id,
      "bridge-r14-test"
    );

  assert(
    confermato === true,
    "conferma stampa fallita"
  );

  const reclamato2 =
    await reclamaProssimoLavoro(
      db,
      14,
      "bridge-r14-test",
      60
    );

  assert(
    reclamato2 &&
      reclamato2.id ===
        secondo.lavoro.id,
    "secondo lavoro non reclamato"
  );

  const errore =
    await segnaErrore(
      db,
      14,
      reclamato2.id,
      "bridge-r14-test",
      "stampante offline"
    );

  assert(
    errore === true,
    "registrazione errore fallita"
  );

  const nessuno =
    await reclamaProssimoLavoro(
      db,
      14,
      "bridge-r14-test",
      60
    );

  assert(
    nessuno === null,
    "r14 vede lavori non suoi o già chiusi"
  );

  const reclamato15 =
    await reclamaProssimoLavoro(
      db,
      15,
      "bridge-r15-test",
      60
    );

  assert(
    reclamato15 &&
      reclamato15.id ===
        altroRistorante.lavoro.id,
    "isolamento r15 fallito"
  );

  const righe =
    await all(
      `
      SELECT
        id,
        restaurante_id,
        idempotency_key,
        destino,
        estado,
        bridge_id,
        intentos,
        error_mensaje
      FROM print_bridge_jobs
      ORDER BY id
      `
    );

  console.log("");
  console.table(righe);

  console.log("");
  console.log(
    "IDEMPOTENZA: OK"
  );
  console.log(
    "MULTI-TENANT: OK"
  );
  console.log(
    "CLAIM: OK"
  );
  console.log(
    "ACK STAMPA: OK"
  );
  console.log(
    "GESTIONE ERRORE: OK"
  );

  console.log("");
  console.log(
    "TEST PRINT BRIDGE QUEUE: SUPERATO"
  );
}

main()
  .catch((err) => {
    console.error("");
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    db.close();
  });
