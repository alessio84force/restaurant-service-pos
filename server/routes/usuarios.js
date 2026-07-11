const express = require("express");
const passwords = require("../utils/passwords");
const { requiereRol } = require("../middleware/auth");

function usuariosRoutes(db){

const router = express.Router();

function escaparHTML(valor){

return String(valor || "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}

function rolTexto(rol){

const mapa = {
admin: "Administrador",
gerente: "Gerente",
camarero: "Camarero",
cocina: "Cocina",
bar: "Bar"
};

return mapa[rol] || rol || "Usuario";

}

function descripcionRol(rol){

const mapa = {
admin: "Acceso completo a configuración, productos, mesas, usuarios, caja y POS.",
gerente: "Acceso a configuración, caja y gestión general, sin ser propietario principal.",
camarero: "Acceso operativo a sala, mesas, comandas, bar/cocina y cuenta.",
cocina: "Acceso a pantalla o flujo de cocina.",
bar: "Acceso a pantalla o flujo de bar."
};

return mapa[rol] || "Rol del sistema.";

}

function badgeActivo(activo){

return Number(activo) === 1
? '<span class="badge activo">Activo</span>'
: '<span class="badge inactivo">Desactivado</span>';

}

function opcionesRoles(rolActual){

const roles = [
["admin","Administrador"],
["gerente","Gerente"],
["camarero","Camarero"],
["cocina","Cocina"],
["bar","Bar"]
];

return roles.map(([valor,texto])=>{
return `<option value="${valor}" ${valor === rolActual ? "selected" : ""}>${texto}</option>`;
}).join("");

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

router.get("/admin-usuarios", requiereRol(["admin","gerente"]), (req,res)=>{
res.redirect("/configuracion-usuarios");
});

router.get("/configuracion-usuarios", requiereRol(["admin","gerente"]), (req,res)=>{

db.all(
"SELECT id,nombre,email,rol,activo,creado_en FROM usuarios ORDER BY activo DESC, rol, nombre",
[],
(err,usuarios)=>{

if(err) return res.status(500).send(err.message);

const usuariosSeguros = usuarios || [];
const activos = usuariosSeguros.filter(u=>Number(u.activo) === 1);
const admins = activos.filter(u=>u.rol === "admin");
const gerentes = activos.filter(u=>u.rol === "gerente");
const camareros = activos.filter(u=>u.rol === "camarero");

const usuariosHtml = usuariosSeguros.map(u=>{

return `
<div class="usuario-card ${Number(u.activo) === 1 ? "" : "usuario-inactivo"}">

<div class="usuario-top">
<div>
<h3>${escaparHTML(u.nombre)}</h3>
<p>${escaparHTML(u.email)}</p>
</div>
<div class="badges">
<span class="badge rol">${rolTexto(u.rol)}</span>
${badgeActivo(u.activo)}
</div>
</div>

<div class="rol-descripcion">
${descripcionRol(u.rol)}
</div>

<form method="POST" action="/configuracion-usuarios/usuarios/${u.id}" class="usuario-form">

<div>
<label>Nombre</label>
<input name="nombre" value="${escaparHTML(u.nombre)}" required>
</div>

<div>
<label>Email</label>
<input name="email" type="email" value="${escaparHTML(u.email)}" required>
</div>

<div>
<label>Rol</label>
<select name="rol" required>
${opcionesRoles(u.rol)}
</select>
</div>

<div>
<label>Nueva contraseña</label>
<input name="password" type="password" placeholder="Dejar vacío para no cambiar">
</div>

<button class="btn-guardar" type="submit">Guardar cambios</button>

</form>

<div class="acciones-usuario">

<form method="POST" action="/configuracion-usuarios/usuarios/${u.id}/toggle">
<button class="${Number(u.activo) === 1 ? "btn-desactivar" : "btn-activar"}" type="submit">
${Number(u.activo) === 1 ? "Desactivar usuario" : "Activar usuario"}
</button>
</form>

<form method="POST" action="/configuracion-usuarios/usuarios/${u.id}/eliminar" onsubmit="return confirm('¿Eliminar este usuario definitivamente? Esta acción no se puede deshacer.');">
<button class="btn-eliminar" type="submit">
Eliminar usuario
</button>
</form>

</div>

</div>
`;
}).join("");

res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Usuarios y permisos</title>
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

.btn-eliminar{
background:#111827;
color:white;
}

.btn-eliminar:hover{
background:#000000;
}

.acciones-usuario{
display:flex;
gap:10px;
flex-wrap:wrap;
}

.usuario-card{
background:white;
border:1px solid #e2e8f0;
border-radius:18px;
padding:18px;
box-shadow:0 8px 20px rgba(15,23,42,.08);
margin-bottom:14px;
}

.usuario-inactivo{
opacity:.58;
}

.usuario-top{
display:flex;
justify-content:space-between;
gap:12px;
align-items:flex-start;
margin-bottom:12px;
}

.usuario-top h3{
margin:0;
font-size:19px;
}

.usuario-top p{
margin:5px 0 0 0;
color:#64748b;
font-size:13px;
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

.badge.inactivo{
background:#fee2e2;
color:#991b1b;
}

.badge.rol{
background:#dbeafe;
color:#1d4ed8;
}

.rol-descripcion{
background:#f8fafc;
border:1px solid #e2e8f0;
border-radius:14px;
padding:12px;
font-size:14px;
font-weight:700;
color:#475569;
margin-bottom:14px;
}

.usuario-form{
display:grid;
grid-template-columns:1fr 1fr;
gap:12px;
margin-bottom:12px;
}

.usuario-form button{
grid-column:1 / -1;
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

.usuario-form{
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
<h1>Usuarios y permisos</h1>
<p>Gestiona quién puede entrar al POS, a la sala, a bar, cocina y configuración.</p>
</div>
<a href="/configuracion">Volver a configuración</a>
</div>

${mensaje(req)}

<div class="aviso">
El propietario o administrador tiene acceso completo. El camarero solo debe usar el POS operativo: sala, pedidos, comandas y cuenta.
</div>

<div class="resumen">
<div class="resumen-card"><span>Usuarios</span><strong>${usuariosSeguros.length}</strong></div>
<div class="resumen-card"><span>Activos</span><strong>${activos.length}</strong></div>
<div class="resumen-card"><span>Admin</span><strong>${admins.length}</strong></div>
<div class="resumen-card"><span>Camareros</span><strong>${camareros.length}</strong></div>
</div>

<div class="grid-principal">

<div>

<div class="card">
<h2>Nuevo usuario</h2>
<form class="form-grid" method="POST" action="/configuracion-usuarios/usuarios">

<div>
<label>Nombre</label>
<input name="nombre" placeholder="Ej. Camarero turno noche" required>
</div>

<div>
<label>Email</label>
<input name="email" type="email" placeholder="usuario@restaurante.com" required>
</div>

<div>
<label>Contraseña</label>
<input name="password" type="password" placeholder="Contraseña de acceso" required>
</div>

<div>
<label>Rol</label>
<select name="rol" required>
${opcionesRoles("camarero")}
</select>
</div>

<button class="btn-principal" type="submit">Crear usuario</button>

</form>
</div>

<div class="card">
<h2>Roles del sistema</h2>
<div class="rol-descripcion"><strong>Administrador:</strong> acceso completo.</div>
<div class="rol-descripcion"><strong>Gerente:</strong> gestión general y caja.</div>
<div class="rol-descripcion"><strong>Camarero:</strong> sala, pedidos, comandas y cuenta.</div>
<div class="rol-descripcion"><strong>Cocina:</strong> flujo de cocina.</div>
<div class="rol-descripcion"><strong>Bar:</strong> flujo de bar.</div>
</div>

</div>

<div class="card">
<h2>Usuarios actuales</h2>
${usuariosHtml || "<p>No hay usuarios creados.</p>"}
</div>

</div>

</div>

</body>
</html>
`);

});

});

router.post("/configuracion-usuarios/usuarios", requiereRol(["admin","gerente"]), (req,res)=>{

const nombre = String(req.body.nombre || "").trim();
const email = String(req.body.email || "").trim().toLowerCase();
const password = String(req.body.password || "").trim();
const rol = String(req.body.rol || "camarero").trim();

if(!nombre || !email || !password){
return res.redirect("/configuracion-usuarios?error=Faltan datos obligatorios");
}

db.get(
"SELECT id FROM usuarios WHERE email=?",
[email],
(err,existente)=>{

if(err) return res.status(500).send(err.message);

if(existente){
return res.redirect("/configuracion-usuarios?error=Ya existe un usuario con ese email");
}

db.run(
"INSERT INTO usuarios(nombre,email,password,rol,activo) VALUES(?,?,?,?,1)",
[nombre,email,passwords.hashPassword(password),rol],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-usuarios?ok=Usuario creado correctamente");

});

});

});

router.post("/configuracion-usuarios/usuarios/:id", requiereRol(["admin","gerente"]), (req,res)=>{

const id = req.params.id;
const nombre = String(req.body.nombre || "").trim();
const email = String(req.body.email || "").trim().toLowerCase();
const password = String(req.body.password || "").trim();
const rol = String(req.body.rol || "camarero").trim();

if(!nombre || !email || !rol){
return res.redirect("/configuracion-usuarios?error=Faltan datos obligatorios");
}

db.get(
"SELECT id FROM usuarios WHERE email=? AND id!=?",
[email,id],
(err,existente)=>{

if(err) return res.status(500).send(err.message);

if(existente){
return res.redirect("/configuracion-usuarios?error=Ya existe otro usuario con ese email");
}

if(password){

db.run(
"UPDATE usuarios SET nombre=?, email=?, password=?, rol=? WHERE id=?",
[nombre,email,passwords.hashPassword(password),rol,id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-usuarios?ok=Usuario actualizado correctamente");

});

return;

}

db.run(
"UPDATE usuarios SET nombre=?, email=?, rol=? WHERE id=?",
[nombre,email,rol,id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-usuarios?ok=Usuario actualizado correctamente");

});

});

});

router.post("/configuracion-usuarios/usuarios/:id/toggle", requiereRol(["admin","gerente"]), (req,res)=>{

const id = req.params.id;

db.get(
"SELECT id,nombre,rol,activo FROM usuarios WHERE id=?",
[id],
(err,usuario)=>{

if(err) return res.status(500).send(err.message);

if(!usuario){
return res.redirect("/configuracion-usuarios?error=Usuario no encontrado");
}

const estaActivo = Number(usuario.activo) === 1;

if(estaActivo && req.session.usuario && Number(req.session.usuario.id) === Number(usuario.id)){
return res.redirect("/configuracion-usuarios?error=No puedes desactivar tu propio usuario mientras estás dentro");
}

if(estaActivo && (usuario.rol === "admin" || usuario.rol === "gerente")){

db.get(
"SELECT COUNT(*) AS total FROM usuarios WHERE activo=1 AND rol IN ('admin','gerente') AND id!=?",
[id],
(err,row)=>{

if(err) return res.status(500).send(err.message);

if(row.total <= 0){
return res.redirect("/configuracion-usuarios?error=Debe quedar al menos un admin o gerente activo");
}

db.run(
"UPDATE usuarios SET activo=0 WHERE id=?",
[id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-usuarios?ok=Usuario desactivado correctamente");

});

});

return;

}

const nuevoEstado = estaActivo ? 0 : 1;

db.run(
"UPDATE usuarios SET activo=? WHERE id=?",
[nuevoEstado,id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-usuarios?ok=Estado del usuario actualizado correctamente");

});

});

});

router.post("/configuracion-usuarios/usuarios/:id/eliminar", requiereRol(["admin","gerente"]), (req,res)=>{

const id = req.params.id;

db.get(
"SELECT id,nombre,rol,activo FROM usuarios WHERE id=?",
[id],
(err,usuario)=>{

if(err) return res.status(500).send(err.message);

if(!usuario){
return res.redirect("/configuracion-usuarios?error=Usuario no encontrado");
}

if(req.session.usuario && Number(req.session.usuario.id) === Number(usuario.id)){
return res.redirect("/configuracion-usuarios?error=No puedes eliminar tu propio usuario mientras estás dentro");
}

if(usuario.rol === "admin" || usuario.rol === "gerente"){

db.get(
"SELECT COUNT(*) AS total FROM usuarios WHERE activo=1 AND rol IN ('admin','gerente') AND id!=?",
[id],
(err,row)=>{

if(err) return res.status(500).send(err.message);

if(row.total <= 0){
return res.redirect("/configuracion-usuarios?error=Debe quedar al menos un admin o gerente activo");
}

db.run(
"DELETE FROM usuarios WHERE id=?",
[id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-usuarios?ok=Usuario eliminado definitivamente");

});

});

return;

}

db.run(
"DELETE FROM usuarios WHERE id=?",
[id],
function(err){

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-usuarios?ok=Usuario eliminado definitivamente");

});

});

});

// API existente, ahora protegida
router.get("/admin/usuarios", requiereRol(["admin","gerente"]), (req,res)=>{

db.all(
"SELECT id,nombre,email,rol,activo,creado_en FROM usuarios ORDER BY nombre",
[],
(err,rows)=>{

if(err){
console.log(err);
return res.status(500).json(err);
}

res.json(rows);

});

});

return router;

}

module.exports = usuariosRoutes;
