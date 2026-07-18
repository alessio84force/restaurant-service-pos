const express = require("express");
const fs = require("fs");
const path = require("path");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

const DESTINOS_BASE = [
  { id: "bar", nombre: "Bar", activo: 1, orden: 10 },
  { id: "cocina", nombre: "Cocina", activo: 1, orden: 20 },
  { id: "pizzeria", nombre: "Pizzeria", activo: 1, orden: 30 },
  { id: "general", nombre: "General", activo: 1, orden: 40 }
];

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function requiereConfig(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/login");
  }

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol !== "admin" && rol !== "gerente") {
    return res.status(403).send("No tienes permisos para configurar destinos e impresión.");
  }

  return next();
}

function requiereLoginJson(req, res, next) {
  if (req.session && req.session.usuario) return next();

  return res.status(401).json({
    ok: false,
    error: "No autenticado"
  });
}

function all(db, sql, params) {
  return new Promise((resolve) => {
    db.all(sql, params || [], function(err, rows) {
      if (err) {
        console.error("[destinosImpresionSaas] SQL all:", err.message);
        return resolve([]);
      }

      resolve(rows || []);
    });
  });
}

function get(db, sql, params) {
  return new Promise((resolve) => {
    db.get(sql, params || [], function(err, row) {
      if (err) {
        console.error("[destinosImpresionSaas] SQL get:", err.message);
        return resolve(null);
      }

      resolve(row || null);
    });
  });
}

function run(db, sql, params) {
  return new Promise((resolve) => {
    db.run(sql, params || [], function(err) {
      if (err) {
        console.error("[destinosImpresionSaas] SQL run:", err.message);
        return resolve({ ok: false, error: err.message });
      }

      resolve({ ok: true, id: this.lastID, changes: this.changes });
    });
  });
}

async function asegurarConfig(db, restauranteId) {
  const existente = await get(
    db,
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=? ORDER BY id DESC LIMIT 1",
    [restauranteId]
  );

  if (existente) return existente;

  const creado = await run(
    db,
    `INSERT INTO configurazione
     (nome_ristorante, iva, mensaje_ticket, modo_impresion, restaurante_id)
     VALUES ('Restaurant Service POS', 10, 'Gracias por su visita', 'preview', ?)`,
    [restauranteId]
  );

  return get(
    db,
    "SELECT * FROM configurazione WHERE id=?",
    [creado.id]
  );
}

