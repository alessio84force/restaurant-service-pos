function esRutaExcluida(path) {
  path = String(path || "");

  return (
    path.startsWith("/api/") ||
    path.startsWith("/app/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/css/") ||
    path.startsWith("/js/") ||
    path.startsWith("/img/") ||
    path.startsWith("/mobile/") ||
    path.startsWith("/camarero") ||
    path.startsWith("/stripe/webhook") ||
    path.startsWith("/ticket/") ||
    /\.(js|css|png|jpg|jpeg|webp|svg|ico|json|txt|map)$/i.test(path)
  );
}

function esRutaImportante(path) {
  path = String(path || "");

  if (
    path === "/" ||
    path === "/login" ||
    path === "/registro" ||
    path === "/pago-requerido" ||
    path === "/activar-suscripcion" ||
    path === "/configuracion" ||
    path === "/configuracion-suscripcion" ||
    path === "/aviso-legal" ||
    path === "/privacidad" ||
    path === "/cookies" ||
    path === "/terminos" ||
    path === "/condiciones-suscripcion" ||
    path === "/encargo-tratamiento"
  ) {
    return true;
  }

  if (path.startsWith("/configuracion-")) {
    return true;
  }

  return false;
}

function yaTieneLegalCompleto(html) {
  const s = String(html || "");

  return (
    s.includes("/aviso-legal") &&
    s.includes("/privacidad") &&
    s.includes("/cookies") &&
    s.includes("/terminos") &&
    s.includes("/condiciones-suscripcion") &&
    s.includes("/encargo-tratamiento")
  );
}

function footerLegal() {
  return `
<style>
.rs-legal-footer-global{
  margin:28px auto 18px;
  padding:16px 18px;
  max-width:980px;
  text-align:center;
  color:#64748b;
  font-family:Arial, Helvetica, sans-serif;
  font-size:12px;
  line-height:1.55;
}
.rs-legal-footer-global a{
  color:#2563eb;
  text-decoration:none;
  font-weight:700;
  margin:0 4px;
}
.rs-legal-footer-global a:hover{
  text-decoration:underline;
}
@media(max-width:700px){
  .rs-legal-footer-global{
    padding:14px 12px;
    font-size:11px;
  }
  .rs-legal-footer-global a{
    display:inline-block;
    margin:2px 3px;
  }
}
</style>
<div class="rs-legal-footer-global">
  <div>© 2026 Restaurant Service POS. Información legal del servicio.</div>
  <div>
    <a href="/aviso-legal">Aviso legal</a> ·
    <a href="/privacidad">Privacidad</a> ·
    <a href="/cookies">Cookies</a> ·
    <a href="/terminos">Términos</a> ·
    <a href="/condiciones-suscripcion">Condiciones de suscripción</a> ·
    <a href="/encargo-tratamiento">Encargo del tratamiento</a>
  </div>
</div>`;
}

function insertarFooter(html) {
  if (!html || typeof html !== "string") return html;
  if (!html.toLowerCase().includes("<html")) return html;
  if (html.includes("rs-legal-footer-global")) return html;
  if (yaTieneLegalCompleto(html)) return html;

  const bloque = footerLegal();

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, bloque + "\n</body>");
  }

  return html + bloque;
}

module.exports = function legalLinksGlobalMiddleware() {
  return function(req, res, next) {
    const path = req.path || req.url || "";

    if (req.method !== "GET") return next();
    if (esRutaExcluida(path)) return next();
    if (!esRutaImportante(path)) return next();

    const originalSend = res.send.bind(res);

    res.send = function(body) {
      const contentType = String(res.getHeader("content-type") || "");

      if (contentType && !contentType.includes("text/html")) {
        return originalSend(body);
      }

      return originalSend(insertarFooter(body));
    };

    return next();
  };
};
