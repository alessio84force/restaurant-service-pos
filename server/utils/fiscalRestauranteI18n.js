const { normalizarIdioma } = require("./i18n");

function textosFiscalRestaurante(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",
      datosRestaurante: "Datos del restaurante",
      descripcion:
        "Datos generales, fiscales y de ticket del restaurante actual.",
      volverConfiguracion: "Volver a configuración",
      suscripcion: "Suscripción",
      vistaPreviaTicket: "Vista previa ticket",
      fiscalesCompletos:
        "Datos fiscales completos para facturación.",
      fiscalesFaltan:
        "Faltan datos fiscales. Antes de pagar la suscripción deben estar completos.",
      datosFiscalesFacturacion:
        "Datos fiscales para facturación",
      datosFiscalesDescripcion:
        "Estos datos se usarán para facturas de suscripción cuando el restaurante empiece a pagar.",
      nombreComercial: "Nombre comercial",
      razonSocial: "Razón social / nombre fiscal",
      identificacionFiscal: "NIF / CIF / VAT",
      emailFacturacion: "Email de facturación",
      direccionFiscal: "Dirección fiscal",
      codigoPostal: "Código postal",
      ciudad: "Ciudad",
      provincia: "Provincia",
      pais: "País",
      ivaDefecto: "IVA por defecto (%)",
      contactoTicket: "Contacto y ticket",
      telefonoRestaurante: "Teléfono restaurante",
      emailRestaurante: "Email restaurante",
      nombrePropietario: "Nombre propietario",
      emailPropietario: "Email propietario",
      telefonoPropietario: "Teléfono propietario",
      logoTicket: "Logo ticket",
      elegirImagen:
        "Haz clic para elegir una imagen del ordenador.",
      seleccionarArchivo: "Seleccionar archivo",
      ningunArchivoSeleccionado: "Ningún archivo seleccionado",
      mensajeTicket: "Mensaje del ticket",
      guardarDatos: "Guardar datos del restaurante",
      vistaPreviaRapida:
        "Vista previa rápida del ticket",
      productoEjemplo: "Producto ejemplo",
      total: "Total",
      mensajeVisita: "Gracias por su visita",
      guardadoCorrecto:
        "Datos del restaurante guardados correctamente",
      imprimirPrueba: "Imprimir prueba",
      mesa: "Mesa",
      fecha: "Fecha",
      cafeEjemplo: "Café",
      menuEjemplo: "Menú",
      localeFecha: "es-ES",

      sinPermisosConfiguracion:
        "No tienes permisos para esta configuración.",
      soloAdminSuscripcion:
        "Solo el administrador puede gestionar la suscripción.",
      cerrarSesion: "Cerrar sesión",
      archivoNoImagen:
        "El archivo elegido no es una imagen.",

      descripcionSuscripcion:
        "Estado de trial, pago y datos fiscales del restaurante actual.",
      datosFiscales: "Datos fiscales",
      estado: "Estado",
      plan: "Plan",
      diasTrial: "Días trial",
      finTrial: "Fin trial",
      promocionAplicada: "Promoción aplicada",
      noAplicada: "No aplicada",
      restauranteId: "Restaurante ID",
      completos: "Completos",
      incompletos: "Incompletos",

      datosFiscalesFacturas:
        "Datos fiscales para facturas",
      fiscalesFacturasCompletos:
        "El restaurante tiene los datos fiscales completos para facturación.",
      fiscalesFacturasFaltan:
        "Faltan datos fiscales. Antes de pagar la suscripción debes completarlos.",
      completarDatosFiscales:
        "Completar datos fiscales",

      pagoMensual: "Pago mensual",
      pagoDisponible:
        "Los datos fiscales están completos. Ya se puede activar el pago cuando Stripe esté configurado.",
      pagoBloqueado:
        "El pago queda bloqueado hasta completar los datos fiscales.",
      pagarSuscripcion: "Pagar suscripción",
      noConfigurado: "No configurado",
      pagoConfirmado:
        "Pago confirmado correctamente.",
      pagoCancelado:
        "Pago cancelado.",

      estadoGratisVida: "Gratis de por vida",
      estadoActiva: "Activa",
      estadoPrueba: "Prueba gratuita",
      estadoPendientePago: "Pendiente de pago",
      estadoCancelada: "Cancelada",
      estadoNoDefinido: "No definido",

      planMensualStripe: "Mensual con Stripe",
      planGratisVida: "Gratis de por vida",
      planPrueba: "Prueba gratuita",

      completaDatosAntesPagar:
        "Completa los datos fiscales antes de pagar la suscripción",
      stripeNoConfiguradoEnv:
        "Stripe no está configurado. Revisa .env.",
      stripeNoConfigurado:
        "Stripe no está configurado.",
      errorCreandoPago:
        "Error creando pago con Stripe: ",
      errorConfirmandoStripe:
        "Error confirmando Stripe: ",

      stripeLiveNoConfirmado:
        "Stripe LIVE está configurado, pero STRIPE_LIVE_CONFIRMADO no es SI.",
      stripeLiveHttps:
        "En Stripe LIVE, APP_BASE_URL debe ser https.",
      stripeLiveNoLocalhost:
        "En Stripe LIVE, APP_BASE_URL no puede ser localhost.",
      stripeLiveWebhook:
        "En Stripe LIVE, STRIPE_WEBHOOK_SECRET debe estar configurado."
    },

    it: {
      lang: "it",
      datosRestaurante: "Dati del ristorante",
      descripcion:
        "Dati generali, fiscali e del ticket del ristorante attuale.",
      volverConfiguracion: "Torna alla configurazione",
      suscripcion: "Abbonamento",
      vistaPreviaTicket: "Anteprima ticket",
      fiscalesCompletos:
        "Dati fiscali completi per la fatturazione.",
      fiscalesFaltan:
        "Mancano alcuni dati fiscali. Devono essere completati prima di pagare l'abbonamento.",
      datosFiscalesFacturacion:
        "Dati fiscali per la fatturazione",
      datosFiscalesDescripcion:
        "Questi dati saranno utilizzati per le fatture dell'abbonamento quando il ristorante inizierà a pagare.",
      nombreComercial: "Nome commerciale",
      razonSocial: "Ragione sociale / denominazione fiscale",
      identificacionFiscal: "Partita IVA / codice fiscale",
      emailFacturacion: "Email di fatturazione",
      direccionFiscal: "Indirizzo fiscale",
      codigoPostal: "Codice postale",
      ciudad: "Città",
      provincia: "Provincia",
      pais: "Paese",
      ivaDefecto: "IVA predefinita (%)",
      contactoTicket: "Contatti e ticket",
      telefonoRestaurante: "Telefono del ristorante",
      emailRestaurante: "Email del ristorante",
      nombrePropietario: "Nome del proprietario",
      emailPropietario: "Email del proprietario",
      telefonoPropietario: "Telefono del proprietario",
      logoTicket: "Logo del ticket",
      elegirImagen:
        "Fai clic per scegliere un'immagine dal computer.",
      seleccionarArchivo: "Scegli file",
      ningunArchivoSeleccionado: "Nessun file selezionato",
      mensajeTicket: "Messaggio del ticket",
      guardarDatos: "Salva i dati del ristorante",
      vistaPreviaRapida:
        "Anteprima rapida del ticket",
      productoEjemplo: "Prodotto di esempio",
      total: "Totale",
      mensajeVisita: "Grazie per la visita",
      guardadoCorrecto:
        "Dati del ristorante salvati correttamente",
      imprimirPrueba: "Stampa prova",
      mesa: "Tavolo",
      fecha: "Data",
      cafeEjemplo: "Caffè",
      menuEjemplo: "Menu",
      localeFecha: "it-IT",

      sinPermisosConfiguracion:
        "Non hai i permessi per questa configurazione.",
      soloAdminSuscripcion:
        "Solo l'amministratore può gestire l'abbonamento.",
      cerrarSesion: "Esci",
      archivoNoImagen:
        "Il file selezionato non è un'immagine.",

      descripcionSuscripcion:
        "Stato del periodo di prova, pagamento e dati fiscali del ristorante attuale.",
      datosFiscales: "Dati fiscali",
      estado: "Stato",
      plan: "Piano",
      diasTrial: "Giorni di prova",
      finTrial: "Fine prova",
      promocionAplicada: "Promozione applicata",
      noAplicada: "Non applicata",
      restauranteId: "ID ristorante",
      completos: "Completi",
      incompletos: "Incompleti",

      datosFiscalesFacturas:
        "Dati fiscali per le fatture",
      fiscalesFacturasCompletos:
        "Il ristorante ha tutti i dati fiscali necessari per la fatturazione.",
      fiscalesFacturasFaltan:
        "Mancano alcuni dati fiscali. Prima di pagare l'abbonamento devi completarli.",
      completarDatosFiscales:
        "Completa i dati fiscali",

      pagoMensual: "Pagamento mensile",
      pagoDisponible:
        "I dati fiscali sono completi. Il pagamento può essere attivato quando Stripe è configurato.",
      pagoBloqueado:
        "Il pagamento resta bloccato fino al completamento dei dati fiscali.",
      pagarSuscripcion: "Paga l'abbonamento",
      noConfigurado: "Non configurato",
      pagoConfirmado:
        "Pagamento confermato correttamente.",
      pagoCancelado:
        "Pagamento annullato.",

      estadoGratisVida: "Gratis a vita",
      estadoActiva: "Attivo",
      estadoPrueba: "Prova gratuita",
      estadoPendientePago: "In attesa di pagamento",
      estadoCancelada: "Annullato",
      estadoNoDefinido: "Non definito",

      planMensualStripe: "Mensile con Stripe",
      planGratisVida: "Gratis a vita",
      planPrueba: "Prova gratuita",

      completaDatosAntesPagar:
        "Completa i dati fiscali prima di pagare l'abbonamento",
      stripeNoConfiguradoEnv:
        "Stripe non è configurato. Controlla il file .env.",
      stripeNoConfigurado:
        "Stripe non è configurato.",
      errorCreandoPago:
        "Errore durante la creazione del pagamento con Stripe: ",
      errorConfirmandoStripe:
        "Errore durante la conferma di Stripe: ",

      stripeLiveNoConfirmado:
        "Stripe LIVE è configurato, ma STRIPE_LIVE_CONFIRMADO non è impostato su SI.",
      stripeLiveHttps:
        "In Stripe LIVE, APP_BASE_URL deve usare https.",
      stripeLiveNoLocalhost:
        "In Stripe LIVE, APP_BASE_URL non può essere localhost.",
      stripeLiveWebhook:
        "In Stripe LIVE, STRIPE_WEBHOOK_SECRET deve essere configurato."
    },

    en: {
      lang: "en",
      datosRestaurante: "Restaurant details",
      descripcion:
        "General, fiscal and receipt details for the current restaurant.",
      volverConfiguracion: "Back to settings",
      suscripcion: "Subscription",
      vistaPreviaTicket: "Receipt preview",
      fiscalesCompletos:
        "Fiscal details are complete for billing.",
      fiscalesFaltan:
        "Some fiscal details are missing. They must be completed before paying for the subscription.",
      datosFiscalesFacturacion:
        "Fiscal details for billing",
      datosFiscalesDescripcion:
        "These details will be used for subscription invoices when the restaurant starts paying.",
      nombreComercial: "Trading name",
      razonSocial: "Legal name",
      identificacionFiscal: "Tax ID / VAT number",
      emailFacturacion: "Billing email",
      direccionFiscal: "Fiscal address",
      codigoPostal: "Postal code",
      ciudad: "City",
      provincia: "Province / region",
      pais: "Country",
      ivaDefecto: "Default VAT (%)",
      contactoTicket: "Contact details and receipt",
      telefonoRestaurante: "Restaurant phone",
      emailRestaurante: "Restaurant email",
      nombrePropietario: "Owner name",
      emailPropietario: "Owner email",
      telefonoPropietario: "Owner phone",
      logoTicket: "Receipt logo",
      elegirImagen:
        "Click to choose an image from your computer.",
      seleccionarArchivo: "Choose file",
      ningunArchivoSeleccionado: "No file selected",
      mensajeTicket: "Receipt message",
      guardarDatos: "Save restaurant details",
      vistaPreviaRapida:
        "Quick receipt preview",
      productoEjemplo: "Example product",
      total: "Total",
      mensajeVisita: "Thank you for your visit",
      guardadoCorrecto:
        "Restaurant details saved successfully",
      imprimirPrueba: "Print test",
      mesa: "Table",
      fecha: "Date",
      cafeEjemplo: "Coffee",
      menuEjemplo: "Menu",
      localeFecha: "en-GB",

      sinPermisosConfiguracion:
        "You do not have permission to access this setting.",
      soloAdminSuscripcion:
        "Only the administrator can manage the subscription.",
      cerrarSesion: "Log out",
      archivoNoImagen:
        "The selected file is not an image.",

      descripcionSuscripcion:
        "Trial status, payment, and fiscal details for the current restaurant.",
      datosFiscales: "Fiscal details",
      estado: "Status",
      plan: "Plan",
      diasTrial: "Trial days",
      finTrial: "Trial end",
      promocionAplicada: "Promotion applied",
      noAplicada: "Not applied",
      restauranteId: "Restaurant ID",
      completos: "Complete",
      incompletos: "Incomplete",

      datosFiscalesFacturas:
        "Fiscal details for invoices",
      fiscalesFacturasCompletos:
        "The restaurant has complete fiscal details for billing.",
      fiscalesFacturasFaltan:
        "Some fiscal details are missing. Complete them before paying for the subscription.",
      completarDatosFiscales:
        "Complete fiscal details",

      pagoMensual: "Monthly payment",
      pagoDisponible:
        "The fiscal details are complete. Payment can be activated once Stripe is configured.",
      pagoBloqueado:
        "Payment remains blocked until the fiscal details are complete.",
      pagarSuscripcion: "Pay subscription",
      noConfigurado: "Not configured",
      pagoConfirmado:
        "Payment confirmed successfully.",
      pagoCancelado:
        "Payment cancelled.",

      estadoGratisVida: "Free for life",
      estadoActiva: "Active",
      estadoPrueba: "Free trial",
      estadoPendientePago: "Pending payment",
      estadoCancelada: "Cancelled",
      estadoNoDefinido: "Not defined",

      planMensualStripe: "Monthly via Stripe",
      planGratisVida: "Free for life",
      planPrueba: "Free trial",

      completaDatosAntesPagar:
        "Complete the fiscal details before paying for the subscription",
      stripeNoConfiguradoEnv:
        "Stripe is not configured. Check the .env file.",
      stripeNoConfigurado:
        "Stripe is not configured.",
      errorCreandoPago:
        "Error creating the Stripe payment: ",
      errorConfirmandoStripe:
        "Error confirming Stripe: ",

      stripeLiveNoConfirmado:
        "Stripe LIVE is configured, but STRIPE_LIVE_CONFIRMADO is not set to SI.",
      stripeLiveHttps:
        "In Stripe LIVE, APP_BASE_URL must use https.",
      stripeLiveNoLocalhost:
        "In Stripe LIVE, APP_BASE_URL cannot be localhost.",
      stripeLiveWebhook:
        "In Stripe LIVE, STRIPE_WEBHOOK_SECRET must be configured."
    }
  };

  return textos[idioma] || textos.es;
}

module.exports = {
  textosFiscalRestaurante
};
