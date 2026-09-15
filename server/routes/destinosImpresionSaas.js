const {
  creaCodicePairingBridge
} = require("../printing/printBridgePairing");

const express = require("express");
const fs = require("fs");
const path = require("path");
const { restauranteIdFromReq } = require("../utils/restauranteContext");
const {
  accodaLavoro
} = require("../printing/printBridgeQueue");
const {
  textosDestinosImpresion,
  nombreDestinoVisible
} = require("../utils/destinosImpresionI18n");

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
    const textos = textosDestinosImpresion(
      req.session.usuario.idioma
    );

    return res.status(403).send(textos.sinPermisos);
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

async function textosDestinosRestaurante(db, restauranteId) {
  const restaurante = await get(
    db,
    "SELECT idioma FROM restaurantes WHERE id=?",
    [restauranteId]
  );

  return textosDestinosImpresion(
    restaurante && restaurante.idioma
  );
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
  const modo =
    config.modo_impresion ||
    "preview";

  const id =
    destino.id;

  const guardado =
    configJson[id] || {};

  let nombre =
    guardado.nombre || "";

  if (id === "ticket") {
    nombre =
      nombre ||
      config.stampante_ticket ||
      "";
  }

  if (id === "bar") {
    nombre =
      nombre ||
      config.stampante_bar ||
      "";
  }

  if (id === "cocina") {
    nombre =
      nombre ||
      config.stampante_cocina ||
      config.stampante_cucina ||
      "";
  }

  return {
    id,
    nombre,
    modo:
      guardado.modo ||
      modo,
    tipo:
      guardado.tipo ||
      "preview",
    printer_id:
      String(
        guardado.printer_id ||
        ""
      ),
    bridge_id:
      String(
        guardado.bridge_id ||
        ""
      ),
    activo:
      destino.activo
  };
}

