async function cargarPedidoV2(numeroMesa){

    const data = await apiGet("/pedido/" + numeroMesa);

    const panel = document.getElementById("panel-central");

    if(!data.pedido){

        panel.innerHTML=`

            <div class="bienvenida">

                <h2>Mesa ${numeroMesa}</h2>

                <p>No hay pedido abierto.</p>

                <button class="btn-abrir-mesa-v2" onclick="abrirMesaV2(${numeroMesa})">

                    Abrir mesa

                </button>

                <p class="texto-ayuda-mesa-v2">

                    Abre la mesa para empezar un nuevo pedido.

                </p>

            </div>

        `;

        return;

    }

    let html="";

    html+=`

        <div class="pedido-header-v2">

            <div>

                <h2>Mesa ${numeroMesa}</h2>

                <p>Pedido ${data.pedido}</p>

            </div>

            <div class="pedido-estado-v2">

                ${data.estado || "abierto"}

            </div>

        </div>

    `;

    html+="<div id='lineas-pedido'>";

    if(!data.productos || data.productos.length === 0){

        html+=`

        <div class="pedido-vacio">

            <p>Pedido abierto.</p>

            <p>Añade productos desde el menú.</p>

        </div>

        `;

    }else{

        data.productos.forEach(p=>{

            html+=`

            <div class="linea-pedido">

                <div class="linea-info-v2">

                    <strong>${p.nombre}</strong>

                    <span>Cantidad: ${p.cantidad}</span>

                    <small>${Number(p.precio).toFixed(2)} € / unidad</small>

                </div>

                <div class="linea-controles-v2">

                    <button class="btn-cantidad-v2 menos" onclick="cambiarCantidadLineaV2(${p.id}, -1, ${numeroMesa})">

                        −

                    </button>

                    <div class="cantidad-actual-v2">

                        ${p.cantidad}

                    </div>

                    <button class="btn-cantidad-v2 mas" onclick="cambiarCantidadLineaV2(${p.id}, 1, ${numeroMesa})">

                        +

                    </button>

                </div>

                <div class="linea-subtotal-v2">

                    ${Number(p.subtotal).toFixed(2)} €

                </div>

            </div>

            `;

        });

    }

    html+="</div>";

    html+=`

        <div class="total">

            ${Number(data.total).toFixed(2)} €

        </div>

        <div class="acciones">

            <button onclick="enviarBar(${numeroMesa})">

                🍺 BAR

            </button>

            <button onclick="enviarCocina(${numeroMesa})">

                👨‍🍳 COCINA

            </button>

            <button onclick="generarPrecuenta(${numeroMesa})">

                🧾 CUENTA

            </button>

            <button onclick="abrirCobro(${data.pedido},${data.total})">

                💰 COBRAR

            </button>

        </div>

    `;

    panel.innerHTML=html;

}

async function abrirMesaV2(numeroMesa){

    const panel = document.getElementById("panel-central");

    try{

        panel.innerHTML=`

            <div class="bienvenida">

                <h2>Mesa ${numeroMesa}</h2>

                <p>Abriendo mesa...</p>

            </div>

        `;

        await apiPost("/abrir-mesa/" + numeroMesa, {});

        mesaSeleccionada = numeroMesa;

        await cargarMesasV2();

        await cargarPedidoV2(numeroMesa);

    }catch(error){

        console.error("Error abriendo mesa:", error);

        panel.innerHTML=`

            <div class="bienvenida">

                <h2>Mesa ${numeroMesa}</h2>

                <p>No se pudo abrir la mesa.</p>

                <button class="btn-abrir-mesa-v2" onclick="abrirMesaV2(${numeroMesa})">

                    Intentar de nuevo

                </button>

            </div>

        `;

    }

}

async function cambiarCantidadLineaV2(lineaId, cambio, numeroMesa){

    try{

        const botones = document.querySelectorAll(".btn-cantidad-v2");

        botones.forEach(boton=>{
            boton.disabled = true;
        });

        await apiPost("/linea/" + lineaId + "/cantidad", {
            cambio: cambio
        });

        await cargarPedidoV2(numeroMesa);

        await cargarMesasV2();

    }catch(error){

        console.error("Error cambiando cantidad:", error);

        mostrarToastPedidoV2("No se pudo modificar la cantidad del producto.", "error");

    }

}

function mostrarToastPedidoV2(texto, tipo){

    const toastAnterior = document.getElementById("toast-pedido-v2");

    if(toastAnterior){
        toastAnterior.remove();
    }

    let fondo = "#2563eb";
    let color = "#ffffff";
    let icono = "ℹ️";

    if(tipo === "correcto"){
        fondo = "#16a34a";
        color = "#ffffff";
        icono = "✅";
    }

    if(tipo === "error"){
        fondo = "#dc2626";
        color = "#ffffff";
        icono = "❌";
    }

    if(tipo === "aviso"){
        fondo = "#f59e0b";
        color = "#111827";
        icono = "⚠️";
    }

    const toast = document.createElement("div");

    toast.id = "toast-pedido-v2";

    toast.innerHTML = `
        <div style="font-size:26px;line-height:1;">
            ${icono}
        </div>

        <div>
            ${texto}
        </div>
    `;

    toast.style.position = "fixed";
    toast.style.top = "24px";
    toast.style.right = "24px";
    toast.style.zIndex = "99999";
    toast.style.maxWidth = "420px";
    toast.style.minWidth = "300px";
    toast.style.background = fondo;
    toast.style.color = color;
    toast.style.padding = "18px 20px";
    toast.style.borderRadius = "18px";
    toast.style.boxShadow = "0 18px 40px rgba(15,23,42,.30)";
    toast.style.fontSize = "17px";
    toast.style.fontWeight = "900";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "14px";
    toast.style.border = "1px solid rgba(255,255,255,.25)";

    document.body.appendChild(toast);

    setTimeout(()=>{
        const toastActual = document.getElementById("toast-pedido-v2");

        if(toastActual){
            toastActual.remove();
        }
    }, 4200);

}

