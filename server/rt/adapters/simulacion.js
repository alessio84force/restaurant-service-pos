const crypto = require("crypto");

function numeroDocumentoDaClave(clave) {
  const hash = crypto
    .createHash("sha256")
    .update(String(clave || ""))
    .digest("hex");

  return parseInt(hash.slice(0, 8), 16)
    .toString()
    .padStart(10, "0");
}

async function emitir(documento) {
  if (!documento || typeof documento !== "object") {
    throw new Error(
      "Documento fiscale RT non valido"
    );
  }

  if (!documento.idempotency_key) {
    throw new Error(
      "Manca idempotency_key nel documento RT"
    );
  }

  if (!documento.pedido_id) {
    throw new Error(
      "Manca pedido_id nel documento RT"
    );
  }

  if (!Array.isArray(documento.lineas) || !documento.lineas.length) {
    throw new Error(
      "Il documento RT non contiene righe"
    );
  }

  const numeroDocumento =
    numeroDocumentoDaClave(
      documento.idempotency_key
    );

  return {
    ok: true,
    modo: "simulacion",
    fabricante: "SIMULADOR",
    documento_id:
      "SIM-RT-" + numeroDocumento,
    emitido_en:
      new Date().toISOString(),
    idempotency_key:
      documento.idempotency_key
  };
}

module.exports = {
  emitir
};
