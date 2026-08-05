const { normalizarIdioma } = require("./i18n");

function textosOnboardingCliente(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",

      tituloPagina:
        "Primeros pasos",
      titulo:
        "Primeros pasos del restaurante",
      descripcion:
        "Completa esta guía antes de usar Restaurant Service POS en un servicio real. Cuando todos los pasos estén listos, el restaurante estará preparado para trabajar.",

      progresoInicial:
        "Progreso inicial",
      progreso(completados, total, porcentaje) {
        return (
          completados +
          "/" +
          total +
          " pasos · " +
          porcentaje +
          "%"
        );
      },

      completado:
        "Completado",
      pendiente:
        "Pendiente",

      configuracion:
        "Configuración",
      abrirPos:
        "Abrir POS",
      verAyuda:
        "Ver ayuda",
      verFlujo:
        "Ver flujo",

      estados: {
        restauranteOk:
          "El restaurante tiene datos básicos configurados.",
        restaurantePendiente:
          "Faltan datos básicos del restaurante o el email del propietario.",

        mesasOk(zonas, mesas) {
          return (
            "Tienes " +
            zonas +
            " zona(s) y " +
            mesas +
            " mesa(s) activa(s)."
          );
        },
        mesasPendiente:
          "Todavía faltan salas, zonas o mesas activas.",

        productosOk(categorias, productos) {
          return (
            "Tienes " +
            categorias +
            " categoría(s) y " +
            productos +
            " producto(s) activo(s)."
          );
        },
        productosPendiente:
          "Todavía faltan categorías o productos activos.",

        destinosOk(destinos) {
          return (
            "Tienes " +
            destinos +
            " destino(s) de comanda activo(s)."
          );
        },
        destinosPendiente:
          "Faltan destinos de comanda. Como mínimo deberían existir bar y cocina.",

        impresionOk:
          "El centro de impresión tiene una configuración guardada.",
        impresionPendiente:
          "Todavía no se ha guardado la configuración de impresión.",

        pruebaOk:
          "Ya puedes hacer una prueba completa con una mesa.",
        pruebaPendiente:
          "Antes de probar una mesa necesitas mesas, productos y destinos.",

        manualOk:
          "El manual está disponible dentro de Configuración.",
        manualPendiente:
          "Manual opcional."
      },

      pasos: {
        restaurante: {
          titulo:
            "Datos del restaurante",
          descripcion:
            "Configura el nombre del restaurante, propietario, email y datos principales. Estos datos se usan en tickets, cuentas y configuración general.",
          accion:
            "Ir a configuración"
        },

        mesas: {
          titulo:
            "Crear salas, zonas y mesas",
          descripcion:
            "Crea la distribución real del restaurante: sala, terraza, barra, comedor privado o cualquier zona que utilices.",
          accion:
            "Configurar mesas"
        },

        productos: {
          titulo:
            "Crear categorías y productos",
          descripcion:
            "Añade bebidas, platos, cafés, postres y precios. Organiza los productos en categorías para que el camarero trabaje rápidamente.",
          accion:
            "Configurar productos"
        },

        destinos: {
          titulo:
            "Configurar destinos de comanda",
          descripcion:
            "Define dónde debe llegar cada comanda: bar, cocina, pizzería u otros destinos. Esto evita errores durante el servicio.",
          accion:
            "Configurar destinos"
        },

        impresion: {
          titulo:
            "Probar impresión",
          descripcion:
            "Empieza en modo de vista previa. Genera una prueba de ticket, bar y cocina antes de conectar impresoras reales.",
          accion:
            "Centro de impresión"
        },

        prueba: {
          titulo:
            "Probar una mesa completa",
          descripcion:
            "Antes de abrir al público, haz una prueba: abre una mesa, añade bebida y comida, envía comandas, imprime la cuenta, cobra y cierra la mesa."
        },

        manual: {
          titulo:
            "Manual disponible en Configuración",
          descripcion:
            "El manual explica el uso diario del POS, las comandas, los cobros, la caja, los usuarios y las preguntas frecuentes."
        }
      },

      recomendacion:
        "Recomendación",
      recomendacionTexto:
        "Antes del primer servicio real, haz una prueba con una mesa ficticia y comprueba que cada producto llega al destino correcto."
    },

    it: {
      lang: "it",

      tituloPagina:
        "Primi passi",
      titulo:
        "Primi passi del ristorante",
      descripcion:
        "Completa questa guida prima di utilizzare Restaurant Service POS durante un servizio reale. Quando tutti i passaggi saranno pronti, il ristorante potrà iniziare a lavorare.",

      progresoInicial:
        "Progresso iniziale",
      progreso(completados, total, porcentaje) {
        return (
          completados +
          "/" +
          total +
          " passaggi · " +
          porcentaje +
          "%"
        );
      },

      completado:
        "Completato",
      pendiente:
        "Da completare",

      configuracion:
        "Configurazione",
      abrirPos:
        "Apri POS",
      verAyuda:
        "Vedi aiuto",
      verFlujo:
        "Vedi flusso",

      estados: {
        restauranteOk:
          "Il ristorante dispone dei dati di base configurati.",
        restaurantePendiente:
          "Mancano i dati di base del ristorante o l'email del proprietario.",

        mesasOk(zonas, mesas) {
          return (
            "Zone attive: " +
            zonas +
            ". Tavoli attivi: " +
            mesas +
            "."
          );
        },
        mesasPendiente:
          "Mancano ancora sale, zone o tavoli attivi.",

        productosOk(categorias, productos) {
          return (
            "Categorie configurate: " +
            categorias +
            ". Prodotti attivi: " +
            productos +
            "."
          );
        },
        productosPendiente:
          "Mancano ancora categorie o prodotti attivi.",

        destinosOk(destinos) {
          return (
            "Destinazioni di comanda attive: " +
            destinos +
            "."
          );
        },
        destinosPendiente:
          "Mancano le destinazioni delle comande. Devono essere presenti almeno bar e cucina.",

        impresionOk:
          "Il centro di stampa dispone di una configurazione salvata.",
        impresionPendiente:
          "La configurazione di stampa non è ancora stata salvata.",

        pruebaOk:
          "È già possibile eseguire una prova completa con un tavolo.",
        pruebaPendiente:
          "Prima di provare un tavolo servono tavoli, prodotti e destinazioni.",

        manualOk:
          "Il manuale è disponibile nella Configurazione.",
        manualPendiente:
          "Manuale facoltativo."
      },

      pasos: {
        restaurante: {
          titulo:
            "Dati del ristorante",
          descripcion:
            "Configura il nome del ristorante, il proprietario, l'email e i dati principali. Queste informazioni vengono utilizzate nei ticket, nei conti e nella configurazione generale.",
          accion:
            "Vai alla configurazione"
        },

        mesas: {
          titulo:
            "Creare sale, zone e tavoli",
          descripcion:
            "Crea la distribuzione reale del ristorante: sala, terrazza, bar, sala privata o qualsiasi altra zona utilizzata.",
          accion:
            "Configura tavoli"
        },

        productos: {
          titulo:
            "Creare categorie e prodotti",
          descripcion:
            "Aggiungi bevande, piatti, caffè, dessert e prezzi. Organizza i prodotti in categorie affinché il cameriere possa lavorare rapidamente.",
          accion:
            "Configura prodotti"
        },

        destinos: {
          titulo:
            "Configurare le destinazioni delle comande",
          descripcion:
            "Definisci dove deve arrivare ogni comanda: bar, cucina, pizzeria o altre destinazioni. Questo evita errori durante il servizio.",
          accion:
            "Configura destinazioni"
        },

        impresion: {
          titulo:
            "Provare la stampa",
          descripcion:
            "Inizia in modalità anteprima. Genera una prova per ticket, bar e cucina prima di collegare stampanti reali.",
          accion:
            "Centro di stampa"
        },

        prueba: {
          titulo:
            "Provare un tavolo completo",
          descripcion:
            "Prima di aprire al pubblico, esegui una prova: apri un tavolo, aggiungi bevande e piatti, invia le comande, stampa il conto, registra il pagamento e chiudi il tavolo."
        },

        manual: {
          titulo:
            "Manuale disponibile nella Configurazione",
          descripcion:
            "Il manuale spiega l'uso quotidiano del POS, le comande, i pagamenti, la cassa, gli utenti e le domande frequenti."
        }
      },

      recomendacion:
        "Consiglio",
      recomendacionTexto:
        "Prima del primo servizio reale, esegui una prova con un tavolo fittizio e controlla che ogni prodotto arrivi alla destinazione corretta."
    },

    en: {
      lang: "en",

      tituloPagina:
        "Getting started",
      titulo:
        "Restaurant setup guide",
      descripcion:
        "Complete this guide before using Restaurant Service POS during a real service. When all the steps are ready, the restaurant will be prepared to operate.",

      progresoInicial:
        "Initial progress",
      progreso(completados, total, porcentaje) {
        return (
          completados +
          "/" +
          total +
          " steps · " +
          porcentaje +
          "%"
        );
      },

      completado:
        "Completed",
      pendiente:
        "Pending",

      configuracion:
        "Settings",
      abrirPos:
        "Open POS",
      verAyuda:
        "View help",
      verFlujo:
        "View workflow",

      estados: {
        restauranteOk:
          "The restaurant's basic details have been configured.",
        restaurantePendiente:
          "The restaurant's basic details or the owner's email address are missing.",

        mesasOk(zonas, mesas) {
          return (
            "Active areas: " +
            zonas +
            ". Active tables: " +
            mesas +
            "."
          );
        },
        mesasPendiente:
          "Active areas, dining rooms or tables are still missing.",

        productosOk(categorias, productos) {
          return (
            "Configured categories: " +
            categorias +
            ". Active products: " +
            productos +
            "."
          );
        },
        productosPendiente:
          "Active categories or products are still missing.",

        destinosOk(destinos) {
          return (
            "Active order destinations: " +
            destinos +
            "."
          );
        },
        destinosPendiente:
          "Order destinations are missing. At least the bar and kitchen should exist.",

        impresionOk:
          "The printing centre has a saved configuration.",
        impresionPendiente:
          "The printing configuration has not yet been saved.",

        pruebaOk:
          "A complete table test can now be performed.",
        pruebaPendiente:
          "Tables, products and destinations are required before testing a table.",

        manualOk:
          "The manual is available under Settings.",
        manualPendiente:
          "Optional manual."
      },

      pasos: {
        restaurante: {
          titulo:
            "Restaurant details",
          descripcion:
            "Configure the restaurant name, owner, email address and main details. This information is used on receipts, bills and in general settings.",
          accion:
            "Open settings"
        },

        mesas: {
          titulo:
            "Create areas and tables",
          descripcion:
            "Create the restaurant's real layout: dining room, terrace, bar, private room or any other area used.",
          accion:
            "Configure tables"
        },

        productos: {
          titulo:
            "Create categories and products",
          descripcion:
            "Add drinks, dishes, coffees, desserts and prices. Organise products into categories so that waiters can work quickly.",
          accion:
            "Configure products"
        },

        destinos: {
          titulo:
            "Configure order destinations",
          descripcion:
            "Define where each order should arrive: bar, kitchen, pizzeria or other destinations. This helps prevent mistakes during service.",
          accion:
            "Configure destinations"
        },

        impresion: {
          titulo:
            "Test printing",
          descripcion:
            "Start in preview mode. Generate test receipts for the till, bar and kitchen before connecting physical printers.",
          accion:
            "Printing centre"
        },

        prueba: {
          titulo:
            "Test a complete table",
          descripcion:
            "Before opening to customers, run a test: open a table, add drinks and food, send orders, print the bill, register payment and close the table."
        },

        manual: {
          titulo:
            "Manual available under Settings",
          descripcion:
            "The manual explains daily POS operation, orders, payments, the cash register, users and frequently asked questions."
        }
      },

      recomendacion:
        "Recommendation",
      recomendacionTexto:
        "Before the first real service, run a test using a fictitious table and check that every product reaches the correct destination."
    }
  };

  return textos[idioma] || textos.es;
}

module.exports = {
  textosOnboardingCliente
};
