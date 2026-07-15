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

function enviar(tipo) {
  return new Promise((resolve, reject) => {
    enviarEmailEvento(db, tipo, {}, (err, resultado) => {
      if (err) return reject(err);

      console.log("OK", tipo, resultado.ruta_txt || "");
      resolve(resultado);
    });
  });
}

async function main() {
  console.log("===== PRUEBA EMAILS RESTAURANT SERVICE POS =====");

  await enviar("cuenta_creada");
  await enviar("trial_iniciado");
  await enviar("trial_expira");
  await enviar("suscripcion_activada");
  await enviar("pago_fallido");

  db.close();

  console.log("");
  console.log("Emails generados en prints/emails/");
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  db.close();
  process.exit(1);
});
