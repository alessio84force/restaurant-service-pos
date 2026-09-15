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

function all(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.all(
      sql,
      params || [],
      function(err, rows) {
        if (err) {
          return reject(err);
        }

        resolve(rows || []);
      }
    );
  });
}

async function assicuraBridgeIdAutorizzato(db) {
  const colonne =
    await all(
      db,
      "PRAGMA table_info(print_bridge_config)"
    );

  const presente =
    colonne.some(
      (colonna) =>
        colonna.name ===
        "bridge_id_autorizzato"
    );

  if (presente) {
    return;
  }

  try {
    await run(
      db,
      `
      ALTER TABLE print_bridge_config
      ADD COLUMN bridge_id_autorizzato TEXT
      `
    );
  } catch (err) {
    if (
      !/duplicate column/i.test(
        String(err.message || "")
      )
    ) {
      throw err;
    }
  }
}

function generaToken() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(
      String(token || "")
    )
    .digest("hex");
}

async function creaTokenBridge(
  db,
  restauranteId,
  bridgeNome,
  bridgeId
) {
  await assicuraBridgeIdAutorizzato(
    db
  );

  const id =
    Number(restauranteId);

  if (!id) {
    throw new Error(
      "restaurante_id non valido"
    );
  }

  const token =
    generaToken();

  const hash =
    hashToken(token);

  const adesso =
    new Date().toISOString();

  await run(
    db,
    `
    INSERT OR IGNORE INTO print_bridge_config
    (
      restaurante_id,
      token_hash,
      token_creado_en,
      bridge_nombre,
      bridge_id_autorizzato
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      id,
      hash,
      adesso,
      String(
        bridgeNome || ""
      ),
      String(
        bridgeId || ""
      )
    ]
  );

  await run(
    db,
    `
    UPDATE print_bridge_config
    SET
      token_hash=?,
      token_creado_en=?,
      bridge_nombre=?,
      bridge_id_autorizzato=
        CASE
          WHEN TRIM(?) <> ''
          THEN ?
          ELSE bridge_id_autorizzato
        END,
      ultimo_error=NULL
    WHERE restaurante_id=?
    `,
    [
      hash,
      adesso,
      String(
        bridgeNome || ""
      ),
      String(
        bridgeId || ""
      ),
      String(
        bridgeId || ""
      ),
      id
    ]
  );

  return {
    restaurante_id: id,
    token
  };
}

async function autenticaTokenBridge(
  db,
  token
) {
  await assicuraBridgeIdAutorizzato(
    db
  );

  const valore =
    String(token || "").trim();

  if (!valore) {
    return null;
  }

  const hash =
    hashToken(valore);

  const config =
    await get(
      db,
      `
      SELECT
        restaurante_id,
        bridge_nombre,
        bridge_version,
        ultimo_contacto,
        bridge_id_autorizzato
      FROM print_bridge_config
      WHERE token_hash=?
      LIMIT 1
      `,
      [hash]
    );

  if (!config) {
    return null;
  }

  return {
    restaurante_id:
      Number(
        config.restaurante_id
      ),

    bridge_nome:
      config.bridge_nombre || "",

    bridge_version:
      config.bridge_version || "",

    ultimo_contacto:
      config.ultimo_contacto || null,

    bridge_id_autorizzato:
      config.bridge_id_autorizzato || ""
  };
}

async function registraContattoBridge(
  db,
  restauranteId,
  dati
) {
  const adesso =
    new Date().toISOString();

  const risultato =
    await run(
      db,
      `
      UPDATE print_bridge_config
      SET
        ultimo_contacto=?,
        bridge_nombre=?,
        bridge_version=?,
        ultimo_error=?
      WHERE restaurante_id=?
      `,
      [
        adesso,

        String(
          (
            dati &&
            dati.bridge_nome
          ) ||
          ""
        ),

        String(
          (
            dati &&
            dati.bridge_version
          ) ||
          ""
        ),

        dati &&
        dati.ultimo_error
          ? String(
              dati.ultimo_error
            )
          : null,

        Number(
          restauranteId
        )
      ]
    );

  return {
    ok:
      risultato.changes === 1,

    ultimo_contacto:
      adesso
  };
}

module.exports = {
  generaToken,
  hashToken,
  creaTokenBridge,
  autenticaTokenBridge,
  registraContattoBridge,
  assicuraBridgeIdAutorizzato
};
