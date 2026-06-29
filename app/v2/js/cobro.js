let cobroActualV2 = null;

function formatearDineroCobroV2(valor){

    const numero = Number(valor || 0);

    return numero.toFixed(2).replace(".", ",") + " €";

}

function redondearImporteCobroV2(valor){

    return Math.round((Number(valor || 0)) * 100) / 100;

}

function obtenerTotalPagadoCobroV2(){

    if(!cobroActualV2 || !Array.isArray(cobroActualV2.pagos)){
        return 0;
    }

    return redondearImporteCobroV2(
        cobroActualV2.pagos.reduce((total, pago)=>{
            return total + Number(pago.importe || 0);
        }, 0)
    );

}

function formatearMetodoCobroV2(metodo){

    if(metodo === "tarjeta") return "Tarjeta";
    if(metodo === "efectivo") return "Efectivo";
    if(metodo === "bizum") return "Bizum";

    return metodo || "Pago";

}

function formatearFechaCobroV2(fecha){

    if(!fecha){
        return "";
    }

    const fechaNormalizada = String(fecha).replace(" ", "T");
    const objetoFecha = new Date(fechaNormalizada);

    if(isNaN(objetoFecha.getTime())){
        return fecha;
    }

    return objetoFecha.toLocaleString("es-ES", {
        day:"2-digit",
        month:"2-digit",
        year:"numeric",
        hour:"2-digit",
        minute:"2-digit"
    });

}

function obtenerPanelCobroV2(){

    return document.getElementById("panel-central");

}

function obtenerImporteEscritoCobroV2(){

    const input = document.getElementById("cobro-importe");

    if(!input){
        return "";
    }

    return input.value;

}

function normalizarImporteCobroV2(valor){

    if(valor === null || valor === undefined){
        return 0;
    }

    const texto = String(valor).replace(",", ".").trim();
    const numero = Number(texto);

    if(isNaN(numero)){
        return 0;
    }

    return redondearImporteCobroV2(numero);

}

async function abrirCobro(pedidoId, totalPedido){

    if(!mesaSeleccionada){

        const panel = obtenerPanelCobroV2();

        panel.innerHTML = `
            <div class="bienvenida">
                <h2>Cobro</h2>
                <p>Selecciona una mesa antes de cobrar.</p>
            </div>
        `;

        return;

    }

    cobroActualV2 = {
        pedidoId: pedidoId,
        mesa: mesaSeleccionada,
        total: redondearImporteCobroV2(totalPedido),
        pagos: [],
        pagado: 0,
        pendiente: redondearImporteCobroV2(totalPedido),
        metodo: "tarjeta",
        importeActual: null,
        mensaje: "",
        tipoMensaje: "",
        procesando: false,
        cerrando: false,
        cerrado: false
    };

    renderCargandoCobroV2();

    await cargarDatosCobroV2();

}

function renderCargandoCobroV2(){

    const panel = obtenerPanelCobroV2();

    panel.innerHTML = `
        <div class="cobro-panel">
            <div class="cobro-header">
                <div>
                    <h2>Cobro</h2>
                    <p>Cargando datos del pedido...</p>
                </div>
            </div>
        </div>
    `;

}

async function cargarDatosCobroV2(){

    if(!cobroActualV2){
        return;
    }

    try{

        const pagos = await apiGet("/pedido/" + cobroActualV2.pedidoId + "/pagos");
        const pendienteData = await apiGet("/pedido/" + cobroActualV2.pedidoId + "/pendiente");

        cobroActualV2.pagos = Array.isArray(pagos) ? pagos : [];
        cobroActualV2.pagado = obtenerTotalPagadoCobroV2();

        if(pendienteData && pendienteData.pendiente !== undefined && pendienteData.pendiente !== null){
            cobroActualV2.pendiente = redondearImporteCobroV2(pendienteData.pendiente);
        }else{
            cobroActualV2.pendiente = redondearImporteCobroV2(cobroActualV2.total - cobroActualV2.pagado);
        }

        renderCobroV2();

        if(cobroActualV2.pendiente <= 0 && !cobroActualV2.cerrando && !cobroActualV2.cerrado){
            await cerrarMesaDesdeCobroV2();
        }

    }catch(error){

        console.error("Error cargando cobro:", error);

        const panel = obtenerPanelCobroV2();

        panel.innerHTML = `
            <div class="cobro-panel">
                <div class="cobro-header">
                    <div>
                        <h2>Error en cobro</h2>
                        <p>No se pudieron cargar los datos del cobro.</p>
                    </div>
                </div>

                <div class="cobro-mensaje error">
                    Revisa que el servidor esté funcionando correctamente.
                </div>

                <button class="cobro-btn-secundario" onclick="volverAlPedidoDesdeCobroV2()">
                    Volver al pedido
                </button>
            </div>
        `;

    }

}

