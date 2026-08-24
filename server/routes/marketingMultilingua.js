"use strict";

const express = require("express");

const router = express.Router();

const BASE_URL = "https://restaurantservicepos.com";

function esc(texto) {
  return String(texto == null ? "" : texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const idiomas = {
  it: {
    lang: "it",
    prefix: "/it",

    nav: {
      home: "Home",
      features: "Funzionalità",
      pricing: "Prezzi",
      contact: "Contatti",
      login: "Accedi",
      trial: "Prova gratis"
    },

    footer: {
      text: "Software POS per ristoranti",
      trial: "Prova gratis",
      login: "Accedi"
    },

    home: {
      path: "/it",
      title: "Software POS per ristoranti semplice ed economico | Restaurant Service POS",
      description: "Gestisci tavoli, comande, pagamenti, cassa e personale da PC e mobile con Restaurant Service POS.",
      badge: "POS online per ristoranti, bar e caffetterie",
      h1: "Gestisci il tuo ristorante da PC e mobile.",
      lead: "Restaurant Service POS è un sistema POS semplice per aprire tavoli, inviare comande, gestire i pagamenti, controllare la cassa e lavorare con il personale da qualsiasi browser.",
      primary: "Prova gratis 7 giorni",
      secondary: "Accedi al POS",
      sectionTitle: "Un POS pensato per il servizio reale",
      sectionText: "Apri tavoli, aggiungi prodotti, invia comande al bar o in cucina, stampa il conto, registra pagamenti e controlla la cassa giornaliera.",
      cards: [
        ["Tavoli e sale", "Crea sale, terrazze e tavoli utilizzando la numerazione del tuo ristorante."],
        ["Comande", "Invia al bar o in cucina solo i nuovi prodotti aggiunti, evitando duplicati."],
        ["Personale da mobile", "Il personale può prendere le comande dal telefono o da un dispositivo del locale."],
        ["Cassa giornaliera", "Controlla pagamenti, chiusure e report della giornata."],
        ["Utenti", "Amministratore, responsabili e personale con permessi separati."],
        ["Prezzo semplice", "Prova gratuita di 7 giorni. Poi un abbonamento mensile conveniente."]
      ],
      ctaTitle: "Inizia con una prova gratuita",
      ctaText: "Configura il ristorante online, crea tavoli e prodotti e prova il POS prima di abbonarti.",
      ctaButton: "Crea account gratis"
    },

    features: {
      path: "/it/funzionalita",
      title: "Funzionalità del POS per ristoranti | Restaurant Service POS",
      description: "Tavoli, sale, comande, prodotti, utenti, pagamenti, cassa e report in un unico POS per ristoranti.",
      h1: "Tutto ciò che serve per gestire il servizio",
      text: "Restaurant Service POS riunisce le funzioni essenziali per gestire il lavoro quotidiano di un ristorante in modo semplice.",
      cards: [
        ["Tavoli", "Gestisci tavoli liberi e occupati durante il servizio."],
        ["Comande", "Invia gli ordini al bar o in cucina."],
        ["Cassa", "Controlla pagamenti, chiusure e report."]
      ]
    },

    pricing: {
      path: "/it/prezzi",
      title: "Prezzi Restaurant Service POS",
      description: "Scopri il prezzo di Restaurant Service POS e prova gratuitamente il software POS per ristoranti.",
      h1: "Un prezzo semplice e trasparente",
      text: "Prova gratuitamente Restaurant Service POS per 7 giorni. Poi puoi continuare con un abbonamento mensile semplice e accessibile.",
      cards: [
        ["Prova gratuita", "7 giorni per configurare e provare il sistema."],
        ["Abbonamento", "Una quota mensile semplice per mantenere attivo il POS."],
        ["Nessuna complessità", "Un sistema pensato per piccoli ristoranti e attività di ristorazione."]
      ]
    },

    contact: {
      path: "/it/contatto",
      title: "Contatti Restaurant Service POS",
      description: "Contatta Restaurant Service POS per informazioni, supporto o domande sul software POS per ristoranti.",
      h1: "Contatti",
      text: "Per supporto, informazioni commerciali o domande su Restaurant Service POS puoi scrivere a info@restaurantservicepos.com.",
      cards: [
        ["Email", "info@restaurantservicepos.com"],
        ["Prodotto", "POS online per ristoranti, bar e caffetterie."],
        ["Prova", "Puoi creare un account e provare il sistema gratuitamente."]
      ]
    }
  },

  en: {
    lang: "en",
    prefix: "/en",

    nav: {
      home: "Home",
      features: "Features",
      pricing: "Pricing",
      contact: "Contact",
      login: "Log in",
      trial: "Try for free"
    },

    footer: {
      text: "Restaurant POS software",
      trial: "Free trial",
      login: "Log in"
    },

    home: {
      path: "/en",
      title: "Simple and affordable restaurant POS software | Restaurant Service POS",
      description: "Manage tables, orders, payments, cash operations and staff from desktop and mobile with Restaurant Service POS.",
      badge: "Online POS for restaurants, bars and cafés",
      h1: "Manage your restaurant from desktop and mobile.",
      lead: "Restaurant Service POS is a simple point-of-sale system for opening tables, sending orders, recording payments, managing cash operations and working with staff from any browser.",
      primary: "Start 7-day free trial",
      secondary: "Log in to POS",
      sectionTitle: "A POS built for real restaurant service",
      sectionText: "Open tables, add products, send orders to the bar or kitchen, print bills, record payments and review daily cash activity.",
      cards: [
        ["Tables and areas", "Create dining areas, terraces and tables using your restaurant's own numbering."],
        ["Orders", "Send only newly added items to the bar or kitchen and avoid duplicate orders."],
        ["Mobile staff access", "Staff can take orders from a phone or a device provided by the restaurant."],
        ["Daily cash activity", "Review payments, closing activity and daily reports."],
        ["Users", "Administrator, manager and staff roles with separate permissions."],
        ["Simple pricing", "7-day free trial followed by an affordable monthly subscription."]
      ],
      ctaTitle: "Start with a free trial",
      ctaText: "Configure your restaurant online, create tables and products, and test the POS before subscribing.",
      ctaButton: "Create free account"
    },

    features: {
      path: "/en/features",
      title: "Restaurant POS features | Restaurant Service POS",
      description: "Tables, areas, orders, products, users, payments, cash management and reports in one restaurant POS.",
      h1: "Everything you need to run daily service",
      text: "Restaurant Service POS brings together the essential tools needed to manage day-to-day restaurant service simply.",
      cards: [
        ["Tables", "Manage available and occupied tables during service."],
        ["Orders", "Send orders to the bar or kitchen."],
        ["Cash management", "Review payments, closing activity and reports."]
      ]
    },

    pricing: {
      path: "/en/pricing",
      title: "Restaurant Service POS pricing",
      description: "Discover Restaurant Service POS pricing and start a free trial of the restaurant POS software.",
      h1: "Simple and transparent pricing",
      text: "Try Restaurant Service POS free for 7 days. After the trial, continue with a simple and affordable monthly subscription.",
      cards: [
        ["Free trial", "7 days to configure and test the system."],
        ["Subscription", "A simple monthly fee to keep your POS active."],
        ["Built for simplicity", "Designed for independent restaurants and small hospitality businesses."]
      ]
    },

    contact: {
      path: "/en/contact",
      title: "Contact Restaurant Service POS",
      description: "Contact Restaurant Service POS for information, support or questions about our restaurant POS software.",
      h1: "Contact",
      text: "For support, sales information or questions about Restaurant Service POS, email info@restaurantservicepos.com.",
      cards: [
        ["Email", "info@restaurantservicepos.com"],
        ["Product", "Online POS for restaurants, bars and cafés."],
        ["Trial", "Create an account and try the system free of charge."]
      ]
    }
  },

  "pt-br": {
    lang: "pt-BR",
    prefix: "/pt-br",

    nav: {
      home: "Início",
      features: "Funcionalidades",
      pricing: "Preços",
      contact: "Contato",
      login: "Entrar",
      trial: "Teste grátis"
    },

    footer: {
      text: "Software POS para restaurantes",
      trial: "Teste grátis",
      login: "Entrar"
    },

    home: {
      path: "/pt-br",
      title: "Software POS para restaurantes simples e acessível | Restaurant Service POS",
      description: "Gerencie mesas, comandas, pagamentos, caixa e equipe pelo computador e pelo celular com o Restaurant Service POS.",
      badge: "POS online para restaurantes, bares e cafeterias",
      h1: "Gerencie seu restaurante pelo computador e pelo celular.",
      lead: "O Restaurant Service POS é um sistema simples para abrir mesas, enviar comandas, registrar pagamentos, controlar o caixa e trabalhar com sua equipe diretamente pelo navegador.",
      primary: "Teste grátis por 7 dias",
      secondary: "Entrar no POS",
      sectionTitle: "Um POS pensado para o serviço real",
      sectionText: "Abra mesas, adicione produtos, envie comandas para o bar ou para a cozinha, imprima a conta, registre pagamentos e acompanhe o caixa diário.",
      cards: [
        ["Mesas e ambientes", "Crie salões, áreas externas e mesas usando a organização do seu próprio restaurante."],
        ["Comandas", "Envie ao bar ou à cozinha somente os novos itens adicionados, evitando duplicações."],
        ["Equipe pelo celular", "A equipe pode registrar comandas pelo celular ou por um dispositivo do restaurante."],
        ["Caixa diário", "Acompanhe pagamentos, fechamentos e relatórios do dia."],
        ["Usuários", "Administrador, gerente e equipe com permissões separadas."],
        ["Preço simples", "Teste grátis por 7 dias e depois uma assinatura mensal acessível."]
      ],
      ctaTitle: "Comece com um teste grátis",
      ctaText: "Configure seu restaurante, crie mesas e produtos e teste o POS antes de assinar.",
      ctaButton: "Criar conta grátis"
    },

    features: {
      path: "/pt-br/funcionalidades",
      title: "Funcionalidades do POS para restaurantes | Restaurant Service POS",
      description: "Mesas, ambientes, comandas, produtos, usuários, pagamentos, caixa e relatórios em um único POS para restaurantes.",
      h1: "Tudo o que você precisa para gerenciar o serviço",
      text: "O Restaurant Service POS reúne as funções essenciais para administrar o dia a dia de um restaurante de forma simples.",
      cards: [
        ["Mesas", "Gerencie mesas livres e ocupadas durante o serviço."],
        ["Comandas", "Envie pedidos para o bar ou para a cozinha."],
        ["Caixa", "Acompanhe pagamentos, fechamentos e relatórios."]
      ]
    },

    pricing: {
      path: "/pt-br/precos",
      title: "Preços do Restaurant Service POS",
      description: "Conheça o preço do Restaurant Service POS e teste grátis o software POS para restaurantes.",
      h1: "Um preço simples e transparente",
      text: "Teste o Restaurant Service POS grátis por 7 dias. Depois, continue com uma assinatura mensal simples e acessível.",
      cards: [
        ["Teste grátis", "7 dias para configurar e testar o sistema."],
        ["Assinatura", "Uma mensalidade simples para manter o POS ativo."],
        ["Sem complicação", "Um sistema pensado para restaurantes independentes e pequenos negócios de alimentação."]
      ]
    },

    contact: {
      path: "/pt-br/contato",
      title: "Contato Restaurant Service POS",
      description: "Entre em contato com o Restaurant Service POS para informações, suporte ou dúvidas sobre o software POS para restaurantes.",
      h1: "Contato",
      text: "Para suporte, informações comerciais ou dúvidas sobre o Restaurant Service POS, escreva para info@restaurantservicepos.com.",
      cards: [
        ["E-mail", "info@restaurantservicepos.com"],
        ["Produto", "POS online para restaurantes, bares e cafeterias."],
        ["Teste", "Crie uma conta e teste o sistema gratuitamente."]
      ]
    }
  }
};

function hreflangLinks(pageKey) {
  const esPaths = {
    home: "/",
    features: "/funciones",
    pricing: "/precios",
    contact: "/contacto"
  };

  const itPaths = {
    home: "/it",
    features: "/it/funzionalita",
    pricing: "/it/prezzi",
    contact: "/it/contatto"
  };

  const enPaths = {
    home: "/en",
    features: "/en/features",
    pricing: "/en/pricing",
    contact: "/en/contact"
  };

  const ptBrPaths = {
    home: "/pt-br",
    features: "/pt-br/funcionalidades",
    pricing: "/pt-br/precos",
    contact: "/pt-br/contato"
  };

  return `
<link rel="alternate" hreflang="es" href="${BASE_URL}${esPaths[pageKey]}">
<link rel="alternate" hreflang="it" href="${BASE_URL}${itPaths[pageKey]}">
<link rel="alternate" hreflang="en" href="${BASE_URL}${enPaths[pageKey]}">
<link rel="alternate" hreflang="pt-BR" href="${BASE_URL}${ptBrPaths[pageKey]}">
<link rel="alternate" hreflang="x-default" href="${BASE_URL}${esPaths[pageKey]}">`;
}

function layout({ idioma, pageKey, page, body }) {
  const t = idiomas[idioma];
  const canonical = BASE_URL + page.path;

  const linksPorIdioma = {
    it: {
      home: "/it",
      features: "/it/funzionalita",
      pricing: "/it/prezzi",
      contact: "/it/contatto"
    },

    en: {
      home: "/en",
      features: "/en/features",
      pricing: "/en/pricing",
      contact: "/en/contact"
    },

    "pt-br": {
      home: "/pt-br",
      features: "/pt-br/funcionalidades",
      pricing: "/pt-br/precos",
      contact: "/pt-br/contato"
    }
  };

  const links =
    linksPorIdioma[idioma] ||
    linksPorIdioma.en;

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Restaurant Service POS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: BASE_URL,
    description: page.description,
    offers: {
      "@type": "Offer",
      price: "7.50",
      priceCurrency: "EUR"
    }
  };

  return `<!DOCTYPE html>
<html lang="${esc(t.lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${esc(canonical)}">
${hreflangLinks(pageKey)}
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${BASE_URL}/marketing/login-restaurant-service.png">
<script type="application/ld+json">${JSON.stringify(schema)}</script>

<style>
*{box-sizing:border-box}
body{
  margin:0;
  font-family:Arial,Helvetica,sans-serif;
  background:#07111f;
  color:#f8fafc
}
a{color:inherit}
header{
  border-bottom:1px solid rgba(255,255,255,.12);
  background:#08111f;
  position:sticky;
  top:0;
  z-index:10
}
.nav{
  max-width:1160px;
  margin:auto;
  padding:16px 22px;
  display:flex;
  justify-content:space-between;
  gap:16px;
  align-items:center;
  flex-wrap:wrap
}
.logo{
  text-decoration:none;
  font-weight:900
}
.menu{
  display:flex;
  gap:14px;
  align-items:center;
  flex-wrap:wrap
}
.menu a{
  text-decoration:none;
  color:#cbd5e1;
  font-size:14px
}
.lang{
  display:flex;
  gap:6px;
  align-items:center;
  margin-left:4px
}
.lang a{
  border:1px solid rgba(255,255,255,.18);
  border-radius:999px;
  padding:6px 9px;
  font-size:12px;
  font-weight:900
}
.lang a.active{
  background:#f97316;
  color:#111827;
  border-color:#f97316
}
.btn{
  display:inline-block;
  padding:12px 18px;
  border-radius:999px;
  text-decoration:none;
  font-weight:800
}
.btn.primary{
  background:#f97316;
  color:#111827
}
.btn.secondary{
  background:rgba(255,255,255,.1);
  color:white
}
.hero{
  max-width:1160px;
  margin:auto;
  padding:70px 22px 35px;
  display:grid;
  grid-template-columns:1.05fr .95fr;
  gap:36px;
  align-items:center
}
.hero.simple{
  grid-template-columns:1fr
}
.badge{
  display:inline-block;
  background:rgba(249,115,22,.15);
  color:#fed7aa;
  border:1px solid rgba(249,115,22,.35);
  padding:8px 12px;
  border-radius:999px;
  margin-bottom:18px
}
h1{
  font-size:clamp(38px,6vw,68px);
  line-height:.95;
  margin:0 0 22px;
  letter-spacing:-2px
}
.lead{
  font-size:20px;
  line-height:1.55;
  color:#cbd5e1;
  margin:0 0 26px
}
.actions{
  display:flex;
  gap:14px;
  flex-wrap:wrap
}
.image-card{
  background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.13);
  border-radius:28px;
  padding:14px
}
.image-card img{
  width:100%;
  display:block;
  border-radius:20px
}
section{
  max-width:1160px;
  margin:auto;
  padding:40px 22px
}
h2{
  font-size:34px;
  margin:0 0 12px
}
.text{
  color:#cbd5e1;
  font-size:18px;
  line-height:1.6;
  max-width:820px
}
.grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
  margin-top:24px
}
.card{
  background:#0f172a;
  border:1px solid rgba(255,255,255,.12);
  border-radius:22px;
  padding:24px
}
.card h3{
  margin:0 0 10px;
  font-size:22px
}
.card p{
  margin:0;
  color:#cbd5e1;
  line-height:1.55
}
.cta{
  text-align:center;
  background:linear-gradient(135deg,rgba(249,115,22,.22),rgba(34,197,94,.12));
  border-radius:28px;
  padding:42px 22px;
  border:1px solid rgba(255,255,255,.12)
}
footer{
  text-align:center;
  color:#94a3b8;
  border-top:1px solid rgba(255,255,255,.12);
  padding:28px 22px
}
@media(max-width:850px){
  .hero{
    grid-template-columns:1fr;
    padding-top:45px
  }
  .grid{
    grid-template-columns:1fr
  }
  h1{
    letter-spacing:-1px
  }
}
</style>
</head>

<body>

<header>
  <div class="nav">

    <a class="logo" href="${links.home}">
      Restaurant Service POS
    </a>

    <nav class="menu">
      <a href="${links.features}">${esc(t.nav.features)}</a>
      <a href="${links.pricing}">${esc(t.nav.pricing)}</a>
      <a href="${links.contact}">${esc(t.nav.contact)}</a>

      <a href="/login?idioma=${idioma}">${esc(t.nav.login)}</a>

      <a class="btn primary" href="/registro?idioma=${idioma}">
        ${esc(t.nav.trial)}
      </a>

      <div class="lang">
        <a href="/">ES</a>
        <a href="/it" class="${idioma === "it" ? "active" : ""}">IT</a>
        <a href="/en" class="${idioma === "en" ? "active" : ""}">EN</a>
        <a href="/pt-br" class="${idioma === "pt-br" ? "active" : ""}">PT-BR</a>
      </div>
    </nav>

  </div>
</header>

<main>
${body}
</main>

<footer>
  Restaurant Service POS · ${esc(t.footer.text)}
  · <a href="/registro?idioma=${idioma}">${esc(t.footer.trial)}</a>
  · <a href="/login?idioma=${idioma}">${esc(t.footer.login)}</a>
</footer>

</body>
</html>`;
}

function renderHome(idioma) {
  const t = idiomas[idioma];
  const p = t.home;

  const cards = p.cards.map(function(card) {
    return `
      <div class="card">
        <h3>${esc(card[0])}</h3>
        <p>${esc(card[1])}</p>
      </div>`;
  }).join("");

  return layout({
    idioma,
    pageKey: "home",
    page: p,
    body: `
<section class="hero">

  <div>
    <div class="badge">${esc(p.badge)}</div>

    <h1>${esc(p.h1)}</h1>

    <p class="lead">${esc(p.lead)}</p>

    <div class="actions">
      <a class="btn primary" href="/registro?idioma=${idioma}">${esc(p.primary)}</a>
      <a class="btn secondary" href="/login?idioma=${idioma}">${esc(p.secondary)}</a>
    </div>
  </div>

  <div class="image-card">
    <img
      src="/marketing/login-restaurant-service.png"
      alt="Restaurant Service POS"
    >
  </div>

</section>

<section>

  <h2>${esc(p.sectionTitle)}</h2>

  <p class="text">${esc(p.sectionText)}</p>

  <div class="grid">
    ${cards}
  </div>

</section>

<section>

  <div class="cta">

    <h2>${esc(p.ctaTitle)}</h2>

    <p class="text" style="margin:auto auto 22px;">
      ${esc(p.ctaText)}
    </p>

    <a class="btn primary" href="/registro?idioma=${idioma}">
      ${esc(p.ctaButton)}
    </a>

  </div>

</section>`
  });
}

function renderSimple(idioma, pageKey) {
  const t = idiomas[idioma];
  const p = t[pageKey];

  const cards = p.cards.map(function(card) {
    return `
      <div class="card">
        <h3>${esc(card[0])}</h3>
        <p>${esc(card[1])}</p>
      </div>`;
  }).join("");

  return layout({
    idioma,
    pageKey,
    page: p,
    body: `
<section class="hero simple">

  <div>

    <div class="badge">
      Restaurant Service POS
    </div>

    <h1>${esc(p.h1)}</h1>

    <p class="lead">${esc(p.text)}</p>

    <div class="actions">
      <a class="btn primary" href="/registro?idioma=${idioma}">
        ${esc(t.nav.trial)}
      </a>

      <a class="btn secondary" href="/login?idioma=${idioma}">
        ${esc(t.nav.login)}
      </a>
    </div>

  </div>

</section>

<section>

  <div class="grid">
    ${cards}
  </div>

</section>`
  });
}


/* ITALIANO */

router.get("/it", function(req, res) {
  res.send(renderHome("it"));
});

router.get("/it/", function(req, res) {
  res.redirect(301, "/it");
});

router.get("/it/funzionalita", function(req, res) {
  res.send(renderSimple("it", "features"));
});

router.get("/it/prezzi", function(req, res) {
  res.send(renderSimple("it", "pricing"));
});

router.get("/it/contatto", function(req, res) {
  res.send(renderSimple("it", "contact"));
});


/* ENGLISH */

router.get("/en", function(req, res) {
  res.send(renderHome("en"));
});

router.get("/en/", function(req, res) {
  res.redirect(301, "/en");
});

router.get("/en/features", function(req, res) {
  res.send(renderSimple("en", "features"));
});

router.get("/en/pricing", function(req, res) {
  res.send(renderSimple("en", "pricing"));
});

router.get("/en/contact", function(req, res) {
  res.send(renderSimple("en", "contact"));
});


/* PORTUGUÊS DO BRASIL */

router.get(/^\/pt-br\/$/, function(req, res) {
  res.redirect(301, "/pt-br");
});

router.get("/pt-br", function(req, res) {
  res.send(renderHome("pt-br"));
});

router.get("/pt-br/funcionalidades", function(req, res) {
  res.send(renderSimple("pt-br", "features"));
});

router.get("/pt-br/precos", function(req, res) {
  res.send(renderSimple("pt-br", "pricing"));
});

router.get("/pt-br/contato", function(req, res) {
  res.send(renderSimple("pt-br", "contact"));
});


module.exports = function marketingMultilinguaRoutes() {
  return router;
};
