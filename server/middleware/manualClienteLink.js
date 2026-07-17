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

function rutaConAyuda(path) {
  path = String(path || "");

  if (
    path === "/" ||
    path === "/login" ||
    path === "/registro" ||
    path === "/configuracion" ||
    path === "/configuracion-suscripcion" ||
    path === "/pago-requerido" ||
    path === "/app/v2" ||
    path === "/app/v2/" ||
    path === "/camarero" ||
    path === "/manual" ||
    path === "/ayuda"
  ) {
    return true;
  }

  if (path.startsWith("/configuracion-")) return true;

  return false;
}

function botonManual() {
  return `
<style>
.rs-manual-help-btn{
  position:fixed;
  right:18px;
  bottom:18px;
  z-index:99999;
  background:#2563eb;
  color:white !important;
  text-decoration:none;
  font-family:Arial, Helvetica, sans-serif;
  font-weight:900;
  font-size:14px;
  border-radius:999px;
  padding:12px 16px;
  box-shadow:0 14px 35px rgba(37,99,235,.35);
  border:1px solid rgba(255,255,255,.35);
}
.rs-manual-help-btn:hover{
  background:#1d4ed8;
}
@media(max-width:700px){
  .rs-manual-help-btn{
    right:12px;
    bottom:12px;
    font-size:13px;
    padding:10px 13px;
  }
}
@media print{
  .rs-manual-help-btn{display:none;}
}
</style>
<a class="rs-manual-help-btn" href="/manual" target="_blank" rel="noopener">❔ Manual</a>`;
}

function insertar(html) {
  if (!html || typeof html !== "string") return html;
  if (!html.toLowerCase().includes("<html")) return html;
  if (html.includes("rs-manual-help-btn")) return html;

  const bloque = botonManual();

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, bloque + "\n</body>");
  }

  return html + bloque;
}

module.exports = function manualClienteLinkMiddleware() {
  return function(req, res, next) {
    const path = req.path || req.url || "";

    if (req.method !== "GET") return next();
    if (rutaExcluida(path)) return next();
    if (!rutaConAyuda(path)) return next();

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