function renderCobroV2(){

    if(!cobroActualV2){
        return;
    }

    const panel = obtenerPanelCobroV2();

    const pendienteReal = redondearImporteCobroV2(cobroActualV2.pendiente);
    const pendienteVisible = Math.max(0, pendienteReal);
    const totalPagado = obtenerTotalPagadoCobroV2();

    const importeInput = cobroActualV2.importeActual !== null
        ? cobroActualV2.importeActual
        : pendienteVisible.toFixed(2);

    const desactivado = cobroActualV2.procesando || cobroActualV2.cerrando || pendienteVisible <= 0;

    let historialHtml = "";

    if(!cobroActualV2.pagos || cobroActualV2.pagos.length === 0){

        historialHtml = `
            <div class="cobro-historial-vacio">
                Todavía no hay pagos registrados.
            </div>
        `;

    }else{

        historialHtml = cobroActualV2.pagos.map((pago)=>{

            return `
                <div class="cobro-pago-item">
                    <div>
                        <strong>${formatearMetodoCobroV2(pago.metodo)}</strong>
                        <span>${formatearFechaCobroV2(pago.fecha)}</span>
                    </div>
                    <div>
                        ${formatearDineroCobroV2(pago.importe)}
                    </div>
                </div>
            `;

        }).join("");

    }

    let mensajeHtml = "";

    if(cobroActualV2.mensaje){

        mensajeHtml = `
            <div class="cobro-mensaje ${cobroActualV2.tipoMensaje}">
                ${cobroActualV2.mensaje}
            </div>
        `;

    }

    let avisoPendienteNegativo = "";

    if(pendienteReal < 0){

        avisoPendienteNegativo = `
            <div class="cobro-mensaje aviso">
                La cuenta tiene pagos superiores al total. La mesa se cerrará automáticamente.
            </div>
        `;

    }

    const textoBotonConfirmar = cobroActualV2.procesando
        ? "Registrando pago..."
        : "Confirmar pago";

    const textoCierre = cobroActualV2.cerrando
        ? `
            <div class="cobro-mensaje correcto">
                Pago completado. Cerrando mesa automáticamente...
            </div>
        `
        : "";

    panel.innerHTML = `
        <div class="cobro-panel">

            <div class="cobro-header">
                <div>
                    <h2>Cobro - Mesa ${cobroActualV2.mesa}</h2>
                    <p>Pedido ${cobroActualV2.pedidoId}</p>
                </div>

                <button class="cobro-btn-volver" onclick="volverAlPedidoDesdeCobroV2()">
                    ← Volver
                </button>
            </div>

            <div class="cobro-resumen">
                <div class="cobro-card">
                    <span>Total cuenta</span>
                    <strong>${formatearDineroCobroV2(cobroActualV2.total)}</strong>
                </div>

                <div class="cobro-card">
                    <span>Pagado</span>
                    <strong>${formatearDineroCobroV2(totalPagado)}</strong>
                </div>

                <div class="cobro-card pendiente">
                    <span>Pendiente</span>
                    <strong>${formatearDineroCobroV2(pendienteVisible)}</strong>
                </div>
            </div>

            ${mensajeHtml}

            ${avisoPendienteNegativo}

            ${textoCierre}

            <div class="cobro-bloque">
                <h3>Método de pago</h3>

                <div class="cobro-metodos">
                    <button class="${cobroActualV2.metodo === "tarjeta" ? "activo" : ""}" onclick="seleccionarMetodoCobroV2('tarjeta')" ${cobroActualV2.cerrando ? "disabled" : ""}>
                        💳 Tarjeta
                    </button>

                    <button class="${cobroActualV2.metodo === "efectivo" ? "activo" : ""}" onclick="seleccionarMetodoCobroV2('efectivo')" ${cobroActualV2.cerrando ? "disabled" : ""}>
                        💵 Efectivo
                    </button>

                    <button class="${cobroActualV2.metodo === "bizum" ? "activo" : ""}" onclick="seleccionarMetodoCobroV2('bizum')" ${cobroActualV2.cerrando ? "disabled" : ""}>
                        📱 Bizum
                    </button>
                </div>
            </div>

            <div class="cobro-bloque">
                <h3>Importe a cobrar</h3>

                <div class="cobro-input-row">
                    <input 
                        id="cobro-importe"
                        type="number"
                        step="0.01"
                        min="0"
                        value="${importeInput}"
                        ${desactivado ? "disabled" : ""}
                    >

                    <button class="cobro-btn-principal" onclick="confirmarPagoCobroV2()" ${desactivado ? "disabled" : ""}>
                        ${textoBotonConfirmar}
                    </button>
                </div>

                <div class="cobro-importes-rapidos">
                    <button onclick="ponerImporteCobroV2('todo')" ${desactivado ? "disabled" : ""}>Todo</button>
                    <button onclick="ponerImporteCobroV2('mitad')" ${desactivado ? "disabled" : ""}>Mitad</button>
                    <button onclick="ponerImporteCobroV2(5)" ${desactivado ? "disabled" : ""}>5 €</button>
                    <button onclick="ponerImporteCobroV2(10)" ${desactivado ? "disabled" : ""}>10 €</button>
                    <button onclick="ponerImporteCobroV2(20)" ${desactivado ? "disabled" : ""}>20 €</button>
                </div>
            </div>

            <div class="cobro-bloque">
                <h3>Pagos realizados</h3>

                <div class="cobro-historial">
                    ${historialHtml}
                </div>
            </div>

        </div>
    `;

}

