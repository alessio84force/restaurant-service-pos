"use strict";

const IDIOMAS_SOPORTADOS = ["es", "it", "en"];

function normalizarIdioma(valor) {
  const idioma = String(valor || "").trim().toLowerCase();

  if (IDIOMAS_SOPORTADOS.includes(idioma)) {
    return idioma;
  }

  return "es";
}

module.exports = {
  IDIOMAS_SOPORTADOS,
  normalizarIdioma
};
