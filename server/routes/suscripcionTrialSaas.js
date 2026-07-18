const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function escapar(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function requiereLogin(req, res, next) {
  if (!req.session || !req.session.usuario) return res.redirect("/login");
  next();
}

function requiereAdmin(req, res, next) {
  if (!req.session || !req.session.usuario) return res.redirect("/login");

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol !== "admin") {
    return res.status(403).send("Solo el administrador puede gestionar la suscripción.");
  }

  next();
}

function get(db, sql, params) {
  return new Promise((resolve) => {
    db.get(sql, params || [], function(err, row) {
      if (err) {
        console.error("[suscripcionTrialSaas] SQL get:", err.message);
        return resolve(null);
      }
      resolve(row || null);
    });
  });
}

function run(db, sql, params) {
  return new Promise((resolve) => {
    db.run(sql, params || [], function(err) {
      if (err) {
        console.error("[suscripcionTrialSaas] SQL run:", err.message);
        return resolve({ ok: false, error: err.message });
      }
      resolve({ ok: true, id: this.lastID, changes: this.changes });
    });
  });
}

async function configActual(db, restauranteId) {
  let config = await get(
    db,
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=? ORDER BY id DESC LIMIT 1",
    [restauranteId]
  );

  if (config) return config;

  await run(
    db,
    `INSERT INTO configurazione
     (nome_ristorante, suscripcion_estado, plan_tipo, trial_inicio, trial_fin, restaurante_id)
     VALUES ('Restaurant Service POS', 'trial', 'trial', datetime('now'), datetime('now','+7 days'), ?)`,
    [restauranteId]
  );

  config = await get(
    db,
    "SELECT * FROM configurazione WHERE COALESCE(restaurante_id,1)=? ORDER BY id DESC LIMIT 1",
    [restauranteId]
  );

  return config || {};
}

function diasRestantes(fecha) {
  if (!fecha) return 0;

  const fin = new Date(fecha).getTime();
  if (!fin) return 0;

  return Math.max(0, Math.ceil((fin - Date.now()) / (1000 * 60 * 60 * 24)));
}

function estadoTexto(config) {
  const estado = String(config.suscripcion_estado || "trial").toLowerCase();

  if (estado === "gratis_vida") return "Gratis de por vida";
  if (estado === "activo") return "Activa";
  if (estado === "stripe_mensual") return "Activa";
  if (estado === "trial" || estado === "prueba") return "Prueba gratuita";
  if (estado === "pendiente_pago") return "Pendiente de pago";
  if (estado === "cancelada") return "Cancelada";

  return estado || "No definido";
}

function stripeModo() {
  const key = String(process.env.STRIPE_SECRET_KEY || "");

  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";

  return "no_configurado";
}

function stripeBloqueoLive() {
  const modo = stripeModo();

  if (modo !== "live") return "";

  if (String(process.env.STRIPE_LIVE_CONFIRMADO || "").trim() !== "SI") {
    return "Stripe LIVE está configurado, pero STRIPE_LIVE_CONFIRMADO no es SI.";
  }

  const base = String(process.env.APP_BASE_URL || "").trim();

  if (!base.startsWith("https://")) return "En Stripe LIVE, APP_BASE_URL debe ser https.";
  if (base.includes("localhost")) return "En Stripe LIVE, APP_BASE_URL no puede ser localhost.";
  if (!process.env.STRIPE_WEBHOOK_SECRET) return "En Stripe LIVE, STRIPE_WEBHOOK_SECRET debe estar configurado.";

  return "";
}

function stripeDisponible() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

