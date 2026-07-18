const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function escapar(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function requiereConfig(req, res, next) {
  if (!req.session || !req.session.usuario) return res.redirect("/login");

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol === "camarero") return res.redirect("/app/v2");

  if (rol !== "admin" && rol !== "gerente") {
    return res.status(403).send("No tienes permisos para configuración.");
  }

  next();
}

function get(db, sql, params) {
  return new Promise((resolve) => {
    db.get(sql, params || [], function(err, row) {
      if (err) {
        console.error("[configuracionChicSaas] SQL:", err.message);
        return resolve(null);
      }
      resolve(row || null);
    });
  });
}

async function count(db, tabla, restauranteId, extraWhere) {
  const where = extraWhere
    ? "WHERE COALESCE(restaurante_id,1)=? AND " + extraWhere
    : "WHERE COALESCE(restaurante_id,1)=?";

  const row = await get(
    db,
    "SELECT COUNT(*) AS total FROM " + tabla + " " + where,
    [restauranteId]
  );

  return row ? Number(row.total || 0) : 0;
}

async function resumen(db, restauranteId) {
  const config = await get(
    db,
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=? ORDER BY id DESC LIMIT 1",
    [restauranteId]
  );

  const restaurante = await get(
    db,
    "SELECT * FROM restaurantes WHERE id=?",
    [restauranteId]
  );

  const datos = {
    config: config || {},
    restaurante: restaurante || {},
    mesas: await count(db, "mesas", restauranteId),
    productos: await count(db, "productos", restauranteId),
    usuarios: await count(db, "usuarios", restauranteId),
    pedidosAbiertos: await count(db, "pedidos", restauranteId, "estado <> 'cerrado'")
  };

  return datos;
}

function estadoSuscripcion(config, restaurante) {
  const estado = String(
    (config && config.suscripcion_estado) ||
    (restaurante && restaurante.estado) ||
    "trial"
  ).toLowerCase();

  if (estado === "gratis_vida") return "Gratis de por vida";
  if (estado === "activo") return "Activa";
  if (estado === "trial" || estado === "prueba") return "Trial activo";
  if (estado === "pendiente_pago") return "Pendiente de pago";
  if (estado === "cancelada") return "Cancelada";

  return estado;
}

function datosFiscalesOk(config) {
  const c = config || {};

  return Boolean(
    String(c.razon_social || c.nome_ristorante || "").trim() &&
    String(c.partita_iva || "").trim() &&
    String(c.indirizzo || "").trim() &&
    String(c.codigo_postal || "").trim() &&
    String(c.ciudad || "").trim() &&
    String(c.provincia || "").trim() &&
    String(c.pais || "").trim() &&
    String(c.email_facturacion || c.email || c.propietario_email || "").trim()
  );
}

function card(titulo, texto, href, etiqueta, clase, numero) {
  return `
    <a class="card ${clase || ""}" href="${escapar(href)}">
      <div class="card-top">
        <span class="num">${escapar(numero || "")}</span>
        <span class="tag">${escapar(etiqueta || "Abrir")}</span>
      </div>
      <h3>${escapar(titulo)}</h3>
      <p>${escapar(texto)}</p>
    </a>
  `;
}

