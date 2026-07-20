"use strict";

/*
  RS V2.8.0P
  El botón flotante azul "Manual" queda desactivado globalmente.
  El manual sigue disponible desde:
  - /manual
  - /ayuda
  - Configuración -> Manual
*/

module.exports = function manualClienteLinkMiddleware() {
  return function(req, res, next) {
    return next();
  };
};
