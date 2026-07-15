require("dotenv").config();

let sqlite3;

try {
  sqlite3 = require("sqlite3").verbose();
} catch (e) {
  sqlite3 = require("../server/node_modules/sqlite3").verbose();
}

const path = require("path");
const { enviarEmailEvento } = require("../server/services/emailService");

const DB_PATH = path.join(__dirname, "..", "database", "restaurant_service.db");
const db = new sqlite3.Database(DB_PATH);

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    const next = args[i + 1];

    if (next && !next.startsWith("--")) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }

  return out;
}

const args = parseArgs();
const DIAS_AVISO = Number(args.dias || process.env.TRIAL_AVISO_DIAS || 2);
const FORZAR = Boolean(args.forzar || args.force);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function(err, row) {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

async function asegurarColumna() {
  const columnas = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(configurazione)", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  const nombres = columnas.map((c) => c.name);

  if (!nombres.includes("trial_expira_email_enviado_en")) {
    await run("ALTER TABLE configurazione ADD COLUMN trial_expira_email_enviado_en TEXT");
  }
}

function diasRestantes(trialFin) {
  if (!trialFin) return null;

  const fecha = new Date(trialFin);

  if (isNaN(fecha.getTime())) return null;

  return Math.ceil((fecha.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function enviarTrialExpira() {
  return new Promise((resolve) => {
    enviarEmailEvento(db, "trial_expira", {}, (err, resultado) => {
      if (err) {
        console.log("[EMAIL TRIAL EXPIRA] no generado:", err.message);
        return resolve(false);
      }

      console.log("[EMAIL TRIAL EXPIRA] generado:", resultado && resultado.ruta_txt ? resultado.ruta_txt : "ok");
      resolve(true);
    });
  });
}

async function main() {
  console.log("===== AVISO TRIAL A PUNTO DE CADUCAR =====");

  await asegurarColumna();

  const config = await get("SELECT * FROM configurazione WHERE id=1");

  if (!config) {
    console.log("No existe configuración principal.");
    return;
  }

  const estado = String(config.suscripcion_estado || "").trim().toLowerCase();
  const dias = diasRestantes(config.trial_fin);

  console.log("Restaurante:", config.nome_ristorante || "Restaurant Service POS");
  console.log("Email:", config.propietario_email || config.email || "sin email");
  console.log("Estado:", estado || "sin estado");
  console.log("Trial fin:", config.trial_fin || "sin fecha");
  console.log("Días restantes:", dias === null ? "no calculable" : dias);
  console.log("Aviso si quedan <=", DIAS_AVISO, "días");
  console.log("Forzar:", FORZAR ? "sí" : "no");

  if (estado !== "trial" && estado !== "prueba") {
    console.log("No se envía: la cuenta no está en prueba gratuita.");
    return;
  }

  if (dias === null) {
    console.log("No se envía: fecha trial_fin no válida.");
    return;
  }

  if (dias < 0) {
    console.log("No se envía: la prueba ya está caducada.");
    return;
  }

  if (dias > DIAS_AVISO && !FORZAR) {
    console.log("No se envía: todavía faltan más días.");
    return;
  }

  if (config.trial_expira_email_enviado_en && !FORZAR) {
    console.log("No se envía: el aviso ya fue enviado en", config.trial_expira_email_enviado_en);
    return;
  }

  const enviado = await enviarTrialExpira();

  if (enviado) {
    await run(
      "UPDATE configurazione SET trial_expira_email_enviado_en=datetime('now') WHERE id=1"
    );

    console.log("Aviso marcado como enviado.");
  }
}

main()
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exitCode = 1;
  })
  .finally(() => {
    db.close();
  });
