const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rolActual(req) {
  return req.session && req.session.usuario
    ? String(req.session.usuario.rol || "").toLowerCase()
    : "";
}

function usuarioActualId(req) {
  return req.session && req.session.usuario
    ? Number(req.session.usuario.id || 0)
    : 0;
}

function requiereAdminGerente(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/login");
  }

  const rol = rolActual(req);

  if (rol !== "admin" && rol !== "gerente") {
    return res.status(403).send("No tienes permisos para acceder a esta configuración.");
  }

  return next();
}

function requiereLoginJson(req, res, next) {
  if (req.session && req.session.usuario) return next();

  res.status(401).json({
    ok: false,
    error: "No autenticado"
  });
}

function all(db, sql, params) {
  return new Promise((resolve) => {
    db.all(sql, params || [], function(err, rows) {
      if (err) {
        console.error("[usuariosConfigSaas] SQL all:", err.message);
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
        console.error("[usuariosConfigSaas] SQL get:", err.message);
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
        console.error("[usuariosConfigSaas] SQL run:", err.message);
        return resolve({ ok: false, error: err.message });
      }

      resolve({ ok: true, id: this.lastID, changes: this.changes });
    });
  });
}

async function columnas(db, tabla) {
  const rows = await all(db, "PRAGMA table_info(" + tabla + ")", []);
  return rows.map((r) => r.name);
}

function filtrarColumnas(cols, data) {
  const salida = {};

  Object.keys(data || {}).forEach((k) => {
    if (cols.indexOf(k) >= 0) salida[k] = data[k];
  });

  return salida;
}

async function asegurarConfig(db, restauranteId) {
  let config = await get(
    db,
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=? ORDER BY id DESC LIMIT 1",
    [restauranteId]
  );

  if (config) return config;

  const cols = await columnas(db, "configurazione");
  const data = filtrarColumnas(cols, {
    nome_ristorante: "Restaurant Service POS",
    iva: 10,
    mensaje_ticket: "Gracias por su visita",
    modo_impresion: "preview",
    restaurante_id: restauranteId
  });

  const keys = Object.keys(data);
  const sql = "INSERT INTO configurazione (" + keys.join(",") + ") VALUES (" + keys.map(() => "?").join(",") + ")";
  const creado = await run(db, sql, keys.map((k) => data[k]));

  config = await get(db, "SELECT * FROM configurazione WHERE id=?", [creado.id]);
  return config || {};
}

async function actualizarConfig(db, restauranteId, body) {
  const config = await asegurarConfig(db, restauranteId);
  const cols = await columnas(db, "configurazione");

  const data = filtrarColumnas(cols, {
    nome_ristorante: String(body.nome_ristorante || body.nombre || "").trim() || "Restaurant Service POS",
    partita_iva: String(body.partita_iva || "").trim(),
    indirizzo: String(body.indirizzo || "").trim(),
    telefono: String(body.telefono || "").trim(),
    email: String(body.email || "").trim(),
    logo: String(body.logo || "").trim(),
    iva: Number(body.iva || 10),
    mensaje_ticket: String(body.mensaje_ticket || "Gracias por su visita").trim(),
    propietario_nombre: String(body.propietario_nombre || "").trim(),
    propietario_email: String(body.propietario_email || "").trim(),
    propietario_telefono: String(body.propietario_telefono || "").trim()
  });

  const keys = Object.keys(data);

  if (keys.length) {
    await run(
      db,
      "UPDATE configurazione SET " + keys.map((k) => k + "=?").join(", ") + " WHERE id=? AND COALESCE(restaurante_id,1)=?",
      keys.map((k) => data[k]).concat([config.id, restauranteId])
    );
  }

  const colsRest = await columnas(db, "restaurantes");
  const dataRest = filtrarColumnas(colsRest, {
    nombre: data.nome_ristorante,
    propietario_nombre: data.propietario_nombre,
    propietario_email: data.propietario_email || data.email,
    propietario_telefono: data.propietario_telefono || data.telefono,
    telefono: data.telefono,
    email: data.email
  });

  const keysRest = Object.keys(dataRest);

  if (keysRest.length) {
    await run(
      db,
      "UPDATE restaurantes SET " + keysRest.map((k) => k + "=?").join(", ") + " WHERE id=?",
      keysRest.map((k) => dataRest[k]).concat([restauranteId])
    );
  }
}

