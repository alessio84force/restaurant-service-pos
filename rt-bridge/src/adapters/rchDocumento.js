"use strict";

const {
  venditaReparto,
  pagamento
} = require("./rchCommands");

function euroInCentesimi(valore) {
  if (
    valore == null ||
    String(valore).trim() === ""
  ) {
    throw new Error(
      "Importo documento RCH non valido"
    );
  }

  const numero = Number(valore);

  if (
    !Number.isFinite(numero) ||
    numero < 0
  ) {
    throw new Error(
      "Importo documento RCH non valido"
    );
  }

  return Math.round(
    numero * 100
  );
}

function quantitaNumero(valore) {
  if (
    valore == null ||
    String(valore).trim() === ""
  ) {
    throw new Error(
      "Quantita documento RCH non valida"
    );
  }

  const numero = Number(valore);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    throw new Error(
      "Quantita documento RCH non valida"
    );
  }

  return numero;
}

function ivaNumero(valore) {
  if (
    valore == null ||
    String(valore).trim() === ""
  ) {
    throw new Error(
      "IVA documento RCH non valida"
    );
  }

  const numero = Number(valore);

  if (
    !Number.isFinite(numero) ||
    numero < 0 ||
    numero > 100
  ) {
    throw new Error(
      "IVA documento RCH non valida"
    );
  }

  return numero;
}

function descrizioneRch(valore) {
  return String(valore || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 36);
}

function trovaRepartoPerIva(
  configurazioneRch,
  iva
) {
  const configurazione =
    configurazioneRch || {};

  const aliquote =
    Array.isArray(configurazione.aliquote)
      ? configurazione.aliquote
      : [];

  const reparti =
    Array.isArray(configurazione.reparti)
      ? configurazione.reparti
      : [];

  const percentuale =
    ivaNumero(iva);

  const vatIds =
    aliquote
      .filter(function(aliquota) {
        const valore =
          Number(aliquota.percentuale);

        return (
          Number.isFinite(valore) &&
          Math.abs(
            valore - percentuale
          ) < 0.0001
        );
      })
      .map(function(aliquota) {
        return Number(aliquota.id);
      })
      .filter(function(id) {
        return Number.isInteger(id);
      });

  if (!vatIds.length) {
    throw new Error(
      "Aliquota IVA RCH non trovata: " +
      percentuale + "%"
    );
  }

  const repartiCompatibili =
    reparti.filter(function(reparto) {
      const vatCode =
        Number(reparto.vat_code);

      return (
        Number.isInteger(vatCode) &&
        vatIds.indexOf(vatCode) !== -1
      );
    });

  if (!repartiCompatibili.length) {
    throw new Error(
      "Reparto RCH non trovato per IVA " +
      percentuale + "%"
    );
  }

  if (repartiCompatibili.length > 1) {
    throw new Error(
      "Reparto RCH ambiguo per IVA " +
      percentuale + "%"
    );
  }

  return repartiCompatibili[0];
}

function creaComandiDocumentoRch(
  documento,
  contextoAdapter,
  configurazioneRch
) {
  if (
    !documento ||
    typeof documento !== "object"
  ) {
    throw new Error(
      "Documento RCH mancante"
    );
  }

  if (
    !Array.isArray(documento.lineas) ||
    !documento.lineas.length
  ) {
    throw new Error(
      "Documento RCH senza righe"
    );
  }

  if (
    !Array.isArray(documento.pagos) ||
    !documento.pagos.length
  ) {
    throw new Error(
      "Documento RCH senza pagamenti"
    );
  }

  const totaleDocumento =
    euroInCentesimi(
      documento.total
    );

  const totalePagatoDichiarato =
    euroInCentesimi(
      documento.total_pagado
    );

  const pendente =
    euroInCentesimi(
      documento.pendiente
    );

  if (pendente !== 0) {
    throw new Error(
      "Documento RCH con saldo pendente"
    );
  }

  let totaleRighe = 0;

  documento.lineas.forEach(
    function(linea) {
      const qta =
        quantitaNumero(
          linea.cantidad
        );

      const prezzoCentesimi =
        euroInCentesimi(
          linea.precio
        );

      const totaleLinea =
        euroInCentesimi(
          linea.total_linea
        );

      const totaleCalcolato =
        Math.round(
          prezzoCentesimi * qta
        );

      if (
        totaleLinea !==
        totaleCalcolato
      ) {
        throw new Error(
          "Totale riga RCH incoerente"
        );
      }

      totaleRighe +=
        totaleLinea;
    }
  );

  let totalePagamenti = 0;

  documento.pagos.forEach(
    function(pago) {
      totalePagamenti +=
        euroInCentesimi(
          pago.importe
        );
    }
  );

  if (
    totaleRighe !==
    totaleDocumento
  ) {
    throw new Error(
      "Totale righe RCH diverso dal totale documento"
    );
  }

  if (
    totalePagamenti !==
    totaleDocumento
  ) {
    throw new Error(
      "Totale pagamenti RCH diverso dal totale documento"
    );
  }

  if (
    totalePagatoDichiarato !==
    totalePagamenti
  ) {
    throw new Error(
      "Totale pagato RCH incoerente"
    );
  }

  const contexto =
    contextoAdapter || {};

  const mapeoPagos =
    contexto.mapeo_pagos &&
    typeof contexto.mapeo_pagos === "object"
      ? contexto.mapeo_pagos
      : {};

  const pagamentiRch =
    configurazioneRch &&
    Array.isArray(configurazioneRch.pagamenti)
      ? configurazioneRch.pagamenti
      : [];

  const comandi = [];

  documento.lineas.forEach(
    function(linea) {
      const reparto =
        trovaRepartoPerIva(
          configurazioneRch,
          linea.iva
        );

      comandi.push(
        venditaReparto({
          reparto: reparto.id,
          importo_centesimi:
            euroInCentesimi(
              linea.precio
            ),
          quantita:
            linea.cantidad,
          descrizione:
            descrizioneRch(
              linea.nombre
            )
        })
      );
    }
  );

  documento.pagos.forEach(
    function(pago) {
      const metodo =
        String(
          pago.metodo || ""
        )
          .trim()
          .toLowerCase();

      if (!metodo) {
        throw new Error(
          "Metodo pagamento POS non valido"
        );
      }

      const mappatura =
        mapeoPagos[metodo];

      if (
        !mappatura ||
        mappatura.metodo_rt_id == null
      ) {
        throw new Error(
          "Mappatura pagamento RCH mancante: " +
          metodo
        );
      }

      const numeroPagamento =
        Number(
          mappatura.metodo_rt_id
        );

      const pagamentoConfigurato =
        pagamentiRch.some(
          function(pagamentoRch) {
            return (
              Number(pagamentoRch.id) ===
              numeroPagamento
            );
          }
        );

      if (!pagamentoConfigurato) {
        throw new Error(
          "Pagamento RCH configurato non trovato: " +
          mappatura.metodo_rt_id
        );
      }

      comandi.push(
        pagamento({
          numero:
            numeroPagamento,
          importo_centesimi:
            euroInCentesimi(
              pago.importe
            )
        })
      );
    }
  );

  return comandi;
}

module.exports = {
  creaComandiDocumentoRch,
  trovaRepartoPerIva
};
