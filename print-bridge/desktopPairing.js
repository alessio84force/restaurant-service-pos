const os = require("os");
const path = require("path");

const pairing = require("./pair");

const SERVER =
  "https://restaurantservicepos.com";

const CONFIG = path.join(
  os.homedir(),
  ".rsp-print-bridge-desktop",
  "config.json"
);

function normalizzaCodice(valore) {
  return String(valore || "")
    .toUpperCase()
    .replace(/[\s-]/g, "");
}

async function collegaRistorante(codice, opzioni = {}) {
  const pulito = normalizzaCodice(codice);

  if (
    !/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/.test(pulito)
  ) {
    throw new Error(
      "Inserisci un codice valido di 10 caratteri."
    );
  }

  const configFile = opzioni.configFile || CONFIG;
  const precedente = pairing.configEsistente(configFile);

  const bridgeId =
    precedente.bridge_id || pairing.bridgeIdDefault();

  const bridgeNome =
    precedente.bridge_nome || os.hostname();

  const richiesta =
    opzioni.richiesta || pairing.richiestaPairing;

  const risposta = await richiesta(SERVER, {
    codice: pulito,
    bridge_id: bridgeId,
    bridge_nome: bridgeNome,
    bridge_version: "2.15.0"
  });

  if (risposta && risposta.status === 401) {
    throw new Error(
      "Codice non valido, scaduto o gia utilizzato. " +
      "Generane uno nuovo sul sito."
    );
  }

  if (
    !risposta ||
    risposta.status !== 200 ||
    !risposta.json ||
    risposta.json.ok !== true ||
    typeof risposta.json.token !== "string" ||
    !risposta.json.token ||
    !Number.isSafeInteger(
      Number(risposta.json.restaurante_id)
    ) ||
    Number(risposta.json.restaurante_id) <= 0
  ) {
    throw new Error(
      "Collegamento non riuscito. Riprova oppure " +
      "verifica la connessione Internet."
    );
  }

  pairing.salvaConfig(configFile, {
    server_url: SERVER,
    token: risposta.json.token,
    bridge_id: bridgeId,
    bridge_nome: bridgeNome,
    bridge_version: "2.15.0",
    restaurante_id: Number(
      risposta.json.restaurante_id
    )
  });

  return {
    ok: true,
    restaurante_id: Number(
      risposta.json.restaurante_id
    ),
    bridge_nome: bridgeNome
  };
}

module.exports = {
  collegaRistorante,
  normalizzaCodice,
  configDesktopDefault: CONFIG
};
