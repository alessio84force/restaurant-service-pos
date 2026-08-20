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

function textosPedidoV2(){

    const idiomaDocumento = String(
        document.documentElement.lang || "es"
    ).toLowerCase();

    const idioma = ["es","it","en","pt-br"].includes(idiomaDocumento)
        ? idiomaDocumento
        : "es";

    const textos = {
        es: {
            mesa: "Mesa",
            noPedido: "No hay pedido abierto.",
            abrirMesa: "Abrir mesa",
            ayudaAbrir: "Abre la mesa para empezar un nuevo pedido.",
            pedido: "Pedido",
            abierto: "abierto",
            cuenta: "cuenta",
            pedidoAbierto: "Pedido abierto.",
            anadirProductos: "Añade productos desde el menú.",
            cantidad: "Cantidad",
            unidad: "unidad",
            editarNota: "Editar nota",
            anadirNota: "Añadir nota",
            enviarComandas: "ENVIAR COMANDAS",
            cuentaBoton: "CUENTA",
            cobrar: "COBRAR",
            abriendo: "Abriendo mesa...",
            errorAbrir: "No se pudo abrir la mesa.",
            reintentar: "Intentar de nuevo",
            errorCantidad: "No se pudo modificar la cantidad del producto.",
            notaGuardada: "Nota guardada.",
            notaEliminada: "Nota eliminada.",
            errorGuardarNota: "No se pudo guardar la nota.",
            tituloNota: "Nota del producto",
            instruccionNota: "Escribe la petición exacta del cliente.",
            placeholderNota: "Ej. Sin cebolla, salsa aparte, alergia frutos secos...",
            maxCaracteres: "Máximo 180 caracteres",
            cancelar: "Cancelar",
            quitarNota: "Quitar nota",
            guardarNota: "Guardar nota",
            sinMesa: "No hay mesa seleccionada.",
            enviandoComandas: "Enviando comandas...",
            comandasEnviadas: "Comandas enviadas",
            sinProductosNuevos: "No hay productos nuevos para enviar.",
            errorComandas: "No se pudieron enviar las comandas.",
            destinoBar: "Bar",
            destinoCocina: "Cocina",
            conjuncionDestinos: "y",
            enviandoComandaA: "Enviando comanda a",
            sinProductosDestino: "No hay productos nuevos para enviar a",
            comandaEnviadaA: "Comanda enviada a",
            lineasEnviadas: "Líneas enviadas",
            errorComandaDestino: "No se pudo enviar la comanda a",
            productoGenerico: "Producto",
            localeFecha: "es-ES",
            comandaEtiqueta: "Comanda",
            mesaEtiqueta: "Mesa",
            pedidoEtiqueta: "Pedido",
            horaEtiqueta: "Hora",
            notaEtiqueta: "Nota",
            sinLineasNuevasDestino: "No hay líneas nuevas para enviar.",
            totalLineasEtiqueta: "Total líneas",
            imprimirPrueba: "Imprimir prueba",
            cerrarVentana: "Cerrar",
            popupVistaPreviaBloqueado: "El navegador bloqueó la vista previa. Permite ventanas emergentes para ver el ticket.",
            modoDirectoInicio: "Comanda enviada. Modo ",
            modoDirectoFin: " preparado, impresión directa en próxima fase.",
            idiomaHtmlPrecuenta: "es",
            tituloPrecuenta: "Precuenta",
            mesaPrecuenta: "Mesa",
            preparandoPrecuenta: "Preparando precuenta...",
            generandoPrecuenta: "Generando precuenta...",
            precuentaGenerada: "Precuenta generada correctamente.",
            errorTituloPrecuenta: "Error de precuenta",
            noImprimirPrecuenta: "No se pudo imprimir la precuenta",
            revisarServidorPrecuenta: "Revisa que el servidor esté funcionando.",
            noGenerarPrecuenta: "No se pudo generar la precuenta."
        },

        it: {
            mesa: "Tavolo",
            noPedido: "Nessun ordine aperto.",
            abrirMesa: "Apri tavolo",
            ayudaAbrir: "Apri il tavolo per iniziare un nuovo ordine.",
            pedido: "Ordine",
            abierto: "aperto",
            cuenta: "conto richiesto",
            pedidoAbierto: "Ordine aperto.",
            anadirProductos: "Aggiungi prodotti dal menu.",
            cantidad: "Quantità",
            unidad: "unità",
            editarNota: "Modifica nota",
            anadirNota: "Aggiungi nota",
            enviarComandas: "INVIA COMANDE",
            cuentaBoton: "CONTO",
            cobrar: "INCASSA",
            abriendo: "Apertura tavolo...",
            errorAbrir: "Impossibile aprire il tavolo.",
            reintentar: "Riprova",
            errorCantidad: "Impossibile modificare la quantità del prodotto.",
            notaGuardada: "Nota salvata.",
            notaEliminada: "Nota eliminata.",
            errorGuardarNota: "Impossibile salvare la nota.",
            tituloNota: "Nota del prodotto",
            instruccionNota: "Scrivi la richiesta esatta del cliente.",
            placeholderNota: "Es. Senza cipolla, salsa a parte, allergia alla frutta secca...",
            maxCaracteres: "Massimo 180 caratteri",
            cancelar: "Annulla",
            quitarNota: "Rimuovi nota",
            guardarNota: "Salva nota",
            sinMesa: "Nessun tavolo selezionato.",
            enviandoComandas: "Invio comande...",
            comandasEnviadas: "Comande inviate",
            sinProductosNuevos: "Nessun nuovo prodotto da inviare.",
            errorComandas: "Impossibile inviare le comande.",
            destinoBar: "Bar",
            destinoCocina: "Cucina",
            conjuncionDestinos: "e",
            enviandoComandaA: "Invio comanda a",
            sinProductosDestino: "Nessun nuovo prodotto da inviare a",
            comandaEnviadaA: "Comanda inviata a",
            lineasEnviadas: "Righe inviate",
            errorComandaDestino: "Impossibile inviare la comanda a",
            productoGenerico: "Prodotto",
            localeFecha: "it-IT",
            comandaEtiqueta: "Comanda",
            mesaEtiqueta: "Tavolo",
            pedidoEtiqueta: "Ordine",
            horaEtiqueta: "Ora",
            notaEtiqueta: "Nota",
            sinLineasNuevasDestino: "Nessuna nuova riga da inviare.",
            totalLineasEtiqueta: "Totale righe",
            imprimirPrueba: "Stampa di prova",
            cerrarVentana: "Chiudi",
            popupVistaPreviaBloqueado: "Il browser ha bloccato l'anteprima. Consenti le finestre popup per visualizzare il ticket.",
            modoDirectoInicio: "Comanda inviata. Modalità ",
            modoDirectoFin: " predisposta; la stampa diretta sarà disponibile in una fase successiva.",
            idiomaHtmlPrecuenta: "it",
            tituloPrecuenta: "Preconto",
            mesaPrecuenta: "Tavolo",
            preparandoPrecuenta: "Preparazione preconto...",
            generandoPrecuenta: "Generazione preconto...",
            precuentaGenerada: "Preconto generato correttamente.",
            errorTituloPrecuenta: "Errore preconto",
            noImprimirPrecuenta: "Impossibile generare il preconto",
            revisarServidorPrecuenta: "Controlla che il server sia in funzione.",
            noGenerarPrecuenta: "Impossibile generare il preconto."
        },

        en: {
            mesa: "Table",
            noPedido: "There is no open order.",
            abrirMesa: "Open table",
            ayudaAbrir: "Open the table to start a new order.",
            pedido: "Order",
            abierto: "open",
            cuenta: "bill requested",
            pedidoAbierto: "Order open.",
            anadirProductos: "Add products from the menu.",
            cantidad: "Quantity",
            unidad: "unit",
            editarNota: "Edit note",
            anadirNota: "Add note",
            enviarComandas: "SEND ORDERS",
            cuentaBoton: "BILL",
            cobrar: "PAY",
            abriendo: "Opening table...",
            errorAbrir: "The table could not be opened.",
            reintentar: "Try again",
            errorCantidad: "The product quantity could not be changed.",
            notaGuardada: "Note saved.",
            notaEliminada: "Note removed.",
            errorGuardarNota: "The note could not be saved.",
            tituloNota: "Product note",
            instruccionNota: "Enter the customer's exact request.",
            placeholderNota: "E.g. No onion, sauce on the side, nut allergy...",
            maxCaracteres: "Maximum 180 characters",
            cancelar: "Cancel",
            quitarNota: "Remove note",
            guardarNota: "Save note",
            sinMesa: "No table selected.",
            enviandoComandas: "Sending orders...",
            comandasEnviadas: "Orders sent",
            sinProductosNuevos: "No new products to send.",
            errorComandas: "The orders could not be sent.",
            destinoBar: "Bar",
            destinoCocina: "Kitchen",
            conjuncionDestinos: "and",
            enviandoComandaA: "Sending order to",
            sinProductosDestino: "No new products to send to",
            comandaEnviadaA: "Order sent to",
            lineasEnviadas: "Lines sent",
            errorComandaDestino: "The order could not be sent to",
            productoGenerico: "Product",
            localeFecha: "en-GB",
            comandaEtiqueta: "Order",
            mesaEtiqueta: "Table",
            pedidoEtiqueta: "Order",
            horaEtiqueta: "Time",
            notaEtiqueta: "Note",
            sinLineasNuevasDestino: "No new lines to send.",
            totalLineasEtiqueta: "Total lines",
            imprimirPrueba: "Test print",
            cerrarVentana: "Close",
            popupVistaPreviaBloqueado: "The browser blocked the preview. Allow pop-up windows to view the ticket.",
            modoDirectoInicio: "Order sent. Mode ",
            modoDirectoFin: " prepared; direct printing will be available in a later phase.",
            idiomaHtmlPrecuenta: "en",
            tituloPrecuenta: "Bill preview",
            mesaPrecuenta: "Table",
            preparandoPrecuenta: "Preparing bill preview...",
            generandoPrecuenta: "Generating bill preview...",
            precuentaGenerada: "Bill preview generated successfully.",
            errorTituloPrecuenta: "Bill preview error",
            noImprimirPrecuenta: "The bill preview could not be generated",
            revisarServidorPrecuenta: "Check that the server is running.",
            noGenerarPrecuenta: "The bill preview could not be generated."
        },

        "pt-br": {
            mesa: "Mesa",
            noPedido: "Não há comanda aberta.",
            abrirMesa: "Abrir mesa",
            ayudaAbrir: "Abra a mesa para iniciar uma nova comanda.",
            pedido: "Comanda",
            abierto: "aberta",
            cuenta: "conta solicitada",
            pedidoAbierto: "Comanda aberta.",
            anadirProductos: "Adicione produtos pelo cardápio.",
            cantidad: "Quantidade",
            unidad: "unidade",
            editarNota: "Editar observação",
            anadirNota: "Adicionar observação",
            enviarComandas: "ENVIAR COMANDAS",
            cuentaBoton: "CONTA",
            cobrar: "COBRAR",
            abriendo: "Abrindo mesa...",
            errorAbrir: "Não foi possível abrir a mesa.",
            reintentar: "Tentar novamente",
            errorCantidad: "Não foi possível alterar a quantidade do produto.",
            notaGuardada: "Observação salva.",
            notaEliminada: "Observação removida.",
            errorGuardarNota: "Não foi possível salvar a observação.",
            tituloNota: "Observação do produto",
            instruccionNota: "Digite exatamente o pedido do cliente.",
            placeholderNota: "Ex.: Sem cebola, molho à parte, alergia a castanhas...",
            maxCaracteres: "Máximo de 180 caracteres",
            cancelar: "Cancelar",
            quitarNota: "Remover observação",
            guardarNota: "Salvar observação",
            sinMesa: "Nenhuma mesa selecionada.",
            enviandoComandas: "Enviando comandas...",
            comandasEnviadas: "Comandas enviadas",
            sinProductosNuevos: "Não há novos produtos para enviar.",
            errorComandas: "Não foi possível enviar as comandas.",
            destinoBar: "Bar",
            destinoCocina: "Cozinha",
            conjuncionDestinos: "e",
            enviandoComandaA: "Enviando comanda para",
            sinProductosDestino: "Não há novos produtos para enviar para",
            comandaEnviadaA: "Comanda enviada para",
            lineasEnviadas: "Itens enviados",
            errorComandaDestino: "Não foi possível enviar a comanda para",
            productoGenerico: "Produto",
            localeFecha: "pt-BR",
            comandaEtiqueta: "Comanda",
            mesaEtiqueta: "Mesa",
            pedidoEtiqueta: "Comanda",
            horaEtiqueta: "Hora",
            notaEtiqueta: "Observação",
            sinLineasNuevasDestino: "Não há novos itens para enviar.",
            totalLineasEtiqueta: "Total de itens",
            imprimirPrueba: "Imprimir teste",
            cerrarVentana: "Fechar",
            popupVistaPreviaBloqueado: "O navegador bloqueou a visualização. Permita janelas pop-up para visualizar o comprovante.",
            modoDirectoInicio: "Comanda enviada. Modo ",
            modoDirectoFin: " preparado; a impressão direta estará disponível em uma fase posterior.",
            idiomaHtmlPrecuenta: "pt-BR",
            tituloPrecuenta: "Pré-conta",
            mesaPrecuenta: "Mesa",
            preparandoPrecuenta: "Preparando pré-conta...",
            generandoPrecuenta: "Gerando pré-conta...",
            precuentaGenerada: "Pré-conta gerada com sucesso.",
            errorTituloPrecuenta: "Erro na pré-conta",
            noImprimirPrecuenta: "Não foi possível gerar a pré-conta",
            revisarServidorPrecuenta: "Verifique se o servidor está funcionando.",
            noGenerarPrecuenta: "Não foi possível gerar a pré-conta."
        }
    };

    return textos[idioma];
}

