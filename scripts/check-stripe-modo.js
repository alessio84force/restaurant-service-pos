require("dotenv").config();

function ok(msg) {
  console.log("✅ " + msg);
}

function warn(msg) {
  console.log("⚠️  " + msg);
}

function fail(msg) {
  console.log("❌ " + msg);
}

function env(name) {
  return String(process.env[name] || "").trim();
}

function mask(value) {
  const v = String(value || "");
  if (!v) return "";
  if (v.length <= 12) return "********";
  return v.slice(0, 7) + "********" + v.slice(-4);
}

function modoDesdeKey(key) {
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "desconocido";
}

let errores = 0;
let avisos = 0;

const secretKey = env("STRIPE_SECRET_KEY");
const priceId = env("STRIPE_PRICE_ID");
const webhookSecret = env("STRIPE_WEBHOOK_SECRET");
const appBaseUrl = env("APP_BASE_URL");
const precio = env("PRECIO_MENSUAL");
const liveConfirmado = env("STRIPE_LIVE_CONFIRMADO");

console.log("======================================");
console.log("CHECK STRIPE - RESTAURANT SERVICE POS");
console.log("======================================");

console.log("");
console.log("=== CONFIGURACIÓN ACTUAL ===");

if (!secretKey) {
  fail("STRIPE_SECRET_KEY no configurado");
  errores++;
} else {
  ok("STRIPE_SECRET_KEY configurado: " + mask(secretKey));
}

if (!priceId) {
  fail("STRIPE_PRICE_ID no configurado");
  errores++;
} else {
  ok("STRIPE_PRICE_ID configurado: " + mask(priceId));
}

if (!appBaseUrl) {
  fail("APP_BASE_URL no configurado");
  errores++;
} else {
  ok("APP_BASE_URL: " + appBaseUrl);
}

if (!precio) {
  warn("PRECIO_MENSUAL no configurado");
  avisos++;
} else {
  ok("PRECIO_MENSUAL: " + precio);
}

const modo = modoDesdeKey(secretKey);

console.log("");
console.log("=== MODO DETECTADO ===");
console.log("Modo Stripe:", modo.toUpperCase());

if (modo === "test") {
  ok("Stripe está en modo TEST. No cobra dinero real.");

  if (!appBaseUrl.includes("localhost") && !appBaseUrl.includes("127.0.0.1")) {
    warn("APP_BASE_URL no parece local. Revisa que sea correcto para test.");
    avisos++;
  }
}

if (modo === "live") {
  warn("Stripe está en modo LIVE. Puede cobrar dinero real.");
  avisos++;

  if (liveConfirmado !== "SI") {
    fail("STRIPE_LIVE_CONFIRMADO debe ser SI para permitir pagos reales.");
    errores++;
  } else {
    ok("STRIPE_LIVE_CONFIRMADO=SI");
  }

  if (!appBaseUrl.startsWith("https://")) {
    fail("En modo LIVE, APP_BASE_URL debe empezar por https://");
    errores++;
  } else {
    ok("APP_BASE_URL usa https://");
  }

  if (appBaseUrl.includes("localhost") || appBaseUrl.includes("127.0.0.1")) {
    fail("En modo LIVE, APP_BASE_URL no puede ser localhost.");
    errores++;
  }

  if (!webhookSecret) {
    fail("En modo LIVE, STRIPE_WEBHOOK_SECRET debe estar configurado.");
    errores++;
  } else {
    ok("STRIPE_WEBHOOK_SECRET configurado: " + mask(webhookSecret));
  }
}

if (modo === "desconocido") {
  fail("STRIPE_SECRET_KEY no empieza por sk_test_ ni sk_live_");
  errores++;
}

console.log("");
console.log("=== RESULTADO ===");

if (errores > 0) {
  fail(`CHECK STRIPE NO SUPERADO: ${errores} error(es), ${avisos} aviso(s).`);
  process.exit(1);
}

if (avisos > 0) {
  warn(`CHECK STRIPE SUPERADO CON AVISOS: ${avisos} aviso(s).`);
  process.exit(0);
}

ok("CHECK STRIPE SUPERADO.");