function bloquearAccionesPedidoV2(bloquear){

    const botones = document.querySelectorAll(".acciones button");

    botones.forEach(boton=>{

        boton.disabled = bloquear;

        if(bloquear){
            boton.style.opacity = ".55";
            boton.style.cursor = "not-allowed";
        }else{
            boton.style.opacity = "1";
            boton.style.cursor = "pointer";
        }

    });

}

async function enviarBar(numeroMesa){

    await enviarComandaV2(numeroMesa, "bar");

}

async function enviarCocina(numeroMesa){

    await enviarComandaV2(numeroMesa, "cocina");

}

async function enviarComandaV2(numeroMesa, destino){

    const destinoTexto = destino === "bar" ? "bar" : "cocina";
    const destinoTitulo = destino === "bar" ? "Bar" : "Cocina";
    const endpoint = destino === "bar"
        ? "/bar/enviar/" + numeroMesa
        : "/cocina/enviar/" + numeroMesa;

    try{

        bloquearAccionesPedidoV2(true);

        mostrarToastPedidoV2("Enviando comanda a " + destinoTitulo + "...", "info");

        const respuesta = await apiPost(endpoint, {});

        const lineas = Array.isArray(respuesta.lineas) ? respuesta.lineas : [];

        await cargarPedidoV2(numeroMesa);

        await cargarMesasV2();

        if(lineas.length === 0){

            mostrarToastPedidoV2("No hay productos nuevos para enviar a " + destinoTexto + ".", "aviso");

            return;

        }

        mostrarToastPedidoV2("Comanda enviada a " + destinoTitulo + ". Líneas enviadas: " + lineas.length + ".", "correcto");

    }catch(error){

        console.error("Error enviando comanda a " + destinoTexto + ":", error);

        bloquearAccionesPedidoV2(false);

        mostrarToastPedidoV2("No se pudo enviar la comanda a " + destinoTexto + ".", "error");

    }

}

async function generarPrecuenta(numeroMesa){

    const panel = document.getElementById("panel-central");

    const ventanaTicket = window.open("", "_blank", "width=420,height=700");

    if(ventanaTicket){

        ventanaTicket.document.open();

        ventanaTicket.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Precuenta Mesa ${numeroMesa}</title>
                <style>
                    body{
                        font-family:Arial,sans-serif;
                        padding:30px;
                        text-align:center;
                        color:#1f2937;
                    }
                    .cargando{
                        margin-top:80px;
                    }
                    .spinner{
                        width:42px;
                        height:42px;
                        border:5px solid #e5e7eb;
                        border-top:5px solid #2563eb;
                        border-radius:50%;
                        margin:0 auto 20px auto;
                        animation:girar 1s linear infinite;
                    }
                    @keyframes girar{
                        from{transform:rotate(0deg);}
                        to{transform:rotate(360deg);}
                    }
                </style>
            </head>
            <body>
                <div class="cargando">
                    <div class="spinner"></div>
                    <h2>Preparando precuenta...</h2>
                    <p>Mesa ${numeroMesa}</p>
                </div>
            </body>
            </html>
        `);

        ventanaTicket.document.close();

    }

    try{

        mostrarToastPedidoV2("Generando precuenta...", "info");

        try{

            await apiPost("/mesa/" + numeroMesa + "/cuenta", {});

        }catch(errorCuenta){

            console.warn("La mesa puede estar ya en cuenta:", errorCuenta);

        }

        const respuestaTicket = await fetch(API + "/ticket/" + numeroMesa);

        if(!respuestaTicket.ok){

            throw new Error("No se pudo generar el ticket");

        }

        const htmlTicket = await respuestaTicket.text();

        const htmlConImpresion = htmlTicket.replace(
            "</body>",
            `
            <script>
                window.addEventListener("load", function(){
                    setTimeout(function(){
                        window.print();
                    }, 400);
                });
            </script>
            </body>
            `
        );

        if(ventanaTicket){

            ventanaTicket.document.open();

            ventanaTicket.document.write(htmlConImpresion);

            ventanaTicket.document.close();

        }else{

            window.open(API + "/ticket/" + numeroMesa, "_blank");

        }

        await cargarMesasV2();

        await cargarPedidoV2(numeroMesa);

        mostrarToastPedidoV2("Precuenta generada correctamente.", "correcto");

    }catch(error){

        console.error("Error generando precuenta:", error);

        if(ventanaTicket){

            ventanaTicket.document.open();

            ventanaTicket.document.write(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Error precuenta</title>
                </head>
                <body style="font-family:Arial,sans-serif;padding:30px;text-align:center;">
                    <h2>No se pudo imprimir la precuenta</h2>
                    <p>Revisa que el servidor esté funcionando.</p>
                </body>
                </html>
            `);

            ventanaTicket.document.close();

        }

        mostrarToastPedidoV2("No se pudo generar la precuenta.", "error");

    }

}
