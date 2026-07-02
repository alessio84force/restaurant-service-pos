const express = require("express");
const { requiereRol } = require("../middleware/auth");

function configurazioneRoutes(db){

const router=express.Router();

router.get("/usuario-actual",(req,res)=>{

if(!req.session || !req.session.usuario){
return res.json({
autenticado:false
});
}

res.json({
autenticado:true,
id:req.session.usuario.id,
nombre:req.session.usuario.nombre,
email:req.session.usuario.email,
rol:req.session.usuario.rol
});

});


function escaparHTML(valor){

return String(valor || "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}

router.get("/configurazione", requiereRol(["admin","gerente"]), (req,res)=>{

db.get(
"SELECT * FROM configurazione WHERE id=1",
[],
(err,row)=>{

if(err) return res.status(500).json(err);

res.json(row);

});

});



router.get("/configuracion", requiereRol(["admin","gerente"]), (req,res)=>{

res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Configuración general</title>
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
max-width:1100px;
margin:0 auto;
}

.header{
background:#111827;
color:white;
padding:26px;
border-radius:20px;
margin-bottom:24px;
box-shadow:0 12px 28px rgba(15,23,42,.18);
}

.header h1{
margin:0;
font-size:30px;
}

.header p{
margin:8px 0 0 0;
color:#cbd5e1;
}

.grid{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:18px;
}

.card{
background:white;
border-radius:18px;
padding:22px;
box-shadow:0 12px 28px rgba(15,23,42,.10);
text-decoration:none;
color:#111827;
display:block;
border:2px solid transparent;
transition:.15s ease;
min-height:160px;
}

.card:hover{
transform:translateY(-2px);
border-color:#2563eb;
box-shadow:0 16px 34px rgba(15,23,42,.14);
}

.icono{
font-size:34px;
margin-bottom:12px;
}

.card h2{
margin:0 0 8px 0;
font-size:20px;
}

.card p{
margin:0;
color:#64748b;
line-height:1.4;
font-size:14px;
}

.card.proximamente{
opacity:.55;
cursor:not-allowed;
}

.card.proximamente:hover{
transform:none;
border-color:transparent;
}

.volver{
display:inline-flex;
margin-top:24px;
padding:14px 18px;
border-radius:14px;
background:#2563eb;
color:white;
text-decoration:none;
font-weight:900;
}

@media(max-width:900px){
.grid{
grid-template-columns:1fr 1fr;
}
}

@media(max-width:600px){
.grid{
grid-template-columns:1fr;
}
}
</style>
</head>
<body>

<div class="contenedor">

<div class="header">
<h1>Configuración general</h1>
<p>Gestiona los datos principales del restaurante y del POS.</p>
</div>

<div class="grid">

<a class="card" href="/configuracion-restaurante">
<div class="icono">🧾</div>
<h2>Restaurante y ticket</h2>
<p>Logo, nombre comercial, NIF/CIF, dirección, email, IVA y mensaje final.</p>
</a>

<a class="card" href="/admin-productos">
<div class="icono">🍽️</div>
<h2>Productos y precios</h2>
<p>Crear productos, cambiar precios, activar o desactivar platos y bebidas.</p>
</a>

<a class="card" href="/admin-zonas-mesas">
<div class="icono">🏠</div>
<h2>Salas y mesas</h2>
<p>Crear zonas, terrazas, salones y organizar las mesas del restaurante.</p>
</a>

<a class="card" href="/admin-usuarios">
<div class="icono">👥</div>
<h2>Usuarios</h2>
<p>Crear camareros, responsables y accesos para el personal.</p>
</a>

<a class="card" href="/configuracion-restaurante">
<div class="icono">🖨️</div>
<h2>Impresoras</h2>
<p>Configurar impresora de tickets, bar y cocina.</p>
</a>

<a class="card" href="/cierre-caja">
<div class="icono">💶</div>
<h2>Caja y pagos</h2>
<p>Configurar métodos de pago, caja diaria y cierres.</p>
</a>

</div>

<a class="volver" href="/app/v2/index.html">Volver al POS</a>

</div>

</body>
</html>
`);

});


router.get("/configuracion-restaurante", requiereRol(["admin","gerente"]), (req,res)=>{

db.get(
"SELECT * FROM configurazione WHERE id=1",
[],
(err,c)=>{

if(err) return res.status(500).send(err.message);

c = c || {};

const logoPreview = c.logo
? `<img id="preview-logo" src="${escaparHTML(c.logo)}" alt="Logo restaurante">`
: `<div id="preview-vacio">Sin logo</div>`;

res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Configuración restaurante</title>
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
max-width:900px;
margin:0 auto;
}

.header{
background:#111827;
color:white;
padding:24px;
border-radius:18px;
margin-bottom:22px;
box-shadow:0 12px 28px rgba(15,23,42,.18);
}

.header h1{
margin:0;
font-size:28px;
}

.header p{
margin:8px 0 0 0;
color:#cbd5e1;
}

.card{
background:white;
border-radius:18px;
padding:24px;
box-shadow:0 12px 28px rgba(15,23,42,.10);
margin-bottom:20px;
}

.grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:18px;
}

.campo{
display:flex;
flex-direction:column;
gap:7px;
}

label{
font-weight:900;
font-size:14px;
color:#334155;
}

input, textarea{
width:100%;
padding:14px;
border:1px solid #cbd5e1;
border-radius:14px;
font-size:16px;
font-family:Arial,sans-serif;
}

textarea{
min-height:90px;
resize:vertical;
}

.logo-box{
display:grid;
grid-template-columns:260px 1fr;
gap:22px;
align-items:center;
}

.preview{
height:160px;
border:2px dashed #cbd5e1;
border-radius:18px;
display:flex;
align-items:center;
justify-content:center;
background:#f8fafc;
overflow:hidden;
}

.preview img{
max-width:220px;
max-height:130px;
object-fit:contain;
}

#preview-vacio{
color:#94a3b8;
font-weight:900;
}

.ayuda{
font-size:13px;
color:#64748b;
line-height:1.4;
margin-top:8px;
}

.botones{
display:flex;
gap:12px;
margin-top:22px;
}

button{
border:none;
border-radius:14px;
padding:15px 22px;
font-size:16px;
font-weight:900;
cursor:pointer;
}

.btn-guardar{
background:#16a34a;
color:white;
box-shadow:0 8px 18px rgba(22,163,74,.25);
}

.btn-quitar{
background:#fee2e2;
color:#991b1b;
}

.btn-ticket{
background:#2563eb;
color:white;
text-decoration:none;
display:inline-flex;
align-items:center;
justify-content:center;
border-radius:14px;
padding:15px 22px;
font-size:16px;
font-weight:900;
}

.mensaje{
display:none;
padding:15px;
border-radius:14px;
font-weight:900;
margin-top:18px;
}

.mensaje.ok{
display:block;
background:#dcfce7;
color:#166534;
border:1px solid #bbf7d0;
}

.mensaje.error{
display:block;
background:#fee2e2;
color:#991b1b;
border:1px solid #fecaca;
}

@media(max-width:750px){
.grid{
grid-template-columns:1fr;
}

.logo-box{
grid-template-columns:1fr;
}
}
</style>
</head>
<body>

<div class="contenedor">

<div class="header">
<h1>Configuración del restaurante</h1>
<p>Datos que aparecerán en la precuenta y en el ticket.</p>
</div>

<div class="card">
<h2>Logo del restaurante</h2>

<div class="logo-box">
<div class="preview" id="preview-contenedor">
${logoPreview}
</div>

<div>
<label for="logo-file">Seleccionar logo</label>
<input id="logo-file" type="file" accept="image/png,image/jpeg,image/webp">

<p class="ayuda">
El logo aparecerá arriba del ticket. Recomendado: imagen cuadrada o horizontal, fondo claro y buena calidad.
</p>

<button class="btn-quitar" type="button" onclick="quitarLogo()">
Quitar logo
</button>
</div>
</div>
</div>

<div class="card">
<h2>Datos fiscales y contacto</h2>

<div class="grid">
<div class="campo">
<label>Nombre comercial</label>
<input id="nome_ristorante" value="${escaparHTML(c.nome_ristorante || "")}">
</div>

<div class="campo">
<label>NIF / CIF</label>
<input id="partita_iva" value="${escaparHTML(c.partita_iva || "")}">
</div>

<div class="campo">
<label>Dirección</label>
<input id="indirizzo" value="${escaparHTML(c.indirizzo || "")}">
</div>

<div class="campo">
<label>Teléfono</label>
<input id="telefono" value="${escaparHTML(c.telefono || "")}">
</div>

<div class="campo">
<label>Email</label>
<input id="email" value="${escaparHTML(c.email || "")}">
</div>

<div class="campo">
<label>IVA por defecto (%)</label>
<input id="iva" type="number" step="0.01" value="${escaparHTML(c.iva || 10)}">
</div>

<div class="campo">
<label>Impresora bar</label>
<input id="stampante_bar" value="${escaparHTML(c.stampante_bar || "")}" placeholder="Opcional">
</div>

<div class="campo">
<label>Impresora cocina</label>
<input id="stampante_cucina" value="${escaparHTML(c.stampante_cucina || "")}" placeholder="Opcional">
</div>
</div>

<div class="campo" style="margin-top:18px;">
<label>Mensaje final del ticket</label>
<textarea id="mensaje_ticket">${escaparHTML(c.mensaje_ticket || "Gracias por su visita")}</textarea>
</div>

<div class="botones">
<button class="btn-guardar" type="button" onclick="guardarConfiguracion()">
Guardar configuración
</button>

<a class="btn-ticket" href="/ticket/1" target="_blank">
Ver ejemplo ticket mesa 1
</a>
</div>

<div id="mensaje" class="mensaje"></div>

</div>

</div>

<script>
let logoActual = ${JSON.stringify(c.logo || "")};

function mostrarMensaje(texto,tipo){

const mensaje = document.getElementById("mensaje");

mensaje.textContent = texto;
mensaje.className = "mensaje " + tipo;

setTimeout(()=>{
mensaje.className = "mensaje";
},3500);

}

function actualizarPreviewLogo(valor){

const contenedor = document.getElementById("preview-contenedor");

if(valor){
contenedor.innerHTML = '<img id="preview-logo" src="' + valor + '" alt="Logo restaurante">';
}else{
contenedor.innerHTML = '<div id="preview-vacio">Sin logo</div>';
}

}

function quitarLogo(){

logoActual = "";
document.getElementById("logo-file").value = "";
actualizarPreviewLogo("");

}

function redimensionarLogo(file,callback){

const lector = new FileReader();

lector.onload = function(evento){

const img = new Image();

img.onload = function(){

const maxAncho = 360;
const maxAlto = 180;

let ancho = img.width;
let alto = img.height;

const ratio = Math.min(maxAncho / ancho, maxAlto / alto, 1);

ancho = Math.round(ancho * ratio);
alto = Math.round(alto * ratio);

const canvas = document.createElement("canvas");
canvas.width = ancho;
canvas.height = alto;

const ctx = canvas.getContext("2d");
ctx.fillStyle = "white";
ctx.fillRect(0,0,ancho,alto);
ctx.drawImage(img,0,0,ancho,alto);

const dataUrl = canvas.toDataURL("image/jpeg",0.82);

callback(dataUrl);

};

img.src = evento.target.result;

};

lector.readAsDataURL(file);

}

document.getElementById("logo-file").addEventListener("change",function(){

const file = this.files[0];

if(!file){
return;
}

if(!file.type.match("image.*")){
mostrarMensaje("El archivo debe ser una imagen.","error");
return;
}

redimensionarLogo(file,function(dataUrl){

logoActual = dataUrl;
actualizarPreviewLogo(dataUrl);

});

});

async function guardarConfiguracion(){

const datos = {
nome_ristorante: document.getElementById("nome_ristorante").value,
partita_iva: document.getElementById("partita_iva").value,
indirizzo: document.getElementById("indirizzo").value,
telefono: document.getElementById("telefono").value,
email: document.getElementById("email").value,
logo: logoActual,
iva: Number(document.getElementById("iva").value || 10),
stampante_bar: document.getElementById("stampante_bar").value,
stampante_cucina: document.getElementById("stampante_cucina").value,
mensaje_ticket: document.getElementById("mensaje_ticket").value
};

try{

const respuesta = await fetch("/configurazione",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(datos)
});

if(!respuesta.ok){
throw new Error("Error guardando configuración");
}

mostrarMensaje("Configuración guardada correctamente.","ok");

}catch(error){

console.error(error);
mostrarMensaje("No se pudo guardar la configuración.","error");

}

}
</script>

</body>
</html>
`);

});

});

router.post("/configurazione", requiereRol(["admin","gerente"]), (req,res)=>{

const c=req.body;

db.run(

`UPDATE configurazione
SET
nome_ristorante=?,
partita_iva=?,
indirizzo=?,
telefono=?,
email=?,
logo=?,
iva=?,
stampante_bar=?,
stampante_cucina=?,
mensaje_ticket=?
WHERE id=1`,

[
c.nome_ristorante || "",
c.partita_iva || "",
c.indirizzo || "",
c.telefono || "",
c.email || "",
c.logo || "",
c.iva || 10,
c.stampante_bar || "",
c.stampante_cucina || "",
c.mensaje_ticket || ""
],

(err)=>{

if(err) return res.status(500).json(err);

res.json({
ok:true
});

});

});

return router;

}

module.exports=configurazioneRoutes;
