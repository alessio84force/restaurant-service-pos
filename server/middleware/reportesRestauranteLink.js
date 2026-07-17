function rutaExcluida(path) {
  path = String(path || "");

  return (
    path.startsWith("/api/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/css/") ||
    path.startsWith("/js/") ||
    path.startsWith("/img/") ||
    path.startsWith("/stripe/webhook") ||
    /\.(js|css|png|jpg|jpeg|webp|svg|ico|json|txt|map)$/i.test(path)
  );
}

function rutaConReportes(path) {
  path = String(path || "");

  return (
    path === "/configuracion" ||
    path === "/primeros-pasos" ||
    path === "/configuracion-reportes" ||
    path === "/configuracion-backups" ||
    path.startsWith("/configuracion-")
  );
}

function boton() {
  return `
<style>
.rs-reportes-btn{
  position:fixed;
  right:18px;
  top:70px;
  z-index:99996;
  background:#7c3aed;
  color:white !important;
  text-decoration:none;
  font-family:Arial, Helvetica, sans-serif;
  font-weight:900;
  font-size:14px;
  border-radius:999px;
  padding:11px 15px;
  box-shadow:0 14px 35px rgba(124,58,237,.25);
  border:1px solid rgba(255,255,255,.25);
}
.rs-reportes-btn:hover{
  background:#6d28d9;
}
@media(max-width:700px){
  .rs-reportes-btn{
    right:12px;
    top:58px;
    font-size:13px;
    padding:9px 12px;
  }
}
@media print{
  .rs-reportes-btn{display:none;}
}
</style>
<a class="rs-reportes-btn" href="/configuracion-reportes">📊 Reportes</a>`;
}

function insertar(html) {
  if (!html || typeof html !== "string") return html;
  if (!html.toLowerCase().includes("<html")) return html;
  if (html.includes("rs-reportes-btn")) return html;

  const bloque = boton();

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, bloque + "\n</body>");
  }

  return html + bloque;
}

module.exports = function reportesRestauranteLinkMiddleware() {
  return function(req, res, next) {
    const path = req.path || req.url || "";

    if (req.method !== "GET") return next();
    if (rutaExcluida(path)) return next();
    if (!rutaConReportes(path)) return next();

    const originalSend = res.send.bind(res);

    res.send = function(body) {
      const contentType = String(res.getHeader("content-type") || "");

      if (contentType && !contentType.includes("text/html")) {
        return originalSend(body);
      }

      return originalSend(insertar(body));
    };

    return next();
  };
};
