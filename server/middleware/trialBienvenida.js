function escaparHTML(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function asegurarColumnaBienvenida(db, callback) {
  db.all("PRAGMA table_info(configurazione)", [], (err, columnas) => {
    if (err) return callback(err);

    const nombres = (columnas || []).map((c) => c.name);

    if (nombres.includes("trial_bienvenida_vista")) {
      return callback(null);
    }

    db.run(
      "ALTER TABLE configurazione ADD COLUMN trial_bienvenida_vista INTEGER DEFAULT 0",
      [],
      (errAlter) => {
        if (errAlter && !String(errAlter.message || "").includes("duplicate column")) {
          return callback(errAlter);
        }

        callback(null);
      }
    );
  });
}

function obtenerConfigTrial(db, callback) {
  asegurarColumnaBienvenida(db, (errColumna) => {
    if (errColumna) return callback(errColumna);

    db.get("SELECT * FROM configurazione WHERE id=1", [], (err, config) => {
      if (err) return callback(err);

      callback(null, config || {});
    });
  });
}

function trialActivo(config) {
  const estado = String(config.suscripcion_estado || "").trim().toLowerCase();

  if (estado !== "trial" && estado !== "prueba") {
    return false;
  }

  if (!config.trial_fin) {
    return false;
  }

  const fin = new Date(config.trial_fin).getTime();

  if (!Number.isFinite(fin)) {
    return false;
  }

  return fin > Date.now();
}

function formatearFecha(valor) {
  if (!valor) return "No definida";

  const fecha = new Date(valor);

  if (isNaN(fecha.getTime())) {
    return "No definida";
  }

  return fecha.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function calcularDiasRestantes(valor) {
  if (!valor) return null;

  const fecha = new Date(valor);

  if (isNaN(fecha.getTime())) return null;

  return Math.max(0, Math.ceil((fecha.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function esRutaExcluida(ruta) {
  if (!ruta) return true;

  if (ruta.startsWith("/api/")) return true;
  if (ruta.startsWith("/stripe")) return true;
  if (ruta.startsWith("/app/assets")) return true;
  if (ruta.startsWith("/assets")) return true;
  if (ruta.startsWith("/css")) return true;
  if (ruta.startsWith("/js")) return true;
  if (ruta.startsWith("/img")) return true;
  if (ruta.startsWith("/images")) return true;
  if (ruta === "/login") return true;
  if (ruta === "/logout") return true;
  if (ruta === "/registro") return true;
  if (ruta === "/trial-bienvenida-vista") return true;

  return /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|map)$/i.test(ruta);
}

function renderModalTrial(config) {
  const nombre = config.propietario_nombre || "cliente";
  const restaurante = config.nome_ristorante || "Restaurant Service POS";
  const fechaFin = formatearFecha(config.trial_fin);
  const dias = calcularDiasRestantes(config.trial_fin);
  const diasTexto = dias === null ? "" : dias + " días restantes";

  return `
<style id="rs-trial-bienvenida-css">
  .rs-trial-overlay{
    position:fixed;
    inset:0;
    background:rgba(15,23,42,.72);
    z-index:999999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:22px;
  }

  .rs-trial-card{
    width:min(560px,100%);
    background:white;
    border-radius:28px;
    padding:30px;
    box-shadow:0 30px 90px rgba(0,0,0,.35);
    font-family:Arial,sans-serif;
    color:#111827;
  }

  .rs-trial-badge{
    display:inline-flex;
    background:#ecfdf5;
    color:#047857;
    border:1px solid #a7f3d0;
    border-radius:999px;
    padding:8px 12px;
    font-size:13px;
    font-weight:900;
    margin-bottom:16px;
  }

  .rs-trial-card h1{
    margin:0 0 10px 0;
    font-size:32px;
    line-height:1.08;
    letter-spacing:-.7px;
  }

  .rs-trial-card p{
    margin:10px 0;
    color:#475569;
    font-size:16px;
    font-weight:700;
    line-height:1.45;
  }

  .rs-trial-box{
    margin:18px 0;
    background:#f8fafc;
    border:1px solid #e2e8f0;
    border-radius:20px;
    padding:18px;
  }

  .rs-trial-box strong{
    display:block;
    font-size:20px;
    margin-bottom:4px;
    color:#111827;
  }

  .rs-trial-actions{
    display:flex;
    gap:12px;
    flex-wrap:wrap;
    margin-top:20px;
  }

  .rs-trial-btn{
    border:0;
    border-radius:16px;
    padding:14px 20px;
    background:#111827;
    color:white;
    font-size:16px;
    font-weight:900;
    cursor:pointer;
  }

  .rs-trial-link{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border-radius:16px;
    padding:14px 20px;
    background:#f1f5f9;
    color:#111827;
    text-decoration:none;
    font-size:16px;
    font-weight:900;
  }
</style>

<div class="rs-trial-overlay" id="rsTrialBienvenida">
  <div class="rs-trial-card">
    <div class="rs-trial-badge">Prueba gratuita activa</div>
    <h1>Tu prueba gratuita de 7 días ha comenzado</h1>

    <p>Hola ${escaparHTML(nombre)}. Ya puedes usar ${escaparHTML(restaurante)} sin pagar durante el periodo de prueba.</p>

    <div class="rs-trial-box">
      <strong>Disponible hasta el ${escaparHTML(fechaFin)}</strong>
      <span>${escaparHTML(diasTexto)}</span>
    </div>

    <p>Después podrás activar tu suscripción mensual de Restaurant Service POS desde el panel de suscripción.</p>

    <div class="rs-trial-actions">
      <button class="rs-trial-btn" type="button" onclick="rsCerrarBienvenidaTrial()">Entendido</button>
      <a class="rs-trial-link" href="/configuracion-suscripcion">Ver suscripción</a>
    </div>
  </div>
</div>

<script>
function rsCerrarBienvenidaTrial(){
  fetch("/trial-bienvenida-vista", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ visto:1 })
  }).catch(function(){});

  var modal = document.getElementById("rsTrialBienvenida");
  if(modal){
    modal.remove();
  }
}
</script>
`;
}

function insertarAntesBody(html, extra) {
  const cierre = String(html).toLowerCase().lastIndexOf("</body>");

  if (cierre === -1) {
    return html + extra;
  }

  return html.slice(0, cierre) + extra + html.slice(cierre);
}

function trialBienvenidaMiddleware(db) {
  return function(req, res, next) {
    const ruta = String(req.path || "");

    if (ruta === "/trial-bienvenida-vista" && req.method === "POST") {
      return asegurarColumnaBienvenida(db, (errColumna) => {
        if (errColumna) {
          return res.status(500).json({ ok:false, error:errColumna.message });
        }

        db.run(
          "UPDATE configurazione SET trial_bienvenida_vista=1 WHERE id=1",
          [],
          (errUpdate) => {
            if (errUpdate) {
              return res.status(500).json({ ok:false, error:errUpdate.message });
            }

            res.json({ ok:true });
          }
        );
      });
    }

    if (esRutaExcluida(ruta)) {
      return next();
    }

    if (!req.session || !req.session.usuario) {
      return next();
    }

    const originalSend = res.send.bind(res);

    res.send = function(body) {
      const tipo = String(res.getHeader("Content-Type") || "");
      const texto = typeof body === "string" ? body : "";

      if (!texto || (tipo && !tipo.includes("text/html") && !tipo.includes("html"))) {
        return originalSend(body);
      }

      obtenerConfigTrial(db, (err, config) => {
        if (err) {
          console.error("Error bienvenida trial:", err.message);
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
}

module.exports = trialBienvenidaMiddleware;
