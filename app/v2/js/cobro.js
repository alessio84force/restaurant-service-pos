let cobroActualV2 = null;

function textosCobroV2(){

    const idiomaDocumento = String(
        document.documentElement.lang || "es"
    ).toLowerCase();

    const idioma = ["es","it","en","pt-br"].includes(idiomaDocumento)
        ? idiomaDocumento
        : "es";

    const textos = {
        es: {
            locale: "es-ES",
            cobro: "Cobro",
            seleccionaMesaAntes: "Selecciona una mesa antes de cobrar.",
            cargandoDatosPedido: "Cargando datos del pedido...",
            errorCobro: "Error en cobro",
            noCargarDatos: "No se pudieron cargar los datos del cobro.",
            revisarServidor: "Revisa que el servidor esté funcionando correctamente.",
            volverPedido: "Volver al pedido",
            tarjeta: "Tarjeta",
            efectivo: "Efectivo",
            bizum: "Bizum",
            pago: "Pago",
            sinPagos: "Todavía no hay pagos registrados.",
            pagosSuperiores: "La cuenta tiene pagos superiores al total. La mesa se cerrará automáticamente.",
            registrandoPago: "Registrando pago...",
            confirmarPago: "Confirmar pago",
            pagoCompletadoCerrando: "Pago completado. Cerrando mesa automáticamente...",
            mesa: "Mesa",
            pedido: "Pedido",
            volver: "Volver",
            totalCuenta: "Total cuenta",
            pagado: "Pagado",
            pendiente: "Pendiente",
            metodoPago: "Método de pago",
            importeCobrar: "Importe a cobrar",
            todo: "Todo",
            mitad: "Mitad",
            pagosRealizados: "Pagos realizados",
            cuentaYaPagada: "La cuenta ya está pagada. Cerrando mesa...",
            importeMayorCero: "Introduce un importe mayor que 0.",
            importeSuperaPendiente: "El importe no puede superar el pendiente.",
            pagoRegistrado: "Pago registrado correctamente.",
            noRegistrarPago: "No se pudo registrar el pago.",
            cuentaPagadaCerrando: "Cuenta pagada. Cerrando mesa automáticamente...",
            pagoRegistradoNoCierra: "El pago está registrado, pero no se pudo cerrar la mesa automáticamente.",
            cerrada: "cerrada",
            pedidoCobrado: "cobrado correctamente.",
            totalPagado: "Total pagado",
            imprimirTicketFinal: "Imprimir ticket final",
            volverMesas: "Volver a mesas",
            bienvenida: "Bienvenido",
            seleccionaMesaComenzar: "Selecciona una mesa para comenzar.",
            preparandoTicketFinal: "Preparando ticket final...",
            pedidoNoEncontradoTicketFinal: "No se encontró el pedido para imprimir el ticket final.",
            noGenerarTicketFinal: "No se pudo generar el ticket final",
            popupBloqueadoTicket:
                "El navegador ha bloqueado la ventana del ticket final. Permite las ventanas emergentes para este sitio.",
            cerrarVentanaReintentar:
                "Cierra esta ventana e inténtalo de nuevo.",
            cerrar: "Cerrar",
            rtError: "La fiscalización RT no se completó. Es necesario reintentarlo antes de cerrar la mesa.",
            rtReintentar: "Reintentar fiscalización RT",
            rtEnCurso: "Fiscalización RT en curso. No repita la operación.",
            rtVerificaDisponible: "La operación lleva más de 120 segundos. Un administrador puede iniciar una verificación manual.",
            rtAvviaVerifica: "Iniciar verificación manual",
            rtNotaVerificaPrompt: "Introduzca una nota sobre la verificación realizada:",
            rtRevisionManual: "El resultado de la fiscalización RT es incierto. Es necesaria una verificación manual antes de continuar.",
            rtDocumentoEmesso: "Confirmar documento RT emitido",
            rtDocumentoNoEmesso: "Confirmar que el documento RT NO fue emitido",
            rtDocumentoIdPrompt: "Introduzca el identificador del documento RT emitido:"
        },

        it: {
            locale: "it-IT",
            cobro: "Incasso",
            seleccionaMesaAntes: "Seleziona un tavolo prima di incassare.",
            cargandoDatosPedido: "Caricamento dati dell'ordine...",
            errorCobro: "Errore nell'incasso",
            noCargarDatos: "Impossibile caricare i dati dell'incasso.",
            revisarServidor: "Controlla che il server funzioni correttamente.",
            volverPedido: "Torna all'ordine",
            tarjeta: "Carta",
            efectivo: "Contanti",
            bizum: "Bizum",
            pago: "Pagamento",
            sinPagos: "Non ci sono ancora pagamenti registrati.",
            pagosSuperiores: "I pagamenti superano il totale del conto. Il tavolo verrà chiuso automaticamente.",
            registrandoPago: "Registrazione pagamento...",
            confirmarPago: "Conferma pagamento",
            pagoCompletadoCerrando: "Pagamento completato. Chiusura automatica del tavolo...",
            mesa: "Tavolo",
            pedido: "Ordine",
            volver: "Indietro",
            totalCuenta: "Totale conto",
            pagado: "Pagato",
            pendiente: "Residuo",
            metodoPago: "Metodo di pagamento",
            importeCobrar: "Importo da incassare",
            todo: "Tutto",
            mitad: "Metà",
            pagosRealizados: "Pagamenti effettuati",
            cuentaYaPagada: "Il conto è già pagato. Chiusura del tavolo...",
            importeMayorCero: "Inserisci un importo maggiore di 0.",
            importeSuperaPendiente: "L'importo non può superare il residuo.",
            pagoRegistrado: "Pagamento registrato correttamente.",
            noRegistrarPago: "Impossibile registrare il pagamento.",
            cuentaPagadaCerrando: "Conto pagato. Chiusura automatica del tavolo...",
            pagoRegistradoNoCierra: "Il pagamento è stato registrato, ma non è stato possibile chiudere automaticamente il tavolo.",
            cerrada: "chiuso",
            pedidoCobrado: "incassato correttamente.",
            totalPagado: "Totale pagato",
            imprimirTicketFinal: "Stampa ticket finale",
            volverMesas: "Torna ai tavoli",
            bienvenida: "Benvenuto",
            seleccionaMesaComenzar: "Seleziona un tavolo per iniziare.",
            preparandoTicketFinal: "Preparazione ticket finale...",
            pedidoNoEncontradoTicketFinal: "Ordine non trovato per stampare il ticket finale.",
            noGenerarTicketFinal: "Impossibile generare il ticket finale",
            popupBloqueadoTicket:
                "Il browser ha bloccato la finestra del ticket finale. Consenti le finestre popup per questo sito.",
            cerrarVentanaReintentar:
                "Chiudi questa finestra e riprova.",
            cerrar: "Chiudi",
            rtError: "La fiscalizzazione RT non è stata completata. È necessario riprovare prima di chiudere il tavolo.",
            rtReintentar: "Riprova fiscalizzazione RT",
            rtEnCurso: "Fiscalizzazione RT in corso. Non ripetere l'operazione.",
            rtVerificaDisponible: "L'operazione è in corso da oltre 120 secondi. Un amministratore può avviare una verifica manuale.",
            rtAvviaVerifica: "Avvia verifica manuale",
            rtNotaVerificaPrompt: "Inserisci una nota sulla verifica effettuata:",
            rtRevisionManual: "L'esito della fiscalizzazione RT è incerto. È necessaria una verifica manuale prima di continuare.",
            rtDocumentoEmesso: "Conferma documento RT emesso",
            rtDocumentoNoEmesso: "Conferma che il documento RT NON è stato emesso",
            rtDocumentoIdPrompt: "Inserisci l'identificativo del documento RT emesso:"
        },

        en: {
            locale: "en-GB",
            cobro: "Payment",
            seleccionaMesaAntes: "Select a table before taking payment.",
            cargandoDatosPedido: "Loading order details...",
            errorCobro: "Payment error",
            noCargarDatos: "Payment details could not be loaded.",
            revisarServidor: "Check that the server is running correctly.",
            volverPedido: "Back to order",
            tarjeta: "Card",
            efectivo: "Cash",
            bizum: "Bizum",
            pago: "Payment",
            sinPagos: "No payments have been recorded yet.",
            pagosSuperiores: "Payments exceed the total. The table will close automatically.",
            registrandoPago: "Recording payment...",
            confirmarPago: "Confirm payment",
            pagoCompletadoCerrando: "Payment completed. Closing table automatically...",
            mesa: "Table",
            pedido: "Order",
            volver: "Back",
            totalCuenta: "Bill total",
            pagado: "Paid",
            pendiente: "Remaining",
            metodoPago: "Payment method",
            importeCobrar: "Amount to charge",
            todo: "All",
            mitad: "Half",
            pagosRealizados: "Payments made",
            cuentaYaPagada: "The bill has already been paid. Closing table...",
            importeMayorCero: "Enter an amount greater than 0.",
            importeSuperaPendiente: "The amount cannot exceed the remaining balance.",
            pagoRegistrado: "Payment recorded successfully.",
            noRegistrarPago: "The payment could not be recorded.",
            cuentaPagadaCerrando: "Bill paid. Closing table automatically...",
            pagoRegistradoNoCierra: "The payment was recorded, but the table could not be closed automatically.",
            cerrada: "closed",
            pedidoCobrado: "paid successfully.",
            totalPagado: "Total paid",
            imprimirTicketFinal: "Print final receipt",
            volverMesas: "Back to tables",
            bienvenida: "Welcome",
            seleccionaMesaComenzar: "Select a table to get started.",
            preparandoTicketFinal: "Preparing final receipt...",
            pedidoNoEncontradoTicketFinal: "The order could not be found for printing the final receipt.",
            noGenerarTicketFinal: "The final receipt could not be generated",
            popupBloqueadoTicket:
                "The browser blocked the final receipt window. Allow pop-up windows for this site.",
            cerrarVentanaReintentar:
                "Close this window and try again.",
            cerrar: "Close",
            rtError: "RT fiscalization was not completed. It must be retried before the table can be closed.",
            rtReintentar: "Retry RT fiscalization",
            rtEnCurso: "RT fiscalization is in progress. Do not repeat the operation.",
            rtVerificaDisponible: "The operation has been running for more than 120 seconds. An administrator can start manual verification.",
            rtAvviaVerifica: "Start manual verification",
            rtNotaVerificaPrompt: "Enter a note about the verification performed:",
            rtRevisionManual: "The RT fiscalization result is uncertain. Manual verification is required before continuing.",
            rtDocumentoEmesso: "Confirm RT document issued",
            rtDocumentoNoEmesso: "Confirm RT document was NOT issued",
            rtDocumentoIdPrompt: "Enter the identifier of the issued RT document:"
        },

        "pt-br": {
            locale: "pt-BR",
            cobro: "Pagamento",
            seleccionaMesaAntes: "Selecione uma mesa antes de receber o pagamento.",
            cargandoDatosPedido: "Carregando dados da comanda...",
            errorCobro: "Erro no pagamento",
            noCargarDatos: "Não foi possível carregar os dados do pagamento.",
            revisarServidor: "Verifique se o servidor está funcionando corretamente.",
            volverPedido: "Voltar para a comanda",
            tarjeta: "Cartão",
            efectivo: "Dinheiro",
            bizum: "Bizum",
            pago: "Pagamento",
            sinPagos: "Ainda não há pagamentos registrados.",
            pagosSuperiores: "Os pagamentos superam o total da conta. A mesa será fechada automaticamente.",
            registrandoPago: "Registrando pagamento...",
            confirmarPago: "Confirmar pagamento",
            pagoCompletadoCerrando: "Pagamento concluído. Fechando a mesa automaticamente...",
            mesa: "Mesa",
            pedido: "Comanda",
            volver: "Voltar",
            totalCuenta: "Total da conta",
            pagado: "Pago",
            pendiente: "Restante",
            metodoPago: "Forma de pagamento",
            importeCobrar: "Valor a receber",
            todo: "Tudo",
            mitad: "Metade",
            pagosRealizados: "Pagamentos realizados",
            cuentaYaPagada: "A conta já foi paga. Fechando a mesa...",
            importeMayorCero: "Informe um valor maior que 0.",
            importeSuperaPendiente: "O valor não pode superar o saldo restante.",
            pagoRegistrado: "Pagamento registrado com sucesso.",
            noRegistrarPago: "Não foi possível registrar o pagamento.",
            cuentaPagadaCerrando: "Conta paga. Fechando a mesa automaticamente...",
            pagoRegistradoNoCierra: "O pagamento foi registrado, mas não foi possível fechar a mesa automaticamente.",
            cerrada: "fechada",
            pedidoCobrado: "paga com sucesso.",
            totalPagado: "Total pago",
            imprimirTicketFinal: "Imprimir comprovante final",
            volverMesas: "Voltar para as mesas",
            bienvenida: "Bem-vindo",
            seleccionaMesaComenzar: "Selecione uma mesa para começar.",
            preparandoTicketFinal: "Preparando comprovante final...",
            pedidoNoEncontradoTicketFinal: "Não foi possível encontrar a comanda para imprimir o comprovante final.",
            noGenerarTicketFinal: "Não foi possível gerar o comprovante final",
            popupBloqueadoTicket:
                "O navegador bloqueou a janela do comprovante final. Permita janelas pop-up para este site.",
            cerrarVentanaReintentar:
                "Feche esta janela e tente novamente.",
            cerrar: "Fechar",
            rtError: "A fiscalização RT não foi concluída. É necessário tentar novamente antes de fechar a mesa.",
            rtReintentar: "Tentar novamente a fiscalização RT",
            rtEnCurso: "Fiscalização RT em andamento. Não repita a operação.",
            rtVerificaDisponible: "A operação está em andamento há mais de 120 segundos. Um administrador pode iniciar uma verificação manual.",
            rtAvviaVerifica: "Iniciar verificação manual",
            rtNotaVerificaPrompt: "Informe uma nota sobre a verificação realizada:",
            rtRevisionManual: "O resultado da fiscalização RT é incerto. É necessária uma verificação manual antes de continuar.",
            rtDocumentoEmesso: "Confirmar documento RT emitido",
            rtDocumentoNoEmesso: "Confirmar que o documento RT NÃO foi emitido",
            rtDocumentoIdPrompt: "Informe o identificador do documento RT emitido:"
        }
    };

    return textos[idioma];
}


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

    const textos = textosCobroV2();

    if(metodo === "tarjeta") return textos.tarjeta;
    if(metodo === "efectivo") return textos.efectivo;
    if(metodo === "bizum") return textos.bizum;

    return metodo || textos.pago;
}

