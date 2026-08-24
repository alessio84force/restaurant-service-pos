"use strict";

const express = require("express");

const BASE_URL = "https://restaurantservicepos.com";

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const paginas = {
  "/tpv-restaurantes-boadilla-del-monte": {
    title: "TPV para restaurantes en Boadilla del Monte | Restaurant Service POS",
    description: "Software TPV sencillo para restaurantes, bares y cafeterías en Boadilla del Monte. Gestiona mesas, comandas, tickets, pagos y usuarios por 7,50 €/mes.",
    h1: "TPV para restaurantes en Boadilla del Monte",
    lead: "Restaurant Service POS ayuda a restaurantes, bares y cafeterías de Boadilla del Monte a organizar el servicio diario con un TPV sencillo, rápido y accesible.",
    ciudad: "Boadilla del Monte",
    enfoque: "Una solución pensada para pequeños negocios de hostelería que necesitan controlar mesas, comandas, tickets y pagos sin sistemas complejos.",
    faq1: "¿Sirve para restaurantes pequeños de Boadilla del Monte?",
    faq1r: "Sí. Está pensado para restaurantes, bares y cafeterías que necesitan una herramienta clara para gestionar el servicio diario.",
    faq2: "¿Tiene prueba gratuita?",
    faq2r: "Sí. Restaurant Service POS permite comenzar con una prueba gratuita antes de activar la suscripción mensual."
  },
  "/tpv-restaurantes-madrid": {
    title: "TPV para restaurantes en Madrid | Restaurant Service POS",
    description: "TPV online para restaurantes en Madrid. Mesas, comandas, tickets, pagos, usuarios y gestión diaria por 7,50 €/mes.",
    h1: "TPV para restaurantes en Madrid",
    lead: "Un TPV sencillo para restaurantes, bares y cafeterías de Madrid que quieren gestionar el servicio sin complicaciones.",
    ciudad: "Madrid",
    enfoque: "Diseñado para locales que buscan una herramienta económica, clara y práctica para trabajar desde el ordenador de caja.",
    faq1: "¿Restaurant Service POS funciona para restaurantes de Madrid?",
    faq1r: "Sí. El sistema está disponible online y puede utilizarse en restaurantes, bares y cafeterías de Madrid y alrededores.",
    faq2: "¿Necesito instalar equipos caros?",
    faq2r: "No. La idea es ofrecer un sistema sencillo y accesible para trabajar desde el ordenador de caja y dispositivos del equipo."
  },
  "/tpv-restaurante-barato": {
    title: "TPV restaurante barato desde 7,50 €/mes | Restaurant Service POS",
    description: "TPV barato para restaurantes pequeños. Gestiona mesas, comandas, tickets, pagos y usuarios desde un sistema sencillo por 7,50 €/mes.",
    h1: "TPV restaurante barato desde 7,50 €/mes",
    lead: "Restaurant Service POS ofrece una alternativa económica para restaurantes pequeños que necesitan un TPV claro, útil y sin costes elevados.",
    ciudad: "España",
    enfoque: "Una opción pensada para negocios que quieren digitalizar su servicio diario sin pagar cuotas altas ni depender de sistemas difíciles.",
    faq1: "¿Cuánto cuesta Restaurant Service POS?",
    faq1r: "La suscripción mensual es de 7,50 €/mes, con prueba gratuita disponible.",
    faq2: "¿Qué incluye el TPV?",
    faq2r: "Incluye gestión de mesas, comandas, productos, tickets, pagos, usuarios y configuración básica del restaurante."
  },
  "/software-tpv-restaurantes-pequenos": {
    title: "Software TPV para restaurantes pequeños | Restaurant Service POS",
    description: "Software TPV para restaurantes pequeños. Fácil de usar, pensado para gestionar mesas, comandas, tickets, pagos y usuarios sin complicaciones.",
    h1: "Software TPV para restaurantes pequeños",
    lead: "Un software TPV pensado para restaurantes pequeños que necesitan controlar el servicio diario de forma sencilla y rápida.",
    ciudad: "España",
    enfoque: "Restaurant Service POS nace desde la experiencia real en hostelería: abrir mesas, añadir comandas, cobrar, imprimir tickets y cerrar el servicio.",
    faq1: "¿Está pensado para restaurantes pequeños?",
    faq1r: "Sí. La prioridad es que sea sencillo, claro y accesible para restaurantes pequeños y medianos.",
    faq2: "¿El equipo puede usarlo fácilmente?",
    faq2r: "Sí. El sistema está diseñado para que el propietario configure el restaurante y el equipo pueda trabajar con mesas y comandas de forma sencilla."
  },
  "/programa-comandas-restaurante": {
    title: "Programa de comandas para restaurante | Restaurant Service POS",
    description: "Programa para gestionar comandas en restaurantes. Envía pedidos, controla mesas, tickets y pagos desde un TPV sencillo.",
    h1: "Programa de comandas para restaurante",
    lead: "Gestiona comandas, mesas y tickets desde un sistema sencillo diseñado para el ritmo real de un restaurante.",
    ciudad: "España",
    enfoque: "El camarero puede añadir productos, organizar pedidos y trabajar con comandas de forma clara durante el servicio.",
    faq1: "¿Permite trabajar con comandas?",
    faq1r: "Sí. Restaurant Service POS permite gestionar pedidos y comandas para facilitar la organización del servicio.",
    faq2: "¿Sirve para barra y cocina?",
    faq2r: "Sí. El sistema está pensado para separar el trabajo operativo del restaurante y facilitar el envío de comandas."
  }
};

