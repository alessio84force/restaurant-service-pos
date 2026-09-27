"use strict";

const fs = require("fs");
const path = require("path");

function leggiStato(configFile) {
  const vuoto = {
    configurato: false,
    restaurante_id: null
  };

  try {
    if (
      typeof configFile !== "string" ||
      !path.isAbsolute(configFile)
    ) {
      return vuoto;
    }

    const cartella = fs.lstatSync(
      path.dirname(configFile)
    );

    const file = fs.lstatSync(configFile);

    if (
      !cartella.isDirectory() ||
      cartella.isSymbolicLink() ||
      !file.isFile() ||
      file.isSymbolicLink() ||
      file.size > 16384 ||
      (cartella.mode & 0o777) !== 0o700 ||
      (file.mode & 0o777) !== 0o600
    ) {
      return vuoto;
    }

    const config = JSON.parse(
      fs.readFileSync(configFile, "utf8")
    );

    const server = new URL(config.server_url);

    if (
      server.href !== "https://restaurantservicepos.com/" ||
      config.bridge_version !== "2.15.0" ||
      typeof config.token !== "string" ||
      !config.token ||
      typeof config.bridge_id !== "string" ||
      !config.bridge_id ||
      !Number.isSafeInteger(config.restaurante_id) ||
      config.restaurante_id <= 0
    ) {
      return vuoto;
    }

    // Non restituire mai token o identificativi privati.
    return {
      configurato: true,
      restaurante_id: config.restaurante_id
    };

  } catch (_) {
    return vuoto;
  }
}

module.exports = {
  leggiStato
};
