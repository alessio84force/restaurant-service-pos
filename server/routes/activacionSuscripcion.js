const express = require("express");
const fs = require("fs");
const path = require("path");

const archivoCodigos = path.join(__dirname, "..", "private", "activation-codes.local.json");

function normalizarCodigo(codigo) {
  return String(codigo || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function cargarCodigosActivacion() {
  try {
    const raw = fs.readFileSync(archivoCodigos, "utf8");
    const data = JSON.parse(raw);
    const codigos = {};

    Object.keys(data).forEach((codigo) => {
      codigos[normalizarCodigo(codigo)] = data[codigo];
    });

    return codigos;
  } catch (error) {
    return {};
  }
}

function validarCodigoActivacion(codigo) {
  const codigoNormalizado = normalizarCodigo(codigo);

  if (!codigoNormalizado) {
    return null;
  }

  const codigos = cargarCodigosActivacion();

  return codigos[codigoNormalizado] || null;
}

function obtenerTablaConfiguracion(db, callback) {
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('configurazione','configuracion') ORDER BY CASE WHEN name='configurazione' THEN 0 ELSE 1 END LIMIT 1",
    [],
    (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(new Error("No existe tabla de configuración"));
      callback(null, row.name);
    }
  );
}

function asegurarColumnas(db, tabla, callback) {
  db.all("PRAGMA table_info(" + tabla + ")", [], (err, rows) => {
    if (err) return callback(err);

    const existentes = rows.map((r) => r.name);
    const necesarias = [
      ["suscripcion_estado", "TEXT DEFAULT 'activo'"],
      ["trial_inicio", "TEXT"],
      ["trial_fin", "TEXT"],
      ["plan_tipo", "TEXT"],
      ["promocion_aplicada", "TEXT"],
      ["suscripcion_activada_en", "TEXT"]
    ];

    const pendientes = necesarias.filter((c) => !existentes.includes(c[0]));

    function siguiente() {
      if (pendientes.length === 0) return callback();

      const col = pendientes.shift();

      db.run("ALTER TABLE " + tabla + " ADD COLUMN " + col[0] + " " + col[1], [], (err2) => {
        if (err2 && !String(err2.message || "").includes("duplicate column name")) {
          return callback(err2);
        }

        siguiente();
      });
    }

    siguiente();
  });
}

function activarSuscripcion(db, activacion, callback) {
  obtenerTablaConfiguracion(db, (err, tabla) => {
    if (err) return callback(err);

    asegurarColumnas(db, tabla, (err2) => {
      if (err2) return callback(err2);

      db.get("SELECT id FROM " + tabla + " ORDER BY id LIMIT 1", [], (err3, row) => {
        if (err3) return callback(err3);

        function guardar(id) {
          const estado = activacion.tipo === "gratis_vida" ? "gratis_vida" : "activo";
          const plan = activacion.plan_tipo || estado;
          const ahora = new Date().toISOString();

          db.run(
            "UPDATE " + tabla + " SET suscripcion_estado=?, plan_tipo=?, trial_fin=NULL, promocion_aplicada=?, suscripcion_activada_en=? WHERE id=?",
            [estado, plan, activacion.tipo || "activacion_manual", ahora, id],
            callback
          );
        }

        if (row && row.id) {
          return guardar(row.id);
        }

        db.run("INSERT INTO " + tabla + " DEFAULT VALUES", [], function(err4) {
          if (err4) return callback(err4);
          guardar(this.lastID);
        });
      });
    });
  });
}

function renderResultadoActivacion(ok, mensaje) {
  const titulo = ok ? "Suscripción activada" : "Activación no válida";
  const texto = ok
    ? "Ya puedes volver al login y seguir usando Restaurant Service POS."
    : "Revisa el código de activación o solicita uno nuevo.";

  const enlace = ok ? "/login" : "/pago-requerido";
  const textoBoton = ok ? "Ir al login" : "Volver a activación";

  const mensajeSeguro = String(mensaje || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return [
    '<!DOCTYPE html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>' + titulo + ' - Restaurant Service POS</title>',
    '<style>',
    '*{box-sizing:border-box;}',
    'body{margin:0;min-height:100vh;font-family:Arial,sans-serif;background:#0f172a;color:#111827;}',
    '.pagina{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 470px;}',
    '.zona-foto{min-height:100vh;background:#0f172a;display:flex;align-items:center;justify-content:center;padding:6px;overflow:hidden;}',
    '.zona-foto img{width:108%;height:108%;object-fit:contain;object-position:center center;display:block;}',
    '.panel-derecho{min-height:100vh;background:#0f172a;padding:34px;display:flex;flex-direction:column;justify-content:center;gap:18px;box-shadow:-18px 0 45px rgba(0,0,0,.25);}',
    '.card{background:rgba(255,255,255,.97);border-radius:28px;padding:32px;box-shadow:0 24px 70px rgba(0,0,0,.35);}',
    '.marca{display:inline-flex;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:8px 12px;font-weight:900;font-size:13px;margin-bottom:18px;}',
    '.icono{width:64px;height:64px;border-radius:22px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;margin-bottom:18px;}',
    '.icono.ok{background:#ecfdf5;color:#16a34a;border:1px solid #bbf7d0;}',
    '.icono.error{background:#fef2f2;color:#dc2626;border:1px solid #fecaca;}',
    'h1{margin:0;font-size:34px;letter-spacing:-.8px;color:#111827;}',
    'p{color:#475569;font-size:16px;line-height:1.5;font-weight:700;}',
    '.msg{border-radius:18px;padding:16px;font-weight:900;margin:22px 0;line-height:1.45;}',
    '.msg.ok{background:#ecfdf5;border:1px solid #bbf7d0;color:#166534;}',
    '.msg.error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;}',
    '.acciones{display:grid;grid-template-columns:1fr;gap:12px;margin-top:24px;}',
    'a{display:block;text-align:center;border-radius:15px;padding:14px 18px;text-decoration:none;font-weight:900;}',
    '.principal{background:#16a34a;color:white;}',
    '.principal:hover{background:#15803d;}',
    '.secundario{background:#111827;color:white;}',
    '.secundario:hover{background:#000;}',
    '.legal{font-size:12px;color:#94a3b8;text-align:center;line-height:1.55;font-weight:800;}',
    '.legal a{display:inline;color:#cbd5e1;background:none;padding:0;border-radius:0;}',
    '.legal a:hover{color:white;text-decoration:underline;}',
    '@media(max-width:950px){.pagina{grid-template-columns:1fr;}.zona-foto{display:none;}.panel-derecho{padding:20px;}.card{border-radius:22px;padding:24px;}}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="pagina">',
    '<div class="zona-foto">',
    '<img src="/app/assets/login-restaurant-service.png" alt="Restaurant Service POS">',
    '</div>',
    '<div class="panel-derecho">',
    '<section class="card">',
    '<div class="marca">Restaurant Service POS</div>',
    '<div class="icono ' + (ok ? 'ok' : 'error') + '">' + (ok ? '✓' : '!') + '</div>',
    '<h1>' + titulo + '</h1>',
    '<div class="msg ' + (ok ? 'ok' : 'error') + '">' + mensajeSeguro + '</div>',
    '<p>' + texto + '</p>',
    '<div class="acciones">',
    '<a class="principal" href="' + enlace + '">' + textoBoton + '</a>',
    '<a class="secundario" href="/aviso-legal">Ver aviso legal</a>',
    '</div>',
    '</section>',
    '<div class="legal">',
    '© 2026 Restaurant Service POS™. Todos los derechos reservados.<br>',
    '<a href="/aviso-legal">Aviso legal</a> · ',
    '<a href="/privacidad">Privacidad</a> · ',
    '<a href="/cookies">Cookies</a> · ',
    '<a href="/terminos">Términos</a>',
    '</div>',
    '</div>',
    '</div>',
    '</body>',
    '</html>'
  ].join("\n");
}


module.exports = function activacionSuscripcionRoutes(db) {
  const router = express.Router();

  router.post("/activar-suscripcion", (req, res) => {
    const codigo = String(req.body.codigo_activacion || "").trim();
    const activacion = validarCodigoActivacion(codigo);

    if (!activacion) {
      return res.send(renderResultadoActivacion(false, "Código de activación no válido."));
    }

    activarSuscripcion(db, activacion, (err) => {
      if (err) {
        console.error("Error activando suscripción:", err.message);
        return res.send(renderResultadoActivacion(false, "No se pudo activar la suscripción."));
      }

      res.send(renderResultadoActivacion(true, "La suscripción se ha activado correctamente."));
    });
  });

  return router;
};
