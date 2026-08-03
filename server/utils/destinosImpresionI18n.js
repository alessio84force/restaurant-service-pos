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
