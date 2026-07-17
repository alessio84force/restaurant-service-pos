function renderPagoRequerido() {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Pago requerido - Restaurant Service POS</title>
  <style>
    body{
      margin:0;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family:Arial, sans-serif;
      background:#f3f4f6;
      color:#111827;
    }
    .card{
      width:min(520px, calc(100% - 32px));
      background:white;
      border-radius:22px;
      padding:34px;
      box-shadow:0 18px 45px rgba(15,23,42,.14);
      text-align:center;
    }
    h1{margin:0 0 12px;font-size:28px;}
    p{color:#4b5563;font-size:16px;line-height:1.5;}
    .precio{
      margin:22px auto;
      padding:18px;
      background:#f9fafb;
      border:1px solid #e5e7eb;
      border-radius:18px;
      font-size:20px;
      font-weight:800;
    }
    button,.btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:52px;
      padding:0 24px;
      border:0;
      border-radius:16px;
      background:#111827;
      color:white;
      font-weight:800;
      font-size:16px;
      cursor:pointer;
      text-decoration:none;
      margin-top:8px;
    }
    .sec{
      background:#e5e7eb;
      color:#111827;
      margin-left:8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Suscripción requerida</h1>
    <p>La prueba gratuita ha finalizado o la suscripción no está activa.</p>
    <div class="precio">Restaurant Service POS · 7,50 €/mes</div>
    <form method="POST" action="/stripe/crear-checkout-suscripcion">
      <button type="submit">Pagar suscripción</button>
      <a class="btn sec" href="/login">Volver al login</a>
    </form>
  </div>
</body>
</html>
`;
}

function renderPagoOnlinePendiente() {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Pago online pendiente</title>
  <style>
    body{font-family:Arial;background:#f3f4f6;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;}
    .card{background:white;border-radius:22px;padding:34px;box-shadow:0 18px 45px rgba(15,23,42,.14);max-width:520px;text-align:center;}
    a{display:inline-block;margin-top:18px;background:#111827;color:white;text-decoration:none;padding:14px 22px;border-radius:16px;font-weight:800;}
  </style>
</head>
<body>
  <div class="card">
    <h1>Pago online pendiente</h1>
    <p>Cuando el pago se confirme, la suscripción quedará activa.</p>
    <a href="/login">Volver al login</a>
  </div>
</body>
</html>
`;
}

function esRutaEstatica(ruta) {
  return /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|map)$/i.test(ruta);
}

function esRutaPublica(ruta) {
  if (!ruta) return true;

  const publicasExactas = [
    "/",
    "/login",
    "/logout",
    "/registro",
    "/aviso-legal",
    "/privacidad",
    "/cookies",
    "/terminos",
    "/encargo-tratamiento",
    "/ayuda",
    "/onboarding",
    "/primeros-pasos",
    "/manual",
    "/condiciones-suscripcion",
    "/pago-requerido",
    "/pago-online-pendiente",
    "/activar-suscripcion"
  ];

  if (publicasExactas.includes(ruta)) return true;

  const prefijos = [
    "/stripe",
    "/app/assets",
    "/assets",
    "/public",
    "/css",
    "/js",
    "/img",
    "/images"
  ];

  if (prefijos.some((p) => ruta.startsWith(p))) return true;
  if (esRutaEstatica(ruta)) return true;

  return false;
}

function obtenerTablaConfiguracion(db, callback) {
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('configurazione','configuracion') ORDER BY CASE WHEN name='configurazione' THEN 0 ELSE 1 END LIMIT 1",
    [],
    (err, row) => {
      if (err) return callback(err);
      callback(null, row ? row.name : null);
    }
  );
}

function obtenerConfigSuscripcion(db, callback) {
  obtenerTablaConfiguracion(db, (err, tabla) => {
    if (err) return callback(err);

    if (!tabla) {
      return callback(null, {
        suscripcion_estado: "activo",
        trial_fin: null
      });
    }

    db.get(
      "SELECT * FROM " + tabla + " WHERE id=1",
      [],
      (err2, config) => {
        if (err2) return callback(err2);

        callback(null, config || {
          suscripcion_estado: "activo",
          trial_fin: null
        });
      }
    );
  });
}

function trialActivo(config) {
  const estado = String(config && config.suscripcion_estado || "").trim().toLowerCase();
  const trialFin = config && config.trial_fin;

  if (estado !== "trial" && estado !== "prueba") {
    return false;
  }

  if (!trialFin) {
    return false;
  }

  const fin = new Date(trialFin).getTime();

  if (!Number.isFinite(fin)) {
    return false;
  }

  return fin > Date.now();
}

function suscripcionPermiteAcceso(config) {
  const estado = String(config && config.suscripcion_estado || "activo").trim().toLowerCase();

  if (!estado) return true;
  if (estado === "activo") return true;
  if (estado === "gratis_vida") return true;
  if (trialActivo(config)) return true;

  return false;
}

function esPeticionApi(req) {
  const ruta = String(req.path || "");
  const acepta = String(req.headers.accept || "");

  return ruta.startsWith("/api/") || acepta.includes("application/json");
}

function middlewareSuscripcion(db) {
  return function(req, res, next) {
    const ruta = String(req.path || "");

    if (esRutaPublica(ruta)) {
      return next();
    }

    if (ruta === "/configuracion-suscripcion") {
      return next();
    }

    obtenerConfigSuscripcion(db, (err, config) => {
      if (err) {
        console.error("Error comprobando suscripción:", err.message);
        return next();
      }

      if (suscripcionPermiteAcceso(config)) {
        return next();
      }

      if (esPeticionApi(req)) {
        return res.status(402).json({
          ok: false,
          error: "suscripcion_requerida",
          redirect: "/pago-requerido"
        });
      }

      return res.redirect("/pago-requerido");
    });
  };
}

module.exports = {
  middlewareSuscripcion,
  renderPagoRequerido,
  renderPagoOnlinePendiente,
  suscripcionPermiteAcceso,
  trialActivo
};
