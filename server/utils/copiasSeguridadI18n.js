const { normalizarIdioma } = require("./i18n");

function textosBackupsConfig(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",
      locale: "es-ES",

      backups: "Backups",
      descripcion:
        "Copias de seguridad separadas únicamente para el restaurante actual.",

      volverConfiguracion:
        "Volver a configuración",
      reportes: "Reportes",

      crearBackup: "Crear backup",
      descripcionCrear:
        "El backup incluye los datos operativos del restaurante actual, sin mezclar información de otros restaurantes.",
      crearAhora:
        "Crear backup ahora",

      backupsDisponibles:
        "Backups disponibles",
      archivo: "Archivo",
      tamano: "Tamaño",
      fecha: "Fecha",
      acciones: "Acciones",

      descargar: "Descargar",
      eliminar: "Eliminar",
      confirmarEliminar:
        "¿Eliminar este backup?",
      sinBackups:
        "Todavía no hay backups.",

      sinPermisos:
        "No tienes permisos para gestionar backups.",

      backupCreado:
        "Backup creado:",
      errorCrear:
        "No se pudo crear el backup.",
      backupNoValido:
        "Backup no válido.",
      backupNoEncontrado:
        "Backup no encontrado.",
      nombreNoValido:
        "Nombre de backup no válido.",
      backupEliminado:
        "Backup eliminado."
    },

    it: {
      lang: "it",
      locale: "it-IT",

      backups: "Backup",
      descripcion:
        "Copie di sicurezza separate esclusivamente per il ristorante attuale.",

      volverConfiguracion:
        "Torna alla configurazione",
      reportes: "Report",

      crearBackup: "Crea backup",
      descripcionCrear:
        "Il backup include i dati operativi del ristorante attuale, senza mescolare informazioni di altri ristoranti.",
      crearAhora:
        "Crea backup adesso",

      backupsDisponibles:
        "Backup disponibili",
      archivo: "File",
      tamano: "Dimensione",
      fecha: "Data",
      acciones: "Azioni",

      descargar: "Scarica",
      eliminar: "Elimina",
      confirmarEliminar:
        "Eliminare questo backup?",
      sinBackups:
        "Non ci sono ancora backup.",

      sinPermisos:
        "Non hai i permessi per gestire i backup.",

      backupCreado:
        "Backup creato:",
      errorCrear:
        "Impossibile creare il backup.",
      backupNoValido:
        "Backup non valido.",
      backupNoEncontrado:
        "Backup non trovato.",
      nombreNoValido:
        "Nome del backup non valido.",
      backupEliminado:
        "Backup eliminato."
    },

    en: {
      lang: "en",
      locale: "en-GB",

      backups: "Backups",
      descripcion:
        "Separate backups containing data for the current restaurant only.",

      volverConfiguracion:
        "Back to settings",
      reportes: "Reports",

      crearBackup: "Create backup",
      descripcionCrear:
        "The backup includes operational data for the current restaurant without mixing information from other restaurants.",
      crearAhora:
        "Create backup now",

      backupsDisponibles:
        "Available backups",
      archivo: "File",
      tamano: "Size",
      fecha: "Date",
      acciones: "Actions",

      descargar: "Download",
      eliminar: "Delete",
      confirmarEliminar:
        "Delete this backup?",
      sinBackups:
        "There are no backups yet.",

      sinPermisos:
        "You do not have permission to manage backups.",

      backupCreado:
        "Backup created:",
      errorCrear:
        "The backup could not be created.",
      backupNoValido:
        "Invalid backup.",
      backupNoEncontrado:
        "Backup not found.",
      nombreNoValido:
        "Invalid backup name.",
      backupEliminado:
        "Backup deleted."
    }
  };

  return textos[idioma] || textos.es;
}

module.exports = {
  textosBackupsConfig
};
