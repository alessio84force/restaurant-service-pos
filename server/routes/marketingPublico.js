"use strict";

const express = require("express");
const path = require("path");

const router = express.Router();

const BASE_URL = "https://restaurantservicepos.com";

function escapar(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nav(activa) {
  const items = [
    ["/", "Inicio"],
    ["/funciones", "Funciones"],
    ["/precios", "Precios"],
    ["/software-pos-restaurantes", "POS restaurantes"],
    ["/contacto", "Contacto"]
  ];

  return items.map(([href, texto]) => {
    const clase = activa === href ? "activo" : "";
    return `<a class="${clase}" href="${href}">${texto}</a>`;
  }).join("");
}

function layout(datos) {
  const title = datos.title;
  const description   const description   const description   coE_URL + datos.path;

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
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    }
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(title)}</title>
<meta name="description" content="${escapar(description)}">
<link rel="canonical" href="${escapar(canonical)}">
<meta property="og:title" content="${escapar(title)}">
<meta property="og:description" content="${escapar(description)}">
<meta property="og:url" content="${escapar(canonical)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${BASE_URL}/marketing/login-restaurant-service.png">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>
:root{
  --bg:#08111f;
  --panel:#0f172a;
  --card:#111c2f;
  --text:#f8fafc;
  --muted:#cbd5e1;
  --line:rgba(255,255,255,.12);
  --brand:#f97316;
  --brand2:#22c55e;
}
*{box-sizing:border-box}
body{
  margin:0;
  font-family:Arial,Helvetica,sans-serif;
  background:radial-gradient(circle at top left,#1e293b 0,#08111f 42%,#020617 100%);
  color:var(--text);
}
a{color:inherit}
header{
  position:sticky;
  top:0;
  z-index:10;
  background:rgba(8,17,31,.88);
  backdrop-filter:blur(12px);
  border-bottom:1px solid var(--line);
}
.nav{
  max-width:1180px;
  margin:auto;
  padding:16px 22px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
}
.logo{
  font-weight:900;
  letter-spacing:.2px;
  display:flex;
  align-items:center;
  gap:10px;
}
.logo span{
  background:linear-gradient(135deg,var(--brand),#facc15);
  color:#111827;
  padding:7px 9px;
  border-radius:12px;
}
.menu{
  display:flex;
  gap:16px;
  align-items:center;
  flex-wrap:wrap;
}
.menu a{
  text-decoration:none;
  color:var(--muted);
  font-size:14px;
}
.menu a.activo,.menu a:hover{color:white}
.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:44px;
  padding:12px 18px;
  border-radius:999px;
  text-decoration:none;
  font-weight:800;
  border:1px solid var(--line);
}
.btn.primary{
  background:linear-gradient(135deg,var(--brand),#facc15);
  color:#111827;
  border:0;
}
.btn.secondary{
  background:rgba(255,255,255,.08);
  color:white;
}
.hero{
  max-width:1180px;
  margin:auto;
  padding:72px 22px 38px;
  display:grid;
  grid-template-columns:1.05fr .95fr;
  gap:38px;
  align-items:center;
}
.badge{
  display:inline-flex;
  color:#fed7aa;
  background:rgba(249,115,22,.12);
  border:1px solid rgba(249,115,22,.35);
  border-radius:999px;
  padding:8px 12px;
  font-size:14px;
  margin-bottom:18px;
}
h1{
  font-size:clamp(38px,6vw,68px);
  line-height:.95;
  margin:0 0 22px;
  letter-spacing:-2px;
}
.lead{
  font-size:20px;
  line-height:1.55;
  color:var(--muted);
  margin:0 0 28px;
}
.actions{
  display:flex;
  gap:14px;
  flex-wrap:wrap;
  margin-bottom:20px;
}
.note{
  color:#94a3b8;
  font-size:14px;
}
.hero-card{
  background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.04));
  border:1px solid var(--line);
  border-radius:28px;
  padding:14px;
  box-shadow:0 30px 80px rgba(0,0,0,.35);
}
.hero-card img{
  width:100%;
  display:block;
  border-radius:20px;
}
.precio{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:14px;
  margin-top:16px;
}
.precio div{
  background:rgba(15,23,42,.9);
  border:1px solid var(--line);
  padding:16px;
  border-radius:18px;
}
.precio strong{
  display:block;
  font-size:24px;
}
section{
  max-width:1180px;
  margin:auto;
  padding:40px 22px;
}
.section-title{
  font-size:36px;
  margin:0 0 12px;
  letter-spacing:-1px;
}
.section-text{
  color:var(--muted);
  max-width:780px;
  line-height:1.6;
  font-size:18px;
}
.grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
  margin-top:24px;
}
.card{
  background:rgba(15,23,42,.82);
  border:1px solid var(--line);
  border-radius:22px;
  padding:24px;
}
.card h3{
  margin:0 0 10px;
  font-size:22px;
}
.card p{
  margin:0;
  color:var(--muted);
  line-height:1.55;
}
.cta{
  text-align:center;
  background:linear-gradient(135deg,rgba(249,115,22,.18),rgba(34,197,94,.12));
  border:1px solid var(--line);
  border-radius:28px;
  padding:42px 24px;
}
.footer{
  border-top:1px solid var(--line);
  color:#94a3b8;
  padding:28px 22px;
  text-align:center;
}
@media(max-width:850px){
  .hero{grid-template-columns:1fr;padding-top:46px}
  .grid,.precio{grid-template-columns:1fr}
  .nav{align-items:flex-start;flex-direction:column}
  h1{letter-spacing:-1px}
}
</style>
</head>
<body>
<header>
  <div class="nav">
    <a class="logo" href="/"><span>RS</span> Restaurant Service POS</a>
    <nav class="menu">
      ${nav(datos.path)}
      <a href="/login">Entrar</a>
      <a class="btn primary" href="/registro">Probar gratis</a>
    </nav>
  </div>
