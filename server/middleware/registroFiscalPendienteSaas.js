function limpiar(v) {
  return String(v == null ? "" : v).trim();
}

function fiscalDesdeBody(body) {
  const b = body || {};

  return {
    razon_social: limpiar(b.razon_social || b.nombre_fiscal || b.empresa || b.nombre_restaurante || b.restaurante),
    nif: limpiar(b.nif || b.cif || b.vat || b.partita_iva),
    direccion: limpiar(b.direccion || b.indirizzo || b.direccion_fiscal),
    codigo_postal: limpiar(b.codigo_postal || b.cp),
    ciudad: limpiar(b.ciudad || b.localidad),
    provincia: limpiar(b.provincia),
    pais: limpiar(b.pais || "España"),
    email_facturacion: limpiar(b.email_facturacion || b.email),
    telefono: limpiar(b.telefono || b.propietario_telefono),
    propietario_nombre: limpiar(b.propietario_nombre || b.propietario || b.nombre),
    propietario_email: limpiar(b.propietario_email || b.email),
    propietario_telefono: limpiar(b.propietario_telefono || b.telefono)
  };
}

function completos(datos) {
  return Boolean(
    datos.razon_social &&
    datos.nif &&
    datos.direccion &&
    datos.codigo_postal &&
    datos.ciudad &&
    datos.provincia &&
    datos.pais &&
    datos.email_facturacion
  );
}

module.exports = function registroFiscalPendienteSaas(db) {
  return function(req, res, next) {
    if (req.method === "POST" && req.path === "/registro") {
      req.session.registro_fiscal_saas = fiscalDesdeBody(req.body || {});
      return next();
    }

    if (!req.session || !req.session.registro_fiscal_saas || !req.session.restaurante_id) {
      return next();
    }

    const restauranteId = Number(req.session.restaurante_id || 0);
    const datos = req.session.registro_fiscal_saas;
    const completo = completos(datos) ? 1 : 0;

    db.run(
      `UPDATE restaurantes
       SET razon_social=?,
           nif=?,
           direccion=?,
           codigo_postal=?,
           ciudad=?,
           provincia=?,
           pais=?,
           email_facturacion=?,
           propietario_nombre=COALESCE(NULLIF(propietario_nombre,''), ?),
           propietario_email=COALESCE(NULLIF(propietario_email,''), ?),
           propietario_telefono=COALESCE(NULLIF(propietario_telefono,''), ?),
           datos_fiscales_completos=?,
           actualizado_en=datetime('now')
       WHERE id=?`,
      [
        datos.razon_social,
        datos.nif,
        datos.direccion,
        datos.codigo_postal,
        datos.ciudad,
        datos.provincia,
        datos.pais,
        datos.email_facturacion,
        datos.propietario_nombre,
        datos.propietario_email,
        datos.propietario_telefono,
        completo,
        restauranteId
      ],
      function(errRest) {
        if (errRest) {
          console.error("[registroFiscalPendienteSaas] restaurantes:", errRest.message);
        }

        db.run(
          `UPDATE configurazione
           SET razon_social=?,
               partita_iva=?,
               indirizzo=?,
               codigo_postal=?,
               ciudad=?,
               provincia=?,
               pais=?,
               email_facturacion=?,
               telefono=COALESCE(NULLIF(telefono,''), ?),
               propietario_nombre=COALESCE(NULLIF(propietario_nombre,''), ?),
               propietario_email=COALESCE(NULLIF(propietario_email,''), ?),
               propietario_telefono=COALESCE(NULLIF(propietario_telefono,''), ?),
               datos_fiscales_completos=?
           WHERE COALESCE(restaurante_id,1)=?`,
          [
            datos.razon_social,
            datos.nif,
            datos.direccion,
            datos.codigo_postal,
            datos.ciudad,
            datos.provincia,
            datos.pais,
            datos.email_facturacion,
            datos.telefono,
            datos.propietario_nombre,
            datos.propietario_email,
            datos.propietario_telefono,
            completo,
            restauranteId
          ],
          function(errConf) {
            if (errConf) {
              console.error("[registroFiscalPendienteSaas] configurazione:", errConf.message);
            }

            delete req.session.registro_fiscal_saas;
            next();
          }
        );
      }
    );
  };
};