function renderDestinos(destinos, query, textos) {
  const ok = query.ok || "";
  const error = query.error || "";

  const filas = destinos.map((d) => `
    <tr>
      <td><strong>${escapar(nombreDestinoVisible(d, textos))}</strong><br><small>${escapar(d.id)}</small></td>
      <td>${d.base ? escapar(textos.baseSistema) : escapar(textos.personalizado)}</td>
      <td>${Number(d.activo) === 1
        ? "<span class='ok'>" + escapar(textos.activo) + "</span>"
        : "<span class='off'>" + escapar(textos.desactivado) + "</span>"}</td>
      <td>
        ${d.base
          ? "<small>" + escapar(textos.baseNoEliminar) + "</small>"
          : `
          <form method="POST" action="/configuracion-destinos/${encodeURIComponent(d.id)}/${Number(d.activo) === 1 ? "desactivar" : "activar"}">
            <button type="submit">${escapar(Number(d.activo) === 1 ? textos.desactivar : textos.activar)}</button>
          </form>
        `}
      </td>
    </tr>
  `).join("");

  return `<!doctype html>
<html lang="${escapar(textos.lang)}">
<head>
  <meta charset="utf-8">
  <title>${escapar(textos.destinosComanda)} - Restaurant Service POS</title>
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
      <h1>${escapar(textos.destinosComanda)}</h1>
      <p>${escapar(textos.descripcionDestinos)}</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">${escapar(textos.volverConfiguracion)}</a>
        <a class="btn sec" href="/configuracion-productos">${escapar(textos.productos)}</a>
        <a class="btn sec" href="/configuracion-impresoras">${escapar(textos.impresion)}</a>
      </div>
    </section>

    ${ok ? `<div class="msg okmsg">${escapar(ok)}</div>` : ""}
    ${error ? `<div class="msg errmsg">${escapar(error)}</div>` : ""}

    <section class="card">
      <h2>${escapar(textos.crearDestinoPersonalizado)}</h2>
      <form method="POST" action="/configuracion-destinos/crear">
        <label>${escapar(textos.nombre)}</label>
        <div class="line">
          <input name="nombre" placeholder="${escapar(textos.placeholderDestino)}" required>
          <button type="submit">${escapar(textos.crearDestino)}</button>
        </div>
      </form>
    </section>

    <section class="card">
      <h2>${escapar(textos.destinosDisponibles)}</h2>
      <table>
        <thead>
          <tr>
            <th>${escapar(textos.destino)}</th>
            <th>${escapar(textos.tipo)}</th>
            <th>${escapar(textos.estado)}</th>
            <th>${escapar(textos.accion)}</th>
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

function testiPairingBridge(langValor) {
  const lang =
    String(langValor || "es")
      .toLowerCase();

  const testi = {
    es: {
      boton: "Conectar Print Bridge",
      ayuda:
        "Genera un código temporal para vincular este restaurante con su Print Bridge.",
      titulo:
        "Conectar Print Bridge",
      instruccion:
        "Introduce este código en RSP Print Bridge. Es de un solo uso.",
      caduca:
        "Caduca",
      copiar:
        "Copiar código",
      volver:
        "Volver al Centro de impresión"
    },
    it: {
      boton: "Collega Print Bridge",
      ayuda:
        "Genera un codice temporaneo per collegare questo ristorante al suo Print Bridge.",
      titulo:
        "Collega Print Bridge",
      instruccion:
        "Inserisci questo codice in RSP Print Bridge. È monouso.",
      caduca:
        "Scade",
      copiar:
        "Copia codice",
      volver:
        "Torna al Centro di stampa"
    },
    en: {
      boton: "Connect Print Bridge",
      ayuda:
        "Generate a temporary code to link this restaurant to its Print Bridge.",
      titulo:
        "Connect Print Bridge",
      instruccion:
        "Enter this code in RSP Print Bridge. It can only be used once.",
      caduca:
        "Expires",
      copiar:
        "Copy code",
      volver:
        "Back to Print Center"
    },
    "pt-br": {
      boton: "Conectar Print Bridge",
      ayuda:
        "Gere um código temporário para vincular este restaurante ao Print Bridge.",
      titulo:
        "Conectar Print Bridge",
      instruccion:
        "Digite este código no RSP Print Bridge. Ele só pode ser usado uma vez.",
      caduca:
        "Expira",
      copiar:
        "Copiar código",
      volver:
        "Voltar ao Centro de impressão"
    }
  };

  return (
    testi[lang] ||
    testi.es
  );
}

function renderImpresoras(
  config,
  destinos,
  query,
  textos,
  bridgeConfig,
  stampantiBridge
) {
  const ok =
    query.ok || "";

  const error =
    query.error || "";

  const configJson =
    parseConfigImpresion(config);

  const modo =
    config.modo_impresion ||
    "ventana";

  const stampanti =
    Array.isArray(stampantiBridge)
      ? stampantiBridge
      : [];

  const rilevate =
    stampanti.filter(
      (p) =>
        String(p.stato) ===
        "rilevata"
    );

  const destinosImpresion = [
    {
      id: "ticket",
      nombre:
        textos.ticketCaja,
      activo: 1,
      orden: 0
    },
    ...destinos.map(
      (destino) => ({
        ...destino,
        nombre:
          nombreDestinoVisible(
            destino,
            textos
          )
      })
    )
  ];

  function selectBridge(cfg, destinoId) {
    let html =
      '<select name="print_bridge_' +
      escapar(destinoId) +
      '">';

    html +=
      '<option value="">' +
      escapar(textos.sinAsignar) +
      '</option>';

    rilevate.forEach((p) => {
      const value =
        JSON.stringify({
          bridge_id:
            p.bridge_id,
          printer_id:
            p.printer_id
        });

      const selected =
        String(cfg.bridge_id || "") ===
          String(p.bridge_id || "") &&
        String(cfg.printer_id || "") ===
          String(p.printer_id || "");

      const label =
        String(p.printer_nome || "") +
        " — " +
        String(
          p.connessione ||
          p.tipo ||
          ""
        );

      html +=
        '<option value="' +
        escapar(value) +
        '"' +
        (
          selected
            ? " selected"
            : ""
        ) +
        ">" +
        escapar(label) +
        "</option>";
    });

    html +=
      "</select>";

    return html;
  }

  const cards =
    destinosImpresion
      .map((d) => {
        const cfg =
          configDestino(
            config,
            configJson,
            d
          );

        return `
          <div class="printer-card">
            <h3>${escapar(d.nombre)}</h3>
            <small>${escapar(d.id)}</small>

            <label>${escapar(textos.modo)}</label>
            <select name="modo_${escapar(d.id)}">
              <option value="ventana" ${cfg.modo === "ventana" ? "selected" : ""}>${escapar(textos.modoVentana)}</option>
              <option value="preview" ${cfg.modo === "preview" ? "selected" : ""}>${escapar(textos.modoPreview)}</option>
              <option value="archivo_txt" ${cfg.modo === "archivo_txt" ? "selected" : ""}>${escapar(textos.modoArchivoTxt)}</option>
              <option value="escpos_red" ${cfg.modo === "escpos_red" ? "selected" : ""}>${escapar(textos.modoEscposRed)}</option>
              <option value="print_bridge" ${cfg.modo === "print_bridge" ? "selected" : ""}>${escapar(textos.modoPrintBridge)}</option>
            </select>

            <label>${escapar(textos.seleccionarImpresora)}</label>
            ${selectBridge(cfg, d.id)}

            <p class="help">
              ${escapar(textos.printBridgeAyuda)}
            </p>

            <details>
              <summary>${escapar(textos.configuracionLegacy)}</summary>

              <label>${escapar(textos.nombreImpresora)}</label>
              <input
                name="impresora_${escapar(d.id)}"
                value="${escapar(cfg.nombre)}"
                placeholder="${escapar(textos.placeholderImpresora)}"
              >
            </details>

            <button
              type="submit"
              formaction="/configuracion-impresoras/probar-${encodeURIComponent(d.id)}"
            >
              ${escapar(textos.probar)} ${escapar(d.nombre)}
            </button>

            <a
              class="link"
              target="_blank"
              href="/configuracion-impresoras/ver-prueba/${encodeURIComponent(d.id)}"
            >
              ${escapar(textos.verUltimaPrueba)}
            </a>
          </div>
        `;
      })
      .join("");

  const bridgeHtml =
    bridgeConfig
      ? `
        <div class="bridge-ok">
          <strong>${escapar(textos.bridgeRegistrado)}</strong>
          <div>${escapar(bridgeConfig.bridge_nombre || "")}</div>
          <small>
            ${escapar(textos.versionBridge)}:
            ${escapar(bridgeConfig.bridge_version || "-")}
            ·
            ${escapar(textos.ultimoContacto)}:
            ${escapar(bridgeConfig.ultimo_contacto || "-")}
          </small>
        </div>
      `
      : `
        <div class="bridge-off">
          ${escapar(textos.bridgeNoRegistrado)}
        </div>
      `;

  const pairingTesti =
    testiPairingBridge(
      textos.lang
    );

  const pairingHtml = `
    <form
      method="POST"
      action="/configuracion-impresoras/print-bridge/pairing"
      style="margin-top:12px;"
    >
      <button type="submit">
        ${escapar(pairingTesti.boton)}
      </button>
    </form>

    <p class="help">
      ${escapar(pairingTesti.ayuda)}
    </p>
  `;

  const stampantiHtml =
    stampanti.length
      ? stampanti
          .map((p) => {
            const rilevata =
              String(p.stato) ===
              "rilevata";

            return `
              <div class="device">
                <div>
                  <strong>${escapar(p.printer_nome)}</strong>
                  <small>${escapar(p.printer_id)}</small>
                </div>

                <div>
                  <strong>
                    ${escapar(
                      rilevata
                        ? textos.estadoDetectada
                        : textos.estadoNoDetectada
                    )}
                  </strong>

                  <small>
                    ${escapar(textos.conexion)}:
                    ${escapar(p.connessione || p.tipo || "-")}
                  </small>

                  <small>
                    ${escapar(textos.identificadorBridge)}:
                    ${escapar(p.bridge_id)}
                  </small>
                </div>
              </div>
            `;
          })
          .join("")
      : `
        <p>
          ${escapar(textos.ningunaImpresoraDetectada)}
        </p>
      `;

  return `<!doctype html>
<html lang="${escapar(textos.lang)}">
<head>
  <meta charset="utf-8">
  <title>${escapar(textos.centroImpresion)} - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <style>
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Arial,Helvetica,sans-serif;
      color:#111827;
      background:
        radial-gradient(circle at 12% 8%,rgba(20,184,166,.17),transparent 28%),
        radial-gradient(circle at 88% 10%,rgba(245,158,11,.15),transparent 25%),
        #f3f4f6;
    }
    .wrap{
      max-width:1180px;
      margin:auto;
      padding:28px 18px 70px;
    }
    .hero{
      background:linear-gradient(135deg,#111827,#0f766e);
      color:white;
      border-radius:28px;
      padding:28px;
      margin-bottom:18px;
      box-shadow:0 20px 50px rgba(15,23,42,.20);
    }
    .hero h1{
      margin:0 0 8px;
      font-size:32px;
    }
    .hero p{
      margin:0;
      color:#ccfbf1;
    }
    .actions{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-top:18px;
    }
    .btn,button{
      border:0;
      border-radius:12px;
      padding:11px 14px;
      background:#0f766e;
      color:white;
      text-decoration:none;
      font-weight:900;
      cursor:pointer;
    }
    .sec{
      background:white;
      color:#111827;
    }
    .card{
      background:white;
      border:1px solid #e5e7eb;
      border-radius:22px;
      padding:20px;
      margin-bottom:16px;
      box-shadow:0 10px 28px rgba(15,23,42,.07);
    }
    .bridge-grid{
      display:grid;
      grid-template-columns:1fr 1.3fr;
      gap:14px;
    }
    .bridge-ok{
      padding:16px;
      border-radius:16px;
      background:#ecfdf5;
      border:1px solid #86efac;
    }
    .bridge-off{
      padding:16px;
      border-radius:16px;
      background:#fef2f2;
      border:1px solid #fecaca;
    }
    .device{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:12px;
      padding:12px;
      border-bottom:1px solid #e5e7eb;
    }
    .device:last-child{
      border-bottom:0;
    }
    .device small{
      display:block;
      margin-top:4px;
      color:#6b7280;
    }
    .grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:14px;
    }
    .printer-card{
      padding:17px;
      background:#f9fafb;
      border:1px solid #e5e7eb;
      border-radius:18px;
    }
    .printer-card h3{
      margin:0 0 2px;
    }
    label{
      display:block;
      margin:12px 0 6px;
      font-size:12px;
      font-weight:900;
      text-transform:uppercase;
      color:#374151;
    }
    input,select{
      width:100%;
      padding:11px;
      border:1px solid #d1d5db;
      border-radius:12px;
      background:white;
      font-size:14px;
    }
    .help{
      color:#6b7280;
      font-size:12px;
      line-height:1.45;
    }
    details{
      margin:12px 0;
      padding:10px;
      border-radius:12px;
      background:white;
      border:1px solid #e5e7eb;
    }
    summary{
      cursor:pointer;
      font-weight:800;
    }
    .link{
      display:inline-block;
      margin-top:10px;
      color:#0f766e;
      font-weight:900;
    }
    .msg{
      padding:12px 14px;
      border-radius:14px;
      margin-bottom:14px;
      font-weight:900;
    }
    .okmsg{
      background:#ecfdf5;
      border:1px solid #86efac;
    }
    .errmsg{
      background:#fef2f2;
      border:1px solid #fecaca;
    }
    @media(max-width:850px){
      .grid,
      .bridge-grid,
      .device{
        grid-template-columns:1fr;
      }
    }
  </style>