function traducirEstadoPedidoV2(estado){

    const textos = textosPedidoV2();
    const valor = String(estado || "abierto").toLowerCase();

    if(valor === "cuenta"){
        return textos.cuenta;
    }

    if(valor === "abierto"){
        return textos.abierto;
    }

    return estado || textos.abierto;
}

async function cargarPedidoV2(numeroMesa){

    const textos = textosPedidoV2();

    const data = await apiGet("/pedido/" + numeroMesa);

    const panel = document.getElementById("panel-central");

    if(!data.pedido){

        panel.innerHTML=`

            <div class="bienvenida">

                <h2>${textos.mesa} ${numeroMesa}</h2>

                <p>${textos.noPedido}</p>

                <button class="btn-abrir-mesa-v2" onclick="abrirMesaV2(${mesaArgV2(numeroMesa)})">

                    ${textos.abrirMesa}

                </button>

                <p class="texto-ayuda-mesa-v2">

                    ${textos.ayudaAbrir}

                </p>

            </div>

        `;

        return;

    }

    let html="";

    html+=`

        <div class="pedido-header-v2">

            <div>

                <h2>${textos.mesa} ${numeroMesa}</h2>

                <p>${textos.pedido} ${data.pedido}</p>

            </div>

            <div class="pedido-estado-v2">

                ${traducirEstadoPedidoV2(data.estado || data.pedido_estado)}

            </div>

        </div>

    `;

    html+="<div id='lineas-pedido'>";

    if(!data.productos || data.productos.length === 0){

        html+=`

        <div class="pedido-vacio">

            <p>${textos.pedidoAbierto}</p>

            <p>${textos.anadirProductos}</p>

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

                    <span>${textos.cantidad}: ${p.cantidad}</span>

                    <small>${precioLinea.toFixed(2)} € / ${textos.unidad}</small>

                    ${p.nota ? '<small class="linea-nota-v2">' + escaparHtmlPedidoV2(p.nota) + '</small>' : ''}

                    <button class="btn-nota-linea-v2" onclick="editarNotaLineaV2(${p.id}, ${mesaArgV2(numeroMesa)}, '${encodeURIComponent(p.nota || "")}')">
                        📝 ${p.nota ? textos.editarNota : textos.anadirNota}
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

            <button onclick="enviarTodasComandasV2(${mesaArgV2(numeroMesa)})">

                📤 ${textos.enviarComandas}

            </button>

            <button onclick="generarPrecuenta(${mesaArgV2(numeroMesa)})">

                🧾 ${textos.cuentaBoton}

            </button>

            <button onclick="abrirCobro(${data.pedido},${data.total})">

                💰 ${textos.cobrar}

            </button>

        </div>

    `;

    panel.innerHTML=html;

}

async function abrirMesaV2(numeroMesa){

    const textos = textosPedidoV2();

    const panel = document.getElementById("panel-central");

    try{

        panel.innerHTML=`

            <div class="bienvenida">

                <h2>${textos.mesa} ${numeroMesa}</h2>

                <p>${textos.abriendo}</p>

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

                <h2>${textos.mesa} ${numeroMesa}</h2>

                <p>${textos.errorAbrir}</p>

                <button class="btn-abrir-mesa-v2" onclick="abrirMesaV2(${mesaArgV2(numeroMesa)})">

                    ${textos.reintentar}

                </button>

            </div>

        `;

    }

}

async function cambiarCantidadLineaV2(lineaId, cambio, numeroMesa){

    const textos = textosPedidoV2();

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

        mostrarToastPedidoV2(textos.errorCantidad, "error");

    }

}


