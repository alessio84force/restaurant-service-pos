function obtenerTablaConfiguracion(db, callback) {
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('configurazione','configuracion') ORDER BY CASE WHEN name='configurazione' THEN 0 ELSE 1 END LIMIT 1",
    [],
    (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(null, null);
      callback(null, row.name);
    }
  );
}

function leerEstadoSuscripcion(db, callback) {
  obtenerTablaConfiguracion(db, (err, tabla) => {
    if (err) return callback(err);

    if (!tabla) {
      return callback(null, {
        accesoPermitido: true,
        estado: "activo",
        motivo: "sin_tabla_configuracion"
      });
    }

    db.all("PRAGMA table_info(" + tabla + ")", [], (err2, columnas) => {
      if (err2) return callback(err2);

      const nombres = columnas.map((c) => c.name);

      if (!nombres.includes("suscripcion_estado")) {
        return callback(null, {
          accesoPermitido: true,
          estado: "activo",
          motivo: "instalacion_antigua"
        });
      }

      db.get("SELECT * FROM " + tabla + " ORDER BY id LIMIT 1", [], (err3, config) => {
        if (err3) return callback(err3);

        if (!config) {
          return callback(null, {
            accesoPermitido: true,
            estado: "activo",
            motivo: "sin_configuracion"
          });
        }

        const estado = String(config.suscripcion_estado || "activo").trim();

        if (!estado || estado === "activo" || estado === "gratis_vida") {
          return callback(null, {
            accesoPermitido: true,
            estado: estado || "activo",
            trialFin: config.trial_fin || null
          });
        }

        if (estado === "prueba") {
          if (!config.trial_fin) {
            return callback(null, {
              accesoPermitido: false,
              estado,
              motivo: "prueba_sin_fecha"
            });
          }

          const ahora = new Date();
          const fin = new Date(config.trial_fin);

          if (isNaN(fin.getTime())) {
            return callback(null, {
              accesoPermitido: false,
              estado,
              motivo: "fecha_prueba_no_valida"
            });
          }

          if (ahora <= fin) {
            return callback(null, {
              accesoPermitido: true,
              estado,
              trialFin: config.trial_fin
            });
          }

          return callback(null, {
            accesoPermitido: false,
            estado,
            trialFin: config.trial_fin,
            motivo: "prueba_caducada"
          });
        }

        return callback(null, {
          accesoPermitido: false,
          estado,
          trialFin: config.trial_fin || null,
          motivo: "suscripcion_no_activa"
        });
      });
    });
  });
}

function esRutaPublica(req) {
  const ruta = req.path || "";

  if (ruta === "/") return true;
  if (ruta === "/login") return true;
  if (ruta === "/logout") return true;
  if (ruta === "/registro") return true;
  if (ruta === "/pago-requerido") return true;
  if (ruta === "/aviso-legal") return true;
  if (ruta === "/privacidad") return true;
  if (ruta === "/cookies") return true;
  if (ruta === "/terminos") return true;

  if (ruta.startsWith("/app/assets/")) return true;
  if (ruta.startsWith("/favicon")) return true;

  return false;
}

function quiereJson(req) {
  const accept = String(req.headers.accept || "");
  const contentType = String(req.headers["content-type"] || "");

  return accept.includes("application/json") || contentType.includes("application/json") || req.xhr;
}

function middlewareSuscripcion(db) {
  return function(req, res, next) {
    if (esRutaPublica(req)) {
      return next();
    }

    if (!req.session || !req.session.usuario) {
      return next();
    }

    leerEstadoSuscripcion(db, (err, estado) => {
      if (err) {
        console.error("Error controlando suscripcion:", err.message);
        return next();
      }

      if (estado.accesoPermitido) {
        return next();
      }

      if (quiereJson(req)) {
        return res.status(402).json({
          error: "Suscripción no activa",
          motivo: estado.motivo || "suscripcion_no_activa"
        });
      }

      return res.redirect("/pago-requerido");
    });
  };
}

function renderPagoRequerido() {
  return [
    '<!DOCTYPE html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>Activar suscripción - Restaurant Service POS</title>',
    '<style>',
    '*{box-sizing:border-box;}',
    'body{margin:0;min-height:100vh;font-family:Arial,sans-serif;background:#0f172a;color:#111827;}',
    '.pagina{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 470px;}',
    '.zona-foto{min-height:100vh;background:#0f172a;display:flex;align-items:center;justify-content:center;padding:6px;overflow:hidden;}',
    '.zona-foto img{width:108%;height:108%;object-fit:contain;object-position:center center;display:block;}',
    '.panel-derecho{min-height:100vh;background:#0f172a;padding:34px;display:flex;flex-direction:column;justify-content:center;gap:18px;box-shadow:-18px 0 45px rgba(0,0,0,.25);}',
    '.card{background:rgba(255,255,255,.97);border-radius:28px;padding:30px;box-shadow:0 24px 70px rgba(0,0,0,.35);}',
    '.marca{display:inline-flex;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:8px 12px;font-weight:900;font-size:13px;margin-bottom:18px;}',
    'h1{margin:0;font-size:34px;letter-spacing:-.8px;color:#111827;}',
    'p{color:#475569;font-size:16px;line-height:1.5;font-weight:700;}',
    '.precio{background:#ecfdf5;border:1px solid #bbf7d0;border-radius:20px;padding:18px;color:#166534;font-weight:900;font-size:22px;margin:22px 0;text-align:center;}',
    '.precio span{display:block;font-size:13px;color:#15803d;margin-top:6px;}',
    '.bloqueo{background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:16px;color:#9a3412;font-weight:800;line-height:1.45;margin-top:16px;}',
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
    '<h1>Activa tu suscripción</h1>',
    '<p>La prueba gratuita ha finalizado o la suscripción no está activa. Para seguir usando el POS, activa el plan del restaurante.</p>',
    '<div class="precio">7,50 €/mes<span>Plan Restaurant Service POS</span></div>',
    '<div class="bloqueo">El pago online se conectará en la siguiente fase. De momento esta pantalla bloquea el acceso cuando la prueba termina.</div>',
    '<div class="acciones">',
    '<a class="principal" href="/login">Volver al login</a>',
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
  ].join('\n');
}


module.exports = {
  middlewareSuscripcion,
  leerEstadoSuscripcion,
  renderPagoRequerido
};
