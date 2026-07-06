const express = require("express");
const { requiereRol } = require("../middleware/auth");

function zonasRoutes(db) {

const router = express.Router();

function escaparHTML(valor){

return String(valor || "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}

function estadoTexto(estado){

const mapa = {
libre: "Libre",
ocupada: "Ocupada",
reservada: "Reservada",
cuenta: "En cuenta"
};

return mapa[estado] || estado || "Sin estado";

}

function badgeEstado(estado){

const clase = {
libre: "libre",
ocupada: "ocupada",
reservada: "reservada",
cuenta: "cuenta"
}[estado] || "libre";

return `<span class="badge ${clase}">${estadoTexto(estado)}</span>`;

}

function badgeActivo(activo){

return Number(activo) === 1
? '<span class="badge activo">Activa</span>'
: '<span class="badge oculta">Oculta</span>';

}

function mensaje(req){

if(req.query.ok){
return `<div class="mensaje ok">${escaparHTML(req.query.ok)}</div>`;
}

if(req.query.error){
return `<div class="mensaje error">${escaparHTML(req.query.error)}</div>`;
}

return "";

}

router.get("/admin-zonas-mesas", requiereRol(["admin","gerente"]), (req,res)=>{
res.redirect("/configuracion-mesas");
});

router.get("/configuracion-mesas", requiereRol(["admin","gerente"]), (req,res)=>{

db.all(
"SELECT id,nombre,activo FROM zonas ORDER BY activo DESC, id",
[],
(err,zonas)=>{

if(err) return res.status(500).send(err.message);

db.all(
`
SELECT
mesas.id,
mesas.numero,
mesas.estado,
mesas.zona_id,
COALESCE(mesas.activo,1) AS activo,
zonas.nombre AS zona,
zonas.activo AS zona_activa
FROM mesas
LEFT JOIN zonas
ON zonas.id = mesas.zona_id
ORDER BY zonas.id, mesas.numero
`,
[],
(err,mesas)=>{

if(err) return res.status(500).send(err.message);

const zonasSeguras = zonas || [];
const mesasSeguras = mesas || [];

const zonasActivas = zonasSeguras.filter(z=>Number(z.activo) === 1);
const mesasActivas = mesasSeguras.filter(m=>Number(m.activo) === 1 && Number(m.zona_activa) === 1);

const opcionesZonas = zonasActivas.map(z=>{
return `<option value="${z.id}">${escaparHTML(z.nombre)}</option>`;
}).join("");

const zonasHtml = zonasSeguras.map(z=>{

const mesasZona = mesasSeguras.filter(m=>Number(m.zona_id) === Number(z.id));
const mesasNoLibres = mesasZona.filter(m=>m.estado !== "libre");

return `
<div class="zona-card ${Number(z.activo) === 1 ? "" : "zona-oculta"}">

<div class="zona-top">
<div>
<h3>${escaparHTML(z.nombre)}</h3>
<p>${mesasZona.length} mesas · ${mesasNoLibres.length} no libres</p>
</div>
${badgeActivo(z.activo)}
</div>

<form method="POST" action="/configuracion-mesas/zonas/${z.id}" class="zona-form">
<div>
<label>Nombre de la sala/zona</label>
<input name="nombre" value="${escaparHTML(z.nombre)}" required>
</div>
<button type="submit">Guardar</button>
</form>

<form method="POST" action="/configuracion-mesas/zonas/${z.id}/toggle">
<button class="${Number(z.activo) === 1 ? "btn-desactivar" : "btn-activar"}" type="submit">
${Number(z.activo) === 1 ? "Ocultar zona" : "Activar zona"}
</button>
</form>

</div>
`;
}).join("");

const mesasHtml = mesasSeguras.map(m=>{

return `
<div class="mesa-card ${Number(m.activo) === 1 && Number(m.zona_activa) === 1 ? "" : "mesa-oculta"}">

<div class="mesa-top">
<div>
<h3>Mesa ${escaparHTML(m.numero)}</h3>
<p>${escaparHTML(m.zona || "Sin zona")}</p>
</div>
<div class="badges">
${badgeEstado(m.estado)}
${Number(m.activo) === 1 ? '<span class="badge activo">Visible</span>' : '<span class="badge oculta">Oculta</span>'}
</div>
</div>

<form method="POST" action="/configuracion-mesas/mesas/${m.id}" class="mesa-form">

<div>
<label>Número o nombre</label>
<input name="numero" value="${escaparHTML(m.numero)}" required>
</div>

<div>
<label>Sala/Zona</label>
<select name="zona_id" required>
${zonasActivas.map(z=>{
return `<option value="${z.id}" ${Number(z.id) === Number(m.zona_id) ? "selected" : ""}>${escaparHTML(z.nombre)}</option>`;
}).join("")}
</select>
</div>

<button class="btn-guardar" type="submit">Guardar cambios</button>

</form>

<form method="POST" action="/configuracion-mesas/mesas/${m.id}/toggle">
<button class="${Number(m.activo) === 1 ? "btn-desactivar" : "btn-activar"}" type="submit">
${Number(m.activo) === 1 ? "Ocultar mesa" : "Activar mesa"}
</button>
</form>

</div>
`;
}).join("");

res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Salas y mesas</title>
<style>
*{
box-sizing:border-box;
}

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

.resumen{
display:grid;
grid-template-columns:repeat(4,1fr);
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

.grid-principal{
display:grid;
grid-template-columns:360px 1fr;
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

button{
border:none;
border-radius:13px;
padding:13px 16px;
font-weight:900;
font-size:14px;
cursor:pointer;
}

.form-grid{
display:grid;
gap:14px;
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

.zona-card,
.mesa-card{
background:white;
border:1px solid #e2e8f0;
border-radius:18px;
padding:18px;
box-shadow:0 8px 20px rgba(15,23,42,.08);
margin-bottom:14px;
}

.zona-oculta,
.mesa-oculta{
opacity:.58;
}

.zona-top,
.mesa-top{
display:flex;
justify-content:space-between;
gap:12px;
align-items:flex-start;
margin-bottom:14px;
}

.zona-top h3,
.mesa-top h3{
margin:0;
font-size:19px;
}

.zona-top p,
.mesa-top p{
margin:5px 0 0 0;
color:#64748b;
font-size:13px;
}

.zona-form,
.mesa-form{
display:grid;
gap:12px;
margin-bottom:12px;
}

.mesa-form{
grid-template-columns:1fr 1fr auto;
align-items:end;
}

.badges{
display:flex;
gap:6px;
flex-wrap:wrap;
justify-content:flex-end;
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

.badge.activo{
background:#dcfce7;
color:#166534;
}

.badge.oculta{
background:#fee2e2;
color:#991b1b;
}

.badge.libre{
background:#dcfce7;
color:#166534;
}

.badge.ocupada{
background:#fee2e2;
color:#991b1b;
}

.badge.reservada{
background:#fef3c7;
color:#92400e;
}

.badge.cuenta{
background:#dbeafe;
color:#1d4ed8;
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

.mensaje.error{
background:#fee2e2;
color:#991b1b;
border:1px solid #fecaca;
}

.aviso{
background:#fffbeb;
color:#92400e;
border:1px solid #fde68a;
border-radius:16px;
padding:14px;
font-weight:800;
font-size:14px;
line-height:1.4;
margin-bottom:20px;
}

@media(max-width:980px){
.grid-principal{
grid-template-columns:1fr;
}

.resumen{
grid-template-columns:1fr 1fr;
}

.mesa-form{
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
<h1>Salas y mesas</h1>
<p>Crea zonas, terrazas, salones y mesas con la organización real del restaurante.</p>
</div>
<a href="/configuracion">Volver a configuración</a>
</div>

${mensaje(req)}

<div class="aviso">
Solo se pueden ocultar mesas libres. Si una mesa está ocupada, reservada o en cuenta, primero debe cerrarse o liberarse desde el POS.
</div>

<div class="resumen">
<div class="resumen-card"><span>Zonas</span><strong>${zonasSeguras.length}</strong></div>
<div class="resumen-card"><span>Zonas activas</span><strong>${zonasActivas.length}</strong></div>
<div class="resumen-card"><span>Mesas</span><strong>${mesasSeguras.length}</strong></div>
<div class="resumen-card"><span>Mesas visibles</span><strong>${mesasActivas.length}</strong></div>
</div>

<div class="grid-principal">

<div>

<div class="card">
<h2>Nueva sala/zona</h2>
<form class="form-grid" method="POST" action="/configuracion-mesas/zonas">
<div>
<label>Nombre</label>
<input name="nombre" placeholder="Ej. Sala principal, Terraza, Privado..." required>
</div>
<button class="btn-principal" type="submit">Crear sala/zona</button>
</form>
</div>

<div class="card">
<h2>Nueva mesa</h2>
<form class="form-grid" method="POST" action="/configuracion-mesas/mesas">
<div>
<label>Número o nombre de mesa</label>
<input name="numero" placeholder="Ej. 1, 2, T1, VIP..." required>
</div>

<div>
<label>Sala/Zona</label>
<select name="zona_id" required>
${opcionesZonas}
</select>
</div>

<button class="btn-principal" type="submit">Crear mesa</button>
</form>
</div>

<div class="card">
<h2>Salas/Zonas</h2>
${zonasHtml || "<p>No hay zonas creadas.</p>"}
</div>

</div>

<div class="card">
<h2>Mesas</h2>
${mesasHtml || "<p>No hay mesas creadas.</p>"}
</div>

</div>

</div>

</body>
</html>
`);

});

});

});

router.post("/configuracion-mesas/zonas", requiereRol(["admin","gerente"]), (req,res)=>{

db.run(
"INSERT INTO zonas(nombre,activo) VALUES(?,1)",
[req.body.nombre],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-mesas?ok=Sala creada correctamente");

});

});

router.post("/configuracion-mesas/zonas/:id", requiereRol(["admin","gerente"]), (req,res)=>{

db.run(
"UPDATE zonas SET nombre=? WHERE id=?",
[req.body.nombre, req.params.id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-mesas?ok=Sala actualizada correctamente");

});

});

router.post("/configuracion-mesas/zonas/:id/toggle", requiereRol(["admin","gerente"]), (req,res)=>{

db.get(
"SELECT activo FROM zonas WHERE id=?",
[req.params.id],
(err,zona)=>{

if(err) return res.status(500).send(err.message);

if(!zona) return res.redirect("/configuracion-mesas?error=Sala no encontrada");

const activar = Number(zona.activo) === 0;

if(activar){

db.run(
"UPDATE zonas SET activo=1 WHERE id=?",
[req.params.id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-mesas?ok=Sala activada correctamente");

});

return;

}

db.get(
`
SELECT COUNT(*) AS total
FROM mesas
WHERE zona_id=?
AND COALESCE(activo,1)=1
AND estado!='libre'
`,
[req.params.id],
(err,row)=>{

if(err) return res.status(500).send(err.message);

if(row.total > 0){
return res.redirect("/configuracion-mesas?error=No puedes ocultar una sala con mesas ocupadas, reservadas o en cuenta");
}

db.run(
"UPDATE zonas SET activo=0 WHERE id=?",
[req.params.id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-mesas?ok=Sala ocultada correctamente");

});

});

});

});

router.post("/configuracion-mesas/mesas", requiereRol(["admin","gerente"]), (req,res)=>{

db.run(
"INSERT INTO mesas(numero,estado,zona_id,activo) VALUES(?,'libre',?,1)",
[req.body.numero, req.body.zona_id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-mesas?ok=Mesa creada correctamente");

});

});

router.post("/configuracion-mesas/mesas/:id", requiereRol(["admin","gerente"]), (req,res)=>{

db.get(
"SELECT estado FROM mesas WHERE id=?",
[req.params.id],
(err,mesa)=>{

if(err) return res.status(500).send(err.message);

if(!mesa) return res.redirect("/configuracion-mesas?error=Mesa no encontrada");

db.run(
"UPDATE mesas SET numero=?, zona_id=? WHERE id=?",
[req.body.numero, req.body.zona_id, req.params.id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-mesas?ok=Mesa actualizada correctamente");

});

});

});

router.post("/configuracion-mesas/mesas/:id/toggle", requiereRol(["admin","gerente"]), (req,res)=>{

db.get(
"SELECT estado, COALESCE(activo,1) AS activo FROM mesas WHERE id=?",
[req.params.id],
(err,mesa)=>{

if(err) return res.status(500).send(err.message);

if(!mesa) return res.redirect("/configuracion-mesas?error=Mesa no encontrada");

if(Number(mesa.activo) === 1 && mesa.estado !== "libre"){
return res.redirect("/configuracion-mesas?error=Solo puedes ocultar mesas libres");
}

const nuevoEstado = Number(mesa.activo) === 1 ? 0 : 1;

db.run(
"UPDATE mesas SET activo=? WHERE id=?",
[nuevoEstado, req.params.id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-mesas?ok=Visibilidad de mesa actualizada correctamente");

});

});

});

// Compatibilidad con rutas antiguas
router.post("/admin-zonas/crear", requiereRol(["admin","gerente"]), (req,res)=>{

db.run(
"INSERT INTO zonas(nombre,activo) VALUES(?,1)",
[req.body.nombre],
()=>res.redirect("/configuracion-mesas")
);

});

router.post("/admin-mesas/crear", requiereRol(["admin","gerente"]), (req,res)=>{

db.run(
"INSERT INTO mesas(numero,estado,zona_id,activo) VALUES(?,'libre',?,1)",
[req.body.numero,req.body.zona_id],
()=>res.redirect("/configuracion-mesas")
);

});

return router;

}

module.exports = zonasRoutes;