</head>

<body>
<main class="wrap">

  <section class="hero">
    <h1>${escapar(textos.centroImpresion)}</h1>
    <p>${escapar(textos.descripcionImpresion)}</p>

    <div class="actions">
      <a class="btn sec" href="/configuracion">
        ${escapar(textos.volverConfiguracion)}
      </a>

      <a class="btn sec" href="/configuracion-destinos">
        ${escapar(textos.destinos)}
      </a>

      <a class="btn sec" href="/app/v2">
        ${escapar(textos.abrirPos)}
      </a>
    </div>
  </section>

  ${ok ? `<div class="msg okmsg">${escapar(ok)}</div>` : ""}
  ${error ? `<div class="msg errmsg">${escapar(error)}</div>` : ""}

  <section class="card">
    <h2>${escapar(textos.rspPrintBridge)}</h2>

    <div class="bridge-grid">
      <div>
        ${bridgeHtml}${pairingHtml}
      </div>

      <div>
        <h3>${escapar(textos.impresorasDetectadas)}</h3>
        ${stampantiHtml}
      </div>
    </div>
  </section>

  <form method="POST" action="/configuracion-impresoras">

    <section class="card">
      <h2>${escapar(textos.modoGeneral)}</h2>

      <label>
        ${escapar(textos.modoImpresionGeneral)}
      </label>

      <select name="modo_impresion">
        <option value="ventana" ${modo === "ventana" ? "selected" : ""}>
          ${escapar(textos.modoVentana)}
        </option>

        <option value="preview" ${modo === "preview" ? "selected" : ""}>
          ${escapar(textos.modoPreview)}
        </option>

        <option value="archivo_txt" ${modo === "archivo_txt" ? "selected" : ""}>
          ${escapar(textos.modoArchivoTxt)}
        </option>

        <option value="escpos_red" ${modo === "escpos_red" ? "selected" : ""}>
          ${escapar(textos.modoEscposRed)}
        </option>

        <option value="centro_impresion" ${modo === "centro_impresion" ? "selected" : ""}>
          ${escapar(textos.modoCentroImpresion)}
        </option>
      </select>
    </section>

    <section class="grid">
      ${cards}
    </section>

    <button type="submit">
      ${escapar(textos.guardarCentroImpresion)}
    </button>

  </form>

