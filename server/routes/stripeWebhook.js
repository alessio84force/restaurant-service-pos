const express = require("express");
const { enviarEmailEvento } = require("../services/emailService");

function stripeWebhookRoutes(db){
  const router = express.Router();

  function stripeCliente(){
    const Stripe = require("stripe");
    return Stripe(process.env.STRIPE_SECRET_KEY || "");
  }

  function precioMensual(){
    return Number(process.env.PRECIO_MENSUAL || 7.50);
  }

  function ahoraISO(){
    return new Date().toISOString();
  }

  function asegurarTablas(callback){
    db.serialize(()=>{
      db.run(`
        CREATE TABLE IF NOT EXISTS stripe_eventos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          stripe_event_id TEXT UNIQUE,
          tipo TEXT,
          procesado_en TEXT DEFAULT CURRENT_TIMESTAMP
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
        `, [], (err2)=>{
          if(err2) return callback(err2);

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
          `, [], callback);
        });
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

  function eventoYaProcesado(eventId, tipo, callback){
    asegurarTablas((err)=>{
      if(err) return callback(err);

      db.run(
        "INSERT INTO stripe_eventos(stripe_event_id,tipo) VALUES(?,?)",
        [eventId, tipo],
        function(errInsert){
          if(errInsert){
            if(String(errInsert.message || "").includes("UNIQUE")){
              return callback(null, true);
            }

            return callback(errInsert);
          }

          callback(null, false);
        }
      );
    });
  }

  function buscarClientePorStripe(customerId, subscriptionId, email, callback){
    db.get(
      `
      SELECT id
      FROM creador_clientes
      WHERE
        (stripe_subscription_id IS NOT NULL AND stripe_subscription_id=?)
        OR (stripe_customer_id IS NOT NULL AND stripe_customer_id=?)
        OR (propietario_email IS NOT NULL AND LOWER(propietario_email)=LOWER(?))
      ORDER BY id DESC
      LIMIT 1
      `,
      [subscriptionId || "", customerId || "", email || ""],
      callback
    );
  }

  function actualizarActivo(datos, callback){
    const fecha = ahoraISO();
    const email = String(datos.email || "").toLowerCase();
    const customerId = String(datos.customerId || "");
    const subscriptionId = String(datos.subscriptionId || "");
    const invoiceId = String(datos.invoiceId || "");
    const paymentId = String(datos.paymentId || "");
    const importe = Number(datos.importe || precioMensual());
    const moneda = String(datos.moneda || "EUR").toUpperCase();

    asegurarTablas((err)=>{
      if(err) return callback(err);

      asegurarColumnasConfiguracion((errCols)=>{
        if(errCols) return callback(errCols);

        db.serialize(()=>{
          db.run(
            `
            UPDATE configurazione
            SET suscripcion_estado='activo',
                plan_tipo='stripe_mensual',
                trial_fin=NULL,
                suscripcion_activada_en=COALESCE(suscripcion_activada_en, ?),
                stripe_customer_id=COALESCE(NULLIF(?,''), stripe_customer_id),
                stripe_subscription_id=COALESCE(NULLIF(?,''), stripe_subscription_id),
                ultimo_pago_stripe_en=?
            WHERE id=1
            `,
            [fecha, customerId, subscriptionId, fecha],
            (errConfig)=>{
              if(errConfig) return callback(errConfig);

              buscarClientePorStripe(customerId, subscriptionId, email, (errBuscar, cliente)=>{
                if(errBuscar) return callback(errBuscar);

                function guardarPago(clienteId){
                  db.run(
                    `
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
                    `,
                    [
                      clienteId || null,
                      email,
                      "Suscripción mensual Stripe webhook",
                      importe,
                      moneda,
                      "pagado",
                      paymentId,
                      invoiceId,
                      fecha
                    ],
                    callback
                  );
                }

                if(cliente && cliente.id){
                  db.run(
                    `
                    UPDATE creador_clientes
                    SET propietario_email=COALESCE(NULLIF(?,''), propietario_email),
                        suscripcion_estado='activo',
                        plan_tipo='stripe_mensual',
                        trial_fin=NULL,
                        stripe_customer_id=COALESCE(NULLIF(?,''), stripe_customer_id),
                        stripe_subscription_id=COALESCE(NULLIF(?,''), stripe_subscription_id),
                        precio_mensual=?,
                        moneda=?,
                        ultimo_pago_en=?,
                        actualizado_en=?
                    WHERE id=?
                    `,
                    [
                      email,
                      customerId,
                      subscriptionId,
                      precioMensual(),
                      moneda,
                      fecha,
                      fecha,
                      cliente.id
                    ],
                    (errUpdate)=>{
                      if(errUpdate) return callback(errUpdate);
                      guardarPago(cliente.id);
                    }
                  );
                }else{
                  db.run(
                    `
                    INSERT INTO creador_clientes (
                      nombre_restaurante,
                      propietario_nombre,
                      propietario_email,
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
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    `,
                    [
                      "Cliente Stripe",
                      "Propietario",
                      email,
                      "activo",
                      "stripe_mensual",
                      null,
                      fecha,
                      customerId,
                      subscriptionId,
                      precioMensual(),
                      moneda,
                      fecha,
                      "stripe_webhook",
                      fecha,
                      fecha
                    ],
                    function(errInsert){
                      if(errInsert) return callback(errInsert);
                      guardarPago(this.lastID);
                    }
                  );
                }
              });
            }
          );
        });
      });
    });
  }



  function notificarPagoFallidoWebhook(datos, callback){
    const email = String(datos.email || "").toLowerCase();

    if(!email){
      console.log("[EMAIL WEBHOOK PAGO FALLIDO] sin email destinatario");
      return callback();
    }

    enviarEmailEvento(db, "pago_fallido", {
      to: email,
      propietario_email: email,
      precio: precioMensual().toFixed(2).replace(".", ",") + " €/mes",
      stripe_customer_id: datos.customerId || "",
      stripe_subscription_id: datos.subscriptionId || ""
    }, (err, resultado) => {
      if(err){
        console.error("[EMAIL WEBHOOK PAGO FALLIDO]", err.message);
      }else{
        console.log("[EMAIL WEBHOOK PAGO FALLIDO]", resultado && resultado.ruta_txt ? resultado.ruta_txt : "ok");
      }

      callback();
    });
  }


  function actualizarEstadoStripe(estado, datos, callback){
    const callbackOriginalEstadoStripe = callback || function(){};
    const callbackConEmailPagoFallido = function(err){
      if(err){
        return callbackOriginalEstadoStripe(err);
      }

      if(String(estado || "").toLowerCase() !== "pendiente_pago"){
        return callbackOriginalEstadoStripe(null);
      }

      return notificarPagoFallidoWebhook(datos, function(){
        return callbackOriginalEstadoStripe(null);
      });
    };

    callback = callbackConEmailPagoFallido;

    const fecha = ahoraISO();
    const email = String(datos.email || "").toLowerCase();
    const customerId = String(datos.customerId || "");
    const subscriptionId = String(datos.subscriptionId || "");

    asegurarTablas((err)=>{
      if(err) return callback(err);

      asegurarColumnasConfiguracion((errCols)=>{
        if(errCols) return callback(errCols);

        db.serialize(()=>{
          db.run(
            `
            UPDATE configurazione
            SET suscripcion_estado=?,
                stripe_customer_id=COALESCE(NULLIF(?,''), stripe_customer_id),
                stripe_subscription_id=COALESCE(NULLIF(?,''), stripe_subscription_id)
            WHERE id=1
            `,
            [estado, customerId, subscriptionId],
            (errConfig)=>{
              if(errConfig) return callback(errConfig);

              buscarClientePorStripe(customerId, subscriptionId, email, (errBuscar, cliente)=>{
                if(errBuscar) return callback(errBuscar);

                if(cliente && cliente.id){
                  db.run(
                    `
                    UPDATE creador_clientes
                    SET suscripcion_estado=?,
                        propietario_email=COALESCE(NULLIF(?,''), propietario_email),
                        stripe_customer_id=COALESCE(NULLIF(?,''), stripe_customer_id),
                        stripe_subscription_id=COALESCE(NULLIF(?,''), stripe_subscription_id),
                        actualizado_en=?
                    WHERE id=?
                    `,
                    [estado, email, customerId, subscriptionId, fecha, cliente.id],
                    callback
                  );
                }else{
                  db.run(
                    `
                    INSERT INTO creador_clientes (
                      nombre_restaurante,
                      propietario_nombre,
                      propietario_email,
                      suscripcion_estado,
                      plan_tipo,
                      stripe_customer_id,
                      stripe_subscription_id,
                      precio_mensual,
                      moneda,
                      origen,
                      creado_en,
                      actualizado_en
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                    `,
                    [
                      "Cliente Stripe",
                      "Propietario",
                      email,
                      estado,
                      "stripe_mensual",
                      customerId,
                      subscriptionId,
                      precioMensual(),
                      "EUR",
                      "stripe_webhook",
                      fecha,
                      fecha
                    ],
                    callback
                  );
                }
              });
            }
          );
        });
      });
    });
  }

  async function emailClienteStripe(stripe, customerId){
    if(!customerId) return "";

    try{
      const customer = await stripe.customers.retrieve(customerId);
      return String((customer && customer.email) || "").toLowerCase();
    }catch(e){
      return "";
    }
  }

  router.post("/", async (req,res)=>{
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if(!webhookSecret){
      return res.status(500).send("Webhook Stripe no configurado: falta STRIPE_WEBHOOK_SECRET");
    }

    const stripe = stripeCliente();
    const sig = req.headers["stripe-signature"];

    let event;

    try{
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }catch(err){
      console.error("Webhook Stripe firma no válida:", err.message);
      return res.status(400).send("Webhook Error: " + err.message);
    }

    eventoYaProcesado(event.id, event.type, async (errEvento, yaProcesado)=>{
      if(errEvento){
        console.error("Error registrando evento Stripe:", errEvento.message);
        return res.status(500).json({ ok:false });
      }

      if(yaProcesado){
        return res.json({ ok:true, repetido:true });
      }

      try{
        const obj = event.data.object || {};
        const customerId = String(obj.customer || "");
        const subscriptionId = String(obj.subscription || obj.id || "");
        const invoiceId = String(obj.id || "");
        const paymentId = String(obj.payment_intent || obj.charge || obj.id || "");
        let email = String(obj.customer_email || obj.email || "").toLowerCase();

        if(!email){
          email = await emailClienteStripe(stripe, customerId);
        }

        if(event.type === "checkout.session.completed"){
          actualizarActivo({
            email,
            customerId,
            subscriptionId,
            invoiceId: obj.id || "",
            paymentId: obj.payment_intent || obj.id || "",
            importe: precioMensual(),
            moneda: "EUR"
          }, (err)=>{
            if(err){
              console.error("Error procesando checkout.session.completed:", err.message);
              return res.status(500).json({ ok:false });
            }

            return res.json({ ok:true });
          });

          return;
        }

        if(event.type === "invoice.payment_succeeded"){
          actualizarActivo({
            email,
            customerId,
            subscriptionId,
            invoiceId,
            paymentId,
            importe: Number(obj.amount_paid || 0) / 100 || precioMensual(),
            moneda: obj.currency || "EUR"
          }, (err)=>{
            if(err){
              console.error("Error procesando invoice.payment_succeeded:", err.message);
              return res.status(500).json({ ok:false });
            }

            return res.json({ ok:true });
          });

          return;
        }

        if(event.type === "invoice.payment_failed"){
          actualizarEstadoStripe("pendiente_pago", {
            email,
            customerId,
            subscriptionId
          }, (err)=>{
            if(err){
              console.error("Error procesando invoice.payment_failed:", err.message);
              return res.status(500).json({ ok:false });
            }

            return res.json({ ok:true });
          });

          return;
        }

        if(event.type === "customer.subscription.deleted"){
          actualizarEstadoStripe("cancelada", {
            email,
            customerId,
            subscriptionId: obj.id || subscriptionId
          }, (err)=>{
            if(err){
              console.error("Error procesando customer.subscription.deleted:", err.message);
              return res.status(500).json({ ok:false });
            }

            return res.json({ ok:true });
          });

          return;
        }

        return res.json({ ok:true, ignored:event.type });
      }catch(error){
        console.error("Error webhook Stripe:", error.message);
        return res.status(500).json({ ok:false });
      }
    });
  });

  return router;
}

module.exports = stripeWebhookRoutes;
