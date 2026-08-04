const express = require("express");
const {
  textosManualCliente
} = require("../utils/manualClienteI18n");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function env(nombre, defecto) {
  const valor = process.env[nombre];
  if (valor == null || String(valor).trim() === "") return defecto || "";
  return String(valor).trim();
}

function datos() {
  return {
    nombre: env("LEGAL_NOMBRE_COMERCIAL", "Restaurant Service POS"),
    soporte: env("LEGAL_SOPORTE", "soporte@restaurantservicepos.com"),
    email: env("LEGAL_EMAIL", "info@restaurantservicepos.com")
  };
}

function textosManualReq(req) {
  const usuario =
    req.session && req.session.usuario
      ? req.session.usuario
      : {};

  const idioma =
    (req.session && req.session.idioma) ||
    usuario.idioma ||
    "es";

  return textosManualCliente(idioma);
}

function renderPasos(lista) {
  return (lista || [])
    .map(function(texto) {
      return (
        '<div class="paso">' +
        escapar(texto) +
        "</div>"
      );
    })
    .join("");
}

function renderTarjetas(lista) {
  return (lista || [])
    .map(function(item) {
      return (
        '<div class="mini">' +
        "<strong>" +
        escapar(item.titulo) +
        "</strong>" +
        "<span>" +
        escapar(item.texto) +
        "</span>" +
        "</div>"
      );
    })
    .join("");
}

function renderChecklist(lista) {
  return (lista || [])
    .map(function(texto) {
      return (
        '<div class="check">' +
        escapar(texto) +
        "</div>"
      );
    })
    .join("");
}

function renderBadges(lista) {
  return (lista || [])
    .map(function(texto) {
      return (
        '<span class="badge">' +
        escapar(texto) +
        "</span>"
      );
    })
    .join("");
}

