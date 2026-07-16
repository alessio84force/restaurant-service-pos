const express = require("express");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fechaES(valor) {
  if (!valor) return "No definida";

  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return escapar(valor);

  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function normalizar(valor) {
  return String(valor || "").trim().toLowerCase();
}

function trialActivo(config) {
  const estado = normalizar(config.suscripcion_estado);
  if (estado !== "trial" && estado !== "prueba") return false;
  if (!config.trial_fin) return false;

  const fin = new Date(config.trial_fin);
  if (Number.isNaN(fin.getTime())) return false;

  const ahora = new Date();
  return fin.getTime() >= ahora.getTime();
}

function diasRestantes(valor) {
  const fin = new Date(valor);
  if (Number.isNaN(fin.getTime())) return 0;

  const ahora = new Date();
  const ms = fin.getTime() - ahora.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function estadoVisual(config) {
  const estado = normalizar(config.suscripcion_estado);
  const plan = normalizar(config.plan_tipo);

  if (estado === "gratis_vida" || plan === "gratis_vida") {
    return {
      clase: "ok",
      titulo: "Suscripción gratis de por vida",
      texto: "Este restaurante tiene acceso permanente al sistema.",
      mostrarPago: false
    };
  }

  if (estado === "activo") {
    return {
      clase: "ok",
      titulo: "Suscripción activa",
      texto: "El restaurante tiene la suscripción mensual activa.",
      mostrarPago: false
    };
  }

  if (trialActivo(config)) {
    return {
      clase: "trial",
      titulo: "Prueba gratuita activa",
      texto: `El restaurante puede usar el POS hasta el ${fechaES(config.trial_fin)}. Quedan ${diasRestantes(config.trial_fin)} día(s).`,
      mostrarPago: true
    };
  }

  if (estado === "pendiente_pago") {
    return {
      clase: "warning",
      titulo: "Pago pendiente",
      texto: "La suscripción necesita una actualización de pago.",
      mostrarPago: true
    };
  }

  if (estado === "cancelada" || estado === "cancelado") {
    return {
      clase: "danger",
      titulo: "Suscripción cancelada",
      texto: "El restaurante no tiene una suscripción activa.",
      mostrarPago: true
    };
  }

  return {
    clase: "danger",
    titulo: "Suscripción no activa",
    texto: "El restaurante todavía no tiene una suscripción activa.",
    mostrarPago: true
  };
}

module.exports = function panelSuscripcionProfesionalRoutes(db) {
  const router = express.Router();

  router.get("/configuracion-suscripcion", function (req, res) {
    db.get("SELECT * FROM configurazione WHERE id = 1", [], function (err, config) {
      if (err) {
        res.status(500).send("Error cargando suscripción: " + escapar(err.message));
        return;
      }

      config = config || {};
      const visual = estadoVisual(config);

      res.send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Estado de suscripción - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: #f3f4f6;
      color: #111827;
    }

    .page {
      max-width: 980px;
      margin: 0 auto;
      padding: 28px 18px 48px;
    }

    .top {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: center;
      margin-bottom: 18px;
    }

    h1 {
      margin: 0 0 6px;
      font-size: 28px;
    }

    .sub {
      color: #6b7280;
      margin: 0;
      line-height: 1.4;
    }

    .card {
      background: white;
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      border: 1px solid #e5e7eb;
      margin-bottom: 18px;
    }

    .estado {
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 18px;
      border: 1px solid;
    }

    .estado.ok {
      background: #ecfdf5;
      border-color: #10b981;
      color: #065f46;
    }

    .estado.trial {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1e3a8a;
    }

    .estado.warning {
      background: #fffbeb;
      border-color: #f59e0b;
      color: #92400e;
    }

    .estado.danger {
      background: #fef2f2;
      border-color: #ef4444;
      color: #991b1b;
    }

    .estado h2 {
      margin: 0 0 6px;
      font-size: 22px;
    }

    .estado p {
      margin: 0;
      font-size: 15px;
      line-height: 1.5;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .dato {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 14px;
    }

    .dato strong {
      display: block;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: .04em;
      margin-bottom: 6px;
    }

    .dato span {
      font-size: 17px;
      font-weight: 700;
    }

    .acciones {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }

    .btn, button {
      border: 0;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      display: inline-block;
      cursor: pointer;
    }

    .btn.sec {
      background: #e5e7eb;
      color: #111827;
    }

    .btn.pos {
      background: #111827;
      color: white;
    }

    button.pago {
      background: #2563eb;
      color: white;
    }

    .nota {
      font-size: 13px;
      color: #6b7280;
      margin-top: 14px;
      line-height: 1.45;
    }

    @media (max-width: 700px) {
      .top {
        display: block;
      }

      .grid {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="top">
      <div>
        <h1>Estado de suscripción</h1>
        <p class="sub">Consulta el estado actual de la prueba gratuita, el plan activo y la activación del restaurante.</p>
      </div>
    </div>

    <section class="card">
      <div class="estado ${visual.clase}">
        <h2>${escapar(visual.titulo)}</h2>
        <p>${escapar(visual.texto)}</p>
      </div>

      <div class="grid">
        <div class="dato">
          <strong>Restaurante</strong>
          <span>${escapar(config.nombre_restaurante || "Restaurant Service POS")}</span>
        </div>

        <div class="dato">
          <strong>Propietario</strong>
          <span>${escapar(config.propietario_nombre || "No definido")}</span>
        </div>

        <div class="dato">
          <strong>Email</strong>
          <span>${escapar(config.propietario_email || "No definido")}</span>
        </div>

        <div class="dato">
          <strong>Estado</strong>
          <span>${escapar(config.suscripcion_estado || "No definido")}</span>
        </div>

        <div class="dato">
          <strong>Plan</strong>
          <span>${escapar(config.plan_tipo || "No definido")}</span>
        </div>

        <div class="dato">
          <strong>Inicio prueba</strong>
          <span>${fechaES(config.trial_inicio)}</span>
        </div>

        <div class="dato">
          <strong>Fin prueba</strong>
          <span>${fechaES(config.trial_fin)}</span>
        </div>

        <div class="dato">
          <strong>Activada en</strong>
          <span>${fechaES(config.activada_en)}</span>
        </div>

        <div class="dato">
          <strong>Promoción</strong>
          <span>${escapar(config.promocion_aplicada || "No aplicada")}</span>
        </div>
      </div>

      <div class="acciones">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn pos" href="/app/v2">Abrir POS</a>

        ${visual.mostrarPago ? `
          <form method="POST" action="/stripe/crear-checkout-suscripcion">
            <button class="pago" type="submit">Pagar suscripción</button>
          </form>
        ` : ""}
      </div>

      <p class="nota">
        Las pruebas gratuitas permiten usar el sistema durante el periodo indicado. El pago mensual se activa mediante Stripe.
      </p>
    </section>
  </main>
</body>
</html>`);
    });
  });

  return router;
};
