const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "database", "restaurant_service.db");
const BACKUP_DIR = path.join(process.cwd(), "database", "backups");

function runSql(sql) {
  return execFileSync("sqlite3", [DB_PATH, sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function tableExists(table) {
  const safe = String(table).replace(/'/g, "''");
  const out = runSql(`SELECT name FROM sqlite_master WHERE type='table' AND name='${safe}';`);
  return out === table;
}

function columnExists(table, column) {
  if (!tableExists(table)) return false;

  const out = runSql(`PRAGMA table_info(${table});`);
  return out
    .split(/\r?\n/)
    .filter(Boolean)
    .some((line) => {
      const parts = line.split("|");
      return parts[1] === column;
    });
}

function addColumnIfMissing(table, column, definition) {
  if (!tableExists(table)) {
    console.log(`- ${table}: no existe, salto`);
    return;
  }

  if (columnExists(table, column)) {
    console.log(`- ${table}.${column}: ya existe`);
    return;
  }

  runSql(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  console.log(`- ${table}.${column}: añadido`);
}

function execQuiet(sql) {
  runSql(sql);
}

function backupDb() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "-" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds());

  const destino = path.join(BACKUP_DIR, `pre-multi-restaurante-${stamp}.db`);
  fs.copyFileSync(DB_PATH, destino);

  return destino;
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("No existe database/restaurant_service.db");
    process.exit(1);
  }

  console.log("Creando backup antes de migrar...");
  const backup = backupDb();
  console.log("Backup creado:", backup);

  console.log("");
  console.log("Creando tabla restaurantes...");

  execQuiet(`
    CREATE TABLE IF NOT EXISTS restaurantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      propietario_nombre TEXT,
      propietario_email TEXT,
      propietario_telefono TEXT,
      nif TEXT,
      direccion TEXT,
      estado TEXT DEFAULT 'trial',
      trial_inicio TEXT,
      trial_fin TEXT,
      plan_tipo TEXT DEFAULT 'trial',
      promocion_aplicada TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      creado_en TEXT DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Tabla restaurantes OK.");

  console.log("");
  console.log("Creando restaurante base id=1 desde configurazione...");

  execQuiet(`
    INSERT OR IGNORE INTO restaurantes (
      id,
      nombre,
      propietario_nombre,
      propietario_email,
      propietario_telefono,
      nif,
      direccion,
      estado,
      trial_inicio,
      trial_fin,
      plan_tipo,
      promocion_aplicada,
      stripe_customer_id,
      stripe_subscription_id
    )
    SELECT
      1,
      COALESCE(nome_ristorante, 'Restaurant Service POS'),
      COALESCE(propietario_nombre, ''),
      COALESCE(propietario_email, email, ''),
      COALESCE(propietario_telefono, telefono, ''),
      COALESCE(partita_iva, ''),
      COALESCE(indirizzo, ''),
      COALESCE(suscripcion_estado, 'trial'),
      trial_inicio,
      trial_fin,
      COALESCE(plan_tipo, 'trial'),
      promocion_aplicada,
      stripe_customer_id,
      stripe_subscription_id
    FROM configurazione
    WHERE id=1;
  `);

  console.log("Restaurante base OK.");

  console.log("");
  console.log("Añadiendo restaurante_id a tablas principales...");

  const tablas = [
    "configurazione",
    "usuarios",
    "zonas",
    "mesas",
    "categorias",
    "productos",
    "pedidos",
    "pedido_lineas",
    "pagos",
    "pagos_multiples",
    "destinos_comanda",
    "comanda_envios_linea",
    "cierres_caja",
    "reservas",
    "variantes",
    "opciones_variante",
    "modificadores",
    "pedido_linea_modificadores"
  ];

  for (const tabla of tablas) {
    addColumnIfMissing(tabla, "restaurante_id", "INTEGER DEFAULT 1");
  }

  console.log("");
  console.log("Asignando restaurante_id=1 a datos existentes...");

  for (const tabla of tablas) {
    if (!tableExists(tabla)) continue;
    if (!columnExists(tabla, "restaurante_id")) continue;

    execQuiet(`UPDATE ${tabla} SET restaurante_id=1 WHERE restaurante_id IS NULL;`);
    console.log(`- ${tabla}: datos asignados a restaurante_id=1`);
  }

  console.log("");
  console.log("Creando índices básicos...");

  for (const tabla of tablas) {
    if (!tableExists(tabla)) continue;
    if (!columnExists(tabla, "restaurante_id")) continue;

    const idx = `idx_${tabla}_restaurante_id`;
    execQuiet(`CREATE INDEX IF NOT EXISTS ${idx} ON ${tabla}(restaurante_id);`);
    console.log(`- ${idx}: OK`);
  }

  console.log("");
  console.log("Resumen:");
  console.log("restaurantes:", runSql("SELECT COUNT(*) FROM restaurantes;"));
  console.log("usuarios con restaurante_id:", runSql("SELECT COUNT(*) FROM usuarios WHERE restaurante_id IS NOT NULL;"));
  console.log("configurazione restaurante_id:", runSql("SELECT restaurante_id FROM configurazione WHERE id=1;"));

  console.log("");
  console.log("MIGRACIÓN MULTI-RESTAURANTE BASE COMPLETADA.");
}

main();
