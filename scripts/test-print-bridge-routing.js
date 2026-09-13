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
  sincronizzaStampanti
} = require(
  "../server/printing/printBridgePrinters"
);

const {
  preparaComandaPrintBridge
} = require(
  "../server/printing/printBridgeDispatch"
);

const {
  accodaLavoro,
  reclamaProssimoLavoro
} = require(
  "../server/printing/printBridgeQueue"
);

const dbFile =
  path.join(
    os.tmpdir(),
    "rsp-print-bridge-routing-test.db"
  );

try {
  fs.unlinkSync(dbFile);
} catch (_) {}

const db =
  new sqlite3.Database(dbFile);

function run(sql, params) {
  return new Promise(
    (resolve, reject) => {
      db.run(
        sql,
        params || [],
        function(err) {
          if (err) {
            return reject(err);
          }

          resolve(this);
        }
      );
    }
  );
}

function prepara() {
  return new Promise(
    (resolve, reject) => {
      prepararPrintBridge(
        db,
        (err) => {
          if (err) {
            return reject(err);
          }

          resolve();
        }
      );
    }
  );
}

function assert(
  condizione,
  messaggio
) {
  if (!condizione) {
    throw new Error(
      "TEST FALLITO: " +
      messaggio
    );
  }
}

async function main() {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "TEST ROUTING PRINT BRIDGE"
  );
  console.log(
    "========================================"
  );

  await prepara();

  await run(`
    CREATE TABLE configurazione (
      id INTEGER PRIMARY KEY,
      restaurante_id INTEGER,
      modo_impresion TEXT,
      config_impresion_json TEXT
    )
  `);

  await run(
    `
    INSERT INTO print_bridge_config
    (
      restaurante_id,
      token_hash,
      bridge_nombre
    )
    VALUES (?, ?, ?)
    `,
    [
      14,
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "Bridge test"
    ]
  );

  await sincronizzaStampanti(
    db,
    14,
    "bridge-A",
    [
      {
        id:
          "printer-cucina",
        nome:
          "Epson Cocina",
        tipo:
          "usb",
        connessione:
          "USB",
        uri:
          "usb://epson/cucina"
      }
    ]
  );

  await sincronizzaStampanti(
    db,
    14,
    "bridge-B",
    [
      {
        id:
          "printer-bar",
        nome:
          "Epson Bar",
        tipo:
          "usb",
        connessione:
          "USB",
        uri:
          "usb://epson/bar"
      }
    ]
  );

  await run(
    `
    INSERT INTO configurazione
    (
      restaurante_id,
      modo_impresion,
      config_impresion_json
    )
    VALUES (?, ?, ?)
    `,
    [
      14,
      "preview",
      JSON.stringify({
        cocina: {
          modo:
            "print_bridge",
          printer_id:
            "printer-cucina",
          bridge_id:
            "bridge-A",
          nombre:
            "Epson Cocina"
        }
      })
    ]
  );

  const risultato =
    await preparaComandaPrintBridge(
      db,
      {
        restaurante_id: 14,
        destino:
          "cocina",
        mesa:
          "7",
        lineas: [
          {
            id: 101,
            pedido: 50,
            cantidad_total: 1,
            cantidad_enviada: 0,
            cantidad: 1,
            nota: ""
          }
        ],
        contenuto:
          "COMANDA TEST ROUTING"
      }
    );

  assert(
    risultato.ok === true,
    "comanda non accodata"
  );

  assert(
    risultato.lavoro.bridge_id ===
      "bridge-A",
    "job senza Bridge destinatario"
  );

  assert(
    risultato.lavoro.printer_id ===
      "printer-cucina",
    "printer_id errato"
  );

  assert(
    risultato.lavoro.printer_nombre ===
      "Epson Cocina",
    "nome stampante non derivato dall'inventario"
  );

  console.log(
    "JOB TARGET BRIDGE A: OK"
  );

  const bridgeB =
    await reclamaProssimoLavoro(
      db,
      14,
      "bridge-B",
      60
    );

  assert(
    bridgeB === null,
    "Bridge B ha reclamato un job di Bridge A"
  );

  console.log(
    "BRIDGE B BLOCCATO: OK"
  );

  const bridgeA =
    await reclamaProssimoLavoro(
      db,
      14,
      "bridge-A",
      60
    );

  assert(
    bridgeA &&
    bridgeA.id ===
      risultato.lavoro.id,
    "Bridge A non ha ricevuto il proprio job"
  );

  console.log(
    "BRIDGE A RICEVE JOB: OK"
  );

  const legacy =
    await accodaLavoro(
      db,
      {
        restaurante_id: 14,
        idempotency_key:
          "legacy:senza-bridge",
        tipo:
          "comanda",
        destino:
          "bar",
        contenuto:
          "JOB LEGACY"
      }
    );

  assert(
    legacy.lavoro.bridge_id ==
      null,
    "job legacy non è neutro"
  );

  const legacyClaim =
    await reclamaProssimoLavoro(
      db,
      14,
      "bridge-B",
      60
    );

  assert(
    legacyClaim &&
    legacyClaim.id ===
      legacy.lavoro.id,
    "compatibilità job legacy fallita"
  );

  console.log(
    "COMPATIBILITA JOB LEGACY: OK"
  );

  console.log("");
  console.log(
    "TEST ROUTING PRINT BRIDGE: SUPERATO"
  );
}

main()
  .catch((err) => {
    console.error("");
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    db.close(() => {
      try {
        fs.unlinkSync(dbFile);
      } catch (_) {}
    });
  });
