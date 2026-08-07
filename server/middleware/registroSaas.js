const { validarCodigoPromocional } = require("../promoCodes");
const { enviarEmail } = require("../services/emailService");
const bcrypt = require("bcryptjs");
const { normalizarIdioma } = require("../utils/i18n");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textosRegistroSaas(idiomaValor) {
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      volverRegistro: "Volver al registro",
      faltanTitulo: "Faltan datos",
      faltanMensaje: "Para crear la prueba gratuita necesitas restaurante, propietario, email y contraseña.",
      passwordTitulo: "Contraseña demasiado corta",
      passwordMensaje: "La contraseña debe tener al menos 4 caracteres.",
      errorTitulo: "Error",
      errorEmail: "No se pudo comprobar el email.",
      emailExisteTitulo: "Email ya registrado",
      emailExisteMensaje: "Ya existe una cuenta con ese email. Prueba a iniciar sesión.",
      promoTitulo: "Código promocional no válido",
      promoMensaje: "Revisa el código promocional o deja el campo vacío.",
      errorRestaurante: "No se pudo crear el restaurante.",
      errorUsuario: "No se pudo crear el usuario.",
      emailSubject: "Prueba gratuita iniciada - Restaurant Service POS",
      emailTitulo: "Tu prueba de Restaurant Service POS está activa",
      saludo: "Hola",
      restaurantePrefijo: "tu restaurante",
      restauranteSufijo: "ya está creado.",
      estado: "Estado",
      finPrueba: "Fin de prueba",
      promocion: "Promoción aplicada",
      accesoTexto: "Puedes entrar al POS desde este enlace:",
      accesoBoton: "Entrar al POS",
      cuentaNoCreada: "Si no has creado esta cuenta, responde a este email para revisarlo.",
      gratisVida: "Acceso gratis de por vida",
      diasPrueba: "días de prueba gratuita",
      sinCaducidad: "Sin fecha de caducidad",
      noAplicada: "No aplicada",
      restaurante: "Restaurante",
      entrar: "Entrar",
      suscripcion: "Suscripción"
    },

    it: {
      volverRegistro: "Torna alla registrazione",
      faltanTitulo: "Dati mancanti",
      faltanMensaje: "Per creare la prova gratuita servono nome del ristorante, proprietario, email e password.",
      passwordTitulo: "Password troppo corta",
      passwordMensaje: "La password deve contenere almeno 4 caratteri.",
      errorTitulo: "Errore",
      errorEmail: "Non è stato possibile verificare l'email.",
      emailExisteTitulo: "Email già registrata",
      emailExisteMensaje: "Esiste già un account con questa email. Prova ad accedere.",
      promoTitulo: "Codice promozionale non valido",
      promoMensaje: "Controlla il codice promozionale oppure lascia il campo vuoto.",
      errorRestaurante: "Non è stato possibile creare il ristorante.",
      errorUsuario: "Non è stato possibile creare l'utente.",
      emailSubject: "Prova gratuita attivata - Restaurant Service POS",
      emailTitulo: "La tua prova di Restaurant Service POS è attiva",
      saludo: "Ciao",
      restaurantePrefijo: "il tuo ristorante",
      restauranteSufijo: "è stato creato.",
      estado: "Stato",
      finPrueba: "Fine prova",
      promocion: "Promozione applicata",
      accesoTexto: "Puoi accedere al POS da questo link:",
      accesoBoton: "Accedi al POS",
      cuentaNoCreada: "Se non hai creato questo account, rispondi a questa email per una verifica.",
      gratisVida: "Accesso gratuito a vita",
      diasPrueba: "giorni di prova gratuita",
      sinCaducidad: "Senza scadenza",
      noAplicada: "Nessuna",
      restaurante: "Ristorante",
      entrar: "Accedi",
      suscripcion: "Abbonamento"
    },

    en: {
      volverRegistro: "Back to registration",
      faltanTitulo: "Missing information",
      faltanMensaje: "To start the free trial you need a restaurant name, owner, email and password.",
      passwordTitulo: "Password too short",
      passwordMensaje: "The password must contain at least 4 characters.",
      errorTitulo: "Error",
      errorEmail: "The email address could not be checked.",
      emailExisteTitulo: "Email already registered",
      emailExisteMensaje: "An account with this email already exists. Try signing in.",
      promoTitulo: "Invalid promotional code",
      promoMensaje: "Check the promotional code or leave the field empty.",
      errorRestaurante: "The restaurant could not be created.",
      errorUsuario: "The user could not be created.",
      emailSubject: "Free trial started - Restaurant Service POS",
      emailTitulo: "Your Restaurant Service POS trial is active",
      saludo: "Hello",
      restaurantePrefijo: "your restaurant",
      restauranteSufijo: "has been created.",
      estado: "Status",
      finPrueba: "Trial end",
      promocion: "Promotion applied",
      accesoTexto: "You can access the POS from this link:",
      accesoBoton: "Sign in to the POS",
      cuentaNoCreada: "If you did not create this account, reply to this email so we can review it.",
      gratisVida: "Free lifetime access",
      diasPrueba: "days of free trial",
      sinCaducidad: "No expiration date",
      noAplicada: "Not applied",
      restaurante: "Restaurant",
      entrar: "Sign in",
      suscripcion: "Subscription"
    }
  };

  return Object.assign({ idioma: idioma }, textos[idioma] || textos.es);
}

