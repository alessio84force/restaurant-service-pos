"use strict";

function escapeXml(valore) {
  return String(valore)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function creaServiceXml(comandi) {
  if (!Array.isArray(comandi) || comandi.length === 0) {
    throw new Error(
      "RCH richiede almeno un comando"
    );
  }

  const righe = comandi.map(function (comando) {
    if (
      typeof comando !== "string" ||
      comando.trim() === ""
    ) {
      throw new Error(
        "Comando RCH non valido"
      );
    }

    return "  <cmd>" +
      escapeXml(comando.trim()) +
      "</cmd>";
  });

  return [
    "<Service>",
    righe.join("\n"),
    "</Service>"
  ].join("\n");
}

module.exports = {
  creaServiceXml,
  escapeXml
};
