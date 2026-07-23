"use strict";

const express = require("express");
const path = require("path");

const router = express.Router();
const BASE_URL = "https://restaurantservicepos.com";

function esc(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function html({ title, description, body, pathUrl }) {
  const canonical = BASE_URL + pathUrl;
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Restaurant Service POS",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": BASE_URL,
    "description": "Software POS online para restaurantes, bares y cafeterías. Gestiona mesas, comandas, pagos, caja, camareros y reportes desde PC y móvil.",
    "offers": {
      "@type": "Offer",
      "price": "7.50",
      "priceCurrency": "EUR"
    }
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${BASE_URL}/marketing/login-restaurant-service.png">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#07111f;color:#f8fafc}
a{color:inherit}
header{border-bottom:1px solid rgba(255,255,255,.12);background:#08111f;position:sticky;top:0}
.nav{max-width:1160px;margin:auto;padding:16px 22px;display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}
.logo{text-decoration:none;font-weight:900}
.menu{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.menu a{text-decoration:none;color:#cbd5e1;font-size:14px}
.btn{display:inline-block;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:800}
.btn.primary{background:#f97316;color:#111827}
.btn.secondary{background:rgba(255,255,255,.1);color:white}
.hero{max-width:1160px;margin:auto;padding:70px 22px 35px;display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:center}
.badge{display:inline-block;background:rgba(249,115,22,.15);color:#fed7aa;border:1px solid rgba(249,115,22,.35);padding:8px 12px;border-radius:999px;margin-bottom:18px}
h1{font-size:clamp(38px,6vw,68px);line-height:.95;margin:0 0 22px;letter-spacing:-2px}
.lead{font-size:20px;line-height:1.55;color:#cbd5e1;margin:0 0 26px}
.actions{display:flex;gap:14px;flex-wrap:wrap}
.image-card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.13);border-radius:28px;padding:14px}
.image-card img{width:100%;display:block;border-radius:20px}
section{max-width:1160px;margin:auto;padding:40px 22px}
h2{font-size:34px;margin:0 0 12px}
.text{color:#cbd5e1;font-size:18px;line-height:1.6;max-width:820px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:24px}
.card{background:#0f172a;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:24px}
.card h3{margin:0 0 10px;font-size:22px}
.card p{margin:0;color:#cbd5e1;line-height:1.55}
.cta{text-align:center;background:linear-gradient(135deg,rgba(249,115,22,.22),rgba(34,197,94,.12));border-radius:28px;padding:42px 22px;border:1px solid rgba(255,255,255,.12)}
footer{text-align:center;color:#94a3b8;border-top:1px solid rgba(255,255,255,.12);padding:28px 22px}
@media(max-width:850px){.hero{grid-template-columns:1fr;padding-top:45px}.grid{grid-template-columns:1fr}h1{letter-spacing:-1px}}
</style>
</head>
<body>
<header>
  <div class="nav">
    <a class="logo" href="/">Restaurant Service POS</a>
    <nav class="menu">
      <a href="/funciones">Funciones</a>
      <a href="/precios">Precios</a>
      <a href="/software-pos-restaurantes">POS restaurantes</a>
      <a href="/contacto">Contacto</a>
      <a href="/login">Entrar</a>
      <a class="btn primary" href="/registro">Probar gratis</a>
    </nav>
  </div>
</header>
<main>${body}</main>
<footer>Restaurant Service POS · Software POS para restaurantes · <a href="/registro">Prueba gratis</a> · <a href="/login">Entrar</a></footer>
</body>
</html>`;
}

function home(req, res) {
  res.send(html({
    pathUrl: "/",
    title: "Software POS para restaurantes sencillo y económico",
    description: "Gestiona mesas, comandas, pagos, caja y camareros desde PC y móvil por 7,50 € al mes.",
    body: `
<section class="hero">
  <div>
    <div class="badge">POS online para restaurantes, bares y cafeterías</div>
    <h1>Gestiona tu restaurante desde PC y móvil por 7,50 €/mes.</h1>
    <p class="lead">Restaurant Service POS es un sistema TPV sencillo para abrir mesas, enviar comandas, cobrar, controlar caja y trabajar con camareros desde cualquier navegador.</p>
    <div class="actions">
      <a class="btn primary" href="/registro">Probar gratis 7 días</a>
      <a class="btn secondary" href="/login">Entrar al POS</a>
    </div>
  </div>
  <div class="image-card">
    <img src="/marketing/login-restaurant-service.png" alt="Software POS para restaurantes">
  </div>
</section>

<section>
  <h2>Un POS pensado para el servicio real</h2>
  <p class="text">Abre mesas, añade productos, envía comandas a barra o cocina, imprime cuentas, cobra con efectivo o tarjeta y revisa la caja diaria.</p>
  <div class="grid">
    <div class="card"><h3>Mesas y salas</h3><p>Crea salas, terrazas y mesas con la numeración que usa tu restaurante.</p></div>
    <div class="card"><h3>Comandas</h3><p>Envía solo los productos nuevos a barra o cocina, evitando duplicados.</p></div>
    <div class="card"><h3>Camareros móvil</h3><p>Los camareros pueden tomar pedidos desde su teléfono o terminal del local.</p></div>
    <div class="card"><h3>Caja diaria</h3><p>Consulta pagos, cierres y reportes del día.</p></div>
    <div class="card"><h3>Usuarios</h3><p>Administrador, gerente y camareros con permisos separados.</p></div>
    <div class="card"><h3>Precio claro</h3><p>Prueba gratis 7 días. Después, 7,50 € al mes.</p></div>
  </div>
</section>

<section>
  <div class="cta">
    <h2>Empieza con una prueba gratuita</h2>
    <p class="text" style="margin:auto auto 22px;">Configura tu restaurante online, crea mesas y productos, y prueba el POS antes de pagar.</p>
    <a class="btn primary" href="/registro">Crear cuenta gratis</a>
  </div>
</section>`
  }));
}

function simple(pathUrl, title, description, h1, text) {
  return function(req, res) {
    res.send(html({
      pathUrl,
      title,
      description,
      body: `
<section class="hero" style="grid-template-columns:1fr">
  <div>
    <div class="badge">Restaurant Service POS</div>
    <h1>${esc(h1)}</h1>
    <p class="lead">${esc(text)}</p>
    <div class="actions">
      <a class="btn primary" href="/registro">Probar gratis 7 días</a>
      <a class="btn secondary" href="/login">Entrar</a>
    </div>
  </div>
</section>
<section>
  <div class="grid">
    <div class="card"><h3>Mesas</h3><p>Gestiona mesas libres y ocupadas.</p></div>
    <div class="card"><h3>Comandas</h3><p>Envía pedidos a barra o cocina.</p></div>
    <div class="card"><h3>Caja</h3><p>Controla pagos, cierres y reportes.</p></div>
  </div>
</section>`
    }));
  };
}

router.get("/", home);
router.get("/software-pos-restaurantes", simple("/software-pos-restaurantes", "Software POS para restaurantes online", "Software POS para restaurantes con mesas, comandas, pagos, caja y acceso móvil.", "Software POS para restaurantes", "Un sistema online para gestionar el servicio diario de restaurantes, bares y cafeterías."));
router.get("/tpv-restaurantes", simple("/tpv-restaurantes", "TPV para restaurantes barato y sencillo", "TPV para restaurantes pequeños con prueba gratis y precio mensual de 7,50 €.", "TPV para restaurantes barato y sencillo", "Una alternativa económica para restaurantes que necesitan un TPV práctico y fácil."));
router.get("/sistema-comandas-restaurante", simple("/sistema-comandas-restaurante", "Sistema de comandas para restaurantes", "Sistema de comandas para restaurantes con envío a barra y cocina desde PC o móvil.", "Sistema de comandas para restaurantes", "Organiza los pedidos del servicio y evita duplicar comandas al añadir productos nuevos."));
router.get("/funciones", simple("/funciones", "Funciones de Restaurant Service POS", "Mesas, salas, comandas, productos, usuarios, pagos, caja, reportes y backups.", "Funciones de Restaurant Service POS", "Todo lo necesario para gestionar un servicio de restaurante de forma simple."));
router.get("/precios", simple("/precios", "Precio del POS para restaurantes", "Restaurant Service POS cuesta 7,50 € al mes con prueba gratuita de 7 días.", "Precio simple: 7,50 €/mes", "Prueba gratis durante 7 días. Después, una suscripción mensual económica para mantener el POS activo."));
router.get("/contacto", simple("/contacto", "Contacto Restaurant Service POS", "Contacta con Restaurant Service POS para probar el software POS para restaurantes.", "Contacto", "Para soporte, dudas comerciales o información sobre Restaurant Service POS: info@restaurantservicepos.com."));

router.get("/marketing/login-restaurant-service.png", function(req, res) {
  res.sendFile(path.join(__dirname, "..", "..", "app", "assets", "login-restaurant-service.png"));
});

router.get("/robots.txt", function(req, res) {
  res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /app/
Disallow: /creador
Disallow: /configuracion
Disallow: /configuracion-
Disallow: /camarero
Disallow: /ticket
Disallow: /api/
Sitemap: ${BASE_URL}/sitemap.xml
`);
});

router.get("/sitemap.xml", function(req, res) {
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = ["/", "/software-pos-restaurantes", "/tpv-restaurantes", "/sistema-comandas-restaurante", "/funciones", "/precios", "/contacto"];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${BASE_URL}${u}</loc><lastmod>${hoy}</lastmod><changefreq>weekly</changefreq><priority>${u === "/" ? "1.0" : "0.8"}</priority></url>`).join("\n")}
</urlset>`;
  res.type("application/xml").send(xml);
});

module.exports = function marketingPublicoRoutes() {
  return router;
};