function renderError(titulo, mensaje, idiomaValor) {
  const t = textosRegistroSaas(idiomaValor);

  return `<!doctype html>
<html lang="${escapar(t.idioma)}">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)} - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{
      margin:0;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#f3f4f6;
      font-family:Arial, Helvetica, sans-serif;
      color:#111827;
      padding:20px;
    }
    .card{
      width:100%;
      max-width:560px;
      background:white;
      border:1px solid #e5e7eb;
      border-radius:22px;
      padding:28px;
      box-shadow:0 18px 45px rgba(15,23,42,.12);
    }
    h1{
      margin:0 0 10px;
      color:#991b1b;
      font-size:26px;
    }
    p{
      color:#374151;
      line-height:1.55;
    }
    a{
      display:inline-block;
      margin-top:12px;
      background:#111827;
      color:white;
      text-decoration:none;
      padding:12px 16px;
      border-radius:12px;
      font-weight:900;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapar(titulo)}</h1>
    <p>${escapar(mensaje)}</p>
    <a href="/registro?idioma=${encodeURIComponent(t.idioma)}">${escapar(t.volverRegistro)}</a>
  </div>
</body>
</html>`;
}

function columnExists(db, table, column, callback) {
  db.all("PRAGMA table_info(" + table + ")", [], function(err, rows) {
    if (err) return callback(false);

    const exists = (rows || []).some(function(row) {
      return row.name === column;
    });

    callback(exists);
  });
}

function insertUsuario(db, datos, callback) {
  columnExists(db, "usuarios", "restaurante_id", function(tieneRestauranteId) {
    const columnas = ["nombre", "email", "password", "rol", "activo"];
    const valores = [datos.propietario, datos.email, datos.passwordHash, "admin", 1];

    if (tieneRestauranteId) {
      columnas.push("restaurante_id");
      valores.push(datos.restauranteId);
    }

    const sql =
      "INSERT INTO usuarios (" +
      columnas.join(",") +
      ") VALUES (" +
      columnas.map(function() { return "?"; }).join(",") +
      ")";

    db.run(sql, valores, function(err) {
      if (err) return callback(err);
      callback(null, this.lastID);
    });
  });
}

function crearConfigRestaurante(db, datos, callback) {
  columnExists(db, "configurazione", "restaurante_id", function(tieneRestauranteId) {
    const columnas = [
      "nome_ristorante",
      "propietario_nombre",
      "propietario_email",
      "propietario_telefono",
      "email",
      "telefono",
      "suscripcion_estado",
      "trial_inicio",
      "trial_fin",
      "plan_tipo",
      "promocion_aplicada"
    ];

    const valores = [
      datos.restaurante,
      datos.propietario,
      datos.email,
      datos.telefono,
      datos.email,
      datos.telefono,
      datos.suscripcionEstado || "trial",
      datos.trialInicio,
      datos.trialFin,
      datos.planTipo || "trial",
      datos.promocionAplicada || "ninguna"
    ];

    if (tieneRestauranteId) {
      columnas.push("restaurante_id");
      valores.push(datos.restauranteId);
    }

    const sql =
      "INSERT INTO configurazione (" +
      columnas.join(",") +
      ") VALUES (" +
      columnas.map(function() { return "?"; }).join(",") +
      ")";

    db.run(sql, valores, function(err) {
      if (err) {
        console.error("[registroSaas] No se pudo crear configurazione del restaurante:", err.message);
      }

      callback(null);
    });
  });
}

