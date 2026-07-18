const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function escapar(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function requiereAdminGerente(req, res, next) {
  if (!req.session || !req.session.usuario) return res.redirect("/login");

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol !== "admin" && rol !== "gerente") {
    return res.status(403).send("No tienes permisos para esta configuración.");
  }

  next();
}

function requiereAdmin(req, res, next) {
  if (!req.session || !req.session.usuario) return res.redirect("/login");

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol !== "admin") {
    return res.status(403).send("Solo el administrador puede gestionar la suscripción.");
  }

  next();
}

function get(db, sql, params) {
  return new Promise((resolve) => {
    db.get(sql, params || [], function(err, row) {
      if (err) {
        console.error("[fiscalSaas] SQL get:", err.message);
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
        console.error("[fiscalSaas] SQL run:", err.message);
        return resolve({ ok: false, error: err.message });
      }
      resolve({ ok: true, id: this.lastID, changes: this.changes });
    });
  });
}

async function configActual(db, restauranteId) {
  let config = await get(
    db,
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=? ORDER BY id DESC LIMIT 1",
    [restauranteId]
  );

  if (config) return config;

  await run(
    db,
    `INSERT INTO configurazione
     (nome_ristorante, razon_social, iva, mensaje_ticket, pais, restaurante_id)
     VALUES ('Restaurant Service POS', 'Restaurant Service POS', 10, 'Gracias por su visita', 'España', ?)`,
    [restauranteId]
  );

  config = await get(
    db,
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=? ORDER BY id DESC LIMIT 1",
    [restauranteId]
  );

  return config || {};
}

