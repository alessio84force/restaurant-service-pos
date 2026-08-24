const { normalizarIdioma } = require("./i18n");

function textosManualCliente(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",

      tituloPagina: "Manual de uso",
      descripcionManual(nombre) {
        return (
          "Guía práctica para usar " +
          nombre +
          " en modo self-service: crear cuenta, activar trial, " +
          "configurar el restaurante, trabajar con el POS, " +
          "controlar caja y gestionar la suscripción."
        );
      },

      volverConfiguracion: "Volver a configuración",
      abrirPos: "Abrir POS",
      imprimirManual: "Imprimir manual",
      indice: "Índice",

      enlaces: {
        inicio: "1. Flujo self-service",
        registro: "2. Crear cuenta y trial",
        fiscales: "3. Datos fiscales",
        configuracion: "4. Configuración inicial",
        mesas: "5. Salas y mesas",
        productos: "6. Productos y destinos",
        impresion: "7. Impresión",
        pos: "8. Trabajo diario POS",
        cobro: "9. Cuenta y cobro",
        caja: "10. Caja y reportes",
        usuarios: "11. Usuarios y roles",
        backups: "12. Backups",
        suscripcion: "13. Suscripción",
        ayuda: "14. Ayuda"
      },

      inicio: {
        titulo: "1. Flujo self-service",
        introduccion:
          "Restaurant Service POS está pensado para que el propietario pueda empezar sin asistencia técnica obligatoria. El flujo normal es:",
        pasos: [
          "Crear una cuenta nueva desde la página de registro.",
          "Entrar en el periodo de prueba gratuito.",
          "Completar datos fiscales y datos del restaurante.",
          "Configurar salas, mesas, productos, destinos e impresión.",
          "Usar el POS durante el servicio.",
          "Cuando termine el trial, activar la suscripción mensual."
        ],
        recomendacion:
          "Recomendación: antes del primer servicio real, crear al menos una sala, una mesa, una categoría, un producto y probar una cuenta."
      },

      registro: {
        titulo: "2. Crear cuenta y trial",
        introduccion:
          "El propietario crea la cuenta del restaurante desde /registro. Al registrarse, el sistema crea un restaurante propio y separa sus datos del resto de clientes.",
        tarjetas: [
          {
            titulo: "Cuenta del propietario",
            texto:
              "Email, contraseña y datos de acceso del administrador principal."
          },
          {
            titulo: "Trial gratuito",
            texto:
              "Periodo inicial para configurar y probar el sistema antes del pago."
          }
        ],
        alerta:
          "El propietario debe guardar bien su email y contraseña. Desde esa cuenta podrá crear usuarios camareros o gerentes."
      },

      fiscales: {
        titulo: "3. Datos fiscales obligatorios",
        introduccion:
          "Antes de activar la suscripción de pago, el restaurante debe tener completos sus datos fiscales para facturación.",
        lista: [
          "Nombre comercial",
          "Razón social o nombre fiscal",
          "NIF, CIF o VAT",
          "Dirección fiscal completa",
          "Código postal, ciudad, provincia y país",
          "Email de facturación"
        ],
        cierre:
          "Estos datos se modifican en Configuración → Restaurante. Si faltan datos fiscales, el pago de la suscripción queda bloqueado hasta completarlos."
      },

      configuracion: {
        titulo: "4. Configuración inicial",
        introduccion:
          "Desde Configuración se accede a todas las áreas principales del sistema.",
        tarjetas: [
          {
            titulo: "Restaurante",
            texto:
              "Datos fiscales, logo, ticket y mensaje de cuenta."
          },
          {
            titulo: "Productos",
            texto:
              "Categorías, precios y disponibilidad."
          },
          {
            titulo: "Mesas",
            texto:
              "Salas, zonas y numeración del local."
          },
          {
            titulo: "Impresoras y destinos",
            texto:
              "Ticket, bar, cocina y otros puntos de comanda."
          }
        ]
      },

      mesas: {
        titulo: "5. Salas, zonas y mesas",
        introduccion:
          "El restaurante puede crear sus propias zonas según su organización real: sala principal, terraza, sala inferior, privado o cualquier otra.",
        pasos: [
          "Entrar en Configuración → Mesas.",
          "Crear una zona o sala.",
          "Crear las mesas con el número o nombre que usa el restaurante.",
          "Guardar y volver al POS."
        ],
        coloresTitulo:
          "Colores habituales de mesas",
        colores: [
          "Libre",
          "Ocupada",
          "Cuenta pedida"
        ]
      },

      productos: {
        titulo:
          "6. Productos, categorías y destinos",
        introduccion:
          "Los productos se organizan por categorías. Cada producto tendrá precio, disponibilidad y un destino de comanda.",
        tarjetas: [
          {
            titulo: "Bar",
            texto:
              "Bebidas, cafés, copas o productos que no pasan por cocina."
          },
          {
            titulo: "Cocina",
            texto:
              "Platos, raciones o productos que debe preparar cocina."
          },
          {
            titulo: "Otros destinos",
            texto:
              "Pizzería, parrilla, barra exterior o cualquier destino personalizado."
          },
          {
            titulo: "Disponibilidad",
            texto:
              "Permite ocultar productos que no se venden ese día."
          }
        ]
      },

      impresion: {
        titulo:
          "7. Impresión y destinos",
        introduccion:
          "El sistema permite trabajar con impresión sencilla por ventana o con configuración de impresoras cuando el restaurante lo necesite.",
        pasos: [
          "Entrar en Configuración → Destinos para revisar bar, cocina y destinos personalizados.",
          "Entrar en Configuración → Impresoras.",
          "Probar ticket, bar y cocina.",
          "Ajustar el modo de impresión según el equipo del restaurante."
        ],
        recomendacion:
          "Para empezar, puede usarse la vista previa de ticket y comanda. La conexión con impresoras reales se puede preparar después."
      },

      pos: {
        titulo:
          "8. Trabajo diario en el POS",
        introduccion:
          "Durante el servicio, el camarero trabaja desde el POS de sala.",
        pasos: [
          "Abrir el POS.",
          "Seleccionar una mesa libre.",
          "Añadir bebidas, platos o productos.",
          "Enviar comandas a bar, cocina u otros destinos.",
          "Añadir más productos si el cliente pide algo nuevo.",
          "Pedir cuenta, cobrar y cerrar la mesa."
        ]
      },

      cobro: {
        titulo:
          "9. Cuenta, precuenta y cobro",
        introduccion:
          "Al terminar el consumo, el sistema permite generar cuenta, imprimir vista previa y cobrar.",
        tarjetas: [
          {
            titulo: "Cuenta",
            texto:
              "Genera el ticket con los datos fiscales, logo y mensaje del restaurante."
          },
          {
            titulo: "Pago",
            texto:
              "Permite registrar efectivo, tarjeta u otros métodos disponibles."
          },
          {
            titulo: "Cierre de mesa",
            texto:
              "Cuando el pedido queda pagado, la mesa vuelve a estar libre."
          },
          {
            titulo: "Pagos separados",
            texto:
              "El restaurante puede registrar diferentes pagos para una misma mesa."
          }
        ]
      },

      caja: {
        titulo:
          "10. Caja y reportes",
        introduccion:
          "La caja ayuda a revisar ventas, métodos de pago y cierres diarios o mensuales.",
        pasos: [
          "Entrar en Configuración → Caja.",
          "Revisar ventas del día y pagos registrados.",
          "Guardar el cierre diario cuando termine el servicio.",
          "Usar Reportes para exportar CSV de pagos, productos o pedidos."
        ]
      },

      usuarios: {
        titulo:
          "11. Usuarios y roles",
        introduccion:
          "El propietario puede crear usuarios para el equipo. Cada rol tiene permisos diferentes.",
        tarjetas: [
          {
            titulo: "Administrador",
            texto:
              "Control completo: configuración, usuarios, suscripción, caja y datos fiscales."
          },
          {
            titulo: "Gerente",
            texto:
              "Puede gestionar gran parte de la configuración operativa del restaurante."
          },
          {
            titulo: "Camarero",
            texto:
              "Debe usar el POS para mesas, pedidos y comandas, sin modificar la configuración general."
          },
          {
            titulo: "Usuarios inactivos",
            texto:
              "Se pueden desactivar usuarios cuando un trabajador deja el restaurante."
          }
        ]
      },

      backups: {
        titulo:
          "12. Backups",
        introduccion:
          "Los backups permiten descargar una copia de seguridad del restaurante actual.",
        pasos: [
          "Entrar en Configuración → Backups.",
          "Crear un backup.",
          "Descargar el archivo generado.",
          "Guardar la copia en un lugar seguro."
        ],
        recomendacion:
          "Cada backup está separado por restaurante. No mezcla datos de otros clientes."
      },

      suscripcion: {
        titulo:
          "13. Suscripción",
        introduccion:
          "Desde Configuración → Suscripción se revisa el estado del trial y el pago mensual.",
        tarjetas: [
          {
            titulo: "Trial",
            texto:
              "Periodo de prueba para configurar y comprobar el sistema."
          },
          {
            titulo: "Datos fiscales",
            texto:
              "Si faltan datos fiscales, el pago queda bloqueado."
          },
          {
            titulo: "Pago Stripe",
            texto:
              "Cuando Stripe esté configurado, el cliente podrá pagar desde esta pantalla."
          },
          {
            titulo: "Estado",
            texto:
              "Permite ver si la suscripción está activa, pendiente o en trial."
          }
        ]
      },

      ayuda: {
        titulo:
          "14. Ayuda y soporte",
        introduccion:
          "Si algo no funciona, seguir este orden:",
        pasos: [
          "Comprobar que el usuario ha iniciado sesión.",
          "Revisar si los datos fiscales están completos.",
          "Probar primero con una mesa y un producto de ejemplo.",
          "Hacer un backup antes de cambios importantes.",
          "Contactar con soporte si el error continúa."
        ],
        soporte: "Soporte",
        email: "Email"
      },

      footer:
        "Manual actualizado para Restaurant Service POS Self-Service SaaS."

    },

    it: {
      lang: "it",

      tituloPagina: "Manuale d'uso",
      descripcionManual(nome) {
        return (
          "Guida pratica per usare " +
          nome +
          " in modalità self-service: creare un account, " +
          "attivare il periodo di prova, configurare il ristorante, " +
          "lavorare con il POS, controllare la cassa e gestire l'abbonamento."
        );
      },

      volverConfiguracion: "Torna alla configurazione",
      abrirPos: "Apri POS",
      imprimirManual: "Stampa manuale",
      indice: "Indice",

      enlaces: {
        inicio: "1. Flusso self-service",
        registro: "2. Creare account e prova gratuita",
        fiscales: "3. Dati fiscali",
        configuracion: "4. Configurazione iniziale",
        mesas: "5. Sale e tavoli",
        productos: "6. Prodotti e destinazioni",
        impresion: "7. Stampa",
        pos: "8. Lavoro quotidiano nel POS",
        cobro: "9. Conto e pagamento",
        caja: "10. Cassa e report",
        usuarios: "11. Utenti e ruoli",
        backups: "12. Backup",
        suscripcion: "13. Abbonamento",
        ayuda: "14. Assistenza"
      },

      inicio: {
        titulo: "1. Flusso self-service",
        introduccion:
          "Restaurant Service POS è progettato affinché il proprietario possa iniziare senza assistenza tecnica obbligatoria. Il flusso normale è:",
        pasos: [
          "Creare un nuovo account dalla pagina di registrazione.",
          "Accedere al periodo di prova gratuito.",
          "Completare i dati fiscali e i dati del ristorante.",
          "Configurare sale, tavoli, prodotti, destinazioni e stampa.",
          "Usare il POS durante il servizio.",
          "Al termine del periodo di prova, attivare l'abbonamento mensile."
        ],
        recomendacion:
          "Consiglio: prima del primo servizio reale, creare almeno una sala, un tavolo, una categoria e un prodotto, quindi provare un conto."
      },

      registro: {
        titulo: "2. Creare account e prova gratuita",
        introduccion:
          "Il proprietario crea l'account del ristorante dalla pagina /registro. Durante la registrazione, il sistema crea un ristorante indipendente e separa i suoi dati da quelli degli altri clienti.",
        tarjetas: [
          {
            titulo: "Account del proprietario",
            texto:
              "Email, password e dati di accesso dell'amministratore principale."
          },
          {
            titulo: "Prova gratuita",
            texto:
              "Periodo iniziale per configurare e provare il sistema prima del pagamento."
          }
        ],
        alerta:
          "Il proprietario deve conservare con attenzione email e password. Da questo account potrà creare utenti camerieri o responsabili."
      },

      fiscales: {
        titulo: "3. Dati fiscali obbligatori",
        introduccion:
          "Prima di attivare l'abbonamento a pagamento, il ristorante deve completare i dati fiscali necessari per la fatturazione.",
        lista: [
          "Nome commerciale",
          "Ragione sociale o denominazione fiscale",
          "Codice fiscale, partita IVA o VAT",
          "Indirizzo fiscale completo",
          "Codice postale, città, provincia e paese",
          "Email di fatturazione"
        ],
        cierre:
          "Questi dati si modificano in Configurazione → Ristorante. Se mancano dati fiscali, il pagamento dell'abbonamento rimane bloccato fino al loro completamento."
      },

      configuracion: {
        titulo: "4. Configurazione iniziale",
        introduccion:
          "Da Configurazione si accede a tutte le aree principali del sistema.",
        tarjetas: [
          {
            titulo: "Ristorante",
            texto:
              "Dati fiscali, logo, ticket e messaggio del conto."
          },
          {
            titulo: "Prodotti",
            texto:
              "Categorie, prezzi e disponibilità."
          },
          {
            titulo: "Tavoli",
            texto:
              "Sale, zone e numerazione del locale."
          },
          {
            titulo: "Stampanti e destinazioni",
            texto:
              "Ticket, bar, cucina e altri punti di comanda."
          }
        ]
      },

      mesas: {
        titulo: "5. Sale, zone e tavoli",
        introduccion:
          "Il ristorante può creare liberamente le proprie zone in base all'organizzazione reale: sala principale, terrazza, sala inferiore, privato o qualsiasi altra.",
        pasos: [
          "Entrare in Configurazione → Tavoli.",
          "Creare una zona o una sala.",
          "Creare i tavoli con il numero o il nome utilizzato dal ristorante.",
          "Salvare e tornare al POS."
        ],
        coloresTitulo:
          "Colori abituali dei tavoli",
        colores: [
          "Libero",
          "Occupato",
          "Conto richiesto"
        ]
      },

      productos: {
        titulo:
          "6. Prodotti, categorie e destinazioni",
        introduccion:
          "I prodotti sono organizzati per categorie. Ogni prodotto dispone di prezzo, disponibilità e destinazione della comanda.",
        tarjetas: [
          {
            titulo: "Bar",
            texto:
              "Bevande, caffè, cocktail o prodotti che non passano dalla cucina."
          },
          {
            titulo: "Cucina",
            texto:
              "Piatti, porzioni o prodotti che devono essere preparati in cucina."
          },
          {
            titulo: "Altre destinazioni",
            texto:
              "Pizzeria, griglia, bar esterno o qualsiasi destinazione personalizzata."
          },
          {
            titulo: "Disponibilità",
            texto:
              "Permette di nascondere i prodotti che non vengono venduti quel giorno."
          }
        ]
      },

      impresion: {
        titulo:
          "7. Stampa e destinazioni",
        introduccion:
          "Il sistema permette di lavorare con la stampa semplice tramite finestra oppure con la configurazione delle stampanti, quando necessaria.",
        pasos: [
          "Entrare in Configurazione → Destinazioni per controllare bar, cucina e destinazioni personalizzate.",
          "Entrare in Configurazione → Stampanti.",
          "Provare ticket, bar e cucina.",
          "Regolare la modalità di stampa in base alle apparecchiature del ristorante."
        ],
        recomendacion:
          "Per iniziare è possibile utilizzare l'anteprima del ticket e della comanda. Il collegamento alle stampanti reali può essere preparato successivamente."
      },

      pos: {
        titulo:
          "8. Lavoro quotidiano nel POS",
        introduccion:
          "Durante il servizio, il cameriere lavora dal POS di sala.",
        pasos: [
          "Aprire il POS.",
          "Selezionare un tavolo libero.",
          "Aggiungere bevande, piatti o prodotti.",
          "Inviare le comande al bar, alla cucina o ad altre destinazioni.",
          "Aggiungere altri prodotti quando il cliente ordina qualcosa di nuovo.",
          "Richiedere il conto, registrare il pagamento e chiudere il tavolo."
        ]
      },

      cobro: {
        titulo:
          "9. Conto, preconto e pagamento",
        introduccion:
          "Al termine della consumazione, il sistema permette di generare il conto, visualizzare l'anteprima e registrare il pagamento.",
        tarjetas: [
          {
            titulo: "Conto",
            texto:
              "Genera il ticket con dati fiscali, logo e messaggio del ristorante."
          },
          {
            titulo: "Pagamento",
            texto:
              "Permette di registrare contanti, carta o altri metodi disponibili."
          },
          {
            titulo: "Chiusura del tavolo",
            texto:
              "Quando l'ordine è completamente pagato, il tavolo torna libero."
          },
          {
            titulo: "Pagamenti separati",
            texto:
              "Il ristorante può registrare pagamenti diversi per lo stesso tavolo."
          }
        ]
      },

      caja: {
        titulo:
          "10. Cassa e report",
        introduccion:
          "La cassa permette di controllare vendite, metodi di pagamento e chiusure giornaliere o mensili.",
        pasos: [
          "Entrare in Configurazione → Cassa.",
          "Controllare le vendite del giorno e i pagamenti registrati.",
          "Salvare la chiusura giornaliera al termine del servizio.",
          "Utilizzare Report per esportare CSV di pagamenti, prodotti o ordini."
        ]
      },

      usuarios: {
        titulo:
          "11. Utenti e ruoli",
        introduccion:
          "Il proprietario può creare utenti per il personale. Ogni ruolo dispone di permessi differenti.",
        tarjetas: [
          {
            titulo: "Amministratore",
            texto:
              "Controllo completo di configurazione, utenti, abbonamento, cassa e dati fiscali."
          },
          {
            titulo: "Responsabile",
            texto:
              "Può gestire gran parte della configurazione operativa del ristorante."
          },
          {
            titulo: "Cameriere",
            texto:
              "Utilizza il POS per tavoli, ordini e comande senza modificare la configurazione generale."
          },
          {
            titulo: "Utenti inattivi",
            texto:
              "Gli utenti possono essere disattivati quando un dipendente lascia il ristorante."
          }
        ]
      },

      backups: {
        titulo:
          "12. Backup",
        introduccion:
          "I backup permettono di scaricare una copia di sicurezza dei dati del ristorante attuale.",
        pasos: [
          "Entrare in Configurazione → Backup.",
          "Creare un backup.",
          "Scaricare il file generato.",
          "Conservare la copia in un luogo sicuro."
        ],
        recomendacion:
          "Ogni backup è separato per ristorante e non contiene dati appartenenti ad altri clienti."
      },

      suscripcion: {
        titulo:
          "13. Abbonamento",
        introduccion:
          "Da Configurazione → Abbonamento è possibile controllare lo stato del periodo di prova e il pagamento mensile.",
        tarjetas: [
          {
            titulo: "Prova gratuita",
            texto:
              "Periodo di prova per configurare e verificare il sistema."
          },
          {
            titulo: "Dati fiscali",
            texto:
              "Quando mancano dati fiscali, il pagamento rimane bloccato."
          },
          {
            titulo: "Pagamento Stripe",
            texto:
              "Quando Stripe è configurato, il cliente può pagare da questa pagina."
          },
          {
            titulo: "Stato",
            texto:
              "Mostra se l'abbonamento è attivo, in attesa o nel periodo di prova."
          }
        ]
      },

      ayuda: {
        titulo:
          "14. Assistenza e supporto",
        introduccion:
          "Quando qualcosa non funziona, seguire questo ordine:",
        pasos: [
          "Controllare che l'utente abbia effettuato l'accesso.",
          "Verificare che i dati fiscali siano completi.",
          "Effettuare prima una prova con un tavolo e un prodotto di esempio.",
          "Creare un backup prima di modifiche importanti.",
          "Contattare il supporto se l'errore continua."
        ],
        soporte: "Supporto",
        email: "Email"
      },

      footer:
        "Manuale aggiornato per Restaurant Service POS Self-Service SaaS."

    },

    en: {
      lang: "en",

      tituloPagina: "User manual",
      descripcionManual(name) {
        return (
          "A practical guide to using " +
          name +
          " in self-service mode: creating an account, activating the trial, " +
          "configuring the restaurant, working with the POS, " +
          "checking the cash register and managing the subscription."
        );
      },

      volverConfiguracion: "Back to settings",
      abrirPos: "Open POS",
      imprimirManual: "Print manual",
      indice: "Contents",

      enlaces: {
        inicio: "1. Self-service workflow",
        registro: "2. Create an account and trial",
        fiscales: "3. Tax details",
        configuracion: "4. Initial configuration",
        mesas: "5. Areas and tables",
        productos: "6. Products and destinations",
        impresion: "7. Printing",
        pos: "8. Daily POS operation",
        cobro: "9. Bill and payment",
        caja: "10. Cash register and reports",
        usuarios: "11. Users and roles",
        backups: "12. Backups",
        suscripcion: "13. Subscription",
        ayuda: "14. Help"
      },

      inicio: {
        titulo: "1. Self-service workflow",
        introduccion:
          "Restaurant Service POS is designed so that the owner can get started without mandatory technical assistance. The normal workflow is:",
        pasos: [
          "Create a new account from the registration page.",
          "Start the free trial period.",
          "Complete the tax details and restaurant information.",
          "Configure areas, tables, products, destinations and printing.",
          "Use the POS during service.",
          "When the trial ends, activate the monthly subscription."
        ],
        recomendacion:
          "Recommendation: before the first real service, create at least one area, one table, one category and one product, and test a bill."
      },

      registro: {
        titulo: "2. Create an account and trial",
        introduccion:
          "The owner creates the restaurant account from /registro. During registration, the system creates an independent restaurant and separates its data from that of other customers.",
        tarjetas: [
          {
            titulo: "Owner account",
            texto:
              "Email address, password and access details for the main administrator."
          },
          {
            titulo: "Free trial",
            texto:
              "Initial period for configuring and testing the system before payment."
          }
        ],
        alerta:
          "The owner must keep the email address and password safe. This account can be used to create waiter or manager users."
      },

      fiscales: {
        titulo: "3. Required tax details",
        introduccion:
          "Before activating the paid subscription, the restaurant must complete the tax details required for billing.",
        lista: [
          "Trading name",
          "Legal or registered name",
          "Tax identification number or VAT number",
          "Full billing address",
          "Postcode, city, province or region, and country",
          "Billing email address"
        ],
        cierre:
          "These details are changed under Settings → Restaurant. If tax details are missing, subscription payment remains blocked until they are completed."
      },

      configuracion: {
        titulo: "4. Initial configuration",
        introduccion:
          "Settings provides access to all the main areas of the system.",
        tarjetas: [
          {
            titulo: "Restaurant",
            texto:
              "Tax details, logo, receipt and bill message."
          },
          {
            titulo: "Products",
            texto:
              "Categories, prices and availability."
          },
          {
            titulo: "Tables",
            texto:
              "Areas, sections and the restaurant's table numbering."
          },
          {
            titulo: "Printers and destinations",
            texto:
              "Receipt, bar, kitchen and other order destinations."
          }
        ]
      },

      mesas: {
        titulo: "5. Areas, sections and tables",
        introduccion:
          "The restaurant can create its own areas according to its real organisation: main dining room, terrace, lower floor, private room or any other area.",
        pasos: [
          "Open Settings → Tables.",
          "Create an area or dining room.",
          "Create tables using the number or name used by the restaurant.",
          "Save and return to the POS."
        ],
        coloresTitulo:
          "Common table colours",
        colores: [
          "Available",
          "Occupied",
          "Bill requested"
        ]
      },

      productos: {
        titulo:
          "6. Products, categories and destinations",
        introduccion:
          "Products are organised into categories. Each product has a price, availability status and order destination.",
        tarjetas: [
          {
            titulo: "Bar",
            texto:
              "Drinks, coffees, cocktails or products that do not go through the kitchen."
          },
          {
            titulo: "Kitchen",
            texto:
              "Dishes, portions or products that must be prepared in the kitchen."
          },
          {
            titulo: "Other destinations",
            texto:
              "Pizzeria, grill, outdoor bar or any custom destination."
          },
          {
            titulo: "Availability",
            texto:
              "Allows products that are not being sold that day to be hidden."
          }
        ]
      },

      impresion: {
        titulo:
          "7. Printing and destinations",
        introduccion:
          "The system can use simple browser-window printing or configured printers when the restaurant requires them.",
        pasos: [
          "Open Settings → Destinations to review the bar, kitchen and custom destinations.",
          "Open Settings → Printers.",
          "Test receipt, bar and kitchen printing.",
          "Adjust the printing mode for the restaurant's equipment."
        ],
        recomendacion:
          "To get started, the receipt and order previews can be used. Connections to physical printers can be prepared later."
      },

      pos: {
        titulo:
          "8. Daily POS operation",
        introduccion:
          "During service, the waiter works from the dining-room POS.",
        pasos: [
          "Open the POS.",
          "Select an available table.",
          "Add drinks, dishes or products.",
          "Send orders to the bar, kitchen or other destinations.",
          "Add more products when the customer orders something else.",
          "Request the bill, register payment and close the table."
        ]
      },

      cobro: {
        titulo:
          "9. Bill, pre-bill and payment",
        introduccion:
          "At the end of the order, the system can generate the bill, display a preview and register payment.",
        tarjetas: [
          {
            titulo: "Bill",
            texto:
              "Generates the receipt using the restaurant's tax details, logo and message."
          },
          {
            titulo: "Payment",
            texto:
              "Records cash, card or other available payment methods."
          },
          {
            titulo: "Closing the table",
            texto:
              "When the order is fully paid, the table becomes available again."
          },
          {
            titulo: "Split payments",
            texto:
              "The restaurant can record different payments for the same table."
          }
        ]
      },

      caja: {
        titulo:
          "10. Cash register and reports",
        introduccion:
          "The cash register helps review sales, payment methods and daily or monthly closures.",
        pasos: [
          "Open Settings → Cash register.",
          "Review the day's sales and registered payments.",
          "Save the daily closure when service ends.",
          "Use Reports to export payment, product or order CSV files."
        ]
      },

      usuarios: {
        titulo:
          "11. Users and roles",
        introduccion:
          "The owner can create users for the team. Each role has different permissions.",
        tarjetas: [
          {
            titulo: "Administrator",
            texto:
              "Full control of settings, users, subscription, cash register and tax details."
          },
          {
            titulo: "Manager",
            texto:
              "Can manage most of the restaurant's operational configuration."
          },
          {
            titulo: "Waiter",
            texto:
              "Uses the POS for tables, orders and tickets without changing general settings."
          },
          {
            titulo: "Inactive users",
            texto:
              "Users can be deactivated when a member of staff leaves the restaurant."
          }
        ]
      },

      backups: {
        titulo:
          "12. Backups",
        introduccion:
          "Backups allow a security copy of the current restaurant's data to be downloaded.",
        pasos: [
          "Open Settings → Backups.",
          "Create a backup.",
          "Download the generated file.",
          "Keep the copy in a safe place."
        ],
        recomendacion:
          "Each backup is separated by restaurant and does not mix data belonging to other customers."
      },

      suscripcion: {
        titulo:
          "13. Subscription",
        introduccion:
          "Settings → Subscription shows the trial status and monthly payment.",
        tarjetas: [
          {
            titulo: "Free trial",
            texto:
              "Trial period for configuring and checking the system."
          },
          {
            titulo: "Tax details",
            texto:
              "Payment remains blocked when required tax details are missing."
          },
          {
            titulo: "Stripe payment",
            texto:
              "When Stripe is configured, the customer can pay from this page."
          },
          {
            titulo: "Status",
            texto:
              "Shows whether the subscription is active, pending or in trial."
          }
        ]
      },

      ayuda: {
        titulo:
          "14. Help and support",
        introduccion:
          "When something does not work, follow these steps:",
        pasos: [
          "Check that the user is signed in.",
          "Check that the tax details are complete.",
          "Test first with one table and one sample product.",
          "Create a backup before making important changes.",
          "Contact support if the error continues."
        ],
        soporte: "Support",
        email: "Email"
      },

      footer:
        "Manual updated for Restaurant Service POS Self-Service SaaS."

    },

    "pt-br": {
      lang: "pt-BR",

      tituloPagina: "Manual de uso",

      descripcionManual(nombre) {
        return (
          "Guia prático para usar " +
          nombre +
          " em modo self-service: criar uma conta, iniciar o período de teste, " +
          "configurar o restaurante, trabalhar com o POS, " +
          "controlar o caixa e gerenciar a assinatura."
        );
      },

      volverConfiguracion:
        "Voltar às configurações",

      abrirPos:
        "Abrir POS",

      imprimirManual:
        "Imprimir manual",

      indice:
        "Índice",

      enlaces: {
        inicio:
          "1. Fluxo self-service",

        registro:
          "2. Criar conta e período de teste",

        fiscales:
          "3. Dados fiscais",

        configuracion:
          "4. Configuração inicial",

        mesas:
          "5. Salões e mesas",

        productos:
          "6. Produtos e destinos",

        impresion:
          "7. Impressão",

        pos:
          "8. Operação diária do POS",

        cobro:
          "9. Conta e pagamento",

        caja:
          "10. Caixa e relatórios",

        usuarios:
          "11. Usuários e funções",

        backups:
          "12. Backups",

        suscripcion:
          "13. Assinatura",

        ayuda:
          "14. Ajuda"
      },

      inicio: {
        titulo:
          "1. Fluxo self-service",

        introduccion:
          "O Restaurant Service POS foi desenvolvido para que o proprietário possa começar sem assistência técnica obrigatória. O fluxo normal é:",

        pasos: [
          "Criar uma nova conta pela página de cadastro.",
          "Iniciar o período de teste gratuito.",
          "Preencher os dados fiscais e os dados do restaurante.",
          "Configurar salões, mesas, produtos, destinos e impressão.",
          "Usar o POS durante o serviço.",
          "Quando o período de teste terminar, ativar a assinatura mensal."
        ],

        recomendacion:
          "Recomendação: antes do primeiro serviço real, crie pelo menos um salão, uma mesa, uma categoria e um produto e teste uma conta."
      },

      registro: {
        titulo:
          "2. Criar conta e período de teste",

        introduccion:
          "O proprietário cria a conta do restaurante em /registro. Durante o cadastro, o sistema cria um restaurante próprio e mantém seus dados separados dos demais clientes.",

        tarjetas: [
          {
            titulo:
              "Conta do proprietário",

            texto:
              "E-mail, senha e dados de acesso do administrador principal."
          },
          {
            titulo:
              "Período de teste gratuito",

            texto:
              "Período inicial para configurar e testar o sistema antes do pagamento."
          }
        ],

        alerta:
          "O proprietário deve guardar com segurança seu e-mail e sua senha. A partir dessa conta, poderá criar usuários garçons ou gerentes."
      },

      fiscales: {
        titulo:
          "3. Dados fiscais obrigatórios",

        introduccion:
          "Antes de ativar a assinatura paga, o restaurante deve preencher os dados fiscais necessários para o faturamento.",

        lista: [
          "Nome comercial",
          "Razão social ou nome registrado",
          "Número de identificação fiscal ou número de IVA/VAT",
          "Endereço completo de faturamento",
          "CEP, cidade, estado, província ou região e país",
          "E-mail de faturamento"
        ],

        cierre:
          "Esses dados são alterados em Configurações → Restaurante. Se faltarem dados fiscais, o pagamento da assinatura permanecerá bloqueado até que sejam preenchidos."
      },

      configuracion: {
        titulo:
          "4. Configuração inicial",

        introduccion:
          "As Configurações dão acesso às principais áreas do sistema.",

        tarjetas: [
          {
            titulo:
              "Restaurante",

            texto:
              "Dados fiscais, logotipo, comprovante e mensagem da conta."
          },
          {
            titulo:
              "Produtos",

            texto:
              "Categorias, preços e disponibilidade."
          },
          {
            titulo:
              "Mesas",

            texto:
              "Salões, áreas e numeração das mesas do restaurante."
          },
          {
            titulo:
              "Impressoras e destinos",

            texto:
              "Comprovante, bar, cozinha e outros destinos de comandas."
          }
        ]
      },

      mesas: {
        titulo:
          "5. Salões, áreas e mesas",

        introduccion:
          "O restaurante pode criar seus próprios espaços de acordo com sua organização real: salão principal, terraço, piso inferior, sala privativa ou qualquer outra área.",

        pasos: [
          "Abra Configurações → Mesas.",
          "Crie um salão ou uma área.",
          "Crie as mesas usando o número ou nome utilizado pelo restaurante.",
          "Salve e volte ao POS."
        ],

        coloresTitulo:
          "Estados comuns das mesas",

        colores: [
          "Livre",
          "Ocupada",
          "Conta solicitada"
        ]
      },

      productos: {
        titulo:
          "6. Produtos, categorias e destinos",

        introduccion:
          "Os produtos são organizados em categorias. Cada produto possui preço, estado de disponibilidade e destino da comanda.",

        tarjetas: [
          {
            titulo:
              "Bar",

            texto:
              "Bebidas, cafés, coquetéis ou produtos que não passam pela cozinha."
          },
          {
            titulo:
              "Cozinha",

            texto:
              "Pratos, porções ou produtos que precisam ser preparados na cozinha."
          },
          {
            titulo:
              "Outros destinos",

            texto:
              "Pizzaria, churrasqueira, bar externo ou qualquer destino personalizado."
          },
          {
            titulo:
              "Disponibilidade",

            texto:
              "Permite ocultar produtos que não estão sendo vendidos naquele dia."
          }
        ]
      },

      impresion: {
        titulo:
          "7. Impressão e destinos",

        introduccion:
          "O sistema pode usar a impressão simples pela janela do navegador ou impressoras configuradas quando o restaurante precisar.",

        pasos: [
          "Abra Configurações → Destinos para revisar bar, cozinha e destinos personalizados.",
          "Abra Configurações → Impressoras.",
          "Teste a impressão do comprovante, do bar e da cozinha.",
          "Ajuste o modo de impressão de acordo com os equipamentos do restaurante."
        ],

        recomendacion:
          "Para começar, podem ser usadas as visualizações do comprovante e das comandas. A conexão com impressoras físicas pode ser preparada posteriormente."
      },

      pos: {
        titulo:
          "8. Operação diária do POS",

        introduccion:
          "Durante o serviço, o garçom trabalha pelo POS do salão.",

        pasos: [
          "Abra o POS.",
          "Selecione uma mesa livre.",
          "Adicione bebidas, pratos ou produtos.",
          "Envie as comandas para o bar, cozinha ou outros destinos.",
          "Adicione mais produtos quando o cliente fizer outro pedido.",
          "Solicite a conta, registre o pagamento e feche a mesa."
        ]
      },

      cobro: {
        titulo:
          "9. Conta, pré-conta e pagamento",

        introduccion:
          "Ao finalizar o pedido, o sistema pode gerar a conta, mostrar uma prévia e registrar o pagamento.",

        tarjetas: [
          {
            titulo:
              "Conta",

            texto:
              "Gera o comprovante usando os dados fiscais, o logotipo e a mensagem do restaurante."
          },
          {
            titulo:
              "Pagamento",

            texto:
              "Registra dinheiro, cartão ou outros métodos de pagamento disponíveis."
          },
          {
            titulo:
              "Fechamento da mesa",

            texto:
              "Quando o pedido é totalmente pago, a mesa volta a ficar livre."
          },
          {
            titulo:
              "Pagamentos divididos",

            texto:
              "O restaurante pode registrar diferentes pagamentos para a mesma mesa."
          }
        ]
      },

      caja: {
        titulo:
          "10. Caixa e relatórios",

        introduccion:
          "O caixa permite revisar vendas, métodos de pagamento e fechamentos diários ou mensais.",

        pasos: [
          "Abra Configurações → Caixa.",
          "Revise as vendas do dia e os pagamentos registrados.",
          "Salve o fechamento diário quando o serviço terminar.",
          "Use Relatórios para exportar arquivos CSV de pagamentos, produtos ou pedidos."
        ]
      },

      usuarios: {
        titulo:
          "11. Usuários e funções",

        introduccion:
          "O proprietário pode criar usuários para a equipe. Cada função possui permissões diferentes.",

        tarjetas: [
          {
            titulo:
              "Administrador",

            texto:
              "Controle completo das configurações, usuários, assinatura, caixa e dados fiscais."
          },
          {
            titulo:
              "Gerente",

            texto:
              "Pode gerenciar a maior parte da configuração operacional do restaurante."
          },
          {
            titulo:
              "Garçom",

            texto:
              "Usa o POS para mesas, pedidos e comprovantes sem alterar as configurações gerais."
          },
          {
            titulo:
              "Usuários inativos",

            texto:
              "Os usuários podem ser desativados quando um membro da equipe deixar o restaurante."
          }
        ]
      },

      backups: {
        titulo:
          "12. Backups",

        introduccion:
          "Os backups permitem baixar uma cópia de segurança dos dados do restaurante atual.",

        pasos: [
          "Abra Configurações → Backups.",
          "Crie um backup.",
          "Baixe o arquivo gerado.",
          "Guarde a cópia em um local seguro."
        ],

        recomendacion:
          "Cada backup é separado por restaurante e não mistura dados pertencentes a outros clientes."
      },

      suscripcion: {
        titulo:
          "13. Assinatura",

        introduccion:
          "Configurações → Assinatura mostra o estado do período de teste e do pagamento mensal.",

        tarjetas: [
          {
            titulo:
              "Período de teste gratuito",

            texto:
              "Período para configurar e verificar o funcionamento do sistema."
          },
          {
            titulo:
              "Dados fiscais",

            texto:
              "O pagamento permanece bloqueado quando faltam os dados fiscais obrigatórios."
          },
          {
            titulo:
              "Pagamento com Stripe",

            texto:
              "Quando o Stripe está configurado, o cliente pode pagar por esta página."
          },
          {
            titulo:
              "Estado",

            texto:
              "Mostra se a assinatura está ativa, pendente ou em período de teste."
          }
        ]
      },

      ayuda: {
        titulo:
          "14. Ajuda e suporte",

        introduccion:
          "Quando algo não funcionar, siga estas etapas:",

        pasos: [
          "Verifique se o usuário iniciou a sessão.",
          "Verifique se os dados fiscais estão completos.",
          "Faça primeiro um teste com uma mesa e um produto de exemplo.",
          "Crie um backup antes de fazer alterações importantes.",
          "Entre em contato com o suporte se o erro continuar."
        ],

        soporte:
          "Suporte",

        email:
          "E-mail"
      },

      footer:
        "Manual atualizado para o Restaurant Service POS SaaS self-service."
    }
  };

  return textos[idioma] || textos.es;
}

module.exports = {
  textosManualCliente
};