</main>
</body>
</html>`;
}

function pruebaTexto(destino, textos) {
  return [
    "RESTAURANT SERVICE POS",
    textos.prueba + " " +
      String(destino.nombre || destino.id).toUpperCase(),
    textos.etiquetaDestino + ": " +
      String(destino.id).toUpperCase(),
    textos.etiquetaHora + ": " +
      new Date().toLocaleString(textos.localeFecha),
    "------------------------------",
    textos.productoPrueba,
    "------------------------------",
    textos.pruebaCorrecta,
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
    const textos = await textosDestinosRestaurante(
      db,
      restauranteId
    );
    const destinos = await destinosRestaurante(
      db,
      restauranteId
    );

    res.send(
      renderDestinos(
        destinos,
        req.query || {},
        textos
      )
    );
  });

  router.post("/configuracion-destinos/crear", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const textos = await textosDestinosRestaurante(
      db,
      restauranteId
    );
    const nombre = String((req.body || {}).nombre || "").trim();

    if (!nombre) {
      return res.redirect("/configuracion-destinos?error=" + encodeURIComponent(textos.nombreNoValido));
    }

    const idBase = slug(nombre);

    if (!idBase) {
      return res.redirect("/configuracion-destinos?error=" + encodeURIComponent(textos.nombreNoValido));
    }

    const id = "r" + restauranteId + "_" + idBase;

    await run(
      db,
      "INSERT OR IGNORE INTO destinos_comanda(id, nombre, activo, orden, restaurante_id) VALUES (?, ?, 1, 100, ?)",
      [id, nombre, restauranteId]
    );

    res.redirect("/configuracion-destinos?ok=" + encodeURIComponent(textos.destinoCreado));
  });

  router.post("/configuracion-destinos/:id/activar", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const textos = await textosDestinosRestaurante(
      db,
      restauranteId
    );
    const id = String(req.params.id || "");

    await run(
      db,
      "UPDATE destinos_comanda SET activo=1 WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [id, restauranteId]
    );

    res.redirect("/configuracion-destinos?ok=" + encodeURIComponent(textos.destinoActivado));
  });

  router.post("/configuracion-destinos/:id/desactivar", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const textos = await textosDestinosRestaurante(
      db,
      restauranteId
    );
    const id = String(req.params.id || "");

    await run(
      db,
      "UPDATE destinos_comanda SET activo=0 WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [id, restauranteId]
    );

    res.redirect("/configuracion-destinos?ok=" + encodeURIComponent(textos.destinoDesactivado));
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

  router.post("/configuracion-impresoras/print-bridge/pairing", requiereConfig, async function(req, res) {
    try {
      const restauranteId =
        restauranteIdFromReq(req);

      const textos =
        await textosDestinosRestaurante(
          db,
          restauranteId
        );

      const t =
        testiPairingBridge(
          textos.lang
        );

      const pairing =
        await creaCodicePairingBridge(
          db,
          restauranteId,
          10
        );

      res.send(`<!doctype html>
