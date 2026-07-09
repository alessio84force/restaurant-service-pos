let mesaSeleccionada = null;

document.addEventListener("DOMContentLoaded", async ()=>{

    try{

        await cargarUsuarioTopbarV2();

        await cargarMesasV2();

        await cargarMenuV2();

        console.log("Restaurant Service POS V2 iniciado");

    }catch(error){

        console.error("Error iniciando V2:", error);

    }

});


function escaparHTMLTopbarV2(valor){

    return String(valor || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}

function formatearRolTopbarV2(rol){

    const mapa = {
        admin: "Administrador",
        gerente: "Gerente",
        camarero: "Camarero",
        cocina: "Cocina",
        bar: "Bar"
    };

    return mapa[rol] || rol || "Usuario";

}

async function cargarUsuarioTopbarV2(){

    const contenedor = document.getElementById("usuario-topbar-v2");

    if(!contenedor){
        return;
    }

    try{

        const respuesta = await fetch(API + "/usuario-actual", {
            credentials: "include"
        });

        const usuario = await respuesta.json();

        if(!usuario.autenticado){

            contenedor.innerHTML = `
                <span>Sin sesión</span>

                <a class="btn-login-v2" href="${API}/login">
                    Iniciar sesión
                </a>
            `;

            return;
        }

        const rol = String(usuario.rol || "").toLowerCase();
        const puedeConfigurar = rol === "admin" || rol === "gerente";

        contenedor.innerHTML = `
            <span>
                ${escaparHTMLTopbarV2(usuario.nombre)} · ${formatearRolTopbarV2(rol)}
            </span>

            ${puedeConfigurar ? `
                <a 
                    class="btn-configuracion-v2" 
                    href="${API}/configuracion" 
                    target="_blank"
                >
                    ⚙️ Configuración
                </a>
            ` : ""}

            <a class="btn-salir-v2" href="${API}/logout">
                Salir
            </a>
        `;

    }catch(error){

        console.error("Error cargando usuario:", error);

        contenedor.innerHTML = `
            <span>Sin sesión</span>

            <a class="btn-login-v2" href="${API}/login">
                Iniciar sesión
            </a>
        `;

    }

}

/* V2.4.1E - Sincronización automática PC ↔ móvil */
let sincronizandoPOSV2 = false;

function usuarioEstaEscribiendoPOSV2(){
    const activo = document.activeElement;

    if(!activo){
        return false;
    }

    const tag = String(activo.tagName || "").toLowerCase();

    return tag === "input" || tag === "textarea" || tag === "select";
}


function pantallaCobroAbiertaPOSV2(){
    const panelCentral = document.getElementById("panel-central");

    if(!panelCentral){
        return false;
    }

    const texto = String(panelCentral.textContent || "").toLowerCase();
    const html = String(panelCentral.innerHTML || "").toLowerCase();

    /*
      Importante:
      Antes mirábamos la variable cobroActualV2.
      Esa variable puede quedar guardada aunque ya no estemos en Cobrar.
      Eso bloqueaba la sincronización del PC.
    */

    if(texto.includes("cobro - mesa")){
        return true;
    }

    if(texto.includes("pendiente") && texto.includes("efectivo") && texto.includes("tarjeta")){
        return true;
    }

    if(html.includes("cobro-panel") || html.includes("cobro-pantalla") || html.includes("cobro-contenedor")){
        return true;
    }

    return false;
}

async function sincronizarAutomaticamentePOSV2(){
    if(sincronizandoPOSV2){
        return;
    }

    if(document.hidden){
        return;
    }

    if(usuarioEstaEscribiendoPOSV2()){
        return;
    }

    if(pantallaCobroAbiertaPOSV2()){
        return;
    }

    try{
        sincronizandoPOSV2 = true;

        if(typeof cargarMesasV2 === "function"){
            await cargarMesasV2();
        }

        let mesaActual = null;

        try{
            if(typeof mesaSeleccionada !== "undefined" && mesaSeleccionada){
                mesaActual = mesaSeleccionada;
            }
        }catch(errorMesa){
            mesaActual = null;
        }

        if(mesaActual && typeof cargarPedidoV2 === "function"){
            await cargarPedidoV2(mesaActual);
        }

        sincronizandoPOSV2 = false;
    }catch(error){
        sincronizandoPOSV2 = false;
        console.warn("Sincronización automática POS no realizada:", error.message || error);
    }
}

if(!window.__syncAutomaticoPOSV2){
    window.__syncAutomaticoPOSV2 = true;

    setInterval(sincronizarAutomaticamentePOSV2, 4000);

    document.addEventListener("visibilitychange", function(){
        if(!document.hidden){
            sincronizarAutomaticamentePOSV2();
        }
    });
}

/* V2.4.1G - Colores reales de mesas según pedidos abiertos */
async function aplicarEstadosRealesMesasPOSV2(){
    try{
        const base = typeof API !== "undefined" ? API : window.location.origin;

        const respuesta = await fetch(base + "/api/estado-mesas-real", {
            credentials: "include"
        });

        if(!respuesta.ok){
            return;
        }

        const datos = await respuesta.json();
        const mapa = {};

        (datos.estados || []).forEach(function(item){
            mapa[String(item.mesa)] = String(item.estado || "ocupada");
        });

        document.querySelectorAll(".mesa-card").forEach(function(card){
            const numeroEl = card.querySelector(".numero-mesa");
            if(!numeroEl){
                return;
            }

            const numeroMesa = String(numeroEl.textContent || "").trim();
            const estadoReal = mapa[numeroMesa];

            if(!estadoReal){
                return;
            }

            card.classList.remove("libre", "ocupada", "cuenta", "reservada");
            card.classList.add(estadoReal);

            const estadoEl = card.querySelector(".estado-mesa") ||
                             card.querySelector(".mesa-estado") ||
                             card.querySelector("small");

            if(estadoEl){
                estadoEl.textContent = estadoReal === "cuenta" ? "CUENTA" : "OCUPADA";
            }
        });
    }catch(error){
        console.warn("No se pudieron aplicar colores reales de mesas:", error.message || error);
    }
}

if(!window.__coloresRealesMesasPOSV2){
    window.__coloresRealesMesasPOSV2 = true;

    if(typeof cargarMesasV2 === "function"){
        const cargarMesasBaseV2 = cargarMesasV2;

        cargarMesasV2 = async function(){
            const resultado = await cargarMesasBaseV2.apply(this, arguments);
            await aplicarEstadosRealesMesasPOSV2();
            return resultado;
        };
    }
}

/* V2.4.1I - Sincronización visual directa de colores de mesas en PC */
let sincronizandoColoresMesasPCV2 = false;

function normalizarEstadoMesaPCV2(mesa){
    const estado = String(mesa.estado || "").toLowerCase();
    const pedidoEstado = String(mesa.pedido_estado || mesa.estado_pedido || "").toLowerCase();

    if(pedidoEstado === "cuenta" || estado === "cuenta"){
        return "cuenta";
    }

    if(pedidoEstado === "abierto" || estado === "ocupada"){
        return "ocupada";
    }

    if(estado === "reservada"){
        return "reservada";
    }

    return "libre";
}

function normalizarNumeroMesaPCV2(mesa){
    return String(
        mesa.numero ||
        mesa.nombre ||
        mesa.nombre_mesa ||
        mesa.id ||
        ""
    ).trim();
}

async function sincronizarColoresMesasPCV2(){
    if(sincronizandoColoresMesasPCV2){
        return;
    }

    if(document.hidden){
        return;
    }

    if(typeof pantallaCobroAbiertaPOSV2 === "function" && pantallaCobroAbiertaPOSV2()){
        return;
    }

    try{
        sincronizandoColoresMesasPCV2 = true;

        const base = typeof API !== "undefined" ? API : window.location.origin;

        const respuesta = await fetch(base + "/mesas", {
            credentials: "include"
        });

        if(!respuesta.ok){
            sincronizandoColoresMesasPCV2 = false;
            return;
        }

        const datos = await respuesta.json();
        const mesas = Array.isArray(datos) ? datos : (datos.mesas || []);
        const mapa = {};

        mesas.forEach(function(mesa){
            const numero = normalizarNumeroMesaPCV2(mesa);

            if(!numero){
                return;
            }

            mapa[numero] = normalizarEstadoMesaPCV2(mesa);
        });

        document.querySelectorAll(".mesa-card").forEach(function(card){
            const numeroEl = card.querySelector(".numero-mesa");

            if(!numeroEl){
                return;
            }

            const numero = String(numeroEl.textContent || "").trim();
            const estado = mapa[numero];

            if(!estado){
                return;
            }

            card.classList.remove("libre", "ocupada", "cuenta", "reservada");
            card.classList.add(estado);

            const estadoEl = card.querySelector(".estado-mesa") ||
                             card.querySelector(".mesa-estado") ||
                             card.querySelector("small");

            if(estadoEl){
                if(estado === "libre"){
                    estadoEl.textContent = "LIBRE";
                }else if(estado === "ocupada"){
                    estadoEl.textContent = "OCUPADA";
                }else if(estado === "cuenta"){
                    estadoEl.textContent = "CUENTA";
                }else if(estado === "reservada"){
                    estadoEl.textContent = "RESERVADA";
                }
            }
        });

        sincronizandoColoresMesasPCV2 = false;
    }catch(error){
        sincronizandoColoresMesasPCV2 = false;
        console.warn("No se pudieron sincronizar colores de mesas PC:", error.message || error);
    }
}

if(!window.__syncVisualColoresMesasPCV2){
    window.__syncVisualColoresMesasPCV2 = true;

    setInterval(sincronizarColoresMesasPCV2, 2000);

    document.addEventListener("visibilitychange", function(){
        if(!document.hidden){
            sincronizarColoresMesasPCV2();
        }
    });
}
