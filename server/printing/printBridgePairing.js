const crypto = require("crypto");

function run(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.run(
      sql,
      params || [],
      function(err) {
        if (err) {
          return reject(err);
        }

        resolve({
          id: this.lastID,
          changes: this.changes
        });
      }
    );
  });
}

function get(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.get(
      sql,
      params || [],
      function(err, row) {
        if (err) {
          return reject(err);
        }

        resolve(row || null);
      }
    );
  });
}

async function assicuraSchemaPairing(db) {
  await run(
    db,
    `
    CREATE TABLE IF NOT EXISTS print_bridge_pairing (
      restaurante_id INTEGER PRIMARY KEY,
      codice_hash TEXT NOT NULL,
      creato_en TEXT NOT NULL,
      scade_en TEXT NOT NULL,
      usato_en TEXT
    )
    `
  );

  await run(
    db,
    `
    CREATE UNIQUE INDEX IF NOT EXISTS
    idx_print_bridge_pairing_codice
    ON print_bridge_pairing(codice_hash)
    `
  );
}

function normalizzaCodicePairing(valor) {
  return String(valor || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function hashCodicePairing(valor) {
  return crypto
    .createHash("sha256")
    .update(
      normalizzaCodicePairing(valor)
    )
    .digest("hex");
}

function generaCodicePairing() {
  const alfabeto =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let valore = "";

  for (let i = 0; i < 10; i++) {
    valore +=
      alfabeto[
        crypto.randomInt(
          0,
          alfabeto.length
        )
      ];
  }

  return (
    valore.slice(0, 5) +
    "-" +
    valore.slice(5)
  );
}

async function creaCodicePairingBridge(
  db,
  restauranteId,
  minutiValidita
) {
  await assicuraSchemaPairing(db);

  const id =
    Number(restauranteId);

  if (!id) {
    throw new Error(
      "restaurante_id non valido"
    );
  }

  const minuti =
    Math.max(
      1,
      Math.min(
        Number(minutiValidita) || 10,
        30
      )
    );

  const codice =
    generaCodicePairing();

  const hash =
    hashCodicePairing(codice);

  const creato =
    new Date();

  const scade =
    new Date(
      creato.getTime() +
      minuti * 60 * 1000
    );

  await run(
    db,
    `
    INSERT OR IGNORE INTO print_bridge_pairing
    (
      restaurante_id,
      codice_hash,
      creato_en,
      scade_en,
      usato_en
    )
    VALUES (?, ?, ?, ?, NULL)
    `,
    [
      id,
      hash,
      creato.toISOString(),
      scade.toISOString()
    ]
  );

  await run(
    db,
    `
    UPDATE print_bridge_pairing
    SET
      codice_hash=?,
      creato_en=?,
      scade_en=?,
      usato_en=NULL
    WHERE restaurante_id=?
    `,
    [
      hash,
      creato.toISOString(),
      scade.toISOString(),
      id
    ]
  );

  return {
    restaurante_id: id,
    codice,
    scade_en:
      scade.toISOString()
  };
}

async function consumaCodicePairingBridge(
  db,
  codice
) {
  await assicuraSchemaPairing(db);

  const normalizzato =
    normalizzaCodicePairing(
      codice
    );

  if (normalizzato.length !== 10) {
    return null;
  }

  const hash =
    hashCodicePairing(
      normalizzato
    );

  const riga =
    await get(
      db,
      `
      SELECT
        restaurante_id,
        codice_hash,
        scade_en,
        usato_en
      FROM print_bridge_pairing
      WHERE codice_hash=?
      LIMIT 1
      `,
      [hash]
    );

  if (
    !riga ||
    riga.usato_en
  ) {
    return null;
  }

  const ora =
    new Date().toISOString();

  if (
    !riga.scade_en ||
    String(riga.scade_en) < ora
  ) {
    return null;
  }

  const risultato =
    await run(
      db,
      `
      UPDATE print_bridge_pairing
      SET usato_en=?
      WHERE restaurante_id=?
        AND codice_hash=?
        AND usato_en IS NULL
        AND scade_en>=?
      `,
      [
        ora,
        Number(
          riga.restaurante_id
        ),
        hash,
        ora
      ]
    );

  if (risultato.changes !== 1) {
    return null;
  }

  return {
    restaurante_id:
      Number(
        riga.restaurante_id
      )
  };
}

module.exports = {
  assicuraSchemaPairing,
  creaCodicePairingBridge,
  consumaCodicePairingBridge,
  normalizzaCodicePairing
};
