function normalizarId(valor) {
  const n = Number(valor || 0);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.floor(n);
}

function restauranteIdFromReq(req) {
  if (req && req.restauranteId) {
    return normalizarId(req.restauranteId);
  }

  if (req && req.session && req.session.restaurante_id) {
    return normalizarId(req.session.restaurante_id);
  }

  if (req && req.session && req.session.usuario && req.session.usuario.restaurante_id) {
    return normalizarId(req.session.usuario.restaurante_id);
  }

  return 1;
}

function asignarRestauranteAReq(req, restauranteId) {
  const id = normalizarId(restauranteId);

  if (req) {
    req.restauranteId = id;

    if (req.session) {
      req.session.restaurante_id = id;

      if (req.session.usuario) {
        req.session.usuario.restaurante_id = id;
      }
    }
  }

  return id;
}

function sqlRestauranteCampo(alias) {
  const prefijo = alias ? String(alias) + "." : "";
  return prefijo + "restaurante_id";
}

module.exports = {
  normalizarId,
  restauranteIdFromReq,
  asignarRestauranteAReq,
  sqlRestauranteCampo
};
