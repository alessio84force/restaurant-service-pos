const { normalizarIdioma } = require("./i18n");

function textosDestinosImpresion(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",

      destinosComanda: "Destinos de comanda",
      descripcionDestinos:
        "Define dónde se envía cada comanda: bar, cocina, pizzería, parrilla, coctelería u otros puntos de trabajo.",

      volverConfiguracion: "Volver a configuración",
      productos: "Productos",
      impresion: "Impresión",

      crearDestinoPersonalizado:
        "Crear destino personalizado",
      nombre: "Nombre",
      placeholderDestino:
        "Parrilla, Coctelería, Terraza bar...",
      crearDestino: "Crear destino",

      destinosDisponibles:
        "Destinos disponibles",
      destino: "Destino",
      tipo: "Tipo",
      estado: "Estado",
      accion: "Acción",

      baseSistema: "Base del sistema",
      personalizado: "Personalizado",
      activo: "Activo",
      desactivado: "Desactivado",

      baseNoEliminar:
        "No se elimina. Siempre disponible para empezar rápido.",

      activar: "Activar",
      desactivar: "Desactivar",

      destinoBar: "Bar",
      destinoCocina: "Cocina",
      destinoPizzeria: "Pizzería",
      destinoGeneral: "General",

      nombreNoValido: "Nombre no válido",
      destinoCreado: "Destino creado",
      destinoActivado: "Destino activado",
      destinoDesactivado: "Destino desactivado",

      centroImpresion: "Centro de impresión",
      descripcionImpresion:
        "Configura el ticket, el bar, la cocina y todos los destinos de comanda de este restaurante.",
      destinos: "Destinos",
      abrirPos: "Abrir POS",

      ticketCaja: "Ticket / caja",
      nombreImpresora: "Nombre de impresora / IP / referencia",
      placeholderImpresora:
        "Ej. EPSON barra, 192.168.1.50...",
      modo: "Modo",
      modoGeneral: "Modo general",
      modoImpresionGeneral: "Modo de impresión general",

      modoPreview: "Vista previa / ventana",
      modoArchivoTxt: "Archivo TXT",
      modoEscposRed: "ESC/POS de red futuro",
      modoCentroImpresion: "Centro de impresión",

      probar: "Probar",
      verUltimaPrueba: "Ver última prueba",
      guardarCentroImpresion:
        "Guardar centro de impresión",

      centroImpresionGuardado:
        "Centro de impresión guardado correctamente",
      noGenerarPrueba:
        "No se pudo generar la prueba",
      pruebaGenerada: "Prueba generada en",
      sinPruebaGenerada:
        "Todavía no hay una prueba generada para este destino.",

      prueba: "PRUEBA",
      etiquetaDestino: "DESTINO",
      etiquetaHora: "HORA",
      productoPrueba: "1 x PRODUCTO DE PRUEBA",
      pruebaCorrecta:
        "Si ves esto, la prueba se generó correctamente.",
      localeFecha: "es-ES",

      sinPermisos:
        "No tienes permisos para configurar destinos e impresión."
    },

    it: {
      lang: "it",

      destinosComanda: "Destinazioni delle comande",
      descripcionDestinos:
        "Definisci dove viene inviata ogni comanda: bar, cucina, pizzeria, griglia, cocktail bar o altre postazioni di lavoro.",

      volverConfiguracion: "Torna alla configurazione",
      productos: "Prodotti",
      impresion: "Stampa",

      crearDestinoPersonalizado:
        "Crea destinazione personalizzata",
      nombre: "Nome",
      placeholderDestino:
        "Griglia, Cocktail bar, Bar terrazza...",
      crearDestino: "Crea destinazione",

      destinosDisponibles:
        "Destinazioni disponibili",
      destino: "Destinazione",
      tipo: "Tipo",
      estado: "Stato",
      accion: "Azione",

      baseSistema: "Base di sistema",
      personalizado: "Personalizzata",
      activo: "Attiva",
      desactivado: "Disattivata",

      baseNoEliminar:
        "Non può essere eliminata. È sempre disponibile per iniziare rapidamente.",

      activar: "Attiva",
      desactivar: "Disattiva",

      destinoBar: "Bar",
      destinoCocina: "Cucina",
      destinoPizzeria: "Pizzeria",
      destinoGeneral: "Generale",

      nombreNoValido: "Nome non valido",
      destinoCreado: "Destinazione creata",
      destinoActivado: "Destinazione attivata",
      destinoDesactivado: "Destinazione disattivata",

      centroImpresion: "Centro di stampa",
      descripcionImpresion:
        "Configura lo scontrino, il bar, la cucina e tutte le destinazioni delle comande di questo ristorante.",
      destinos: "Destinazioni",
      abrirPos: "Apri POS",

      ticketCaja: "Scontrino / cassa",
      nombreImpresora: "Nome stampante / IP / riferimento",
      placeholderImpresora:
        "Es. EPSON bar, 192.168.1.50...",
      modo: "Modalità",
      modoGeneral: "Modalità generale",
      modoImpresionGeneral: "Modalità generale di stampa",

      modoPreview: "Anteprima / finestra",
      modoArchivoTxt: "File TXT",
      modoEscposRed: "ESC/POS di rete futuro",
      modoCentroImpresion: "Centro di stampa",

      probar: "Prova",
      verUltimaPrueba: "Visualizza ultima prova",
      guardarCentroImpresion:
        "Salva centro di stampa",

      centroImpresionGuardado:
        "Centro di stampa salvato correttamente",
      noGenerarPrueba:
        "Impossibile generare la prova",
      pruebaGenerada: "Prova generata in",
      sinPruebaGenerada:
        "Non è stata ancora generata una prova per questa destinazione.",

      prueba: "PROVA",
      etiquetaDestino: "DESTINAZIONE",
      etiquetaHora: "ORA",
      productoPrueba: "1 x PRODOTTO DI PROVA",
      pruebaCorrecta:
        "Se vedi questo testo, la prova è stata generata correttamente.",
      localeFecha: "it-IT",

      sinPermisos:
        "Non hai i permessi per configurare destinazioni e stampa."
    },

    en: {
      lang: "en",

      destinosComanda: "Order destinations",
      descripcionDestinos:
        "Define where each order is sent: bar, kitchen, pizzeria, grill, cocktail bar or other workstations.",

      volverConfiguracion: "Back to settings",
      productos: "Products",
      impresion: "Printing",

      crearDestinoPersonalizado:
        "Create custom destination",
      nombre: "Name",
      placeholderDestino:
        "Grill, Cocktail bar, Terrace bar...",
      crearDestino: "Create destination",

      destinosDisponibles:
        "Available destinations",
      destino: "Destination",
      tipo: "Type",
      estado: "Status",
      accion: "Action",

      baseSistema: "System default",
      personalizado: "Custom",
      activo: "Active",
      desactivado: "Disabled",

      baseNoEliminar:
        "It cannot be deleted. It is always available for a quick start.",

      activar: "Activate",
      desactivar: "Disable",

      destinoBar: "Bar",
      destinoCocina: "Kitchen",
      destinoPizzeria: "Pizzeria",
      destinoGeneral: "General",

      nombreNoValido: "Invalid name",
      destinoCreado: "Destination created",
      destinoActivado: "Destination activated",
      destinoDesactivado: "Destination disabled",

      centroImpresion: "Printing center",
      descripcionImpresion:
        "Configure the receipt, bar, kitchen and all order destinations for this restaurant.",
      destinos: "Destinations",
      abrirPos: "Open POS",

      ticketCaja: "Receipt / till",
      nombreImpresora: "Printer name / IP / reference",
      placeholderImpresora:
        "E.g. EPSON bar, 192.168.1.50...",
      modo: "Mode",
      modoGeneral: "General mode",
      modoImpresionGeneral: "General printing mode",

      modoPreview: "Preview / window",
      modoArchivoTxt: "TXT file",
      modoEscposRed: "Future network ESC/POS",
      modoCentroImpresion: "Printing center",

      probar: "Test",
      verUltimaPrueba: "View latest test",
      guardarCentroImpresion:
        "Save printing center",

      centroImpresionGuardado:
        "Printing center saved successfully",
      noGenerarPrueba:
        "The test could not be generated",
      pruebaGenerada: "Test generated in",
      sinPruebaGenerada:
        "No test has been generated for this destination yet.",

      prueba: "TEST",
      etiquetaDestino: "DESTINATION",
      etiquetaHora: "TIME",
      productoPrueba: "1 x TEST PRODUCT",
      pruebaCorrecta:
        "If you can see this, the test was generated successfully.",
      localeFecha: "en-GB",

      sinPermisos:
        "You do not have permission to configure destinations and printing."
    }
  };

  return textos[idioma] || textos.es;
}

function nombreDestinoVisible(destino, textos) {
  if (!destino) return "";

  if (!destino.base) {
    return destino.nombre || "";
  }

  const id = String(destino.id || "").toLowerCase();

  if (id === "bar") return textos.destinoBar;
  if (id === "cocina") return textos.destinoCocina;
  if (id === "pizzeria") return textos.destinoPizzeria;
  if (id === "general") return textos.destinoGeneral;

  return destino.nombre || "";
}

module.exports = {
  textosDestinosImpresion,
  nombreDestinoVisible
};
