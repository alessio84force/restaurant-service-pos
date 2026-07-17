require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DB_PATH = path.join(process.cwd(), "database", "restaurant_service.db");

function ok(msg) {
  console.log("✅ " + msg);
}

function warn(msg) {
  console.log("⚠️  " + msg);
}

function fail(msg) {
  console.log("❌ " + msg);
}

function mask(value) {
  const v = String(value || "");
  if (!v) return "";
  if (v.length <= 8) return "********";
  return v.slice(0, 4) + "********" + v.slice(-4);
}

function env(name) {
  return String(process.env[name] || "").trim();
}

function checkEnv(name, label, required, secret) {
  const value = env(name);

  if (!value) {
    if (required) {
      fail(label + " no configurado");
      return "error";
    }

    warn(label + " no configurado");
    return "warning";
  }

  if (secret) ok(label + " configurado: " + mask(value));
  else ok(label + " configurado: " + value);

  return "ok";
}

function sqlite(sql) {
  try {
    return execFileSync("sqlite3", ["-batch", "-noheader", "-separator", "\t", DB_PATH, sql], {
      encoding: "utf8"
    }).trim();
  } catch (e) {
    return "";
  }
}

function tableExists(name) {
  const safe = String(name).replace(/'/g, "''");
  return sqlite(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='${safe}';`) === "1";
}

function columnasTabla(tabla) {
  const out = sqlite(`PRAGMA table_info(${tabla});`);
  if (!out) return [];

  return out
    .split("\n")
    .filter(Boolean)
    .map((linea) => linea.split("\t")[1])
    .filter(Boolean);
}

function primeraColumna(columnas, opciones) {
  for (const opcion of opciones) {
    if (columnas.includes(opcion)) return opcion;
  }
  return "";
}

function valorConfig(columna) {
  if (!columna) return "";
  return sqlite(`SELECT COALESCE(${columna}, '') FROM configurazione WHERE id=1;`);
}

function getConfig() {
  if (!tableExists("configurazione")) return null;

  const id = sqlite("SELECT id FROM configurazione WHERE id=1;");
  if (id !== "1") return null;

  const cols = columnasTabla("configurazione");

  const colRestaurante = primeraColumna(cols, ["nome_ristorante", "nombre_restaurante", "restaurante_nombre", "nombre"]);
  const colPropietario = primeraColumna(cols, ["propietario_nombre", "nombre_propietario", "propietario"]);
  const colEmail = primeraColumna(cols, ["propietario_email", "email_cliente", "email"]);
  const colEstado = primeraColumna(cols, ["suscripcion_estado"]);
  const colPlan = primeraColumna(cols, ["plan_tipo"]);
  const colPromo = primeraColumna(cols, ["promocion_aplicada", "codigo_promocional"]);

  return {
    restaurante: valorConfig(colRestaurante),
    propietario: valorConfig(colPropietario),
    email: valorConfig(colEmail),
    estado: valorConfig(colEstado),
    plan: valorConfig(colPlan),
    promo: valorConfig(colPromo)
  };
}

function getUsuarios() {
  if (!tableExists("usuarios")) return [];

  const out = sqlite("SELECT id,email,rol,activo FROM usuarios ORDER BY id;");
  if (!out) return [];

  return out.split("\n").filter(Boolean).map((linea) => {
    const p = linea.split("\t");
    return {
      id: p[0] || "",
      email: p[1] || "",
      rol: p[2] || "",
      activo: p[3] || ""
    };
  });
}

function countTable(tabla) {
  if (!tableExists(tabla)) return null;
  const n = Number(sqlite(`SELECT COUNT(*) FROM ${tabla};`));
  return Number.isFinite(n) ? n : null;
}

function main() {
  let errores = 0;
  let avisos = 0;

  function reqEnv(name, label, secret) {
    const r = checkEnv(name, label, true, secret);
    if (r === "error") errores++;
  }

  function optEnv(name, label, secret) {
    const r = checkEnv(name, label, false, secret);
    if (r === "warning") avisos++;
  }

  console.log("========================================");
  console.log("CHECK PRODUCCIÓN - RESTAURANT SERVICE POS");
  console.log("========================================");

  console.log("");
  console.log("=== 1. ARCHIVOS BASE ===");

  if (fs.existsSync(".env")) ok(".env existe");
  else {
    fail(".env no existe");
    errores++;
  }

  if (fs.existsSync(DB_PATH)) ok("database/restaurant_service.db existe");
  else {
    fail("database/restaurant_service.db no existe");
    errores++;
  }

  if (fs.existsSync(".gitignore")) {
    ok(".gitignore existe");

    const gi = fs.readFileSync(".gitignore", "utf8");

    if (gi.includes(".env")) ok(".env protegido en .gitignore");
    else {
      fail(".env no aparece en .gitignore");
      errores++;
    }

    if (gi.includes("prints/emails")) ok("prints/emails protegido en .gitignore");
    else {
      warn("prints/emails no aparece en .gitignore");
      avisos++;
    }
  } else {
    fail(".gitignore no existe");
    errores++;
  }

  console.log("");
  console.log("=== 2. EMAIL ===");

  reqEnv("EMAIL_PROVIDER", "EMAIL_PROVIDER", false);
  reqEnv("EMAIL_FROM", "EMAIL_FROM", false);
  reqEnv("EMAIL_REPLY_TO", "EMAIL_REPLY_TO", false);
  reqEnv("RESEND_API_KEY", "RESEND_API_KEY", true);

  console.log("");
  console.log("=== 3. STRIPE ===");

  reqEnv("STRIPE_SECRET_KEY", "STRIPE_SECRET_KEY", true);
  reqEnv("STRIPE_PRICE_ID", "STRIPE_PRICE_ID", true);
  optEnv("STRIPE_WEBHOOK_SECRET", "STRIPE_WEBHOOK_SECRET", true);
  reqEnv("APP_BASE_URL", "APP_BASE_URL", false);
  reqEnv("PRECIO_MENSUAL", "PRECIO_MENSUAL", false);

  console.log("");
  console.log("=== 4. DATOS LEGALES ===");

  reqEnv("LEGAL_NOMBRE_COMERCIAL", "LEGAL_NOMBRE_COMERCIAL", false);
  reqEnv("LEGAL_TITULAR_NOMBRE", "LEGAL_TITULAR_NOMBRE", false);
  reqEnv("LEGAL_TITULAR_NIF", "LEGAL_TITULAR_NIF", true);
  reqEnv("LEGAL_FORMA_JURIDICA", "LEGAL_FORMA_JURIDICA", false);
  reqEnv("LEGAL_DOMICILIO_FISCAL", "LEGAL_DOMICILIO_FISCAL", true);
  reqEnv("LEGAL_EMAIL", "LEGAL_EMAIL", false);
  reqEnv("LEGAL_SOPORTE", "LEGAL_SOPORTE", false);
  reqEnv("LEGAL_DOMINIO", "LEGAL_DOMINIO", false);

  console.log("");
  console.log("=== 5. ARCHIVOS IMPORTANTES ===");

  [
    "server/routes/legalProfesional.js",
    "server/middleware/registroLegal.js",
    "server/middleware/legalLinksGlobal.js",
    "server/routes/panelSuscripcionProfesional.js",
    "server/routes/stripeSuscripcion.js",
    "server/services/emailService.js",
    "server/services/emailTemplates.js",
    "scripts/preparar-cliente.js",
    "scripts/reset-produccion.js"
  ].forEach((archivo) => {
    if (fs.existsSync(archivo)) ok(archivo + " existe");
    else {
      fail(archivo + " no existe");
      errores++;
    }
  });

  console.log("");
  console.log("=== 6. DATABASE CONFIGURACIÓN ===");

  const config = getConfig();

  if (!config) {
    fail("No existe configurazione id=1");
    errores++;
  } else {
    ok("configurazione id=1 existe");
    console.log("Restaurante actual:", config.restaurante || "(vacío)");
    console.log("Propietario:", config.propietario || "(vacío)");
    console.log("Email:", config.email || "(vacío)");
    console.log("Estado suscripción:", config.estado || "(vacío)");
    console.log("Plan:", config.plan || "(vacío)");
    console.log("Promoción:", config.promo || "(vacío)");

    if (!config.restaurante) {
      warn("Nombre restaurante vacío");
      avisos++;
    }

    if (!config.email) {
      warn("Propietario email vacío");
      avisos++;
    }
  }

  console.log("");
  console.log("=== 7. USUARIOS ===");

  const usuarios = getUsuarios();

  if (!tableExists("usuarios")) {
    fail("Tabla usuarios no existe");
    errores++;
  } else if (!usuarios.length) {
    fail("No hay usuarios");
    errores++;
  } else {
    ok("Usuarios encontrados: " + usuarios.length);
    usuarios.forEach((u) => {
      console.log(`- ${u.email} | rol=${u.rol} | activo=${u.activo}`);
    });
  }

  console.log("");
  console.log("=== 8. DATOS OPERATIVOS / TEST ===");

  [
    "pedidos",
    "pedido_lineas",
    "pagos",
    "pagos_multiples",
    "cierres_caja",
    "reservas",
    "creador_clientes",
    "creador_pagos",
    "stripe_eventos",
    "aceptaciones_legales"
  ].forEach((tabla) => {
    const n = countTable(tabla);

    if (n === null) {
      ok(`${tabla}: no creada todavía`);
    } else if (n === 0) {
      ok(`${tabla}: 0 registros`);
    } else {
      warn(`${tabla}: ${n} registros`);
      avisos++;
    }
  });

  console.log("");
  console.log("=== 9. RESULTADO ===");

  if (errores > 0) {
    fail(`CHECK NO SUPERADO: ${errores} error(es), ${avisos} aviso(s).`);
    process.exit(1);
  }

  if (avisos > 0) {
    warn(`CHECK SUPERADO CON AVISOS: ${avisos} aviso(s).`);
    process.exit(0);
  }

  ok("CHECK SUPERADO: sistema preparado para primer cliente.");
}

main();
