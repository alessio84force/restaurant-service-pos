function bloqueoRestauranteSaas(db) {
  const EMAILS_CREADOR = String(process.env.CREADOR_EMAILS || "alessio84force@gmail.com")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  function escapar(valor) {
    return String(valor == null ? "" : valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rutaPermitida(path) {
    if (!path) return true;

    const permitidas = [
      "/login",
      "/registro",
      "/logout",
      "/cerrar-sesion",
      "/aviso-legal",
      "/privacidad",
      "/cookies",
      "/terminos",
      "/pago-requerido",
      "/configuracion-suscripcion",
      "/stripe",
      "/creador",
      "/api/creador",
      "/app/assets",
      "/assets",
      "/favicon.ico"
    ];

    return permitidas.some(p => path === p || path.startsWith(p + "/"));
  }

  function paginaBloqueada(res, estado, motivo) {
    return res.status(403).send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Cuenta suspendida - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Arial,Helvetica,sans-serif;
      background:
        radial-gradient(circle at 10% 8%, rgba(245,158,11,.20), transparent 30%),
        radial-gradient(circle at 86% 14%, rgba(239,68,68,.18), transparent 28%),
        linear-gradient(135deg,#0f172a 0%,#111827 34%,#f8fafc 34%,#f3f4f6 100%);
      color:#111827;
      padding:24px;
    }
    .box{
      max-width:640px;
      margin:90px auto;
      background:rgba(255,255,255,.96);
      border:1px solid rgba(229,231,235,.95);
      border-radius:28px;
      padding:28px;
      box-shadow:0 24px 70px rgba(15,23,42,.22);
    }
    h1{margin:0 0 10px;font-size:31px;letter-spacing:-.045em}
    p{color:#4b5563;line-height:1.55;font-weight:700}
    .badge{
      display:inline-flex;
      min-height:28px;
      align-items:center;
      padding:0 10px;
      border-radius:999px;
      background:#fef2f2;
      color:#991b1b;
      border:1px solid #fecaca;
      font-weight:900;
      font-size:13px;
    }
    .acciones{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
    a{
      display:inline-flex;
      min-height:42px;
      align-items:center;
      justify-content:center;
      padding:0 14px;
      border-radius:13px;
      text-decoration:none;
      font-weight:900;
      background:linear-gradient(135deg,#111827,#7f1d1d);
      color:white;
    }
    a.sec{background:linear-gradient(135deg,#ffffff,#fee2e2);color:#111827;border:1px solid #fecaca}
  </style>
</head>
<body>
  <div class="box">
    <span class="badge">${escapar(estado || "suspendido")}</span>
    <h1>Cuenta temporalmente suspendida</h1>
    <p>El acceso a Restaurant Service POS está bloqueado para este restaurante.</p>
    ${motivo ? `<p><strong>Motivo:</strong> ${escapar(motivo)}</p>` : ""}
    <p>Si cree que es un error, contacte con soporte o con el administrador del sistema.</p>
    <div class="acciones">
      <!-- RS M3B PAGO SUSPENDIDO -->
      <a href="/configuracion-suscripcion">Ir al pago</a>
      <a class="sec" href="/logout">Cerrar sesión</a>
      <a class="sec" href="/login">Volver a login</a>
    </div>
  </div>
</body>
</html>`);
  }

  return function(req, res, next) {
    try {
      const path = req.path || req.url || "";

      if (rutaPermitida(path)) {
        return next();
      }

      if (!req.session || !req.session.usuario) {
        return next();
      }

      const email = String(req.session.usuario.email || "").toLowerCase();
      const rol = String(req.session.usuario.rol || "").toLowerCase();

      if (EMAILS_CREADOR.includes(email) && rol === "admin") {
        return next();
      }

      const restauranteId = Number(
        req.session.usuario.restaurante_id ||
        req.session.restaurante_id ||
        req.restauranteId ||
        0
      );

      if (!restauranteId) {
        return next();
      }

      db.get(`
        SELECT
          r.estado AS restaurante_estado,
          r.suspension_motivo AS suspension_motivo,
          c.suscripcion_estado AS suscripcion_estado
        FROM restaurantes r
        LEFT JOIN configurazione c ON c.restaurante_id = r.id
        WHERE r.id = ?
        LIMIT 1
      `, [restauranteId], function(err, row) {
        if (err || !row) {
          return next();
        }

        const estadoRestaurante = String(row.restaurante_estado || "").toLowerCase();
        const estadoSuscripcion = String(row.suscripcion_estado || "").toLowerCase();

        const bloqueado = ["suspendido", "bloqueado", "eliminado"].includes(estadoRestaurante)
          || ["suspendido", "bloqueado", "eliminado"].includes(estadoSuscripcion);

        if (!bloqueado) {
          return next();
        }

        return paginaBloqueada(res, estadoRestaurante || estadoSuscripcion, row.suspension_motivo || "");
      });
    } catch (e) {
      return next();
    }
  };
}

module.exports = bloqueoRestauranteSaas;
