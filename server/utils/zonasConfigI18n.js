const { normalizarIdioma } = require("./i18n");

function textosZonasConfig(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",
      configuracionSalasMesas: "Configuración de salas y mesas",
      descripcion:
        "Crea las salas, zonas y mesas de este restaurante. Cada restaurante solo ve sus propias mesas.",
      volverConfiguracion: "Volver a configuración",
      primerosPasos: "Primeros pasos",
      abrirPos: "Abrir POS",

      nuevaSalaZona: "Nueva sala/zona",
      nombre: "Nombre",
      placeholderSala: "Sala principal, Terraza, Barra...",
      crearSala: "Crear sala",

      nuevaMesa: "Nueva mesa",
      numeroNombre: "Número o nombre",
      placeholderMesa: "1, 2, VIP...",
      salaZona: "Sala/zona",
      primeroSala: "Primero crea una sala",
      crearMesa: "Crear mesa",

      guardar: "Guardar",
      ocultar: "Ocultar",
      activar: "Activar",
      estado: "Estado",
      guardarSala: "Guardar sala",
      ocultarSala: "Ocultar sala",
      activarSala: "Activar sala",

      sinMesasSala: "Esta sala todavía no tiene mesas.",
      sinSalas:
        "Todavía no hay salas. Crea la primera sala para empezar.",

      estadoLibre: "Libre",
      estadoOcupada: "Ocupada",
      estadoReservada: "Reservada",
      estadoCuenta: "Cuenta",

      nombreSalaObligatorio: "Nombre de sala obligatorio",
      salaCreada: "Sala creada correctamente",
      datosSalaIncompletos: "Datos de sala incompletos",
      salaActualizada: "Sala actualizada correctamente",
      salaNoEncontrada: "Sala no encontrada",
      noOcultarSalaOcupadas:
        "No puedes ocultar una sala con mesas ocupadas, reservadas o en cuenta",

      datosMesaIncompletos: "Datos de mesa incompletos",
      salaNoEncontradaRestaurante:
        "Sala no encontrada para este restaurante",
      mesaCreada: "Mesa creada correctamente",
      mesaNoEncontrada: "Mesa no encontrada",
      mesaActualizada: "Mesa actualizada correctamente",
      soloOcultarMesasLibres:
        "Solo puedes ocultar mesas libres",
      visibilidadMesaActualizada:
        "Visibilidad de mesa actualizada correctamente",

      sinPermisos:
        "No tienes permisos para configurar mesas."
    },

    it: {
      lang: "it",
      configuracionSalasMesas: "Configurazione di sale e tavoli",
      descripcion:
        "Crea le sale, le zone e i tavoli di questo ristorante. Ogni ristorante vede soltanto i propri tavoli.",
      volverConfiguracion: "Torna alla configurazione",
      primerosPasos: "Primi passi",
      abrirPos: "Apri POS",

      nuevaSalaZona: "Nuova sala/zona",
      nombre: "Nome",
      placeholderSala: "Sala principale, Terrazza, Bancone...",
      crearSala: "Crea sala",

      nuevaMesa: "Nuovo tavolo",
      numeroNombre: "Numero o nome",
      placeholderMesa: "1, 2, VIP...",
      salaZona: "Sala/zona",
      primeroSala: "Prima crea una sala",
      crearMesa: "Crea tavolo",

      guardar: "Salva",
      ocultar: "Nascondi",
      activar: "Attiva",
      estado: "Stato",
      guardarSala: "Salva sala",
      ocultarSala: "Nascondi sala",
      activarSala: "Attiva sala",

      sinMesasSala: "Questa sala non ha ancora tavoli.",
      sinSalas:
        "Non ci sono ancora sale. Crea la prima sala per iniziare.",

      estadoLibre: "Libero",
      estadoOcupada: "Occupato",
      estadoReservada: "Prenotato",
      estadoCuenta: "Conto richiesto",

      nombreSalaObligatorio:
        "Il nome della sala è obbligatorio",
      salaCreada: "Sala creata correttamente",
      datosSalaIncompletos: "Dati della sala incompleti",
      salaActualizada: "Sala aggiornata correttamente",
      salaNoEncontrada: "Sala non trovata",
      noOcultarSalaOcupadas:
        "Non puoi nascondere una sala con tavoli occupati, prenotati o con il conto richiesto",

      datosMesaIncompletos: "Dati del tavolo incompleti",
      salaNoEncontradaRestaurante:
        "Sala non trovata per questo ristorante",
      mesaCreada: "Tavolo creato correttamente",
      mesaNoEncontrada: "Tavolo non trovato",
      mesaActualizada: "Tavolo aggiornato correttamente",
      soloOcultarMesasLibres:
        "Puoi nascondere soltanto i tavoli liberi",
      visibilidadMesaActualizada:
        "Visibilità del tavolo aggiornata correttamente",

      sinPermisos:
        "Non hai i permessi per configurare i tavoli."
    },

    en: {
      lang: "en",
      configuracionSalasMesas: "Room and table settings",
      descripcion:
        "Create the rooms, areas and tables for this restaurant. Each restaurant only sees its own tables.",
      volverConfiguracion: "Back to settings",
      primerosPasos: "Getting started",
      abrirPos: "Open POS",

      nuevaSalaZona: "New room/area",
      nombre: "Name",
      placeholderSala: "Main room, Terrace, Bar...",
      crearSala: "Create room",

      nuevaMesa: "New table",
      numeroNombre: "Number or name",
      placeholderMesa: "1, 2, VIP...",
      salaZona: "Room/area",
      primeroSala: "Create a room first",
      crearMesa: "Create table",

      guardar: "Save",
      ocultar: "Hide",
      activar: "Activate",
      estado: "Status",
      guardarSala: "Save room",
      ocultarSala: "Hide room",
      activarSala: "Activate room",

      sinMesasSala: "This room does not have any tables yet.",
      sinSalas:
        "There are no rooms yet. Create the first room to get started.",

      estadoLibre: "Free",
      estadoOcupada: "Occupied",
      estadoReservada: "Reserved",
      estadoCuenta: "Bill requested",

      nombreSalaObligatorio: "Room name is required",
      salaCreada: "Room created successfully",
      datosSalaIncompletos: "Room details are incomplete",
      salaActualizada: "Room updated successfully",
      salaNoEncontrada: "Room not found",
      noOcultarSalaOcupadas:
        "You cannot hide a room with occupied, reserved or bill-requested tables",

      datosMesaIncompletos: "Table details are incomplete",
      salaNoEncontradaRestaurante:
        "Room not found for this restaurant",
      mesaCreada: "Table created successfully",
      mesaNoEncontrada: "Table not found",
      mesaActualizada: "Table updated successfully",
      soloOcultarMesasLibres:
        "You can only hide free tables",
      visibilidadMesaActualizada:
        "Table visibility updated successfully",

      sinPermisos:
        "You do not have permission to configure tables."
    },
    "pt-br": {
          "lang": "pt-BR",
          "configuracionSalasMesas": "Configuração de salões e mesas",
          "descripcion": "Crie os salões, áreas e mesas deste restaurante. Cada restaurante vê apenas as próprias mesas.",
          "volverConfiguracion": "Voltar às configurações",
          "primerosPasos": "Primeiros passos",
          "abrirPos": "Abrir POS",
          "nuevaSalaZona": "Novo salão/área",
          "nombre": "Nome",
          "placeholderSala": "Salão principal, Terraço, Bar...",
          "crearSala": "Criar salão",
          "nuevaMesa": "Nova mesa",
          "numeroNombre": "Número ou nome",
          "placeholderMesa": "1, 2, VIP...",
          "salaZona": "Salão/área",
          "primeroSala": "Crie um salão primeiro",
          "crearMesa": "Criar mesa",
          "guardar": "Salvar",
          "ocultar": "Ocultar",
          "activar": "Ativar",
          "estado": "Status",
          "guardarSala": "Salvar salão",
          "ocultarSala": "Ocultar salão",
          "activarSala": "Ativar salão",
          "sinMesasSala": "Este salão ainda não possui mesas.",
          "sinSalas": "Ainda não há salões. Crie o primeiro salão para começar.",
          "estadoLibre": "Livre",
          "estadoOcupada": "Ocupada",
          "estadoReservada": "Reservada",
          "estadoCuenta": "Conta solicitada",
          "nombreSalaObligatorio": "O nome do salão é obrigatório",
          "salaCreada": "Salão criado com sucesso",
          "datosSalaIncompletos": "Os dados do salão estão incompletos",
          "salaActualizada": "Salão atualizado com sucesso",
          "salaNoEncontrada": "Salão não encontrado",
          "noOcultarSalaOcupadas": "Não é possível ocultar um salão com mesas ocupadas, reservadas ou com conta solicitada",
          "datosMesaIncompletos": "Os dados da mesa estão incompletos",
          "salaNoEncontradaRestaurante": "Salão não encontrado para este restaurante",
          "mesaCreada": "Mesa criada com sucesso",
          "mesaNoEncontrada": "Mesa não encontrada",
          "mesaActualizada": "Mesa atualizada com sucesso",
          "soloOcultarMesasLibres": "Só é possível ocultar mesas livres",
          "visibilidadMesaActualizada": "Visibilidade da mesa atualizada com sucesso",
          "sinPermisos": "Você não tem permissão para configurar mesas."
    }
  };

  return textos[idioma] || textos.es;
}

function estadoMesaTraducido(estadoValor, textos) {
  const estado = String(estadoValor || "").toLowerCase();

  if (estado === "libre") return textos.estadoLibre;
  if (estado === "ocupada") return textos.estadoOcupada;
  if (estado === "reservada") return textos.estadoReservada;
  if (estado === "cuenta") return textos.estadoCuenta;

  return estadoValor || "";
}

module.exports = {
  textosZonasConfig,
  estadoMesaTraducido
};
