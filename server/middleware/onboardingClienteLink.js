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

function rutaConOnboarding(path) {
  path = String(path || "");

  return (
    path === "/configuracion" ||
    path === "/primeros-pasos" ||
    path === "/onboarding"
  );
}

function boton() {
  return `
<style>
.rs-onboarding-btn{
  position:fixed;
  left:18px;
  bottom:18px;
  z-index:99998;
  background:#16a34a;
  color:white !important;
  text-decoration:none;
  font-family:Arial, Helvetica, sans-serif;
  font-weight:900;
  font-size:14px;
  border-radius:999px;
  padding:12px 16px;
  box-shadow:0 14px 35px rgba(22,163,74,.28);
  border:1px solid rgba(255,255,255,.35);
}
.rs-onboarding-btn:hover{
  background:#15803d;
}
@media(max-width:700px){
  .rs-onboarding-btn{
    left:12px;
    bottom:58px;
    font-size:13px;
    padding:10px 13px;
  }
}
@media print{
  .rs-onboarding-btn{display:none;}
}
</style>
<a class="rs-onboarding-btn" href="/primeros-pasos">🚀 Primeros pasos</a>`;
}

function insertar(html) {
  if (!html || typeof html !== "string") return html;
  if (!html.toLowerCase().includes("<html")) return html;
  if (html.includes("rs-onboarding-btn")) return html;

  const bloque = boton();

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, bloque + "\n</body>");
  }

  return html + bloque;
}

module.exports = function onboardingClienteLinkMiddleware() {
  return function(req, res, next) {
    const path = req.path || req.url || "";

    if (req.method !== "GET") return next();
    if (rutaExcluida(path)) return next();
    if (!rutaConOnboarding(path)) return next();

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
