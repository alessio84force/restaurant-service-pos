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

function insertarCheckboxLegal(html) {
  if (!html || typeof html !== "string") return html;
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
          Acepto los
          <a href="/terminos" target="_blank" rel="noopener">Términos y condiciones</a>,
          la
          <a href="/privacidad" target="_blank" rel="noopener">Política de privacidad</a>
          y las
          <a href="/condiciones-suscripcion" target="_blank" rel="noopener">Condiciones de suscripción</a>.
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

function paginaAceptacionRequerida() {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Aceptación legal requerida - Restaurant Service POS</title>
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
    <h1>Aceptación legal requerida</h1>
    <p>Para crear una cuenta en Restaurant Service POS debes aceptar los términos del servicio, la política de privacidad y las condiciones de suscripción.</p>
    <a href="/registro">Volver al registro</a>
    <div class="links">
      <a href="/terminos" target="_blank">Términos</a> ·
      <a href="/privacidad" target="_blank">Privacidad</a> ·
      <a href="/condiciones-suscripcion" target="_blank">Suscripción</a>
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
        return originalSend(insertarCheckboxLegal(body));
      };

      return next();
    }

    if (req.method === "POST" && path === "/registro") {
      const body = req.body || {};

      if (!valorAceptado(body.acepta_legal)) {
        return res.status(400).send(paginaAceptacionRequerida());
      }

      guardarAceptacion(db, req);
      return next();
    }

    return next();
  };
};
