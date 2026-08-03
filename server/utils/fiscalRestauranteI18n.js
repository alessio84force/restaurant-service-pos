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
      localeFecha: "es-ES"
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
      localeFecha: "it-IT"
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
      localeFecha: "en-GB"
    }
  };

  return textos[idioma] || textos.es;
}

module.exports = {
  textosFiscalRestaurante
};
