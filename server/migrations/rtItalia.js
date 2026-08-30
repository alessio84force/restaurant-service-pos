function all(db, sql, params) {
  return new Promise(function(resolve, reject) {
    db.all(sql, params || [], function(err, rows) {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function run(db, sql, params) {
  return new Promise(function(resolve, reject) {
    db.run(sql, params || [], function(err) {
      if (err) return reject(err);
      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

async function asegurarColumnasTabla(db, tabla, columnas) {
  const rows = await all(
    db,
    "PRAGMA table_info(" + tabla + ")",
    []
  );

  if (!rows.length) {
    throw new Error(
      "Tabla no encontrada durante migracion RT: " + tabla
    );
  }

  const existentes = rows.map(function(row) {
    return row.name;
  });

  for (const columna of columnas) {
    if (existentes.includes(columna.nombre)) {
      continue;
    }

    await run(
      db,
      "ALTER TABLE " +
        tabla +
        " ADD COLUMN " +
        columna.nombre +
        " " +
        columna.definicion,
      []
    );

    console.log(
      "[RT Italia] Columna creada: " +
        tabla +
        "." +
        columna.nombre
    );
  }
}

async function prepararRtItalia(db) {
  await asegurarColumnasTabla(
    db,
    "productos",
    [
      {
        nombre: "iva",
        definicion: "REAL"
      }
    ]
  );

  await asegurarColumnasTabla(
    db,
    "pedido_lineas",
    [
      {
        nombre: "iva",
        definicion: "REAL"
      },
      {
        nombre: "nombre_producto",
        definicion: "TEXT"
      }
    ]
  );

  await asegurarColumnasTabla(
    db,
    "pedidos",
    [
      {
        nombre: "rt_estado",
        definicion: "TEXT DEFAULT 'no_requerido'"
      },
      {
        nombre: "rt_documento_id",
        definicion: "TEXT"
      },
      {
        nombre: "rt_emitido_en",
        definicion: "TEXT"
      },
      {
        nombre: "rt_ultimo_error",
        definicion: "TEXT"
      },
      {
        nombre: "rt_idempotency_key",
        definicion: "TEXT"
      },
      {
        nombre: "rt_enviando_desde",
        definicion: "TEXT"
      }
    ]
  );

  await asegurarColumnasTabla(
    db,
    "configurazione",
    [
      {
        nombre: "rt_activo",
        definicion: "INTEGER DEFAULT 0"
      },
      {
        nombre: "rt_modo",
        definicion: "TEXT DEFAULT 'simulacion'"
      },
      {
        nombre: "rt_fabricante",
        definicion: "TEXT DEFAULT ''"
      },
      {
        nombre: "rt_modelo",
        definicion: "TEXT DEFAULT ''"
      }
    ]
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS rt_eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurante_id INTEGER NOT NULL,
      pedido_id INTEGER NOT NULL,
      usuario_id INTEGER,
      tipo TEXT NOT NULL,
      estado_anterior TEXT,
      estado_nuevo TEXT,
      documento_id TEXT,
      idempotency_key TEXT,
      nota TEXT,
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    []
  );

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_rt_eventos_pedido
     ON rt_eventos(restaurante_id, pedido_id, id)`,
    []
  );

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_rt_eventos_fecha
     ON rt_eventos(restaurante_id, creado_en)`,
    []
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS rt_mapeo_pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurante_id INTEGER NOT NULL,
      fabricante TEXT NOT NULL,
      metodo_pos TEXT NOT NULL,
      metodo_rt_id TEXT NOT NULL,
      metodo_rt_nombre TEXT,
      actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(restaurante_id, fabricante, metodo_pos)
    )`,
    []
  );

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_rt_mapeo_pagos_restaurante
     ON rt_mapeo_pagos(restaurante_id, fabricante)`,
    []
  );

  console.log(
    "[RT Italia] Schema RT preparado correctamente"
  );
}

module.exports = {
  prepararRtItalia
};