async function editarNotaLineaV2(lineaId, numeroMesa, notaCodificada){

    const textos = textosPedidoV2();
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
            mostrarToastPedidoV2(textos.notaGuardada, "correcto");
        }else{
            mostrarToastPedidoV2(textos.notaEliminada, "correcto");
        }

    }catch(error){

        console.error("Error guardando nota:", error);
        mostrarToastPedidoV2(textos.errorGuardarNota, "error");

    }

}

function abrirModalNotaLineaV2(notaActual){

    const textos = textosPedidoV2();

    return new Promise((resolve)=>{

        const overlay = document.createElement("div");
        overlay.className = "modal-nota-v2";

        overlay.innerHTML = `
            <div class="modal-nota-card-v2">
                <h3>${textos.tituloNota}</h3>
                <p>${textos.instruccionNota}</p>

                <textarea id="textarea-nota-linea-v2" maxlength="180" placeholder="${textos.placeholderNota}">${escaparHtmlPedidoV2(notaActual)}</textarea>

                <div class="modal-nota-contador-v2">
                    ${textos.maxCaracteres}
                </div>

                <div class="modal-nota-acciones-v2">
                    <button type="button" class="nota-cancelar-v2">${textos.cancelar}</button>
                    <button type="button" class="nota-eliminar-v2">${textos.quitarNota}</button>
                    <button type="button" class="nota-guardar-v2">${textos.guardarNota}</button>
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



async function enviarTodasComandasV2(numeroMesa){

    const textos = textosPedidoV2();

    if(!numeroMesa){
        mostrarToastPedidoV2(textos.sinMesa, "error");
        return;
    }

    try{
        mostrarToastPedidoV2(textos.enviandoComandas, "info");

        const respuesta = await apiPost("/saas/comandas/enviar-todas/" + encodeURIComponent(numeroMesa), {});

        if(respuesta && Array.isArray(respuesta.enviados) && respuesta.enviados.length > 0){
            const destinosVisibles = respuesta.enviados.map((destino) => {
                const codigo = String(destino || "").trim().toLowerCase();

                if(codigo === "bar") return textos.destinoBar;
                if(codigo === "cocina") return textos.destinoCocina;

                return String(destino || "");
            });

            let destinosTexto = destinosVisibles.join(", ");

            if(destinosVisibles.length === 2){
                destinosTexto =
                    destinosVisibles[0] +
                    " " +
                    textos.conjuncionDestinos +
                    " " +
                    destinosVisibles[1];
            }

            mostrarToastPedidoV2(
                textos.comandasEnviadas + ": " + destinosTexto + ".",
                "correcto"
            );

            if(typeof cargarPedidoV2 === "function"){
                await cargarPedidoV2(numeroMesa);
            }else if(typeof seleccionarMesaV2 === "function"){
                await seleccionarMesaV2(numeroMesa);
            }

            return;
        }

        console.log("DEBUG enviarTodasComandasV2:", respuesta);
        mostrarToastPedidoV2(textos.sinProductosNuevos, "aviso");
    }catch(error){
        console.error("Error enviando comandas:", error);
        mostrarToastPedidoV2(textos.errorComandas, "error");
    }
}

async function enviarBar(numeroMesa){

    await enviarComandaV2(numeroMesa, "bar");

}

async function enviarCocina(numeroMesa){

    await enviarComandaV2(numeroMesa, "cocina");

}

async function enviarComandaV2(numeroMesa, destino){

    const textos = textosPedidoV2();
    const destinoCodigo = destino === "bar" ? "bar" : "cocina";

    /*
      Il valore tecnico rimane Bar/Cocina per individuare
      correttamente la configurazione della stampante.
    */
    const destinoTitulo = destinoCodigo === "bar" ? "Bar" : "Cocina";

    const destinoVisible = destinoCodigo === "bar"
        ? textos.destinoBar
        : textos.destinoCocina;
    const endpoint = "/saas/comandas/enviar/" + encodeURIComponent(destino) + "/" + encodeURIComponent(numeroMesa);

    try{

        bloquearAccionesPedidoV2(true);

        mostrarToastPedidoV2(textos.enviandoComandaA + " " + destinoVisible + "...", "info");

        const ventanaPreviewComandaV2 = window.open("", "_blank", "width=420,height=720");

        const centroImpresionComandaV2 = await obtenerCentroImpresionComandaV2();
        const configDestinoImpresionV2 = obtenerDestinoImpresionComandaV2(centroImpresionComandaV2, destinoTitulo);

        escribirVentanaPreparandoComandaV2(
            ventanaPreviewComandaV2,
            destinoTitulo,
            configDestinoImpresionV2.modo || "preview"
        );

        const respuesta = await apiPost(endpoint, {});

        const lineas = Array.isArray(respuesta.lineas) ? respuesta.lineas : [];

        if(ventanaPreviewComandaV2 && lineas.length === 0){
            ventanaPreviewComandaV2.close();
        }

        await cargarPedidoV2(numeroMesa);

        await cargarMesasV2();

        if(lineas.length === 0){

            mostrarToastPedidoV2(textos.sinProductosDestino + " " + destinoVisible + ".", "aviso");

            return;

        }

        gestionarSalidaComandaCentroImpresionV2(
            destinoTitulo,
            numeroMesa,
            lineas,
            ventanaPreviewComandaV2,
            configDestinoImpresionV2
        );

        mostrarToastPedidoV2(textos.comandaEnviadaA + " " + destinoVisible + ". " + textos.lineasEnviadas + ": " + lineas.length + ".", "correcto");

    }catch(error){

        console.error("Error enviando comanda a " + destinoCodigo + ":", error);

        bloquearAccionesPedidoV2(false);

        mostrarToastPedidoV2(textos.errorComandaDestino + " " + destinoVisible + ".", "error");

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

    const textos = textosPedidoV2();
    const destino = String(destinoTitulo || "").toUpperCase();
    const pedido = lineas && lineas.length > 0 ? (lineas[0].pedido || lineas[0].pedido_id || "") : "";
    const ahora = new Date().toLocaleString(textos.localeFecha);

    const lineasHtml = (lineas || []).map((linea)=>{
        const cantidad = Number(linea.cantidad || 0);
        const nombre = escaparHtmlComandaPreviewV2(linea.nombre || linea.producto || textos.productoGenerico);
        const nota = String(linea.nota || "").trim();

        return `
            <div class="linea-ticket">
                <div class="producto">${cantidad} x ${nombre.toUpperCase()}</div>

                ${nota ? `
                    <div class="nota-ticket">
                        &gt;&gt;&gt; ${escaparHtmlComandaPreviewV2(textos.notaEtiqueta.toUpperCase())} ${destino} &lt;&lt;&lt;<br>
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
            <div class="subtitulo">${escaparHtmlComandaPreviewV2(textos.comandaEtiqueta.toUpperCase())} ${destino}</div>
            <div class="dato">${escaparHtmlComandaPreviewV2(textos.mesaEtiqueta.toUpperCase())}: ${escaparHtmlComandaPreviewV2(numeroMesa)}</div>
            <div class="dato">${escaparHtmlComandaPreviewV2(textos.pedidoEtiqueta.toUpperCase())}: ${escaparHtmlComandaPreviewV2(pedido)}</div>
            <div class="dato">${escaparHtmlComandaPreviewV2(textos.horaEtiqueta.toUpperCase())}: ${escaparHtmlComandaPreviewV2(ahora)}</div>
        </div>

        <div class="sep"></div>

        ${lineasHtml || "<p>" + escaparHtmlComandaPreviewV2(textos.sinLineasNuevasDestino) + "</p>"}

        <div class="sep"></div>

        <div class="centro dato">${escaparHtmlComandaPreviewV2(textos.totalLineasEtiqueta.toUpperCase())}: ${(lineas || []).length}</div>
    </div>

    <div class="acciones">
        <button class="imprimir" onclick="window.print()">${escaparHtmlComandaPreviewV2(textos.imprimirPrueba)}</button>
        <button class="cerrar" onclick="window.close()">${escaparHtmlComandaPreviewV2(textos.cerrarVentana)}</button>
    </div>
</body>
</html>
    `;

    const ventana = ventanaExistente || window.open("", "_blank", "width=420,height=720");

    if(!ventana){
        alert(textos.popupVistaPreviaBloqueado);
        return;
    }

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
}


async function obtenerCentroImpresionComandaV2(){
    try{
        const respuesta = await fetch("/api/centro-impresion", {
            method: "GET",
            credentials: "same-origin"
        });

        const datos = await respuesta.json();

        if(datos && datos.ok && datos.config){
            return datos.config;
        }
    }catch(error){
        console.warn("No se pudo cargar centro de impresión:", error);
    }

    return {};
}

function obtenerDestinoImpresionComandaV2(config, destinoTitulo){
    const destino = String(destinoTitulo || "").toLowerCase();

    if(destino.includes("cocina")){
        return config.cocina || { modo:"preview" };
    }

    if(destino.includes("bar")){
        return config.bar || { modo:"preview" };
    }

    return { modo:"preview" };
}

function escribirVentanaPreparandoComandaV2(ventana, destinoTitulo, modo){
    if(!ventana){
        return;
    }

    const destino = String(destinoTitulo || "").toUpperCase();
    const modoTexto = String(modo || "preview").toUpperCase();

    ventana.document.open();
    ventana.document.write(
        "<html>" +
        "<head><meta charset='UTF-8'><title>Preparando comanda</title></head>" +
        "<body style='font-family:Arial;padding:20px;background:#f3f4f6;color:#111827;'>" +
        "<div style='max-width:360px;margin:auto;background:white;padding:20px;border-radius:16px;box-shadow:0 12px 28px rgba(0,0,0,0.12);'>" +
        "<h2 style='margin-top:0;'>Preparando comanda " + destino + "</h2>" +
        "<p><strong>Modo impresión:</strong> " + modoTexto + "</p>" +
        "<p>Un momento.</p>" +
        "</div>" +
        "</body></html>"
    );
    ventana.document.close();
}

function gestionarSalidaComandaCentroImpresionV2(destinoTitulo, numeroMesa, lineas, ventana, configDestino){
    const textos = textosPedidoV2();
    const modo = String((configDestino && configDestino.modo) || "preview");
    const nombre = String((configDestino && configDestino.nombre) || "");
    const ip = String((configDestino && configDestino.ip) || "");
    const puerto = String((configDestino && configDestino.puerto) || "");
    const destino = String(destinoTitulo || "").toUpperCase();

    if(lineas.length === 0){
        if(ventana){
            ventana.close();
        }
        return;
    }

    if(modo === "preview"){
        mostrarVistaPreviaComandaV2(destinoTitulo, numeroMesa, lineas, ventana);
        return;
    }

    if(modo === "sistema"){
        mostrarVistaPreviaComandaV2(destinoTitulo, numeroMesa, lineas, ventana);

        setTimeout(function(){
            try{
                if(ventana){
                    ventana.print();
                }
            }catch(error){
                console.warn("No se pudo abrir impresión del sistema:", error);
            }
        }, 700);

        return;
    }

    if(modo === "escpos_red" || modo === "escpos_usb"){
        if(!ventana){
            alert(textos.modoDirectoInicio + modo + textos.modoDirectoFin);
            return;
        }

        const lineasHtml = lineas.map(function(linea){
            const cantidad = Number(linea.cantidad || 0);
            const nombreProducto = String(linea.nombre || linea.producto || textos.productoGenerico).toUpperCase();
            const nota = String(linea.nota || "").trim().toUpperCase();

            return "<div style='padding:10px 0;border-bottom:1px dashed #d1d5db;'>" +
                "<strong>" + cantidad + " x " + nombreProducto + "</strong>" +
                (nota ? "<div style='margin-top:6px;padding:8px;border:2px solid #111827;color:#9a3412;font-weight:900;'>&gt;&gt;&gt; " + escaparHtmlComandaPreviewV2(textos.notaEtiqueta.toUpperCase()) + " " + destino + " &lt;&lt;&lt;<br>" + nota + "</div>" : "") +
                "</div>";
        }).join("");

        ventana.document.open();
        ventana.document.write(
            "<html>" +
            "<head><meta charset='UTF-8'><title>" + escaparHtmlComandaPreviewV2(textos.comandaEtiqueta) + " " + destino + "</title></head>" +
            "<body style='font-family:Arial;padding:20px;background:#f3f4f6;color:#111827;'>" +
            "<div style='max-width:420px;margin:auto;background:white;padding:20px;border-radius:16px;box-shadow:0 12px 28px rgba(0,0,0,0.12);'>" +
            "<h2 style='margin-top:0;'>Comanda " + destino + " enviada</h2>" +
            "<p><strong>Mesa:</strong> " + String(numeroMesa) + "</p>" +
            "<p><strong>Modo:</strong> " + modo + "</p>" +
            "<p><strong>Impresora:</strong> " + (nombre || "Sin nombre configurado") + "</p>" +
            "<p><strong>IP:</strong> " + (ip || "Sin IP") + "</p>" +
            "<p><strong>Puerto:</strong> " + (puerto || "Sin puerto") + "</p>" +
            "<div style='background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;padding:12px;border-radius:12px;font-weight:900;margin:14px 0;'>" +
            "La comanda ya se ha registrado. El POS ha intentado enviarla por " + modo + ". Si no hay impresora conectada, revisa el Terminal del servidor." +
            "</div>" +
            lineasHtml +
            "<button onclick='window.close()' style='margin-top:16px;width:100%;height:44px;border:0;border-radius:12px;background:#111827;color:white;font-weight:900;'>" + escaparHtmlComandaPreviewV2(textos.cerrarVentana) + "</button>" +
            "</div>" +
            "</body></html>"
        );
        ventana.document.close();

        return;
    }

    mostrarVistaPreviaComandaV2(destinoTitulo, numeroMesa, lineas, ventana);
}

async function generarPrecuenta(numeroMesa){

    const textos = textosPedidoV2();
    const panel = document.getElementById("panel-central");

    const ventanaTicket = window.open(
        "",
        "_blank",
        "width=420,height=700"
    );

    if(ventanaTicket){

        ventanaTicket.document.open();

        ventanaTicket.document.write(`
            <!DOCTYPE html>
            <html lang="${textos.idiomaHtmlPrecuenta}">
            <head>
                <meta charset="UTF-8">
                <title>${textos.tituloPrecuenta} - ${textos.mesaPrecuenta} ${numeroMesa}</title>

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
                    <h2>${textos.preparandoPrecuenta}</h2>
                    <p>${textos.mesaPrecuenta} ${numeroMesa}</p>
                </div>
            </body>
            </html>
        `);

        ventanaTicket.document.close();
    }

    try{

        mostrarToastPedidoV2(
            textos.generandoPrecuenta,
            "info"
        );

        try{

            await apiPost(
                "/mesa/" + numeroMesa + "/cuenta",
                {}
            );

        }catch(errorCuenta){

            console.warn(
                "La mesa puede estar ya en cuenta:",
                errorCuenta
            );
        }

        const respuestaTicket = await fetch(
            API + "/saas/ticket/" + numeroMesa,
            {
                credentials: "same-origin"
            }
        );

        if(!respuestaTicket.ok){

            throw new Error(
                textos.noGenerarPrecuenta
            );
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

            window.open(
                API + "/saas/ticket/" + numeroMesa,
                "_blank"
            );
        }

        await cargarMesasV2();
        await cargarPedidoV2(numeroMesa);

        mostrarToastPedidoV2(
            textos.precuentaGenerada,
            "correcto"
        );

    }catch(error){

        console.error(
            "Error generando precuenta:",
            error
        );

        if(ventanaTicket){

            ventanaTicket.document.open();

            ventanaTicket.document.write(`
                <!DOCTYPE html>
                <html lang="${textos.idiomaHtmlPrecuenta}">
                <head>
                    <meta charset="UTF-8">
                    <title>${textos.errorTituloPrecuenta}</title>
                </head>

                <body style="font-family:Arial,sans-serif;padding:30px;text-align:center;">
                    <h2>${textos.noImprimirPrecuenta}</h2>
                    <p>${textos.revisarServidorPrecuenta}</p>
                </body>
                </html>
            `);

            ventanaTicket.document.close();
        }

        mostrarToastPedidoV2(
            textos.noGenerarPrecuenta,
            "error"
        );
    }
}