function render(datos, usuario, restauranteId) {
  const config = datos.config || {};
  const restaurante = datos.restaurante || {};
  const nombre = config.nome_ristorante || restaurante.nombre || "Restaurant Service POS";
  const fiscalOk = datosFiscalesOk(config);
  const estado = estadoSuscripcion(config, restaurante);
  const rol = String(usuario.rol || "").toLowerCase();

  const cardsPrincipales = [
    card("Abrir POS", "Entrar en sala, mesas, pedidos y cobros.", "/app/v2", "Servicio", "gold", "01"),
    card("Restaurante", "Datos fiscales, logo, ticket y facturación.", "/configuracion-restaurante", fiscalOk ? "Completo" : "Pendiente", fiscalOk ? "ok" : "warn", "02"),
    card("Productos", "Categorías, precios y productos disponibles.", "/configuracion-productos", "Menú", "", "03"),
    card("Mesas", "Salas, zonas y numeración de mesas.", "/configuracion-mesas", "Sala", "", "04"),
    card("Destinos", "Bar, cocina y destinos personalizados.", "/configuracion-destinos", "Comandas", "", "05"),
    card("Impresoras", "Ticket, bar, cocina y pruebas de impresión.", "/configuracion-impresoras", "Impresión", "", "06"),
    card("Caja", "Cierres diarios, mensuales y pagos.", "/configuracion-caja", "Control", "", "07"),
    card("Reportes", "Exportaciones CSV y análisis del restaurante.", "/configuracion-reportes", "Datos", "", "08"),
    card("Backups", "Copias de seguridad del restaurante actual.", "/configuracion-backups", "Seguro", "", "09")
  ];

  if (rol === "admin" || rol === "gerente") {
    cardsPrincipales.push(
      card("Usuarios", "Crear camareros, gerentes y accesos.", "/configuracion-usuarios", "Equipo", "", "10")
    );
  }

  if (rol === "admin") {
    cardsPrincipales.push(
      card("Suscripción", "Trial, pago mensual y estado fiscal.", "/configuracion-suscripcion", estado, fiscalOk ? "ok" : "warn", "11")
    );
  }

  cardsPrincipales.push(
    card("Primeros pasos", "Guía rápida para dejar el restaurante listo.", "/primeros-pasos", "Guía", "", "12"),
    card("Manual", "Ayuda de uso para el cliente.", "/manual", "Ayuda", "", "13")
  );

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Configuración - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    html{min-height:100%;}
    body{
      margin:0;
      min-height:100%;
      font-family:Arial,Helvetica,sans-serif;
      color:#101827;
      background:
        radial-gradient(circle at 12% 8%, rgba(245,158,11,.22), transparent 30%),
        radial-gradient(circle at 84% 18%, rgba(20,184,166,.18), transparent 26%),
        linear-gradient(135deg,#0f172a 0%,#111827 38%,#f8fafc 38%,#f3f4f6 100%);
    }
    .wrap{
      max-width:1180px;
      margin:0 auto;
      padding:22px 18px 42px;
    }
    .topbar{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:14px;
      margin-bottom:18px;
      color:white;
    }
    .brand{
      display:flex;
      align-items:center;
      gap:12px;
      min-width:0;
    }
    .logo-mark{
      width:42px;
      height:42px;
      border-radius:16px;
      display:grid;
      place-items:center;
      background:linear-gradient(135deg,#f59e0b,#fef3c7);
      color:#111827;
      font-weight:1000;
      box-shadow:0 18px 36px rgba(0,0,0,.22);
    }
    .brand strong{
      display:block;
      font-size:17px;
      letter-spacing:.02em;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      max-width:360px;
    }
    .brand span{
      display:block;
      font-size:12px;
      color:#d1d5db;
      margin-top:2px;
    }
    .top-actions{
      display:flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
      justify-content:flex-end;
    }
    .pill-link{
      color:#0f172a;
      text-decoration:none;
      border:1px solid rgba(255,255,255,.72);
      background:linear-gradient(135deg,#ffffff,#e0f2fe);
      backdrop-filter:blur(12px);
      border-radius:999px;
      padding:9px 13px;
      font-size:13px;
      font-weight:1000;
      box-shadow:0 10px 26px rgba(15,23,42,.18);
      transition:transform .16s ease, box-shadow .16s ease, background .16s ease;
    }
    .pill-link:hover{
      transform:translateY(-2px);
      background:linear-gradient(135deg,#ffffff,#bfdbfe);
      box-shadow:0 16px 34px rgba(15,23,42,.24);
    }
    .hero{
      position:relative;
      overflow:hidden;
      border-radius:30px;
      padding:24px;
      min-height:178px;
      color:white;
      background:
        linear-gradient(135deg,rgba(17,24,39,.96),rgba(67,56,202,.55)),
        radial-gradient(circle at 90% 20%, rgba(245,158,11,.55), transparent 32%);
      box-shadow:0 24px 70px rgba(15,23,42,.28);
      margin-bottom:16px;
    }
    .hero:after{
      content:"";
      position:absolute;
      right:-90px;
      top:-90px;
      width:240px;
      height:240px;
      border-radius:999px;
      background:rgba(255,255,255,.12);
      border:1px solid rgba(255,255,255,.16);
    }
    .hero-content{
      position:relative;
      z-index:1;
      display:flex;
      justify-content:space-between;
      gap:18px;
      align-items:flex-end;
    }
    .hero h1{
      margin:0;
      font-size:34px;
      letter-spacing:-.045em;
      line-height:1.02;
    }
    .hero p{
      margin:10px 0 0;
      color:#e5e7eb;
      line-height:1.45;
      max-width:650px;
      font-size:15px;
    }
    .hero-status{
      min-width:230px;
      background:rgba(255,255,255,.11);
      border:1px solid rgba(255,255,255,.18);
      border-radius:22px;
      padding:14px;
      backdrop-filter:blur(12px);
    }
    .hero-status span{
      display:block;
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:.08em;
      color:#d1d5db;
      font-weight:900;
    }
    .hero-status strong{
      display:block;
      font-size:22px;
      margin-top:5px;
    }
    .stats{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:10px;
      margin-bottom:16px;
    }
    .stat{
      background:rgba(255,255,255,.88);
      border:1px solid rgba(255,255,255,.72);
      border-radius:20px;
      padding:14px;
      box-shadow:0 12px 28px rgba(15,23,42,.08);
      backdrop-filter:blur(12px);
    }
    .stat span{
      display:block;
      color:#6b7280;
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:.08em;
      font-weight:900;
      margin-bottom:5px;
    }
    .stat strong{
      display:block;
      font-size:25px;
      letter-spacing:-.04em;
    }
    .section-title{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin:8px 0 12px;
    }
    .section-title h2{
      margin:0;
      font-size:18px;
      letter-spacing:-.03em;
    }
    .section-title p{
      margin:0;
      color:#6b7280;
      font-size:13px;
      font-weight:800;
    }
    .cards{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:12px;
    }
    .card{
      position:relative;
      min-height:126px;
      padding:14px;
      border-radius:22px;
      background:rgba(255,255,255,.92);
      border:1px solid rgba(229,231,235,.9);
      box-shadow:0 12px 30px rgba(15,23,42,.07);
      text-decoration:none;
      color:#111827;
      overflow:hidden;
      transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    }
    .card:hover{
      transform:translateY(-3px);
      box-shadow:0 20px 46px rgba(15,23,42,.14);
      border-color:rgba(245,158,11,.55);
    }
    .card:before{
      content:"";
      position:absolute;
      right:-34px;
      top:-34px;
      width:88px;
      height:88px;
      border-radius:999px;
      background:linear-gradient(135deg,rgba(245,158,11,.16),rgba(20,184,166,.08));
    }
    .card-top{
      position:relative;
      z-index:1;
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
      margin-bottom:12px;
    }
    .num{
      color:#9ca3af;
      font-weight:1000;
      letter-spacing:-.04em;
      font-size:13px;
    }
    .tag{
      display:inline-flex;
      align-items:center;
      min-height:24px;
      padding:5px 8px;
      border-radius:999px;
      background:#f3f4f6;
      color:#374151;
      font-size:11px;
      font-weight:1000;
      max-width:118px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .card h3{
      position:relative;
      z-index:1;
      margin:0 0 6px;
      font-size:17px;
      letter-spacing:-.035em;
    }
    .card p{
      position:relative;
      z-index:1;
      margin:0;
      color:#6b7280;
      font-size:13px;
      line-height:1.35;
      font-weight:700;
    }
    .card.gold{
      background:linear-gradient(135deg,#111827,#78350f);
      color:white;
      border-color:rgba(245,158,11,.7);
    }
    .card.gold p,.card.gold .num{color:#fde68a;}
    .card.gold .tag{background:rgba(255,255,255,.16);color:white;}
    .card.ok .tag{background:#dcfce7;color:#166534;}
    .card.warn .tag{background:#fef3c7;color:#92400e;}
    .foot{
      margin-top:18px;
      display:flex;
      justify-content:space-between;
      gap:12px;
      color:#6b7280;
      font-size:12px;
      font-weight:800;
    }
    @media(max-width:1050px){
      .cards{grid-template-columns:repeat(3,minmax(0,1fr));}
      .stats{grid-template-columns:repeat(2,minmax(0,1fr));}
    }
    @media(max-width:760px){
      body{background:#f3f4f6;}
      .topbar,.hero-content,.foot{display:block;}
      .top-actions{justify-content:flex-start;margin-top:12px;}
      .hero-status{margin-top:16px;min-width:0;}
      .cards{grid-template-columns:1fr;}
      .stats{grid-template-columns:1fr 1fr;}
      .brand strong{max-width:260px;}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="logo-mark">RS</div>
        <div>
          <strong>${escapar(nombre)}</strong>
          <span>Restaurant Service POS · Configuración</span>
        </div>
      </div>
      <div class="top-actions">
        <a class="pill-link" href="/app/v2">Abrir POS</a>
        <a class="pill-link" href="/logout">Cerrar sesión</a>
      </div>
    </div>

    <section class="hero">
      <div class="hero-content">
        <div>
          <h1>Configuración</h1>
          <p>Panel compacto para preparar el restaurante, revisar la facturación, configurar el servicio y controlar las herramientas principales.</p>
        </div>
        <div class="hero-status">
          <span>Estado</span>
          <strong>${escapar(estado)}</strong>
          <span style="margin-top:8px;">Datos fiscales</span>
          <strong>${fiscalOk ? "Completos" : "Pendientes"}</strong>
        </div>
      </div>
    </section>

    <section class="stats">
      <div class="stat"><span>Mesas</span><strong>${datos.mesas}</strong></div>
      <div class="stat"><span>Productos</span><strong>${datos.productos}</strong></div>
      <div class="stat"><span>Usuarios</span><strong>${datos.usuarios}</strong></div>
      <div class="stat"><span>Pedidos abiertos</span><strong>${datos.pedidosAbiertos}</strong></div>
    </section>

    <div class="section-title">
      <h2>Herramientas del restaurante</h2>
      <p>Todo en una vista compacta</p>
    </div>

    <section class="cards">
      ${cardsPrincipales.join("")}
    </section>

    <div class="foot">
      <span>Restaurante ID ${restauranteId}</span>
      <span>Usuario: ${escapar(usuario.nombre || usuario.email || "")} · ${escapar(usuario.rol || "")}</span>
    </div>
  </main>
</body>
</html>`;
}

module.exports = function configuracionChicSaasRoutes(db) {
  const router = express.Router();

  router.get("/configuracion", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const datos = await resumen(db, restauranteId);

    res.send(render(datos, req.session.usuario || {}, restauranteId));
  });

  return router;
};
