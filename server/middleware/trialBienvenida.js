const { restauranteIdFromReq } = require("../utils/restauranteContext");

function obtenerConfigTrial(db, restauranteId, callback) {
  db.get(
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=? ORDER BY id DESC LIMIT 1",
    [restauranteId],
    callback
  );
}

function trialActivo(config) {
  if (!config) return false;

  const estado = String(config.suscripcion_estado || "").trim().toLowerCase();

  if (estado !== "trial" && estado !== "prueba") return false;
  if (!config.trial_fin) return false;

  const fin = new Date(config.trial_fin).getTime();

  return fin && fin > Date.now();
}

function calcularDiasRestantes(fecha) {
  if (!fecha) return 0;

  const fin = new Date(fecha).getTime();

  if (!fin) return 0;

  return Math.max(0, Math.ceil((fin - Date.now()) / (1000 * 60 * 60 * 24)));
}

function formatearFecha(fecha) {
  if (!fecha) return "-";

  try {
    return new Date(fecha).toLocaleDateString("es-ES");
  } catch (err) {
    return fecha;
  }
}

function rutaExcluida(ruta) {
  if (!ruta) return true;

  if (ruta.startsWith("/assets")) return true;
  if (ruta.startsWith("/app/assets")) return true;
  if (ruta.startsWith("/app/v2/css")) return true;
  if (ruta.startsWith("/app/v2/js")) return true;
  if (ruta.startsWith("/stripe")) return true;
  if (ruta.startsWith("/api")) return true;
  if (ruta === "/login") return true;
  if (ruta === "/registro") return true;
  if (ruta === "/logout") return true;
  if (ruta === "/trial-bienvenida-vista") return true;
  if (ruta.includes(".")) return true;

  return false;
}

function insertarAntesBody(html, extra) {
  if (!html || typeof html !== "string") return html;

  if (html.indexOf("rs-trial-bienvenida-css") >= 0) return html;

  const idx = html.toLowerCase().lastIndexOf("</body>");

  if (idx === -1) return html + extra;

  return html.slice(0, idx) + extra + html.slice(idx);
}

function renderModalTrial(config) {
  const fechaFin = formatearFecha(config.trial_fin);
  const dias = calcularDiasRestantes(config.trial_fin);

  return `
<style id="rs-trial-bienvenida-css">
  .rs-trial-overlay{position:fixed;inset:0;background:rgba(15,23,42,.58);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;}
  .rs-trial-card{width:min(520px,100%);background:white;border-radius:26px;padding:26px;box-shadow:0 25px 70px rgba(0,0,0,.28);font-family:Arial,Helvetica,sans-serif;color:#111827;}
  .rs-trial-badge{display:inline-block;background:#dcfce7;color:#166534;font-weight:900;border-radius:999px;padding:7px 11px;font-size:13px;margin-bottom:12px;}
  .rs-trial-card h1{margin:0 0 10px;font-size:28px;}
  .rs-trial-card p{margin:0 0 14px;color:#4b5563;line-height:1.5;}
  .rs-trial-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:18px;padding:14px;margin:14px 0;}
  .rs-trial-box strong{display:block;font-size:24px;color:#111827;}
  .rs-trial-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;}
  .rs-trial-btn,.rs-trial-link{border:0;border-radius:13px;padding:11px 14px;font-weight:900;text-decoration:none;cursor:pointer;}
  .rs-trial-btn{background:#111827;color:white;}
  .rs-trial-link{background:#e5e7eb;color:#111827;}
</style>
<div class="rs-trial-overlay" id="rsTrialBienvenida">
  <div class="rs-trial-card">
    <div class="rs-trial-badge">Prueba gratuita activa</div>
    <h1>Tu restaurante está en prueba</h1>
    <p>Puedes configurar mesas, productos, comandas, caja y usuarios durante el periodo de prueba.</p>
    <div class="rs-trial-box">
      <span>Finaliza el</span>
      <strong>${fechaFin}</strong>
      <span>Quedan ${dias} día(s).</span>
    </div>
    <div class="rs-trial-actions">
      <button class="rs-trial-btn" type="button" onclick="rsCerrarBienvenidaTrial()">Entendido</button>
      <a class="rs-trial-link" href="/configuracion-suscripcion">Ver suscripción</a>
    </div>
  </div>
</div>
<script>
function rsCerrarBienvenidaTrial(){
  fetch("/trial-bienvenida-vista", { method: "POST" }).catch(function(){});
  var modal = document.getElementById("rsTrialBienvenida");
  if(modal) modal.remove();
}
</script>`;
}

module.exports = function trialBienvenidaMiddleware(db) {
  return function(req, res, next) {
    const ruta = req.path || req.url || "";

    if (!req.session || !req.session.usuario) return next();

    const restauranteId = restauranteIdFromReq(req);

    if (ruta === "/trial-bienvenida-vista" && req.method === "POST") {
      db.run(
        "UPDATE configurazione SET trial_bienvenida_vista=1 WHERE COALESCE(restaurante_id,1)=?",
        [restauranteId],
        function() {
          res.json({ ok: true });
        }
      );
      return;
    }

    if (rutaExcluida(ruta)) return next();

    const originalSend = res.send.bind(res);

    res.send = function(body) {
      const contentType = String(res.getHeader("Content-Type") || "");

      if (contentType && contentType.indexOf("html") === -1) {
        return originalSend(body);
      }

      const texto = Buffer.isBuffer(body) ? body.toString("utf8") : String(body || "");

      obtenerConfigTrial(db, restauranteId, function(err, config) {
        if (err) {
          console.error("[trialBienvenida] Error:", err.message);
          return originalSend(body);
        }

        if (!trialActivo(config) || Number(config.trial_bienvenida_vista || 0) === 1) {
          return originalSend(body);
        }

        return originalSend(insertarAntesBody(texto, renderModalTrial(config)));
      });
    };

    next();
  };
};