function fiscalesCompletos(config) {
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

function fiscalesCompletosBody(body) {
  const b = body || {};

  return Boolean(
    String(b.razon_social || b.nome_ristorante || "").trim() &&
    String(b.partita_iva || "").trim() &&
    String(b.indirizzo || "").trim() &&
    String(b.codigo_postal || "").trim() &&
    String(b.ciudad || "").trim() &&
    String(b.provincia || "").trim() &&
    String(b.pais || "").trim() &&
    String(b.email_facturacion || b.email || "").trim()
  );
}

function layout(titulo, contenido) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)} - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;}
    .wrap{max-width:1120px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#111827,#0f766e);color:white;border-radius:26px;padding:28px;margin-bottom:18px;box-shadow:0 18px 42px rgba(15,23,42,.16);}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#ccfbf1;line-height:1.5;}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,button{display:inline-block;border:0;border-radius:12px;padding:11px 14px;background:#0f766e;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    a.sec,button.sec{background:#e5e7eb;color:#111827;}
    button:disabled{opacity:.45;cursor:not-allowed;}
    .msg{border-radius:15px;padding:12px 14px;margin-bottom:14px;font-weight:900;}
    .ok{background:#ecfdf5;color:#14532d;border:1px solid #86efac;}
    .error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
    .card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}
    .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
    label{display:block;font-weight:900;font-size:13px;margin:0 0 6px;color:#374151;}
    input,select,textarea{width:100%;border:1px solid #d1d5db;border-radius:12px;padding:10px;font-size:15px;background:white;}
    textarea{min-height:78px;}
    small{display:block;color:#6b7280;font-weight:800;margin-top:4px;}
    .dato{background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:14px;}
    .dato span{display:block;color:#6b7280;font-weight:900;font-size:12px;}
    .dato strong{display:block;font-size:20px;margin-top:5px;}
    .ticket-preview{max-width:360px;border:1px dashed #9ca3af;border-radius:16px;padding:16px;background:#fff;}
    code{display:block;background:#111827;color:white;padding:12px;border-radius:12px;white-space:pre-wrap;}
    @media(max-width:850px){.grid,.grid3{grid-template-columns:1fr;}}
  

    /* RS CHIC K2 FISCAL */
    body{
      background:
        radial-gradient(circle at 10% 8%, rgba(245,158,11,.20), transparent 30%),
        radial-gradient(circle at 86% 14%, rgba(20,184,166,.18), transparent 28%),
        linear-gradient(135deg,#0f172a 0%,#111827 32%,#f8fafc 32%,#f3f4f6 100%) !important;
      color:#101827 !important;
    }
    .wrap{
      max-width:1120px !important;
      padding:24px 18px 48px !important;
    }
    .hero{
      position:relative !important;
      overflow:hidden !important;
      border-radius:30px !important;
      padding:24px !important;
      background:
        linear-gradient(135deg,rgba(17,24,39,.96),rgba(15,118,110,.64)),
        radial-gradient(circle at 92% 18%, rgba(245,158,11,.55), transparent 32%) !important;
      box-shadow:0 24px 70px rgba(15,23,42,.28) !important;
      border:1px solid rgba(255,255,255,.14) !important;
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
    }
    .hero h1{
      font-size:32px !important;
      letter-spacing:-.045em !important;
      line-height:1.02 !important;
    }
    .hero p{
      color:#d1fae5 !important;
      max-width:760px !important;
    }
    .actions{
      position:relative;
      z-index:2;
    }
    a.btn,button{
      background:linear-gradient(135deg,#0f766e,#14b8a6) !important;
      color:white !important;
      border:1px solid rgba(255,255,255,.22) !important;
      box-shadow:0 10px 24px rgba(15,23,42,.14) !important;
      transition:transform .16s ease, box-shadow .16s ease !important;
    }
    a.btn:hover,button:hover{
      transform:translateY(-2px);
      box-shadow:0 16px 34px rgba(15,23,42,.20) !important;
    }
    a.sec,button.sec{
      background:linear-gradient(135deg,#ffffff,#e0f2fe) !important;
      color:#0f172a !important;
      border:1px solid rgba(255,255,255,.72) !important;
    }
    .card{
      border-radius:24px !important;
      background:rgba(255,255,255,.94) !important;
      border:1px solid rgba(229,231,235,.92) !important;
      box-shadow:0 14px 36px rgba(15,23,42,.09) !important;
      backdrop-filter:blur(12px);
    }
    .card h2{
      margin-top:0 !important;
      letter-spacing:-.035em !important;
      color:#111827 !important;
    }
    .grid,.grid3{
      gap:12px !important;
    }
    label{
      color:#374151 !important;
      font-size:12px !important;
      letter-spacing:.02em !important;
      text-transform:uppercase !important;
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
    .msg{
      border-radius:18px !important;
      box-shadow:0 10px 24px rgba(15,23,42,.06) !important;
    }
    .ok{
      background:linear-gradient(135deg,#ecfdf5,#f0fdfa) !important;
      border-color:#99f6e4 !important;
    }
    .error{
      background:linear-gradient(135deg,#fff7ed,#fef2f2) !important;
      border-color:#fed7aa !important;
    }
    .dato{
      background:linear-gradient(180deg,#ffffff,#f9fafb) !important;
      border-radius:18px !important;
      box-shadow:0 10px 24px rgba(15,23,42,.05) !important;
    }
    .dato strong{
      letter-spacing:-.04em !important;
    }
    .ticket-preview{
      border-radius:20px !important;
      box-shadow:0 16px 38px rgba(15,23,42,.10) !important;
      border:1px solid rgba(229,231,235,.95) !important;
    }
    code{
      border-radius:16px !important;
      background:linear-gradient(135deg,#0f172a,#111827) !important;
      box-shadow:0 16px 36px rgba(15,23,42,.18) !important;
    }

</style>
</head>
<body>
  <a href="/logout" style="position:fixed;right:16px;top:12px;z-index:9999;background:#111827;color:white;text-decoration:none;font-weight:900;border-radius:999px;padding:10px 13px;font-size:13px;">Cerrar sesión</a>
  <main class="wrap">${contenido}</main>
  <script>
  function instalarLogoPickerRestaurantService(){
    var input = document.getElementById("logo_archivo");
    var hidden = document.getElementById("logo");
    var preview = document.getElementById("logo_preview");

    if(!input || !hidden) return;

    input.addEventListener("change", function(){
      var file = input.files && input.files[0];
      if(!file) return;

      if(!file.type || file.type.indexOf("image/") !== 0){
        alert("El archivo elegido no es una imagen.");
        input.value = "";
        return;
      }

      var reader = new FileReader();

      reader.onload = function(ev){
        var img = new Image();

        img.onload = function(){
          var maxW = 500;
          var maxH = 250;
          var w = img.width;
          var h = img.height;
          var ratio = Math.min(maxW / w, maxH / h, 1);

          w = Math.round(w * ratio);
          h = Math.round(h * ratio);

          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;

          var ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          var dataUrl = canvas.toDataURL("image/png");
          hidden.value = dataUrl;

          if(preview){
            preview.src = dataUrl;
            preview.style.display = "";
          }
        };

        img.src = ev.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  instalarLogoPickerRestaurantService();
  </script>
</body>
</html>`;
}

function mensaje(query) {
  const ok = query && query.ok ? `<div class="msg ok">${escapar(query.ok)}</div>` : "";
  const error = query && query.error ? `<div class="msg error">${escapar(query.error)}</div>` : "";
  return ok + error;
}

function renderRestaurante(config, query) {
  const okFiscal = fiscalesCompletos(config);

  return layout("Datos del restaurante", `
    <section class="hero">
      <h1>Datos del restaurante</h1>
      <p>Datos generales, fiscales y de ticket del restaurante actual.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/configuracion-suscripcion">Suscripción</a>
        <a class="btn sec" target="_blank" href="/configuracion-restaurante/preview-ticket">Vista previa ticket</a>
      </div>
    </section>

    ${mensaje(query)}

    <div class="msg ${okFiscal ? "ok" : "error"}">
      ${okFiscal ? "Datos fiscales completos para facturación." : "Faltan datos fiscales. Antes de pagar la suscripción deben estar completos."}
    </div>

    <section class="card">
      <h2>Datos fiscales para facturación</h2>
      <p>Estos datos se usarán para facturas de suscripción cuando el restaurante empiece a pagar.</p>

      <form method="POST" action="/configuracion-restaurante">
        <div class="grid">
          <div>
            <label>Nombre comercial</label>
            <input name="nome_ristorante" value="${escapar(config.nome_ristorante || "")}" required>
          </div>
          <div>
            <label>Razón social / nombre fiscal</label>
            <input name="razon_social" value="${escapar(config.razon_social || config.nome_ristorante || "")}" required>
          </div>
          <div>
            <label>NIF / CIF / VAT</label>
            <input name="partita_iva" value="${escapar(config.partita_iva || "")}" required>
          </div>
          <div>
            <label>Email de facturación</label>
            <input type="email" name="email_facturacion" value="${escapar(config.email_facturacion || config.email || config.propietario_email || "")}" required>
          </div>
          <div>
            <label>Dirección fiscal</label>
            <input name="indirizzo" value="${escapar(config.indirizzo || "")}" required>
          </div>
          <div>
            <label>Código postal</label>
            <input name="codigo_postal" value="${escapar(config.codigo_postal || "")}" required>
          </div>
          <div>
            <label>Ciudad</label>
            <input name="ciudad" value="${escapar(config.ciudad || "")}" required>
          </div>
          <div>
            <label>Provincia</label>
            <input name="provincia" value="${escapar(config.provincia || "")}" required>
          </div>
          <div>
            <label>País</label>
            <input name="pais" value="${escapar(config.pais || "España")}" required>
          </div>
          <div>
            <label>IVA por defecto (%)</label>
            <input type="number" step="0.01" name="iva" value="${escapar(config.iva || 10)}">
          </div>
        </div>

        <br>

        <h2>Contacto y ticket</h2>
        <div class="grid">
          <div>
            <label>Teléfono restaurante</label>
            <input name="telefono" value="${escapar(config.telefono || "")}">
          </div>
          <div>
            <label>Email restaurante</label>
            <input type="email" name="email" value="${escapar(config.email || "")}">
          </div>
          <div>
            <label>Nombre propietario</label>
            <input name="propietario_nombre" value="${escapar(config.propietario_nombre || "")}">
          </div>
          <div>
            <label>Email propietario</label>
            <input type="email" name="propietario_email" value="${escapar(config.propietario_email || "")}">
          </div>
          <div>
            <label>Teléfono propietario</label>
            <input name="propietario_telefono" value="${escapar(config.propietario_telefono || "")}">
          </div>
          <div>
            <label>Logo ticket</label>
            <input type="hidden" id="logo" name="logo" value="${escapar(config.logo || "")}">
            <input type="file" id="logo_archivo" accept="image/*">
            <small>Haz clic para elegir una imagen del ordenador.</small>
            <div style="margin-top:10px;">
              <img id="logo_preview" src="${escapar(config.logo || "")}" style="${config.logo ? "" : "display:none;"}max-width:170px;max-height:90px;object-fit:contain;border:1px solid #e5e7eb;border-radius:12px;padding:8px;background:white;">
            </div>
          </div>
        </div>

        <br>

        <label>Mensaje del ticket</label>
        <textarea name="mensaje_ticket">${escapar(config.mensaje_ticket || "Gracias por su visita")}</textarea>

        <br><br>

        <button type="submit">Guardar datos del restaurante</button>
      </form>
    </section>

    <section class="card">
      <h2>Vista previa rápida del ticket</h2>
      <div class="ticket-preview">
        ${config.logo ? `<div style="text-align:center;margin-bottom:10px;"><img src="${escapar(config.logo)}" style="max-width:160px;max-height:80px;object-fit:contain;"></div>` : ""}
        <div style="text-align:center;">
          <strong>${escapar(config.nome_ristorante || "Restaurant Service POS")}</strong><br>
          <small>${escapar(config.partita_iva || "")}</small><br>
          <small>${escapar(config.indirizzo || "")}</small><br>
          <small>${escapar(config.codigo_postal || "")} ${escapar(config.ciudad || "")}</small><br>
          <small>${escapar(config.telefono || "")}</small>
        </div>
        <hr>
        <p>1 x Producto ejemplo · 10.00 €</p>
        <hr>
        <p><strong>Total: 10.00 €</strong></p>
        <p style="text-align:center;">${escapar(config.mensaje_ticket || "Gracias por su visita")}</p>
      </div>
    </section>
  `);
}

function stripeDisponible() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

function stripeModo() {
  const key = String(process.env.STRIPE_SECRET_KEY || "");

  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";

  return "no_configurado";
}

function stripeBloqueoLive() {
  const modo = stripeModo();

  if (modo !== "live") return "";

  if (String(process.env.STRIPE_LIVE_CONFIRMADO || "").trim() !== "SI") {
    return "Stripe LIVE está configurado, pero STRIPE_LIVE_CONFIRMADO no es SI.";
  }

  const base = String(process.env.APP_BASE_URL || "").trim();

  if (!base.startsWith("https://")) return "En Stripe LIVE, APP_BASE_URL debe ser https.";
  if (base.includes("localhost")) return "En Stripe LIVE, APP_BASE_URL no puede ser localhost.";
  if (!process.env.STRIPE_WEBHOOK_SECRET) return "En Stripe LIVE, STRIPE_WEBHOOK_SECRET debe estar configurado.";

  return "";
}

function diasRestantes(fecha) {
  if (!fecha) return 0;

  const fin = new Date(fecha).getTime();

  if (!fin) return 0;

  return Math.max(0, Math.ceil((fin - Date.now()) / (1000 * 60 * 60 * 24)));
}

function estadoTexto(config) {
  const estado = String(config.suscripcion_estado || "trial").toLowerCase();

  if (estado === "gratis_vida") return "Gratis de por vida";
  if (estado === "activo") return "Activa";
  if (estado === "trial" || estado === "prueba") return "Prueba gratuita";
  if (estado === "pendiente_pago") return "Pendiente de pago";
  if (estado === "cancelada") return "Cancelada";

  return estado || "No definido";
}

function renderSuscripcion(config, restauranteId, query) {
  const okFiscal = fiscalesCompletos(config);
  const dias = diasRestantes(config.trial_fin);
  const modo = stripeModo();

  return layout("Suscripción", `
    <section class="hero">
      <h1>Suscripción</h1>
      <p>Estado de trial, pago y datos fiscales del restaurante actual.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/configuracion-restaurante">Datos fiscales</a>
      </div>
    </section>

    ${mensaje(query)}
    ${query && query.stripe === "ok" ? `<div class="msg ok">Pago confirmado correctamente.</div>` : ""}
    ${query && query.stripe === "cancelado" ? `<div class="msg error">Pago cancelado.</div>` : ""}

    <section class="card">
      <h2>${escapar(config.nome_ristorante || "Restaurant Service POS")}</h2>
      <div class="grid3">
        <div class="dato"><span>Estado</span><strong>${escapar(estadoTexto(config))}</strong></div>
        <div class="dato"><span>Plan</span><strong>${escapar(config.plan_tipo || "trial")}</strong></div>
        <div class="dato"><span>Días trial</span><strong>${dias}</strong></div>
        <div class="dato"><span>Fin trial</span><strong>${escapar(config.trial_fin || "-")}</strong></div>
        <div class="dato"><span>Restaurante ID</span><strong>${restauranteId}</strong></div>
        <div class="dato"><span>Datos fiscales</span><strong>${okFiscal ? "Completos" : "Incompletos"}</strong></div>
      </div>
    </section>

    <section class="card">
      <h2>Datos fiscales para facturas</h2>
      <div class="msg ${okFiscal ? "ok" : "error"}">
        ${okFiscal ? "El restaurante tiene los datos fiscales completos para facturación." : "Faltan datos fiscales. Antes de pagar la suscripción debes completarlos."}
      </div>

      <div class="grid3">
        <div class="dato"><span>Razón social</span><strong>${escapar(config.razon_social || "-")}</strong></div>
        <div class="dato"><span>NIF/CIF/VAT</span><strong>${escapar(config.partita_iva || "-")}</strong></div>
        <div class="dato"><span>Email facturación</span><strong>${escapar(config.email_facturacion || "-")}</strong></div>
      </div>

      <br>
      <a class="btn sec" href="/configuracion-restaurante">Completar datos fiscales</a>
    </section>

    <section class="card">
      <h2>Pago mensual</h2>
      ${okFiscal
        ? "<p>Los datos fiscales están completos. Ya se puede activar el pago cuando Stripe esté configurado.</p>"
        : "<p><strong>El pago queda bloqueado hasta completar los datos fiscales.</strong></p>"
      }

      <form method="POST" action="/stripe/crear-checkout-suscripcion">
        <button type="submit" ${okFiscal ? "" : "disabled"}>Pagar suscripción</button>
      </form>

      <br>
      <code>Stripe: ${escapar(modo)}
PRICE_ID: ${escapar(process.env.STRIPE_PRICE_ID || "No configurado")}</code>
    </section>
  `);
}

async function guardarRestaurante(db, restauranteId, body) {
  const b = body || {};
  const completo = fiscalesCompletosBody(b) ? 1 : 0;

  await configActual(db, restauranteId);

  await run(
    db,
    `UPDATE configurazione
     SET nome_ristorante=?,
         razon_social=?,
         partita_iva=?,
         indirizzo=?,
         codigo_postal=?,
         ciudad=?,
         provincia=?,
         pais=?,
         email_facturacion=?,
         telefono=?,
         email=?,
         iva=?,
         logo=?,
         mensaje_ticket=?,
         propietario_nombre=?,
         propietario_email=?,
         propietario_telefono=?,
         datos_fiscales_completos=?
     WHERE COALESCE(restaurante_id,1)=?`,
    [
      String(b.nome_ristorante || "").trim(),
      String(b.razon_social || b.nome_ristorante || "").trim(),
      String(b.partita_iva || "").trim(),
      String(b.indirizzo || "").trim(),
      String(b.codigo_postal || "").trim(),
      String(b.ciudad || "").trim(),
      String(b.provincia || "").trim(),
      String(b.pais || "España").trim(),
      String(b.email_facturacion || b.email || "").trim(),
      String(b.telefono || "").trim(),
      String(b.email || "").trim(),
      Number(b.iva || 10),
      String(b.logo || "").trim(),
      String(b.mensaje_ticket || "Gracias por su visita").trim(),
      String(b.propietario_nombre || "").trim(),
      String(b.propietario_email || "").trim(),
      String(b.propietario_telefono || "").trim(),
      completo,
      restauranteId
    ]
  );

  await run(
    db,
    `UPDATE restaurantes
     SET nombre=?,
         razon_social=?,
         nif=?,
         direccion=?,
         codigo_postal=?,
         ciudad=?,
         provincia=?,
         pais=?,
         email_facturacion=?,
         propietario_nombre=?,
         propietario_email=?,
         propietario_telefono=?,
         datos_fiscales_completos=?,
         actualizado_en=datetime('now')
     WHERE id=?`,
    [
      String(b.nome_ristorante || "").trim(),
      String(b.razon_social || b.nome_ristorante || "").trim(),
      String(b.partita_iva || "").trim(),
      String(b.indirizzo || "").trim(),
      String(b.codigo_postal || "").trim(),
      String(b.ciudad || "").trim(),
      String(b.provincia || "").trim(),
      String(b.pais || "España").trim(),
      String(b.email_facturacion || b.email || "").trim(),
      String(b.propietario_nombre || "").trim(),
      String(b.propietario_email || "").trim(),
      String(b.propietario_telefono || "").trim(),
      completo,
      restauranteId
    ]
  );
}

async function activarStripeLocal(db, restauranteId, datos) {
  const now = new Date().toISOString();

  await run(
    db,
    `UPDATE configurazione
     SET suscripcion_estado='activo',
         plan_tipo='stripe_mensual',
         suscripcion_activada_en=COALESCE(suscripcion_activada_en, ?),
         trial_fin=NULL,
         stripe_customer_id=COALESCE(NULLIF(?,''), stripe_customer_id),
         stripe_subscription_id=COALESCE(NULLIF(?,''), stripe_subscription_id),
         stripe_checkout_session_id=COALESCE(NULLIF(?,''), stripe_checkout_session_id),
         ultimo_pago_stripe_en=?
     WHERE COALESCE(restaurante_id,1)=?`,
    [
      now,
      datos.customerId || "",
      datos.subscriptionId || "",
      datos.checkoutSessionId || "",
      now,
      restauranteId
    ]
  );

  await run(
    db,
    `UPDATE restaurantes
     SET estado='activo',
         plan_tipo='stripe_mensual',
         stripe_customer_id=COALESCE(NULLIF(?,''), stripe_customer_id),
         stripe_subscription_id=COALESCE(NULLIF(?,''), stripe_subscription_id),
         actualizado_en=datetime('now')
     WHERE id=?`,
    [
      datos.customerId || "",
      datos.subscriptionId || "",
      restauranteId
    ]
  );
}

module.exports = function fiscalSaasRoutes(db) {
  const router = express.Router();

  router.get("/configuracion-restaurante", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await configActual(db, restauranteId);

    res.send(renderRestaurante(config, req.query || {}));
  });

  router.post("/configuracion-restaurante", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);

    await guardarRestaurante(db, restauranteId, req.body || {});

    res.redirect("/configuracion-restaurante?ok=" + encodeURIComponent("Datos del restaurante guardados correctamente"));
  });

  router.get("/configuracion-restaurante/preview-ticket", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await configActual(db, restauranteId);

    res.send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Vista previa ticket</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;margin:0;padding:30px;}
    .ticket{max-width:360px;margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:18px;padding:18px;color:#111827;}
    .center{text-align:center;}
    img{max-width:170px;max-height:90px;object-fit:contain;margin-bottom:10px;}
    hr{border:0;border-top:1px dashed #9ca3af;margin:12px 0;}
    table{width:100%;border-collapse:collapse;}
    td{padding:4px 0;}
    .total{font-size:20px;font-weight:900;text-align:right;}
    button{margin:18px auto;display:block;border:0;border-radius:12px;padding:11px 14px;background:#111827;color:white;font-weight:900;cursor:pointer;}
    @media print{button{display:none;} body{background:white;padding:0;} .ticket{border:0;}}
  </style>
</head>
<body>
  <button onclick="window.print()">Imprimir prueba</button>
  <div class="ticket">
    <div class="center">
      ${config.logo ? `<img src="${escapar(config.logo)}">` : ""}
      <h2>${escapar(config.nome_ristorante || "Restaurant Service POS")}</h2>
      <div>${escapar(config.razon_social || "")}</div>
      <div>${escapar(config.partita_iva || "")}</div>
      <div>${escapar(config.indirizzo || "")}</div>
      <div>${escapar(config.codigo_postal || "")} ${escapar(config.ciudad || "")}</div>
      <div>${escapar(config.telefono || "")}</div>
      <div>${escapar(config.email || "")}</div>
    </div>
    <hr>
    <div>Mesa: 1</div>
    <div>Fecha: ${new Date().toLocaleString("es-ES")}</div>
    <hr>
    <table>
      <tr><td>1 x Café</td><td style="text-align:right;">1.50 €</td></tr>
      <tr><td>2 x Menú</td><td style="text-align:right;">20.00 €</td></tr>
    </table>
    <hr>
    <div class="total">Total: 21.50 €</div>
    <hr>
    <div class="center">${escapar(config.mensaje_ticket || "Gracias por su visita")}</div>
  </div>
</body>
</html>`);
  });

  router.get("/configuracion-suscripcion", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await configActual(db, restauranteId);

    res.send(renderSuscripcion(config, restauranteId, req.query || {}));
  });

  router.post("/stripe/crear-checkout-suscripcion", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await configActual(db, restauranteId);

    if (!fiscalesCompletos(config)) {
      return res.redirect("/configuracion-restaurante?error=" + encodeURIComponent("Completa los datos fiscales antes de pagar la suscripción"));
    }

    const bloqueo = stripeBloqueoLive();

    if (bloqueo) return res.status(400).send("<pre>" + escapar(bloqueo) + "</pre>");
    if (!stripeDisponible()) return res.status(500).send("Stripe no está configurado. Revisa .env.");

    try {
      const Stripe = require("stripe");
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const baseUrl = String(process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: config.email_facturacion || config.email || config.propietario_email || req.session.usuario.email,
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1
          }
        ],
        metadata: {
          restaurante_id: String(restauranteId),
          razon_social: String(config.razon_social || config.nome_ristorante || ""),
          nif: String(config.partita_iva || "")
        },
        subscription_data: {
          metadata: {
            restaurante_id: String(restauranteId)
          }
        },
        success_url: baseUrl + "/stripe/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: baseUrl + "/configuracion-suscripcion?stripe=cancelado"
      });

      await run(
        db,
        `UPDATE configurazione
         SET stripe_checkout_session_id=?
         WHERE COALESCE(restaurante_id,1)=?`,
        [session.id, restauranteId]
      );

      res.redirect(303, session.url);
    } catch (err) {
      console.error("[fiscalSaas] Stripe checkout:", err.message);
      res.status(500).send("Error creando pago con Stripe: " + err.message);
    }
  });

  router.get("/stripe/success", requiereAdmin, async function(req, res) {
    if (!stripeDisponible()) return res.status(500).send("Stripe no está configurado.");

    try {
      const Stripe = require("stripe");
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const sessionId = String(req.query.session_id || "");

      if (!sessionId) return res.redirect("/configuracion-suscripcion?stripe=sin_session");

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const restauranteId = Number((session.metadata && session.metadata.restaurante_id) || restauranteIdFromReq(req));

      if (session.payment_status === "paid" || session.status === "complete") {
        await activarStripeLocal(db, restauranteId, {
          customerId: String(session.customer || ""),
          subscriptionId: String(session.subscription || ""),
          checkoutSessionId: session.id
        });

        return res.redirect("/configuracion-suscripcion?stripe=ok");
      }

      res.redirect("/configuracion-suscripcion?stripe=pendiente");
    } catch (err) {
      console.error("[fiscalSaas] Stripe success:", err.message);
      res.status(500).send("Error confirmando Stripe: " + err.message);
    }
  });

  return router;
};
