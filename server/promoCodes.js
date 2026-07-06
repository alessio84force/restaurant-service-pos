const fs = require("fs");
const path = require("path");

const archivoCodigos = path.join(__dirname, "private", "promo-codes.local.json");

function normalizarCodigo(codigo) {
  return String(codigo || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function cargarCodigos() {
  try {
    const raw = fs.readFileSync(archivoCodigos, "utf8");
    const data = JSON.parse(raw);
    const codigos = {};

    Object.keys(data).forEach((codigo) => {
      codigos[normalizarCodigo(codigo)] = data[codigo];
    });

    return codigos;
  } catch (error) {
    return {};
  }
}

function validarCodigoPromocional(codigo) {
  const codigoNormalizado = normalizarCodigo(codigo);

  if (!codigoNormalizado) {
    return null;
  }

  const codigos = cargarCodigos();

  return codigos[codigoNormalizado] || null;
}

module.exports = {
  validarCodigoPromocional,
  normalizarCodigo
};
