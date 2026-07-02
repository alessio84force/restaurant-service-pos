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
