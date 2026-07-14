const fs = require("fs");
const path = require("path");

let sqlite3;
try {
  sqlite3 = require("sqlite3").verbose();
} catch (e) {
  sqlite3 = require("../server/node_modules/sqlite3").verbose();
}

const passwords = require("../server/utils/passwords");

const ROOT = path.join(__dirname, "..");
const DB_PATH = path.join(ROOT, "database", "restaurant_service.db");
const BACKUP_DIR = path.join(ROOT, "database", "backups");

const OWNER_EMAIL = process.env.RESET_OWNER_EMAIL || "alessio84force@gmail.com";
const OWNER_NAME = process.env.RESET_OWNER_NAME || "Alessio";
const OWNER_PASSWORD = process.env.RESET_OWNER_PASSWORD || "";
const RESTAURANT_NAME = process.env.RESET_RESTAURANT_NAME || "Restaurant Service POS";

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
}

function backupDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error("No existe database/restaurant_service.db");
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const backupPath = path.join(
    BACKUP_DIR,
    `restaurant_service.pre-reset-produccion-${timestamp()}.db`
  );

  fs.copyFileSync(DB_PATH, backupPath);
  return backupPath;
}

const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function(err, rows) {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function tableExists(name) {
  const rows = await all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [name]
  );
  return rows.length > 0;
}

async function columns(table) {
  if (!(await tableExists(table))) return [];
  const rows = await all("PRAGMA table_info(" + table + ")");
  return rows.map(r => r.name);
}

async function deleteTable(table) {
  if (await tableExists(table)) {
    await run("DELETE FROM " + table);
    console.log("Limpio:", table);
  }
}

async function resetSequence(table) {
  if (await tableExists("sqlite_sequence")) {
    await run("DELETE FROM sqlite_sequence WHERE name=?", [table]);
  }
}

async function countTable(table) {
  if (!(await tableExists(table))) return null;
  const rows = await all("SELECT COUNT(*) AS total FROM " + table);
  return rows[0] ? rows[0].total : 0;
}

async function resetProduccion() {
  console.log("===== RESET PRODUCCION RESTAURANT SERVICE POS =====");

  const backupPath = backupDatabase();
  console.log("Backup creado:", backupPath);

  await run("BEGIN TRANSACTION");

  try {
    const limpiarTodo = [
      "pedido_lineas",
      "pagos",
      "pagos_multiples",
      "pedidos",
      "cierres_caja",
      "reservas",
      "creador_pagos",
      "creador_clientes",
      "stripe_eventos"
    ];

    for (const table of limpiarTodo) {
      await deleteTable(table);
      await resetSequence(table);
    }

    if (await tableExists("usuarios")) {
      const existentes = await all(
        "SELECT id FROM usuarios WHERE LOWER(email)=LOWER(?) LIMIT 1",
        [OWNER_EMAIL]
      );

      await run(
        "DELETE FROM usuarios WHERE LOWER(email) <> LOWER(?)",
        [OWNER_EMAIL]
      );

      if (existentes.length > 0) {
        await run(
          "UPDATE usuarios SET nombre=?, rol='admin', activo=1 WHERE LOWER(email)=LOWER(?)",
          [OWNER_NAME, OWNER_EMAIL]
        );
      } else {
        if (!OWNER_PASSWORD) {
          throw new Error("No existe el usuario owner y falta RESET_OWNER_PASSWORD para crearlo.");
        }

        await run(
          "INSERT INTO usuarios(nombre,email,password,rol,activo,creado_en) VALUES(?,?,?,?,1,?)",
          [OWNER_NAME, OWNER_EMAIL, passwords.hashPassword(OWNER_PASSWORD), "admin", new Date().toISOString()]
        );
      }

      console.log("Usuarios limpiados. Se mantiene:", OWNER_EMAIL);
    }

    if (await tableExists("configurazione")) {
      const cols = await columns("configurazione");
      const updates = [];
      const params = [];

      function setIf(col, value) {
        if (cols.includes(col)) {
          updates.push(col + "=?");
          params.push(value);
        }
      }

      setIf("nome_ristorante", RESTAURANT_NAME);
      setIf("partita_iva", "");
      setIf("indirizzo", "");
      setIf("telefono", "");
      setIf("email", "");
      setIf("propietario_nombre", OWNER_NAME);
      setIf("propietario_email", OWNER_EMAIL);
      setIf("propietario_telefono", "");
      setIf("suscripcion_estado", "gratis_vida");
      setIf("trial_inicio", null);
      setIf("trial_fin", null);
      setIf("plan_tipo", "gratis_vida");
      setIf("promocion_aplicada", "CODICE ALESSIO");
      setIf("stripe_customer_id", null);
      setIf("stripe_subscription_id", null);
      setIf("stripe_checkout_session_id", null);
      setIf("ultimo_pago_stripe_en", null);
      setIf("proximo_pago_stripe_en", null);

      if (updates.length) {
        params.push(1);
        await run(
          "UPDATE configurazione SET " + updates.join(", ") + " WHERE id=?",
          params
        );
        console.log("Configuración limpiada.");
      }
    }

    if (await tableExists("mesas")) {
      const cols = await columns("mesas");
      const updates = [];

      if (cols.includes("estado")) updates.push("estado='libre'");
      if (cols.includes("ocupada")) updates.push("ocupada=0");
      if (cols.includes("pedido_id")) updates.push("pedido_id=NULL");
      if (cols.includes("pedido_abierto_id")) updates.push("pedido_abierto_id=NULL");
      if (cols.includes("total")) updates.push("total=0");

      if (updates.length) {
        await run("UPDATE mesas SET " + updates.join(", "));
        console.log("Mesas libres.");
      }
    }

    await run("COMMIT");

    console.log("");
    console.log("===== RESUMEN FINAL =====");

    const tablas = [
      "usuarios",
      "pedidos",
      "pedido_lineas",
      "pagos",
      "cierres_caja",
      "reservas",
      "creador_pagos",
      "creador_clientes"
    ];

    for (const table of tablas) {
      const total = await countTable(table);
      if (total !== null) {
        console.log(table + ":", total);
      }
    }

    console.log("");
    console.log("OK reset producción completado.");
  } catch (err) {
    await run("ROLLBACK");
    console.error("ERROR reset producción:", err.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

resetProduccion();