function renderPagina(path, pagina) {
  const canonical = BASE_URL + path;
  const schemaSoftware = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Restaurant Service POS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: BASE_URL,
    offers: {
      "@type": "Offer",
      price: "7.50",
      priceCurrency: "EUR"
    },
    description: pagina.description
  };

  const schemaLocal = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Restaurant Service POS",
    url: BASE_URL,
    email: "info@restaurantservicepos.com",
    areaServed: pagina.ciudad,
    description: pagina.description
  };

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(pagina.title)}</title>
  <meta name="description" content="${escapar(pagina.description)}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="${escapar(canonical)}">
  <meta property="og:title" content="${escapar(pagina.title)}">
  <meta property="og:description" content="${escapar(pagina.description)}">
  <meta property="og:url" content="${escapar(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${BASE_URL}/app/assets/login-restaurant-service.png">
  <script type="application/ld+json">${JSON.stringify(schemaSoftware)}</script>
  <script type="application/ld+json">${JSON.stringify(schemaLocal)}</script>
  <style>
    :root{
      --dark:#111827;
      --muted:#4b5563;
      --gold:#f59e0b;
      --soft:#fff7ed;
      --line:#e5e7eb;
      --green:#16a34a;
    }
    *{box-sizing:border-box}
    body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#111827}
    a{text-decoration:none}
    .hero{
      background:
        linear-gradient(120deg,rgba(17,24,39,.92),rgba(17,24,39,.68)),
        url('/app/assets/login-restaurant-service.png');
      background-size:cover;
      background-position:center;
      color:white;
      padding:78px 20px;
    }
    .wrap{max-width:1120px;margin:0 auto}
    .badge{display:inline-block;background:rgba(245,158,11,.16);border:1px solid rgba(245,158,11,.55);color:#fcd34d;border-radius:999px;padding:8px 13px;font-weight:900;font-size:14px}
    h1{font-size:clamp(36px,5vw,62px);line-height:1.02;margin:22px 0 18px;max-width:850px}
    .lead{font-size:21px;line-height:1.5;max-width:780px;color:#f3f4f6}
    .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}
    .btn{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:15px 21px;font-weight:900}
    .btn.primary{background:#f59e0b;color:#111827}
    .btn.secondary{background:rgba(255,255,255,.12);color:white;border:1px solid rgba(255,255,255,.35)}
    .section{padding:58px 20px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
    .card{background:white;border:1px solid var(--line);border-radius:24px;padding:24px;box-shadow:0 18px 40px rgba(15,23,42,.06)}
    .card h2,.card h3{margin:0 0 12px}
    .card p{color:var(--muted);line-height:1.6;margin:0}
    .price{font-size:42px;font-weight:900;color:#111827;margin:10px 0}
    .pill{display:inline-block;background:#dcfce7;color:#166534;border-radius:999px;padding:7px 11px;font-weight:900;font-size:13px}
    .features{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:24px}
    .feature{background:var(--soft);border:1px solid #fed7aa;border-radius:18px;padding:18px;font-weight:900;color:#9a3412;text-align:center}
    .faq{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    .footer{background:#111827;color:#d1d5db;padding:34px 20px;text-align:center}
    .footer a{color:#fbbf24}
    @media(max-width:820px){
      .grid,.features,.faq{grid-template-columns:1fr}
      .hero{padding:56px 18px}
    }
  </style>
</head>
<body>
  <section class="hero">
    <div class="wrap">
      <span class="badge">Restaurant Service POS · TPV sencillo para hostelería</span>
      <h1>${escapar(pagina.h1)}</h1>
      <p class="lead">${escapar(pagina.lead)}</p>
      <div class="actions">
        <a class="btn primary" href="/registro">Probar gratis</a>
        <a class="btn secondary" href="/precios">Ver precio</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="grid">
        <div class="card">
          <span class="pill">Precio claro</span>
          <div class="price">7,50 €/mes</div>
          <p>Una cuota mensual accesible para restaurantes pequeños y medianos que quieren controlar mejor su servicio diario.</p>
        </div>
        <div class="card">
          <h2>Gestión sencilla</h2>
          <p>${escapar(pagina.enfoque)}</p>
        </div>
        <div class="card">
          <h2>Prueba gratuita</h2>
          <p>Empieza a probar el sistema antes de activar la suscripción mensual. Sin complicaciones para el restaurante.</p>
        </div>
      </div>

      <div class="features">
        <div class="feature">Mesas</div>
        <div class="feature">Comandas</div>
        <div class="feature">Tickets</div>
        <div class="feature">Pagos</div>
      </div>
    </div>
  </section>

  <section class="section" style="background:white">
    <div class="wrap">
      <h2>Un TPV pensado para el trabajo real del restaurante</h2>
      <p style="color:#4b5563;line-height:1.7;font-size:18px;max-width:880px">
        Restaurant Service POS permite organizar el servicio desde el ordenador de caja, abrir mesas, añadir productos,
        trabajar con comandas, imprimir tickets, gestionar pagos y controlar usuarios. Es una solución práctica para
        negocios de hostelería que buscan claridad, rapidez y un coste reducido.
      </p>

      <div class="actions">
        <a class="btn primary" href="/registro">Crear cuenta gratis</a>
        <a class="btn secondary" style="color:#111827;border-color:#d1d5db" href="/contacto">Contactar</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>Preguntas frecuentes</h2>
      <div class="faq">
        <div class="card">
          <h3>${escapar(pagina.faq1)}</h3>
          <p>${escapar(pagina.faq1r)}</p>
        </div>
        <div class="card">
          <h3>${escapar(pagina.faq2)}</h3>
          <p>${escapar(pagina.faq2r)}</p>
        </div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <strong>Restaurant Service POS</strong><br>
    TPV sencillo para restaurantes · <a href="/">Inicio</a> · <a href="/precios">Precios</a> · <a href="/contacto">Contacto</a>
  </footer>
</body>
</html>`;
}

function sitemapXml() {
  const urls = [
    "/",
    "/funciones",
    "/precios",
    "/software-pos-restaurantes",
    "/tpv-restaurantes",
    "/sistema-comandas-restaurante",
    "/contacto",
    "/privacidad",
    "/terminos",

    "/it",
    "/it/funzionalita",
    "/it/prezzi",
    "/it/contatto",

    "/en",
    "/en/features",
    "/en/pricing",
    "/en/contact",

    "/pt-br",
    "/pt-br/funcionalidades",
    "/pt-br/precos",
    "/pt-br/contato",

    ...Object.keys(paginas)
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${BASE_URL}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === "/" ? "1.0" : "0.8"}</priority>
  </url>`).join("\n")}
</urlset>`;
}

module.exports = function seoLocalesRoutes() {
  const router = express.Router();

  Object.keys(paginas).forEach((path) => {
    router.get(path, function (_req, res) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(renderPagina(path, paginas[path]));
    });
  });

  router.get("/sitemap.xml", function (_req, res) {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(sitemapXml());
  });

  return router;
};
