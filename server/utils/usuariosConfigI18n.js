const { normalizarIdioma } = require("./i18n");

function textosUsuariosConfig(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",

      usuarios: "Usuarios",
      descripcionUsuarios:
        "Crea y gestiona usuarios solo para este restaurante.",

      volverConfiguracion: "Volver a configuración",
      abrirPos: "Abrir POS",

      crearUsuario: "Crear usuario",
      usuariosRestaurante: "Usuarios del restaurante",

      usuario: "Usuario",
      nombre: "Nombre",
      email: "Email",
      contrasena: "Contraseña",
      nuevaContrasena: "Nueva contraseña",
      placeholderContrasena:
        "Dejar vacío para no cambiar",
      rol: "Rol",
      estado: "Estado",
      editar: "Editar",

      guardar: "Guardar",
      activar: "Activar",
      desactivar: "Desactivar",
      eliminar: "Eliminar",
      confirmarEliminar:
        "¿Eliminar este usuario?",

      activo: "Activo",
      desactivado: "Desactivado",
      sinUsuarios:
        "Todavía no hay usuarios.",
      noEliminarPropio:
        "No puedes eliminar tu propio usuario.",

      rolAdmin: "Administrador",
      rolGerente: "Gerente",
      rolCamarero: "Camarero",
      rolCocina: "Cocina",
      rolBar: "Bar",

      sinPermisos:
        "No tienes permisos para acceder a esta configuración.",
      noAutenticado: "No autenticado",
      noPrepararContrasena:
        "No se pudo preparar la contraseña.",

      faltanDatos:
        "Faltan datos obligatorios",
      emailExistente:
        "Ya existe un usuario con ese email",
      usuarioCreado:
        "Usuario creado correctamente",

      usuarioNoRestaurante:
        "Usuario no encontrado para este restaurante",
      otroEmailExistente:
        "Ya existe otro usuario con ese email",
      necesitaAdminActivo:
        "Debe quedar al menos un administrador o gerente activo",
      usuarioActualizado:
        "Usuario actualizado correctamente",

      usuarioNoEncontrado:
        "Usuario no encontrado",
      noDesactivarPropio:
        "No puedes desactivar tu propio usuario mientras estás dentro",
      estadoActualizado:
        "Estado del usuario actualizado correctamente",

      noEliminarPropioSesion:
        "No puedes eliminar tu propio usuario mientras estás dentro",
      usuarioEliminado:
        "Usuario eliminado definitivamente"
    },

    it: {
      lang: "it",

      usuarios: "Utenti",
      descripcionUsuarios:
        "Crea e gestisci gli utenti esclusivamente per questo ristorante.",

      volverConfiguracion:
        "Torna alla configurazione",
      abrirPos: "Apri POS",

      crearUsuario: "Crea utente",
      usuariosRestaurante:
        "Utenti del ristorante",

      usuario: "Utente",
      nombre: "Nome",
      email: "Email",
      contrasena: "Password",
      nuevaContrasena: "Nuova password",
      placeholderContrasena:
        "Lascia vuoto per non modificarla",
      rol: "Ruolo",
      estado: "Stato",
      editar: "Modifica",

      guardar: "Salva",
      activar: "Attiva",
      desactivar: "Disattiva",
      eliminar: "Elimina",
      confirmarEliminar:
        "Eliminare questo utente?",

      activo: "Attivo",
      desactivado: "Disattivato",
      sinUsuarios:
        "Non ci sono ancora utenti.",
      noEliminarPropio:
        "Non puoi eliminare il tuo utente.",

      rolAdmin: "Amministratore",
      rolGerente: "Responsabile",
      rolCamarero: "Cameriere",
      rolCocina: "Cucina",
      rolBar: "Bar",

      sinPermisos:
        "Non hai i permessi per accedere a questa configurazione.",
      noAutenticado: "Non autenticato",
      noPrepararContrasena:
        "Impossibile preparare la password.",

      faltanDatos:
        "Mancano dati obbligatori",
      emailExistente:
        "Esiste già un utente con questa email",
      usuarioCreado:
        "Utente creato correttamente",

      usuarioNoRestaurante:
        "Utente non trovato per questo ristorante",
      otroEmailExistente:
        "Esiste già un altro utente con questa email",
      necesitaAdminActivo:
        "Deve rimanere attivo almeno un amministratore o responsabile",
      usuarioActualizado:
        "Utente aggiornato correttamente",

      usuarioNoEncontrado:
        "Utente non trovato",
      noDesactivarPropio:
        "Non puoi disattivare il tuo utente mentre hai effettuato l'accesso",
      estadoActualizado:
        "Stato dell'utente aggiornato correttamente",

      noEliminarPropioSesion:
        "Non puoi eliminare il tuo utente mentre hai effettuato l'accesso",
      usuarioEliminado:
        "Utente eliminato definitivamente"
    },

    en: {
      lang: "en",

      usuarios: "Users",
      descripcionUsuarios:
        "Create and manage users for this restaurant only.",

      volverConfiguracion: "Back to settings",
      abrirPos: "Open POS",

      crearUsuario: "Create user",
      usuariosRestaurante:
        "Restaurant users",

      usuario: "User",
      nombre: "Name",
      email: "Email",
      contrasena: "Password",
      nuevaContrasena: "New password",
      placeholderContrasena:
        "Leave blank to keep unchanged",
      rol: "Role",
      estado: "Status",
      editar: "Edit",

      guardar: "Save",
      activar: "Enable",
      desactivar: "Disable",
      eliminar: "Delete",
      confirmarEliminar:
        "Delete this user?",

      activo: "Active",
      desactivado: "Disabled",
      sinUsuarios:
        "There are no users yet.",
      noEliminarPropio:
        "You cannot delete your own user.",

      rolAdmin: "Administrator",
      rolGerente: "Manager",
      rolCamarero: "Waiter",
      rolCocina: "Kitchen",
      rolBar: "Bar",

      sinPermisos:
        "You do not have permission to access these settings.",
      noAutenticado: "Not authenticated",
      noPrepararContrasena:
        "The password could not be prepared.",

      faltanDatos:
        "Required information is missing",
      emailExistente:
        "A user with this email already exists",
      usuarioCreado:
        "User created successfully",

      usuarioNoRestaurante:
        "User not found for this restaurant",
      otroEmailExistente:
        "Another user with this email already exists",
      necesitaAdminActivo:
        "At least one active administrator or manager must remain",
      usuarioActualizado:
        "User updated successfully",

      usuarioNoEncontrado:
        "User not found",
      noDesactivarPropio:
        "You cannot disable your own user while signed in",
      estadoActualizado:
        "User status updated successfully",

      noEliminarPropioSesion:
        "You cannot delete your own user while signed in",
      usuarioEliminado:
        "User permanently deleted"
    }
  };

  return textos[idioma] || textos.es;
}

function rolUsuarioVisible(rolValor, textos) {
  const rol = String(rolValor || "").toLowerCase();

  if (rol === "admin") return textos.rolAdmin;
  if (rol === "gerente") return textos.rolGerente;
  if (rol === "camarero") return textos.rolCamarero;
  if (rol === "cocina") return textos.rolCocina;
  if (rol === "bar") return textos.rolBar;

  return rolValor || "";
}

module.exports = {
  textosUsuariosConfig,
  rolUsuarioVisible
};