function seleccionarMetodoCobroV2(metodo){

    if(!cobroActualV2 || cobroActualV2.cerrando){
        return;
    }

    cobroActualV2.importeActual = obtenerImporteEscritoCobroV2();
    cobroActualV2.metodo = metodo;
    cobroActualV2.mensaje = "";
    cobroActualV2.tipoMensaje = "";

    renderCobroV2();

}

function ponerImporteCobroV2(valor){

    if(!cobroActualV2){
        return;
    }

    const pendiente = Math.max(0, redondearImporteCobroV2(cobroActualV2.pendiente));

    let importe = 0;

    if(valor === "todo"){
        importe = pendiente;
    }else if(valor === "mitad"){
        importe = pendiente / 2;
    }else{
        importe = Math.min(Number(valor), pendiente);
    }

    cobroActualV2.importeActual = redondearImporteCobroV2(importe).toFixed(2);

    const input = document.getElementById("cobro-importe");

    if(input){
        input.value = cobroActualV2.importeActual;
    }

}

async function confirmarPagoCobroV2(){

    if(!cobroActualV2 || cobroActualV2.procesando || cobroActualV2.cerrando){
        return;
    }

    const pendiente = Math.max(0, redondearImporteCobroV2(cobroActualV2.pendiente));
    const importe = normalizarImporteCobroV2(obtenerImporteEscritoCobroV2());

    cobroActualV2.importeActual = importe.toFixed(2);

    if(pendiente <= 0){

        cobroActualV2.mensaje = "La cuenta ya está pagada. Cerrando mesa...";
        cobroActualV2.tipoMensaje = "correcto";
        renderCobroV2();

        await cerrarMesaDesdeCobroV2();

        return;

    }

    if(importe <= 0){

        cobroActualV2.mensaje = "Introduce un importe mayor que 0.";
        cobroActualV2.tipoMensaje = "error";
        renderCobroV2();

        return;

    }

    if(importe > pendiente){

        cobroActualV2.mensaje = "El importe no puede superar el pendiente.";
        cobroActualV2.tipoMensaje = "error";
        renderCobroV2();

        return;

    }

    try{

        cobroActualV2.procesando = true;
        cobroActualV2.mensaje = "";
        cobroActualV2.tipoMensaje = "";

        renderCobroV2();

        await apiPost("/pedido/" + cobroActualV2.pedidoId + "/pago", {
            metodo: cobroActualV2.metodo,
            importe: importe
        });

        cobroActualV2.procesando = false;
        cobroActualV2.importeActual = null;
        cobroActualV2.mensaje = "Pago registrado correctamente.";
        cobroActualV2.tipoMensaje = "correcto";

        await cargarDatosCobroV2();

    }catch(error){

        console.error("Error registrando pago:", error);

        cobroActualV2.procesando = false;
        cobroActualV2.mensaje = "No se pudo registrar el pago.";
        cobroActualV2.tipoMensaje = "error";

        renderCobroV2();

    }

}

