function eseguiSqlSequenziale(
  db,
  sql,
  callback
) {

  let indice = 0;

  function successivo(err) {

    if (err) {
      if (callback) {
        callback(err);
      }
      return;
    }

    if (indice >= sql.length) {
      if (callback) {
        callback(null);
      }
      return;
    }

    const comando =
      sql[indice];

    indice += 1;

    db.run(
      comando,
      [],
      function(error) {
        successivo(
          error
        );
      }
    );
  }

  successivo();
}


function assicuraColonneStampanti(
  db,
  callback
) {

  db.all(
    "PRAGMA table_info(print_bridge_printers)",
    [],
    function(err, rows) {

      if (err) {
        if (callback) {
          callback(err);
        }
        return;
      }

      const presenti = {};

      (rows || []).forEach(
        function(riga) {

          presenti[
            String(
              riga.name || ""
            )
          ] = true;

        }
      );

      const colonne = [
        {
          nome:
            "marca",
          definizione:
            "TEXT"
        },
        {
          nome:
            "compatibilita",
          definizione:
            "TEXT"
        },
        {
          nome:
            "trasporto",
          definizione:
            "TEXT"
        },
        {
          nome:
            "profilo",
          definizione:
            "TEXT"
        },
        {
          nome:
            "linguaggio",
          definizione:
            "TEXT"
        },
        {
          nome:
            "capacita_json",
          definizione:
            "TEXT"
        },
        {
          nome:
            "ultimo_rilevato_en",
          definizione:
            "TEXT"
        },
        {
          nome:
            "compatibilita_confermata",
          definizione:
            "INTEGER NOT NULL DEFAULT 0"
        },
        {
          nome:
            "compatibilita_confermata_en",
          definizione:
            "TEXT"
        }
      ];

      const mancanti =
        colonne.filter(
          function(colonna) {
            return !presenti[
              colonna.nome
            ];
          }
        );

      const alter =
        mancanti.map(
          function(colonna) {

            return (
              "ALTER TABLE " +
              "print_bridge_printers " +
              "ADD COLUMN " +
              colonna.nome +
              " " +
              colonna.definizione
            );

          }
        );

      eseguiSqlSequenziale(
        db,
        alter,
        callback
      );
    }
  );
}


function prepararPrintBridge(
  db,
  callback
) {

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
    CREATE TABLE IF NOT EXISTS print_bridge_printers (
      restaurante_id INTEGER NOT NULL,
      bridge_id TEXT NOT NULL,
      printer_id TEXT NOT NULL,
      printer_nome TEXT NOT NULL,
      tipo TEXT,
      connessione TEXT,
      uri TEXT,
      stato TEXT NOT NULL DEFAULT 'rilevata',
      ultimo_contacto TEXT NOT NULL,

      marca TEXT,
      compatibilita TEXT,
      trasporto TEXT,
      profilo TEXT,
      linguaggio TEXT,
      capacita_json TEXT,
      ultimo_rilevato_en TEXT,

      compatibilita_confermata INTEGER NOT NULL DEFAULT 0,
      compatibilita_confermata_en TEXT,

      PRIMARY KEY (
        restaurante_id,
        bridge_id,
        printer_id
      )
    )
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_print_bridge_printers_ristorante
    ON print_bridge_printers(
      restaurante_id,
      stato,
      printer_nome
    )
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_print_bridge_jobs_estado
    ON print_bridge_jobs(
      restaurante_id,
      estado,
      id
    )
    `,

    `
    CREATE INDEX IF NOT EXISTS idx_print_bridge_jobs_lease
    ON print_bridge_jobs(
      restaurante_id,
      lease_hasta
    )
    `
  ];

  eseguiSqlSequenziale(
    db,
    sql,
    function(err) {

      if (err) {
        if (callback) {
          callback(err);
        }
        return;
      }

      /*
       * CREATE TABLE IF NOT EXISTS
       * non modifica una tabella gia'
       * esistente.
       *
       * Per i database installati prima
       * di questi metadati aggiungiamo
       * quindi soltanto le colonne
       * effettivamente mancanti.
       */
      assicuraColonneStampanti(
        db,
        callback
      );
    }
  );
}


module.exports = {
  prepararPrintBridge
};
