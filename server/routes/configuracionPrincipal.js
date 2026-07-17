const express = require("express");

function escapar(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderConfiguracion(usuario) {
  const nombre = usuario && usuario.nombre ? usuario.nombre : "Usuario";
  const rol = usuario && usuario.rol ? usuario.rol : "admin";

  const cards = [
    
    {
      icono: "🎯",
      titulo: "Destinos de comanda",
      texto: "Crea destinos como Bar, Cocina, Pizzería, Parrilla o Coctelería.",
      url: "/configuracion-destinos",
      boton: "Configurar destinos"
    },
{
      icono: "🏪",
      titulo: "Restaurante y ticket",
      texto: "Datos del restaurante, logo, IVA, mensaje de ticket y datos fiscales.",
      url: "/configuracion-restaurante"
    },
    {
      icono: "🍽️",
      titulo: "Productos y precios",
      texto: "Categorías, productos, precios y destino a bar o cocina.",
      url: "/configuracion-productos"
    },
    {
      icono: "🪑",
      titulo: "Salas y mesas",
      texto: "Crea salas, zonas y mesas con la numeración que prefiera el restaurante.",
      url: "/configuracion-mesas"
    },
    {
      icono: "👥",
      titulo: "Usuarios",
      texto: "Gestiona propietarios, gerentes, camareros, cocina y bar.",
      url: "/configuracion-usuarios"
    },
    {
      icono: "🖨️",
      titulo: "Impresoras",
      texto: "Configuración de impresoras para ticket, bar y cocina.",
      url: "/configuracion-impresoras"
    },
    {
      icono: "💶",
      titulo: "Caja y pagos",
      texto: "Control diario, pagos, cierres de caja y resumen mensual.",
      url: "/configuracion-caja"
    },
    {
      icono: "💳",
      titulo: "Suscripción",
      texto: "Estado de prueba gratuita, plan actual, activación y suscripción.",
      url: "/configuracion-suscripcion"
    }
  ];

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Configuración - Restaurant Service POS</title>
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
gap:18px;
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
font-size:40px;
letter-spacing:-1px;
}

.subtitulo{
margin:8px 0 0 0;
color:#cbd5e1;
font-weight:800;
line-height:1.4;
}

.usuario{
background:rgba(255,255,255,.10);
border:1px solid rgba(255,255,255,.16);
border-radius:18px;
padding:14px 16px;
font-weight:900;
line-height:1.35;
}

.usuario span{
display:block;
color:#cbd5e1;
font-size:13px;
font-weight:800;
}

.contenedor{
max-width:1180px;
margin:0 auto;
padding:28px;
}

.grid{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:18px;
}

.card{
display:flex;
flex-direction:column;
justify-content:space-between;
min-height:190px;
background:white;
border:1px solid #e2e8f0;
border-radius:24px;
padding:24px;
text-decoration:none;
color:#111827;
box-shadow:0 14px 35px rgba(15,23,42,.08);
transition:transform .12s ease, box-shadow .12s ease;
}

.card:hover{
transform:translateY(-3px);
box-shadow:0 20px 45px rgba(15,23,42,.14);
}

.icono{
width:54px;
height:54px;
border-radius:18px;
background:#eff6ff;
display:flex;
align-items:center;
justify-content:center;
font-size:28px;
margin-bottom:18px;
}

.card h2{
margin:0;
font-size:24px;
letter-spacing:-.4px;
}

.card p{
margin:10px 0 18px 0;
color:#64748b;
font-weight:800;
line-height:1.42;
}

.entrar{
display:inline-flex;
align-items:center;
justify-content:center;
background:#111827;
color:white;
border-radius:14px;
padding:12px 14px;
font-weight:900;
}

.card.suscripcion{
border:2px solid #16a34a;
}

.card.suscripcion .icono{
background:#ecfdf5;
}

.card.suscripcion .entrar{
background:#16a34a;
}

.acciones{
display:flex;
gap:12px;
flex-wrap:wrap;
margin-top:24px;
}

.boton{
display:inline-flex;
border-radius:15px;
padding:14px 18px;
text-decoration:none;
font-weight:900;
}

.boton-oscuro{
background:#111827;
color:white;
}

.boton-claro{
background:white;
color:#111827;
border:1px solid #e2e8f0;
}

.legal{
text-align:center;
color:#64748b;
font-size:12px;
font-weight:800;
margin-top:28px;
}

@media(max-width:980px){
.grid{
grid-template-columns:repeat(2,1fr);
}
}

@media(max-width:650px){
.header,
.contenedor{
padding:20px;
}

.grid{
grid-template-columns:1fr;
}

h1{
font-size:32px;
}
}
</style>
</head>

<body>

<header class="header">
<div class="header-inner">
<div>
<div class="marca">Restaurant Service POS</div>
<h1>Configuración</h1>
<p class="subtitulo">
Panel principal para configurar el restaurante, la sala, los usuarios, la caja y la suscripción.
</p>
</div>

<div class="usuario">
${escapar(nombre)}
<span>${escapar(rol)}</span>
</div>
</div>
</header>

<main class="contenedor">

<section class="grid">
${cards.map((card) => `
<a class="card ${card.url === "/configuracion-suscripcion" ? "suscripcion" : ""}" href="${card.url}">
<div>
<div class="icono">${card.icono}</div>
<h2>${escapar(card.titulo)}</h2>
<p>${escapar(card.texto)}</p>
</div>
<div class="entrar">Entrar</div>
</a>
`).join("")}
</section>

<div class="acciones">
<a class="boton boton-oscuro" href="/app/v2/index.html">Volver al POS</a>
<a class="boton boton-claro" href="/logout">Cerrar sesión</a>
</div>

<div class="legal">
© 2026 Restaurant Service POS™. Todos los derechos reservados.
</div>

</main>


<script>
/* V2.5.0G - Card panel creador en configuracion */
(function(){
  async function insertarCardCreador(){
    try{
      if(document.getElementById("card-creador-configuracion")){
        return;
      }

      const res = await fetch("/api/creador/soy-creador", {
        credentials: "include",
        headers: {
          "Accept": "application/json"
        }
      });

      if(!res.ok){
        return;
      }

      const data = await res.json();

      if(!data || data.creador !== true){
        return;
      }

      const card = document.createElement("a");
      card.id = "card-creador-configuracion";
      if (document.querySelector('[data-rs-panel-creador="1"], a[href="/creador"]')) {
        return;
      }

      card.setAttribute("data-rs-panel-creador", "1");
      card.href = "/creador";
      card.className = "card creador";
      card.style.border = "2px solid #7c3aed";
      card.style.background = "linear-gradient(135deg,#7c3aed,#111827)";
      card.style.color = "#ffffff";
      card.style.textDecoration = "none";

      card.innerHTML = ""
        + "<div class='icono'>👑</div>"
        + "<h2>Panel creador</h2>"
        + "<p style='color:#ede9fe;'>Control interno de clientes, usuarios, pruebas gratuitas, suscripciones y pagos.</p>"
        + "<span class='entrar' style='background:#ffffff;color:#7c3aed;'>Entrar</span>";

      const contenedor =
        document.querySelector(".grid") ||
        document.querySelector(".cards") ||
        document.querySelector(".config-grid") ||
        document.querySelector("main");

      if(contenedor){
        contenedor.insertBefore(card, contenedor.firstChild);
      }
    }catch(e){
      console.warn("No se pudo insertar card creador:", e.message);
    }
  }

  document.addEventListener("DOMContentLoaded", insertarCardCreador);
  setTimeout(insertarCardCreador, 700);
})();
</script>

</body>
</html>
`;
}

module.exports = function configuracionPrincipalRoutes() {
  const router = express.Router();

  router.get("/configuracion", (req, res) => {
    if (!req.session || !req.session.usuario) {
      return res.redirect("/login");
    }

    const rol = String(req.session.usuario.rol || "").toLowerCase();

    if (rol !== "admin" && rol !== "gerente") {
      return res.redirect("/app/v2/index.html");
    }

    res.send(renderConfiguracion(req.session.usuario));
  });

  return router;
};
