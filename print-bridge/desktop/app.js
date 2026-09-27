"use strict";

(() => {
  const input = document.getElementById("code");
  const pulsante = document.getElementById("collega-btn");
  const messaggio = document.getElementById("collegamento-messaggio");
  const stato = document.getElementById("collegamento-stato");
  const ristorante = document.getElementById("ristorante-stato");

  if (
    !input ||
    !pulsante ||
    !messaggio ||
    !stato ||
    !ristorante
  ) {
    return;
  }

  let occupato = false;
  let collegato = false;

  function codiceNormalizzato() {
    return input.value
      .toUpperCase()
      .replace(/[\s-]/g, "");
  }

  function codiceValido() {
    return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/
      .test(codiceNormalizzato());
  }

  function mostraMessaggio(testo, tipo) {
    messaggio.textContent = testo;
    messaggio.dataset.state = tipo;
  }

  function aggiornaPulsante() {
    pulsante.disabled =
      occupato || collegato || !codiceValido();
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
    if (
      occupato ||
      collegato ||
      !codiceValido()
    ) {
      return;
    }

    occupato = true;
    pulsante.disabled = true;
    input.disabled = true;

    mostraMessaggio(
      "Collegamento in corso. Attendi...",
      "pending"
    );

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

      const dati = await risposta.json();

      if (!risposta.ok || !dati.ok) {
        throw new Error(
          dati.error ||
          "Collegamento non riuscito."
        );
      }

      const id = Number(dati.restaurante_id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error(
          "Risposta del collegamento non valida."
        );
      }

      collegato = true;

      stato.textContent = "Collegato";
      ristorante.textContent = "Ristorante #" + id;

      mostraMessaggio(
        "Ristorante collegato correttamente. " +
        "Il servizio di stampa non e ancora avviato.",
        "success"
      );

    } catch (err) {
      mostraMessaggio(
        err.message ||
        "Collegamento non riuscito. Riprova.",
        "error"
      );

    } finally {
      input.value = "";
      occupato = false;
      input.disabled = collegato;
      aggiornaPulsante();
    }
  }

  pulsante.addEventListener("click", collega);

  input.addEventListener("keydown", (evento) => {
    if (
      evento.key === "Enter" &&
      !pulsante.disabled
    ) {
      evento.preventDefault();
      collega();
    }
  });

  aggiornaPulsante();
})();
