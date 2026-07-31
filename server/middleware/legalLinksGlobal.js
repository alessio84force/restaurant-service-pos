const { normalizarIdioma } = require("../utils/i18n");

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

function idiomaDesdeRequest(req) {
  const queryIdioma =
    req &&
    req.query &&
    req.query.idioma;

  const sessionIdioma =
    req &&
    req.session &&
    (
      req.session.idioma ||
      (
        req.session.usuario &&
        req.session.usuario.idioma
      )
    );

  return normalizarIdioma(queryIdioma || sessionIdioma);
}

function hrefIdioma(path, idioma) {
  return path + "?idioma=" + encodeURIComponent(idioma);
}

function footerLegal(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      info: "Información legal del servicio.",
      aviso: "Aviso legal",
      privacidad: "Privacidad",
      cookies: "Cookies",
      terminos: "Términos",
      suscripcion: "Condiciones de suscripción",
      tratamiento: "Encargo del tratamiento"
    },

    it: {
      info: "Informazioni legali sul servizio.",
      aviso: "Note legali",
      privacidad: "Privacy",
      cookies: "Cookie",
      terminos: "Termini",
      suscripcion: "Condizioni di abbonamento",
      tratamiento: "Accordo sul trattamento dei dati"
    },

    en: {
      info: "Legal information about the service.",
      aviso: "Legal notice",
      privacidad: "Privacy",
      cookies: "Cookies",
      terminos: "Terms",
      suscripcion: "Subscription terms",
      tratamiento: "Data Processing Agreement"
    }
  };

  const t = textos[idioma] || textos.es;

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
  <div>© 2026 Restaurant Service POS. ${t.info}</div>
  <div>
    <a href="${hrefIdioma("/aviso-legal", idioma)}">${t.aviso}</a> ·
    <a href="${hrefIdioma("/privacidad", idioma)}">${t.privacidad}</a> ·
    <a href="${hrefIdioma("/cookies", idioma)}">${t.cookies}</a> ·
    <a href="${hrefIdioma("/terminos", idioma)}">${t.terminos}</a> ·
    <a href="${hrefIdioma("/condiciones-suscripcion", idioma)}">${t.suscripcion}</a> ·
    <a href="${hrefIdioma("/encargo-tratamiento", idioma)}">${t.tratamiento}</a>
  </div>
</div>`;
}

function insertarFooter(html, idioma) {
  if (!html || typeof html !== "string") return html;
  if (!html.toLowerCase().includes("<html")) return html;
  if (html.includes("rs-legal-footer-global")) return html;
  if (yaTieneLegalCompleto(html)) return html;

  const bloque = footerLegal(idioma);

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

    const idioma = idiomaDesdeRequest(req);

    const originalSend = res.send.bind(res);

    res.send = function(body) {
      const contentType = String(res.getHeader("content-type") || "");

      if (contentType && !contentType.includes("text/html")) {
        return originalSend(body);
      }

      return originalSend(insertarFooter(body, idioma));
    };

    return next();
  };
};
