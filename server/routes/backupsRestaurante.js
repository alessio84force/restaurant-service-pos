"use strict";

const express = require("express");

/*
  V2.8.1E
  Ruta legacy desactivada.

  En la versión SaaS multi-restaurante, los backups reales se gestionan desde:
  server/routes/backupsSaas.js

  Este archivo se mantiene solo para compatibilidad con server/server.js
  y para evitar errores de arranque en servidores Linux.
*/

module.exports = function backupsRestauranteRoutes() {
  return express.Router();
};
