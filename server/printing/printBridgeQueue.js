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

function oraIso() {
  return new Date().toISOString();
}

async function accodaLavoro(db, dati) {
  const ristoranteId = Number(dati.restaurante_id);

  const idempotencyKey = String(
    dati.idempotency_key || ""
  ).trim();

  const tipo = String(
    dati.tipo || "comanda"
  ).trim();

  const destino = String(
    dati.destino || ""
  ).trim();

  const contenuto = String(
    dati.contenuto || ""
  );

  const bridgeId = String(
    dati.bridge_id || ""
  ).trim();

  if (!ristoranteId) {
    throw new Error(
      "restaurante_id obbligatorio"
    );
  }

  if (!idempotencyKey) {
    throw new Error(
      "idempotency_key obbligatoria"
    );
  }

  if (!destino) {
    throw new Error(
      "destino obbligatorio"
    );
  }

  if (!contenuto) {
    throw new Error(
      "contenuto obbligatorio"
    );
  }

  const risultato = await run(
    db,
    `
    INSERT OR IGNORE INTO print_bridge_jobs
    (
      restaurante_id,
      idempotency_key,
      tipo,
      destino,
      contenido,
      estado,
      printer_id,
      printer_nombre,
      bridge_id,
      creado_en
    )
    VALUES (
      ?, ?, ?, ?, ?,
      'pendiente',
      ?, ?, ?, ?
    )
    `,
    [
      ristoranteId,
      idempotencyKey,
      tipo,
      destino,
      contenuto,
      dati.printer_id || null,
      dati.printer_nombre || null,
      bridgeId || null,
      oraIso()
    ]
  );

  const lavoro = await get(
    db,
    `
    SELECT *
    FROM print_bridge_jobs
    WHERE restaurante_id=?
      AND idempotency_key=?
    LIMIT 1
    `,
    [
      ristoranteId,
      idempotencyKey
    ]
  );

  return {
    creato:
      risultato.changes === 1,
    lavoro
  };
}

async function reclamaProssimoLavoro(

  db,

  ristoranteId,

  bridgeId,

  leaseSecondi

) {

  const restauranteId =
    Number(ristoranteId);

  const bridge =
    String(
      bridgeId || ""
    ).trim();

  if (!restauranteId) {
    throw new Error(
      "restaurante_id non valido"
    );
  }

  if (!bridge) {
    throw new Error(
      "bridge_id obbligatorio"
    );
  }

  const durata =
    Number(
      leaseSecondi || 60
    );

  const adesso =
    oraIso();

  const leaseHasta =
    new Date(
      Date.now() +
      durata * 1000
    ).toISOString();

  /*
   * Prima leggiamo il candidato.
   * Poi l'UPDATE sotto agisce come
   * compare-and-set atomico.
   *
   * Se un altro Bridge lo reclama
   * prima di noi, changes sarà 0.
   */

  const lavoro =
    await get(
      db,
      `
      SELECT *
      FROM print_bridge_jobs
      WHERE restaurante_id=?
        AND (
          (
            estado='pendiente'
            AND (
              bridge_id IS NULL
              OR bridge_id=''
              OR bridge_id=?
            )
          )
          OR (
            estado='reclamado'
            AND bridge_id=?
            AND lease_hasta IS NOT NULL
            AND lease_hasta < ?
          )
        )
      ORDER BY id
      LIMIT 1
      `,
      [
        restauranteId,
        bridge,
        bridge,
        adesso
      ]
    );

  if (!lavoro) {
    return null;
  }

  const aggiornato =
    await run(
      db,
      `
      UPDATE print_bridge_jobs
      SET
        estado='reclamado',
        bridge_id=?,
        reclamado_en=?,
        lease_hasta=?,
        intentos=intentos+1,
        error_mensaje=NULL,
        error_en=NULL
      WHERE id=?
        AND restaurante_id=?
        AND (
          (
            estado='pendiente'
            AND (
              bridge_id IS NULL
              OR bridge_id=''
              OR bridge_id=?
            )
          )
          OR (
            estado='reclamado'
            AND bridge_id=?
            AND lease_hasta IS NOT NULL
            AND lease_hasta < ?
          )
        )
      `,
      [
        bridge,
        adesso,
        leaseHasta,
        lavoro.id,
        restauranteId,
        bridge,
        bridge,
        adesso
      ]
    );

  if (
    aggiornato.changes !== 1
  ) {
    return null;
  }

  return get(
    db,
    `
    SELECT *
    FROM print_bridge_jobs
    WHERE id=?
      AND restaurante_id=?
    `,
    [
      lavoro.id,
      restauranteId
    ]
  );
}

async function segnaImpreso(
  db,
  ristoranteId,
  lavoroId,
  bridgeId
) {
  const id = Number(lavoroId);
  const restauranteId = Number(ristoranteId);
  const bridge = String(bridgeId || "");

  const esistente = await get(
    db,
    `
    SELECT estado, bridge_id
    FROM print_bridge_jobs
    WHERE id=?
      AND restaurante_id=?
    LIMIT 1
    `,
    [
      id,
      restauranteId
    ]
  );

  if (
    esistente &&
    esistente.estado === "impreso" &&
    String(esistente.bridge_id || "") === bridge
  ) {
    return true;
  }

  const risultato = await run(
    db,
    `
    UPDATE print_bridge_jobs
    SET
      estado='impreso',
      impreso_en=?,
      lease_hasta=NULL,
      error_en=NULL,
      error_mensaje=NULL
    WHERE id=?
      AND restaurante_id=?
      AND estado='reclamado'
      AND bridge_id=?
    `,
    [
      oraIso(),
      id,
      restauranteId,
      bridge
    ]
  );

  return risultato.changes === 1;
}

async function segnaErrore(
  db,
  ristoranteId,
  lavoroId,
  bridgeId,
  messaggio
) {
  const id =
    Number(lavoroId);

  const restauranteId =
    Number(ristoranteId);

  const bridge =
    String(bridgeId || "");

  const esistente =
    await get(
      db,
      `
      SELECT
        estado,
        bridge_id
      FROM print_bridge_jobs
      WHERE id=?
        AND restaurante_id=?
      LIMIT 1
      `,
      [
        id,
        restauranteId
      ]
    );

  if (
    esistente &&
    esistente.estado === "error" &&
    String(
      esistente.bridge_id || ""
    ) === bridge
  ) {
    return true;
  }

  const risultato =
    await run(
      db,
      `
      UPDATE print_bridge_jobs
      SET
        estado='error',
        error_en=?,
        error_mensaje=?,
        lease_hasta=NULL
      WHERE id=?
        AND restaurante_id=?
        AND estado='reclamado'
        AND bridge_id=?
      `,
      [
        oraIso(),
        String(
          messaggio ||
          "Errore stampa"
        ),
        id,
        restauranteId,
        bridge
      ]
    );

  return risultato.changes === 1;
}

module.exports = {
  accodaLavoro,
  reclamaProssimoLavoro,
  segnaImpreso,
  segnaErrore
};
