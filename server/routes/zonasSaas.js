const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function requiereAdmin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/login");
  }

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol !== "admin" && rol !== "gerente") {
    return res.status(403).send("No tienes permisos para configurar mesas.");
  }

  return next();
}

function all(db, sql, params) {
  return new Promise((resolve) => {
    db.all(sql, params || [], function(err, rows) {
      if (err) {
        console.error("[zonasSaas] SQL all:", err.message);
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
        console.error("[zonasSaas] SQL get:", err.message);
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
        console.error("[zonasSaas] SQL run:", err.message);
        return resolve({ ok: false, error: err.message });
      }

      resolve({ ok: true, id: this.lastID, changes: this.changes });
    });
  });
}

function renderPage(zonas, mesas, query) {
  const ok = query.ok || "";
  const error = query.error || "";

  const opcionesZonas = zonas
    .filter((z) => Number(z.activo) === 1)
    .map((z) => `<option value="${z.id}">${escapar(z.nombre)}</option>`)
    .join("");

  const zonasHtml = zonas.length
    ? zonas.map((z) => {
      const mesasZona = mesas.filter((m) => Number(m.zona_id) === Number(z.id));

      const mesasHtml = mesasZona.length
        ? mesasZona.map((m) => `
          <div class="mesa-card ${Number(m.activo) === 1 ? "" : "apagada"}">
            <form method="POST" action="/configuracion-mesas/mesas/${m.id}" class="mesa-form">
              <input name="numero" value="${escapar(m.numero)}" required>
              <select name="zona_id" required>
                ${zonas.map((zz) => `<option value="${zz.id}" ${Number(zz.id) === Number(m.zona_id) ? "selected" : ""}>${escapar(zz.nombre)}</option>`).join("")}
              </select>
              <button type="submit">Guardar</button>
            </form>

            <form method="POST" action="/configuracion-mesas/mesas/${m.id}/toggle">
              <button class="sec" type="submit">${Number(m.activo) === 1 ? "Ocultar" : "Activar"}</button>
            </form>

            <small>Estado: ${escapar(m.estado)}</small>
          </div>
        `).join("")
        : `<div class="empty">Esta sala todavía no tiene mesas.</div>`;

      return `
        <section class="zona-card ${Number(z.activo) === 1 ? "" : "apagada"}">
          <div class="zona-head">
            <form method="POST" action="/configuracion-mesas/zonas/${z.id}" class="zona-form">
              <input name="nombre" value="${escapar(z.nombre)}" required>
              <button type="submit">Guardar sala</button>
            </form>

            <form method="POST" action="/configuracion-mesas/zonas/${z.id}/toggle">
              <button class="sec" type="submit">${Number(z.activo) === 1 ? "Ocultar sala" : "Activar sala"}</button>
            </form>
          </div>

          <div class="mesas-grid">
            ${mesasHtml}
          </div>
        </section>
      `;
    }).join("")
    : `<section class="card"><p class="empty">Todavía no hay salas. Crea la primera sala para empezar.</p></section>`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Configuración de mesas - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial, Helvetica, sans-serif;}
    .wrap{max-width:1120px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#0f172a,#1e3a8a);color:white;border-radius:26px;padding:28px;margin-bottom:18px;box-shadow:0 18px 42px rgba(15,23,42,.16);}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#dbeafe;line-height:1.5;}
    .hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,.btn,button{display:inline-block;border:0;border-radius:12px;padding:11px 14px;background:#2563eb;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    button.sec,.btn.sec,a.btn.sec{background:#e5e7eb;color:#111827;}
    .msg{border-radius:15px;padding:12px 14px;margin-bottom:14px;font-weight:900;}
    .msg.ok{background:#ecfdf5;color:#14532d;border:1px solid #86efac;}
    .msg.error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
    .card,.zona-card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    .zona-card.apagada,.mesa-card.apagada{opacity:.55;}
    h2{margin:0 0 14px;font-size:23px;}
    .forms{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:16px;}
    .form-box{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:18px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    label{display:block;font-weight:900;font-size:13px;margin-bottom:6px;color:#374151;}
    input,select{width:100%;border:1px solid #d1d5db;border-radius:12px;padding:10px;font-size:15px;background:white;}
    .line{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;}
    .zona-head{display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap;align-items:center;margin-bottom:14px;}
    .zona-form{display:flex;gap:10px;flex:1;min-width:260px;}
    .mesas-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
    .mesa-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:13px;}
    .mesa-form{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;}
    small{color:#6b7280;font-weight:800;}
    .empty{color:#6b7280;text-align:center;padding:18px;}
    @media(max-width:850px){.forms,.mesas-grid{grid-template-columns:1fr;}.mesa-form,.zona-form,.line{grid-template-columns:1fr;display:grid;}}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Configuración de salas y mesas</h1>
      <p>Crea las salas, zonas y mesas de este restaurante. Cada restaurante solo ve sus propias mesas.</p>
      <div class="hero-actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/primeros-pasos">Primeros pasos</a>
        <a class="btn sec" href="/app/v2">Abrir POS</a>
      </div>
    </section>

    ${ok ? `<div class="msg ok">${escapar(ok)}</div>` : ""}
    ${error ? `<div class="msg error">${escapar(error)}</div>` : ""}

    <section class="forms">
      <div class="form-box">
        <h2>Nueva sala/zona</h2>
        <form method="POST" action="/configuracion-mesas/zonas">
          <label>Nombre</label>
          <div class="line">
            <input name="nombre" placeholder="Sala principal, Terraza, Barra..." required>
            <button type="submit">Crear sala</button>
          </div>
        </form>
      </div>

      <div class="form-box">
        <h2>Nueva mesa</h2>
        <form method="POST" action="/configuracion-mesas/mesas">
          <label>Número o nombre</label>
          <input name="numero" placeholder="1, 2, VIP..." required style="margin-bottom:10px;">
          <label>Sala/zona</label>
          <select name="zona_id" required style="margin-bottom:10px;">
            ${opcionesZonas || '<option value="">Primero crea una sala</option>'}
          </select>
          <button type="submit">Crear mesa</button>
        </form>
      </div>
    </section>

    ${zonasHtml}
  </main>
</body>
</html>`;
}

module.exports = function zonasSaasRoutes(db) {
  const router = express.Router();

  router.get("/configuracion-mesas", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);

    const zonas = await all(
      db,
      "SELECT id, nombre, activo FROM zonas WHERE COALESCE(restaurante_id,1)=? ORDER BY activo DESC, id",
      [restauranteId]
    );

    const mesas = await all(
      db,
      `SELECT
        mesas.id,
        mesas.numero,
        mesas.estado,
        mesas.zona_id,
        mesas.activo
      FROM mesas
      LEFT JOIN zonas ON zonas.id = mesas.zona_id
      WHERE COALESCE(mesas.restaurante_id,1)=?
      ORDER BY COALESCE(zonas.id, 999999), mesas.numero`,
      [restauranteId]
    );

    res.send(renderPage(zonas, mesas, req.query || {}));
  });

  router.post("/configuracion-mesas/zonas", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const nombre = String((req.body || {}).nombre || "").trim();

    if (!nombre) {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Nombre de sala obligatorio"));
    }

    await run(
      db,
      "INSERT INTO zonas(nombre, activo, restaurante_id) VALUES(?, 1, ?)",
      [nombre, restauranteId]
    );

    res.redirect("/configuracion-mesas?ok=" + encodeURIComponent("Sala creada correctamente"));
  });

  router.post("/configuracion-mesas/zonas/:id", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = Number(req.params.id || 0);
    const nombre = String((req.body || {}).nombre || "").trim();

    if (!id || !nombre) {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Datos de sala incompletos"));
    }

    await run(
      db,
      "UPDATE zonas SET nombre=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [nombre, id, restauranteId]
    );

    res.redirect("/configuracion-mesas?ok=" + encodeURIComponent("Sala actualizada correctamente"));
  });

  router.post("/configuracion-mesas/zonas/:id/toggle", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = Number(req.params.id || 0);

    const zona = await get(
      db,
      "SELECT activo FROM zonas WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [id, restauranteId]
    );

    if (!zona) {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Sala no encontrada"));
    }

    const nuevo = Number(zona.activo) === 1 ? 0 : 1;

    if (nuevo === 0) {
      const ocupadas = await get(
        db,
        `SELECT COUNT(*) AS n
         FROM mesas
         WHERE zona_id=?
         AND COALESCE(restaurante_id,1)=?
         AND estado IN ('ocupada','reservada','cuenta')`,
        [id, restauranteId]
      );

      if (ocupadas && Number(ocupadas.n || 0) > 0) {
        return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("No puedes ocultar una sala con mesas ocupadas, reservadas o en cuenta"));
      }
    }

    await run(
      db,
      "UPDATE zonas SET activo=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [nuevo, id, restauranteId]
    );

    res.redirect("/configuracion-mesas?ok=" + encodeURIComponent("Sala actualizada correctamente"));
  });

  router.post("/configuracion-mesas/mesas", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const numero = String((req.body || {}).numero || "").trim();
    const zonaId = Number((req.body || {}).zona_id || 0);

    if (!numero || !zonaId) {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Datos de mesa incompletos"));
    }

    const zona = await get(
      db,
      "SELECT id FROM zonas WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [zonaId, restauranteId]
    );

    if (!zona) {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Sala no encontrada para este restaurante"));
    }

    await run(
      db,
      "INSERT INTO mesas(numero, estado, zona_id, activo, restaurante_id) VALUES(?, 'libre', ?, 1, ?)",
      [numero, zonaId, restauranteId]
    );

    res.redirect("/configuracion-mesas?ok=" + encodeURIComponent("Mesa creada correctamente"));
  });

  router.post("/configuracion-mesas/mesas/:id", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = Number(req.params.id || 0);
    const numero = String((req.body || {}).numero || "").trim();
    const zonaId = Number((req.body || {}).zona_id || 0);

    if (!id || !numero || !zonaId) {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Datos de mesa incompletos"));
    }

    const zona = await get(
      db,
      "SELECT id FROM zonas WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [zonaId, restauranteId]
    );

    if (!zona) {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Sala no encontrada para este restaurante"));
    }

    const mesa = await get(
      db,
      "SELECT id FROM mesas WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [id, restauranteId]
    );

    if (!mesa) {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Mesa no encontrada"));
    }

    await run(
      db,
      "UPDATE mesas SET numero=?, zona_id=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [numero, zonaId, id, restauranteId]
    );

    res.redirect("/configuracion-mesas?ok=" + encodeURIComponent("Mesa actualizada correctamente"));
  });

  router.post("/configuracion-mesas/mesas/:id/toggle", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = Number(req.params.id || 0);

    const mesa = await get(
      db,
      "SELECT estado, COALESCE(activo,1) AS activo FROM mesas WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [id, restauranteId]
    );

    if (!mesa) {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Mesa no encontrada"));
    }

    if (Number(mesa.activo) === 1 && String(mesa.estado) !== "libre") {
      return res.redirect("/configuracion-mesas?error=" + encodeURIComponent("Solo puedes ocultar mesas libres"));
    }

    const nuevo = Number(mesa.activo) === 1 ? 0 : 1;

    await run(
      db,
      "UPDATE mesas SET activo=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [nuevo, id, restauranteId]
    );

    res.redirect("/configuracion-mesas?ok=" + encodeURIComponent("Visibilidad de mesa actualizada correctamente"));
  });

  return router;
};