<html lang="${escapar(textos.lang || "es")}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapar(t.titulo)}</title>
  <style>
    body{
      font-family:Arial,Helvetica,sans-serif;
      background:#f3f4f6;
      color:#111827;
      padding:30px;
    }
    .card{
      max-width:620px;
      margin:40px auto;
      background:white;
      border:1px solid #e5e7eb;
      border-radius:22px;
      padding:28px;
      text-align:center;
      box-shadow:0 14px 36px rgba(15,23,42,.10);
    }
    .code{
      font-family:monospace;
      font-size:34px;
      font-weight:900;
      letter-spacing:3px;
      margin:24px 0;
      padding:18px;
      background:#f9fafb;
      border:2px dashed #0f766e;
      border-radius:16px;
    }
    button,a{
      display:inline-block;
      border:0;
      border-radius:12px;
      padding:11px 16px;
      background:#0f766e;
      color:white;
      font-weight:900;
      text-decoration:none;
      cursor:pointer;
      margin:6px;
    }
    .muted{
      color:#6b7280;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapar(t.titulo)}</h1>
    <p>${escapar(t.instruccion)}</p>

    <div
      class="code"
      id="pairing-code"
    >${escapar(pairing.codice)}</div>

    <p class="muted">
      ${escapar(t.caduca)}:
      ${escapar(pairing.scade_en)}
    </p>

    <button
      type="button"
      onclick="navigator.clipboard.writeText(document.getElementById('pairing-code').textContent.trim())"
    >
      ${escapar(t.copiar)}
    </button>

    <a href="/configuracion-impresoras">
      ${escapar(t.volver)}
    </a>
  </div>
</body>
</html>`);
    } catch (err) {
      console.error(
        "[PRINT BRIDGE PAIRING UI]",
        err.message
      );

      res.status(500).send(
        "Errore generando codice Print Bridge"
      );
    }
  });

  router.get("/configuracion-impresoras", requiereConfig, async function(req, res) {
    const restauranteId =
      restauranteIdFromReq(req);

    const textos =
      await textosDestinosRestaurante(
        db,
        restauranteId
      );

    const config =
      await asegurarConfig(
        db,
        restauranteId
      );

    const destinos =
      await destinosRestaurante(
        db,
        restauranteId
      );

    const bridgeConfig =
      await get(
        db,
        `
        SELECT
          restaurante_id,
          bridge_nombre,
          bridge_version,
          ultimo_contacto,
          ultimo_error
        FROM print_bridge_config
        WHERE restaurante_id=?
        LIMIT 1
        `,
        [restauranteId]
      );

    const stampanti =
      await all(
        db,
        `
        SELECT
          restaurante_id,
          bridge_id,
          printer_id,
          printer_nome,
          tipo,
          connessione,
          uri,
          stato,
          ultimo_contacto
        FROM print_bridge_printers
        WHERE restaurante_id=?
        ORDER BY
          CASE
            WHEN stato='rilevata'
            THEN 0
            ELSE 1
          END,
          printer_nome
        `,
        [restauranteId]
      );

    res.send(
      renderImpresoras(
        config,
        destinos,
        req.query || {},
        textos,
        bridgeConfig,
        stampanti
      )
    );
  });

  router.post("/configuracion-impresoras", requiereConfig, async function(req, res) {
    const restauranteId =
      restauranteIdFromReq(req);

    const textos =
      await textosDestinosRestaurante(
        db,
        restauranteId
      );

    const body =
      req.body || {};

    const config =
      await asegurarConfig(
        db,
        restauranteId
      );

    const destinos =
      await destinosRestaurante(
        db,
        restauranteId
      );

    const todos =
      [
        {
          id: "ticket",
          nombre: "Ticket",
          activo: 1
        }
      ].concat(destinos);

    const stampanti =
      await all(
        db,
        `
        SELECT
          bridge_id,
          printer_id,
          printer_nome,
          stato
        FROM print_bridge_printers
        WHERE restaurante_id=?
          AND stato='rilevata'
        `,
        [restauranteId]
      );

    const mappaStampanti = {};

    stampanti.forEach((p) => {
      mappaStampanti[
        String(p.bridge_id) +
        "\n" +
        String(p.printer_id)
      ] = p;
    });

    const configJson = {};

    let erroreBridge = false;

    todos.forEach((d) => {
      const modoDestino =
        String(
          body[
            "modo_" + d.id
          ] ||
          body.modo_impresion ||
          "ventana"
        );

      const legacyNome =
        String(
          body[
            "impresora_" + d.id
          ] || ""
        );

      const item = {
        nombre:
          legacyNome,
        modo:
          modoDestino
      };

      const raw =
        String(
          body[
            "print_bridge_" + d.id
          ] || ""
        );

      if (raw) {
        try {
          const scelta =
            JSON.parse(raw);

          const chiave =
            String(
              scelta.bridge_id || ""
            ) +
            "\n" +
            String(
              scelta.printer_id || ""
            );

          const stampante =
            mappaStampanti[chiave];

          if (stampante) {
            item.bridge_id =
              stampante.bridge_id;

            item.printer_id =
              stampante.printer_id;

            if (
              modoDestino ===
              "print_bridge"
            ) {
              item.nombre =
                stampante.printer_nome;
            }
          } else if (
            modoDestino ===
            "print_bridge"
          ) {
            erroreBridge = true;
          }
        } catch (_) {
          if (
            modoDestino ===
            "print_bridge"
          ) {
            erroreBridge = true;
          }
        }
      } else if (
        modoDestino ===
        "print_bridge"
      ) {
        erroreBridge = true;
      }

      configJson[d.id] =
        item;
    });

    if (erroreBridge) {
      return res.redirect(
        "/configuracion-impresoras?error=" +
        encodeURIComponent(
          textos.stampanteBridgeNonValida
        )
      );
    }

    const modiGenerali = [
      "ventana",
      "preview",
      "archivo_txt",
      "escpos_red",
      "centro_impresion"
    ];

    const modoGenerale =
      modiGenerali.includes(
        String(body.modo_impresion)
      )
        ? String(body.modo_impresion)
        : String(
            config.modo_impresion ||
            "ventana"
          );

    await run(
      db,
      `
      UPDATE configurazione
      SET
        modo_impresion=?,
        stampante_ticket=?,
        stampante_bar=?,
        stampante_cocina=?,
        stampante_cucina=?,
        config_impresion_json=?
      WHERE id=?
        AND COALESCE(
          restaurante_id,
          1
        )=?
      `,
      [
        modoGenerale,
        body.impresora_ticket || "",
        body.impresora_bar || "",
        body.impresora_cocina || "",
        body.impresora_cocina || "",
        JSON.stringify(
          configJson
        ),
        config.id,
        restauranteId
      ]
    );

    res.redirect(
      "/configuracion-impresoras?ok=" +
      encodeURIComponent(
        textos.centroImpresionGuardado
      )
    );
  });

  router.post("/configuracion-impresoras/probar-:destinoId", requiereConfig, async function(req, res) {

    const restauranteId =
      restauranteIdFromReq(req);

    const textos =
      await textosDestinosRestaurante(
        db,
        restauranteId
      );

    const destinoId =
      String(
        req.params.destinoId ||
        "ticket"
      );

    const destinos = [
      {
        id: "ticket",
        nombre: textos.ticketCaja,
        activo: 1
      },
      ...(
        await destinosRestaurante(
          db,
          restauranteId
        )
      ).map((destino) => ({
        ...destino,
        nombre:
          nombreDestinoVisible(
            destino,
            textos
          )
      }))
    ];

    const destino =
      destinos.find(
        (d) =>
          String(d.id) ===
          destinoId
      ) || {
        id: destinoId,
        nombre: destinoId,
        activo: 1
      };

    const config =
      await asegurarConfig(
        db,
        restauranteId
      );

    const configJson =
      parseConfigImpresion(
        config
      );

    const cfg =
      configDestino(
        config,
        configJson,
        destino
      );

    const modo =
      String(
        cfg.modo || ""
      )
        .trim()
        .toLowerCase();

    if (modo === "print_bridge") {

      const bridgeId =
        String(
          cfg.bridge_id || ""
        ).trim();

      const printerId =
        String(
          cfg.printer_id || ""
        ).trim();

      if (
        !bridgeId ||
        !printerId
      ) {
        return res.redirect(
          "/configuracion-impresoras?error=" +
          encodeURIComponent(
            textos.stampanteBridgeNonValida
          )
        );
      }

      const bridge =
        await get(
          db,
          `
          SELECT
            restaurante_id
          FROM print_bridge_config
          WHERE restaurante_id=?
            AND token_hash IS NOT NULL
            AND TRIM(token_hash)<>''
          LIMIT 1
          `,
          [
            restauranteId
          ]
        );

      const stampante =
        await get(
          db,
          `
          SELECT
            bridge_id,
            printer_id,
            printer_nome,
            stato
          FROM print_bridge_printers
          WHERE restaurante_id=?
            AND bridge_id=?
            AND printer_id=?
            AND stato='rilevata'
          LIMIT 1
          `,
          [
            restauranteId,
            bridgeId,
            printerId
          ]
        );

      if (
        !bridge ||
        !stampante
      ) {
        return res.redirect(
          "/configuracion-impresoras?error=" +
          encodeURIComponent(
            textos.stampanteBridgeNonValida
          )
        );
      }

      const idempotencyKey =
        [
          "test",
          restauranteId,
          slug(destinoId) ||
            "ticket",
          Date.now(),
          require("crypto")
            .randomBytes(8)
            .toString("hex")
        ].join(":");

      try {

        const risultato =
          await accodaLavoro(
            db,
            {
              restaurante_id:
                restauranteId,

              idempotency_key:
                idempotencyKey,

              tipo:
                "test",

              destino:
                slug(destinoId) ||
                "ticket",

              contenuto:
                pruebaTexto(
                  destino,
                  textos
                ),

              printer_id:
                stampante.printer_id,

              printer_nombre:
                stampante.printer_nome,

              bridge_id:
                stampante.bridge_id
            }
          );

        if (
          !risultato ||
          !risultato.lavoro
        ) {
          throw new Error(
            "Job Print Bridge non creato"
          );
        }

        return res.redirect(
          "/configuracion-impresoras?ok=" +
          encodeURIComponent(
            textos.pruebaGenerada +
            " · RSP Print Bridge #" +
            risultato.lavoro.id
          )
        );

      } catch (err) {

        console.error(
          "[destinosImpresionSaas] Error test Print Bridge:",
          err.message
        );

        return res.redirect(
          "/configuracion-impresoras?error=" +
          encodeURIComponent(
            textos.noGenerarPrueba
          )
        );
      }
    }

    /*
     * Modalità legacy:
     * conserva il vecchio test TXT.
     */

    const archivo =
      nombreArchivoPrueba(
        destinoId,
        restauranteId
      );

    const carpeta =
      path.join(
        process.cwd(),
        "prints"
      );

    try {

      fs.mkdirSync(
        carpeta,
        {
          recursive: true
        }
      );

      fs.writeFileSync(
        path.join(
          carpeta,
          archivo
        ),
        pruebaTexto(
          destino,
          textos
        ),
        "utf8"
      );

    } catch (err) {

      console.error(
        "[destinosImpresionSaas] Error prueba impresión:",
        err.message
      );

      return res.redirect(
        "/configuracion-impresoras?error=" +
        encodeURIComponent(
          textos.noGenerarPrueba
        )
      );
    }

    return res.redirect(
      "/configuracion-impresoras?ok=" +
      encodeURIComponent(
        textos.pruebaGenerada +
        " prints/" +
        archivo
      )
    );

  });

  router.get("/configuracion-impresoras/ver-prueba/:destinoId", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const textos = await textosDestinosRestaurante(
      db,
      restauranteId
    );
    const archivo = nombreArchivoPrueba(req.params.destinoId, restauranteId);
    const ruta = path.join(process.cwd(), "prints", archivo);

    if (!fs.existsSync(ruta)) {
      return res.send("<pre>" + escapar(textos.sinPruebaGenerada) + "</pre>");
    }

    res.type("text/plain").send(fs.readFileSync(ruta, "utf8"));
  });

  return router;
};
