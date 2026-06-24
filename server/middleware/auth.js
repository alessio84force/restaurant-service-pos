function requiereLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login");
  }

  next();
}

function requiereRol(rolesPermitidos) {
  return function(req, res, next) {
    if (!req.session.usuario) {
      return res.redirect("/login");
    }

    if (!rolesPermitidos.includes(req.session.usuario.rol)) {
      return res.status(403).send("Acceso no autorizado");
    }

    next();
  };
}

module.exports = {
  requiereLogin,
  requiereRol
};
