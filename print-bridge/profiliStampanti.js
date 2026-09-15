const PROFILI = {
  epson_tm_escpos: {
    id:
      "epson_tm_escpos",

    linguaggio:
      "escpos",

    capacita: {
      taglio:
        true,

      taglio_comando:
        "gs_v_1_partial",

      taglio_gestito_dal_driver:
        false
    }
  },

  generic_escpos: {
    id:
      "generic_escpos",

    linguaggio:
      "escpos",

    capacita: {
      taglio:
        false,

      taglio_comando:
        null,

      taglio_gestito_dal_driver:
        false
    }
  },

  system_driver: {
    id:
      "system_driver",

    linguaggio:
      "driver_sistema",

    capacita: {
      taglio:
        false,

      taglio_comando:
        null,

      taglio_gestito_dal_driver:
        true
    }
  }
};

function determinaProfiloId(
  stampante
) {

  const p =
    stampante || {};

  const esplicito =
    String(
      p.profilo || ""
    ).trim();

  if (
    esplicito &&
    PROFILI[esplicito]
  ) {
    return esplicito;
  }

  const trasporto =
    String(
      p.trasporto || ""
    )
      .trim()
      .toLowerCase();

  const marca =
    String(
      p.marca || ""
    )
      .trim()
      .toLowerCase();

  const compatibilita =
    String(
      p.compatibilita || ""
    )
      .trim()
      .toLowerCase();

  /*
   * Questa e' l'unica famiglia
   * verificata fisicamente finora.
   */
  if (
    trasporto ===
      "usb_escpos" &&
    marca ===
      "epson" &&
    compatibilita ===
      "verificata"
  ) {
    return "epson_tm_escpos";
  }

  /*
   * ESC/POS diretto non verificato.
   *
   * Niente taglio automatico finche'
   * il profilo/modello non viene
   * confermato.
   */
  if (
    trasporto ===
      "usb_escpos" ||
    trasporto ===
      "tcp_escpos"
  ) {
    return "generic_escpos";
  }

  /*
   * CUPS / driver OS.
   */
  return "system_driver";
}

function profiloPerStampante(
  stampante
) {

  const id =
    determinaProfiloId(
      stampante
    );

  const base =
    PROFILI[id];

  return {
    id:
      base.id,

    linguaggio:
      base.linguaggio,

    capacita: {
      taglio:
        base.capacita
          .taglio,

      taglio_comando:
        base.capacita
          .taglio_comando,

      taglio_gestito_dal_driver:
        base.capacita
          .taglio_gestito_dal_driver
    }
  };
}

function applicaProfiloStampante(
  stampante
) {

  const originale =
    stampante || {};

  const profilo =
    profiloPerStampante(
      originale
    );

  return Object.assign(
    {},
    originale,
    {
      profilo:
        profilo.id,

      linguaggio:
        profilo.linguaggio,

      capacita:
        profilo.capacita
    }
  );
}

module.exports = {
  PROFILI,
  determinaProfiloId,
  profiloPerStampante,
  applicaProfiloStampante
};
