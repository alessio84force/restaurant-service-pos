"use strict";

const CODIGOS_PROMOCIONALES = Object.freeze({
  "BOADILLA COMERCIO": Object.freeze({
    codigo: "BOADILLA COMERCIO",
    tipo: "trial_extra",
    dias_extra: 7,
    descripcion: "Prueba gratuita ampliada: 14 días en total"
  }),

  "CODICE ALESSIO": Object.freeze({
    codigo: "CODICE ALESSIO",
    tipo: "gratis_vida",
    dias_extra: 0,
    descripcion: "Acceso gratis de por vida"
  })
});

function normalizarCodigoPromocional(codigo) {
  return String(codigo || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function validarCodigoPromocional(codigo) {
  const codigoNormalizado = normalizarCodigoPromocional(codigo);

  if (!codigoNormalizado) {
    return null;
  }

  const promo = CODIGOS_PROMOCIONALES[codigoNormalizado];

  if (!promo) {
    return null;
  }

  return {
    codigo: promo.codigo,
    tipo: promo.tipo,
    dias_extra: promo.dias_extra,
    descripcion: promo.descripcion
  };
}

function listarCodigosPromocionales() {
  return Object.values(CODIGOS_PROMOCIONALES).map((promo) => ({
    codigo: promo.codigo,
    tipo: promo.tipo,
    dias_extra: promo.dias_extra,
    descripcion: promo.descripcion
  }));
}

module.exports = {
  normalizarCodigoPromocional,
  validarCodigoPromocional,
  listarCodigosPromocionales
};
