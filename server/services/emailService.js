const fs = require("fs");
const path = require("path");
const { crearEmail, asuntoEmail } = require("./emailTemplates");

function limpiarArchivo(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
}

function carpetaEmails() {
  const carpeta = path.join(process.cwd(), "prints", "emails");

  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
  }

  return carpeta;
}

function providerEmail() {
  return String(process.env.EMAIL_PROVIDER || "log").trim().toLowerCase();
}

function emailFrom() {
  return process.env.EMAIL_FROM || "Restaurant Service POS <no-reply@restaurantservicepos.local>";
}

function guardarEmailSimulado({ to, subject, html, text, tipo }) {
  const carpeta = carpetaEmails();
  const base = [
    timestamp(),
    limpiarArchivo(tipo || "email"),
    limpiarArchivo(to || "sin_destinatario")
  ].join("__");

  const rutaTxt = path.join(carpeta, base + ".txt");
  const rutaHtml = path.join(carpeta, base + ".html");

  const contenidoTxt = [
    "FROM: " + emailFrom(),
    "TO: " + (to || ""),
    "SUBJECT: " + (subject || ""),
    "TIPO: " + (tipo || ""),
    "",
    text || ""
  ].join("\n");

  fs.writeFileSync(rutaTxt, contenidoTxt, "utf8");
  fs.writeFileSync(rutaHtml, html || "", "utf8");

  return {
    ok: true,
    modo: "log",
    ruta_txt: rutaTxt,
    ruta_html: rutaHtml
  };
}

function enviarEmail({ to, subject, html, text, tipo }, callback) {
  const provider = providerEmail();

  if (!to) {
    const error = new Error("Email destinatario vacío");
    if (callback) return callback(error);
    return Promise.reject(error);
  }

  if (provider === "log" || provider === "simulado" || provider === "simulation") {
    const resultado = guardarEmailSimulado({ to, subject, html, text, tipo });

    console.log("[EMAIL SIMULADO]", tipo || "email", "->", to, resultado.ruta_txt);

    if (callback) return callback(null, resultado);
    return Promise.resolve(resultado);
  }

  const resultado = guardarEmailSimulado({ to, subject, html, text, tipo });
  resultado.aviso = "Proveedor email real no configurado. Se ha guardado en modo log.";

  console.log("[EMAIL LOG]", tipo || "email", "->", to, resultado.ruta_txt);

  if (callback) return callback(null, resultado);
  return Promise.resolve(resultado);
}

function obtenerConfigCliente(db, callback) {
  db.get("SELECT * FROM configurazione WHERE id=1", [], (err, config) => {
    if (err) return callback(err);

    callback(null, config || {});
  });
}

function enviarEmailEvento(db, tipo, datosExtra, callback) {
  obtenerConfigCliente(db, (err, config) => {
    if (err) {
      if (callback) return callback(err);
      return;
    }

    const datos = Object.assign({}, config || {}, datosExtra || {});
    const to = datos.to || datos.propietario_email || datos.email;

    const email = crearEmail(tipo, datos);
    const subject = asuntoEmail(tipo, datos);

    enviarEmail({
      to,
      subject,
      html: email.html,
      text: email.text,
      tipo
    }, callback);
  });
}

module.exports = {
  enviarEmail,
  enviarEmailEvento
};
