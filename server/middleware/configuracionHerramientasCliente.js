function insertarHerramientas(html) {
  if (!html || typeof html !== "string") return html;
  if (!html.toLowerCase().includes("<html")) return html;
  if (html.includes("rs-config-tools-card")) return html;

  const bloque = `
<style>
.rs-config-tools-card{
  max-width:980px;
  margin:24px auto;
  padding:20px;
  background:#ffffff;
  border:1px solid #e5e7eb;
  border-radius:22px;
  box-shadow:0 10px 28px rgba(15,23,42,.08);
  font-family:Arial, Helvetica, sans-serif;
}
.rs-config-tools-card h2{
  margin:0 0 8px;
  color:#111827;
  font-size:22px;
}
.rs-config-tools-card p{
  margin:0 0 14px;
  color:#4b5563;
  line-height:1.5;
  font-size:14px;
}
.rs-config-tools-grid{
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  gap:10px;
}
.rs-config-tools-grid a{
  display:block;
  text-decoration:none;
  color:#111827;
  background:#f9fafb;
  border:1px solid #e5e7eb;
  border-radius:16px;
  padding:14px;
  font-weight:900;
  text-align:center;
}
.rs-config-tools-grid a span{
  display:block;
  margin-top:5px;
  color:#6b7280;
  font-weight:700;
  font-size:12px;
  line-height:1.35;
}
.rs-config-tools-grid a:hover{
  background:#eff6ff;
  border-color:#bfdbfe;
}
@media(max-width:850px){
  .rs-config-tools-card{
    margin:18px 12px;
  }
  .rs-config-tools-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}
@media(max-width:520px){
  .rs-config-tools-grid{
    grid-template-columns:1fr;
  }
}
@media print{
  .rs-config-tools-card{display:none;}
}
</style>

<section class="rs-config-tools-card">
  <h2>Herramientas rápidas</h2>
  <p>Accesos útiles para preparar el restaurante. No aparecen encima del POS durante el servicio.</p>
  <div class="rs-config-tools-grid">
    <a href="/app/v2">🍽️ POS<span>Volver al servicio</span></a>
    <a href="/primeros-pasos">🚀 Primeros pasos<span>Guía inicial</span></a>
    <a href="/manual">❔ Manual<span>Ayuda cliente</span></a>
    <a href="/configuracion-backups">💾 Backups<span>Copias de seguridad</span></a>
    <a href="/configuracion-reportes">📊 Reportes<span>Exportar CSV</span></a>
  </div>
</section>
`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, bloque + "\n</body>");
  }

  return html + bloque;
}

module.exports = function configuracionHerramientasClienteMiddleware() {
  return function(req, res, next) {
    const path = req.path || req.url || "";

    if (req.method !== "GET") return next();
    if (path !== "/configuracion") return next();

    const originalSend = res.send.bind(res);

    res.send = function(body) {
      const contentType = String(res.getHeader("content-type") || "");

      if (contentType && !contentType.includes("text/html")) {
        return originalSend(body);
      }

      return originalSend(insertarHerramientas(body));
    };

    return next();
  };
};
