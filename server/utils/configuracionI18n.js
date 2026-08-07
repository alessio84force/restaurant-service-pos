const { normalizarIdioma } = require("./i18n");

function textosConfiguracion(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",
      configuracion: "Configuración",
      abrirPos: "Abrir POS",
      cerrarSesion: "Cerrar sesión",
      panelDescripcion: "Panel compacto para preparar el restaurante, revisar la facturación, configurar el servicio y controlar las herramientas principales.",
      estado: "Estado",
      datosFiscales: "Datos fiscales",
      completos: "Completos",
      pendientes: "Pendientes",
      completo: "Completo",
      pendiente: "Pendiente",
      mesas: "Mesas",
      productos: "Productos",
      usuarios: "Usuarios",
      pedidosAbiertos: "Pedidos abiertos",
      herramientas: "Herramientas del restaurante",
      vistaCompacta: "Todo en una vista compacta",
      restauranteId: "Restaurante ID",
      usuario: "Usuario",
      abrirPosTexto: "Entrar en sala, mesas, pedidos y cobros.",
      servicio: "Servicio",
      restaurante: "Restaurante",
      restauranteTexto: "Datos fiscales, logo, ticket y facturación.",
      productosTexto: "Categorías, precios y productos disponibles.",
      menu: "Menú",
      mesasTexto: "Salas, zonas y numeración de mesas.",
      sala: "Sala",
      destinos: "Destinos",
      destinosTexto: "Bar, cocina y destinos personalizados.",
      comandas: "Comandas",
      impresoras: "Impresoras",
      impresorasTexto: "Ticket, bar, cocina y pruebas de impresión.",
      impresion: "Impresión",
      caja: "Caja",
      cajaTexto: "Cierres diarios, mensuales y pagos.",
      control: "Control",
      reportes: "Reportes",
      reportesTexto: "Exportaciones CSV y análisis del restaurante.",
      datos: "Datos",
      backups: "Backups",
      backupsTexto: "Copias de seguridad del restaurante actual.",
      seguro: "Seguro",
      usuariosTexto: "Crear camareros, gerentes y accesos.",
      equipo: "Equipo",
      suscripcion: "Suscripción",
      suscripcionTexto: "Trial, pago mensual y estado fiscal.",
      primerosPasos: "Primeros pasos",
      primerosPasosTexto: "Guía rápida para dejar el restaurante listo.",
      guia: "Guía",
      manual: "Manual",
      manualTexto: "Ayuda de uso para el cliente.",
      ayuda: "Ayuda",
      gratisVida: "Gratis de por vida",
      activa: "Activa",
      trialActivo: "Trial activo",
      pendientePago: "Pendiente de pago",
      cancelada: "Cancelada",
      administrador: "Administrador",
      gerente: "Gerente",
      camarero: "Camarero",
      soloCreador: "Solo creador",
      panelCreador: "Panel Creador",
      panelCreadorTexto: "Gestionar clientes SaaS, trial, suscripciones, datos fiscales, backups y acciones administrativas."
    },

    it: {
      lang: "it",
      configuracion: "Configurazione",
      abrirPos: "Apri POS",
      cerrarSesion: "Esci",
      panelDescripcion: "Pannello compatto per preparare il ristorante, controllare la fatturazione, configurare il servizio e gestire gli strumenti principali.",
      estado: "Stato",
      datosFiscales: "Dati fiscali",
      completos: "Completi",
      pendientes: "Da completare",
      completo: "Completo",
      pendiente: "Da completare",
      mesas: "Tavoli",
      productos: "Prodotti",
      usuarios: "Utenti",
      pedidosAbiertos: "Ordini aperti",
      herramientas: "Strumenti del ristorante",
      vistaCompacta: "Tutto in una schermata compatta",
      restauranteId: "ID ristorante",
      usuario: "Utente",
      abrirPosTexto: "Entra in sala e gestisci tavoli, ordini e pagamenti.",
      servicio: "Servizio",
      restaurante: "Ristorante",
      restauranteTexto: "Dati fiscali, logo, ticket e fatturazione.",
      productosTexto: "Categorie, prezzi e prodotti disponibili.",
      menu: "Menu",
      mesasTexto: "Sale, zone e numerazione dei tavoli.",
      sala: "Sala",
      destinos: "Destinazioni",
      destinosTexto: "Bar, cucina e destinazioni personalizzate.",
      comandas: "Comande",
      impresoras: "Stampanti",
      impresorasTexto: "Ticket, bar, cucina e prove di stampa.",
      impresion: "Stampa",
      caja: "Cassa",
      cajaTexto: "Chiusure giornaliere, mensili e pagamenti.",
      control: "Controllo",
      reportes: "Report",
      reportesTexto: "Esportazioni CSV e analisi del ristorante.",
      datos: "Dati",
      backups: "Backup",
      backupsTexto: "Copie di sicurezza del ristorante attuale.",
      seguro: "Sicurezza",
      usuariosTexto: "Crea camerieri, responsabili e accessi.",
      equipo: "Personale",
      suscripcion: "Abbonamento",
      suscripcionTexto: "Prova, pagamento mensile e stato fiscale.",
      primerosPasos: "Primi passi",
      primerosPasosTexto: "Guida rapida per preparare il ristorante.",
      guia: "Guida",
      manual: "Manuale",
      manualTexto: "Guida all'utilizzo per il cliente.",
      ayuda: "Aiuto",
      gratisVida: "Gratis per sempre",
      activa: "Attivo",
      trialActivo: "Prova attiva",
      pendientePago: "Pagamento in sospeso",
      cancelada: "Annullato",
      administrador: "Amministratore",
      gerente: "Responsabile",
      camarero: "Cameriere",
      soloCreador: "Solo creatore",
      panelCreador: "Pannello Creatore",
      panelCreadorTexto: "Gestione clienti SaaS, prove, abbonamenti, dati fiscali, backup e operazioni amministrative."
    },

    en: {
      lang: "en",
      configuracion: "Settings",
      abrirPos: "Open POS",
      cerrarSesion: "Sign out",
      panelDescripcion: "Compact panel for preparing the restaurant, reviewing billing, configuring service and managing the main tools.",
      estado: "Status",
      datosFiscales: "Fiscal details",
      completos: "Complete",
      pendientes: "Incomplete",
      completo: "Complete",
      pendiente: "Incomplete",
      mesas: "Tables",
      productos: "Products",
      usuarios: "Users",
      pedidosAbiertos: "Open orders",
      herramientas: "Restaurant tools",
      vistaCompacta: "Everything in one compact view",
      restauranteId: "Restaurant ID",
      usuario: "User",
      abrirPosTexto: "Enter the dining area and manage tables, orders and payments.",
      servicio: "Service",
      restaurante: "Restaurant",
      restauranteTexto: "Fiscal details, logo, receipts and billing.",
      productosTexto: "Categories, prices and available products.",
      menu: "Menu",
      mesasTexto: "Dining rooms, areas and table numbering.",
      sala: "Dining area",
      destinos: "Destinations",
      destinosTexto: "Bar, kitchen and custom destinations.",
      comandas: "Orders",
      impresoras: "Printers",
      impresorasTexto: "Receipt, bar, kitchen and printing tests.",
      impresion: "Printing",
      caja: "Cash register",
      cajaTexto: "Daily and monthly closures and payments.",
      control: "Control",
      reportes: "Reports",
      reportesTexto: "CSV exports and restaurant analysis.",
      datos: "Data",
      backups: "Backups",
      backupsTexto: "Backups for the current restaurant.",
      seguro: "Safety",
      usuariosTexto: "Create waiters, managers and access accounts.",
      equipo: "Team",
      suscripcion: "Subscription",
      suscripcionTexto: "Trial, monthly payment and fiscal status.",
      primerosPasos: "Getting started",
      primerosPasosTexto: "Quick guide for preparing the restaurant.",
      guia: "Guide",
      manual: "Manual",
      manualTexto: "Customer user guide.",
      ayuda: "Help",
      gratisVida: "Free for life",
      activa: "Active",
      trialActivo: "Trial active",
      pendientePago: "Payment pending",
      cancelada: "Cancelled",
      administrador: "Administrator",
      gerente: "Manager",
      camarero: "Waiter",
      soloCreador: "Creator only",
      panelCreador: "Creator Panel",
      panelCreadorTexto: "Manage SaaS customers, trials, subscriptions, fiscal details, backups and administrative actions."
    }
  };

  return textos[idioma] || textos.es;
}

function estadoSuscripcionTraducido(config, restaurante, textos) {
  const estado = String(
    (config && config.suscripcion_estado) ||
    (restaurante && restaurante.estado) ||
    "trial"
  ).toLowerCase();

  if (estado === "gratis_vida") return textos.gratisVida;
  if (estado === "activo") return textos.activa;
  if (estado === "trial" || estado === "prueba") return textos.trialActivo;
  if (estado === "pendiente_pago") return textos.pendientePago;
  if (estado === "cancelada") return textos.cancelada;

  return estado;
}

function rolConfiguracionTraducido(rolValor, textos) {
  const rol = String(rolValor || "").toLowerCase();

  if (rol === "admin") return textos.administrador;
  if (rol === "gerente") return textos.gerente;
  if (rol === "camarero") return textos.camarero;

  return rol;
}

module.exports = {
  textosConfiguracion,
  estadoSuscripcionTraducido,
  rolConfiguracionTraducido
};
