const express = require("express");
const { enviarEmailEvento } = require("../services/emailService");

function stripeSuscripcionRoutes(db){
  const router = express.Router();

  function stripeDisponible(){
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
  }

  function stripeCliente(){
    if(!stripeDisponible()){
      return null;
    }

    const Stripe = require("stripe");
    return Stripe(process.env.STRIPE_SECRET_KEY);
  }

  function precioMensual(){
    return Number(process.env.PRECIO_MENSUAL || 7.50);
  }

  function requiereLogin(req,res,next){
    if(!req.session || !req.session.usuario){
      return res.redirect("/login");
    }

    return next();
  }

  function emailUsuario(req){
    return String((req.session && req.session.usuario && req.session.usuario.email) || "").toLowerCase();
  }

  function nombreUsuario(req){
    return String((req.session && req.session.usuario && req.session.usuario.nombre) || "Propietario");
  }



  function notificarEmailSuscripcionStripe(req, callback){
    enviarEmailEvento(db, "suscripcion_activada", {
      to: emailUsuario(req),
      propietario_email: emailUsuario(req),
      propietario_nombre: nombreUsuario(req),
      precio: precioMensual().toFixed(2).replace(".", ",") + " €/mes"
    }, (err, resultado) => {
      if(err){
        console.error("[EMAIL STRIPE SUCCESS]", err.message);
      }else{
        console.log("[EMAIL STRIPE SUCCESS]", resultado && resultado.ruta_txt ? resultado.ruta_txt : "ok");
      }

      callback();
    });
  }


  function asegurarTablaClientes(callback){
    db.serialize(()=>{
      db.run(`
        CREATE TABLE IF NOT EXISTS creador_clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre_restaurante TEXT,
          propietario_nombre TEXT,
          propietario_email TEXT,
          propietario_telefono TEXT,
          usuario_id INTEGER,
          suscripcion_estado TEXT DEFAULT 'trial',
          trial_inicio TEXT,
          trial_fin TEXT,
          plan_tipo TEXT,
          promocion_aplicada TEXT,
          suscripcion_activada_en TEXT,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          notas TEXT DEFAULT '',
          bloqueado INTEGER DEFAULT 0,
          creado_en TEXT DEFAULT CURRENT_TIMESTAMP,
          actualizado_en TEXT DEFAULT CURRENT_TIMESTAMP,
          precio_mensual REAL DEFAULT 7.50,
          moneda TEXT DEFAULT 'EUR',
          ultimo_pago_en TEXT,
          proximo_pago_en TEXT,
          origen TEXT DEFAULT 'registro'
        )
      `, [], (err)=>{
        if(err) return callback(err);

        db.run(`
          CREATE TABLE IF NOT EXISTS creador_pagos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER,
            propietario_email TEXT,
            concepto TEXT,
            importe REAL DEFAULT 0,
            moneda TEXT DEFAULT 'EUR',
            estado TEXT DEFAULT 'pendiente',
            stripe_payment_id TEXT,
            stripe_invoice_id TEXT,
            creado_en TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `, [], callback);
      });
    });
  }

  function asegurarColumnasConfiguracion(callback){
    db.all("PRAGMA table_info(configurazione)", [], (err, columnas)=>{
      if(err) return callback(err);

      const actuales = (columnas || []).map(c => c.name);

      const nuevas = [
        ["stripe_customer_id", "TEXT"],
        ["stripe_subscription_id", "TEXT"],
        ["stripe_checkout_session_id", "TEXT"],
        ["ultimo_pago_stripe_en", "TEXT"],
        ["proximo_pago_stripe_en", "TEXT"]
      ].filter(c => !actuales.includes(c[0]));

      function siguiente(i){
        if(i >= nuevas.length) return callback(null);

        db.run("ALTER TABLE configurazione ADD COLUMN " + nuevas[i][0] + " " + nuevas[i][1], [], (errAlter)=>{
          if(errAlter) return callback(errAlter);
          siguiente(i + 1);
        });
      }

      siguiente(0);
    });
  }

  function actualizarSuscripcionLocal(req, session, callback){
    const email = emailUsuario(req);
    const ahora = new Date().toISOString();
    const customerId = String(session.customer || "");
    const subscriptionId = String(session.subscription || "");
    const checkoutSessionId = String(session.id || "");

    db.serialize(()=>{
      asegurarTablaClientes((errTabla)=>{
        if(errTabla) return callback(errTabla);

        asegurarColumnasConfiguracion((errCols)=>{
          if(errCols) return callback(errCols);

          db.get("SELECT * FROM configurazione WHERE id=1", [], (errConfig, config)=>{
            if(errConfig) return callback(errConfig);

            const restaurante = (config && config.nome_ristorante) || "Restaurant Service POS";
            const propietarioNombre = (config && config.propietario_nombre) || nombreUsuario(req);
            const propietarioTelefono = (config && config.propietario_telefono) || "";

            db.run(`
              UPDATE configurazione
              SET suscripcion_estado='activo',
                  plan_tipo='stripe_mensual',
                  suscripcion_activada_en=?,
                  trial_fin=NULL,
                  stripe_customer_id=?,
                  stripe_subscription_id=?,
                  stripe_checkout_session_id=?,
                  ultimo_pago_stripe_en=?
              WHERE id=1
            `, [
              ahora,
              customerId,
              subscriptionId,
              checkoutSessionId,
              ahora
            ], (errUpdateConfig)=>{
              if(errUpdateConfig) return callback(errUpdateConfig);

              db.get("SELECT id FROM creador_clientes WHERE LOWER(propietario_email)=LOWER(?)", [email], (errCliente, cliente)=>{
                if(errCliente) return callback(errCliente);

                function guardarPago(clienteId){
                  db.run(`
                    INSERT INTO creador_pagos (
                      cliente_id,
                      propietario_email,
                      concepto,
                      importe,
                      moneda,
                      estado,
                      stripe_payment_id,
                      stripe_invoice_id,
                      creado_en
                    ) VALUES (?,?,?,?,?,?,?,?,?)
                  `, [
                    clienteId || null,
                    email,
                    "Suscripción mensual Stripe test",
                    precioMensual(),
                    "EUR",
                    "pagado",
                    checkoutSessionId,
                    subscriptionId,
                    ahora
                  ], callback);
                }

                if(cliente && cliente.id){
                  db.run(`
                    UPDATE creador_clientes
                    SET nombre_restaurante=?,
                        propietario_nombre=?,
                        propietario_email=?,
                        propietario_telefono=?,
                        suscripcion_estado='activo',
                        plan_tipo='stripe_mensual',
                        trial_fin=NULL,
                        suscripcion_activada_en=?,
                        stripe_customer_id=?,
                        stripe_subscription_id=?,
                        precio_mensual=?,
                        moneda='EUR',
                        ultimo_pago_en=?,
                        actualizado_en=?
                    WHERE id=?
                  `, [
                    restaurante,
                    propietarioNombre,
                    email,
                    propietarioTelefono,
                    ahora,
                    customerId,
                    subscriptionId,
                    precioMensual(),
                    ahora,
                    ahora,
                    cliente.id
                  ], (errUpdateCliente)=>{
                    if(errUpdateCliente) return callback(errUpdateCliente);
                    guardarPago(cliente.id);
                  });
                }else{
                  db.run(`
                    INSERT INTO creador_clientes (
                      nombre_restaurante,
                      propietario_nombre,
                      propietario_email,
                      propietario_telefono,
                      suscripcion_estado,
                      plan_tipo,
                      trial_fin,
                      suscripcion_activada_en,
                      stripe_customer_id,
                      stripe_subscription_id,
                      precio_mensual,
                      moneda,
                      ultimo_pago_en,
                      origen,
                      creado_en,
                      actualizado_en
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                  `, [
                    restaurante,
                    propietarioNombre,
                    email,
                    propietarioTelefono,
                    "activo",
                    "stripe_mensual",
                    null,
                    ahora,
                    customerId,
                    subscriptionId,
                    precioMensual(),
                    "EUR",
                    ahora,
                    "stripe_checkout",
                    ahora,
                    ahora
                  ], function(errInsertCliente){
                    if(errInsertCliente) return callback(errInsertCliente);
                    guardarPago(this.lastID);
                  });
                }
              });
            });
          });
        });
      });
    });
  }

  router.post("/stripe/crear-checkout-suscripcion", requiereLogin, async (req,res)=>{
    try{
      const stripe = stripeCliente();

      if(!stripe){
        return res.status(500).send("Stripe no está configurado. Revisa el archivo .env.");
      }

      const baseUrl = String(process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/+$/,"");
      const email = emailUsuario(req);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1
          }
        ],
        customer_email: email || undefined,
        success_url: baseUrl + "/stripe/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: baseUrl + "/configuracion-suscripcion?stripe=cancelado",
        metadata: {
          usuario_email: email,
          origen: "restaurant_service_pos"
        }
      });

      return res.redirect(303, session.url);
    }catch(error){
      console.error("Error creando Checkout Stripe:", error.message);
      return res.status(500).send("Error creando pago con Stripe: " + error.message);
    }
  });

  router.get("/stripe/success", requiereLogin, async (req,res)=>{
    try{
      const stripe = stripeCliente();

      if(!stripe){
        return res.status(500).send("Stripe no está configurado.");
      }

      const sessionId = String(req.query.session_id || "");

      if(!sessionId){
        return res.redirect("/configuracion-suscripcion?stripe=sin_session");
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if(session && session.status === "complete"){
        actualizarSuscripcionLocal(req, session, (err)=>{
          if(err){
            console.error("Error actualizando suscripción local:", err.message);
            return res.status(500).send("Pago completado en Stripe, pero error actualizando el POS.");
          }

          return res.redirect("/configuracion-suscripcion?stripe=ok");
        });
      }else{
        return res.redirect("/configuracion-suscripcion?stripe=pendiente");
      }
    }catch(error){
      console.error("Error confirmando Stripe:", error.message);
      return res.status(500).send("Error confirmando pago Stripe: " + error.message);
    }
  });

  router.get("/stripe/test-config", requiereLogin, (req,res)=>{
    res.json({
      ok: stripeDisponible(),
      price_id: process.env.STRIPE_PRICE_ID || null,
      base_url: process.env.APP_BASE_URL || "http://localhost:3000"
    });
  });

  return router;
}

module.exports = stripeSuscripcionRoutes;