async function crearHashPassword(passwordPlano) {
  const password = String(passwordPlano || "");

  try {
    const utils = require("../utils/passwords");
    const nombres = [
      "hashPassword",
      "crearHashPassword",
      "generarHashPassword",
      "hashPasswordSeguro",
      "hashearPassword",
      "hash"
    ];

    for (const nombre of nombres) {
      if (typeof utils[nombre] === "function") {
        return await utils[nombre](password);
      }
    }
  } catch (err) {
    // fallback abajo
  }

  try {
    const bcryptjs = require("bcryptjs");
    return bcryptjs.hashSync(password, 10);
  } catch (err) {
    // fallback abajo
  }

  try {
    const bcrypt = require("bcrypt");
    return await bcrypt.hash(password, 10);
  } catch (err) {
    throw new Error("No se pudo preparar la contraseña.");
  }
}

function rolesDisponibles() {
  return [
    { id: "admin", nombre: "Administrador" },
    { id: "gerente", nombre: "Gerente" },
    { id: "camarero", nombre: "Camarero" },
    { id: "cocina", nombre: "Cocina" },
    { id: "bar", nombre: "Bar" }
  ];
}

function rolValido(rol) {
  return rolesDisponibles().some((r) => r.id === String(rol || "").toLowerCase());
}

