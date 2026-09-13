const crypto = require("crypto");

function run(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function(err) {
      if (err) return reject(err);

      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], function(err, row) {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function generaToken() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token || ""))
    .digest("hex");
}

async function creaTokenBridge(
  db,
  restauranteId,
  bridgeNome
) {
  const id = Number(restauranteId);

  if (!id) {
    throw new Error(
      "restaurante_id non valido"
    );
  }

  const token = generaToken();
  const hash = hashToken(token);
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
      bridge_nombre
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      id,
      hash,
      adesso,
      String(bridgeNome || "")
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
      ultimo_error=NULL
    WHERE restaurante_id=?
    `,
    [
      hash,
      adesso,
      String(bridgeNome || ""),
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
  const valore =
    String(token || "").trim();

  if (!valore) {
    return null;
  }

  const hash =
    hashToken(valore);

  const config = await get(
    db,
    `
    SELECT
      restaurante_id,
      bridge_nombre,
      bridge_version,
      ultimo_contacto
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
      Number(config.restaurante_id),
    bridge_nome:
      config.bridge_nombre || "",
    bridge_version:
      config.bridge_version || "",
    ultimo_contacto:
      config.ultimo_contacto || null
  };
}

async function registraContattoBridge(
  db,
  restauranteId,
  dati
) {
  const adesso =
    new Date().toISOString();

  const risultato = await run(
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
        (dati && dati.bridge_nome) || ""
      ),
      String(
        (dati && dati.bridge_version) || ""
      ),
      dati &&
      dati.ultimo_error
        ? String(dati.ultimo_error)
        : null,
      Number(restauranteId)
    ]
  );

  return {
    ok: risultato.changes === 1,
    ultimo_contacto: adesso
  };
}

module.exports = {
  generaToken,
  hashToken,
  creaTokenBridge,
  autenticaTokenBridge,
  registraContattoBridge
};