function renderSuscripcion(config, restauranteId, query) {
  const ok = query.ok || "";
  const stripe = query.stripe || "";
  const estado = estadoTexto(config);
  const dias = diasRestantes(config.trial_fin);
  const modo = stripeModo();

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Suscripción - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;}
    .wrap{max-width:960px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#111827,#4c1d95);color:white;border-radius:26px;padding:28px;margin-bottom:18px;}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#ede9fe;}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,button{display:inline-block;border:0;border-radius:12px;padding:12px 15px;background:#7c3aed;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    a.sec,button.sec{background:#e5e7eb;color:#111827;}
    .msg{border-radius:15px;padding:12px 14px;margin-bottom:14px;font-weight:900;background:#ecfdf5;color:#14532d;border:1px solid #86efac;}
    .card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
    .dato{background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:14px;}
    .dato span{display:block;color:#6b7280;font-weight:900;font-size:12px;}
    .dato strong{display:block;font-size:20px;margin-top:5px;}
    code{display:block;background:#111827;color:white;padding:12px;border-radius:12px;white-space:pre-wrap;}
    @media(max-width:760px){.grid{grid-template-columns:1fr;}}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Suscripción</h1>
      <p>Estado de pago del restaurante actual.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/app/v2">Abrir POS</a>
      </div>
    </section>

    ${ok ? `<div class="msg">${escapar(ok)}</div>` : ""}
    ${stripe === "ok" ? `<div class="msg">Pago confirmado correctamente.</div>` : ""}
    ${stripe === "pendiente" ? `<div class="msg">Pago pendiente de confirmación.</div>` : ""}
    ${stripe === "cancelado" ? `<div class="msg">Pago cancelado.</div>` : ""}

    <section class="card">
      <h2>${escapar(config.nome_ristorante || "Restaurant Service POS")}</h2>
      <div class="grid">
        <div class="dato"><span>Estado</span><strong>${escapar(estado)}</strong></div>
        <div class="dato"><span>Plan</span><strong>${escapar(config.plan_tipo || "trial")}</strong></div>
        <div class="dato"><span>Días trial</span><strong>${dias}</strong></div>
        <div class="dato"><span>Inicio trial</span><strong>${escapar(config.trial_inicio || "-")}</strong></div>
        <div class="dato"><span>Fin trial</span><strong>${escapar(config.trial_fin || "-")}</strong></div>
        <div class="dato"><span>Restaurante ID</span><strong>${restauranteId}</strong></div>
      </div>
    </section>

    <section class="card">
      <h2>Pago mensual</h2>
      <p>Cuando Stripe esté configurado, el cliente podrá activar el plan mensual desde aquí.</p>
      <form method="POST" action="/stripe/crear-checkout-suscripcion">
        <button type="submit">Pagar suscripción</button>
      </form>
      <br>
      <code>Stripe: ${escapar(modo)}
PRICE_ID: ${escapar(process.env.STRIPE_PRICE_ID || "No configurado")}</code>
    </section>
  </main>
</body>
</html>`;
}

async function actualizarActivo(db, restauranteId, datos) {
  const now = new Date().toISOString();

  await run(
    db,
    `UPDATE configurazione
     SET suscripcion_estado='activo',
         plan_tipo='stripe_mensual',
         suscripcion_activada_en=COALESCE(suscripcion_activada_en, ?),
         trial_fin=NULL,
         stripe_customer_id=COALESCE(NULLIF(?,''), stripe_customer_id),
         stripe_subscription_id=COALESCE(NULLIF(?,''), stripe_subscription_id),
         stripe_checkout_session_id=COALESCE(NULLIF(?,''), stripe_checkout_session_id),
         ultimo_pago_stripe_en=?
     WHERE COALESCE(restaurante_id,1)=?`,
    [
      now,
      datos.customerId || "",
      datos.subscriptionId || "",
      datos.checkoutSessionId || "",
      now,
      restauranteId
    ]
  );

  await run(
    db,
    `UPDATE restaurantes
     SET estado='activo',
         plan_tipo='stripe_mensual',
         stripe_customer_id=COALESCE(NULLIF(?,''), stripe_customer_id),
         stripe_subscription_id=COALESCE(NULLIF(?,''), stripe_subscription_id),
         actualizado_en=?
     WHERE id=?`,
    [
      datos.customerId || "",
      datos.subscriptionId || "",
      now,
      restauranteId
    ]
  );
}

module.exports = function suscripcionTrialSaasRoutes(db) {
  const router = express.Router();

  router.get("/configuracion-suscripcion", requiereAdmin, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const config = await configActual(db, restauranteId);

    res.send(renderSuscripcion(config, restauranteId, req.query || {}));
  });

  router.post("/stripe/crear-checkout-suscripcion", requiereAdmin, async function(req, res) {
    const bloqueo = stripeBloqueoLive();

    if (bloqueo) return res.status(400).send("<pre>" + escapar(bloqueo) + "</pre>");
    if (!stripeDisponible()) return res.status(500).send("Stripe no está configurado. Revisa .env.");

    try {
      const Stripe = require("stripe");
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const restauranteId = restauranteIdFromReq(req);
      const config = await configActual(db, restauranteId);
      const baseUrl = String(process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: config.propietario_email || config.email || req.session.usuario.email,
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1
          }
        ],
        metadata: {
          restaurante_id: String(restauranteId),
          usuario_id: String(req.session.usuario.id || ""),
          email: String(req.session.usuario.email || "")
        },
        subscription_data: {
          metadata: {
            restaurante_id: String(restauranteId)
          }
        },
        success_url: baseUrl + "/stripe/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: baseUrl + "/configuracion-suscripcion?stripe=cancelado"
      });

      await run(
        db,
        `UPDATE configurazione
         SET stripe_checkout_session_id=?
         WHERE COALESCE(restaurante_id,1)=?`,
        [session.id, restauranteId]
      );

      return res.redirect(303, session.url);
    } catch (err) {
      console.error("[suscripcionTrialSaas] checkout:", err.message);
      return res.status(500).send("Error creando pago con Stripe: " + err.message);
    }
  });

  router.get("/stripe/success", requiereAdmin, async function(req, res) {
    if (!stripeDisponible()) return res.status(500).send("Stripe no está configurado.");

    try {
      const Stripe = require("stripe");
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const sessionId = String(req.query.session_id || "");

      if (!sessionId) return res.redirect("/configuracion-suscripcion?stripe=sin_session");

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const restauranteId = Number((session.metadata && session.metadata.restaurante_id) || restauranteIdFromReq(req));

      if (session.payment_status === "paid" || session.status === "complete") {
        await actualizarActivo(db, restauranteId, {
          customerId: String(session.customer || ""),
          subscriptionId: String(session.subscription || ""),
          checkoutSessionId: session.id
        });

        return res.redirect("/configuracion-suscripcion?stripe=ok");
      }

      return res.redirect("/configuracion-suscripcion?stripe=pendiente");
    } catch (err) {
      console.error("[suscripcionTrialSaas] success:", err.message);
      return res.status(500).send("Error confirmando Stripe: " + err.message);
    }
  });

  router.get("/stripe/test-config", requiereAdmin, function(req, res) {
    res.json({
      ok: stripeDisponible(),
      modo: stripeModo(),
      price_id: process.env.STRIPE_PRICE_ID || null,
      restaurante_id: restauranteIdFromReq(req)
    });
  });

  return router;
};
