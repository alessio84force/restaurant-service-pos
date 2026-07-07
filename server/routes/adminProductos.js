const express = require("express");

function escapar(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function requiereConfig(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/login");
  }

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol !== "admin" && rol !== "gerente") {
    return res.status(403).send("Acceso denegado");
  }

  next();
}

function numeroPrecio(valor) {
  const n = Number(String(valor || "0").replace(",", "."));
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function renderPagina(categorias, productos, mensaje) {
  const opcionesCategorias = categorias.map((cat) => {
    return '<option value="' + cat.id + '">' + escapar(cat.nombre) + ' · ' + escapar(cat.destino || "sin destino") + '</option>';
  }).join("");

  const productosHtml = productos.map((p) => {
    const disponible = Number(p.disponible) === 1;
    const estadoTexto = disponible ? "Visible" : "Oculto";
    const estadoClase = disponible ? "visible" : "oculto";
    const categoriaNombre = p.categoria_nombre || "Sin categoría";
    const destino = p.destino || "sin destino";
    const busqueda = [
      p.nombre,
      categoriaNombre,
      destino,
      p.precio,
      estadoTexto
    ].join(" ").toLowerCase();

    return `
<div class="producto-card" data-search="${escapar(busqueda)}">
  <div class="producto-top">
    <div>
      <h3>${escapar(p.nombre)}</h3>
      <div class="meta">${escapar(categoriaNombre)} · ${escapar(destino)}</div>
    </div>
    <div class="precio">${Number(p.precio || 0).toFixed(2)} €</div>
  </div>

  <div class="estado ${estadoClase}">${estadoTexto}</div>

  <form class="form-editar" method="POST" action="/configuracion-productos/productos/${p.id}">
    <div class="grid-form">
      <div>
        <label>Nombre</label>
        <input name="nombre" value="${escapar(p.nombre)}" required>
      </div>

      <div>
        <label>Precio</label>
        <input name="precio" type="number" step="0.01" min="0" value="${Number(p.precio || 0).toFixed(2)}" required>
      </div>

      <div class="full">
        <label>Categoría</label>
        <select name="categoria_id" required>
          ${categorias.map((cat) => `
          <option value="${cat.id}" ${Number(cat.id) === Number(p.categoria_id) ? "selected" : ""}>
            ${escapar(cat.nombre)} · ${escapar(cat.destino || "sin destino")}
          </option>
          `).join("")}
        </select>
      </div>
    </div>

    <button class="btn guardar" type="submit">Guardar cambios</button>
  </form>

  <form method="POST" action="/configuracion-productos/productos/${p.id}/disponible">
    <input type="hidden" name="disponible" value="${disponible ? 0 : 1}">
    <button class="btn ${disponible ? "ocultar" : "activar"}" type="submit">
      ${disponible ? "Ocultar producto" : "Activar producto"}
    </button>
  </form>
</div>
`;
  }).join("");

  const categoriasHtml = categorias.map((cat) => {
    return `
<div class="categoria-card">
  <form method="POST" action="/configuracion-productos/categorias/${cat.id}">
    <div class="grid-form">
      <div>
        <label>Categoría</label>
        <input name="nombre" value="${escapar(cat.nombre)}" required>
      </div>

      <div>
        <label>Destino</label>
        <select name="destino" required>
          <option value="cocina" ${cat.destino === "cocina" ? "selected" : ""}>Cocina</option>
          <option value="bar" ${cat.destino === "bar" ? "selected" : ""}>Bar</option>
        </select>
      </div>
    </div>

    <button class="btn guardar" type="submit">Guardar categoría</button>
  </form>
</div>
`;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Productos y precios - Restaurant Service POS</title>
<style>
*{
box-sizing:border-box;
}

body{
margin:0;
min-height:100vh;
font-family:Arial,sans-serif;
background:#eef2f7;
color:#111827;
}

.header{
background:#0f172a;
color:white;
padding:28px;
}

.header-inner{
max-width:1180px;
margin:0 auto;
display:flex;
justify-content:space-between;
align-items:center;
gap:16px;
flex-wrap:wrap;
}

.marca{
display:inline-flex;
background:rgba(255,255,255,.10);
border:1px solid rgba(255,255,255,.18);
border-radius:999px;
padding:8px 12px;
font-weight:900;
font-size:13px;
margin-bottom:12px;
}

h1{
margin:0;
font-size:38px;
letter-spacing:-.9px;
}

.subtitulo{
margin:8px 0 0 0;
color:#cbd5e1;
font-weight:800;
line-height:1.4;
}

.volver{
display:inline-flex;
background:white;
color:#111827;
border-radius:15px;
padding:13px 17px;
text-decoration:none;
font-weight:900;
}

.contenedor{
max-width:1180px;
margin:0 auto;
padding:28px;
}

.mensaje{
background:#ecfdf5;
border:1px solid #bbf7d0;
color:#166534;
border-radius:18px;
padding:15px;
font-weight:900;
margin-bottom:18px;
}

.panel{
background:white;
border-radius:24px;
padding:24px;
box-shadow:0 14px 35px rgba(15,23,42,.08);
margin-bottom:20px;
}

.panel h2{
margin:0 0 16px 0;
font-size:26px;
letter-spacing:-.5px;
}

.grid-form{
display:grid;
grid-template-columns:1fr 1fr;
gap:12px;
}

.full{
grid-column:1 / -1;
}

label{
display:block;
font-size:13px;
font-weight:900;
color:#475569;
margin-bottom:7px;
}

input,
select{
width:100%;
border:1px solid #cbd5e1;
border-radius:14px;
padding:13px;
font-size:15px;
background:white;
}

.btn{
width:100%;
border:none;
border-radius:14px;
padding:13px 15px;
font-weight:900;
font-size:15px;
cursor:pointer;
margin-top:12px;
}

.crear{
background:#16a34a;
color:white;
}

.guardar{
background:#111827;
color:white;
}

.ocultar{
background:#fee2e2;
color:#991b1b;
}

.activar{
background:#dcfce7;
color:#166534;
}

.buscador{
position:sticky;
top:0;
z-index:5;
background:white;
border:2px solid #16a34a;
border-radius:24px;
padding:20px;
box-shadow:0 18px 45px rgba(15,23,42,.12);
margin-bottom:20px;
}

.buscador label{
font-size:15px;
color:#166534;
}

.buscador input{
font-size:18px;
padding:16px;
border:2px solid #bbf7d0;
}

.buscador-info{
margin-top:10px;
font-weight:900;
color:#64748b;
}

.productos-grid{
display:grid;
grid-template-columns:repeat(2,1fr);
gap:16px;
}

.producto-card{
background:white;
border:1px solid #e2e8f0;
border-radius:24px;
padding:20px;
box-shadow:0 12px 30px rgba(15,23,42,.07);
}

.producto-top{
display:flex;
justify-content:space-between;
gap:14px;
align-items:flex-start;
}

.producto-card h3{
margin:0;
font-size:22px;
letter-spacing:-.4px;
}

.meta{
margin-top:6px;
color:#64748b;
font-weight:800;
}

.precio{
background:#eff6ff;
color:#1d4ed8;
border-radius:16px;
padding:10px 12px;
font-weight:900;
white-space:nowrap;
}

.estado{
display:inline-flex;
border-radius:999px;
padding:7px 11px;
font-weight:900;
font-size:13px;
margin:14px 0;
}

.estado.visible{
background:#ecfdf5;
color:#166534;
}

.estado.oculto{
background:#fef2f2;
color:#991b1b;
}

.categorias-grid{
display:grid;
grid-template-columns:repeat(2,1fr);
gap:14px;
}

.categoria-card{
background:#f8fafc;
border:1px solid #e2e8f0;
border-radius:20px;
padding:18px;
}

.sin-resultados{
display:none;
background:#fff7ed;
border:1px solid #fed7aa;
color:#9a3412;
border-radius:18px;
padding:18px;
font-weight:900;
text-align:center;
margin-top:16px;
}

@media(max-width:850px){
.productos-grid,
.categorias-grid,
.grid-form{
grid-template-columns:1fr;
}

.full{
grid-column:auto;
}

.header,
.contenedor{
padding:20px;
}
}
</style>
</head>

<body>

<header class="header">
  <div class="header-inner">
    <div>
      <div class="marca">Restaurant Service POS</div>
      <h1>Productos y precios</h1>
      <p class="subtitulo">Gestiona productos, precios, categorías y destino a bar o cocina.</p>
    </div>

    <a class="volver" href="/configuracion">Volver a Configuración</a>
  </div>
</header>

<main class="contenedor">

${mensaje ? '<div class="mensaje">' + escapar(mensaje) + '</div>' : ""}

<section class="panel">
  <h2>Crear categoría</h2>

  <form method="POST" action="/configuracion-productos/categorias">
    <div class="grid-form">
      <div>
        <label>Nombre categoría</label>
        <input name="nombre" placeholder="Ej. Entrantes, Bebidas, Carnes" required>
      </div>

      <div>
        <label>Destino</label>
        <select name="destino" required>
          <option value="cocina">Cocina</option>
          <option value="bar">Bar</option>
        </select>
      </div>
    </div>

    <button class="btn crear" type="submit">Crear categoría</button>
  </form>
</section>

<section class="panel">
  <h2>Crear producto</h2>

  <form method="POST" action="/configuracion-productos/productos">
    <div class="grid-form">
      <div>
        <label>Nombre producto</label>
        <input name="nombre" placeholder="Ej. Coca-Cola, Pizza Margherita" required>
      </div>

      <div>
        <label>Precio</label>
        <input name="precio" type="number" step="0.01" min="0" placeholder="0.00" required>
      </div>

      <div class="full">
        <label>Categoría</label>
        <select name="categoria_id" required>
          ${opcionesCategorias}
        </select>
      </div>
    </div>

    <button class="btn crear" type="submit">Crear producto</button>
  </form>
</section>

<section class="panel">
  <h2>Categorías existentes</h2>
  <div class="categorias-grid">
    ${categoriasHtml || "<p>No hay categorías todavía.</p>"}
  </div>
</section>

<section class="buscador">
  <label>Buscar producto rápidamente</label>
  <input id="buscadorProductos" type="search" placeholder="Escribe nombre, categoría, bar, cocina o precio...">
  <div class="buscador-info">
    Mostrando <span id="contadorProductos">${productos.length}</span> de ${productos.length} productos
  </div>
</section>

<section>
  <div id="productosGrid" class="productos-grid">
    ${productosHtml || "<p>No hay productos todavía.</p>"}
  </div>

  <div id="sinResultados" class="sin-resultados">
    No se encontraron productos con esa búsqueda.
  </div>
</section>

</main>

<script>
(function(){
  const input = document.getElementById("buscadorProductos");
  const cards = Array.from(document.querySelectorAll(".producto-card"));
  const contador = document.getElementById("contadorProductos");
  const sinResultados = document.getElementById("sinResultados");

  function normalizar(texto){
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .trim();
  }

  function filtrar(){
    const q = normalizar(input.value);
    let visibles = 0;

    cards.forEach((card) => {
      const texto = normalizar(card.getAttribute("data-search") || card.innerText);
      const mostrar = !q || texto.includes(q);

      card.style.display = mostrar ? "" : "none";

      if (mostrar) visibles++;
    });

    contador.textContent = visibles;
    sinResultados.style.display = visibles === 0 ? "block" : "none";
  }

  if (input) {
    input.addEventListener("input", filtrar);
    input.focus();
  }
})();
</script>

</body>
</html>
`;
}

module.exports = function adminProductosRoutes(db) {
  const router = express.Router();

  router.get("/admin-productos", (req, res) => res.redirect("/configuracion-productos"));
  router.get("/admin-categorias", (req, res) => res.redirect("/configuracion-productos"));
  router.get("/admin-productos/editar/:id", (req, res) => res.redirect("/configuracion-productos"));
  router.get("/admin-categorias/editar/:id", (req, res) => res.redirect("/configuracion-productos"));

  router.get("/configuracion-productos", requiereConfig, (req, res) => {
    db.all("SELECT id, nombre, destino FROM categorias ORDER BY nombre COLLATE NOCASE", [], (errCat, categorias) => {
      if (errCat) return res.status(500).send("Error cargando categorías");

      db.all(
        `SELECT productos.id,
                productos.nombre,
                productos.precio,
                productos.categoria_id,
                COALESCE(productos.disponible, 1) AS disponible,
                categorias.nombre AS categoria_nombre,
                categorias.destino AS destino
         FROM productos
         LEFT JOIN categorias ON categorias.id = productos.categoria_id
         ORDER BY productos.nombre COLLATE NOCASE`,
        [],
        (errProd, productos) => {
          if (errProd) return res.status(500).send("Error cargando productos");

          res.send(renderPagina(categorias || [], productos || [], req.query.ok || ""));
        }
      );
    });
  });

  router.post("/configuracion-productos/categorias", requiereConfig, (req, res) => {
    const nombre = String(req.body.nombre || "").trim();
    const destino = String(req.body.destino || "cocina").trim();

    if (!nombre) return res.redirect("/configuracion-productos");

    db.run(
      "INSERT INTO categorias (nombre, destino) VALUES (?, ?)",
      [nombre, destino],
      () => res.redirect("/configuracion-productos?ok=Categoría creada")
    );
  });

  router.post("/configuracion-productos/categorias/:id", requiereConfig, (req, res) => {
    const id = Number(req.params.id);
    const nombre = String(req.body.nombre || "").trim();
    const destino = String(req.body.destino || "cocina").trim();

    if (!id || !nombre) return res.redirect("/configuracion-productos");

    db.run(
      "UPDATE categorias SET nombre=?, destino=? WHERE id=?",
      [nombre, destino, id],
      () => res.redirect("/configuracion-productos?ok=Categoría actualizada")
    );
  });

  router.post("/configuracion-productos/productos", requiereConfig, (req, res) => {
    const nombre = String(req.body.nombre || "").trim();
    const precio = numeroPrecio(req.body.precio);
    const categoriaId = Number(req.body.categoria_id);

    if (!nombre || !categoriaId) return res.redirect("/configuracion-productos");

    db.run(
      "INSERT INTO productos (nombre, precio, categoria_id, disponible) VALUES (?, ?, ?, 1)",
      [nombre, precio, categoriaId],
      () => res.redirect("/configuracion-productos?ok=Producto creado")
    );
  });

  router.post("/configuracion-productos/productos/:id", requiereConfig, (req, res) => {
    const id = Number(req.params.id);
    const nombre = String(req.body.nombre || "").trim();
    const precio = numeroPrecio(req.body.precio);
    const categoriaId = Number(req.body.categoria_id);

    if (!id || !nombre || !categoriaId) return res.redirect("/configuracion-productos");

    db.run(
      "UPDATE productos SET nombre=?, precio=?, categoria_id=? WHERE id=?",
      [nombre, precio, categoriaId, id],
      () => res.redirect("/configuracion-productos?ok=Producto actualizado")
    );
  });

  router.post("/configuracion-productos/productos/:id/disponible", requiereConfig, (req, res) => {
    const id = Number(req.params.id);
    const disponible = Number(req.body.disponible) === 1 ? 1 : 0;

    if (!id) return res.redirect("/configuracion-productos");

    db.run(
      "UPDATE productos SET disponible=? WHERE id=?",
      [disponible, id],
      () => res.redirect("/configuracion-productos?ok=Estado del producto actualizado")
    );
  });

  return router;
};