async function cerrarMesaDesdeCobroV2(){

    if(!cobroActualV2 || cobroActualV2.cerrando || cobroActualV2.cerrado){
        return;
    }

    try{

        cobroActualV2.cerrando = true;
        cobroActualV2.mensaje = "Cuenta pagada. Cerrando mesa automáticamente...";
        cobroActualV2.tipoMensaje = "correcto";

        renderCobroV2();

        const mesaCerrada = cobroActualV2.mesa;
        const pedidoCerrado = cobroActualV2.pedidoId;
        const totalCerrado = cobroActualV2.total;
        const pagadoCerrado = obtenerTotalPagadoCobroV2();

        await apiPost("/cerrar-mesa/" + mesaCerrada, {});

        cobroActualV2.cerrado = true;
        cobroActualV2.cerrando = false;

        mesaSeleccionada = null;

        await cargarMesasV2();

        renderMesaCerradaCobroV2(mesaCerrada, pedidoCerrado, totalCerrado, pagadoCerrado);

    }catch(error){

        console.error("Error cerrando mesa:", error);

        cobroActualV2.cerrando = false;
        cobroActualV2.mensaje = "El pago está registrado, pero no se pudo cerrar la mesa automáticamente.";
        cobroActualV2.tipoMensaje = "error";

        renderCobroV2();

    }

}

function renderMesaCerradaCobroV2(mesa, pedido, total, pagado){

    const panel = obtenerPanelCobroV2();

    panel.innerHTML = `
        <div class="cobro-panel">
            <div class="cobro-cerrado">
                <div class="cobro-cerrado-icono">✅</div>

                <h2>Mesa ${mesa} cerrada</h2>

                <p>Pedido ${pedido} cobrado correctamente.</p>

                <div class="cobro-resumen">
                    <div class="cobro-card">
                        <span>Total cuenta</span>
                        <strong>${formatearDineroCobroV2(total)}</strong>
                    </div>

                    <div class="cobro-card">
                        <span>Total pagado</span>
                        <strong>${formatearDineroCobroV2(pagado)}</strong>
                    </div>

                    <div class="cobro-card pendiente">
                        <span>Pendiente</span>
                        <strong>0,00 €</strong>
                    </div>
                </div>

                <button class="cobro-btn-principal" onclick="imprimirTicketFinalCobroV2(${pedido})">
                    Imprimir ticket final
                </button>

                <button class="cobro-btn-secundario" onclick="mostrarInicioCobroV2()">
                    Volver a mesas
                </button>
            </div>
        </div>
    `;

}

function mostrarInicioCobroV2(){

    const panel = obtenerPanelCobroV2();

    panel.innerHTML = `
        <div class="bienvenida">
            <h2>Bienvenido</h2>
            <p>Selecciona una mesa para comenzar.</p>
        </div>
    `;

}

function volverAlPedidoDesdeCobroV2(){

    if(cobroActualV2 && cobroActualV2.mesa && !cobroActualV2.cerrado){
        cargarPedidoV2(cobroActualV2.mesa);
        return;
    }

    mostrarInicioCobroV2();

}


function imprimirTicketFinalCobroV2(pedidoId){

    if(!pedidoId){
        alert("No se encontró el pedido para imprimir el ticket final.");
        return;
    }

    window.open(API + "/ticket-final/" + pedidoId, "_blank");

}
