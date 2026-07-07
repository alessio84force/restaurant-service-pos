const express = require("express");

function escapar(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
      ["propietario_nombre", "TEXT"],
      ["propietario_email", "TEXT"],
      ["propietario_telefono", "TEXT"],
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

function formatearFecha(valor) {
  if (!valor) return "No definida";

  const fecha = new Date(valor);

  if (isNaN(fecha.getTime())) {
    return "Fecha no válida";
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

  const ahora = new Date();
  const diff = fecha.getTime() - ahora.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function claseEstado(estado, dias) {
  if (estado === "gratis_vida") return "ok";
  if (estado === "activo") return "ok";
  if (estado === "prueba" && dias !== null && dias >= 0) return "aviso";
  return "error";
}

function textoEstado(estado, dias) {
  if (estado === "gratis_vida") return "Gratis a vida";
  if (estado === "activo") return "Suscripción activa";
  if (estado === "prueba" && dias !== null && dias >= 0) return "Prueba gratuita activa";
  if (estado === "prueba") return "Prueba caducada";
  return "Suscripción no activa";
}

function textoDias(estado, dias) {
  if (estado !== "prueba" || dias === null) return "No aplica";

  if (dias > 0) return dias + " días restantes";
  if (dias === 0) return "Termina hoy";

  return "Caducada hace " + Math.abs(dias) + " días";
}

function renderPanel(config) {
  const estado = String(config.suscripcion_estado || "activo").trim() || "activo";
  const dias = calcularDiasRestantes(config.trial_fin);
  const clase = claseEstado(estado, dias);
  const texto = textoEstado(estado, dias);
  const diasTexto = textoDias(estado, dias);

  const icono = clase === "ok" ? "✓" : clase === "aviso" ? "!" : "×";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Suscripción - Restaurant Service POS</title>
<style>
*{
box-sizing:border-box;
}

body{
margin:0;
min-height:100vh;
font-family:Arial,sans-serif;
background:#0f172a;
color:#111827;
}

.pagina{
min-height:100vh;
display:grid;
grid-template-columns:minmax(0,1fr) 520px;
}

.zona-foto{
min-height:100vh;
background:#0f172a;
display:flex;
align-items:center;
justify-content:center;
padding:6px;
overflow:hidden;
}

.zona-foto img{
width:108%;
height:108%;
object-fit:contain;
object-position:center center;
display:block;
}

.panel-derecho{
min-height:100vh;
background:#0f172a;
padding:30px;
display:flex;
flex-direction:column;
justify-content:center;
gap:16px;
box-shadow:-18px 0 45px rgba(0,0,0,.25);
}

.card{
background:rgba(255,255,255,.97);
border-radius:28px;
padding:28px;
box-shadow:0 24px 70px rgba(0,0,0,.35);
}

.marca{
display:inline-flex;
background:#eff6ff;
color:#1d4ed8;
border-radius:999px;
padding:8px 12px;
font-weight:900;
font-size:13px;
margin-bottom:16px;
}

h1{
margin:0;
font-size:34px;
letter-spacing:-.8px;
color:#111827;
}

.subtitulo{
margin:8px 0 22px 0;
color:#64748b;
font-size:15px;
line-height:1.45;
font-weight:800;
}

.estado-box{
display:flex;
align-items:center;
gap:16px;
border-radius:22px;
padding:18px;
margin:18px 0;
}

.estado-box.ok{
background:#ecfdf5;
border:1px solid #bbf7d0;
}

.estado-box.aviso{
background:#fff7ed;
border:1px solid #fed7aa;
}

.estado-box.error{
background:#fef2f2;
border:1px solid #fecaca;
}

.icono{
width:58px;
height:58px;
border-radius:20px;
display:flex;
align-items:center;
justify-content:center;
font-size:32px;
font-weight:900;
background:white;
}

.estado-box.ok .icono{
color:#16a34a;
}

.estado-box.aviso .icono{
color:#ea580c;
}

.estado-box.error .icono{
color:#dc2626;
}

.estado-box h2{
margin:0;
font-size:25px;
letter-spacing:-.4px;
}

.estado-box p{
margin:5px 0 0 0;
font-weight:900;
color:#475569;
}

.grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:10px;
}

.dato{
background:#f8fafc;
border:1px solid #e2e8f0;
border-radius:16px;
padding:13px;
}

.dato span{
display:block;
color:#64748b;
font-size:11px;
font-weight:900;
text-transform:uppercase;
letter-spacing:.4px;
margin-bottom:5px;
}

.dato strong{
display:block;
font-size:15px;
line-height:1.25;
word-break:break-word;
}

.info-card{
background:rgba(255,255,255,.93);
border-radius:24px;
padding:22px;
box-shadow:0 18px 45px rgba(0,0,0,.25);
}

.info-card h2{
margin:0 0 14px 0;
font-size:23px;
}

.nota{
background:#eff6ff;
border:1px solid #bfdbfe;
border-radius:16px;
padding:14px;
color:#1e3a8a;
font-weight:800;
line-height:1.4;
margin-top:14px;
}

.acciones{
display:grid;
grid-template-columns:1fr 1fr;
gap:10px;
margin-top:18px;
}

a{
display:block;
text-align:center;
border-radius:15px;
padding:14px 16px;
text-decoration:none;
font-weight:900;
}

.btn-oscuro{
background:#111827;
color:white;
}

.btn-oscuro:hover{
background:#000;
}

.btn-verde{
background:#16a34a;
color:white;
}

.btn-verde:hover{
background:#15803d;
}

.legal{
font-size:12px;
color:#94a3b8;
text-align:center;
line-height:1.55;
font-weight:800;
}

.legal a{
display:inline;
color:#cbd5e1;
background:none;
padding:0;
border-radius:0;
}

.legal a:hover{
color:white;
text-decoration:underline;
}

@media(max-width:950px){
.pagina{
grid-template-columns:1fr;
}

.zona-foto{
display:none;
}

.panel-derecho{
padding:20px;
}

.card,
.info-card{
border-radius:22px;
padding:24px;
}

.grid,
.acciones{
grid-template-columns:1fr;
}
}
</style>
</head>

<body>

<div class="pagina">

<div class="zona-foto">
<img src="/app/assets/login-restaurant-service.png" alt="Restaurant Service POS">
</div>

<div class="panel-derecho">

<section class="card">
<div class="marca">Restaurant Service POS</div>
<h1>Estado de suscripción</h1>
<p class="subtitulo">
Consulta el estado actual de la prueba gratuita, el plan activo y la activación del restaurante.
</p>

<div class="estado-box ${clase}">
<div class="icono">${icono}</div>
<div>
<h2>${escapar(texto)}</h2>
<p>${escapar(diasTexto)}</p>
</div>
</div>

<div class="grid">
<div class="dato"><span>Estado</span><strong>${escapar(estado)}</strong></div>
<div class="dato"><span>Plan</span><strong>${escapar(config.plan_tipo || "No definido")}</strong></div>
<div class="dato"><span>Inicio prueba</span><strong>${escapar(formatearFecha(config.trial_inicio))}</strong></div>
<div class="dato"><span>Fin prueba</span><strong>${escapar(formatearFecha(config.trial_fin))}</strong></div>
<div class="dato"><span>Activada en</span><strong>${escapar(formatearFecha(config.suscripcion_activada_en))}</strong></div>
<div class="dato"><span>Promoción</span><strong>${escapar(config.promocion_aplicada || "No aplicada")}</strong></div>
</div>

<div class="acciones">
<a class="btn-oscuro" href="/configuracion">Configuración</a>
<a class="btn-verde" href="/pago-requerido">Activar plan</a>
</div>
</section>

<section class="info-card">
<h2>Propietario</h2>

<div class="grid">
<div class="dato"><span>Nombre</span><strong>${escapar(config.propietario_nombre || "No definido")}</strong></div>
<div class="dato"><span>Email</span><strong>${escapar(config.propietario_email || "No definido")}</strong></div>
<div class="dato"><span>Teléfono</span><strong>${escapar(config.propietario_telefono || "No definido")}</strong></div>
<div class="dato"><span>Seguridad</span><strong>Códigos ocultos</strong></div>
</div>

<div class="nota">
Los códigos privados no se muestran en este panel por seguridad.
</div>
</section>

<div class="legal">
© 2026 Restaurant Service POS™. Todos los derechos reservados.<br>
<a href="/aviso-legal">Aviso legal</a> ·
<a href="/privacidad">Privacidad</a> ·
<a href="/cookies">Cookies</a> ·
<a href="/terminos">Términos</a>
</div>

</div>

</div>

</body>
</html>
`;
}

function renderError(mensaje) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Error suscripción - Restaurant Service POS</title>
<style>
*{box-sizing:border-box;}
body{margin:0;min-height:100vh;font-family:Arial,sans-serif;background:#0f172a;color:#111827;display:flex;align-items:center;justify-content:center;padding:30px;}
.card{width:100%;max-width:620px;background:white;border-radius:28px;padding:34px;box-shadow:0 24px 70px rgba(0,0,0,.35);}
.marca{display:inline-flex;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:8px 12px;font-weight:900;font-size:13px;margin-bottom:18px;}
h1{margin:0;font-size:34px;}
p{color:#475569;font-size:17px;line-height:1.5;font-weight:800;}
.error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:18px;padding:16px;margin:20px 0;font-weight:900;}
a{display:block;text-align:center;background:#111827;color:white;border-radius:15px;padding:14px 18px;text-decoration:none;font-weight:900;}
</style>
</head>
<body>
<div class="card">
<div class="marca">Restaurant Service POS</div>
<h1>Error de suscripción</h1>
<div class="error">${escapar(mensaje)}</div>
<p>No se pudo cargar correctamente el estado de la suscripción.</p>
<a href="/configuracion">Volver a Configuración</a>
</div>
</body>
</html>
`;
}

module.exports = function panelSuscripcionRoutes(db) {
  const router = express.Router();

  router.get("/configuracion-suscripcion", (req, res) => {
    if (!req.session || !req.session.usuario) {
      return res.redirect("/login");
    }

    const rol = String(req.session.usuario.rol || "").toLowerCase();

    if (rol !== "admin" && rol !== "gerente") {
      return res.status(403).send(renderError("Acceso denegado."));
    }

    obtenerTablaConfiguracion(db, (err, tabla) => {
      if (err) {
        return res.send(renderError("No se pudo leer la configuración."));
      }

      asegurarColumnas(db, tabla, (err2) => {
        if (err2) {
          return res.send(renderError("No se pudieron preparar los datos de suscripción."));
        }

        db.get("SELECT * FROM " + tabla + " ORDER BY id LIMIT 1", [], (err3, config) => {
          if (err3) {
            return res.send(renderError("No se pudo cargar la suscripción."));
          }

          res.send(renderPanel(config || {}));
        });
      });
    });
  });

  return router;
};
