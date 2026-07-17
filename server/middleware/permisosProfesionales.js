function permisosProfesionales(){
  function rolActual(req){
    return req.session && req.session.usuario
      ? String(req.session.usuario.rol || "").toLowerCase()
      : "";
  }

  function estaLogueado(req){
    return !!(req.session && req.session.usuario);
  }

  function quiereJson(req){
    const accept = String(req.headers.accept || "");
    const contentType = String(req.headers["content-type"] || "");

    return accept.includes("application/json") ||
           contentType.includes("application/json") ||
           req.path.startsWith("/api/") ||
           req.path.startsWith("/mobile/") ||
           req.path.startsWith("/pedido/") ||
           req.path.startsWith("/linea/") ||
           req.path.startsWith("/pedido-linea/") ||
           req.path.startsWith("/linea-pedido/") ||
           req.path.startsWith("/anadir-producto") ||
           req.path.startsWith("/abrir-mesa") ||
           req.path.startsWith("/bar/enviar") ||
           req.path.startsWith("/cocina/enviar") ||
           req.path.startsWith("/comandas/enviar");
  }

  function noAutorizado(req,res){
    if(quiereJson(req)){
      return res.status(403).json({
        ok:false,
        error:"Acceso no autorizado"
      });
    }

    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Acceso no autorizado</title>
        <style>
          body{
            font-family:Arial,sans-serif;
            background:#f3f4f6;
            margin:0;
            padding:30px;
            color:#111827;
          }
          .box{
            max-width:520px;
            margin:80px auto;
            background:white;
            border-radius:20px;
            padding:28px;
            box-shadow:0 14px 34px rgba(0,0,0,.12);
            text-align:center;
          }
          h1{margin-top:0;}
          p{color:#6b7280;font-weight:700;}
          a{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-height:44px;
            padding:0 16px;
            border-radius:14px;
            background:#111827;
            color:white;
            text-decoration:none;
            font-weight:900;
            margin-top:12px;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>Acceso no autorizado</h1>
          <p>Tu usuario no tiene permiso para entrar en esta sección.</p>
          <a href="/camarero">Volver al POS</a>
        </div>
      </body>
      </html>
    `);
  }

  function pedirLogin(req,res){
    if(quiereJson(req)){
      return res.status(401).json({
        ok:false,
        error:"No autorizado"
      });
    }

    return res.redirect("/login");
  }

  function requiereRoles(req,res,next,roles){
    if(!estaLogueado(req)){
      return pedirLogin(req,res);
    }

    if(!roles.includes(rolActual(req))){
      return noAutorizado(req,res);
    }

    return next();
  }

  function esRutaPublica(path){
    return path === "/" ||
           path === "/login" ||
           path === "/logout" ||
           path === "/registro" ||
           path === "/aviso-legal" ||
           path === "/privacidad" ||
           path === "/cookies" ||
           path === "/terminos",
    "/encargo-tratamiento",
    "/ayuda",
    "/manual",
    "/condiciones-suscripcion" ||
           path === "/pago-requerido" ||
           path === "/pago-online-pendiente" ||
           path.startsWith("/app/assets/");
  }

  function esRutaAdminGerente(path){
    return path === "/configuracion" ||
           path === "/configurazione" ||
           path === "/configuracion-restaurante" ||
           path === "/configuracion-productos" ||
           path.startsWith("/configuracion-productos/") ||
           path === "/configuracion-mesas" ||
           path.startsWith("/configuracion-mesas/") ||
           path === "/configuracion-impresoras" ||
           path.startsWith("/configuracion-impresoras/") ||
           path === "/configuracion-caja" ||
           path.startsWith("/configuracion-caja/") ||
           path === "/cierre-caja" ||
           path.startsWith("/cierre-caja/") ||
           path === "/configuracion-usuarios" ||
           path.startsWith("/configuracion-usuarios/") ||
           path === "/admin-usuarios" ||
           path.startsWith("/admin-usuarios/") ||
           path.startsWith("/admin-zonas") ||
           path.startsWith("/admin-mesas") ||
           path.startsWith("/admin-productos") ||
           path.startsWith("/admin-categorias") ||
           path.startsWith("/admin/modificadores") ||
           path.startsWith("/admin/variantes") ||
           path === "/admin/usuarios" ||
           path === "/admin/categorias";
  }

  function esRutaSoloAdmin(path){
    return path === "/configuracion-suscripcion" ||
           path.startsWith("/configuracion-suscripcion/") ||
           path.startsWith("/activar-suscripcion");
  }

  function esRutaOperativaCamarero(path){
    return path === "/camarero" ||
           path === "/movil" ||
           path === "/usuario-actual" ||
           path === "/mesas" ||
           path === "/menu" ||
           path.startsWith("/pedido/") ||
           path.startsWith("/abrir-mesa/") ||
           path === "/anadir-producto" ||
           path.startsWith("/linea/") ||
           path.startsWith("/pedido-linea/") ||
           path.startsWith("/linea-pedido/") ||
           path.startsWith("/mesa/") ||
           path.startsWith("/mobile/") ||
           path.startsWith("/bar/enviar/") ||
           path.startsWith("/cocina/enviar/") ||
           path.startsWith("/comandas/enviar/") ||
           path.startsWith("/ticket/") ||
           path.startsWith("/api/estado-mesas-real") ||
           path.startsWith("/api/centro-impresion");
  }

  function esRutaCocina(path){
    return path === "/usuario-actual" ||
           path.startsWith("/cocina") ||
           path.startsWith("/api/centro-impresion");
  }

  function esRutaBar(path){
    return path === "/usuario-actual" ||
           path.startsWith("/bar") ||
           path.startsWith("/api/centro-impresion");
  }

  return function(req,res,next){
    const path = req.path;
    const rol = rolActual(req);

    if(esRutaPublica(path)){
      return next();
    }

    if(esRutaSoloAdmin(path)){
      return requiereRoles(req,res,next,["admin"]);
    }

    if(esRutaAdminGerente(path)){
      return requiereRoles(req,res,next,["admin","gerente"]);
    }

    if(!estaLogueado(req)){
      return pedirLogin(req,res);
    }

    if(path === "/creador" || path.startsWith("/api/creador") || path.startsWith("/stripe/")){
      return requiereRoles(req,res,next,["admin"]);
    }

    if(rol === "admin" || rol === "gerente"){
      return next();
    }

    if(rol === "camarero"){
      if(esRutaOperativaCamarero(path)){
        return next();
      }

      return noAutorizado(req,res);
    }

    if(rol === "cocina"){
      if(esRutaCocina(path)){
        return next();
      }

      return noAutorizado(req,res);
    }

    if(rol === "bar"){
      if(esRutaBar(path)){
        return next();
      }

      return noAutorizado(req,res);
    }

    return noAutorizado(req,res);
  };
}

module.exports = permisosProfesionales;
