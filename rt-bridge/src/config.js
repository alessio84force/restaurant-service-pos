"use strict";

function valoreTesto(nome, valoreDefault) {
  const valore = process.env[nome];

  if (valore == null || String(valore).trim() === "") {
    return valoreDefault;
  }

  return String(valore).trim();
}

function caricaConfigurazione() {
  const protocollo = valoreTesto(
    "RT_PROTOCOLLO",
    "https"
  ).toLowerCase();

  if (
    protocollo !== "http" &&
    protocollo !== "https"
  ) {
    throw new Error(
      "RT_PROTOCOLLO deve essere http oppure https"
    );
  }

  return Object.freeze({
    adapter: valoreTesto(
      "RT_ADAPTER",
      "rch"
    ).toLowerCase(),

    fabricante: valoreTesto(
      "RT_FABRICANTE",
      "RCH"
    ),

    modello: valoreTesto(
      "RT_MODELLO",
      "PRINT! 3.0 RT"
    ),

    host: valoreTesto(
      "RT_HOST",
      ""
    ),

    protocollo: protocollo,

    endpoint: valoreTesto(
      "RT_ENDPOINT",
      "/service.cgi"
    ),

    saasUrl: valoreTesto(
      "RT_SAAS_URL",
      ""
    ),

    bridgeToken: valoreTesto(
      "RT_BRIDGE_TOKEN",
      ""
    ),

    pollMs: Number(
      valoreTesto(
        "RT_POLL_MS",
        "3000"
      )
    )
  });
}

module.exports = {
  caricaConfigurazione
};
