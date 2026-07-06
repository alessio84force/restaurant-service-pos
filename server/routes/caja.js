const express = require("express");
const { requiereRol } = require("../middleware/auth");

function cajaRoutes(db){

const router = express.Router();

function escaparHTML(valor){

return String(valor || "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}

function euro(valor){

return Number(valor || 0).toFixed(2).replace(".", ",") + " €";

}

function hoyISO(){

const ahora = new Date();
const year = ahora.getFullYear();
const month = String(ahora.getMonth() + 1).padStart(2, "0");
const day = String(ahora.getDate()).padStart(2, "0");

return year + "-" + month + "-" + day;

}

function mesISO(){

const ahora = new Date();
const year = ahora.getFullYear();
const month = String(ahora.getMonth() + 1).padStart(2, "0");

return year + "-" + month;

}

function normalizarMetodo(metodo){

const m = String(metodo || "").toLowerCase();

if(m.includes("efectivo")) return "efectivo";
if(m.includes("tarjeta")) return "tarjeta";

return "otros";

}

function sumarPagos(filas){

const resumen = {
efectivo:0,
tarjeta:0,
otros:0,
total:0,
pedidos:0
};

const pedidos = {};

(filas || []).forEach(p=>{

const metodo = normalizarMetodo(p.metodo);
const importe = Number(p.importe || 0);

resumen[metodo] += importe;
resumen.total += importe;

if(p.pedido_id){
pedidos[p.pedido_id] = true;
}

});

resumen.pedidos = Object.keys(pedidos).length;

return resumen;

}

function calcularResumenDia(fecha, callback){

db.get(
`
SELECT
COALESCE(SUM(total),0) AS total_ventas,
COUNT(*) AS pedidos_cerrados
FROM pedidos
WHERE estado='cerrado'
AND DATE(COALESCE(pagado_en, creado_en))=DATE(?)
`,
[fecha],
(err,pedidos)=>{

if(err) return callback(err);

db.all(
`
SELECT pedido_id, metodo, importe, fecha
FROM pagos
WHERE DATE(fecha)=DATE(?)
ORDER BY id
`,
[fecha],
(err,pagos)=>{

if(err) return callback(err);

const resumenPagos = sumarPagos(pagos);

const totalCaja = resumenPagos.total > 0
? resumenPagos.total
: Number(pedidos.total_ventas || 0);

const pedidosCaja = resumenPagos.pedidos > 0
? resumenPagos.pedidos
: Number(pedidos.pedidos_cerrados || 0);

callback(null,{
fecha:fecha,
tipo:"diario",
periodo:fecha,
total_ventas:Number(pedidos.total_ventas || 0),
pedidos_cerrados:Number(pedidos.pedidos_cerrados || 0),
efectivo:resumenPagos.efectivo,
tarjeta:resumenPagos.tarjeta,
otros:resumenPagos.otros,
total_pagos:resumenPagos.total,
total_caja:totalCaja,
pedidos_caja:pedidosCaja,
ticket_medio:pedidosCaja > 0 ? totalCaja / pedidosCaja : 0
});

});

});

}

function calcularResumenMes(mes, callback){

db.get(
`
SELECT
COALESCE(SUM(total),0) AS total_ventas,
COUNT(*) AS pedidos_cerrados
FROM pedidos
WHERE estado='cerrado'
AND strftime('%Y-%m', COALESCE(pagado_en, creado_en))=?
`,
[mes],
(err,pedidos)=>{

if(err) return callback(err);

db.all(
`
SELECT pedido_id, metodo, importe, fecha
FROM pagos
WHERE strftime('%Y-%m', fecha)=?
ORDER BY id
`,
[mes],
(err,pagos)=>{

if(err) return callback(err);

const resumenPagos = sumarPagos(pagos);

const totalCaja = resumenPagos.total > 0
? resumenPagos.total
: Number(pedidos.total_ventas || 0);

const pedidosCaja = resumenPagos.pedidos > 0
? resumenPagos.pedidos
: Number(pedidos.pedidos_cerrados || 0);

callback(null,{
fecha:mes + "-01",
tipo:"mensual",
periodo:mes,
total_ventas:Number(pedidos.total_ventas || 0),
pedidos_cerrados:Number(pedidos.pedidos_cerrados || 0),
efectivo:resumenPagos.efectivo,
tarjeta:resumenPagos.tarjeta,
otros:resumenPagos.otros,
total_pagos:resumenPagos.total,
total_caja:totalCaja,
pedidos_caja:pedidosCaja,
ticket_medio:pedidosCaja > 0 ? totalCaja / pedidosCaja : 0
});

});

});

}

function guardarCierre(resumen, callback){

db.get(
"SELECT id FROM cierres_caja WHERE tipo=? AND periodo=? ORDER BY id DESC LIMIT 1",
[resumen.tipo,resumen.periodo],
(err,cierre)=>{

if(err) return callback(err);

if(cierre){

db.run(
`
UPDATE cierres_caja
SET fecha=?,
total_ventas=?,
pedidos_cerrados=?,
ticket_medio=?,
efectivo=?,
tarjeta=?,
otros=?,
total_pagos=?,
creado_en=CURRENT_TIMESTAMP
WHERE id=?
`,
[
resumen.fecha,
resumen.total_caja,
resumen.pedidos_caja,
resumen.ticket_medio,
resumen.efectivo,
resumen.tarjeta,
resumen.otros,
resumen.total_pagos,
cierre.id
],
function(err){

if(err) return callback(err);

callback(null,{actualizado:true,id:cierre.id});

});

return;

}

db.run(
`
INSERT INTO cierres_caja
(fecha,total_ventas,pedidos_cerrados,ticket_medio,tipo,periodo,efectivo,tarjeta,otros,total_pagos)
VALUES(?,?,?,?,?,?,?,?,?,?)
`,
[
resumen.fecha,
resumen.total_caja,
resumen.pedidos_caja,
resumen.ticket_medio,
resumen.tipo,
resumen.periodo,
resumen.efectivo,
resumen.tarjeta,
resumen.otros,
resumen.total_pagos
],
function(err){

if(err) return callback(err);

callback(null,{actualizado:false,id:this.lastID});

});

});

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

router.get("/cierre-caja", requiereRol(["admin","gerente"]), (req,res)=>{
res.redirect("/configuracion-caja");
});

router.get("/configuracion-caja", requiereRol(["admin","gerente"]), (req,res)=>{

const fecha = req.query.fecha || hoyISO();
const mes = req.query.mes || mesISO();

calcularResumenDia(fecha,(err,dia)=>{

if(err) return res.status(500).send(err.message);

calcularResumenMes(mes,(err,mesResumen)=>{

if(err) return res.status(500).send(err.message);

db.all(
`
SELECT
tipo,
periodo,
fecha,
total_ventas,
pedidos_cerrados,
ticket_medio,
efectivo,
tarjeta,
otros,
total_pagos,
creado_en
FROM cierres_caja
ORDER BY creado_en DESC, id DESC
LIMIT 30
`,
[],
(err,cierres)=>{

if(err) return res.status(500).send(err.message);

db.all(
`
SELECT
strftime('%Y-%m', fecha) AS mes,
SUM(importe) AS total,
COUNT(DISTINCT pedido_id) AS pedidos
FROM pagos
GROUP BY strftime('%Y-%m', fecha)
ORDER BY mes DESC
LIMIT 12
`,
[],
(err,meses)=>{

if(err) return res.status(500).send(err.message);

const cierresHtml = (cierres || []).map(c=>{
return `
<tr>
<td>${escaparHTML(c.tipo || "diario")}</td>
<td>${escaparHTML(c.periodo || c.fecha)}</td>
<td>${euro(c.total_ventas)}</td>
<td>${Number(c.pedidos_cerrados || 0)}</td>
<td>${euro(c.ticket_medio)}</td>
<td>${euro(c.efectivo)}</td>
<td>${euro(c.tarjeta)}</td>
<td>${euro(c.otros)}</td>
<td>${escaparHTML(c.creado_en || "")}</td>
</tr>
`;
}).join("");

const mesesHtml = (meses || []).map(m=>{
const ticket = Number(m.pedidos || 0) > 0 ? Number(m.total || 0) / Number(m.pedidos || 0) : 0;

return `
<tr>
<td>${escaparHTML(m.mes)}</td>
<td>${euro(m.total)}</td>
<td>${Number(m.pedidos || 0)}</td>
<td>${euro(ticket)}</td>
</tr>
`;
}).join("");

res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Caja y pagos</title>
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
max-width:1250px;
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

.grid{
display:grid;
grid-template-columns:1fr 1fr;
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

.resumen{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:12px;
margin-bottom:18px;
}

.resumen-card{
background:#f8fafc;
border:1px solid #e2e8f0;
border-radius:16px;
padding:16px;
}

.resumen-card span{
display:block;
color:#64748b;
font-size:13px;
font-weight:900;
}

.resumen-card strong{
display:block;
font-size:25px;
margin-top:4px;
}

label{
display:block;
font-size:13px;
font-weight:900;
color:#475569;
margin-bottom:7px;
}

input{
width:100%;
border:1px solid #cbd5e1;
border-radius:13px;
padding:13px;
font-size:15px;
background:white;
}

.form-linea{
display:grid;
grid-template-columns:1fr auto;
gap:12px;
align-items:end;
margin-bottom:16px;
}

button{
border:none;
border-radius:13px;
padding:13px 16px;
font-weight:900;
font-size:14px;
cursor:pointer;
}

.btn-ver{
background:#2563eb;
color:white;
}

.btn-cerrar{
background:#16a34a;
color:white;
box-shadow:0 8px 18px rgba(22,163,74,.22);
}

.tabla-wrap{
overflow:auto;
}

table{
width:100%;
border-collapse:collapse;
font-size:14px;
}

th{
background:#111827;
color:white;
padding:11px;
text-align:left;
white-space:nowrap;
}

td{
border-bottom:1px solid #e5e7eb;
padding:10px;
white-space:nowrap;
}

tr:nth-child(even) td{
background:#f8fafc;
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
.grid{
grid-template-columns:1fr;
}

.resumen{
grid-template-columns:1fr 1fr;
}

.form-linea{
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
<h1>Caja y pagos</h1>
<p>Control diario, cierre mensual y análisis de ventas del restaurante.</p>
</div>
<a href="/configuracion">Volver a configuración</a>
</div>

${mensaje(req)}

<div class="aviso">
Para análisis real de caja usamos principalmente la tabla de pagos. Si un pedido antiguo no tiene pagos registrados, se usa el total del pedido cerrado como apoyo.
</div>

<div class="grid">

<div class="card">
<h2>Caja diaria</h2>

<form class="form-linea" method="GET" action="/configuracion-caja">
<div>
<label>Fecha</label>
<input type="date" name="fecha" value="${escaparHTML(fecha)}">
<input type="hidden" name="mes" value="${escaparHTML(mes)}">
</div>
<button class="btn-ver" type="submit">Ver día</button>
</form>

<div class="resumen">
<div class="resumen-card"><span>Total caja</span><strong>${euro(dia.total_caja)}</strong></div>
<div class="resumen-card"><span>Pedidos</span><strong>${dia.pedidos_caja}</strong></div>
<div class="resumen-card"><span>Ticket medio</span><strong>${euro(dia.ticket_medio)}</strong></div>
<div class="resumen-card"><span>Pagos registrados</span><strong>${euro(dia.total_pagos)}</strong></div>
</div>

<div class="resumen">
<div class="resumen-card"><span>Efectivo</span><strong>${euro(dia.efectivo)}</strong></div>
<div class="resumen-card"><span>Tarjeta</span><strong>${euro(dia.tarjeta)}</strong></div>
<div class="resumen-card"><span>Otros</span><strong>${euro(dia.otros)}</strong></div>
<div class="resumen-card"><span>Pedidos cerrados</span><strong>${dia.pedidos_cerrados}</strong></div>
</div>

<form method="POST" action="/configuracion-caja/cierre-diario">
<input type="hidden" name="fecha" value="${escaparHTML(fecha)}">
<button class="btn-cerrar" type="submit">Guardar cierre diario</button>
</form>
</div>

<div class="card">
<h2>Cierre mensual</h2>

<form class="form-linea" method="GET" action="/configuracion-caja">
<div>
<label>Mes</label>
<input type="month" name="mes" value="${escaparHTML(mes)}">
<input type="hidden" name="fecha" value="${escaparHTML(fecha)}">
</div>
<button class="btn-ver" type="submit">Ver mes</button>
</form>

<div class="resumen">
<div class="resumen-card"><span>Total mes</span><strong>${euro(mesResumen.total_caja)}</strong></div>
<div class="resumen-card"><span>Pedidos</span><strong>${mesResumen.pedidos_caja}</strong></div>
<div class="resumen-card"><span>Ticket medio</span><strong>${euro(mesResumen.ticket_medio)}</strong></div>
<div class="resumen-card"><span>Pagos registrados</span><strong>${euro(mesResumen.total_pagos)}</strong></div>
</div>

<div class="resumen">
<div class="resumen-card"><span>Efectivo</span><strong>${euro(mesResumen.efectivo)}</strong></div>
<div class="resumen-card"><span>Tarjeta</span><strong>${euro(mesResumen.tarjeta)}</strong></div>
<div class="resumen-card"><span>Otros</span><strong>${euro(mesResumen.otros)}</strong></div>
<div class="resumen-card"><span>Pedidos cerrados</span><strong>${mesResumen.pedidos_cerrados}</strong></div>
</div>

<form method="POST" action="/configuracion-caja/cierre-mensual">
<input type="hidden" name="mes" value="${escaparHTML(mes)}">
<button class="btn-cerrar" type="submit">Guardar cierre mensual</button>
</form>
</div>

</div>

<div class="card">
<h2>Comparativa últimos meses</h2>
<div class="tabla-wrap">
<table>
<thead>
<tr>
<th>Mes</th>
<th>Total</th>
<th>Pedidos</th>
<th>Ticket medio</th>
</tr>
</thead>
<tbody>
${mesesHtml || `<tr><td colspan="4">Todavía no hay pagos suficientes para comparar meses.</td></tr>`}
</tbody>
</table>
</div>
</div>

<div class="card">
<h2>Histórico de cierres</h2>
<div class="tabla-wrap">
<table>
<thead>
<tr>
<th>Tipo</th>
<th>Periodo</th>
<th>Total</th>
<th>Pedidos</th>
<th>Ticket medio</th>
<th>Efectivo</th>
<th>Tarjeta</th>
<th>Otros</th>
<th>Guardado</th>
</tr>
</thead>
<tbody>
${cierresHtml || `<tr><td colspan="9">Todavía no hay cierres guardados.</td></tr>`}
</tbody>
</table>
</div>
</div>

</div>

</body>
</html>
`);

});

});

});

});

});

router.post("/configuracion-caja/cierre-diario", requiereRol(["admin","gerente"]), (req,res)=>{

const fecha = req.body.fecha || hoyISO();

calcularResumenDia(fecha,(err,resumen)=>{

if(err) return res.status(500).send(err.message);

guardarCierre(resumen,(err)=>{

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-caja?fecha=" + encodeURIComponent(fecha) + "&ok=Cierre diario guardado correctamente");

});

});

});

router.post("/configuracion-caja/cierre-mensual", requiereRol(["admin","gerente"]), (req,res)=>{

const mes = req.body.mes || mesISO();

calcularResumenMes(mes,(err,resumen)=>{

if(err) return res.status(500).send(err.message);

guardarCierre(resumen,(err)=>{

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-caja?mes=" + encodeURIComponent(mes) + "&ok=Cierre mensual guardado correctamente");

});

});

});

// Compatibilidad con ruta antigua
router.post("/cierre-caja/cerrar", requiereRol(["admin","gerente"]), (req,res)=>{

const fecha = hoyISO();

calcularResumenDia(fecha,(err,resumen)=>{

if(err) return res.status(500).send(err.message);

guardarCierre(resumen,(err)=>{

if(err) return res.status(500).send(err.message);

res.redirect("/configuracion-caja?ok=Cierre diario guardado correctamente");

});

});

});

return router;

}

module.exports = cajaRoutes;
