const { normalizarIdioma } = require("../utils/i18n");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function valorAceptado(valor) {
  const v = String(valor || "").trim().toLowerCase();
  return v === "si" || v === "sí" || v === "on" || v === "true" || v === "1" || v === "acepto";
}

function textosRegistroLegal(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      acepto: "Acepto los",
      terminosLargos: "Términos y condiciones",
      privacidadLarga: "Política de privacidad",
      suscripcionLarga: "Condiciones de suscripción",
      la: "la",
      yLas: "y las",
      titulo: "Aceptación legal requerida",
      mensaje: "Para crear una cuenta en Restaurant Service POS debes aceptar los términos del servicio, la política de privacidad y las condiciones de suscripción.",
      volver: "Volver al registro",
      terminos: "Términos",
      privacidad: "Privacidad",
      suscripcion: "Suscripción"
    },

    it: {
      acepto: "Accetto i",
      terminosLargos: "Termini e condizioni",
      privacidadLarga: "Informativa sulla privacy",
      suscripcionLarga: "Condizioni di abbonamento",
      la: "la",
      yLas: "e le",
      titulo: "Accettazione legale richiesta",
      mensaje: "Per creare un account su Restaurant Service POS devi accettare i termini del servizio, l'informativa sulla privacy e le condizioni di abbonamento.",
      volver: "Torna alla registrazione",
      terminos: "Termini",
      privacidad: "Privacy",
      suscripcion: "Abbonamento"
    },

    en: {
      acepto: "I accept the",
      terminosLargos: "Terms and Conditions",
      privacidadLarga: "Privacy Policy",
      suscripcionLarga: "Subscription Terms",
      la: "the",
      yLas: "and the",
      titulo: "Legal acceptance required",
      mensaje: "To create a Restaurant Service POS account, you must accept the Terms of Service, Privacy Policy and Subscription Terms.",
      volver: "Back to registration",
      terminos: "Terms",
      privacidad: "Privacy",
      suscripcion: "Subscription"
    }
  };

  return Object.assign({ idioma: idioma }, textos[idioma] || textos.es);
}

function emailDesdeBody(body) {
  body = body || {};
  return (
    body.email ||
    body.correo ||
    body.propietario_email ||
    body.email_cliente ||
    body.usuario_email ||
    ""
  );
}

