function normalizza(valore) {
  return String(
    valore == null ? "" : valore
  ).trim().toLowerCase();
}

function valutaStampantePerProduzione(stampante) {
  const p = stampante || null;

  if (
    !p ||
    normalizza(p.stato) !== "rilevata"
  ) {
    return {
      ok: false,
      motivo: "non_disponibile"
    };
  }

  const trasporto =
    normalizza(p.trasporto);

  const compatibilita =
    normalizza(p.compatibilita);

  const escposDiretto =
    trasporto === "usb_escpos" ||
    trasporto === "tcp_escpos";

  if (
    escposDiretto &&
    compatibilita !== "verificata"
  ) {
    return {
      ok: false,
      motivo: "da_verificare"
    };
  }

  return {
    ok: true,
    motivo: "ok"
  };
}

module.exports = {
  valutaStampantePerProduzione
};
