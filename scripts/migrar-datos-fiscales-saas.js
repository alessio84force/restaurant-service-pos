const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "database", "restaurant_service.db");
const db = new sqlite3.Database(dbPath);

function all(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], function(err, rows) {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function run(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

async function columnas(tabla) {
  const rows = await all("PRAGMA table_info(" + tabla + ")", []);
  return rows.map((r) => r.name);
}

async function addColumn(tabla, columna, definicion) {
  const cols = await columnas(tabla);
  if (cols.includes(columna)) {
    console.log("OK:", tabla + "." + columna);
    return;
  }

  await run("ALTER TABLE " + tabla + " ADD COLUMN " + columna + " " + definicion);
  console.log("ADD:", tabla + "." + columna);
}

async function main() {
  console.log("DB:", dbPath);

  await addColumn("restaurantes", "razon_social", "TEXT");
  await addColumn("restaurantes", "codigo_postal", "TEXT");
  await addColumn("restaurantes", "ciudad", "TEXT");
  await addColumn("restaurantes", "provincia", "TEXT");
  await addColumn("restaurantes", "pais", "TEXT DEFAULT 'España'");
  await addColumn("restaurantes", "email_facturacion", "TEXT");
  await addColumn("restaurantes", "datos_fiscales_completos", "INTEGER DEFAULT 0");

  await addColumn("configurazione", "razon_social", "TEXT");
  await addColumn("configurazione", "codigo_postal", "TEXT");
  await addColumn("configurazione", "ciudad", "TEXT");
  await addColumn("configurazione", "provincia", "TEXT");
  await addColumn("configurazione", "pais", "TEXT DEFAULT 'España'");
  await addColumn("configurazione", "email_facturacion", "TEXT");
  await addColumn("configurazione", "datos_fiscales_completos", "INTEGER DEFAULT 0");

  await run(`
    UPDATE restaurantes
    SET razon_social = COALESCE(NULLIF(razon_social,''), nombre),
        email_facturacion = COALESCE(NULLIF(email_facturacion,''), propietario_email),
        pais = COALESCE(NULLIF(pais,''), 'España')
  `);

  await run(`
    UPDATE configurazione
    SET razon_social = COALESCE(NULLIF(razon_social,''), nome_ristorante),
        email_facturacion = COALESCE(NULLIF(email_facturacion,''), email, propietario_email),
        pais = COALESCE(NULLIF(pais,''), 'España')
  `);

  await run(`
    UPDATE configurazione
    SET datos_fiscales_completos =
      CASE
        WHEN COALESCE(NULLIF(razon_social,''), NULLIF(nome_ristorante,'')) IS NOT NULL
         AND COALESCE(NULLIF(partita_iva,''), '') <> ''
         AND COALESCE(NULLIF(indirizzo,''), '') <> ''
         AND COALESCE(NULLIF(codigo_postal,''), '') <> ''
         AND COALESCE(NULLIF(ciudad,''), '') <> ''
         AND COALESCE(NULLIF(provincia,''), '') <> ''
         AND COALESCE(NULLIF(pais,''), '') <> ''
         AND COALESCE(NULLIF(email_facturacion,''), NULLIF(email,''), NULLIF(propietario_email,'')) IS NOT NULL
        THEN 1
        ELSE 0
      END
  `);

  await run(`
    UPDATE restaurantes
    SET datos_fiscales_completos =
      CASE
        WHEN COALESCE(NULLIF(razon_social,''), NULLIF(nombre,'')) IS NOT NULL
         AND COALESCE(NULLIF(nif,''), '') <> ''
         AND COALESCE(NULLIF(direccion,''), '') <> ''
         AND COALESCE(NULLIF(codigo_postal,''), '') <> ''
         AND COALESCE(NULLIF(ciudad,''), '') <> ''
         AND COALESCE(NULLIF(provincia,''), '') <> ''
         AND COALESCE(NULLIF(pais,''), '') <> ''
         AND COALESCE(NULLIF(email_facturacion,''), NULLIF(propietario_email,'')) IS NOT NULL
        THEN 1
        ELSE 0
      END
  `);

  console.log("OK: datos fiscales migrados");
}

main()
  .then(() => db.close())
  .catch((err) => {
    console.error("ERROR:", err.message);
    db.close();
    process.exit(1);
  });