function paginaManual(textos) {
  const d = datos();

  return `<!doctype html>
<html lang="${escapar(textos.lang)}">
<head>
  <meta charset="utf-8">
  <title>${escapar(textos.tituloPagina)} - ${escapar(d.nombre)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root{
      --bg:#f3f4f6;
      --card:#ffffff;
      --text:#111827;
      --muted:#6b7280;
      --line:#e5e7eb;
      --brand:#2563eb;
      --dark:#0f172a;
      --ok:#16a34a;
      --warn:#f59e0b;
    }

    *{box-sizing:border-box;}

    html{scroll-behavior:smooth;}

    body{
      margin:0;
      font-family:Arial, Helvetica, sans-serif;
      background:
        radial-gradient(circle at 10% 8%, rgba(245,158,11,.20), transparent 30%),
        radial-gradient(circle at 86% 14%, rgba(59,130,246,.18), transparent 28%),
        linear-gradient(135deg,#0f172a 0%,#111827 32%,#f8fafc 32%,#f3f4f6 100%);
      color:var(--text);
    }

    .wrap{
      max-width:1180px;
      margin:0 auto;
      padding:24px 18px 60px;
    }

    .hero{
      position:relative;
      overflow:hidden;
      background:
        linear-gradient(135deg,rgba(17,24,39,.96),rgba(30,64,175,.68)),
        radial-gradient(circle at 92% 18%, rgba(245,158,11,.60), transparent 32%);
      color:white;
      border-radius:30px;
      padding:28px;
      box-shadow:0 24px 70px rgba(15,23,42,.28);
      border:1px solid rgba(255,255,255,.14);
      margin-bottom:18px;
    }

    .hero:after{
      content:"";
      position:absolute;
      right:-88px;
      top:-88px;
      width:230px;
      height:230px;
      border-radius:999px;
      background:rgba(255,255,255,.12);
      border:1px solid rgba(255,255,255,.16);
      pointer-events:none;
    }

    .hero h1{
      position:relative;
      z-index:1;
      margin:0 0 8px;
      font-size:34px;
      letter-spacing:-.045em;
      line-height:1.02;
    }

    .hero p{
      position:relative;
      z-index:1;
      margin:0;
      color:#dbeafe;
      line-height:1.5;
      font-size:15px;
      max-width:780px;
    }

    .hero-actions{
      position:relative;
      z-index:1;
      margin-top:18px;
      display:flex;
      flex-wrap:wrap;
      gap:10px;
    }

    .hero-actions a,
    a.btn,
    button{
      display:inline-block;
      color:white;
      text-decoration:none;
      border:1px solid rgba(255,255,255,.22);
      border-radius:13px;
      padding:10px 14px;
      font-size:13px;
      font-weight:900;
      background:linear-gradient(135deg,#2563eb,#14b8a6);
      box-shadow:0 10px 24px rgba(15,23,42,.14);
      transition:transform .16s ease, box-shadow .16s ease;
      cursor:pointer;
    }

    .hero-actions a:hover,
    a.btn:hover,
    button:hover{
      transform:translateY(-2px);
      box-shadow:0 16px 34px rgba(15,23,42,.20);
    }

    .hero-actions a.sec,
    a.sec,
    button.sec{
      background:linear-gradient(135deg,#ffffff,#dbeafe);
      color:#0f172a;
      border:1px solid rgba(255,255,255,.72);
    }

    .layout{
      display:grid;
      grid-template-columns:280px minmax(0,1fr);
      gap:18px;
      align-items:start;
    }

    .indice{
      position:sticky;
      top:14px;
      background:rgba(255,255,255,.94);
      border:1px solid rgba(229,231,235,.92);
      border-radius:24px;
      padding:16px;
      box-shadow:0 14px 36px rgba(15,23,42,.09);
      backdrop-filter:blur(12px);
    }

    .indice h2{
      margin:0 0 12px;
      font-size:18px;
      letter-spacing:-.035em;
    }

    .indice a{
      display:block;
      text-decoration:none;
      color:#1f2937;
      border-radius:12px;
      padding:9px 10px;
      font-size:14px;
      font-weight:800;
    }

    .indice a:hover{
      background:#eff6ff;
      color:#1d4ed8;
    }

    .card{
      background:rgba(255,255,255,.94);
      border:1px solid rgba(229,231,235,.92);
      border-radius:24px;
      padding:22px;
      box-shadow:0 14px 36px rgba(15,23,42,.09);
      margin-bottom:16px;
      backdrop-filter:blur(12px);
    }

    h2{
      margin:0 0 12px;
      font-size:25px;
      letter-spacing:-.04em;
      color:var(--dark);
    }

    h3{
      margin:20px 0 8px;
      font-size:18px;
      letter-spacing:-.03em;
      color:var(--dark);
    }

    p, li{
      color:#374151;
      font-size:15px;
      line-height:1.6;
    }

    ul, ol{
      padding-left:22px;
    }

    .pasos{
      counter-reset:paso;
      display:grid;
      gap:10px;
      margin-top:12px;
    }

    .paso{
      counter-increment:paso;
      border:1px solid var(--line);
      border-radius:18px;
      padding:13px 14px 13px 48px;
      background:linear-gradient(180deg,#ffffff,#f9fafb);
      position:relative;
      line-height:1.5;
      color:#374151;
      font-size:15px;
      box-shadow:0 8px 20px rgba(15,23,42,.05);
    }

    .paso:before{
      content:counter(paso);
      position:absolute;
      left:13px;
      top:12px;
      width:24px;
      height:24px;
      border-radius:50%;
      background:linear-gradient(135deg,#2563eb,#14b8a6);
      color:white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:13px;
      font-weight:900;
    }

    .tip{
      background:linear-gradient(135deg,#ecfdf5,#f0fdfa);
      border:1px solid #99f6e4;
      color:#14532d;
      border-radius:18px;
      padding:14px 16px;
      line-height:1.55;
      margin:14px 0;
      font-size:14px;
      box-shadow:0 10px 24px rgba(15,23,42,.06);
    }

    .alerta{
      background:linear-gradient(135deg,#fff7ed,#fef3c7);
      border:1px solid #fed7aa;
      color:#78350f;
      border-radius:18px;
      padding:14px 16px;
      line-height:1.55;
      margin:14px 0;
      font-size:14px;
      box-shadow:0 10px 24px rgba(15,23,42,.06);
    }

    .grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin:14px 0;
    }

    .mini{
      border:1px solid var(--line);
      background:linear-gradient(180deg,#ffffff,#f9fafb);
      border-radius:18px;
      padding:15px;
      box-shadow:0 10px 24px rgba(15,23,42,.05);
    }

    .mini strong{
      display:block;
      font-size:16px;
      margin-bottom:5px;
      color:#111827;
    }

    .mini span{
      display:block;
      color:#4b5563;
      line-height:1.5;
      font-size:14px;
    }

    code{
      background:#f1f5f9;
      border:1px solid #e2e8f0;
      border-radius:8px;
      padding:2px 6px;
      color:#0f172a;
      font-weight:800;
    }

    .badge{
      display:inline-block;
      border-radius:999px;
      padding:5px 9px;
      font-size:12px;
      font-weight:900;
      background:#eff6ff;
      color:#1d4ed8;
      margin:3px 4px 3px 0;
    }

    .checklist{
      display:grid;
      gap:8px;
      margin-top:10px;
    }

    .check{
      border:1px solid #e5e7eb;
      border-radius:16px;
      padding:11px 13px;
      background:#f9fafb;
      font-weight:800;
      color:#374151;
    }

    .check:before{
      content:"✓";
      color:#16a34a;
      font-weight:1000;
      margin-right:8px;
    }

    .footer{
      color:#6b7280;
      font-size:13px;
      margin-top:18px;
      text-align:center;
    }

    @media(max-width:850px){
      body{background:#f3f4f6;}
      .layout{grid-template-columns:1fr;}
      .indice{position:static;}
      .grid{grid-template-columns:1fr;}
      .hero h1{font-size:30px;}
    }

    @media print{
      body{background:white;}
      .hero-actions,.indice{display:none;}
      .layout{display:block;}
      .card,.hero{box-shadow:none;border:1px solid #e5e7eb;}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>${escapar(textos.tituloPagina)}</h1>
      <p>${escapar(textos.descripcionManual(d.nombre))}</p>
      <div class="hero-actions">
        <a href="/configuracion" class="sec">${escapar(textos.volverConfiguracion)}</a>
        <a href="/app/v2">${escapar(textos.abrirPos)}</a>
        <a href="javascript:window.print()" class="sec">${escapar(textos.imprimirManual)}</a>
      </div>
    </section>

    <div class="layout">
      <aside class="indice">
        <h2>${escapar(textos.indice)}</h2>
        <a href="#inicio">${escapar(textos.enlaces.inicio)}</a>
        <a href="#registro">${escapar(textos.enlaces.registro)}</a>
        <a href="#fiscales">${escapar(textos.enlaces.fiscales)}</a>
        <a href="#configuracion">${escapar(textos.enlaces.configuracion)}</a>
        <a href="#mesas">${escapar(textos.enlaces.mesas)}</a>
        <a href="#productos">${escapar(textos.enlaces.productos)}</a>
        <a href="#impresion">${escapar(textos.enlaces.impresion)}</a>
        <a href="#pos">${escapar(textos.enlaces.pos)}</a>
        <a href="#cobro">${escapar(textos.enlaces.cobro)}</a>
        <a href="#caja">${escapar(textos.enlaces.caja)}</a>
        <a href="#usuarios">${escapar(textos.enlaces.usuarios)}</a>
        <a href="#backups">${escapar(textos.enlaces.backups)}</a>
        <a href="#suscripcion">${escapar(textos.enlaces.suscripcion)}</a>
        <a href="#ayuda">${escapar(textos.enlaces.ayuda)}</a>
      </aside>

      <section>
        <article id="inicio" class="card">
          <h2>${escapar(textos.inicio.titulo)}</h2>
          <p>${escapar(textos.inicio.introduccion)}</p>
          <div class="pasos">
            ${renderPasos(textos.inicio.pasos)}
          </div>
          <div class="tip">${escapar(textos.inicio.recomendacion)}</div>
        </article>

        <article id="registro" class="card">
          <h2>${escapar(textos.registro.titulo)}</h2>
          <p>${escapar(textos.registro.introduccion)}</p>
          <div class="grid">
            ${renderTarjetas(textos.registro.tarjetas)}
          </div>
          <div class="alerta">${escapar(textos.registro.alerta)}</div>
        </article>

        <article id="fiscales" class="card">
          <h2>${escapar(textos.fiscales.titulo)}</h2>
          <p>${escapar(textos.fiscales.introduccion)}</p>
          <div class="checklist">
            ${renderChecklist(textos.fiscales.lista)}
          </div>
          <p>${escapar(textos.fiscales.cierre)}</p>
        </article>

        <article id="configuracion" class="card">
          <h2>${escapar(textos.configuracion.titulo)}</h2>
          <p>${escapar(textos.configuracion.introduccion)}</p>
          <div class="grid">
            ${renderTarjetas(textos.configuracion.tarjetas)}
          </div>
        </article>

        <article id="mesas" class="card">
          <h2>${escapar(textos.mesas.titulo)}</h2>
          <p>${escapar(textos.mesas.introduccion)}</p>
          <div class="pasos">
            ${renderPasos(textos.mesas.pasos)}
          </div>
          <h3>${escapar(textos.mesas.coloresTitulo)}</h3>
          ${renderBadges(textos.mesas.colores)}
        </article>

        <article id="productos" class="card">
          <h2>${escapar(textos.productos.titulo)}</h2>
          <p>${escapar(textos.productos.introduccion)}</p>
          <div class="grid">
            ${renderTarjetas(textos.productos.tarjetas)}
          </div>
        </article>

        <article id="impresion" class="card">
          <h2>${escapar(textos.impresion.titulo)}</h2>
          <p>${escapar(textos.impresion.introduccion)}</p>
          <div class="pasos">
            ${renderPasos(textos.impresion.pasos)}
          </div>
          <div class="tip">${escapar(textos.impresion.recomendacion)}</div>
        </article>

        <article id="pos" class="card">
          <h2>${escapar(textos.pos.titulo)}</h2>
          <p>${escapar(textos.pos.introduccion)}</p>
          <div class="pasos">
            ${renderPasos(textos.pos.pasos)}
          </div>
        </article>

        <article id="cobro" class="card">
          <h2>${escapar(textos.cobro.titulo)}</h2>
          <p>${escapar(textos.cobro.introduccion)}</p>
          <div class="grid">
            ${renderTarjetas(textos.cobro.tarjetas)}
          </div>
        </article>

        <article id="caja" class="card">
          <h2>${escapar(textos.caja.titulo)}</h2>
          <p>${escapar(textos.caja.introduccion)}</p>
          <div class="pasos">
            ${renderPasos(textos.caja.pasos)}
          </div>
        </article>

        <article id="usuarios" class="card">
          <h2>${escapar(textos.usuarios.titulo)}</h2>
          <p>${escapar(textos.usuarios.introduccion)}</p>
          <div class="grid">
            ${renderTarjetas(textos.usuarios.tarjetas)}
          </div>
        </article>

        <article id="backups" class="card">
          <h2>${escapar(textos.backups.titulo)}</h2>
          <p>${escapar(textos.backups.introduccion)}</p>
          <div class="pasos">
            ${renderPasos(textos.backups.pasos)}
          </div>
          <div class="tip">${escapar(textos.backups.recomendacion)}</div>
        </article>

        <article id="suscripcion" class="card">
          <h2>${escapar(textos.suscripcion.titulo)}</h2>
          <p>${escapar(textos.suscripcion.introduccion)}</p>
          <div class="grid">
            ${renderTarjetas(textos.suscripcion.tarjetas)}
          </div>
        </article>

        <article id="ayuda" class="card">
          <h2>${escapar(textos.ayuda.titulo)}</h2>
          <p>${escapar(textos.ayuda.introduccion)}</p>
          <div class="pasos">
            ${renderPasos(textos.ayuda.pasos)}
          </div>
          <p><strong>${escapar(textos.ayuda.soporte)}:</strong> ${escapar(d.soporte)}</p>
          <p><strong>${escapar(textos.ayuda.email)}:</strong> ${escapar(d.email)}</p>
        </article>

        <div class="footer">
          ${escapar(textos.footer)}
        </div>
      </section>
    </div>
  </main>
</body>
</html>`;
}

module.exports = function manualClienteRoutes() {
  const router = express.Router();

  router.get("/manual", function(req, res) {
    const textos = textosManualReq(req);

    res.send(
      paginaManual(textos)
    );
  });

  router.get("/ayuda", function(req, res) {
    res.redirect("/manual");
  });

  return router;
};
