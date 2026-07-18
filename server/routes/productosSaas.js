const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function requiereConfig(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/login");
  }

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol !== "admin" && rol !== "gerente") {
    return res.status(403).send("No tienes permisos para configurar productos.");
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
        console.error("[productosSaas] SQL all:", err.message);
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
        console.error("[productosSaas] SQL get:", err.message);
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
        console.error("[productosSaas] SQL run:", err.message);
        return resolve({ ok: false, error: err.message });
      }

      resolve({ ok: true, id: this.lastID, changes: this.changes });
    });
  });
}

function opcionesDestinosHtml(destinos, seleccionado) {
  return (destinos || []).map((d) => {
    const selected = String(d.id) === String(seleccionado || "cocina") ? "selected" : "";
    return `<option value="${escapar(d.id)}" ${selected}>${escapar(d.nombre)} · ${escapar(d.id)}</option>`;
  }).join("");
}

async function destinosProductoRestaurante(db, restauranteId) {
  const base = [
    { id: "bar", nombre: "Bar" },
    { id: "cocina", nombre: "Cocina" },
    { id: "pizzeria", nombre: "Pizzeria" },
    { id: "general", nombre: "General" }
  ];

  const extras = await all(
    db,
    "SELECT id, nombre FROM destinos_comanda WHERE COALESCE(restaurante_id,1)=? AND COALESCE(activo,1)=1 ORDER BY orden, id",
    [restauranteId]
  );

  const vistos = {};
  const salida = [];

  base.concat(extras || []).forEach((d) => {
    if (!vistos[d.id]) {
      vistos[d.id] = true;
      salida.push(d);
    }
  });

  return salida;
}

