function prepararPrintBridge(db, callback) {
  const sql = [
    `
    CREATE TABLE IF NOT EXISTS print_bridge_config (
      restaurante_id INTEGER PRIMARY KEY,
      token_hash TEXT,
      token_creado_en TEXT,
      ultimo_contacto TEXT,
      bridge_nombre TEXT,
      bridge_version TEXT,
      ultimo_error TEXT
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS print_bridge_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurante_id INTEGER NOT NULL,
      idempotency_key TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'comanda',
      destino TEXT NOT NULL,
      contenido TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      printer_id TEXT,
      printer_nombre TEXT,
      bridge_id TEXT,
      intentos INTEGER NOT NULL DEFAULT 0,
      creado_en TEXT NOT NULL,
      reclamado_en TEXT,
      lease_hasta TEXT,
      impreso_en TEXT,
      error_en TEXT,
      error_mensaje TEXT,
      UNIQUE(restaurante_id, idempotency_key)
    )
    `,
    `
    CREATE INDEX IF NOT EXISTS idx_print_bridge_jobs_estado
    ON print_bridge_jobs(restaurante_id, estado, id)
    `,
    `
    CREATE INDEX IF NOT EXISTS idx_print_bridge_jobs_lease
    ON print_bridge_jobs(restaurante_id, lease_hasta)
    `
  ];

  let indice = 0;

  function siguiente(err) {
    if (err) {
      if (callback) callback(err);
      return;
    }

    if (indice >= sql.length) {
      if (callback) callback(null);
      return;
    }

    db.run(sql[indice], [], function(error) {
      indice += 1;
      siguiente(error);
    });
  }

  siguiente();
}

module.exports = {
  prepararPrintBridge
};
