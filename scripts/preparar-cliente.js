const fs = require("fs");
const path = require("path");

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith("--")) continue;

    const clean = arg.slice(2);

    if (clean.includes("=")) {
      const [key, ...rest] = clean.split("=");
      out[key] = rest.join("=");
    } else {
      const key = clean;
      const next = args[i + 1];

      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = "si";
      }
    }
  }

  return out;
}

const args = parseArgs();

function mostrarAyuda() {
  console.log(`
===== PREPARAR CLIENTE REAL =====

Uso:

npm run preparar-cliente -- \\
  --restaurante "Nombre del restaurante" \\
  --propietario "Nombre propietario" \\
  --email "email@restaurante.com" \\
  --password "contraseña-inicial" \\
  --telefono "600000000" \\
  --direccion "Dirección del restaurante" \\
  --nif "NIF/CIF" \\
  --promo ""

Códigos promo aceptados:
- BOADILLA COMERCIO  => 14 días de prueba
- CODICE ALESSIO    => gratis de por vida
- sin promo         => 7 días de prueba

Ejemplo:

npm run preparar-cliente -- \\
  --restaurante "Bar Ejemplo" \\
  --propietario "Juan Pérez" \\
  --email "juan@barejemplo.com" \\
  --password "1234" \\
  --telefono "600000000" \\
  --direccion "Calle Mayor 1" \\
  --nif "B00000000" \\
  --promo "BOADILLA COMERCIO"
`);
}

if (args.help || args.ayuda || args.h) {
  mostrarAyuda();
  process.exit(0);
}

function normalizarCodigo(codigo) {
  return String(codigo || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function validarPromo(codigo) {
  const c = normalizarCodigo(codigo);

  if (!c) {
    return {
      codigo: "",
      tipo: "trial",
      dias: 7,
      estado: "trial",
      plan: "trial",
      descripcion: "Prueba gratuita 7 días"
    };
  }

  if (c === "BOADILLA COMERCIO") {
    return {
      codigo: "BOADILLA COMERCIO",
      tipo: "trial_extra",
      dias: 14,
      estado: "trial",
      plan: "trial",
      descripcion: "Prueba gratuita 14 días"
    };
  }

  if (c === "CODICE ALESSIO") {
    return {
      codigo: "CODICE ALESSIO",
      tipo: "gratis_vida",
      dias: 0,
      estado: "gratis_vida",
      plan: "gratis_vida",
      descripcion: "Gratis de por vida"
    };
  }

  return null;
}

function getValue(argName, envName, fallback = "") {
  return String(args[argName] || process.env[envName] || fallback).trim();
}

const RESTAURANTE = getValue("restaurante", "CLIENTE_RESTAURANTE");
const PROPIETARIO = getValue("propietario", "CLIENTE_PROPIETARIO");
const EMAIL = getValue("email", "CLIENTE_EMAIL").toLowerCase();
const PASSWORD = getValue("password", "CLIENTE_PASSWORD");
const TELEFONO = getValue("telefono", "CLIENTE_TELEFONO");
const DIRECCION = getValue("direccion", "CLIENTE_DIRECCION");
const NIF = getValue("nif", "CLIENTE_NIF");
const PROMO_RAW = getValue("promo", "CLIENTE_PROMO");

if (!RESTAURANTE || !PROPIETARIO || !EMAIL || !PASSWORD) {
  console.error("Faltan datos obligatorios.");
  mostrarAyuda();
  process.exit(1);
}

if (!EMAIL.includes("@")) {
  console.error("Email no válido:", EMAIL);
  process.exit(1);
}

if (PASSWORD.length < 4) {
  console.error("La contraseña debe tener mínimo 4 caracteres.");
  process.exit(1);
}

const promo = validarPromo(PROMO_RAW);

if (!promo) {
  console.error("Código promocional no válido:", PROMO_RAW);
  process.exit(1);
}

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
    `restaurant_service.pre-cliente-real-${timestamp()}.db`
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

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

async function countTable(table) {
  if (!(await tableExists(table))) return null;
  const rows = await all("SELECT COUNT(*) AS total FROM " + table);
  return rows[0] ? rows[0].total : 0;
}

async function prepararCliente() {
  console.log("===== PREPARAR CLIENTE REAL =====");

  const backupPath = backupDatabase();
  console.log("Backup creado:", backupPath);

  const ahora = new Date();
  const trialInicio = promo.tipo === "gratis_vida" ? null : ahora.toISOString();
  const trialFin = promo.tipo === "gratis_vida" ? null : addDays(ahora, promo.dias).toISOString();
  const activadaEn = promo.tipo === "gratis_vida" ? ahora.toISOString() : null;

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
      await run("DELETE FROM usuarios");
      await resetSequence("usuarios");

      await run(
        "INSERT INTO usuarios(nombre,email,password,rol,activo,creado_en) VALUES(?,?,?,?,1,?)",
        [PROPIETARIO, EMAIL, passwords.hashPassword(PASSWORD), "admin", ahora.toISOString()]
      );

      console.log("Admin cliente creado:", EMAIL);
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

      setIf("nome_ristorante", RESTAURANTE);
      setIf("partita_iva", NIF);
      setIf("indirizzo", DIRECCION);
      setIf("telefono", TELEFONO);
      setIf("email", EMAIL);
      setIf("propietario_nombre", PROPIETARIO);
      setIf("propietario_email", EMAIL);
      setIf("propietario_telefono", TELEFONO);
      setIf("suscripcion_estado", promo.estado);
      setIf("trial_inicio", trialInicio);
      setIf("trial_fin", trialFin);
      setIf("plan_tipo", promo.plan);
      setIf("promocion_aplicada", promo.codigo);
      setIf("suscripcion_activada_en", activadaEn);
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
      }

      console.log("Configuración cliente actualizada.");
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
    console.log("===== CLIENTE PREPARADO =====");
    console.log("Restaurante:", RESTAURANTE);
    console.log("Propietario:", PROPIETARIO);
    console.log("Email login:", EMAIL);
    console.log("Contraseña inicial: configurada");
    console.log("Suscripción:", promo.descripcion);

    if (trialFin) {
      console.log("Trial hasta:", trialFin);
    }

    console.log("");
    console.log("===== RESUMEN DATABASE =====");

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
    console.log("OK primer cliente real preparado.");
  } catch (err) {
    await run("ROLLBACK");
    console.error("ERROR preparando cliente:", err.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

prepararCliente();
