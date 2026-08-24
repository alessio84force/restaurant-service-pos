const { normalizarIdioma } = require("./i18n");

function textosCajaReportes(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",

      caja: "Caja",
      cajaPagos: "Caja y pagos",
      descripcionCaja:
        "Ventas, pagos, cierre diario, cierre mensual e histórico del restaurante actual.",

      volverConfiguracion: "Volver a configuración",
      reportesCsv: "Reportes CSV",
      descripcionReportesCsv:
        "Exporta únicamente los datos del restaurante actual.",
      desde: "Desde",
      hasta: "Hasta",
      filtrar: "Filtrar",
      resumen: "Resumen",
      descargarCsv: "Descargar CSV",
      pedidosRango:
        "Pedidos cerrados y abiertos del periodo.",
      pagosMetodo:
        "Pagos registrados por método.",
      productos: "Productos",
      unidadesProducto:
        "Unidades vendidas por producto.",
      sinDatosCsv: "Sin datos",
      abrirPos: "Abrir POS",

      resumenDiario: "Resumen diario",
      fecha: "Fecha",
      verFecha: "Ver fecha",
      reporteImprimible: "Reporte imprimible",

      totalCaja: "Total caja",
      efectivo: "Efectivo",
      tarjeta: "Tarjeta",
      bizum: "Bizum",
      otros: "Otros",
      ticketMedio: "Ticket medio",

      efectivoContado: "Efectivo contado",
      observaciones: "Observaciones",
      notasCierreDiario: "Notas del cierre diario...",
      guardarCierreDiario: "Guardar cierre diario",

      pagosDia: "Pagos del día",
      mesa: "Mesa",
      pedido: "Pedido",
      metodo: "Método",
      importe: "Importe",
      sinPagosDia:
        "Todavía no hay pagos registrados este día.",

      resumenMensual: "Resumen mensual",
      mes: "Mes",
      verMes: "Ver mes",
      reporteMensual: "Reporte mensual",

      totalMes: "Total mes",
      pagos: "Pagos",
      pedidosCerrados: "Pedidos cerrados",
      guardarCierreMensual: "Guardar cierre mensual",

      ultimosCierres: "Últimos cierres guardados",
      tipo: "Tipo",
      periodo: "Periodo",
      total: "Total",
      pedidos: "Pedidos",
      sinCierres:
        "Todavía no hay cierres guardados.",

      tipoDiario: "Diario",
      tipoMensual: "Mensual",

      metodoEfectivo: "Efectivo",
      metodoTarjeta: "Tarjeta",
      metodoBizum: "Bizum",
      metodoOtros: "Otros",

      cierreDiarioGuardado:
        "Cierre diario guardado correctamente",
      cierreMensualGuardado:
        "Cierre mensual guardado correctamente",

      imprimir: "Imprimir",
      reporteDiario: "Reporte diario",
      sinPagos: "Sin pagos.",
      pagosRegistrados: "Pagos registrados",

      sinPermisos:
        "No tienes permisos para ver caja o reportes."
    },

    it: {
      lang: "it",

      caja: "Cassa",
      cajaPagos: "Cassa e pagamenti",
      descripcionCaja:
        "Vendite, pagamenti, chiusura giornaliera, chiusura mensile e storico del ristorante attuale.",

      volverConfiguracion: "Torna alla configurazione",
      reportesCsv: "Report CSV",
      descripcionReportesCsv:
        "Esporta esclusivamente i dati del ristorante attuale.",
      desde: "Dal",
      hasta: "Al",
      filtrar: "Filtra",
      resumen: "Riepilogo",
      descargarCsv: "Scarica CSV",
      pedidosRango:
        "Ordini chiusi e aperti del periodo.",
      pagosMetodo:
        "Pagamenti registrati per metodo.",
      productos: "Prodotti",
      unidadesProducto:
        "Unità vendute per prodotto.",
      sinDatosCsv: "Nessun dato",
      abrirPos: "Apri POS",

      resumenDiario: "Riepilogo giornaliero",
      fecha: "Data",
      verFecha: "Visualizza data",
      reporteImprimible: "Report stampabile",

      totalCaja: "Totale cassa",
      efectivo: "Contanti",
      tarjeta: "Carta",
      bizum: "Bizum",
      otros: "Altri",
      ticketMedio: "Scontrino medio",

      efectivoContado: "Contanti contati",
      observaciones: "Osservazioni",
      notasCierreDiario:
        "Note della chiusura giornaliera...",
      guardarCierreDiario:
        "Salva chiusura giornaliera",

      pagosDia: "Pagamenti del giorno",
      mesa: "Tavolo",
      pedido: "Ordine",
      metodo: "Metodo",
      importe: "Importo",
      sinPagosDia:
        "Non ci sono ancora pagamenti registrati per questo giorno.",

      resumenMensual: "Riepilogo mensile",
      mes: "Mese",
      verMes: "Visualizza mese",
      reporteMensual: "Report mensile",

      totalMes: "Totale mese",
      pagos: "Pagamenti",
      pedidosCerrados: "Ordini chiusi",
      guardarCierreMensual:
        "Salva chiusura mensile",

      ultimosCierres:
        "Ultime chiusure salvate",
      tipo: "Tipo",
      periodo: "Periodo",
      total: "Totale",
      pedidos: "Ordini",
      sinCierres:
        "Non ci sono ancora chiusure salvate.",

      tipoDiario: "Giornaliera",
      tipoMensual: "Mensile",

      metodoEfectivo: "Contanti",
      metodoTarjeta: "Carta",
      metodoBizum: "Bizum",
      metodoOtros: "Altri",

      cierreDiarioGuardado:
        "Chiusura giornaliera salvata correttamente",
      cierreMensualGuardado:
        "Chiusura mensile salvata correttamente",

      imprimir: "Stampa",
      reporteDiario: "Report giornaliero",
      sinPagos: "Nessun pagamento.",
      pagosRegistrados: "Pagamenti registrati",

      sinPermisos:
        "Non hai i permessi per visualizzare la cassa o i report."
    },

    en: {
      lang: "en",

      caja: "Cash register",
      cajaPagos: "Cash register and payments",
      descripcionCaja:
        "Sales, payments, daily closing, monthly closing and history for the current restaurant.",

      volverConfiguracion: "Back to settings",
      reportesCsv: "CSV reports",
      descripcionReportesCsv:
        "Export data for the current restaurant only.",
      desde: "From",
      hasta: "To",
      filtrar: "Filter",
      resumen: "Summary",
      descargarCsv: "Download CSV",
      pedidosRango:
        "Closed and open orders for the period.",
      pagosMetodo:
        "Payments registered by method.",
      productos: "Products",
      unidadesProducto:
        "Units sold by product.",
      sinDatosCsv: "No data",
      abrirPos: "Open POS",

      resumenDiario: "Daily summary",
      fecha: "Date",
      verFecha: "View date",
      reporteImprimible: "Printable report",

      totalCaja: "Register total",
      efectivo: "Cash",
      tarjeta: "Card",
      bizum: "Bizum",
      otros: "Other",
      ticketMedio: "Average ticket",

      efectivoContado: "Cash counted",
      observaciones: "Notes",
      notasCierreDiario:
        "Daily closing notes...",
      guardarCierreDiario:
        "Save daily closing",

      pagosDia: "Payments for the day",
      mesa: "Table",
      pedido: "Order",
      metodo: "Method",
      importe: "Amount",
      sinPagosDia:
        "No payments have been registered for this day yet.",

      resumenMensual: "Monthly summary",
      mes: "Month",
      verMes: "View month",
      reporteMensual: "Monthly report",

      totalMes: "Month total",
      pagos: "Payments",
      pedidosCerrados: "Closed orders",
      guardarCierreMensual:
        "Save monthly closing",

      ultimosCierres:
        "Latest saved closings",
      tipo: "Type",
      periodo: "Period",
      total: "Total",
      pedidos: "Orders",
      sinCierres:
        "No closings have been saved yet.",

      tipoDiario: "Daily",
      tipoMensual: "Monthly",

      metodoEfectivo: "Cash",
      metodoTarjeta: "Card",
      metodoBizum: "Bizum",
      metodoOtros: "Other",

      cierreDiarioGuardado:
        "Daily closing saved successfully",
      cierreMensualGuardado:
        "Monthly closing saved successfully",

      imprimir: "Print",
      reporteDiario: "Daily report",
      sinPagos: "No payments.",
      pagosRegistrados: "Registered payments",

      sinPermisos:
        "You do not have permission to view the cash register or reports."
    },
    "pt-br": {
          "lang": "pt-BR",
          "caja": "Caixa",
          "cajaPagos": "Caixa e pagamentos",
          "descripcionCaja": "Vendas, pagamentos, fechamento diário, fechamento mensal e histórico do restaurante atual.",
          "volverConfiguracion": "Voltar às configurações",
          "reportesCsv": "Relatórios CSV",
          "descripcionReportesCsv": "Exporte dados somente do restaurante atual.",
          "desde": "De",
          "hasta": "Até",
          "filtrar": "Filtrar",
          "resumen": "Resumo",
          "descargarCsv": "Baixar CSV",
          "pedidosRango": "Pedidos fechados e abertos no período.",
          "pagosMetodo": "Pagamentos registrados por método.",
          "productos": "Produtos",
          "unidadesProducto": "Unidades vendidas por produto.",
          "sinDatosCsv": "Sem dados",
          "abrirPos": "Abrir POS",
          "resumenDiario": "Resumo diário",
          "fecha": "Data",
          "verFecha": "Ver data",
          "reporteImprimible": "Relatório para impressão",
          "totalCaja": "Total do caixa",
          "efectivo": "Dinheiro",
          "tarjeta": "Cartão",
          "bizum": "Bizum",
          "otros": "Outros",
          "ticketMedio": "Ticket médio",
          "efectivoContado": "Dinheiro contado",
          "observaciones": "Observações",
          "notasCierreDiario": "Observações do fechamento diário...",
          "guardarCierreDiario": "Salvar fechamento diário",
          "pagosDia": "Pagamentos do dia",
          "mesa": "Mesa",
          "pedido": "Pedido",
          "metodo": "Método",
          "importe": "Valor",
          "sinPagosDia": "Ainda não há pagamentos registrados para este dia.",
          "resumenMensual": "Resumo mensal",
          "mes": "Mês",
          "verMes": "Ver mês",
          "reporteMensual": "Relatório mensal",
          "totalMes": "Total do mês",
          "pagos": "Pagamentos",
          "pedidosCerrados": "Pedidos fechados",
          "guardarCierreMensual": "Salvar fechamento mensal",
          "ultimosCierres": "Últimos fechamentos salvos",
          "tipo": "Tipo",
          "periodo": "Período",
          "total": "Total",
          "pedidos": "Pedidos",
          "sinCierres": "Ainda não há fechamentos salvos.",
          "tipoDiario": "Diário",
          "tipoMensual": "Mensal",
          "metodoEfectivo": "Dinheiro",
          "metodoTarjeta": "Cartão",
          "metodoBizum": "Bizum",
          "metodoOtros": "Outros",
          "cierreDiarioGuardado": "Fechamento diário salvo com sucesso",
          "cierreMensualGuardado": "Fechamento mensal salvo com sucesso",
          "imprimir": "Imprimir",
          "reporteDiario": "Relatório diário",
          "sinPagos": "Nenhum pagamento.",
          "pagosRegistrados": "Pagamentos registrados",
          "sinPermisos": "Você não tem permissão para visualizar o caixa ou os relatórios."
    }
  };

  return textos[idioma] || textos.es;
}

function tipoCierreVisible(tipoValor, textos) {
  const tipo = String(tipoValor || "").toLowerCase();

  if (tipo === "diario") return textos.tipoDiario;
  if (tipo === "mensual") return textos.tipoMensual;

  return tipoValor || "";
}

function metodoPagoVisible(metodoValor, textos) {
  const metodo = String(metodoValor || "").toLowerCase();

  if (
    metodo.includes("efectivo") ||
    metodo.includes("cash")
  ) {
    return textos.metodoEfectivo;
  }

  if (
    metodo.includes("tarjeta") ||
    metodo.includes("card") ||
    metodo.includes("tpv")
  ) {
    return textos.metodoTarjeta;
  }

  if (metodo.includes("bizum")) {
    return textos.metodoBizum;
  }

  return textos.metodoOtros;
}

module.exports = {
  textosCajaReportes,
  tipoCierreVisible,
  metodoPagoVisible
};
