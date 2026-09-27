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
      collegato ? "connected" : "disconnected"
    );

    ristorante.textContent = collegato
      ? traduci("restaurantNumber") + ristoranteId
      : traduci("disconnected");

    messaggio.textContent = traduci(messaggioChiave);
  }

  selettore.addEventListener("change", () => {
    if (!i18n.traduzioni[selettore.value]) return;

    lingua = selettore.value;

    try {
      localStorage.setItem(chiaveLingua, lingua);
    } catch (_) {}

    aggiornaTesti();
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
      occupato || collegato || !codiceValido();
  }

  function mostraMessaggio(chiave, tipo) {
    messaggioChiave = chiave;
    messaggio.dataset.state = tipo;
    aggiornaTesti();
  }

  input.disabled = false;

  input.addEventListener("input", () => {
    input.value = input.value
      .toUpperCase()
      .replace(/\s/g, "")
      .slice(0, 11);

    aggiornaPulsante();
  });

  async function collega() {
    if (occupato || collegato || !codiceValido()) return;

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

  aggiornaPulsante();
  aggiornaTesti();
})();
