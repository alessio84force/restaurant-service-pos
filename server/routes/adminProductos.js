const express = require("express");
const { requiereRol } = require("../middleware/auth");

function adminProductosRoutes(db){

const router=express.Router();

router.get("/admin-productos", requiereRol(["admin","gerente"]), (req,res)=>{
res.redirect("/configuracion-productos");
});

router.get("/admin-categorias", requiereRol(["admin","gerente"]), (req,res)=>{
res.redirect("/configuracion-productos");
});

router.get("/admin-productos/editar/:id", requiereRol(["admin","gerente"]), (req,res)=>{
res.redirect("/configuracion-productos");
});

router.get("/admin-categorias/editar/:id", requiereRol(["admin","gerente"]), (req,res)=>{
res.redirect("/configuracion-productos");
});


function escaparHTML(valor){

return String(valor || "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}

function destinoTexto(destino){

if(destino === "bar") return "Bar";
if(destino === "cocina") return "Cocina";

return destino || "Sin destino";

}

function badgeDisponible(disponible){

return Number(disponible) === 1
? '<span class="badge ok">Activo</span>'
: '<span class="badge off">Oculto</span>';

}

router.get("/configuracion-productos", requiereRol(["admin","gerente"]), (req,res)=>{

const respuesta = {};

db.all(
"SELECT id,nombre,destino FROM categorias ORDER BY destino,nombre",
[],
(err,categorias)=>{

if(err) return res.status(500).send(err.message);

respuesta.categorias = categorias || [];

db.all(
`
SELECT
p.id,
p.nombre,
p.precio,
p.categoria_id,
p.disponible,
c.nombre AS categoria,
c.destino
FROM productos p
LEFT JOIN categorias c
ON c.id=p.categoria_id
ORDER BY c.destino,c.nombre,p.nombre
`,
[],
(err,productos)=>{

if(err) return res.status(500).send(err.message);

respuesta.productos = productos || [];

const opcionesCategorias = respuesta.categorias.map(c=>{
return `<option value="${c.id}">${escaparHTML(c.nombre)} · ${destinoTexto(c.destino)}</option>`;
}).join("");

const categoriasHtml = respuesta.categorias.map(c=>{
return `
<div class="categoria-card">
<form method="POST" action="/configuracion-productos/categorias/${c.id}">
<div class="categoria-info">
<input name="nombre" value="${escaparHTML(c.nombre)}" required>
<select name="destino">
<option value="cocina" ${c.destino === "cocina" ? "selected" : ""}>Cocina</option>
<option value="bar" ${c.destino === "bar" ? "selected" : ""}>Bar</option>
</select>
</div>
<button type="submit">Guardar</button>
</form>
</div>
`;
}).join("");

const productosHtml = respuesta.productos.map(p=>{
return `
<div class="producto-card ${Number(p.disponible) === 1 ? "" : "producto-oculto"}">
<form method="POST" action="/configuracion-productos/productos/${p.id}">

<div class="producto-top">
<div>
<h3>${escaparHTML(p.nombre)}</h3>
<p>${escaparHTML(p.categoria || "Sin categoría")} · ${destinoTexto(p.destino)}</p>
</div>
${badgeDisponible(p.disponible)}
</div>

<div class="producto-grid">
<div>
<label>Nombre</label>
<input name="nombre" value="${escaparHTML(p.nombre)}" required>
</div>

<div>
<label>Precio</label>
<input name="precio" type="number" step="0.01" min="0" value="${Number(p.precio || 0).toFixed(2)}" required>
</div>

<div>
<label>Categoría</label>
<select name="categoria_id" required>
${respuesta.categorias.map(c=>{
return `<option value="${c.id}" ${Number(c.id) === Number(p.categoria_id) ? "selected" : ""}>${escaparHTML(c.nombre)} · ${destinoTexto(c.destino)}</option>`;
}).join("")}
</select>
</div>
</div>

<div class="producto-actions">
<button class="btn-guardar" type="submit">Guardar cambios</button>
</form>

<form method="POST" action="/configuracion-productos/productos/${p.id}/toggle">
<button class="${Number(p.disponible) === 1 ? "btn-desactivar" : "btn-activar"}" type="submit">
${Number(p.disponible) === 1 ? "Ocultar del menú" : "Activar en menú"}
</button>
</form>
</div>

</div>
`;
}).join("");

const ok = req.query.ok
? `<div class="mensaje ok">${escaparHTML(req.query.ok)}</div>`
: "";

res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Productos y precios</title>
<style>
*{box-sizing:border-box;}

body{
margin:0;
font-family:Arial,sans-serif;
background:#eef2f7;
color:#111827;
padding:30px;
}

.contenedor{
max-width:1200px;
margin:0 auto;
}

.header{
background:#111827;
color:white;
padding:26px;
border-radius:20px;
margin-bottom:24px;
box-shadow:0 12px 28px rgba(15,23,42,.18);
display:flex;
justify-content:space-between;
gap:18px;
align-items:center;
}

.header h1{
margin:0;
font-size:30px;
}

.header p{
margin:8px 0 0 0;
color:#cbd5e1;
}

.header a{
display:inline-flex;
align-items:center;
justify-content:center;
background:#2563eb;
color:white;
text-decoration:none;
padding:13px 18px;
border-radius:14px;
font-weight:900;
white-space:nowrap;
}

.grid-principal{
display:grid;
grid-template-columns:380px 1fr;
gap:22px;
align-items:start;
}

.card{
background:white;
border-radius:18px;
padding:22px;
box-shadow:0 12px 28px rgba(15,23,42,.10);
margin-bottom:20px;
}

.card h2{
margin:0 0 16px 0;
font-size:22px;
}

label{
display:block;
font-size:13px;
font-weight:900;
color:#475569;
margin-bottom:7px;
}

input,select{
width:100%;
border:1px solid #cbd5e1;
border-radius:13px;
padding:13px;
font-size:15px;
background:white;
}

.form-grid{
display:grid;
gap:14px;
}

button{
border:none;
border-radius:13px;
padding:13px 16px;
font-weight:900;
font-size:14px;
cursor:pointer;
}

.btn-principal,
.btn-guardar{
background:#16a34a;
color:white;
box-shadow:0 8px 18px rgba(22,163,74,.22);
}

.btn-principal:hover,
.btn-guardar:hover{
background:#15803d;
}

.btn-desactivar{
background:#fee2e2;
color:#991b1b;
}

.btn-activar{
background:#dcfce7;
color:#166534;
}

.categoria-card{
background:#f8fafc;
border:1px solid #e2e8f0;
border-radius:16px;
padding:13px;
margin-bottom:10px;
}

.categoria-card form{
display:grid;
grid-template-columns:1fr auto;
gap:10px;
align-items:center;
}

.categoria-info{
display:grid;
grid-template-columns:1fr 120px;
gap:10px;
}

.categoria-card button{
background:#e0e7ff;
color:#3730a3;
}

.productos-lista{
display:grid;
grid-template-columns:1fr 1fr;
gap:16px;
}

.producto-card{
background:white;
border:1px solid #e2e8f0;
border-radius:18px;
padding:18px;
box-shadow:0 8px 20px rgba(15,23,42,.08);
}

.producto-oculto{
opacity:.62;
}

.producto-top{
display:flex;
justify-content:space-between;
gap:10px;
align-items:flex-start;
margin-bottom:14px;
}

.producto-top h3{
margin:0;
font-size:19px;
}

.producto-top p{
margin:5px 0 0 0;
color:#64748b;
font-size:13px;
}

.badge{
display:inline-flex;
align-items:center;
justify-content:center;
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

.badge.off{
background:#fee2e2;
color:#991b1b;
}

.producto-grid{
display:grid;
grid-template-columns:1fr 110px;
gap:12px;
}

.producto-grid div:nth-child(3){
grid-column:1 / -1;
}

.producto-actions{
display:flex;
gap:10px;
margin-top:14px;
}

.producto-actions form{
margin:0;
}

.mensaje{
padding:15px;
border-radius:14px;
font-weight:900;
margin-bottom:18px;
}

.mensaje.ok{
background:#dcfce7;
color:#166534;
border:1px solid #bbf7d0;
}

.resumen{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:12px;
margin-bottom:20px;
}

.resumen-card{
background:white;
border-radius:16px;
padding:16px;
box-shadow:0 8px 20px rgba(15,23,42,.08);
}

.resumen-card span{
display:block;
color:#64748b;
font-size:13px;
font-weight:900;
}

.resumen-card strong{
display:block;
font-size:26px;
margin-top:4px;
}

@media(max-width:980px){
.grid-principal{
grid-template-columns:1fr;
}

.productos-lista{
grid-template-columns:1fr;
}

.header{
flex-direction:column;
align-items:flex-start;
}
}
</style>
</head>
<body>

<div class="contenedor">

<div class="header">
<div>
<h1>Productos y precios</h1>
<p>Gestiona el menú del restaurante, precios, categorías y destino de comanda.</p>
</div>
<a href="/configuracion">Volver a configuración</a>
</div>

${ok}

<div class="resumen">
<div class="resumen-card"><span>Productos</span><strong>${respuesta.productos.length}</strong></div>
<div class="resumen-card"><span>Activos</span><strong>${respuesta.productos.filter(p=>Number(p.disponible)===1).length}</strong></div>
<div class="resumen-card"><span>Categorías</span><strong>${respuesta.categorias.length}</strong></div>
</div>

<div class="grid-principal">

<div>

<div class="card">
<h2>Nuevo producto</h2>
<form class="form-grid" method="POST" action="/configuracion-productos/productos">
<div>
<label>Nombre del producto</label>
<input name="nombre" placeholder="Ej. Coca-Cola, Entrecot, Croquetas..." required>
</div>

<div>
<label>Precio</label>
<input name="precio" type="number" step="0.01" min="0" placeholder="0.00" required>
</div>

<div>
<label>Categoría</label>
<select name="categoria_id" required>
${opcionesCategorias}
</select>
</div>

<button class="btn-principal" type="submit">Crear producto</button>
</form>
</div>

<div class="card">
<h2>Nueva categoría</h2>
<form class="form-grid" method="POST" action="/configuracion-productos/categorias">
<div>
<label>Nombre categoría</label>
<input name="nombre" placeholder="Ej. Bebidas, Carnes, Postres..." required>
</div>

<div>
<label>Destino comanda</label>
<select name="destino" required>
<option value="cocina">Cocina</option>
<option value="bar">Bar</option>
</select>
</div>

<button class="btn-principal" type="submit">Crear categoría</button>
</form>
</div>

<div class="card">
<h2>Categorías actuales</h2>
${categoriasHtml || "<p>No hay categorías creadas.</p>"}
</div>

</div>

<div class="card">
<h2>Lista de productos</h2>
<div class="productos-lista">
${productosHtml || "<p>No hay productos creados.</p>"}
</div>
</div>

</div>

</div>

</body>
</html>
`);

});

});

});

router.post("/configuracion-productos/categorias", requiereRol(["admin","gerente"]), (req,res)=>{

db.run(
"INSERT INTO categorias(nombre,destino) VALUES(?,?)",
[
req.body.nombre,
req.body.destino || "cocina"
],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-productos?ok=Categoría creada correctamente");

});

});

router.post("/configuracion-productos/categorias/:id", requiereRol(["admin","gerente"]), (req,res)=>{

db.run(
"UPDATE categorias SET nombre=?, destino=? WHERE id=?",
[
req.body.nombre,
req.body.destino || "cocina",
req.params.id
],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-productos?ok=Categoría actualizada correctamente");

});

});

router.post("/configuracion-productos/productos", requiereRol(["admin","gerente"]), (req,res)=>{

db.run(
"INSERT INTO productos(nombre,precio,categoria_id,disponible) VALUES(?,?,?,1)",
[
req.body.nombre,
Number(req.body.precio || 0),
req.body.categoria_id
],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-productos?ok=Producto creado correctamente");

});

});

router.post("/configuracion-productos/productos/:id", requiereRol(["admin","gerente"]), (req,res)=>{

db.run(
"UPDATE productos SET nombre=?, precio=?, categoria_id=? WHERE id=?",
[
req.body.nombre,
Number(req.body.precio || 0),
req.body.categoria_id,
req.params.id
],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-productos?ok=Producto actualizado correctamente");

});

});

router.post("/configuracion-productos/productos/:id/toggle", requiereRol(["admin","gerente"]), (req,res)=>{

db.get(
"SELECT disponible FROM productos WHERE id=?",
[req.params.id],
(err,producto)=>{

if(err) return res.status(500).send(err.message);

if(!producto) return res.status(404).send("Producto no encontrado");

const nuevoEstado = Number(producto.disponible) === 1 ? 0 : 1;

db.run(
"UPDATE productos SET disponible=? WHERE id=?",
[nuevoEstado, req.params.id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-productos?ok=Disponibilidad actualizada correctamente");

});

});

});

router.get("/admin/categorias", requiereRol(["admin","gerente"]), (req,res)=>{

db.all(
"SELECT id,nombre,destino FROM categorias ORDER BY nombre",
[],
(err,rows)=>{
if(err) return res.status(500).json(err);
res.json(rows);
});

});

router.get("/admin/productos", requiereRol(["admin","gerente"]), (req,res)=>{

db.all(
`
SELECT
p.id,
p.nombre,
p.precio,
p.categoria_id,
p.disponible,
c.nombre categoria,
c.destino
FROM productos p
JOIN categorias c
ON c.id=p.categoria_id
ORDER BY c.nombre,p.nombre
`,
[],
(err,rows)=>{

if(err) return res.status(500).json(err);

res.json(rows);

});

});

router.post("/admin/productos", requiereRol(["admin","gerente"]), (req,res)=>{

const p=req.body;

db.run(
"INSERT INTO productos (nombre,precio,categoria_id,disponible) VALUES(?,?,?,1)",
[
p.nombre,
p.precio,
p.categoria_id
],
function(err){

if(err) return res.status(500).json(err);

res.json({
ok:true,
id:this.lastID
});

});

});

return router;

}

module.exports=adminProductosRoutes;
