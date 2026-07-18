const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function get(db, sql, params) {
  return new Promise((resolve) => {
    db.get(sql, params || [], function(err, row) {
      if (err) return resolve(null);
      resolve(row || null);
    });
  });
}

async function tableExists(db, name) {
  const row = await get(
    db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [name]
  );

  return !!row;
}

async function countTable(db, name, where, params) {
  const exists = await tableExists(db, name);
  if (!exists) return 0;

  const row = await get(
    db,
    `SELECT COUNT(*) AS n FROM ${name} ${where || ""}`,
    params || []
  );

  return row ? Number(row.n || 0) : 0;
}

async function cargarEstado(db, restauranteId) {
  restauranteId = Number(restauranteId || 1);

  const config = await get(
    db,
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=? ORDER BY id DESC LIMIT 1",
    [restauranteId]
  );

  const zonas = await countTable(db, "zonas", "WHERE COALESCE(restaurante_id,1)=? AND COALESCE(activo,1)=1", [restauranteId]);
  const mesas = await countTable(db, "mesas", "WHERE COALESCE(restaurante_id,1)=? AND COALESCE(activo,1)=1", [restauranteId]);
  const categorias = await countTable(db, "categorias", "WHERE COALESCE(restaurante_id,1)=?", [restauranteId]);
  const productos = await countTable(db, "productos", "WHERE COALESCE(restaurante_id,1)=? AND COALESCE(disponible,1)=1", [restauranteId]);
  const destinos = await countTable(db, "destinos_comanda", "WHERE COALESCE(restaurante_id,1)=? AND COALESCE(activo,1)=1", [restauranteId]);
  const usuarios = await countTable(db, "usuarios", "WHERE COALESCE(restaurante_id,1)=? AND COALESCE(activo,1)=1", [restauranteId]);

  const nombreRestaurante =
    config && (config.nome_ristorante || config.nombre_restaurante || config.restaurante_nombre || "");

  const emailPropietario =
    config && (config.propietario_email || config.email || "");

  const impresionConfig =
    config && String(config.config_impresion_json || "").trim();

  return {
    nombreRestaurante,
    emailPropietario,
    zonas,
    mesas,
    categorias,
    productos,
    destinos,
    usuarios,
    impresionConfig: !!impresionConfig
  };
}

function estadoPaso(ok, textoOk, textoPendiente) {
  return {
    ok: !!ok,
    texto: ok ? textoOk : textoPendiente
  };
}

function badge(paso) {
  return paso.ok
    ? '<span class="badge ok">Completado</span>'
    : '<span class="badge pendiente">Pendiente</span>';
}

function cardPaso(numero, titulo, estado, descripcion, acciones) {
  return `
    <article class="paso ${estado.ok ? "ok" : "pendiente"}">
      <div class="num">${numero}</div>
      <div class="contenido">
        <div class="head">
          <h2>${escapar(titulo)}</h2>
          ${badge(estado)}
        </div>
        <p class="estado-texto">${escapar(estado.texto)}</p>
        <p>${descripcion}</p>
        <div class="acciones">${acciones}</div>
      </div>
    </article>
  `;
}

