function escapar(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fechaES(valor) {
  if (!valor) return "No definida";

  const fecha = new Date(valor);

  if (isNaN(fecha.getTime())) return "No definida";

  return fecha.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function diasRestantes(valor) {
  if (!valor) return "";

  const fecha = new Date(valor);

  if (isNaN(fecha.getTime())) return "";

  const diff = Math.ceil((fecha.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (diff > 1) return diff + " días restantes";
  if (diff === 1) return "1 día restante";
  if (diff === 0) return "Termina hoy";

  return "Prueba caducada";
}

function layoutEmail({ titulo, subtitulo, contenido, botonTexto, botonUrl }) {
  const url = botonUrl || "http://localhost:3000/login";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${escapar(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:28px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:calc(100% - 32px);background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,.12);">
          <tr>
            <td style="background:#0f172a;color:#ffffff;padding:28px;">
              <div style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#93c5fd;">Restaurant Service POS</div>
              <h1 style="margin:10px 0 0;font-size:30px;line-height:1.15;">${escapar(titulo)}</h1>
              <p style="margin:10px 0 0;color:#cbd5e1;font-weight:700;line-height:1.45;">${escapar(subtitulo)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              ${contenido}
              <div style="margin-top:26px;">
                <a href="${escapar(url)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:14px;font-weight:900;">
                  ${escapar(botonTexto || "Entrar")}
                </a>
              </div>
              <p style="margin:28px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                Este mensaje ha sido generado automáticamente por Restaurant Service POS.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "Restaurant Service POS",
    "",
    titulo,
    subtitulo,
    "",
    contenido.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    "",
    botonTexto ? botonTexto + ": " + url : "Entrar: " + url
  ].join("\n");

  return { html, text };
}

function datosBase(datos) {
  return {
    nombre: datos.propietario_nombre || datos.nombre || "Propietario",
    email: datos.propietario_email || datos.email || "",
    restaurante: datos.nome_ristorante || datos.restaurante || "Restaurant Service POS",
    trialFin: datos.trial_fin || "",
    promo: datos.promocion_aplicada || "",
    precio: datos.precio || "7,50 €/mes",
    appUrl: datos.app_url || process.env.APP_BASE_URL || "http://localhost:3000"
  };
}

function cuentaCreada(datos) {
  const d = datosBase(datos);

  return layoutEmail({
    titulo: "Cuenta creada correctamente",
    subtitulo: "Tu restaurante ya tiene acceso a Restaurant Service POS.",
    contenido: `
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">Hola ${escapar(d.nombre)},</p>
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">
        Hemos creado la cuenta de <strong>${escapar(d.restaurante)}</strong>.
      </p>
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">
        Ya puedes entrar al sistema, configurar tus mesas, productos, destinos de comanda e impresoras.
      </p>
    `,
    botonTexto: "Entrar al POS",
    botonUrl: d.appUrl + "/login"
  });
}

function trialIniciado(datos) {
  const d = datosBase(datos);

  return layoutEmail({
    titulo: "Tu prueba gratuita ha comenzado",
    subtitulo: "Puedes usar Restaurant Service POS sin pagar durante el periodo de prueba.",
    contenido: `
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">Hola ${escapar(d.nombre)},</p>
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">
        La prueba gratuita de <strong>${escapar(d.restaurante)}</strong> está activa.
      </p>
      <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:18px;padding:18px;margin:18px 0;">
        <strong style="display:block;font-size:20px;color:#065f46;">Disponible hasta el ${escapar(fechaES(d.trialFin))}</strong>
        <span style="color:#047857;font-weight:900;">${escapar(diasRestantes(d.trialFin))}</span>
      </div>
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">
        Después podrás activar la suscripción mensual de ${escapar(d.precio)}.
      </p>
    `,
    botonTexto: "Entrar al POS",
    botonUrl: d.appUrl + "/login"
  });
}

function trialExpira(datos) {
  const d = datosBase(datos);

  return layoutEmail({
    titulo: "Tu prueba gratuita está a punto de terminar",
    subtitulo: "Activa la suscripción para seguir usando Restaurant Service POS sin interrupciones.",
    contenido: `
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">Hola ${escapar(d.nombre)},</p>
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">
        La prueba gratuita de <strong>${escapar(d.restaurante)}</strong> termina el ${escapar(fechaES(d.trialFin))}.
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:18px;margin:18px 0;">
        <strong style="display:block;font-size:20px;color:#9a3412;">${escapar(diasRestantes(d.trialFin))}</strong>
      </div>
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">
        Puedes activar la suscripción desde el panel de suscripción.
      </p>
    `,
    botonTexto: "Activar suscripción",
    botonUrl: d.appUrl + "/configuracion-suscripcion"
  });
}

function suscripcionActivada(datos) {
  const d = datosBase(datos);

  return layoutEmail({
    titulo: "Suscripción activada",
    subtitulo: "Tu suscripción de Restaurant Service POS está activa.",
    contenido: `
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">Hola ${escapar(d.nombre)},</p>
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">
        La suscripción de <strong>${escapar(d.restaurante)}</strong> se ha activado correctamente.
      </p>
      <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:18px;padding:18px;margin:18px 0;">
        <strong style="display:block;font-size:20px;color:#065f46;">Plan activo</strong>
        <span style="color:#047857;font-weight:900;">${escapar(d.precio)}</span>
      </div>
    `,
    botonTexto: "Entrar al POS",
    botonUrl: d.appUrl + "/login"
  });
}

function pagoFallido(datos) {
  const d = datosBase(datos);

  return layoutEmail({
    titulo: "No hemos podido confirmar el pago",
    subtitulo: "Revisa tu método de pago para mantener activa la suscripción.",
    contenido: `
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">Hola ${escapar(d.nombre)},</p>
      <p style="font-size:16px;font-weight:700;line-height:1.55;color:#334155;">
        No hemos podido confirmar el pago de <strong>${escapar(d.restaurante)}</strong>.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:18px;padding:18px;margin:18px 0;">
        <strong style="display:block;font-size:20px;color:#991b1b;">Pago pendiente</strong>
        <span style="color:#b91c1c;font-weight:900;">Actualiza la suscripción para evitar interrupciones.</span>
      </div>
    `,
    botonTexto: "Revisar suscripción",
    botonUrl: d.appUrl + "/configuracion-suscripcion"
  });
}

function crearEmail(tipo, datos) {
  if (tipo === "cuenta_creada") return cuentaCreada(datos);
  if (tipo === "trial_iniciado") return trialIniciado(datos);
  if (tipo === "trial_expira") return trialExpira(datos);
  if (tipo === "suscripcion_activada") return suscripcionActivada(datos);
  if (tipo === "pago_fallido") return pagoFallido(datos);

  return layoutEmail({
    titulo: "Notificación Restaurant Service POS",
    subtitulo: "Tienes una actualización en tu cuenta.",
    contenido: `<p style="font-size:16px;font-weight:700;color:#334155;">Revisa tu panel de Restaurant Service POS.</p>`,
    botonTexto: "Entrar",
    botonUrl: (datos.app_url || process.env.APP_BASE_URL || "http://localhost:3000") + "/login"
  });
}

function asuntoEmail(tipo, datos) {
  const restaurante = datos.nome_ristorante || datos.restaurante || "Restaurant Service POS";

  if (tipo === "cuenta_creada") return "Cuenta creada - " + restaurante;
  if (tipo === "trial_iniciado") return "Prueba gratuita iniciada - " + restaurante;
  if (tipo === "trial_expira") return "Tu prueba gratuita está a punto de terminar";
  if (tipo === "suscripcion_activada") return "Suscripción activada - " + restaurante;
  if (tipo === "pago_fallido") return "Pago pendiente - Restaurant Service POS";

  return "Notificación - Restaurant Service POS";
}

module.exports = {
  crearEmail,
  asuntoEmail
};