</header>

<main>
${datos.contenido}
</main>

<footer class="footer">
  Restaurant Service POS · Software POS para restaurantes · <a href="/login">Entrar</a> · <a href="/registro">Prueba gratis</a>
</footer>
</body>
</html>`;
}

function home(req, res) {
  res.send(layout({
    path: "/",
    title: "Software POS para restaurantes sencillo y económico",
    description: "Restaurant Service POS permite gestionar mesas, comandas, pagos, caja y camareros desde PC y móvil por 7,50 € al mes.",
    contenido: `
<section class="hero">
  <div>
    <div class="badge">POS online para restaurantes, bares y cafeterías</div>
    <h1>Gestiona tu restaurante desde PC y móvil por 7,50 €/mes.</h1>
    <p class="lead">Restaurant Service POS es un sistema TPV sencillo para abrir mesas, enviar comandas, cobrar, controlar caja y trabajar con camareros desde cualquier navegador.</p>
    <div class="actions">
      <a class="btn primary" href="/registro">Probar gratis 7 días</a>
      <a class="btn secondary" href="/login">Entrar al POS</a>
    </div>
    <p class="note">Sin instalaciones complicadas. Ideal para restaurantes pequeños, bares, cafeterías y pizzerías.</p>
  </div>
  <div class="hero-card">
    <img src="/marketing/login-restaurant-service.png" alt="Restaurant Service POS para restaurantes">
    <div class="precio">
      <div><strong>7,50 €</strong><span>al mes</span></div>
      <div><strong>7 días</strong><span>prueba gratis</span></div>
      <div><strong>PC + móvil</strong><span>camareros</span></div>
    </div>
  </div>
</section>

<section>
  <h2 class="section-title">Un POS pensado para el servicio real</h2>
  <p class="section-text">Abre mesas, añade productos, envía comandas a barra o cocina, imprime cuentas, cobra con efectivo o tarjeta y revisa la caja diaria.</p>
  <div class="grid">
    <div class="card"><h3>Mesas y salas</h3><p>Crea salas, terrazas y mesas con la numeración que usa tu restaurante.</p></div>
    <div class="card"><h3>Comandas</h3><p>Envía solo los productos nuevos a barra o cocina, evitando duplicados.</p></div>
    <div class="card"><h3>Camareros móvil</h3><p>Los camareros pueden tomar pedidos desde su teléfono o terminal del local.</p></div>
    <div class="card"><h3>Caja diaria</h3><p>Consulta pagos, cierres, ventas y reportes del día.</p></div>
    <div class="card"><h3>Usuarios y permisos</h3><p>Administrador, gerente y camareros con accesos separados.</p></div>
    <div class="card"><h3>Backups</h3><p>Copias de seguridad por restaurante para proteger los datos.</p></div>
  </div>
</section>

<section>
  <div class="cta">
    <h2 class="section-title">Empieza con una prueba gratuita</h2>
    <p class="section-text" style="margin:auto auto 22px;">Configura tu restaurante online, crea mesas y productos, y prueba el POS antes de pagar.</p>
    <a class="btn primary" href="/registro">Crear cuenta gratis</a>
  </div>
</section>`
  }));
}

function paginaSimple(pathPagina, title, description, h1, texto, tarjetas) {
  return function(req, res) {
    res.send(layout({
      path: pathPagina,
      title,
      description,
      contenido: `
<section class="hero" style="grid-template-columns:1fr;">
  <div>
    <div class="badge">Restaurant Service POS</div>
    <h1>${escapar(h1)}</h1>
    <p class="lead">${escapar(texto)}</p>
    <div class="actions">
      <a class="btn primary" href="/registro">Probar gratis 7 días</a>
      <a class="btn secondary" href="/login">Entrar</a>
    </div>
  </div>