function crearCreadorCliente(db, datos, usuarioId, callback) {
  db.run(
    `INSERT INTO creador_clientes (
      nombre_restaurante,
      propietario_nombre,
      propietario_email,
      propietario_telefono,
      usuario_id,
      suscripcion_estado,
      trial_inicio,
      trial_fin,
      plan_tipo,
      promocion_aplicada,
      origen,
      precio_mensual,
      moneda
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'registro_saas', 7.50, 'EUR')`,
    [
      datos.restaurante,
      datos.propietario,
      datos.email,
      datos.telefono,
      usuarioId,
      datos.suscripcionEstado || "trial",
      datos.trialInicio,
      datos.trialFin,
      datos.planTipo || "trial",
      datos.promocionAplicada || "ninguna"
    ],
    function(err) {
      if (err) {
        console.error("[registroSaas] No se pudo crear creador_clientes:", err.message);
      }

      callback(null);
    }
  );
}


function escaparEmailRegistroSaas(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fechaEmailRegistroSaas(valor, idiomaValor) {
  if (!valor) return "-";

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  const idioma = normalizarIdioma(idiomaValor);
  const locales = {
    es: "es-ES",
    it: "it-IT",
    en: "en-GB"
  };

  return fecha.toLocaleDateString(locales[idioma] || "es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function baseUrlRegistroSaas() {
  return String(process.env.APP_BASE_URL || "https://restaurantservicepos.com").replace(/\/+$/, "");
}

function enviarEmailsRegistroSaas(datos) {
  const baseUrl = baseUrlRegistroSaas();
  const idioma = normalizarIdioma(datos.idioma);
  const t = textosRegistroSaas(idioma);

  const loginUrl = baseUrl + "/login?idioma=" + encodeURIComponent(idioma);
  const suscripcionUrl = baseUrl + "/configuracion-suscripcion";

  const promocionCliente =
    datos.promocionAplicada && datos.promocionAplicada !== "ninguna"
      ? datos.promocionAplicada
      : t.noAplicada;

  const diasTextoCliente =
    datos.suscripcionEstado === "gratis_vida"
      ? t.gratisVida
      : String(Number(datos.diasPrueba || 7)) + " " + t.diasPrueba;

  const fechaFinCliente =
    datos.suscripcionEstado === "gratis_vida"
      ? t.sinCaducidad
      : fechaEmailRegistroSaas(datos.trialFin, idioma);

  const htmlCliente = [
    '<div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#111827;">',
    '<div style="max-width:620px;margin:auto;background:white;border-radius:18px;padding:26px;border:1px solid #e5e7eb;">',
    '<h1 style="margin:0 0 12px;font-size:26px;">' + escaparEmailRegistroSaas(t.emailTitulo) + '</h1>',
    '<p style="font-size:16px;line-height:1.5;">' +
      escaparEmailRegistroSaas(t.saludo) + ' ' +
      escaparEmailRegistroSaas(datos.propietario) + ', ' +
      escaparEmailRegistroSaas(t.restaurantePrefijo) + ' <strong>' +
      escaparEmailRegistroSaas(datos.restaurante) + '</strong> ' +
      escaparEmailRegistroSaas(t.restauranteSufijo) + '</p>',
    '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin:18px 0;">',
    '<p style="margin:0 0 8px;"><strong>' + escaparEmailRegistroSaas(t.estado) + ':</strong> ' + escaparEmailRegistroSaas(diasTextoCliente) + '</p>',
    '<p style="margin:0 0 8px;"><strong>' + escaparEmailRegistroSaas(t.finPrueba) + ':</strong> ' + escaparEmailRegistroSaas(fechaFinCliente) + '</p>',
    '<p style="margin:0;"><strong>' + escaparEmailRegistroSaas(t.promocion) + ':</strong> ' + escaparEmailRegistroSaas(promocionCliente) + '</p>',
    '</div>',
    '<p style="font-size:16px;line-height:1.5;">' + escaparEmailRegistroSaas(t.accesoTexto) + '</p>',
    '<p><a href="' + escaparEmailRegistroSaas(loginUrl) + '" style="display:inline-block;background:#f97316;color:#111827;text-decoration:none;font-weight:900;padding:12px 18px;border-radius:999px;">' + escaparEmailRegistroSaas(t.accesoBoton) + '</a></p>',
    '<p style="font-size:13px;color:#64748b;margin-top:22px;">' + escaparEmailRegistroSaas(t.cuentaNoCreada) + '</p>',
    '</div>',
    '</div>'
  ].join("");

  const textCliente = [
    t.emailTitulo + ".",
    "",
    t.restaurante + ": " + datos.restaurante,
    t.estado + ": " + diasTextoCliente,
    t.finPrueba + ": " + fechaFinCliente,
    t.promocion + ": " + promocionCliente,
    "",
    t.entrar + ": " + loginUrl,
    t.suscripcion + ": " + suscripcionUrl
  ].join("\n");

  enviarEmail({
    to: datos.email,
    subject: t.emailSubject,
    html: htmlCliente,
    text: textCliente,
    tipo: "registro_saas_cliente"
  }, function(err, resultado) {
    if (err) {
      console.error("[EMAIL REGISTRO CLIENTE]", err.message);
      return;
    }

    console.log(
      "[EMAIL REGISTRO CLIENTE]",
      resultado && resultado.modo ? resultado.modo : "ok"
    );
  });

  /* La notifica interna al creatore resta intenzionalmente in spagnolo. */
  const promocionAdmin =
    datos.promocionAplicada && datos.promocionAplicada !== "ninguna"
      ? datos.promocionAplicada
      : "No aplicada";

  const diasTextoAdmin =
    datos.suscripcionEstado === "gratis_vida"
      ? "Acceso gratis de por vida"
      : String(Number(datos.diasPrueba || 7)) + " días de prueba gratuita";

  const fechaFinAdmin =
    datos.suscripcionEstado === "gratis_vida"
      ? "Sin fecha de caducidad"
      : fechaEmailRegistroSaas(datos.trialFin, "es");

  const adminTo =
    process.env.LEGAL_EMAIL ||
    process.env.EMAIL_REPLY_TO ||
    "info@restaurantservicepos.com";

  const htmlAdmin = [
    '<div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#111827;">',
    '<div style="max-width:620px;margin:auto;background:white;border-radius:18px;padding:26px;border:1px solid #e5e7eb;">',
    '<h1 style="margin:0 0 12px;font-size:24px;">Nuevo restaurante registrado</h1>',
    '<p><strong>Restaurante:</strong> ' + escaparEmailRegistroSaas(datos.restaurante) + '</p>',
    '<p><strong>Propietario:</strong> ' + escaparEmailRegistroSaas(datos.propietario) + '</p>',
    '<p><strong>Email:</strong> ' + escaparEmailRegistroSaas(datos.email) + '</p>',
    '<p><strong>Estado:</strong> ' + escaparEmailRegistroSaas(datos.suscripcionEstado || "trial") + '</p>',
    '<p><strong>Promoción:</strong> ' + escaparEmailRegistroSaas(promocionAdmin) + '</p>',
    '<p><strong>Días prueba:</strong> ' + escaparEmailRegistroSaas(diasTextoAdmin) + '</p>',
    '<p><strong>Fin prueba:</strong> ' + escaparEmailRegistroSaas(fechaFinAdmin) + '</p>',
    '</div>',
    '</div>'
  ].join("");

  const textAdmin = [
    "Nuevo restaurante registrado",
    "",
    "Restaurante: " + datos.restaurante,
    "Propietario: " + datos.propietario,
    "Email: " + datos.email,
    "Estado: " + (datos.suscripcionEstado || "trial"),
    "Promoción: " + promocionAdmin,
    "Días prueba: " + diasTextoAdmin,
    "Fin prueba: " + fechaFinAdmin
  ].join("\n");

  enviarEmail({
    to: adminTo,
    subject: "Nuevo restaurante registrado - " + datos.restaurante,
    html: htmlAdmin,
    text: textAdmin,
    tipo: "registro_saas_admin"
  }, function(err, resultado) {
    if (err) {
      console.error("[EMAIL REGISTRO ADMIN]", err.message);
      return;
    }

    console.log(
      "[EMAIL REGISTRO ADMIN]",
      resultado && resultado.modo ? resultado.modo : "ok"
    );
  });
}

module.exports = function registroSaasMiddleware(db) {
  return function(req, res, next) {
    if (req.method !== "POST" || req.path !== "/registro") {
      return next();
    }

    const datos = {
      restaurante: String(req.body.nombre_restaurante || req.body.restaurante || "").trim(),
      propietario: String(req.body.nombre_propietario || req.body.propietario || req.body.nombre || "").trim(),
      email: String(req.body.email || "").trim().toLowerCase(),
      password: String(req.body.password || ""),
      telefono: String(req.body.telefono || "").trim(),
      promo: String(req.body.codigo_promocional || req.body.promo || "").trim(),
      idioma: normalizarIdioma(req.body.idioma)
    };

    const textos = textosRegistroSaas(datos.idioma);

    if (!datos.restaurante || !datos.propietario || !datos.email || !datos.password) {
      return res.status(400).send(renderError(
        textos.faltanTitulo,
        textos.faltanMensaje,
        datos.idioma
      ));
    }

    if (datos.password.length < 4) {
      return res.status(400).send(renderError(
        textos.passwordTitulo,
        textos.passwordMensaje,
        datos.idioma
      ));
    }

    db.get(
      "SELECT id FROM usuarios WHERE lower(email)=lower(?) LIMIT 1",
      [datos.email],
      function(errEmail, existente) {
        if (errEmail) {
          console.error("[registroSaas] Error comprobando email:", errEmail.message);
          return res.status(500).send(renderError(
            textos.errorTitulo,
            textos.errorEmail,
            datos.idioma
          ));
        }

        if (existente) {
          return res.status(409).send(renderError(
            textos.emailExisteTitulo,
            textos.emailExisteMensaje,
            datos.idioma
          ));
        }

        const promo = datos.promo ? validarCodigoPromocional(datos.promo) : null;

        if (datos.promo && !promo) {
          return res.status(400).send(renderError(
            textos.promoTitulo,
            textos.promoMensaje,
            datos.idioma
          ));
        }

        let diasPrueba = 7;
        let suscripcionEstado = "trial";
        let planTipo = "trial";
        let promocionAplicada = promo ? promo.codigo : "ninguna";

        if (promo && promo.tipo === "trial_extra") {
          diasPrueba += Number(promo.dias_extra || 0);
        }

        if (promo && promo.tipo === "gratis_vida") {
          suscripcionEstado = "gratis_vida";
          planTipo = "gratis_vida";
        }

        const ahora = new Date();
        const trialFin = suscripcionEstado === "gratis_vida"
          ? null
          : new Date(ahora.getTime() + diasPrueba * 24 * 60 * 60 * 1000);

        datos.trialInicio = ahora.toISOString();
        datos.trialFin = trialFin ? trialFin.toISOString() : null;
        datos.suscripcionEstado = suscripcionEstado;
        datos.planTipo = planTipo;
        datos.promocionAplicada = promocionAplicada;
        datos.diasPrueba = diasPrueba;

        db.run(
          `INSERT INTO restaurantes (
            nombre,
            propietario_nombre,
            propietario_email,
            propietario_telefono,
            estado,
            trial_inicio,
            trial_fin,
            plan_tipo,
            promocion_aplicada,
            idioma
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            datos.restaurante,
            datos.propietario,
            datos.email,
            datos.telefono,
            datos.suscripcionEstado || "trial",
            datos.trialInicio,
            datos.trialFin,
            datos.planTipo || "trial",
            datos.promocionAplicada || "ninguna",
            datos.idioma
          ],
          function(errRestaurante) {
            if (errRestaurante) {
              console.error("[registroSaas] Error creando restaurante:", errRestaurante.message);
              return res.status(500).send(renderError(
                textos.errorTitulo,
                textos.errorRestaurante,
                datos.idioma
              ));
            }

            datos.restauranteId = this.lastID;
            datos.passwordHash = bcrypt.hashSync(datos.password, 10);

            insertUsuario(db, datos, function(errUsuario, usuarioId) {
              if (errUsuario) {
                console.error("[registroSaas] Error creando usuario:", errUsuario.message);
                return res.status(500).send(renderError(
                  textos.errorTitulo,
                  textos.errorUsuario,
                  datos.idioma
                ));
              }

              crearConfigRestaurante(db, datos, function() {
                crearCreadorCliente(db, datos, usuarioId, function() {
                  req.session.usuario = {
                    id: usuarioId,
                    nombre: datos.propietario,
                    email: datos.email,
                    rol: "admin",
                    activo: 1,
                    restaurante_id: datos.restauranteId,
                    idioma: datos.idioma
                  };

                  req.session.restaurante_id = datos.restauranteId;
                  req.session.idioma = datos.idioma;

                  enviarEmailsRegistroSaas(datos);

                  return res.redirect("/primeros-pasos");
                });
              });
            });
          }
        );
      }
    );
  };
};
