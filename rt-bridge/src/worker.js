"use strict";

const {
  creaClientSaas
} = require("./transport/saasHttp");

const {
  creaAdapterRch
} = require("./adapters/rchAdapter");

function pausa(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

function messaggioErrore(err) {
  if (!err) {
    return "Errore sconosciuto";
  }

  return String(
    err.message || err
  );
}

function creaWorker(
  configurazione,
  opzioni
) {
  opzioni = opzioni || {};

  const clientSaas =
    opzioni.clientSaas ||
    creaClientSaas(configurazione);

  const creaAdapter =
    opzioni.creaAdapterRch ||
    creaAdapterRch;

  const pollMs =
    Number(configurazione.pollMs);

  if (
    !Number.isFinite(pollMs) ||
    pollMs < 1000
  ) {
    throw new Error(
      "RT_POLL_MS deve essere almeno 1000 ms"
    );
  }

  let fermato = false;

  async function processaJob(job) {
    if (
      !job ||
      !job.id ||
      !job.claim_token ||
      !job.payload ||
      !job.payload.documento
    ) {
      throw new Error(
        "Job RT Bridge non valido"
      );
    }

    const jobId =
      job.id;

    const claimToken =
      String(job.claim_token);

    const documento =
      job.payload.documento;

    const contextoBase =
      job.payload.contexto_adapter &&
      typeof job.payload.contexto_adapter ===
        "object"
        ? job.payload.contexto_adapter
        : {};

    let startRegistrato = false;

    const adapter =
      creaAdapter(configurazione);

    const contextoAdapter =
      Object.assign(
        {},
        contextoBase,
        {
          primaInvioFiscale:
            async function() {
              await clientSaas.start(
                jobId,
                claimToken
              );

              startRegistrato = true;
            }
        }
      );

    try {
      const risultato =
        await adapter.emitir(
          documento,
          contextoAdapter
        );

      if (
        !risultato ||
        risultato.ok !== true ||
        !risultato.documento_id
      ) {
        throw new Error(
          "Adapter RCH senza esito fiscale valido"
        );
      }

      const rispostaSaas =
        await clientSaas.result(
          jobId,
          claimToken,
          {
            ok: true,
            invio_fiscale_avviato:
              startRegistrato,
            documento_id:
              risultato.documento_id,
            fabricante:
              risultato.fabricante ||
              "RCH",
            http_status:
              risultato.http_status,
            stato:
              risultato.stato || null
          }
        );

      return {
        ok: true,
        job_id: jobId,
        documento_id:
          risultato.documento_id,
        risposta_saas:
          rispostaSaas
      };
    } catch (err) {
      const invioFiscaleAvviato =
        startRegistrato === true ||
        (
          err &&
          err.rt_invio_avviato === true
        );

      /*
       * Se il SaaS non ha registrato /start,
       * l'errore è recuperabile.
       *
       * Se /start è stato registrato,
       * il SaaS classificherà l'esito come
       * incerto indipendentemente da ciò che
       * dichiara il bridge.
       */
      try {
        await clientSaas.result(
          jobId,
          claimToken,
          {
            ok: false,
            invio_fiscale_avviato:
              invioFiscaleAvviato,
            error:
              messaggioErrore(err)
          }
        );
      } catch (erroreResult) {
        /*
         * Non tentiamo mai una nuova emissione.
         * Il job è già reclamato/inviando sul SaaS
         * e non tornerà automaticamente pendiente.
         */
        const erroreCombinato =
          new Error(
            "Errore job RT: " +
            messaggioErrore(err) +
            " | Impossibile comunicare risultato al SaaS: " +
            messaggioErrore(erroreResult)
          );

        erroreCombinato.rt_invio_avviato =
          invioFiscaleAvviato;

        throw erroreCombinato;
      }

      return {
        ok: false,
        job_id: jobId,
        invio_fiscale_avviato:
          invioFiscaleAvviato,
        error:
          messaggioErrore(err)
      };
    }
  }

  async function eseguiCiclo() {
    const rispostaClaim =
      await clientSaas.claim();

    if (
      !rispostaClaim ||
      rispostaClaim.ok !== true
    ) {
      throw new Error(
        "Risposta claim SaaS non valida"
      );
    }

    if (!rispostaClaim.job) {
      return {
        ok: true,
        job: null
      };
    }

    const risultato =
      await processaJob(
        rispostaClaim.job
      );

    return {
      ok: true,
      job:
        rispostaClaim.job,
      risultato:
        risultato
    };
  }

  async function avvia() {
    fermato = false;

    /*
     * Verifica iniziale esplicita.
     * I claim successivi aggiornano comunque
     * rt_bridge_ultimo_contatto sul SaaS.
     */
    await clientSaas.heartbeat();

    console.log(
      "[RT Bridge] Connessione SaaS attiva"
    );

    while (!fermato) {
      try {
        const ciclo =
          await eseguiCiclo();

        if (
          ciclo.job &&
          ciclo.risultato
        ) {
          console.log(
            "[RT Bridge] Job " +
            ciclo.job.id +
            " elaborato"
          );
        }
      } catch (err) {
        console.error(
          "[RT Bridge] Errore worker:",
          messaggioErrore(err)
        );
      }

      if (!fermato) {
        await pausa(pollMs);
      }
    }
  }

  function ferma() {
    fermato = true;
  }

  return {
    avvia,
    ferma,
    eseguiCiclo,
    processaJob
  };
}

module.exports = {
  creaWorker
};