function formatearFechaCobroV2(fecha){

    if(!fecha){
        return "";
    }

    const textos = textosCobroV2();
    const fechaNormalizada = String(fecha).replace(" ", "T");
    const objetoFecha = new Date(fechaNormalizada);

    if(isNaN(objetoFecha.getTime())){
        return fecha;
    }

    return objetoFecha.toLocaleString(textos.locale, {
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

    const textos = textosCobroV2();

    if(!mesaSeleccionada){

        const panel = obtenerPanelCobroV2();

        panel.innerHTML = `
            <div class="bienvenida">
                <h2>${textos.cobro}</h2>
                <p>${textos.seleccionaMesaAntes}</p>
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
        rtEstado: "no_requerido",
        rtEnviandoDesde: null,
        rtPuedeMarcarIncerto: false,
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

function esAdminGerenteCobroV2(){

    const rol =
        String(
            window.rolUsuarioActualV2 ||
            ""
        ).toLowerCase();

    return (
        rol === "admin" ||
        rol === "gerente"
    );
}


function puedeCerrarMesaRtCobroV2(){

    if(!cobroActualV2){
        return false;
    }

    const estadoRt =
        String(
            cobroActualV2.rtEstado ||
            "no_requerido"
        ).toLowerCase();

    return (
        estadoRt === "no_requerido" ||
        estadoRt === "emitido"
    );
}


function renderCargandoCobroV2(){

    const textos = textosCobroV2();
    const panel = obtenerPanelCobroV2();

    panel.innerHTML = `
        <div class="cobro-panel">
            <div class="cobro-header">
                <div>
                    <h2>${textos.cobro}</h2>
                    <p>${textos.cargandoDatosPedido}</p>
                </div>
            </div>
        </div>
    `;
}

async function cargarDatosCobroV2(){

    if(!cobroActualV2){
        return;
    }

    const textos = textosCobroV2();

    try{

        const pagos = await apiGet(
            "/pedido/" +
            cobroActualV2.pedidoId +
            "/pagos"
        );

        const pendienteData = await apiGet(
            "/pedido/" +
            cobroActualV2.pedidoId +
            "/pendiente"
        );

        cobroActualV2.pagos = Array.isArray(pagos)
            ? pagos
            : [];

        cobroActualV2.pagado =
            obtenerTotalPagadoCobroV2();

        if(
            pendienteData &&
            pendienteData.pendiente !== undefined &&
            pendienteData.pendiente !== null
        ){
            cobroActualV2.pendiente =
                redondearImporteCobroV2(
                    pendienteData.pendiente
                );
        }else{
            cobroActualV2.pendiente =
                redondearImporteCobroV2(
                    cobroActualV2.total -
                    cobroActualV2.pagado
                );
        }

        cobroActualV2.rtEstado =
            pendienteData &&
            pendienteData.rt_estado
                ? String(
                    pendienteData.rt_estado
                )
                : "no_requerido";

        cobroActualV2.rtEnviandoDesde =
            pendienteData &&
            pendienteData.rt_enviando_desde
                ? String(
                    pendienteData.rt_enviando_desde
                )
                : null;

        cobroActualV2.rtPuedeMarcarIncerto =
            !!(
                pendienteData &&
                pendienteData.rt_puede_marcar_incerto === true
            );

        renderCobroV2();

        if(
            cobroActualV2.pendiente <= 0 &&
            !cobroActualV2.cerrando &&
            !cobroActualV2.cerrado &&
            puedeCerrarMesaRtCobroV2()
        ){
            await cerrarMesaDesdeCobroV2();
        }

    }catch(error){

        console.error(
            "Error cargando cobro:",
            error
        );

        const panel = obtenerPanelCobroV2();

        panel.innerHTML = `
            <div class="cobro-panel">
                <div class="cobro-header">
                    <div>
                        <h2>${textos.errorCobro}</h2>
                        <p>${textos.noCargarDatos}</p>
                    </div>
                </div>

                <div class="cobro-mensaje error">
                    ${textos.revisarServidor}
                </div>

                <button
                    class="cobro-btn-secundario"
                    onclick="volverAlPedidoDesdeCobroV2()"
                >
                    ${textos.volverPedido}
                </button>
            </div>
        `;
    }
}

function renderCobroV2(){

    if(!cobroActualV2){
        return;
    }

    const textos = textosCobroV2();
    const panel = obtenerPanelCobroV2();

    const pendienteReal =
        redondearImporteCobroV2(
            cobroActualV2.pendiente
        );

    const pendienteVisible =
        Math.max(0, pendienteReal);

    const totalPagado =
        obtenerTotalPagadoCobroV2();

    const importeInput =
        cobroActualV2.importeActual !== null
            ? cobroActualV2.importeActual
            : pendienteVisible.toFixed(2);

    const desactivado =
        cobroActualV2.procesando ||
        cobroActualV2.cerrando ||
        pendienteVisible <= 0;

    let historialHtml = "";

    if(
        !cobroActualV2.pagos ||
        cobroActualV2.pagos.length === 0
    ){
        historialHtml = `
            <div class="cobro-historial-vacio">
                ${textos.sinPagos}
            </div>
        `;
    }else{
        historialHtml = cobroActualV2.pagos
            .map((pago)=>{
                return `
                    <div class="cobro-pago-item">
                        <div>
                            <strong>
                                ${formatearMetodoCobroV2(
                                    pago.metodo
                                )}
                            </strong>

                            <span>
                                ${formatearFechaCobroV2(
                                    pago.fecha
                                )}
                            </span>
                        </div>

                        <div>
                            ${formatearDineroCobroV2(
                                pago.importe
                            )}
                        </div>
                    </div>
                `;
            })
            .join("");
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
                ${textos.pagosSuperiores}
            </div>
        `;
    }

    const textoBotonConfirmar =
        cobroActualV2.procesando
            ? textos.registrandoPago
            : textos.confirmarPago;

    const textoCierre =
        cobroActualV2.cerrando
            ? `
                <div class="cobro-mensaje correcto">
                    ${textos.pagoCompletadoCerrando}
                </div>
            `
            : "";

    let rtHtml = "";

    if(
        pendienteVisible <= 0 &&
        cobroActualV2.cerrado !== true
    ){

        if(cobroActualV2.rtEstado === "error"){

            rtHtml = `
                <div class="cobro-mensaje error">
                    ${textos.rtError}
                </div>

                ${
                    esAdminGerenteCobroV2()
                        ? `
                            <button
                                class="cobro-btn-principal"
                                onclick="reintentarFiscalizacionRtCobroV2()"
                                ${cobroActualV2.procesando ? "disabled" : ""}
                            >
                                ${textos.rtReintentar}
                            </button>
                        `
                        : ""
                }
            `;

        }else if(
            cobroActualV2.rtEstado === "enviando"
        ){

            rtHtml = `
                <div class="cobro-mensaje info">
                    ${textos.rtEnCurso}
                </div>

                ${
                    cobroActualV2.rtPuedeMarcarIncerto === true &&
                    esAdminGerenteCobroV2()
                        ? `
                            <div class="cobro-mensaje info">
                                ${textos.rtVerificaDisponible}
                            </div>

                            <button
                                class="cobro-btn-secundario"
                                onclick="marcarRtIncertoCobroV2()"
                                ${cobroActualV2.procesando ? "disabled" : ""}
                            >
                                ${textos.rtAvviaVerifica}
                            </button>
                        `
                        : ""
                }
            `;

        }else if(
            cobroActualV2.rtEstado === "incerto"
        ){

            rtHtml = `
                <div class="cobro-mensaje error">
                    ${textos.rtRevisionManual}
                </div>

                ${
                    esAdminGerenteCobroV2()
                        ? `
                            <button
                                class="cobro-btn-principal"
                                onclick="confirmarRtEmitidoCobroV2()"
                                ${cobroActualV2.procesando ? "disabled" : ""}
                            >
                                ${textos.rtDocumentoEmesso}
                            </button>

                            <button
                                class="cobro-btn-secundario"
                                onclick="confirmarRtNoEmitidoCobroV2()"
                                ${cobroActualV2.procesando ? "disabled" : ""}
                            >
                                ${textos.rtDocumentoNoEmesso}
                            </button>
                        `
                        : ""
                }
            `;

        }
    }

    panel.innerHTML = `
        <div class="cobro-panel">

            <div class="cobro-header">
                <div>
                    <h2>
                        ${textos.cobro} -
                        ${textos.mesa}
                        ${cobroActualV2.mesa}
                    </h2>

                    <p>
                        ${textos.pedido}
                        ${cobroActualV2.pedidoId}
                    </p>
                </div>

                <button
                    class="cobro-btn-volver"
                    onclick="volverAlPedidoDesdeCobroV2()"
                >
                    ← ${textos.volver}
                </button>
            </div>

            <div class="cobro-resumen">
                <div class="cobro-card">
                    <span>${textos.totalCuenta}</span>

                    <strong>
                        ${formatearDineroCobroV2(
                            cobroActualV2.total
                        )}
                    </strong>
                </div>

                <div class="cobro-card">
                    <span>${textos.pagado}</span>

                    <strong>
                        ${formatearDineroCobroV2(
                            totalPagado
                        )}
                    </strong>
                </div>

                <div class="cobro-card pendiente">
                    <span>${textos.pendiente}</span>

                    <strong>
                        ${formatearDineroCobroV2(
                            pendienteVisible
                        )}
                    </strong>
                </div>
            </div>

            ${mensajeHtml}
            ${avisoPendienteNegativo}
            ${textoCierre}
            ${rtHtml}

            <div class="cobro-bloque">
                <h3>${textos.metodoPago}</h3>

                <div class="cobro-metodos">
                    <button
                        class="${
                            cobroActualV2.metodo === "tarjeta"
                                ? "activo"
                                : ""
                        }"
                        onclick="seleccionarMetodoCobroV2('tarjeta')"
                        ${cobroActualV2.cerrando ? "disabled" : ""}
                    >
                        💳 ${textos.tarjeta}
                    </button>

                    <button
                        class="${
                            cobroActualV2.metodo === "efectivo"
                                ? "activo"
                                : ""
                        }"
                        onclick="seleccionarMetodoCobroV2('efectivo')"
                        ${cobroActualV2.cerrando ? "disabled" : ""}
                    >
                        💵 ${textos.efectivo}
                    </button>

                    <button
                        class="${
                            cobroActualV2.metodo === "bizum"
                                ? "activo"
                                : ""
                        }"
                        onclick="seleccionarMetodoCobroV2('bizum')"
                        ${cobroActualV2.cerrando ? "disabled" : ""}
                    >
                        📱 ${textos.bizum}
                    </button>
                </div>
            </div>

            <div class="cobro-bloque">
                <h3>${textos.importeCobrar}</h3>

                <div class="cobro-input-row">
                    <input
                        id="cobro-importe"
                        type="number"
                        step="0.01"
                        min="0"
                        value="${importeInput}"
                        ${desactivado ? "disabled" : ""}
                    >

                    <button
                        class="cobro-btn-principal"
                        onclick="confirmarPagoCobroV2()"
                        ${desactivado ? "disabled" : ""}
                    >
                        ${textoBotonConfirmar}
                    </button>
                </div>

                <div class="cobro-importes-rapidos">
                    <button
                        onclick="ponerImporteCobroV2('todo')"
                        ${desactivado ? "disabled" : ""}
                    >
                        ${textos.todo}
                    </button>

                    <button
                        onclick="ponerImporteCobroV2('mitad')"
                        ${desactivado ? "disabled" : ""}
                    >
                        ${textos.mitad}
                    </button>

                    <button
                        onclick="ponerImporteCobroV2(5)"
                        ${desactivado ? "disabled" : ""}
                    >
                        5 €
                    </button>

                    <button
                        onclick="ponerImporteCobroV2(10)"
                        ${desactivado ? "disabled" : ""}
                    >
                        10 €
                    </button>

                    <button
                        onclick="ponerImporteCobroV2(20)"
                        ${desactivado ? "disabled" : ""}
                    >
                        20 €
                    </button>
                </div>
            </div>

            <div class="cobro-bloque">
                <h3>${textos.pagosRealizados}</h3>

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

    if(
        !cobroActualV2 ||
        cobroActualV2.procesando ||
        cobroActualV2.cerrando
    ){
        return;
    }

    const textos = textosCobroV2();

    const pendiente = Math.max(
        0,
        redondearImporteCobroV2(
            cobroActualV2.pendiente
        )
    );

    const importe = normalizarImporteCobroV2(
        obtenerImporteEscritoCobroV2()
    );

    cobroActualV2.importeActual =
        importe.toFixed(2);

    if(pendiente <= 0){

        cobroActualV2.mensaje =
            textos.cuentaYaPagada;

        cobroActualV2.tipoMensaje =
            "correcto";

        renderCobroV2();

        if(
            puedeCerrarMesaRtCobroV2()
        ){
            await cerrarMesaDesdeCobroV2();
        }

        return;
    }

    if(importe <= 0){

        cobroActualV2.mensaje =
            textos.importeMayorCero;

        cobroActualV2.tipoMensaje =
            "error";

        renderCobroV2();

        return;
    }

    if(importe > pendiente){

        cobroActualV2.mensaje =
            textos.importeSuperaPendiente;

        cobroActualV2.tipoMensaje =
            "error";

        renderCobroV2();

        return;
    }

    try{

        cobroActualV2.procesando = true;
        cobroActualV2.mensaje = "";
        cobroActualV2.tipoMensaje = "";

        renderCobroV2();

        await apiPost(
            "/pedido/" +
            cobroActualV2.pedidoId +
            "/pago",
            {
                metodo: cobroActualV2.metodo,
                importe: importe
            }
        );

        cobroActualV2.procesando = false;
        cobroActualV2.importeActual = null;
        cobroActualV2.mensaje =
            textos.pagoRegistrado;

        cobroActualV2.tipoMensaje =
            "correcto";

        await cargarDatosCobroV2();

    }catch(error){

        console.error(
            "Error registrando pago:",
            error
        );

        cobroActualV2.procesando = false;
        cobroActualV2.mensaje =
            textos.noRegistrarPago;

        cobroActualV2.tipoMensaje =
            "error";

        renderCobroV2();
    }
}

async function confirmarRtNoEmitidoCobroV2(){

    if(
        !cobroActualV2 ||
        !cobroActualV2.pedidoId ||
        cobroActualV2.procesando ||
        !esAdminGerenteCobroV2()
    ){
        return;
    }

    if(
        cobroActualV2.pendiente > 0.005 ||
        cobroActualV2.rtEstado !== "incerto"
    ){
        return;
    }

    const textos =
        textosCobroV2();

    const conferma =
        window.confirm(
            textos.rtDocumentoNoEmesso + "?"
        );

    if(!conferma){
        return;
    }

    const nota =
        String(
            window.prompt(
                textos.rtNotaVerificaPrompt
            ) || ""
        ).trim();

    if(!nota){
        return;
    }

    cobroActualV2.procesando = true;
    cobroActualV2.mensaje = "";
    cobroActualV2.tipoMensaje = "";

    renderCobroV2();

    try{

        const risposta =
            await apiPost(
                "/pedido/" +
                cobroActualV2.pedidoId +
                "/rt/confirmar-no-emitido",
                {
                    nota: nota
                }
            );

        cobroActualV2.procesando = false;

        if(
            risposta &&
            risposta.estado
        ){
            cobroActualV2.rtEstado =
                String(
                    risposta.estado
                );
        }

        cobroActualV2.cerrado = false;
        cobroActualV2.rtEnviandoDesde = null;
        cobroActualV2.rtPuedeMarcarIncerto = false;

        await cargarDatosCobroV2();

    }catch(error){

        console.error(
            "Error confirmando documento RT non emesso:",
            error
        );

        cobroActualV2.procesando = false;

        await cargarDatosCobroV2();
    }
}


async function confirmarRtEmitidoCobroV2(){

    if(
        !cobroActualV2 ||
        !cobroActualV2.pedidoId ||
        cobroActualV2.procesando ||
        !esAdminGerenteCobroV2()
    ){
        return;
    }

    if(
        cobroActualV2.pendiente > 0.005 ||
        cobroActualV2.rtEstado !== "incerto"
    ){
        return;
    }

    const textos =
        textosCobroV2();

    const conferma =
        window.confirm(
            textos.rtDocumentoEmesso + "?"
        );

    if(!conferma){
        return;
    }

    const documentoId =
        String(
            window.prompt(
                textos.rtDocumentoIdPrompt
            ) || ""
        ).trim();

    if(!documentoId){
        return;
    }

    const nota =
        String(
            window.prompt(
                textos.rtNotaVerificaPrompt
            ) || ""
        ).trim();

    if(!nota){
        return;
    }

    cobroActualV2.procesando = true;
    cobroActualV2.mensaje = "";
    cobroActualV2.tipoMensaje = "";

    renderCobroV2();

    try{

        const respuesta =
            await apiPost(
                "/pedido/" +
                cobroActualV2.pedidoId +
                "/rt/confirmar-emitido",
                {
                    documentoId: documentoId,
                    nota: nota
                }
            );

        cobroActualV2.procesando = false;

        if(
            respuesta &&
            respuesta.cerrado === true
        ){
            await finalizarCierreRtCobroV2();
            return;
        }

        await cargarDatosCobroV2();

    }catch(error){

        console.error(
            "Error confirmando documento RT emesso:",
            error
        );

        cobroActualV2.procesando = false;

        await cargarDatosCobroV2();
    }
}


async function marcarRtIncertoCobroV2(){

    if(
        !cobroActualV2 ||
        !cobroActualV2.pedidoId ||
        cobroActualV2.procesando ||
        !esAdminGerenteCobroV2()
    ){
        return;
    }

    if(
        cobroActualV2.pendiente > 0.005 ||
        cobroActualV2.rtEstado !== "enviando" ||
        cobroActualV2.rtPuedeMarcarIncerto !== true
    ){
        return;
    }

    const textos =
        textosCobroV2();

    const conferma =
        window.confirm(
            textos.rtVerificaDisponible
        );

    if(!conferma){
        return;
    }

    const nota =
        String(
            window.prompt(
                textos.rtNotaVerificaPrompt
            ) || ""
        ).trim();

    if(!nota){
        return;
    }

    cobroActualV2.procesando = true;
    cobroActualV2.mensaje = "";
    cobroActualV2.tipoMensaje = "";

    renderCobroV2();

    try{

        const respuesta =
            await apiPost(
                "/pedido/" +
                cobroActualV2.pedidoId +
                "/rt/marcar-incerto",
                {
                    nota: nota
                }
            );

        cobroActualV2.procesando = false;

        if(
            respuesta &&
            respuesta.estado
        ){
            cobroActualV2.rtEstado =
                String(
                    respuesta.estado
                );
        }

        cobroActualV2.rtEnviandoDesde =
            null;

        cobroActualV2.rtPuedeMarcarIncerto =
            false;

        await cargarDatosCobroV2();

    }catch(error){

        console.error(
            "Error marcando RT incerto:",
            error
        );

        cobroActualV2.procesando = false;

        await cargarDatosCobroV2();
    }
}


async function reintentarFiscalizacionRtCobroV2(){

    if(
        !cobroActualV2 ||
        !cobroActualV2.pedidoId ||
        cobroActualV2.procesando ||
        !esAdminGerenteCobroV2()
    ){
        return;
    }

    if(
        cobroActualV2.pendiente > 0.005 ||
        cobroActualV2.rtEstado !== "error"
    ){
        return;
    }

    cobroActualV2.procesando = true;
    cobroActualV2.mensaje = "";
    cobroActualV2.tipoMensaje = "";

    renderCobroV2();

    try{

        const respuesta =
            await apiPost(
                "/pedido/" +
                cobroActualV2.pedidoId +
                "/rt/reintentar",
                {}
            );

        cobroActualV2.procesando = false;

        if(
            respuesta &&
            respuesta.cerrado === true
        ){
            await finalizarCierreRtCobroV2();
            return;
        }

        if(
            respuesta &&
            respuesta.rt &&
            respuesta.rt.estado
        ){
            cobroActualV2.rtEstado =
                String(
                    respuesta.rt.estado
                );
        }

        await cargarDatosCobroV2();

    }catch(error){

        console.error(
            "Error reintentando fiscalización RT:",
            error
        );

        cobroActualV2.procesando = false;

        await cargarDatosCobroV2();
    }
}


async function finalizarCierreRtCobroV2(){

    if(
        !cobroActualV2 ||
        !cobroActualV2.pedidoId
    ){
        return;
    }

    const mesaCerrada =
        cobroActualV2.mesa;

    const pedidoCerrado =
        cobroActualV2.pedidoId;

    const totalCerrado =
        cobroActualV2.total;

    const pagadoCerrado =
        obtenerTotalPagadoCobroV2();

    cobroActualV2.rtEstado =
        "emitido";

    cobroActualV2.pendiente =
        0;

    cobroActualV2.cerrado =
        true;

    cobroActualV2.cerrando =
        false;

    cobroActualV2.procesando =
        false;

    cobroActualV2.rtEnviandoDesde =
        null;

    cobroActualV2.rtPuedeMarcarIncerto =
        false;

    mesaSeleccionada =
        null;

    await cargarMesasV2();

    renderMesaCerradaCobroV2(
        mesaCerrada,
        pedidoCerrado,
        totalCerrado,
        pagadoCerrado
    );
}


async function cerrarMesaDesdeCobroV2(){

    if(
        !cobroActualV2 ||
        cobroActualV2.cerrando ||
        cobroActualV2.cerrado
    ){
        return;
    }

    const textos = textosCobroV2();

    try{

        cobroActualV2.cerrando = true;
        cobroActualV2.mensaje =
            textos.cuentaPagadaCerrando;

        cobroActualV2.tipoMensaje =
            "correcto";

        renderCobroV2();

        const mesaCerrada =
            cobroActualV2.mesa;

        const pedidoCerrado =
            cobroActualV2.pedidoId;

        const totalCerrado =
            cobroActualV2.total;

        const pagadoCerrado =
            obtenerTotalPagadoCobroV2();

        await apiPost(
            "/cerrar-mesa/" + mesaCerrada,
            {}
        );

        cobroActualV2.cerrado = true;
        cobroActualV2.cerrando = false;

        mesaSeleccionada = null;

        await cargarMesasV2();

        renderMesaCerradaCobroV2(
            mesaCerrada,
            pedidoCerrado,
            totalCerrado,
            pagadoCerrado
        );

    }catch(error){

        console.error(
            "Error cerrando mesa:",
            error
        );

        cobroActualV2.cerrando = false;
        cobroActualV2.mensaje =
            textos.pagoRegistradoNoCierra;

        cobroActualV2.tipoMensaje =
            "error";

        renderCobroV2();
    }
}

function renderMesaCerradaCobroV2(mesa, pedido, total, pagado){

    const textos = textosCobroV2();
    const panel = obtenerPanelCobroV2();

    panel.innerHTML = `
        <div class="cobro-panel">
            <div class="cobro-cerrado">
                <div class="cobro-cerrado-icono">
                    ✅
                </div>

                <h2>
                    ${textos.mesa}
                    ${mesa}
                    ${textos.cerrada}
                </h2>

                <p>
                    ${textos.pedido}
                    ${pedido}
                    ${textos.pedidoCobrado}
                </p>

                <div class="cobro-resumen">
                    <div class="cobro-card">
                        <span>
                            ${textos.totalCuenta}
                        </span>

                        <strong>
                            ${formatearDineroCobroV2(
                                total
                            )}
                        </strong>
                    </div>

                    <div class="cobro-card">
                        <span>
                            ${textos.totalPagado}
                        </span>

                        <strong>
                            ${formatearDineroCobroV2(
                                pagado
                            )}
                        </strong>
                    </div>

                    <div class="cobro-card pendiente">
                        <span>
                            ${textos.pendiente}
                        </span>

                        <strong>0,00 €</strong>
                    </div>
                </div>

                <button
                    class="cobro-btn-principal"
                    onclick="imprimirTicketFinalCobroV2(${pedido})"
                >
                    ${textos.imprimirTicketFinal}
                </button>

                <button
                    class="cobro-btn-secundario"
                    onclick="mostrarInicioCobroV2()"
                >
                    ${textos.volverMesas}
                </button>
            </div>
        </div>
    `;
}

function mostrarInicioCobroV2(){

    const textos = textosCobroV2();
    const panel = obtenerPanelCobroV2();

    panel.innerHTML = `
        <div class="bienvenida">
            <h2>${textos.bienvenida}</h2>
            <p>${textos.seleccionaMesaComenzar}</p>
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


async function imprimirTicketFinalCobroV2(pedidoId){

    const textos = textosCobroV2();

    const idiomaDocumento = String(
        document.documentElement.lang || "es"
    ).toLowerCase();

    const idioma = ["es","it","en","pt-br"].includes(
        idiomaDocumento
    )
        ? idiomaDocumento
        : "es";

    if(!pedidoId){
        alert(textos.pedidoNoEncontradoTicketFinal);
        return;
    }

    const ventanaTicket = window.open(
        "",
        "_blank",
        "width=420,height=700"
    );

    if(ventanaTicket){

        ventanaTicket.document.open();

        ventanaTicket.document.write(`
            <!DOCTYPE html>
            <html lang="${idioma}">
            <head>
                <meta charset="UTF-8">
                <title>${textos.preparandoTicketFinal}</title>
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
                    <h2>${textos.preparandoTicketFinal}</h2>
                    <p>${textos.pedido} ${pedidoId}</p>
                </div>
            </body>
            </html>
        `);

        ventanaTicket.document.close();

    }

    try{

        const respuesta = await fetch(
            API + "/ticket-final/" + pedidoId,
            {
                credentials: "include"
            }
        );

        if(!respuesta.ok){
            throw new Error(
                textos.noGenerarTicketFinal
            );
        }

        const htmlTicket = await respuesta.text();

        if(ventanaTicket){

            ventanaTicket.document.open();
            ventanaTicket.document.write(htmlTicket);
            ventanaTicket.document.close();

            ventanaTicket.focus();

            return;
        }

        alert(
            textos.popupBloqueadoTicket
        );

    }catch(error){

        console.error("Error generando ticket final:", error);

        if(ventanaTicket){

            ventanaTicket.document.open();

            ventanaTicket.document.write(`
                <!DOCTYPE html>
                <html lang="${idioma}">
                <head>
                    <meta charset="UTF-8">
                    <title>${textos.noGenerarTicketFinal}</title>
                </head>
                <body style="font-family:Arial,sans-serif;padding:30px;text-align:center;color:#1f2937;">
                    <h2>${textos.noGenerarTicketFinal}</h2>
                    <p>${textos.cerrarVentanaReintentar}</p>
                    <button
                        onclick="window.close()"
                        style="margin-top:20px;padding:12px 18px;border:0;border-radius:10px;background:#111827;color:white;font-weight:700;"
                    >
                        ${textos.cerrar}
                    </button>
                </body>
                </html>
            `);

            ventanaTicket.document.close();

        }else{

            alert(
                textos.noGenerarTicketFinal + "."
            );

        }

    }

}
