"use strict";

const traduzioni = {
  es: {
    language: "Idioma",
    subtitle: "Conecta tu ordenador al restaurante y gestiona las impresoras del servicio.",
    connectionStatus: "ESTADO DE CONEXIÓN",
    disconnected: "Sin conectar",
    connected: "Conectado",
    restaurant: "RESTAURANTE",
    printers: "IMPRESORAS",
    waiting: "Pendiente",
    service: "SERVICIO",
    stopped: "No iniciado",
    connectTitle: "Conectar restaurante",
    connectionStep: "01 · Conexión",
    instructions: "Abre el Centro de impresión en Restaurant Service POS, genera un código e introdúcelo aquí.",
    codeLabel: "CÓDIGO DE CONEXIÓN",
    connectButton: "Conectar restaurante",
    enterCode: "Introduce el código generado en el Centro de impresión.",
    connecting: "Conectando. Espera...",
    success: "Restaurante conectado correctamente. El servicio de impresión todavía no está iniciado.",
    invalidCode: "Introduce un código válido de 10 caracteres.",
    expiredCode: "Código no válido o caducado. Genera uno nuevo en la web.",
    connectionFailed: "No se ha podido conectar. Comprueba la conexión y vuelve a intentarlo.",
    invalidResponse: "Respuesta de conexión no válida.",
    configured: "Configurado",
    existingConnection: "Perfil guardado en este ordenador. La conexión con el servidor todavía no se ha verificado. La impresión no está iniciada.",
    statusUnavailable: "No se puede comprobar el estado guardado. Recarga la ventana.",
    restaurantNumber: "Restaurante #"
  },

  it: {
    language: "Lingua",
    subtitle: "Collega il tuo computer al ristorante e gestisci le stampanti del servizio.",
    connectionStatus: "STATO COLLEGAMENTO",
    disconnected: "Non collegato",
    connected: "Collegato",
    restaurant: "RISTORANTE",
    printers: "STAMPANTI",
    waiting: "In attesa",
    service: "SERVIZIO",
    stopped: "Non avviato",
    connectTitle: "Collega il ristorante",
    connectionStep: "01 · Collegamento",
    instructions: "Apri il Centro de impresión su Restaurant Service POS, genera un codice e inseriscilo qui.",
    codeLabel: "CODICE DI COLLEGAMENTO",
    connectButton: "Collega ristorante",
    enterCode: "Inserisci il codice generato nel Centro de impresión.",
    connecting: "Collegamento in corso. Attendi...",
    success: "Ristorante collegato correttamente. Il servizio di stampa non è ancora avviato.",
    invalidCode: "Inserisci un codice valido di 10 caratteri.",
    expiredCode: "Codice non valido o scaduto. Generane uno nuovo sul sito.",
    connectionFailed: "Collegamento non riuscito. Verifica la connessione e riprova.",
    invalidResponse: "Risposta del collegamento non valida.",
    configured: "Configurato",
    existingConnection: "Profilo salvato su questo computer. Il collegamento al server non è ancora stato verificato. La stampa non è avviata.",
    statusUnavailable: "Impossibile controllare lo stato salvato. Ricarica la finestra.",
    restaurantNumber: "Ristorante #"
  },

  en: {
    language: "Language",
    subtitle: "Connect your computer to your restaurant and manage service printers.",
    connectionStatus: "CONNECTION STATUS",
    disconnected: "Not connected",
    connected: "Connected",
    restaurant: "RESTAURANT",
    printers: "PRINTERS",
    waiting: "Waiting",
    service: "SERVICE",
    stopped: "Not started",
    connectTitle: "Connect restaurant",
    connectionStep: "01 · Connection",
    instructions: "Open the Printing Centre in Restaurant Service POS, generate a code and enter it here.",
    codeLabel: "CONNECTION CODE",
    connectButton: "Connect restaurant",
    enterCode: "Enter the code generated in the Printing Centre.",
    connecting: "Connecting. Please wait...",
    success: "Restaurant connected successfully. The printing service has not started yet.",
    invalidCode: "Enter a valid 10-character code.",
    expiredCode: "Invalid or expired code. Generate a new one on the website.",
    connectionFailed: "Connection failed. Check your connection and try again.",
    invalidResponse: "Invalid connection response.",
    configured: "Configured",
    existingConnection: "Profile saved on this computer. The server connection has not yet been verified. Printing is not running.",
    statusUnavailable: "Unable to check the saved status. Reload the window.",
    restaurantNumber: "Restaurant #"
  },

  "pt-BR": {
    language: "Idioma",
    subtitle: "Conecte seu computador ao restaurante e gerencie as impressoras do serviço.",
    connectionStatus: "STATUS DA CONEXÃO",
    disconnected: "Não conectado",
    connected: "Conectado",
    restaurant: "RESTAURANTE",
    printers: "IMPRESSORAS",
    waiting: "Aguardando",
    service: "SERVIÇO",
    stopped: "Não iniciado",
    connectTitle: "Conectar restaurante",
    connectionStep: "01 · Conexão",
    instructions: "Abra a Central de impressão no Restaurant Service POS, gere um código e digite-o aqui.",
    codeLabel: "CÓDIGO DE CONEXÃO",
    connectButton: "Conectar restaurante",
    enterCode: "Digite o código gerado na Central de impressão.",
    connecting: "Conectando. Aguarde...",
    success: "Restaurante conectado com sucesso. O serviço de impressão ainda não foi iniciado.",
    invalidCode: "Digite um código válido de 10 caracteres.",
    expiredCode: "Código inválido ou expirado. Gere um novo no site.",
    connectionFailed: "Falha na conexão. Verifique sua conexão e tente novamente.",
    invalidResponse: "Resposta de conexão inválida.",
    configured: "Configurado",
    existingConnection: "Perfil salvo neste computador. A conexão com o servidor ainda não foi verificada. A impressão não está em execução.",
    statusUnavailable: "Não foi possível verificar o status salvo. Recarregue a janela.",
    restaurantNumber: "Restaurante #"
  }
};

function linguaSupportata(valore) {
  const lingua = String(valore || "").toLowerCase();

  if (lingua.startsWith("pt")) return "pt-BR";
  if (lingua.startsWith("it")) return "it";
  if (lingua.startsWith("en")) return "en";
  return "es";
}

const api = {
  traduzioni,
  linguaSupportata
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}

if (typeof window !== "undefined") {
  window.RSPDesktopI18n = api;
}
