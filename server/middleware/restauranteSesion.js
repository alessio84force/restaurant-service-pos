const { asignarRestauranteAReq } = require("../utils/restauranteContext");

module.exports = function restauranteSesionMiddleware(db) {
  return function(req, res, next) {
    if (!req.session || !req.session.usuario) {
      return next();
    }

    if (req.session.usuario.restaurante_id || req.session.restaurante_id) {
      asignarRestauranteAReq(
        req,
        req.session.usuario.restaurante_id || req.session.restaurante_id || 1
      );
      return next();
    }

    const usuarioId = Number(req.session.usuario.id || 0);

    if (!usuarioId) {
      asignarRestauranteAReq(req, 1);
      return next();
    }

    db.get(
      "SELECT COALESCE(restaurante_id, 1) AS restaurante_id FROM usuarios WHERE id=?",
      [usuarioId],
      function(err, row) {
        if (err) {
          console.error("[restauranteSesion] Error cargando restaurante_id:", err.message);
          asignarRestauranteAReq(req, 1);
          return next();
        }

        asignarRestauranteAReq(req, row ? row.restaurante_id : 1);
        return next();
      }
    );
  };
};