async function destinosRestaurante(db, restauranteId) {
  const personalizados = await all(
    db,
    `SELECT id, nombre, COALESCE(activo,1) AS activo, COALESCE(orden,100) AS orden, restaurante_id
     FROM destinos_comanda
     WHERE COALESCE(restaurante_id,1)=?
     ORDER BY orden, id`,
    [restauranteId]
  );

  const vistos = {};
  const resultado = [];

  DESTINOS_BASE.forEach((d) => {
    vistos[d.id] = true;
    resultado.push({
      id: d.id,
      nombre: d.nombre,
      activo: d.activo,
      orden: d.orden,
      restaurante_id: restauranteId,
      base: true
    });
  });

  personalizados.forEach((d) => {
    if (!vistos[d.id]) {
      vistos[d.id] = true;
      resultado.push({
        id: d.id,
        nombre: d.nombre,
        activo: Number(d.activo) === 1 ? 1 : 0,
        orden: Number(d.orden || 100),
        restaurante_id: restauranteId,
        base: false
      });
    }
  });

  return resultado.sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function parseConfigImpresion(config) {
  try {
    if (!config || !config.config_impresion_json) return {};
    return JSON.parse(config.config_impresion_json) || {};
  } catch (err) {
    return {};
  }
}

function configDestino(config, configJson, destino) {
  const modo = config.modo_impresion || "preview";
  const id = destino.id;

  const guardado = configJson[id] || {};

  let nombre = guardado.nombre || "";

  if (id === "ticket") nombre = nombre || config.stampante_ticket || "";
  if (id === "bar") nombre = nombre || config.stampante_bar || "";
  if (id === "cocina") nombre = nombre || config.stampante_cocina || config.stampante_cucina || "";

  return {
    id: id,
    nombre: nombre,
    modo: guardado.modo || modo,
    tipo: guardado.tipo || "preview",
    activo: destino.activo
  };
}

function renderDestinos(destinos, query) {
  const ok = query.ok || "";
  const error = query.error || "";

  const filas = destinos.map((d) => `
    <tr>
      <td><strong>${escapar(d.nombre)}</strong><br><small>${escapar(d.id)}</small></td>
      <td>${d.base ? "Base del sistema" : "Personalizado"}</td>
      <td>${Number(d.activo) === 1 ? "<span class='ok'>Activo</span>" : "<span class='off'>Desactivado</span>"}</td>
      <td>
        ${d.base ? "<small>No se elimina. Siempre disponible para empezar rápido.</small>" : `
          <form method="POST" action="/configuracion-destinos/${encodeURIComponent(d.id)}/${Number(d.activo) === 1 ? "desactivar" : "activar"}">
            <button type="submit">${Number(d.activo) === 1 ? "Desactivar" : "Activar"}</button>
          </form>
        `}
      </td>
    </tr>
  `).join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Destinos de comanda - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;}
    .wrap{max-width:1050px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#111827,#7c2d12);color:white;border-radius:26px;padding:28px;margin-bottom:18px;box-shadow:0 18px 42px rgba(15,23,42,.16);}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#ffedd5;line-height:1.5;}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,button{display:inline-block;border:0;border-radius:12px;padding:11px 14px;background:#ea580c;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    a.sec,button.sec{background:#e5e7eb;color:#111827;}
    .msg{border-radius:15px;padding:12px 14px;margin-bottom:14px;font-weight:900;}
    .msg.okmsg{background:#ecfdf5;color:#14532d;border:1px solid #86efac;}
    .msg.errmsg{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
    .card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    h2{margin:0 0 14px;font-size:23px;}
    label{display:block;font-weight:900;font-size:13px;margin-bottom:6px;color:#374151;}
    input{width:100%;border:1px solid #d1d5db;border-radius:12px;padding:10px;font-size:15px;background:white;}
    .line{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;}
    table{width:100%;border-collapse:collapse;}
    th,td{padding:12px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top;}
    th{font-size:12px;text-transform:uppercase;color:#6b7280;}
    small{color:#6b7280;font-weight:800;}
    .ok{color:#166534;font-weight:900;}
    .off{color:#991b1b;font-weight:900;}
    @media(max-width:760px){.line{grid-template-columns:1fr;} table,thead,tbody,tr,td,th{display:block;} th{display:none;}}
  
    /* RS CHIC K2B2 IMPRESION DESTINOS */
    body{
      background:
        radial-gradient(circle at 10% 8%, rgba(245,158,11,.20), transparent 30%),
        radial-gradient(circle at 86% 14%, rgba(20,184,166,.18), transparent 28%),
        linear-gradient(135deg,#0f172a 0%,#111827 32%,#f8fafc 32%,#f3f4f6 100%) !important;
      color:#101827 !important;
    }
    .wrap,.container,.contenedor,main{
      max-width:1180px !important;
    }
    .hero,.cabecera,.header,.top-panel{
      position:relative !important;
      overflow:hidden !important;
      border-radius:30px !important;
      padding:24px !important;
      background:
        linear-gradient(135deg,rgba(17,24,39,.96),rgba(15,118,110,.68)),
        radial-gradient(circle at 92% 18%, rgba(245,158,11,.60), transparent 32%) !important;
      box-shadow:0 24px 70px rgba(15,23,42,.28) !important;
      border:1px solid rgba(255,255,255,.14) !important;
      color:white !important;
    }
    .hero:after,.cabecera:after,.header:after,.top-panel:after{
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
    .hero h1,.cabecera h1,.header h1,.top-panel h1{
      color:white !important;
      font-size:32px !important;
      letter-spacing:-.045em !important;
      line-height:1.02 !important;
      margin-top:0 !important;
    }
    .hero p,.cabecera p,.header p,.top-panel p{
      color:#ccfbf1 !important;
    }
    .card,.panel,.box,.bloque,section.card{
      border-radius:24px !important;
      background:rgba(255,255,255,.94) !important;
      border:1px solid rgba(229,231,235,.92) !important;
      box-shadow:0 14px 36px rgba(15,23,42,.09) !important;
      backdrop-filter:blur(12px);
    }
    .card h2,.panel h2,.box h2,.bloque h2{
      margin-top:0 !important;
      letter-spacing:-.035em !important;
      color:#111827 !important;
    }
    a.btn,button,input[type="submit"]{
      background:linear-gradient(135deg,#0f766e,#14b8a6) !important;
      color:white !important;
      border:1px solid rgba(255,255,255,.22) !important;
      border-radius:13px !important;
      box-shadow:0 10px 24px rgba(15,23,42,.14) !important;
      transition:transform .16s ease, box-shadow .16s ease !important;
      font-weight:900 !important;
    }
    a.btn:hover,button:hover,input[type="submit"]:hover{
      transform:translateY(-2px);
      box-shadow:0 16px 34px rgba(15,23,42,.20) !important;
    }
    a.sec,button.sec,.btn.sec,.btn-secondary{
      background:linear-gradient(135deg,#ffffff,#ccfbf1) !important;
      color:#0f172a !important;
      border:1px solid rgba(255,255,255,.72) !important;
    }
    label{
      color:#374151 !important;
      font-size:12px !important;
      letter-spacing:.02em !important;
      text-transform:uppercase !important;
      font-weight:900 !important;
    }
    input,select,textarea{
      border-radius:14px !important;
      border:1px solid #d1d5db !important;
      background:linear-gradient(180deg,#ffffff,#f9fafb) !important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.8) !important;
    }
    input:focus,select:focus,textarea:focus{
      outline:none !important;
      border-color:#14b8a6 !important;
      box-shadow:0 0 0 4px rgba(20,184,166,.14) !important;
    }
    table{
      overflow:hidden !important;
      border-radius:18px !important;
      background:white !important;
      box-shadow:0 12px 28px rgba(15,23,42,.06) !important;
    }
    th{
      background:#f9fafb !important;
      color:#6b7280 !important;
      letter-spacing:.06em !important;
      text-transform:uppercase !important;
      font-size:12px !important;
    }
    td{
      background:rgba(255,255,255,.92) !important;
    }
    .destino,.impresora,.printer,.fila,.item{
      border-radius:18px !important;
      box-shadow:0 8px 20px rgba(15,23,42,.06) !important;
    }
    .msg,.alert,.mensaje{
      border-radius:18px !important;
      box-shadow:0 10px 24px rgba(15,23,42,.06) !important;
    }
    pre,code{
      border-radius:16px !important;
      background:linear-gradient(135deg,#0f172a,#111827) !important;
      box-shadow:0 16px 36px rgba(15,23,42,.18) !important;
    }

</style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Destinos de comanda</h1>
      <p>Define dónde se envía cada comanda: bar, cocina, pizzeria, parrilla, coctelería u otros puntos de trabajo.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/configuracion-productos">Productos</a>
        <a class="btn sec" href="/configuracion-impresoras">Impresión</a>
      </div>
    </section>

    ${ok ? `<div class="msg okmsg">${escapar(ok)}</div>` : ""}
    ${error ? `<div class="msg errmsg">${escapar(error)}</div>` : ""}

    <section class="card">
      <h2>Crear destino personalizado</h2>
      <form method="POST" action="/configuracion-destinos/crear">
        <label>Nombre</label>
        <div class="line">
          <input name="nombre" placeholder="Parrilla, Coctelería, Terraza bar..." required>
          <button type="submit">Crear destino</button>
        </div>
      </form>
    </section>

    <section class="card">
      <h2>Destinos disponibles</h2>
      <table>
        <thead>
          <tr>
            <th>Destino</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}

function renderImpresoras(config, destinos, query) {
  const ok = query.ok || "";
  const error = query.error || "";
  const configJson = parseConfigImpresion(config);
  const modo = config.modo_impresion || "preview";

  const destinosImpresion = [
    { id: "ticket", nombre: "Ticket / caja", activo: 1, orden: 0 },
    ...destinos
  ];

  const cards = destinosImpresion.map((d) => {
    const cfg = configDestino(config, configJson, d);

    return `
      <div class="printer-card">
        <h3>${escapar(d.nombre)}</h3>
        <small>${escapar(d.id)}</small>

        <label>Nombre impresora / IP / referencia</label>
        <input name="impresora_${escapar(d.id)}" value="${escapar(cfg.nombre)}" placeholder="Ej. EPSON barra, 192.168.1.50...">

        <label>Modo</label>
        <select name="modo_${escapar(d.id)}">
          <option value="preview" ${cfg.modo === "preview" ? "selected" : ""}>Preview / ventana</option>
          <option value="archivo_txt" ${cfg.modo === "archivo_txt" ? "selected" : ""}>Archivo TXT</option>
          <option value="escpos_red" ${cfg.modo === "escpos_red" ? "selected" : ""}>ESC/POS red futura</option>
        </select>

        <button type="submit" formaction="/configuracion-impresoras/probar-${encodeURIComponent(d.id)}">Probar ${escapar(d.nombre)}</button>
        <a class="link" target="_blank" href="/configuracion-impresoras/ver-prueba/${encodeURIComponent(d.id)}">Ver última prueba</a>
      </div>
    `;
  }).join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Centro de impresión - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;}
    .wrap{max-width:1160px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#111827,#312e81);color:white;border-radius:26px;padding:28px;margin-bottom:18px;box-shadow:0 18px 42px rgba(15,23,42,.16);}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#e0e7ff;line-height:1.5;}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,button{display:inline-block;border:0;border-radius:12px;padding:11px 14px;background:#4f46e5;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    a.sec,button.sec{background:#e5e7eb;color:#111827;}
    .msg{border-radius:15px;padding:12px 14px;margin-bottom:14px;font-weight:900;}
    .msg.okmsg{background:#ecfdf5;color:#14532d;border:1px solid #86efac;}
    .msg.errmsg{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
    .card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    label{display:block;font-weight:900;font-size:13px;margin:10px 0 6px;color:#374151;}
    input,select{width:100%;border:1px solid #d1d5db;border-radius:12px;padding:10px;font-size:15px;background:white;}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}
    .printer-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:18px;padding:16px;}
    .printer-card h3{margin:0 0 2px;font-size:20px;}
    small{display:block;color:#6b7280;font-weight:800;margin-bottom:10px;}
    .link{display:inline-block;margin-top:10px;color:#3730a3;font-weight:900;}
    @media(max-width:850px){.grid{grid-template-columns:1fr;}}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Centro de impresión</h1>
      <p>Configura ticket, bar, cocina y todos los destinos de comanda de este restaurante.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/configuracion-destinos">Destinos</a>
        <a class="btn sec" href="/app/v2">Abrir POS</a>
      </div>
    </section>

    ${ok ? `<div class="msg okmsg">${escapar(ok)}</div>` : ""}
    ${error ? `<div class="msg errmsg">${escapar(error)}</div>` : ""}

    <form method="POST" action="/configuracion-impresoras">
      <section class="card">
        <h2>Modo general</h2>
        <label>Modo impresión general</label>
        <select name="modo_impresion">
          <option value="preview" ${modo === "preview" ? "selected" : ""}>Preview / ventana</option>
          <option value="archivo_txt" ${modo === "archivo_txt" ? "selected" : ""}>Archivo TXT</option>
          <option value="escpos_red" ${modo === "escpos_red" ? "selected" : ""}>ESC/POS red futura</option>
          <option value="centro_impresion" ${modo === "centro_impresion" ? "selected" : ""}>Centro de impresión</option>
        </select>
      </section>

      <section class="grid">
        ${cards}
      </section>

      <button type="submit">Guardar centro de impresión</button>
    </form>
  </main>
</body>
</html>`;
}

function pruebaTexto(destino) {
  return [
    "RESTAURANT SERVICE POS",
    "PRUEBA " + String(destino.nombre || destino.id).toUpperCase(),
    "DESTINO: " + String(destino.id).toUpperCase(),
    "HORA: " + new Date().toLocaleString("es-ES"),
    "------------------------------",
    "1 x PRODUCTO DE PRUEBA",
    "------------------------------",
    "Si ves esto, la prueba se generó correctamente.",
    ""
  ].join("\n");
}

function nombreArchivoPrueba(destinoId, restauranteId) {
  const limpio = String(destinoId || "ticket").replace(/[^a-zA-Z0-9_-]/g, "_");
  return "prueba_r" + restauranteId + "_" + limpio + ".txt";
}

module.exports = function destinosImpresionSaasRoutes(db) {
  const router = express.Router();

  router.get("/saas/api/destinos-comanda", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const destinos = await destinosRestaurante(db, restauranteId);

    res.json(destinos.filter((d) => Number(d.activo) === 1));
  });

  router.get("/api/destinos-comanda", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const destinos = await destinosRestaurante(db, restauranteId);

    res.json(destinos.filter((d) => Number(d.activo) === 1));
  });

  router.get("/configuracion-destinos", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const destinos = await destinosRestaurante(db, restauranteId);

    res.send(renderDestinos(destinos, req.query || {}));
  });

  router.post("/configuracion-destinos/crear", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const nombre = String((req.body || {}).nombre || "").trim();

    if (!nombre) {
      return res.redirect("/configuracion-destinos?error=" + encodeURIComponent("Nombre no válido"));
    }

    const idBase = slug(nombre);

    if (!idBase) {
      return res.redirect("/configuracion-destinos?error=" + encodeURIComponent("Nombre no válido"));
    }

    const id = "r" + restauranteId + "_" + idBase;

    await run(
      db,
      "INSERT OR IGNORE INTO destinos_comanda(id, nombre, activo, orden, restaurante_id) VALUES (?, ?, 1, 100, ?)",
      [id, nombre, restauranteId]
    );

    res.redirect("/configuracion-destinos?ok=" + encodeURIComponent("Destino creado"));
  });

  router.post("/configuracion-destinos/:id/activar", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = String(req.params.id || "");

    await run(
      db,
      "UPDATE destinos_comanda SET activo=1 WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [id, restauranteId]
    );

    res.redirect("/configuracion-destinos?ok=" + encodeURIComponent("Destino activado"));
  });

  router.post("/configuracion-destinos/:id/desactivar", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = String(req.params.id || "");

    await run(
      db,
      "UPDATE destinos_comanda SET activo=0 WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [id, restauranteId]
    );

    res.redirect("/configuracion-destinos?ok=" + encodeURIComponent("Destino desactivado"));
  });

  router.get("/api/centro-impresion", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await asegurarConfig(db, restauranteId);
    const destinos = await destinosRestaurante(db, restauranteId);
    const configJson = parseConfigImpresion(config);

    const respuesta = {
      ok: true,
      modo: config.modo_impresion || "preview",
      ticket: configDestino(config, configJson, { id: "ticket", nombre: "Ticket", activo: 1 }),
      bar: configDestino(config, configJson, { id: "bar", nombre: "Bar", activo: 1 }),
      cocina: configDestino(config, configJson, { id: "cocina", nombre: "Cocina", activo: 1 }),
      destinos: {}
    };

    [{ id: "ticket", nombre: "Ticket", activo: 1 }].concat(destinos).forEach((d) => {
      const cfg = configDestino(config, configJson, d);
      respuesta.destinos[d.id] = cfg;
      respuesta.destinos[d.nombre] = cfg;
      respuesta.destinos[String(d.nombre || "").toLowerCase()] = cfg;
    });

    res.json(respuesta);
  });

  router.get("/configuracion-impresoras", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await asegurarConfig(db, restauranteId);
    const destinos = await destinosRestaurante(db, restauranteId);

    res.send(renderImpresoras(config, destinos, req.query || {}));
  });

  router.post("/configuracion-impresoras", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const body = req.body || {};
    const config = await asegurarConfig(db, restauranteId);
    const destinos = await destinosRestaurante(db, restauranteId);
    const todos = [{ id: "ticket", nombre: "Ticket", activo: 1 }].concat(destinos);
    const configJson = {};

    todos.forEach((d) => {
      configJson[d.id] = {
        nombre: body["impresora_" + d.id] || "",
        modo: body["modo_" + d.id] || body.modo_impresion || "preview"
      };
    });

    await run(
      db,
      `UPDATE configurazione
       SET modo_impresion=?,
           stampante_ticket=?,
           stampante_bar=?,
           stampante_cocina=?,
           stampante_cucina=?,
           config_impresion_json=?
       WHERE id=?
       AND COALESCE(restaurante_id,1)=?`,
      [
        body.modo_impresion || "preview",
        body.impresora_ticket || "",
        body.impresora_bar || "",
        body.impresora_cocina || "",
        body.impresora_cocina || "",
        JSON.stringify(configJson),
        config.id,
        restauranteId
      ]
    );

    res.redirect("/configuracion-impresoras?ok=" + encodeURIComponent("Centro de impresión guardado correctamente"));
  });

  router.post("/configuracion-impresoras/probar-:destinoId", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const destinoId = String(req.params.destinoId || "ticket");
    const destinos = [{ id: "ticket", nombre: "Ticket / caja", activo: 1 }].concat(await destinosRestaurante(db, restauranteId));
    const destino = destinos.find((d) => String(d.id) === destinoId) || { id: destinoId, nombre: destinoId, activo: 1 };
    const archivo = nombreArchivoPrueba(destinoId, restauranteId);
    const carpeta = path.join(process.cwd(), "prints");

    try {
      fs.mkdirSync(carpeta, { recursive: true });
      fs.writeFileSync(path.join(carpeta, archivo), pruebaTexto(destino), "utf8");
    } catch (err) {
      console.error("[destinosImpresionSaas] Error prueba impresión:", err.message);
      return res.redirect("/configuracion-impresoras?error=" + encodeURIComponent("No se pudo generar la prueba"));
    }

    res.redirect("/configuracion-impresoras?ok=" + encodeURIComponent("Prueba generada en prints/" + archivo));
  });

  router.get("/configuracion-impresoras/ver-prueba/:destinoId", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const archivo = nombreArchivoPrueba(req.params.destinoId, restauranteId);
    const ruta = path.join(process.cwd(), "prints", archivo);

    if (!fs.existsSync(ruta)) {
      return res.send("<pre>No hay prueba generada todavía para este destino.</pre>");
    }

    res.type("text/plain").send(fs.readFileSync(ruta, "utf8"));
  });

  return router;
};