function renderPagina(categorias, productos, destinos, query) {
  const ok = query.ok || "";
  const error = query.error || "";

  const opcionesCategorias = categorias.map((cat) => {
    return `<option value="${cat.id}">${escapar(cat.nombre)} · ${escapar(cat.destino || "cocina")}</option>`;
  }).join("");

  const categoriasHtml = categorias.length
    ? categorias.map((cat) => `
      <div class="categoria-card">
        <form method="POST" action="/configuracion-productos/categorias/${cat.id}" class="categoria-form">
          <input name="nombre" value="${escapar(cat.nombre)}" required>
          <select name="destino" required>
${opcionesDestinosHtml(destinos, cat.destino || "cocina")}
          </select>
          <button type="submit">Guardar</button>
        </form>
      </div>
    `).join("")
    : `<p class="empty">Todavía no hay categorías. Crea la primera categoría para empezar.</p>`;

  const productosHtml = productos.length
    ? productos.map((p) => {
      const disponible = Number(p.disponible) === 1;

      return `
        <div class="producto-card ${disponible ? "" : "apagado"}">
          <div class="producto-top">
            <strong>${escapar(p.nombre)}</strong>
            <span>${Number(p.precio || 0).toFixed(2)} €</span>
          </div>

          <small>${escapar(p.categoria || "Sin categoría")} · ${escapar(p.destino || "cocina")}</small>

          <form method="POST" action="/configuracion-productos/productos/${p.id}" class="producto-form">
            <input name="nombre" value="${escapar(p.nombre)}" required>
            <input name="precio" type="number" step="0.01" min="0" value="${Number(p.precio || 0).toFixed(2)}" required>
            <select name="categoria_id" required>
              ${categorias.map((cat) => `<option value="${cat.id}" ${Number(cat.id) === Number(p.categoria_id) ? "selected" : ""}>${escapar(cat.nombre)} · ${escapar(cat.destino || "cocina")}</option>`).join("")}
            </select>
            <label class="check">
              <input type="checkbox" name="requiere_coccion" value="1" ${Number(p.requiere_coccion || 0) === 1 ? "checked" : ""}>
              Punto de cocción
            </label>
            <button type="submit">Guardar producto</button>
          </form>

          <form method="POST" action="/configuracion-productos/productos/${p.id}/disponible">
            <button class="sec" type="submit">${disponible ? "Ocultar producto" : "Activar producto"}</button>
          </form>
        </div>
      `;
    }).join("")
    : `<p class="empty">Todavía no hay productos.</p>`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Productos y precios - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial, Helvetica, sans-serif;}
    .wrap{max-width:1180px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#111827,#166534);color:white;border-radius:26px;padding:28px;margin-bottom:18px;box-shadow:0 18px 42px rgba(15,23,42,.16);}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#dcfce7;line-height:1.5;}
    .hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,.btn,button{display:inline-block;border:0;border-radius:12px;padding:11px 14px;background:#16a34a;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    button.sec,.btn.sec,a.btn.sec{background:#e5e7eb;color:#111827;}
    .msg{border-radius:15px;padding:12px 14px;margin-bottom:14px;font-weight:900;}
    .msg.ok{background:#ecfdf5;color:#14532d;border:1px solid #86efac;}
    .msg.error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;}
    .grid{display:grid;grid-template-columns:380px 1fr;gap:16px;}
    .card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    h2{margin:0 0 14px;font-size:23px;}
    label{display:block;font-weight:900;font-size:13px;margin-bottom:6px;color:#374151;}
    input,select{width:100%;border:1px solid #d1d5db;border-radius:12px;padding:10px;font-size:15px;background:white;}
    .field{margin-bottom:10px;}
    .categoria-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:12px;margin-bottom:10px;}
    .categoria-form{display:grid;grid-template-columns:1fr 120px auto;gap:8px;}
    .productos-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
    .producto-card{background:white;border:1px solid #e5e7eb;border-radius:18px;padding:14px;}
    .producto-card.apagado{opacity:.55;}
    .producto-top{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:6px;}
    .producto-top strong{font-size:18px;}
    .producto-top span{font-weight:900;color:#166534;}
    small{display:block;color:#6b7280;font-weight:800;margin-bottom:10px;}
    .producto-form{display:grid;grid-template-columns:1fr 100px;gap:8px;margin-bottom:8px;}
    .producto-form select,.producto-form .check,.producto-form button{grid-column:1 / -1;}
    .check{display:flex;align-items:center;gap:8px;font-weight:900;}
    .check input{width:auto;}
    .empty{color:#6b7280;text-align:center;padding:18px;}
    @media(max-width:900px){.grid,.productos-grid{grid-template-columns:1fr;}.categoria-form,.producto-form{grid-template-columns:1fr;}}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Productos y precios</h1>
      <p>Crea categorías, productos, precios y destinos. Cada restaurante solo ve su propio menú.</p>
      <div class="hero-actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/primeros-pasos">Primeros pasos</a>
        <a class="btn sec" href="/app/v2">Abrir POS</a>
      </div>
    </section>

    ${ok ? `<div class="msg ok">${escapar(ok)}</div>` : ""}
    ${error ? `<div class="msg error">${escapar(error)}</div>` : ""}

    <section class="grid">
      <div>
        <div class="card">
          <h2>Nueva categoría</h2>
          <form method="POST" action="/configuracion-productos/categorias">
            <div class="field">
              <label>Nombre</label>
              <input name="nombre" placeholder="Bebidas, Carnes, Postres..." required>
            </div>
            <div class="field">
              <label>Destino</label>
              <select name="destino" required>
${opcionesDestinosHtml(destinos, "cocina")}
              </select>
            </div>
            <button type="submit">Crear categoría</button>
          </form>
        </div>

        <div class="card">
          <h2>Categorías</h2>
          ${categoriasHtml}
        </div>
      </div>

      <div>
        <div class="card">
          <h2>Nuevo producto</h2>
          <form method="POST" action="/configuracion-productos/productos">
            <div class="field">
              <label>Nombre producto</label>
              <input name="nombre" placeholder="Coca-Cola, Pizza margarita..." required>
            </div>
            <div class="field">
              <label>Precio</label>
              <input name="precio" type="number" step="0.01" min="0" placeholder="0.00" required>
            </div>
            <div class="field">
              <label>Categoría</label>
              <select name="categoria_id" required>
                ${opcionesCategorias || '<option value="">Primero crea una categoría</option>'}
              </select>
            </div>
            <label class="check">
              <input type="checkbox" name="requiere_coccion" value="1">
              Requiere punto de cocción
            </label>
            <br>
            <button type="submit">Crear producto</button>
          </form>
        </div>

        <div class="card">
          <h2>Productos</h2>
          <div class="productos-grid">
            ${productosHtml}
          </div>
        </div>
      </div>
    </section>
  </main>
</body>
</html>`;
}

module.exports = function productosSaasRoutes(db) {
  const router = express.Router();

  router.get("/admin-productos", (req, res) => res.redirect("/configuracion-productos"));
  router.get("/admin-categorias", (req, res) => res.redirect("/configuracion-productos"));

  router.get("/configuracion-productos", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);

    const destinos = await destinosProductoRestaurante(db, restauranteId);

    const categorias = await all(
      db,
      "SELECT id, nombre, COALESCE(destino,'cocina') AS destino FROM categorias WHERE COALESCE(restaurante_id,1)=? ORDER BY nombre COLLATE NOCASE",
      [restauranteId]
    );

    const productos = await all(
      db,
      `SELECT
        productos.id,
        productos.nombre,
        productos.precio,
        productos.categoria_id,
        COALESCE(productos.disponible,1) AS disponible,
        COALESCE(productos.requiere_coccion,0) AS requiere_coccion,
        categorias.nombre AS categoria,
        COALESCE(categorias.destino,'cocina') AS destino
      FROM productos
      LEFT JOIN categorias
        ON categorias.id = productos.categoria_id
        AND COALESCE(categorias.restaurante_id,1)=?
      WHERE COALESCE(productos.restaurante_id,1)=?
      ORDER BY productos.nombre COLLATE NOCASE`,
      [restauranteId, restauranteId]
    );

    res.send(renderPagina(categorias, productos, destinos, req.query || {}));
  });

  router.post("/configuracion-productos/categorias", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const body = req.body || {};
    const nombre = String(body.nombre || "").trim();
    const destino = String(body.destino || "cocina").trim() || "cocina";

    if (!nombre) {
      return res.redirect("/configuracion-productos?error=" + encodeURIComponent("Nombre de categoría obligatorio"));
    }

    await run(
      db,
      "INSERT INTO categorias(nombre, destino, restaurante_id) VALUES(?, ?, ?)",
      [nombre, destino, restauranteId]
    );

    res.redirect("/configuracion-productos?ok=" + encodeURIComponent("Categoría creada"));
  });

  router.post("/configuracion-productos/categorias/:id", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const body = req.body || {};
    const id = Number(req.params.id || 0);
    const nombre = String(body.nombre || "").trim();
    const destino = String(body.destino || "cocina").trim() || "cocina";

    if (!id || !nombre) {
      return res.redirect("/configuracion-productos?error=" + encodeURIComponent("Datos de categoría incompletos"));
    }

    await run(
      db,
      "UPDATE categorias SET nombre=?, destino=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [nombre, destino, id, restauranteId]
    );

    res.redirect("/configuracion-productos?ok=" + encodeURIComponent("Categoría actualizada"));
  });

  router.post("/configuracion-productos/productos", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const body = req.body || {};
    const nombre = String(body.nombre || "").trim();
    const precio = Number(body.precio || 0);
    const categoriaId = Number(body.categoria_id || 0);
    const requiereCoccion = body.requiere_coccion ? 1 : 0;

    if (!nombre || !categoriaId || Number.isNaN(precio)) {
      return res.redirect("/configuracion-productos?error=" + encodeURIComponent("Faltan datos del producto"));
    }

    const categoria = await get(
      db,
      "SELECT id FROM categorias WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [categoriaId, restauranteId]
    );

    if (!categoria) {
      return res.redirect("/configuracion-productos?error=" + encodeURIComponent("Categoría no encontrada para este restaurante"));
    }

    await run(
      db,
      "INSERT INTO productos(nombre, precio, categoria_id, requiere_coccion, disponible, restaurante_id) VALUES(?, ?, ?, ?, 1, ?)",
      [nombre, precio, categoriaId, requiereCoccion, restauranteId]
    );

    res.redirect("/configuracion-productos?ok=" + encodeURIComponent("Producto creado"));
  });

  router.post("/configuracion-productos/productos/:id", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const body = req.body || {};
    const id = Number(req.params.id || 0);
    const nombre = String(body.nombre || "").trim();
    const precio = Number(body.precio || 0);
    const categoriaId = Number(body.categoria_id || 0);
    const requiereCoccion = body.requiere_coccion ? 1 : 0;

    if (!id || !nombre || !categoriaId || Number.isNaN(precio)) {
      return res.redirect("/configuracion-productos?error=" + encodeURIComponent("Faltan datos del producto"));
    }

    const categoria = await get(
      db,
      "SELECT id FROM categorias WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [categoriaId, restauranteId]
    );

    if (!categoria) {
      return res.redirect("/configuracion-productos?error=" + encodeURIComponent("Categoría no encontrada para este restaurante"));
    }

    await run(
      db,
      "UPDATE productos SET nombre=?, precio=?, categoria_id=?, requiere_coccion=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [nombre, precio, categoriaId, requiereCoccion, id, restauranteId]
    );

    res.redirect("/configuracion-productos?ok=" + encodeURIComponent("Producto actualizado"));
  });

  router.post("/configuracion-productos/productos/:id/disponible", requiereConfig, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = Number(req.params.id || 0);

    const producto = await get(
      db,
      "SELECT COALESCE(disponible,1) AS disponible FROM productos WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [id, restauranteId]
    );

    if (!producto) {
      return res.redirect("/configuracion-productos?error=" + encodeURIComponent("Producto no encontrado"));
    }

    const nuevo = Number(producto.disponible) === 1 ? 0 : 1;

    await run(
      db,
      "UPDATE productos SET disponible=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [nuevo, id, restauranteId]
    );

    res.redirect("/configuracion-productos?ok=" + encodeURIComponent("Estado del producto actualizado"));
  });

  router.get("/menu", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);

    const rows = await all(
      db,
      `SELECT
        categorias.id AS categoria_id,
        categorias.nombre AS categoria,
        COALESCE(categorias.destino,'cocina') AS destino,
        productos.id AS producto_id,
        productos.nombre AS producto,
        productos.precio AS precio,
        COALESCE(productos.requiere_coccion,0) AS requiere_coccion
      FROM productos
      JOIN categorias
        ON categorias.id = productos.categoria_id
        AND COALESCE(categorias.restaurante_id,1)=?
      WHERE COALESCE(productos.restaurante_id,1)=?
      AND COALESCE(productos.disponible,1)=1
      ORDER BY categorias.nombre COLLATE NOCASE, productos.nombre COLLATE NOCASE`,
      [restauranteId, restauranteId]
    );

    res.json(rows);
  });

  router.get("/productos", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);

    const rows = await all(
      db,
      `SELECT
        productos.id,
        productos.nombre,
        productos.precio,
        categorias.nombre AS categoria
      FROM productos
      JOIN categorias
        ON productos.categoria_id = categorias.id
        AND COALESCE(categorias.restaurante_id,1)=?
      WHERE COALESCE(productos.restaurante_id,1)=?
      AND COALESCE(productos.disponible,1)=1
      ORDER BY categorias.id, productos.id`,
      [restauranteId, restauranteId]
    );

    res.json(rows);
  });

  router.get("/producto/:id", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const id = Number(req.params.id || 0);

    const producto = await get(
      db,
      "SELECT * FROM productos WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [id, restauranteId]
    );

    if (!producto) {
      return res.status(404).json({
        ok: false,
        error: "Producto no encontrado para este restaurante"
      });
    }

    const mods = await all(
      db,
      "SELECT * FROM modificadores WHERE producto_id=? ORDER BY tipo, nombre",
      [id]
    );

    producto.modificadores = mods;

    res.json(producto);
  });

  return router;
};