function page(estado) {
  const pasos = [
    estadoPaso(
      estado.nombreRestaurante && estado.emailPropietario,
      "El restaurante tiene datos básicos configurados.",
      "Faltan datos básicos del restaurante o email del propietario."
    ),
    estadoPaso(
      estado.zonas > 0 && estado.mesas > 0,
      `Tienes ${estado.zonas} zona(s) y ${estado.mesas} mesa(s) activa(s).`,
      "Todavía faltan salas/zonas o mesas activas."
    ),
    estadoPaso(
      estado.categorias > 0 && estado.productos > 0,
      `Tienes ${estado.categorias} categoría(s) y ${estado.productos} producto(s) activo(s).`,
      "Todavía faltan categorías o productos activos."
    ),
    estadoPaso(
      estado.destinos >= 2,
      `Tienes ${estado.destinos} destino(s) de comanda activo(s).`,
      "Faltan destinos de comanda. Como mínimo deberían existir bar y cocina."
    ),
    estadoPaso(
      estado.impresionConfig,
      "El centro de impresión tiene configuración guardada.",
      "Todavía no se ha guardado configuración de impresión."
    ),
    estadoPaso(
      estado.mesas > 0 && estado.productos > 0 && estado.destinos >= 1,
      "Ya puedes hacer una prueba completa con una mesa.",
      "Antes de probar una mesa necesitas mesas, productos y destinos."
    ),
    estadoPaso(
      true,
      "El manual está disponible para el cliente.",
      "Manual disponible."
    )
  ];

  const completados = pasos.filter((p) => p.ok).length;
  const total = pasos.length;
  const porcentaje = Math.round((completados / total) * 100);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Primeros pasos - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root{
      --bg:#f3f4f6;
      --card:#ffffff;
      --text:#111827;
      --muted:#6b7280;
      --line:#e5e7eb;
      --brand:#2563eb;
      --ok:#16a34a;
      --warn:#f59e0b;
      --dark:#0f172a;
    }

    *{box-sizing:border-box;}

    body{
      margin:0;
      font-family:Arial, Helvetica, sans-serif;
      background:var(--bg);
      color:var(--text);
    }

    .wrap{
      max-width:1050px;
      margin:0 auto;
      padding:28px 18px 60px;
    }

    .hero{
      background:linear-gradient(135deg,#0f172a,#1e3a8a);
      color:white;
      border-radius:26px;
      padding:30px;
      box-shadow:0 20px 50px rgba(15,23,42,.18);
      margin-bottom:18px;
    }

    .hero h1{
      margin:0 0 8px;
      font-size:34px;
      line-height:1.12;
    }

    .hero p{
      margin:0;
      color:#dbeafe;
      line-height:1.5;
      font-size:15px;
      max-width:760px;
    }

    .progress-box{
      margin-top:20px;
      background:rgba(255,255,255,.12);
      border:1px solid rgba(255,255,255,.25);
      border-radius:18px;
      padding:16px;
    }

    .progress-top{
      display:flex;
      justify-content:space-between;
      gap:14px;
      align-items:center;
      margin-bottom:10px;
      font-weight:900;
    }

    .bar{
      height:13px;
      border-radius:999px;
      background:rgba(255,255,255,.22);
      overflow:hidden;
    }

    .fill{
      height:100%;
      width:${porcentaje}%;
      background:#22c55e;
      border-radius:999px;
    }

    .hero-actions{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:18px;
    }

    .hero-actions a{
      color:white;
      text-decoration:none;
      border:1px solid rgba(255,255,255,.35);
      border-radius:999px;
      padding:9px 13px;
      font-size:13px;
      font-weight:800;
      background:rgba(255,255,255,.08);
    }

    .paso{
      background:white;
      border:1px solid var(--line);
      border-radius:22px;
      padding:18px;
      box-shadow:0 10px 26px rgba(15,23,42,.07);
      display:grid;
      grid-template-columns:54px minmax(0,1fr);
      gap:14px;
      margin-bottom:14px;
    }

    .paso.ok{
      border-left:6px solid #16a34a;
    }

    .paso.pendiente{
      border-left:6px solid #f59e0b;
    }

    .num{
      width:44px;
      height:44px;
      border-radius:50%;
      background:#111827;
      color:white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:18px;
      font-weight:900;
    }

    .head{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:flex-start;
      margin-bottom:6px;
    }

    h2{
      margin:0;
      font-size:22px;
      color:#0f172a;
    }

    p{
      color:#374151;
      line-height:1.55;
      font-size:15px;
      margin:8px 0;
    }

    .estado-texto{
      font-weight:800;
      color:#111827;
    }

    .badge{
      display:inline-block;
      border-radius:999px;
      padding:6px 10px;
      font-size:12px;
      font-weight:900;
      white-space:nowrap;
    }

    .badge.ok{
      background:#dcfce7;
      color:#166534;
    }

    .badge.pendiente{
      background:#fef3c7;
      color:#92400e;
    }

    .acciones{
      display:flex;
      flex-wrap:wrap;
      gap:9px;
      margin-top:12px;
    }

    .acciones a{
      text-decoration:none;
      background:#2563eb;
      color:white;
      border-radius:12px;
      padding:10px 12px;
      font-weight:900;
      font-size:13px;
      display:inline-block;
    }

    .acciones a.sec{
      background:#e5e7eb;
      color:#111827;
    }

    .final{
      background:#ecfdf5;
      border:1px solid #86efac;
      color:#14532d;
      border-radius:18px;
      padding:18px;
      margin-top:18px;
      line-height:1.55;
      font-size:15px;
    }

    .final strong{
      color:#064e3b;
    }

    @media(max-width:720px){
      .hero h1{font-size:27px;}
      .paso{grid-template-columns:1fr;}
      .head{display:block;}
      .badge{margin-top:8px;}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Primeros pasos del restaurante</h1>
      <p>Completa esta guía antes de usar Restaurant Service POS en un servicio real. Cuando todos los pasos estén listos, el restaurante estará preparado para trabajar.</p>

      <div class="progress-box">
        <div class="progress-top">
          <span>Progreso inicial</span>
          <span>${completados}/${total} pasos · ${porcentaje}%</span>
        </div>
        <div class="bar"><div class="fill"></div></div>
      </div>

      <div class="hero-actions">
        <a href="/configuracion">Configuración</a>
        <a href="/manual">Manual</a>
        <a href="/app/v2">Abrir POS</a>
      </div>
    </section>

    ${cardPaso(
      1,
      "Datos del restaurante",
      pasos[0],
      "Configura nombre del restaurante, propietario, email y datos principales. Estos datos se usan en tickets, cuenta y configuración general.",
      '<a href="/configuracion">Ir a configuración</a>'
    )}

    ${cardPaso(
      2,
      "Crear salas, zonas y mesas",
      pasos[1],
      "Crea la distribución real del restaurante: sala, terraza, barra, comedor privado o cualquier zona que utilices.",
      '<a href="/configuracion-mesas">Configurar mesas</a><a class="sec" href="/manual#mesas">Ver ayuda</a>'
    )}

    ${cardPaso(
      3,
      "Crear categorías y productos",
      pasos[2],
      "Añade bebidas, platos, cafés, postres y precios. Organiza los productos en categorías para que el camarero trabaje rápido.",
      '<a href="/configuracion-productos">Configurar productos</a><a class="sec" href="/manual#productos">Ver ayuda</a>'
    )}

    ${cardPaso(
      4,
      "Configurar destinos de comanda",
      pasos[3],
      "Define dónde debe ir cada comanda: bar, cocina, pizzeria u otros destinos. Esto evita errores durante el servicio.",
      '<a href="/configuracion-destinos">Configurar destinos</a><a class="sec" href="/manual#productos">Ver ayuda</a>'
    )}

    ${cardPaso(
      5,
      "Probar impresión",
      pasos[4],
      "Empieza en modo preview. Genera una prueba de ticket, bar y cocina antes de conectar impresoras reales.",
      '<a href="/configuracion-impresoras">Centro de impresión</a><a class="sec" href="/manual#impresion">Ver ayuda</a>'
    )}

    ${cardPaso(
      6,
      "Probar una mesa completa",
      pasos[5],
      "Antes de abrir al público, haz una prueba: abre una mesa, añade bebida y comida, envía comandas, imprime cuenta, cobra y cierra mesa.",
      '<a href="/app/v2">Abrir POS</a><a class="sec" href="/manual#servicio">Ver flujo</a>'
    )}

    ${cardPaso(
      7,
      "Leer el manual y resolver dudas",
      pasos[6],
      "El manual explica el uso diario del POS, comandas, cobro, caja, móvil del camarero y preguntas frecuentes.",
      '<a href="/manual">Abrir manual</a><a class="sec" href="mailto:soporte@restaurantservicepos.com">Contactar soporte</a>'
    )}

    <div class="final">
      <strong>Recomendación:</strong> antes del primer servicio real, haz una prueba con una mesa ficticia y comprueba que cada producto sale en el destino correcto.
    </div>
  </main>
</body>
</html>`;
}

module.exports = function onboardingClienteRoutes(db) {
  const router = express.Router();

  router.get("/primeros-pasos", async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const estado = await cargarEstado(db, restauranteId);
    res.send(page(estado));
  });

  router.get("/onboarding", function(req, res) {
    res.redirect("/primeros-pasos");
  });

  return router;
};
