const fs = require("fs");
const path = require("path");
const https = require("https");
const { crearEmail, asuntoEmail } = require("./emailTemplates");

function providerEmail() {
  return String(process.env.EMAIL_PROVIDER || "log").trim().toLowerCase();
}

function emailFrom() {
  return process.env.EMAIL_FROM || "Restaurant Service POS <no-reply@restaurantservicepos.local>";
}

function emailReplyTo() {
  return process.env.EMAIL_REPLY_TO || "info@restaurantservicepos.com";
}

function limpiarNombreArchivo(valor) {
  return String(valor || "email")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function textoDesdeHtml(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function guardarEmailSimulado(email, callback) {
  const carpeta = path.join(process.cwd(), "prints", "emails");
  fs.mkdirSync(carpeta, { recursive: true });

  const fecha = new Date().toISOString().replace(/[:.]/g, "-");
  const tipo = limpiarNombreArchivo(email.tipo || "email");
  const destino = limpiarNombreArchivo(Array.isArray(email.to) ? email.to.join("_") : email.to);
  const base = `${fecha}_${tipo}_${destino}`;

  const txtPath = path.join(carpeta, `${base}.txt`);
  const htmlPath = path.join(carpeta, `${base}.html`);

  const texto = [
    `FROM: ${email.from || emailFrom()}`,
    `TO: ${Array.isArray(email.to) ? email.to.join(", ") : email.to}`,
    `SUBJECT: ${email.subject || ""}`,
    `TIPO: ${email.tipo || ""}`,
    "",
    email.text || textoDesdeHtml(email.html || "")
  ].join("\n");

  fs.writeFileSync(txtPath, texto, "utf8");
  fs.writeFileSync(htmlPath, email.html || "", "utf8");

  console.log("EMAIL SIMULADO GUARDADO:");
  console.log("TXT:", txtPath);
  console.log("HTML:", htmlPath);

  if (callback) callback(null, { modo: "simulado", txtPath, htmlPath });
}

function enviarConResend(email, callback) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY no configurada. Se guarda email simulado.");
    return guardarEmailSimulado(email, callback);
  }

  const payload = {
    from: email.from || emailFrom(),
    to: Array.isArray(email.to) ? email.to : [email.to],
    subject: email.subject,
    html: email.html || "",
    text: email.text || textoDesdeHtml(email.html || "")
  };

  if (email.reply_to || emailReplyTo()) {
    payload.reply_to = email.reply_to || emailReplyTo();
  }

  const body = JSON.stringify(payload);

  const req = https.request(
    {
      hostname: "api.resend.com",
      path: "/emails",
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    },
    function (res) {
      let data = "";

      res.on("data", function (chunk) {
        data += chunk;
      });

      res.on("end", function () {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (e) {
          parsed = data;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("EMAIL REAL ENVIADO CON RESEND:", email.to);
          if (callback) callback(null, { modo: "resend", statusCode: res.statusCode, respuesta: parsed });
          return;
        }

        const err = new Error(`Error Resend ${res.statusCode}: ${data}`);
        console.error(err.message);

        try {
          guardarEmailSimulado(
            Object.assign({}, email, {
              tipo: `${email.tipo || "email"}_fallido_resend`
            }),
            function () {}
          );
        } catch (e) {}

        if (callback) callback(err);
      });
    }
  );

  req.on("error", function (err) {
    console.error("Error conectando con Resend:", err.message);
    if (callback) callback(err);
  });

  req.write(body);
  req.end();
}

function enviarEmail(email, callback) {
  const modo = providerEmail();

  const emailFinal = Object.assign({}, email, {
    from: email.from || emailFrom(),
    text: email.text || textoDesdeHtml(email.html || "")
  });

  if (!emailFinal.to) {
    const err = new Error("No hay destinatario para enviar el email.");
    if (callback) callback(err);
    return;
  }

  if (!emailFinal.subject) {
    const err = new Error("No hay asunto para enviar el email.");
    if (callback) callback(err);
    return;
  }

  if (modo === "resend") {
    return enviarConResend(emailFinal, callback);
  }

  if (modo === "log" || modo === "simulado" || modo === "simulation") {
    return guardarEmailSimulado(emailFinal, callback);
  }

  console.warn(`EMAIL_PROVIDER desconocido (${modo}). Se guarda email simulado.`);
  return guardarEmailSimulado(emailFinal, callback);
}

function obtenerConfigCliente(db, callback) {
  db.get("SELECT * FROM configurazione WHERE id = 1", [], function (err, config) {
    if (err) return callback(err);
    callback(null, config || {});
  });
}

function datosDesdeConfig(config) {
  return {
    restaurante_nombre:
      config.nombre_restaurante ||
      config.restaurante_nombre ||
      config.nombre ||
      "Restaurant Service POS",

    propietario_nombre:
      config.propietario_nombre ||
      config.nombre_propietario ||
      config.propietario ||
      "Cliente",

    email:
      config.propietario_email ||
      config.email_cliente ||
      config.email ||
      "",

    trial_fin: config.trial_fin || "",
    promocion: config.promocion_aplicada || config.codigo_promocional || "",
    precio_mensual: process.env.PRECIO_MENSUAL || config.precio_mensual || "7.50",
    app_base_url: process.env.APP_BASE_URL || "http://localhost:3000"
  };
}

function normalizarContenidoCreado(contenido) {
  if (contenido && typeof contenido === "object") {
    return {
      html: contenido.html || contenido.contenidoHtml || contenido.contenido_html || "",
      text: contenido.text || contenido.texto || ""
    };
  }

  const html = String(contenido || "");
  return {
    html,
    text: textoDesdeHtml(html)
  };
}

function enviarEmailEvento(db, tipo, datosExtra, callback) {
  const extra = datosExtra || {};

  obtenerConfigCliente(db, function (err, config) {
    if (err) {
      if (callback) callback(err);
      return;
    }

    const datos = Object.assign({}, datosDesdeConfig(config), extra);
    const destino = extra.to || extra.email || datos.email;

    if (!destino) {
      const errDestino = new Error(`No hay email de destino para evento ${tipo}.`);
      if (callback) callback(errDestino);
      return;
    }

    let contenido;
    let subject;

    try {
      contenido = normalizarContenidoCreado(crearEmail(tipo, datos));
      subject = extra.subject || extra.asunto || asuntoEmail(tipo, datos);
    } catch (e) {
      if (callback) callback(e);
      return;
    }

    enviarEmail(
      {
        to: destino,
        subject,
        html: contenido.html,
        text: contenido.text,
        tipo
      },
      callback
    );
  });
}

module.exports = {
  providerEmail,
  emailFrom,
  enviarEmail,
  obtenerConfigCliente,
  enviarEmailEvento
};