function renderLayout(titulo, contenido) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)} - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;}
    .wrap{max-width:1180px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#111827,#0f766e);color:white;border-radius:26px;padding:28px;margin-bottom:18px;box-shadow:0 18px 42px rgba(15,23,42,.16);}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#ccfbf1;line-height:1.5;}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,button{display:inline-block;border:0;border-radius:12px;padding:11px 14px;background:#0f766e;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    a.sec,button.sec{background:#e5e7eb;color:#111827;}
    a.danger,button.danger{background:#dc2626;color:white;}
    .msg{border-radius:15px;padding:12px 14px;margin-bottom:14px;font-weight:900;}
    .ok{background:#ecfdf5;color:#14532d;border:1px solid #86efac;}
    .error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
    .card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}
    .cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;}
    .dash-card{display:block;background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;text-decoration:none;color:#111827;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    .dash-card strong{display:block;font-size:20px;margin-bottom:8px;}
    .dash-card span{display:block;color:#6b7280;line-height:1.4;}
    label{display:block;font-weight:900;font-size:13px;margin:0 0 6px;color:#374151;}
    input,select,textarea{width:100%;border:1px solid #d1d5db;border-radius:12px;padding:10px;font-size:15px;background:white;}
    textarea{min-height:78px;}
    table{width:100%;border-collapse:collapse;}
    th,td{padding:11px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top;}
    th{font-size:12px;text-transform:uppercase;color:#6b7280;}
    form.inline{display:inline-block;margin:0 4px 4px 0;}
    small{display:block;color:#6b7280;font-weight:800;margin-top:4px;}
    .badge{display:inline-block;padding:5px 9px;border-radius:999px;background:#e0f2fe;color:#075985;font-weight:900;font-size:12px;}
    .badge.off{background:#fee2e2;color:#991b1b;}
    @media(max-width:900px){.grid,.cards{grid-template-columns:1fr;} table,thead,tbody,tr,td,th{display:block;} th{display:none;}}
  </style>
</head>
<body>
  <a class="rs-logout-global" href="/logout" style="position:fixed;right:16px;top:12px;z-index:9999;background:#111827;color:white;text-decoration:none;font-weight:900;border-radius:999px;padding:10px 13px;font-size:13px;box-shadow:0 10px 24px rgba(0,0,0,.18);">Cerrar sesión</a>
  <main class="wrap">
    ${contenido}
  </main>
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

function mensajeHtml(query) {
  const ok = query && query.ok ? `<div class="msg ok">${escapar(query.ok)}</div>` : "";
  const error = query && query.error ? `<div class="msg error">${escapar(query.error)}</div>` : "";
  return ok + error;
}

function renderPrincipal(config, req) {
  const rol = rolActual(req);
  const cards = [
    ["Restaurante", "/configuracion-restaurante", "Datos fiscales, teléfono, IVA y mensaje del ticket."],
    ["Productos", "/configuracion-productos", "Categorías, platos, precios y destinos de comanda."],
    ["Mesas y salas", "/configuracion-mesas", "Zonas, mesas y visibilidad de sala."],
    ["Usuarios", "/configuracion-usuarios", "Camareros, gerentes y accesos del restaurante."],
    ["Impresión", "/configuracion-impresoras", "Ticket, bar, cocina y destinos personalizados."],
    ["Caja", "/configuracion-caja", "Pagos, cierre diario y cierre mensual."],
    ["Reportes", "/configuracion-reportes", "Exportaciones CSV del restaurante."],
    ["Primeros pasos", "/primeros-pasos", "Guía rápida para dejar el restaurante listo."],
    ["Manual", "/manual", "Ayuda de uso para el cliente."]
  ];

  if (rol === "admin") {
    cards.push(["Suscripción", "/configuracion-suscripcion", "Plan, trial y estado de pago."]);
  }

  const cardsHtml = cards.map((c) => `
    <a class="dash-card" href="${escapar(c[1])}">
      <strong>${escapar(c[0])}</strong>
      <span>${escapar(c[2])}</span>
    </a>
  `).join("");

  return renderLayout("Configuración", `
    <section class="hero">
      <h1>Configuración</h1>
      <p>${escapar(config.nome_ristorante || "Restaurant Service POS")} · Gestión del restaurante actual.</p>
      <div class="actions">
        <a class="btn sec" href="/app/v2">Abrir POS</a>
        <a class="btn sec" href="/camarero">POS camarero</a>
      </div>
    </section>
    <section class="cards">${cardsHtml}</section>
  `);
}

function opcionesRolHtml(actual) {
  return rolesDisponibles().map((r) => `
    <option value="${escapar(r.id)}" ${String(actual || "") === r.id ? "selected" : ""}>${escapar(r.nombre)}</option>
  `).join("");
}

function renderUsuarios(usuarios, query, req) {
  const actualId = usuarioActualId(req);

  const filas = usuarios.map((u) => `
    <tr>
      <td>
        <strong>${escapar(u.nombre)}</strong>
        <small>${escapar(u.email)}</small>
      </td>
      <td><span class="badge">${escapar(u.rol)}</span></td>
      <td>${Number(u.activo) === 1 ? `<span class="badge">Activo</span>` : `<span class="badge off">Desactivado</span>`}</td>
      <td>
        <form method="POST" action="/configuracion-usuarios/usuarios/${u.id}" class="card">
          <div class="grid">
            <div>
              <label>Nombre</label>
              <input name="nombre" value="${escapar(u.nombre)}" required>
            </div>
            <div>
              <label>Email</label>
              <input type="email" name="email" value="${escapar(u.email)}" required>
            </div>
            <div>
              <label>Rol</label>
              <select name="rol">${opcionesRolHtml(u.rol)}</select>
            </div>
            <div>
              <label>Nueva contraseña</label>
              <input type="password" name="password" placeholder="Dejar vacío para no cambiar">
            </div>
          </div>
          <br>
          <button type="submit">Guardar</button>
        </form>

        <form class="inline" method="POST" action="/configuracion-usuarios/usuarios/${u.id}/toggle">
          <button type="submit" class="sec">${Number(u.activo) === 1 ? "Desactivar" : "Activar"}</button>
        </form>

        ${Number(u.id) !== Number(actualId) ? `
          <form class="inline" method="POST" action="/configuracion-usuarios/usuarios/${u.id}/eliminar" onsubmit="return confirm('¿Eliminar este usuario?');">
            <button type="submit" class="danger">Eliminar</button>
          </form>
        ` : `<small>No puedes eliminar tu propio usuario.</small>`}
      </td>
    </tr>
  `).join("");

  return renderLayout("Usuarios", `
    <section class="hero">
      <h1>Usuarios</h1>
      <p>Crea y gestiona usuarios solo para este restaurante.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/app/v2">Abrir POS</a>
      </div>
    </section>

    ${mensajeHtml(query)}

    <section class="card">
      <h2>Crear usuario</h2>
      <form method="POST" action="/configuracion-usuarios/usuarios">
        <div class="grid">
          <div>
            <label>Nombre</label>
            <input name="nombre" required>
          </div>
          <div>
            <label>Email</label>
            <input type="email" name="email" required>
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" name="password" required>
          </div>
          <div>
            <label>Rol</label>
            <select name="rol">${opcionesRolHtml("camarero")}</select>
          </div>
        </div>
        <br>
        <button type="submit">Crear usuario</button>
      </form>
    </section>

    <section class="card">
      <h2>Usuarios del restaurante</h2>
      <table>
        <thead>
          <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Editar</th></tr>
        </thead>
        <tbody>${filas || `<tr><td colspan="4">No hay usuarios todavía.</td></tr>`}</tbody>
      </table>
    </section>
  `);
}

function renderRestaurante(config, query) {
  return renderLayout("Datos del restaurante", `
    <section class="hero">
      <h1>Datos del restaurante</h1>
      <p>Información general, fiscal y de ticket solo del restaurante actual.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/configuracion-impresoras">Impresión</a>
      </div>
    </section>

    ${mensajeHtml(query)}

    <section class="card">
      <form method="POST" action="/configuracion-restaurante">
        <div class="grid">
          <div>
            <label>Nombre restaurante</label>
            <input name="nome_ristorante" value="${escapar(config.nome_ristorante || "")}" required>
          </div>
          <div>
            <label>NIF / CIF / Partita IVA</label>
            <input name="partita_iva" value="${escapar(config.partita_iva || "")}">
          </div>
          <div>
            <label>Teléfono</label>
            <input name="telefono" value="${escapar(config.telefono || "")}">
          </div>
          <div>
            <label>Email del restaurante</label>
            <input type="email" name="email" value="${escapar(config.email || "")}">
          </div>
          <div>
            <label>Logo ticket</label>
            <input type="hidden" id="logo" name="logo" value="${escapar(config.logo || "")}">
            <input type="file" id="logo_archivo" accept="image/*">
            <small>Haz clic para elegir una imagen del ordenador. Se guardará optimizada para el ticket.</small>
            <div style="margin-top:10px;">
              <img id="logo_preview" src="${escapar(config.logo || "")}" style="${config.logo ? "" : "display:none;"}max-width:170px;max-height:90px;object-fit:contain;border:1px solid #e5e7eb;border-radius:12px;padding:8px;background:white;">
            </div>
          </div>
          <div>
            <label>IVA por defecto (%)</label>
            <input type="number" step="0.01" name="iva" value="${escapar(config.iva || 10)}">
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
        </div>

        <br>

        <label>Dirección</label>
        <input name="indirizzo" value="${escapar(config.indirizzo || "")}">

        <br><br>

        <label>Mensaje del ticket</label>
        <textarea name="mensaje_ticket">${escapar(config.mensaje_ticket || "Gracias por su visita")}</textarea>

        <br><br>

        <button type="submit">Guardar restaurante</button>
        <a class="btn sec" target="_blank" href="/configuracion-restaurante/preview-ticket">Vista previa del ticket</a>
      </form>
    </section>

    <section class="card">
      <h2>Vista previa rápida del ticket</h2>
      <div style="max-width:360px;border:1px dashed #9ca3af;border-radius:16px;padding:16px;background:#fff;">
        ${config.logo ? `<div style="text-align:center;margin-bottom:10px;"><img src="${escapar(config.logo)}" style="max-width:160px;max-height:80px;object-fit:contain;"></div>` : ""}
        <div style="text-align:center;">
          <strong>${escapar(config.nome_ristorante || "Restaurant Service POS")}</strong><br>
          <small>${escapar(config.partita_iva || "")}</small><br>
          <small>${escapar(config.indirizzo || "")}</small><br>
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

async function usuariosRestaurante(db, restauranteId) {
  return all(
    db,
    `SELECT id, nombre, email, rol, activo, creado_en, restaurante_id
     FROM usuarios
     WHERE COALESCE(restaurante_id,1)=?
     ORDER BY activo DESC, rol, nombre COLLATE NOCASE`,
    [restauranteId]
  );
}

async function existeEmailGlobal(db, email, excluirId) {
  const params = [String(email || "").trim().toLowerCase()];

  let sql = "SELECT id FROM usuarios WHERE LOWER(email)=LOWER(?)";

  if (excluirId) {
    sql += " AND id!=?";
    params.push(Number(excluirId));
  }

  sql += " LIMIT 1";

  return get(db, sql, params);
}

async function usuarioPropio(db, restauranteId, usuarioId) {
  return get(
    db,
    `SELECT id, nombre, email, rol, activo, restaurante_id
     FROM usuarios
     WHERE id=?
     AND COALESCE(restaurante_id,1)=?
     LIMIT 1`,
    [usuarioId, restauranteId]
  );
}

async function quedanAdminsActivos(db, restauranteId, excluirUsuarioId) {
  const row = await get(
    db,
    `SELECT COUNT(*) AS total
     FROM usuarios
     WHERE COALESCE(restaurante_id,1)=?
     AND activo=1
     AND rol IN ('admin','gerente')
     AND id!=?`,
    [restauranteId, excluirUsuarioId || 0]
  );

  return Number(row && row.total ? row.total : 0) > 0;
}

module.exports = function usuariosConfigSaasRoutes(db) {
  const router = express.Router();

  router.get("/logout", function(req, res) {
    if (!req.session) return res.redirect("/login");
    req.session.destroy(function() {
      res.redirect("/login");
    });
  });

  router.post("/logout", function(req, res) {
    if (!req.session) return res.redirect("/login");
    req.session.destroy(function() {
      res.redirect("/login");
    });
  });

  router.get("/cerrar-sesion", function(req, res) {
    if (!req.session) return res.redirect("/login");
    req.session.destroy(function() {
      res.redirect("/login");
    });
  });


  router.get("/usuario-actual", requiereLoginJson, function(req, res) {
    const usuario = req.session.usuario || {};
    const restauranteId = restauranteIdFromReq(req);

    res.json({
      ok: true,
      autenticado: true,
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      restaurante_id: restauranteId,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        restaurante_id: restauranteId
      }
    });
  });

  router.get("/configuracion", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await asegurarConfig(db, restauranteId);

    res.send(renderPrincipal(config, req));
  });

  router.get("/configurazione", requiereAdminGerente, function(req, res) {
    res.redirect("/configuracion-restaurante");
  });

  router.get("/configuracion-restaurante", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await asegurarConfig(db, restauranteId);

    res.send(renderRestaurante(config, req.query || {}));
  });

  router.get("/configuracion-restaurante/preview-ticket", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await asegurarConfig(db, restauranteId);

    const html = `<!doctype html>
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
      <div>${escapar(config.partita_iva || "")}</div>
      <div>${escapar(config.indirizzo || "")}</div>
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
</html>`;

    res.send(html);
  });

  router.post("/configuracion-restaurante", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);

    await actualizarConfig(db, restauranteId, req.body || {});

    res.redirect("/configuracion-restaurante?ok=" + encodeURIComponent("Datos del restaurante guardados correctamente"));
  });

  router.post("/configurazione", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);

    await actualizarConfig(db, restauranteId, req.body || {});

    res.redirect("/configuracion-restaurante?ok=" + encodeURIComponent("Datos del restaurante guardados correctamente"));
  });

  router.get("/admin-usuarios", requiereAdminGerente, function(req, res) {
    res.redirect("/configuracion-usuarios");
  });

  router.get("/admin/usuarios", requiereAdminGerente, function(req, res) {
    res.redirect("/configuracion-usuarios");
  });

  router.get("/configuracion-usuarios", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const usuarios = await usuariosRestaurante(db, restauranteId);

    res.send(renderUsuarios(usuarios, req.query || {}, req));
  });

  router.post("/configuracion-usuarios/usuarios", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const body = req.body || {};
    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const rol = String(body.rol || "camarero").toLowerCase();

    if (!nombre || !email || !password || !rolValido(rol)) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Faltan datos obligatorios"));
    }

    const existe = await existeEmailGlobal(db, email, 0);

    if (existe) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Ya existe un usuario con ese email"));
    }

    let hash;

    try {
      hash = await crearHashPassword(password);
    } catch (err) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent(err.message));
    }

    await run(
      db,
      `INSERT INTO usuarios (nombre, email, password, rol, activo, restaurante_id)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [nombre, email, hash, rol, restauranteId]
    );

    res.redirect("/configuracion-usuarios?ok=" + encodeURIComponent("Usuario creado correctamente"));
  });

  router.post("/configuracion-usuarios/usuarios/:id", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = Number(req.params.id || 0);
    const body = req.body || {};
    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const rol = String(body.rol || "camarero").toLowerCase();

    if (!id || !nombre || !email || !rolValido(rol)) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Faltan datos obligatorios"));
    }

    const usuario = await usuarioPropio(db, restauranteId, id);

    if (!usuario) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Usuario no encontrado para este restaurante"));
    }

    const existe = await existeEmailGlobal(db, email, id);

    if (existe) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Ya existe otro usuario con ese email"));
    }

    if (usuario.activo === 1 && (usuario.rol === "admin" || usuario.rol === "gerente") && rol !== "admin" && rol !== "gerente") {
      const quedaOtro = await quedanAdminsActivos(db, restauranteId, id);

      if (!quedaOtro) {
        return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Debe quedar al menos un admin o gerente activo"));
      }
    }

    if (password) {
      let hash;

      try {
        hash = await crearHashPassword(password);
      } catch (err) {
        return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent(err.message));
      }

      await run(
        db,
        `UPDATE usuarios
         SET nombre=?, email=?, password=?, rol=?
         WHERE id=?
         AND COALESCE(restaurante_id,1)=?`,
        [nombre, email, hash, rol, id, restauranteId]
      );
    } else {
      await run(
        db,
        `UPDATE usuarios
         SET nombre=?, email=?, rol=?
         WHERE id=?
         AND COALESCE(restaurante_id,1)=?`,
        [nombre, email, rol, id, restauranteId]
      );
    }

    if (Number(id) === usuarioActualId(req)) {
      req.session.usuario.nombre = nombre;
      req.session.usuario.email = email;
      req.session.usuario.rol = rol;
      req.session.usuario.restaurante_id = restauranteId;
      req.session.restaurante_id = restauranteId;
    }

    res.redirect("/configuracion-usuarios?ok=" + encodeURIComponent("Usuario actualizado correctamente"));
  });

  router.post("/configuracion-usuarios/usuarios/:id/toggle", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = Number(req.params.id || 0);

    const usuario = await usuarioPropio(db, restauranteId, id);

    if (!usuario) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Usuario no encontrado"));
    }

    if (Number(id) === usuarioActualId(req)) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("No puedes desactivar tu propio usuario mientras estás dentro"));
    }

    if (Number(usuario.activo) === 1 && (usuario.rol === "admin" || usuario.rol === "gerente")) {
      const quedaOtro = await quedanAdminsActivos(db, restauranteId, id);

      if (!quedaOtro) {
        return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Debe quedar al menos un admin o gerente activo"));
      }
    }

    const nuevoEstado = Number(usuario.activo) === 1 ? 0 : 1;

    await run(
      db,
      `UPDATE usuarios
       SET activo=?
       WHERE id=?
       AND COALESCE(restaurante_id,1)=?`,
      [nuevoEstado, id, restauranteId]
    );

    res.redirect("/configuracion-usuarios?ok=" + encodeURIComponent("Estado del usuario actualizado correctamente"));
  });

  router.post("/configuracion-usuarios/usuarios/:id/eliminar", requiereAdminGerente, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = Number(req.params.id || 0);

    const usuario = await usuarioPropio(db, restauranteId, id);

    if (!usuario) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Usuario no encontrado"));
    }

    if (Number(id) === usuarioActualId(req)) {
      return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("No puedes eliminar tu propio usuario mientras estás dentro"));
    }

    if (Number(usuario.activo) === 1 && (usuario.rol === "admin" || usuario.rol === "gerente")) {
      const quedaOtro = await quedanAdminsActivos(db, restauranteId, id);

      if (!quedaOtro) {
        return res.redirect("/configuracion-usuarios?error=" + encodeURIComponent("Debe quedar al menos un admin o gerente activo"));
      }
    }

    await run(
      db,
      `DELETE FROM usuarios
       WHERE id=?
       AND COALESCE(restaurante_id,1)=?`,
      [id, restauranteId]
    );

    res.redirect("/configuracion-usuarios?ok=" + encodeURIComponent("Usuario eliminado definitivamente"));
  });

  return router;
};
