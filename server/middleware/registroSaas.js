const bcrypt = require("bcryptjs");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderError(titulo, mensaje) {
  return `<!doctype html>
<html lang="es">
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
    <a href="/registro">Volver al registro</a>
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
      "trial",
      datos.trialInicio,
      datos.trialFin,
      "trial",
      datos.promo
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
    ) VALUES (?, ?, ?, ?, ?, 'trial', ?, ?, 'trial', ?, 'registro_saas', 7.50, 'EUR')`,
    [
      datos.restaurante,
      datos.propietario,
      datos.email,
      datos.telefono,
      usuarioId,
      datos.trialInicio,
      datos.trialFin,
      datos.promo
    ],
    function(err) {
      if (err) {
        console.error("[registroSaas] No se pudo crear creador_clientes:", err.message);
      }

      callback(null);
    }
  );
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
      promo: String(req.body.codigo_promocional || req.body.promo || "").trim()
    };

    if (!datos.restaurante || !datos.propietario || !datos.email || !datos.password) {
      return res.status(400).send(renderError(
        "Faltan datos",
        "Para crear la prueba gratuita necesitas restaurante, propietario, email y contraseña."
      ));
    }

    if (datos.password.length < 4) {
      return res.status(400).send(renderError(
        "Contraseña demasiado corta",
        "La contraseña debe tener al menos 4 caracteres."
      ));
    }

    db.get(
      "SELECT id FROM usuarios WHERE lower(email)=lower(?) LIMIT 1",
      [datos.email],
      function(errEmail, existente) {
        if (errEmail) {
          console.error("[registroSaas] Error comprobando email:", errEmail.message);
          return res.status(500).send(renderError("Error", "No se pudo comprobar el email."));
        }

        if (existente) {
          return res.status(409).send(renderError(
            "Email ya registrado",
            "Ya existe una cuenta con ese email. Prueba a iniciar sesión."
          ));
        }

        const ahora = new Date();
        const trialFin = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        datos.trialInicio = ahora.toISOString();
        datos.trialFin = trialFin.toISOString();

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
            promocion_aplicada
          ) VALUES (?, ?, ?, ?, 'trial', ?, ?, 'trial', ?)`,
          [
            datos.restaurante,
            datos.propietario,
            datos.email,
            datos.telefono,
            datos.trialInicio,
            datos.trialFin,
            datos.promo
          ],
          function(errRestaurante) {
            if (errRestaurante) {
              console.error("[registroSaas] Error creando restaurante:", errRestaurante.message);
              return res.status(500).send(renderError("Error", "No se pudo crear el restaurante."));
            }

            datos.restauranteId = this.lastID;
            datos.passwordHash = bcrypt.hashSync(datos.password, 10);

            insertUsuario(db, datos, function(errUsuario, usuarioId) {
              if (errUsuario) {
                console.error("[registroSaas] Error creando usuario:", errUsuario.message);
                return res.status(500).send(renderError("Error", "No se pudo crear el usuario."));
              }

              crearConfigRestaurante(db, datos, function() {
                crearCreadorCliente(db, datos, usuarioId, function() {
                  req.session.usuario = {
                    id: usuarioId,
                    nombre: datos.propietario,
                    email: datos.email,
                    rol: "admin",
                    activo: 1,
                    restaurante_id: datos.restauranteId
                  };

                  req.session.restaurante_id = datos.restauranteId;

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