function insertarCheckboxLegal(html, idiomaValor) {
  if (!html || typeof html !== "string") return html;

  const t = textosRegistroLegal(idiomaValor);
  const idioma = t.idioma;
  if (html.includes('name="acepta_legal"') || html.includes("name='acepta_legal'")) return html;
  if (!html.toLowerCase().includes("<form")) return html;

  const bloque = `
    <div class="rs-legal-accept-box" style="
      margin:18px 0;
      padding:14px;
      border:1px solid #cbd5e1;
      border-radius:14px;
      background:#f8fafc;
      color:#0f172a;
      font-size:13px;
      line-height:1.45;
    ">
      <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;">
        <input
          type="checkbox"
          name="acepta_legal"
          value="si"
          required
          style="margin-top:3px;min-width:16px;min-height:16px;"
        >
        <span>
          ${escapar(t.acepto)}
          <a href="/terminos?idioma=${encodeURIComponent(idioma)}" target="_blank" rel="noopener">${escapar(t.terminosLargos)}</a>,
          ${escapar(t.la)}
          <a href="/privacidad?idioma=${encodeURIComponent(idioma)}" target="_blank" rel="noopener">${escapar(t.privacidadLarga)}</a>
          ${escapar(t.yLas)}
          <a href="/condiciones-suscripcion?idioma=${encodeURIComponent(idioma)}" target="_blank" rel="noopener">${escapar(t.suscripcionLarga)}</a>.
        </span>
      </label>
    </div>
  `;

  const patrones = [
    /(<button[^>]*type=["']submit["'][\s\S]*?<\/button>)/i,
    /(<input[^>]*type=["']submit["'][^>]*>)/i
  ];

  for (const patron of patrones) {
    if (patron.test(html)) {
      return html.replace(patron, bloque + "\n$1");
    }
  }

  if (/<\/form>/i.test(html)) {
    return html.replace(/<\/form>/i, bloque + "\n</form>");
  }

  return html;
}

function paginaAceptacionRequerida(idiomaValor) {
  const t = textosRegistroLegal(idiomaValor);
  const idioma = t.idioma;

  return `<!doctype html>
<html lang="${escapar(idioma)}">
<head>
  <meta charset="utf-8">
  <title>${escapar(t.titulo)} - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{
      margin:0;
      font-family:Arial, Helvetica, sans-serif;
      background:#f3f4f6;
      color:#111827;
      display:flex;
      min-height:100vh;
      align-items:center;
      justify-content:center;
      padding:20px;
    }
    .card{
      max-width:520px;
      background:white;
      border:1px solid #e5e7eb;
      border-radius:20px;
      box-shadow:0 15px 40px rgba(15,23,42,.12);
      padding:26px;
      text-align:center;
    }
    h1{
      margin:0 0 10px;
      font-size:25px;
    }
    p{
      color:#4b5563;
      line-height:1.5;
      margin:0 0 18px;
    }
    a{
      display:inline-block;
      background:#111827;
      color:white;
      text-decoration:none;
      padding:12px 16px;
      border-radius:12px;
      font-weight:700;
    }
    .links{
      margin-top:16px;
      font-size:13px;
    }
    .links a{
      display:inline;
      background:none;
      color:#2563eb;
      padding:0;
      border-radius:0;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapar(t.titulo)}</h1>
    <p>${escapar(t.mensaje)}</p>

    <a href="/registro?idioma=${encodeURIComponent(idioma)}">${escapar(t.volver)}</a>

    <div class="links">
      <a href="/terminos?idioma=${encodeURIComponent(idioma)}" target="_blank">${escapar(t.terminos)}</a> ·
      <a href="/privacidad?idioma=${encodeURIComponent(idioma)}" target="_blank">${escapar(t.privacidad)}</a> ·
      <a href="/condiciones-suscripcion?idioma=${encodeURIComponent(idioma)}" target="_blank">${escapar(t.suscripcion)}</a>
    </div>
  </div>
</body>
</html>`;
}

function asegurarTablaAceptaciones(db) {
  if (!db) return;

  db.run(`
    CREATE TABLE IF NOT EXISTS aceptaciones_legales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      tipo TEXT DEFAULT 'registro',
      version_terminos TEXT DEFAULT '2026-07',
      version_privacidad TEXT DEFAULT '2026-07',
      version_suscripcion TEXT DEFAULT '2026-07',
      ip TEXT,
      user_agent TEXT,
      aceptado_en TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, function(err) {
    if (err) {
      console.error("Error creando aceptaciones_legales:", err.message);
    }
  });
}

function guardarAceptacion(db, req) {
  if (!db) return;

  asegurarTablaAceptaciones(db);

  const body = req.body || {};
  const email = emailDesdeBody(body);
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection && req.connection.remoteAddress ||
    req.socket && req.socket.remoteAddress ||
    "";

  const userAgent = req.headers["user-agent"] || "";

  db.run(
    `
      INSERT INTO aceptaciones_legales
      (email, tipo, version_terminos, version_privacidad, version_suscripcion, ip, user_agent, aceptado_en)
      VALUES (?, 'registro', '2026-07', '2026-07', '2026-07', ?, ?, datetime('now'))
    `,
    [email, String(ip).slice(0, 200), String(userAgent).slice(0, 500)],
    function(err) {
      if (err) {
        console.error("Error guardando aceptación legal:", err.message);
      }
    }
  );
}

module.exports = function registroLegalMiddleware(db) {
  return function(req, res, next) {
    const path = req.path || req.url || "";

    if (req.method === "GET" && path === "/registro") {
      const originalSend = res.send.bind(res);

      res.send = function(body) {
        return originalSend(insertarCheckboxLegal(
          body,
          req.query && req.query.idioma
        ));
      };

      return next();
    }

    if (req.method === "POST" && path === "/registro") {
      const body = req.body || {};

      if (!valorAceptado(body.acepta_legal)) {
        return res.status(400).send(
          paginaAceptacionRequerida(body.idioma)
        );
      }

      guardarAceptacion(db, req);
      return next();
    }

    return next();
  };
};