</section>
<section>
  <div class="grid">
    ${tarjetas.map(t => `<div class="card"><h3>${escapar(t[0])}</h3><p>${escapar(t[1])}</p></div>`).join("")}
  </div>
</section>`
    }));
  };
}

router.get("/", home);

router.get("/software-pos-restaurantes", paginaSimple(
  "/software-pos-restaurantes",
  "Software POS para restaurantes online",
  "Software POS para restaurantes con mesas, comandas, pagos, caja, usuarios y acceso desde móvil.",
  "Software POS para restaurantes",
  "Un sistema online para gestionar el servicio diario de restaurantes, bares y cafeterías sin complicaciones.",
  [
    ["Gestión de mesas", "Controla mesas libres y ocupadas desde una pantalla sencilla."],
    ["Comandas a cocina y barra", "Envía pedidos de forma ordenada durante el servicio."],
    ["Cobros y caja", "Registra pagos y revisa reportes del día."]
  ]
));

router.get("/tpv-restaurantes", paginaSimple(
  "/tpv-restaurantes",
  "TPV para restaurantes barato y sencillo",
  "TPV para restaurantes pequeños con prueba gratis, acceso online y precio mensual de 7,50 €.",
  "TPV para restaurantes barato y sencillo",
  "Restaurant Service POS es una alternativa económica para restaurantes que necesitan un TPV práctico y fácil.",
  [
    ["Precio claro", "7,50 € al mes después de la prueba gratuita."],
    ["Sin instalación complicada", "Funciona desde navegador en PC y móvil."],
    ["Ideal para pequeños negocios", "Pensado para restaurantes, bares, cafeterías y pizzerías."]
  ]
));

router.get("/sistema-comandas-restaurante", paginaSimple(
  "/sistema-comandas-restaurante",
  "Sistema de comandas para restaurantes",
  "Sistema de comandas para restaurantes con envío a barra y cocina desde PC o móvil.",
  "Sistema de comandas para restaurantes",
  "Organiza los pedidos del servicio y evita duplicar comandas al añadir productos nuevos.",
  [
    ["Comandas incrementales", "Envía solo lo nuevo a barra o cocina."],
    ["Notas por producto", "Añade indicaciones para cocina o barra."],
    ["Móvil camarero", "Toma pedidos desde la sala o terraza."]
  ]
));

router.get("/funciones", paginaSimple(
  "/funciones",
  "Funciones de Restaurant Service POS",
  "Funciones del POS: mesas, salas, comandas, productos, usuarios, pagos, caja, reportes y backups.",
  "Funciones de Restaurant Service POS",
  "Todo lo necesario para gestionar un servicio de restaurante de forma simple.",
  [
    ["Mesas y zonas", "Crea salas, terrazas y mesas libremente."],
    ["Productos y categorías", "Organiza bebidas, platos y precios."],
    ["Pagos múltiples", "Cobra en efectivo, tarjeta o pagos separados."],
    ["Caja y reportes", "Consulta ventas y cierres diarios."],
    ["Usuarios", "Gestiona administradores, gerentes y camareros."],
    ["Backups", "Descarga copias de seguridad del restaurante."]
  ]
));

router.get("/precios", paginaSimple(
  "/precios",
  "Precio del POS para restaurantes",
  "Restaurant Service POS cuesta 7,50 € al mes con prueba gratuita de 7 días.",
  "Precio simple: 7,50 €/mes",
  "Prueba gratis durante 7 días. Después, una suscripción mensual económica para mantener el POS activo.",
  [
    ["Prueba gratis", "7 días para configurar y probar el sistema."],
    ["Suscripción mensual", "7,50 € al mes."],
    ["Sin permanencia compleja", "Pensado para restaurantes que buscan una solución sencilla."]
  ]
));

router.get("/contacto", paginaSimple(
  "/contacto",
  "Contacto Restaurant Service POS",
  "Contacta con Restaurant Service POS para probar el software POS para restaurantes.",
  "Contacto",
  "Para soporte, dudas comerciales o información sobre Restaurant Service POS.",
  [
    ["Email", "info@restaurantservicepos.com"],
    ["Soporte", "soporte@restaurantservicepos.com"],
    ["Prueba gratis", "Puedes crear una cuenta desde la página de registro."]
  ]
));

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
  const urls = [
    "/",
    "/software-pos-restaurantes",
    "/tpv-restaurantes",
    "/sistema-comandas-restaurante",
    "/funciones",
    "/precios",
    "/contacto"
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${BASE_URL}${u}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u === "/" ? "1.0" : "0.8"}</priority>
  </url>`).join("\n")}
</urlset>`;

  res.type("application/xml").send(xml);
});

module.exports = function marketingPublicoRoutes() {
  return router;
};
