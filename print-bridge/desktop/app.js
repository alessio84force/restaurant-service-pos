"use strict";

(() => {
  const i18n = window.RSPDesktopI18n;
  if (!i18n) return;

  const input = document.getElementById("code");
  const pulsante = document.getElementById("collega-btn");
  const messaggio = document.getElementById("collegamento-messaggio");
  const stato = document.getElementById("collegamento-stato");
  const ristorante = document.getElementById("ristorante-stato");
  const selettore = document.getElementById("language");

  if (!input || !pulsante || !messaggio ||
      !stato || !ristorante || !selettore) return;

  const chiaveLingua = "rsp-print-bridge-desktop-language";

  let lingua = i18n.linguaSupportata(navigator.language);
  let occupato = false;
  let collegato = false;
  let configuratoDaDisco = false;
  let inizializzazione = true;
  let ristoranteId = null;
  let messaggioChiave = "enterCode";

  try {
    const salvata = localStorage.getItem(chiaveLingua);
    if (Object.prototype.hasOwnProperty.call(
      i18n.traduzioni, salvata
    )) {
      lingua = salvata;
    }
  } catch (_) {}

  function traduci(chiave) {
    return i18n.traduzioni[lingua][chiave] ||
      i18n.traduzioni.es[chiave] || chiave;
  }

  function aggiornaTesti() {
    document.documentElement.lang = lingua;
    selettore.value = lingua;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = traduci(el.dataset.i18n);
    });

    stato.textContent = traduci(
      collegato
        ? (configuratoDaDisco ? "configured" : "connected")
        : "disconnected"
    );

    ristorante.textContent = collegato
      ? traduci("restaurantNumber") + ristoranteId
      : traduci("disconnected");

    messaggio.textContent = traduci(messaggioChiave);
  }

  // Attendiamo il recupero della preferenza salvata.
  selettore.disabled = true;

  selettore.addEventListener("change", async () => {
    const scelta = selettore.value;

    if (!Object.prototype.hasOwnProperty.call(
      i18n.traduzioni, scelta
    )) {
      aggiornaTesti();
      return;
    }

    const precedente = lingua;
    selettore.disabled = true;

    try {
      const risposta = await fetch("/api/preferenze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ lingua: scelta })
      });

      if (!risposta.ok) {
        throw new Error("Salvataggio non riuscito");
      }

      const dati = await risposta.json();

      if (
        !dati ||
        dati.ok !== true ||
        dati.lingua !== scelta ||
        Object.keys(dati).sort().join("|") !== "lingua|ok"
      ) {
        throw new Error("Risposta non valida");
      }

      lingua = scelta;

      try {
        localStorage.setItem(chiaveLingua, lingua);
      } catch (_) {}

      aggiornaTesti();

    } catch (_) {
      lingua = precedente;
      aggiornaTesti();
      window.alert(traduci("preferenceSaveFailed"));

    } finally {
      selettore.disabled = false;
    }
  });

  function codiceValido() {
    const codice = input.value
      .toUpperCase()
      .replace(/[\s-]/g, "");

    return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/
      .test(codice);
  }

  function aggiornaPulsante() {
    pulsante.disabled =
      occupato || collegato || inizializzazione || !codiceValido();
  }

  function mostraMessaggio(chiave, tipo) {
    messaggioChiave = chiave;
    messaggio.dataset.state = tipo;
    aggiornaTesti();
  }

  input.disabled = true;

  input.addEventListener("input", () => {
    input.value = input.value
      .toUpperCase()
      .replace(/\s/g, "")
      .slice(0, 11);

    aggiornaPulsante();
  });

  async function collega() {
    if (
      occupato ||
      collegato ||
      inizializzazione ||
      !codiceValido()
    ) return;

    occupato = true;
    pulsante.disabled = true;
    input.disabled = true;

    mostraMessaggio("connecting", "pending");

    try {
      const risposta = await fetch("/api/collega", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          codice: input.value.trim()
        })
      });

      if (!risposta.ok) {
        if (risposta.status === 400) {
          throw new Error("invalidCode");
        }

        if (risposta.status === 401) {
          throw new Error("expiredCode");
        }

        throw new Error("connectionFailed");
      }

      const dati = await risposta.json();

      if (!dati.ok ||
          !Number.isSafeInteger(dati.restaurante_id) ||
          dati.restaurante_id <= 0) {
        throw new Error("invalidResponse");
      }

      collegato = true;
      configuratoDaDisco = false;
      ristoranteId = dati.restaurante_id;

      mostraMessaggio("success", "success");

    } catch (err) {
      const chiave = [
        "invalidCode",
        "expiredCode",
        "invalidResponse"
      ].includes(err.message)
        ? err.message
        : "connectionFailed";

      mostraMessaggio(chiave, "error");

    } finally {
      input.value = "";
      occupato = false;
      input.disabled = collegato;
      aggiornaPulsante();
      aggiornaTesti();
    }
  }

  pulsante.addEventListener("click", collega);

  input.addEventListener("keydown", evento => {
    if (evento.key === "Enter" && !pulsante.disabled) {
      evento.preventDefault();
      collega();
    }
  });

  async function caricaStato() {
    try {
      const risposta = await fetch("/api/stato", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      });

      if (!risposta.ok) {
        throw new Error("Stato non disponibile");
      }

      const dati = await risposta.json();

      if (dati.configurato === true) {
        if (
          !Number.isSafeInteger(dati.restaurante_id) ||
          dati.restaurante_id <= 0
        ) {
          throw new Error("Stato non valido");
        }

        collegato = true;
        configuratoDaDisco = true;
        ristoranteId = dati.restaurante_id;
        messaggioChiave = "existingConnection";
        messaggio.dataset.state = "pending";

      } else if (
        dati.configurato !== false ||
        dati.restaurante_id !== null
      ) {
        throw new Error("Stato non valido");
      }

      inizializzazione = false;

    } catch (_) {
      mostraMessaggio("statusUnavailable", "error");

    } finally {
      input.disabled = collegato || inizializzazione;
      aggiornaPulsante();
      aggiornaTesti();
    }
  }

  async function caricaLinguaSalvata() {
    try {
      const risposta = await fetch("/api/preferenze", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      });

      if (!risposta.ok) {
        throw new Error("Preferenze non disponibili");
      }

      const dati = await risposta.json();

      if (
        !dati ||
        typeof dati !== "object" ||
        Array.isArray(dati) ||
        Object.keys(dati).length !== 1 ||
        !Object.prototype.hasOwnProperty.call(dati, "lingua")
      ) {
        throw new Error("Preferenze non valide");
      }

      if (dati.lingua !== null) {
        if (
          !Object.prototype.hasOwnProperty.call(
            i18n.traduzioni,
            dati.lingua
          )
        ) {
          throw new Error("Lingua non supportata");
        }

        lingua = dati.lingua;

        try {
          localStorage.setItem(chiaveLingua, lingua);
        } catch (_) {}
      }

    } catch (_) {
      // Manteniamo la lingua attualmente disponibile.
      console.warn("Preferenza linguistica non disponibile.");

    } finally {
      selettore.disabled = false;
      aggiornaTesti();
    }
  }

  aggiornaPulsante();
  aggiornaTesti();
  caricaStato();
  caricaLinguaSalvata();
})();
