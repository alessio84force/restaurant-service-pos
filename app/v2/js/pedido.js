function mesaArgV2(numeroMesa){
    return JSON.stringify(String(numeroMesa)).replace(/"/g, "&quot;");
}

function escaparHtmlPedidoV2(texto){
    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function cargarPedidoV2(numeroMesa){

    const data = await apiGet("/pedido/" + numeroMesa);

    const panel = document.getElementById("panel-central");

    if(!data.pedido){

        panel.innerHTML=`

            <div class="bienvenida">

                <h2>Mesa ${numeroMesa}</h2>

                <p>No hay pedido abierto.</p>

                <button class="btn-abrir-mesa-v2" onclick="abrirMesaV2(${mesaArgV2(numeroMesa)})">

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

            const precioLinea = Number(p.precio || p.precio_unitario || 0);
            const cantidadLinea = Number(p.cantidad || 0);
            const subtotalLinea = Number(
                p.subtotal !== undefined && p.subtotal !== null ? p.subtotal :
                p.total_linea !== undefined && p.total_linea !== null ? p.total_linea :
                p.importe !== undefined && p.importe !== null ? p.importe :
                p.total !== undefined && p.total !== null ? p.total :
                precioLinea * cantidadLinea
            );

            html+=`

            <div class="linea-pedido">

                <div class="linea-info-v2">

                    <strong>${p.nombre}</strong>

                    <span>Cantidad: ${p.cantidad}</span>

                    <small>${precioLinea.toFixed(2)} € / unidad</small>

                    ${p.nota ? '<small class="linea-nota-v2">' + escaparHtmlPedidoV2(p.nota) + '</small>' : ''}

                    <button class="btn-nota-linea-v2" onclick="editarNotaLineaV2(${p.id}, ${mesaArgV2(numeroMesa)}, '${encodeURIComponent(p.nota || "")}')">
                        📝 ${p.nota ? "Editar nota" : "Añadir nota"}
                    </button>

                </div>

                <div class="linea-controles-v2">

                    <button class="btn-cantidad-v2 menos" onclick="cambiarCantidadLineaV2(${p.id}, -1, ${mesaArgV2(numeroMesa)})">

                        −

                    </button>

                    <div class="cantidad-actual-v2">

                        ${p.cantidad}

                    </div>

                    <button class="btn-cantidad-v2 mas" onclick="cambiarCantidadLineaV2(${p.id}, 1, ${mesaArgV2(numeroMesa)})">

                        +

                    </button>

                </div>

                <div class="linea-subtotal-v2">

                    ${subtotalLinea.toFixed(2)} €

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

            <button onclick="generarPrecuenta(${mesaArgV2(numeroMesa)})">

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

                <button class="btn-abrir-mesa-v2" onclick="abrirMesaV2(${mesaArgV2(numeroMesa)})">

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


async function editarNotaLineaV2(lineaId, numeroMesa, notaCodificada){

    const notaActual = decodeURIComponent(notaCodificada || "");
    const nuevaNota = await abrirModalNotaLineaV2(notaActual);

    if(nuevaNota === null){
        return;
    }

    try{

        await apiPost("/linea/" + lineaId + "/nota", {
            nota: nuevaNota
        });

        await cargarPedidoV2(numeroMesa);
        await cargarMesasV2();

        if(nuevaNota.trim()){
            mostrarToastPedidoV2("Nota guardada.", "correcto");
        }else{
            mostrarToastPedidoV2("Nota eliminada.", "correcto");
        }

    }catch(error){

        console.error("Error guardando nota:", error);
        mostrarToastPedidoV2("No se pudo guardar la nota.", "error");

    }

}

function abrirModalNotaLineaV2(notaActual){

    return new Promise((resolve)=>{

        const overlay = document.createElement("div");
        overlay.className = "modal-nota-v2";

        overlay.innerHTML = `
            <div class="modal-nota-card-v2">
                <h3>Nota del producto</h3>
                <p>Escribe la petición exacta del cliente.</p>

                <textarea id="textarea-nota-linea-v2" maxlength="180" placeholder="Ej. Sin cebolla, salsa aparte, alergia frutos secos...">${escaparHtmlPedidoV2(notaActual)}</textarea>

                <div class="modal-nota-contador-v2">
                    Máximo 180 caracteres
                </div>

                <div class="modal-nota-acciones-v2">
                    <button type="button" class="nota-cancelar-v2">Cancelar</button>
                    <button type="button" class="nota-eliminar-v2">Quitar nota</button>
                    <button type="button" class="nota-guardar-v2">Guardar nota</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const textarea = overlay.querySelector("#textarea-nota-linea-v2");

        setTimeout(()=>{
            textarea.focus();
            textarea.selectionStart = textarea.value.length;
            textarea.selectionEnd = textarea.value.length;
        }, 50);

        overlay.querySelector(".nota-cancelar-v2").addEventListener("click", ()=>{
            overlay.remove();
            resolve(null);
        });

        overlay.querySelector(".nota-eliminar-v2").addEventListener("click", ()=>{
            overlay.remove();
            resolve("");
        });

        overlay.querySelector(".nota-guardar-v2").addEventListener("click", ()=>{
            const valor = textarea.value.trim();
            overlay.remove();
            resolve(valor);
        });

        overlay.addEventListener("click", (event)=>{
            if(event.target === overlay){
                overlay.remove();
                resolve(null);
            }
        });

        textarea.addEventListener("keydown", (event)=>{
            if(event.key === "Escape"){
                overlay.remove();
                resolve(null);
            }

            if((event.metaKey || event.ctrlKey) && event.key === "Enter"){
                const valor = textarea.value.trim();
                overlay.remove();
                resolve(valor);
            }
        });

    });

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

        const ventanaPreviewComandaV2 = window.open("", "_blank", "width=420,height=720");

        if(ventanaPreviewComandaV2){
            ventanaPreviewComandaV2.document.open();
            ventanaPreviewComandaV2.document.write("<html><body style='font-family:Arial;padding:20px;'><h2>Preparando comanda...</h2><p>Un momento.</p></body></html>");
            ventanaPreviewComandaV2.document.close();
        }

        const respuesta = await apiPost(endpoint, {});

        const lineas = Array.isArray(respuesta.lineas) ? respuesta.lineas : [];

        if(ventanaPreviewComandaV2 && lineas.length === 0){
            ventanaPreviewComandaV2.close();
        }

        await cargarPedidoV2(numeroMesa);

        await cargarMesasV2();

        if(lineas.length === 0){

            mostrarToastPedidoV2("No hay productos nuevos para enviar a " + destinoTexto + ".", "aviso");

            return;

        }

        mostrarVistaPreviaComandaV2(destinoTitulo, numeroMesa, lineas, ventanaPreviewComandaV2);

        mostrarToastPedidoV2("Comanda enviada a " + destinoTitulo + ". Líneas enviadas: " + lineas.length + ".", "correcto");

    }catch(error){

        console.error("Error enviando comanda a " + destinoTexto + ":", error);

        bloquearAccionesPedidoV2(false);

        mostrarToastPedidoV2("No se pudo enviar la comanda a " + destinoTexto + ".", "error");

    }

}


function escaparHtmlComandaPreviewV2(texto){
    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function mostrarVistaPreviaComandaV2(destinoTitulo, numeroMesa, lineas, ventanaExistente){

    const destino = String(destinoTitulo || "").toUpperCase();
    const pedido = lineas && lineas.length > 0 ? (lineas[0].pedido || lineas[0].pedido_id || "") : "";
    const ahora = new Date().toLocaleString("es-ES");

    const lineasHtml = (lineas || []).map((linea)=>{
        const cantidad = Number(linea.cantidad || 0);
        const nombre = escaparHtmlComandaPreviewV2(linea.nombre || linea.producto || "Producto");
        const nota = String(linea.nota || "").trim();

        return `
            <div class="linea-ticket">
                <div class="producto">${cantidad} x ${nombre.toUpperCase()}</div>

                ${nota ? `
                    <div class="nota-ticket">
                        &gt;&gt;&gt; NOTA ${destino} &lt;&lt;&lt;<br>
                        ${escaparHtmlComandaPreviewV2(nota.toUpperCase())}
                    </div>
                ` : ""}
            </div>
        `;
    }).join("");

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Comanda ${destino} Mesa ${numeroMesa}</title>
<style>
    body{
        margin:0;
        padding:18px;
        background:#f3f4f6;
        font-family:Arial, sans-serif;
    }

    .ticket{
        width:320px;
        max-width:100%;
        margin:0 auto;
        background:#ffffff;
        color:#111827;
        padding:18px;
        border-radius:14px;
        box-shadow:0 14px 34px rgba(0,0,0,0.16);
        font-family:"Courier New", monospace;
    }

    .centro{
        text-align:center;
    }

    .titulo{
        font-size:18px;
        font-weight:900;
        margin-bottom:8px;
    }

    .subtitulo{
        font-size:15px;
        font-weight:900;
        margin-bottom:5px;
    }

    .dato{
        font-size:13px;
        margin:3px 0;
    }

    .sep{
        border-top:2px dashed #111827;
        margin:13px 0;
    }

    .linea-ticket{
        margin-bottom:13px;
    }

    .producto{
        font-size:16px;
        font-weight:900;
        line-height:1.25;
    }

    .nota-ticket{
        margin-top:6px;
        padding:8px;
        border:2px solid #111827;
        background:#fff7ed;
        color:#9a3412;
        font-size:13px;
        font-weight:900;
        line-height:1.35;
    }

    .acciones{
        width:320px;
        max-width:100%;
        margin:14px auto 0 auto;
        display:flex;
        gap:8px;
    }

    .acciones button{
        flex:1;
        min-height:42px;
        border:0;
        border-radius:10px;
        font-weight:900;
        cursor:pointer;
    }

    .imprimir{
        background:#111827;
        color:#ffffff;
    }

    .cerrar{
        background:#ffffff;
        color:#111827;
        border:1px solid #d1d5db !important;
    }

    @media print{
        body{
            background:#ffffff;
            padding:0;
        }

        .ticket{
            box-shadow:none;
            border-radius:0;
            width:100%;
        }

        .acciones{
            display:none;
        }
    }
</style>
</head>
<body>
    <div class="ticket">
        <div class="centro">
            <div class="titulo">RESTAURANT SERVICE</div>
            <div class="subtitulo">COMANDA ${destino}</div>
            <div class="dato">MESA: ${escaparHtmlComandaPreviewV2(numeroMesa)}</div>
            <div class="dato">PEDIDO: ${escaparHtmlComandaPreviewV2(pedido)}</div>
            <div class="dato">HORA: ${escaparHtmlComandaPreviewV2(ahora)}</div>
        </div>

        <div class="sep"></div>

        ${lineasHtml || "<p>No hay líneas nuevas para enviar.</p>"}

        <div class="sep"></div>

        <div class="centro dato">TOTAL LINEAS: ${(lineas || []).length}</div>
    </div>

    <div class="acciones">
        <button class="imprimir" onclick="window.print()">Imprimir prueba</button>
        <button class="cerrar" onclick="window.close()">Cerrar</button>
    </div>
</body>
</html>
    `;

    const ventana = ventanaExistente || window.open("", "_blank", "width=420,height=720");

    if(!ventana){
        alert("El navegador bloqueó la vista previa. Permite ventanas emergentes para ver el ticket.");
        return;
    }

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
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
