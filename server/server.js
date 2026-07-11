require("dotenv").config();
const centroImpresionRoutes = require("./routes/centroImpresion");
const posPedidoRoutes = require("./routes/posPedido");
const configuracionPrincipalRoutes = require("./routes/configuracionPrincipal");
const panelSuscripcionRoutes = require("./routes/panelSuscripcion");
const stripeSuscripcionRoutes = require("./routes/stripeSuscripcion");
const stripeWebhookRoutes = require("./routes/stripeWebhook");
const activacionSuscripcionRoutes = require("./routes/activacionSuscripcion");
const { middlewareSuscripcion, renderPagoRequerido, renderPagoOnlinePendiente } = require("./suscripcion");
const { validarCodigoPromocional } = require("./promoCodes");
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const session = require("express-session");
const { generarTicketHTML } = require("./printing/ticketGenerator");
const { requiereLogin, requiereRol } = require("./middleware/auth");
const permisosProfesionales = require("./middleware/permisosProfesionales");
const productosRoutes = require("./routes/productos");
const barRoutes = require("./routes/bar");
const configurazioneRoutes = require("./routes/configurazione");
const cocinaRoutes = require("./routes/cocina");
const zonasRoutes = require("./routes/zonas");
const pagosRoutes = require("./routes/pagos");
const cajaProfesionalRoutes = require("./routes/cajaProfesional");
const mobileCamareroRoutes = require("./routes/mobileCamarero");
const estadoMesasRealRoutes = require("./routes/estadoMesasReal");
const cajaRoutes = require("./routes/caja");
const adminProductosRoutes = require("./routes/adminProductos");
const categoriasRoutes = require("./routes/categorias");
const variantesRoutes = require("./routes/variantes");
const modificadoresRoutes = require("./routes/modificadores");
const usuariosRoutes = require("./routes/usuarios");
const creadorRoutes = require("./routes/creador");
const productoRoutes = require("./routes/producto");
const menuRoutes = require("./routes/menu");
const posRoutes = require("./routes/pos");
const pagosMultiplesRoutes = require("./routes/pagos-multiples");
const mesasRoutes = require("./routes/mesas");
const ticketRoutes = require("./routes/ticket");

const app = express();
app.use(session({
secret: "restaurant-service-secret",
resave: false,
saveUninitialized: false
}));

// Proteccion POS V2: sin login no se puede entrar al POS
app.use('/app/v2', (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.redirect('/login');
  }

  const rol = String(req.session.usuario.rol || '').toLowerCase();

  if (req.path.startsWith('/mobile')) {
    if (['admin','gerente','camarero'].includes(rol)) {
      return next();
    }

    return res.status(403).send('Acceso no autorizado');
  }

  if (['admin','gerente'].includes(rol)) {
    return next();
  }

  if (rol === 'camarero') {
    return res.redirect('/camarero');
  }

  return res.status(403).send('Acceso no autorizado');
});

app.use('/app', express.static(path.join(__dirname, '..', 'app')));

app.use(cors({ origin: true, credentials: true }));

app.use("/stripe/webhook", express.raw({ type: "application/json" }), function(req, res, next){
  return stripeWebhookRoutes(db)(req, res, next);
});

app.use(express.json());

app.use('/app/assets', express.static(path.join(__dirname, '..', 'app', 'assets')));
app.use(express.urlencoded({ extended: true }));
app.use(permisosProfesionales());
app.get("/camarero", (req, res) => {
  res.redirect("/app/v2/mobile/index.html");
});

app.get("/movil", (req, res) => {
  res.redirect("/app/v2/mobile/index.html");
});


const db = new sqlite3.Database(
  path.join(__dirname, '..', 'database', 'restaurant_service.db')
);

app.use(stripeSuscripcionRoutes(db));
app.use(middlewareSuscripcion(db));
app.use(configuracionPrincipalRoutes());
app.use(activacionSuscripcionRoutes(db));
app.use(panelSuscripcionRoutes(db));

app.use(centroImpresionRoutes(db));
app.use(configurazioneRoutes(db));
app.use(zonasRoutes(db));
app.use(pagosRoutes(db));
app.use(mobileCamareroRoutes(db));
app.use(estadoMesasRealRoutes(db));
app.use(cajaProfesionalRoutes(db));
app.use(cajaRoutes(db));
app.use(mesasRoutes(db));
app.use(posPedidoRoutes(db));
app.use(ticketRoutes(db));
app.use(adminProductosRoutes(db));
app.use(posRoutes(db));
app.use(pagosMultiplesRoutes(db));
app.use(menuRoutes(db));
app.use(productoRoutes(db));
app.use(usuariosRoutes(db));
app.use(creadorRoutes(db));
app.use(modificadoresRoutes(db));
app.use(variantesRoutes(db));
app.use(categoriasRoutes(db));
app.use(productosRoutes(db));
app.use(barRoutes(db));
app.use(cocinaRoutes(db));

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Restaurant Service POS - Acceso</title>
<style>
*{
box-sizing:border-box;
}

body{
margin:0;
min-height:100vh;
font-family:Arial,sans-serif;
background:#0f172a;
color:white;
}

.pagina{
min-height:100vh;
display:grid;
grid-template-columns:minmax(0,1fr) 460px;
}

.zona-foto{
min-height:100vh;
background:#0f172a;
display:flex;
align-items:center;
justify-content:center;
padding:6px;
overflow:hidden;
}

.zona-foto img{
width:108%;
height:108%;
max-height:none;
object-fit:contain;
object-position:center center;
display:block;
}

.panel-derecho{
min-height:100vh;
background:#0f172a;
padding:32px;
display:flex;
flex-direction:column;
justify-content:center;
gap:18px;
box-shadow:-18px 0 45px rgba(0,0,0,.25);
}

.login-card,
.publicidad-card{
background:rgba(255,255,255,.96);
color:#111827;
border-radius:24px;
padding:24px;
box-shadow:0 20px 55px rgba(0,0,0,.28);
}

.logo-mini{
display:inline-flex;
align-items:center;
gap:8px;
background:#eff6ff;
color:#1d4ed8;
border-radius:999px;
padding:8px 12px;
font-weight:900;
font-size:13px;
margin-bottom:14px;
}

.login-card h2,
.publicidad-card h2{
margin:0;
font-size:28px;
letter-spacing:-.5px;
}

.login-card .subtitulo,
.publicidad-card p{
margin:8px 0 18px 0;
color:#64748b;
font-weight:700;
line-height:1.42;
}

label{
display:block;
font-size:13px;
font-weight:900;
color:#475569;
margin-bottom:7px;
}

input{
width:100%;
border:1px solid #cbd5e1;
border-radius:14px;
padding:13px;
font-size:15px;
background:white;
margin-bottom:13px;
}

button{
width:100%;
border:none;
border-radius:15px;
padding:14px;
font-weight:900;
font-size:15px;
cursor:pointer;
background:#16a34a;
color:white;
box-shadow:0 10px 22px rgba(22,163,74,.25);
}

button:hover{
background:#15803d;
}

.crear{
display:block;
text-align:center;
margin-top:12px;
padding:13px;
border-radius:15px;
background:#111827;
color:white;
text-decoration:none;
font-weight:900;
}

.crear:hover{
background:#000;
}

.lista{
display:grid;
grid-template-columns:1fr 1fr;
gap:10px;
margin-top:16px;
}

.item{
background:#f8fafc;
border:1px solid #e2e8f0;
border-radius:14px;
padding:12px;
font-weight:900;
font-size:14px;
color:#111827;
}

.prueba{
background:#ecfdf5;
border:1px solid #bbf7d0;
border-radius:16px;
padding:13px;
color:#166534;
font-weight:900;
font-size:14px;
line-height:1.4;
margin-top:16px;
}

.footer-mini{
font-size:12px;
font-weight:800;
color:#94a3b8;
text-align:center;
margin-top:4px;
line-height:1.55;
}

.footer-mini a{
color:#cbd5e1;
text-decoration:none;
}

.footer-mini a:hover{
color:white;
text-decoration:underline;
}

@media(max-width:950px){
.pagina{
grid-template-columns:1fr;
}

.zona-foto{
display:none;
}

.panel-derecho{
padding:20px;
}

.login-card,
.publicidad-card{
border-radius:20px;
}

.lista{
grid-template-columns:1fr;
}
}
</style>
</head>

<body>

<div class="pagina">

<div class="zona-foto">
<img src="/app/assets/login-restaurant-service.png" alt="Restaurant Service POS">
</div>

<div class="panel-derecho">

<section class="login-card">

<div class="logo-mini">🍽️ Restaurant Service POS</div>

<h2>Acceso</h2>
<p class="subtitulo">
Entra con tu usuario para continuar.
</p>

<form method="POST" action="/login">

<label>Email</label>
<input name="email" type="email" placeholder="tu@email.com" required>

<label>Contraseña</label>
<input name="password" type="password" placeholder="Contraseña" required>

<button type="submit">Entrar al POS</button>

</form>

<a class="crear" href="/registro">Crear cuenta nueva</a>

</section>

<section class="publicidad-card">

<h2>Gestiona tu restaurante</h2>

<p>
Un POS pensado para restaurantes reales: mesas, comandas, tickets, pagos y caja desde una sola herramienta.
</p>

<div class="lista">
<div class="item">✅ Mesas y salas</div>
<div class="item">✅ Comandas</div>
<div class="item">✅ Tickets</div>
<div class="item">✅ Caja diaria</div>
</div>

<div class="prueba">
Prueba gratuita durante 7 días. Si tienes un código promocional, podrás introducirlo durante el registro.
</div>

</section>

<div class="footer-mini">
© 2026 Restaurant Service POS™. Todos los derechos reservados.
<br>
<a href="/aviso-legal">Aviso legal</a> ·
<a href="/privacidad">Privacidad</a> ·
<a href="/cookies">Cookies</a> ·
<a href="/terminos">Términos</a>
</div>

</div>

</div>

</body>
</html>
  `);
});


function escapeHtmlRegistro(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderRegistroPropietario(error, valores) {
  const v = valores || {};
  const errorHtml = error
    ? '<div class="error">' + escapeHtmlRegistro(error) + '</div>'
    : '';

  return [
    '<!DOCTYPE html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="UTF-8">',
    '<title>Crear cuenta - Restaurant Service POS</title>',
    '<style>',
    '*{box-sizing:border-box;}',
    'body{margin:0;min-height:100vh;font-family:Arial,sans-serif;background:#0f172a;color:#111827;padding:28px;}',
    '.card{max-width:720px;margin:35px auto;background:white;border-radius:26px;padding:32px;box-shadow:0 22px 60px rgba(0,0,0,.28);}',
    '.marca{display:inline-flex;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:8px 12px;font-weight:900;font-size:13px;margin-bottom:16px;}',
    'h1{margin:0;font-size:34px;letter-spacing:-.7px;}',
    '.intro{color:#64748b;font-size:16px;line-height:1.5;margin:10px 0 24px 0;font-weight:700;}',
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}',
    '.full{grid-column:1 / -1;}',
    'label{display:block;font-size:13px;font-weight:900;color:#475569;margin-bottom:7px;}',
    'input{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:14px;font-size:15px;background:white;}',
    '.nota{background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:14px;color:#166534;font-weight:900;line-height:1.45;margin:18px 0;}',
    '.error{background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:14px;color:#991b1b;font-weight:900;margin:0 0 18px 0;}',
    'button{width:100%;border:none;border-radius:16px;padding:15px;background:#16a34a;color:white;font-size:16px;font-weight:900;cursor:pointer;margin-top:18px;}',
    'button:hover{background:#15803d;}',
    '.volver{display:block;text-align:center;margin-top:14px;color:#111827;font-weight:900;text-decoration:none;}',
    '.legal{font-size:12px;color:#64748b;line-height:1.45;text-align:center;margin-top:18px;}',
    '@media(max-width:700px){.grid{grid-template-columns:1fr;}.full{grid-column:auto;}.card{padding:24px;margin:15px auto;}}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="card">',
    '<div class="marca">Restaurant Service POS</div>',
    '<h1>Crear cuenta del restaurante</h1>',
    '<p class="intro">Registra el restaurante y crea el usuario propietario. La cuenta empezará con prueba gratuita.</p>',
    errorHtml,
    '<form method="POST" action="/registro">',
    '<div class="grid">',
    '<div class="full">',
    '<label>Nombre del restaurante</label>',
    '<input name="nombre_restaurante" value="' + escapeHtmlRegistro(v.nombre_restaurante) + '" required>',
    '</div>',
    '<div>',
    '<label>Nombre del propietario</label>',
    '<input name="nombre_propietario" value="' + escapeHtmlRegistro(v.nombre_propietario) + '" required>',
    '</div>',
    '<div>',
    '<label>Teléfono</label>',
    '<input name="telefono" value="' + escapeHtmlRegistro(v.telefono) + '">',
    '</div>',
    '<div>',
    '<label>Email de acceso</label>',
    '<input name="email" type="email" value="' + escapeHtmlRegistro(v.email) + '" required>',
    '</div>',
    '<div>',
    '<label>Contraseña</label>',
    '<input name="password" type="password" required>',
    '</div>',
    '<div class="full">',
    '<label>Código promocional opcional</label>',
    '<input name="codigo_promocional" value="">',
    '</div>',
    '</div>',
    '<div class="nota">La prueba gratuita se activará automáticamente al crear la cuenta.</div>',
    '<button type="submit">Crear cuenta y activar prueba</button>',
    '</form>',
    '<a class="volver" href="/login">Volver al login</a>',
    '<div class="legal">© 2026 Restaurant Service POS™. Todos los derechos reservados.</div>',
    '</div>',
    '</body>',
    '</html>'
  ].join('\n');
}

function renderRegistroCreado(email, estado) {
  const mensajePlan = estado === "gratis_vida"
    ? "Cuenta creada con plan especial activado."
    : "Cuenta creada con prueba gratuita activada.";

  return [
    '<!DOCTYPE html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="UTF-8">',
    '<title>Cuenta creada - Restaurant Service POS</title>',
    '<style>',
    'body{margin:0;font-family:Arial,sans-serif;background:#0f172a;color:#111827;padding:30px;}',
    '.card{max-width:620px;margin:80px auto;background:white;border-radius:26px;padding:34px;box-shadow:0 22px 60px rgba(0,0,0,.28);text-align:center;}',
    'h1{margin-top:0;font-size:34px;}',
    'p{color:#475569;font-size:17px;line-height:1.5;font-weight:700;}',
    '.ok{background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:16px;color:#166534;font-weight:900;margin:20px 0;}',
    'a{display:inline-flex;background:#16a34a;color:white;border-radius:15px;padding:14px 20px;text-decoration:none;font-weight:900;margin-top:12px;}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="card">',
    '<h1>Cuenta creada</h1>',
    '<div class="ok">' + escapeHtmlRegistro(mensajePlan) + '</div>',
    '<p>Ya puedes iniciar sesión con el email:</p>',
    '<p><strong>' + escapeHtmlRegistro(email) + '</strong></p>',
    '<a href="/login">Ir al login</a>',
    '</div>',
    '</body>',
    '</html>'
  ].join('\n');
}

function obtenerTablaConfiguracionRegistro(callback) {
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('configurazione','configuracion') ORDER BY CASE WHEN name='configurazione' THEN 0 ELSE 1 END LIMIT 1",
    [],
    (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(new Error("No existe tabla de configuracion"));
      callback(null, row.name);
    }
  );
}

function asegurarColumnasRegistro(callback) {
  obtenerTablaConfiguracionRegistro((err, tabla) => {
    if (err) return callback(err);

    db.all("PRAGMA table_info(" + tabla + ")", [], (err2, rows) => {
      if (err2) return callback(err2);

      const existentes = rows.map((r) => r.name);
      const necesarias = [
        ["suscripcion_estado", "TEXT DEFAULT 'activo'"],
        ["trial_inicio", "TEXT"],
        ["trial_fin", "TEXT"],
        ["plan_tipo", "TEXT"],
        ["propietario_nombre", "TEXT"],
        ["propietario_email", "TEXT"],
        ["propietario_telefono", "TEXT"],
        ["promocion_aplicada", "TEXT"]
      ];

      const pendientes = necesarias.filter((c) => !existentes.includes(c[0]));

      function siguiente() {
        if (pendientes.length === 0) return callback(null, tabla);

        const col = pendientes.shift();
        db.run("ALTER TABLE " + tabla + " ADD COLUMN " + col[0] + " " + col[1], [], (err3) => {
          if (err3 && !String(err3.message || "").includes("duplicate column name")) {
            return callback(err3);
          }
          siguiente();
        });
      }

      siguiente();
    });
  });
}

function crearUsuarioPropietarioRegistro(datos, callback) {
  db.all("PRAGMA table_info(usuarios)", [], (err, rows) => {
    if (err) return callback(err);

    const columnas = rows.map((r) => r.name);

    const mapa = {
      nombre: datos.nombre_propietario,
      email: datos.email,
      password: datos.password,
      rol: "admin",
      activo: 1
    };

    const cols = Object.keys(mapa).filter((c) => columnas.includes(c));

    if (!cols.includes("email") || !cols.includes("password") || !cols.includes("rol")) {
      return callback(new Error("La tabla usuarios no tiene las columnas necesarias"));
    }

    const sql = "INSERT INTO usuarios (" + cols.join(",") + ") VALUES (" + cols.map(() => "?").join(",") + ")";
    const params = cols.map((c) => mapa[c]);

    db.run(sql, params, callback);
  });
}

function actualizarConfiguracionRegistro(tabla, datos, callback) {
  db.get("SELECT id FROM " + tabla + " ORDER BY id LIMIT 1", [], (err, row) => {
    if (err) return callback(err);

    function continuar(id) {
      db.all("PRAGMA table_info(" + tabla + ")", [], (err2, rows) => {
        if (err2) return callback(err2);

        const columnas = rows.map((r) => r.name);

        const mapa = {
          nome_ristorante: datos.nombre_restaurante,
          nombre_restaurante: datos.nombre_restaurante,
          telefono: datos.telefono,
          email: datos.email,
          propietario_nombre: datos.nombre_propietario,
          propietario_email: datos.email,
          propietario_telefono: datos.telefono,
          suscripcion_estado: datos.suscripcion_estado,
          trial_inicio: datos.trial_inicio,
          trial_fin: datos.trial_fin,
          plan_tipo: datos.plan_tipo,
          promocion_aplicada: datos.promocion_aplicada
        };

        const cols = Object.keys(mapa).filter((c) => columnas.includes(c));

        if (cols.length === 0) return callback(null);

        const sql = "UPDATE " + tabla + " SET " + cols.map((c) => c + "=?").join(", ") + " WHERE id=?";
        const params = cols.map((c) => mapa[c]);
        params.push(id);

        db.run(sql, params, callback);
      });
    }

    if (row && row.id) {
      return continuar(row.id);
    }

    db.run("INSERT INTO " + tabla + " DEFAULT VALUES", [], function(err3) {
      if (err3) return callback(err3);
      continuar(this.lastID);
    });
  });
}

app.get('/registro', (req, res) => {
  res.send(renderRegistroPropietario(null, {}));
});

app.post('/registro', (req, res) => {
  const datos = {
    nombre_restaurante: String(req.body.nombre_restaurante || "").trim(),
    nombre_propietario: String(req.body.nombre_propietario || "").trim(),
    telefono: String(req.body.telefono || "").trim(),
    email: String(req.body.email || "").trim().toLowerCase(),
    password: String(req.body.password || ""),
    codigo_promocional: String(req.body.codigo_promocional || "").trim()
  };

  if (!datos.nombre_restaurante || !datos.nombre_propietario || !datos.email || !datos.password) {
    return res.send(renderRegistroPropietario("Completa los campos obligatorios.", datos));
  }

  if (datos.password.length < 4) {
    return res.send(renderRegistroPropietario("La contraseña debe tener al menos 4 caracteres.", datos));
  }

  let promo = null;

  if (datos.codigo_promocional) {
    promo = validarCodigoPromocional(datos.codigo_promocional);

    if (!promo) {
      return res.send(renderRegistroPropietario("Código promocional no válido.", datos));
    }
  }

  let diasPrueba = 7;
  let estado = "prueba";
  let planTipo = "trial";
  let promocionAplicada = promo ? String(promo.tipo || "promocion") : "ninguna";

  if (promo && promo.tipo === "trial_extra") {
    diasPrueba += Number(promo.dias_extra || 0);
  }

  if (promo && promo.tipo === "gratis_vida") {
    estado = "gratis_vida";
    planTipo = "gratis_vida";
  }

  const ahora = new Date();
  const finTrial = new Date(ahora.getTime() + diasPrueba * 24 * 60 * 60 * 1000);

  db.get("SELECT id FROM usuarios WHERE LOWER(email)=LOWER(?)", [datos.email], (err, existente) => {
    if (err) return res.send(renderRegistroPropietario("Error comprobando el email.", datos));

    if (existente) {
      return res.send(renderRegistroPropietario("Ya existe un usuario con ese email.", datos));
    }

    asegurarColumnasRegistro((err2, tablaConfig) => {
      if (err2) {
        return res.send(renderRegistroPropietario("Error preparando la configuración del restaurante.", datos));
      }

      crearUsuarioPropietarioRegistro(datos, (err3) => {
        if (err3) {
          return res.send(renderRegistroPropietario("Error creando el usuario propietario.", datos));
        }

        actualizarConfiguracionRegistro(tablaConfig, {
          nombre_restaurante: datos.nombre_restaurante,
          nombre_propietario: datos.nombre_propietario,
          telefono: datos.telefono,
          email: datos.email,
          suscripcion_estado: estado,
          trial_inicio: ahora.toISOString(),
          trial_fin: estado === "gratis_vida" ? null : finTrial.toISOString(),
          plan_tipo: planTipo,
          promocion_aplicada: promocionAplicada
        }, (err4) => {
          if (err4) {
            return res.send(renderRegistroPropietario("Usuario creado, pero hubo un error guardando la configuración.", datos));
          }

          res.send(renderRegistroCreado(datos.email, estado));
        });
      });
    });
  });
});


function paginaLegal(titulo, contenido) {
  return [
    '<!DOCTYPE html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="UTF-8">',
    '<title>' + titulo + ' - Restaurant Service POS</title>',
    '<style>',
    'body{margin:0;font-family:Arial,sans-serif;background:#eef2f7;color:#111827;padding:30px;}',
    '.card{max-width:850px;margin:45px auto;background:white;border-radius:24px;padding:34px;box-shadow:0 18px 45px rgba(15,23,42,.12);}',
    'h1{margin-top:0;font-size:34px;}',
    'p,li{color:#475569;font-size:16px;line-height:1.55;}',
    '.nota{background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:14px;color:#9a3412;font-weight:800;}',
    'a{display:inline-flex;background:#111827;color:white;border-radius:14px;padding:13px 17px;text-decoration:none;font-weight:900;margin-top:18px;}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="card">',
    '<h1>' + titulo + '</h1>',
    contenido,
    '<p class="nota">Documento provisional. Antes de vender el software debe completarse con los datos fiscales reales del titular, condiciones comerciales definitivas y revisión legal.</p>',
    '<a href="/login">Volver al login</a>',
    '</div>',
    '</body>',
    '</html>'
  ].join('\n');
}

app.get('/aviso-legal', (req, res) => {
  res.send(paginaLegal('Aviso legal',
    '<p>Restaurant Service POS es una herramienta de gestión para restaurantes.</p>' +
    '<p>Este apartado deberá incluir los datos identificativos del titular del software: nombre o razón social, NIF/CIF, domicilio, correo de contacto y datos mercantiles si corresponde.</p>' +
    '<p>© 2026 Restaurant Service POS™. Todos los derechos reservados.</p>'
  ));
});

app.get('/privacidad', (req, res) => {
  res.send(paginaLegal('Política de privacidad',
    '<p>Esta política explicará qué datos personales se recogen, con qué finalidad, durante cuánto tiempo se conservan y cómo puede el usuario ejercer sus derechos.</p>' +
    '<p>En próximas versiones se completará para cubrir registro de usuarios, datos del restaurante, facturación, prueba gratuita y soporte técnico.</p>'
  ));
});

app.get('/cookies', (req, res) => {
  res.send(paginaLegal('Política de cookies',
    '<p>Esta página indicará si el sistema utiliza cookies técnicas, cookies de sesión u otras tecnologías necesarias para el funcionamiento del login.</p>' +
    '<p>Si en el futuro se añaden analíticas, publicidad o herramientas externas, deberá solicitarse consentimiento cuando sea necesario.</p>'
  ));
});

app.get('/terminos', (req, res) => {
  res.send(paginaLegal('Términos y condiciones',
    '<p>Estos términos regularán el uso de Restaurant Service POS, la prueba gratuita, el precio mensual, la cancelación, las responsabilidades y las condiciones del servicio.</p>' +
    '<p>En próximas versiones se completará con el plan comercial definitivo, soporte, actualizaciones y política de pagos.</p>'
  ));
});




app.get('/pago-requerido', (req, res) => {
  res.send(renderPagoRequerido());
});


app.get('/pago-online-pendiente', (req, res) => {
  res.send(renderPagoOnlinePendiente());
});

app.post('/login', (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  db.get(
    'SELECT id, nombre, email, rol FROM usuarios WHERE email=? AND password=? AND activo=1',
    [email, password],
    (err, usuario) => {

      if (err) {
        return res.status(500).send(err.message);
      }

      if (!usuario) {
        return res.status(401).send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <title>Login incorrecto</title>
            <style>
              body{
                font-family:Arial,sans-serif;
                background:#eef2f7;
                padding:40px;
                color:#111827;
              }

              .card{
                max-width:420px;
                margin:60px auto;
                background:white;
                border-radius:18px;
                padding:26px;
                box-shadow:0 12px 28px rgba(15,23,42,.12);
              }

              h1{
                margin-top:0;
              }

              a{
                display:inline-flex;
                margin-top:12px;
                background:#2563eb;
                color:white;
                padding:12px 16px;
                border-radius:12px;
                text-decoration:none;
                font-weight:900;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Login incorrecto</h1>
              <p>Email o contraseña incorrectos, o usuario desactivado.</p>
              <a href="/login">Volver a iniciar sesión</a>
            </div>
          </body>
          </html>
        `);
      }

      req.session.usuario = usuario;

      if (usuario.rol === "admin" || usuario.rol === "gerente") {
        return res.redirect("/configuracion");
      }

      if (usuario.rol === "camarero") {
        return res.redirect("/camarero");
      }

      if (usuario.rol === "cocina") {
        return res.redirect("/cocina");
      }

      if (usuario.rol === "bar") {
        return res.redirect("/bar");
      }

      return res.redirect("/app/v2/index.html");

    }
  );

});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/admin-categorias', requiereRol(['admin']), (req, res) => {
  db.all('SELECT id, nombre, destino FROM categorias ORDER BY nombre', [], (err, categorias) => {
    if (err) return res.status(500).send(err.message);

    let filas = '';

    categorias.forEach(c => {
      filas += `
        <tr>
          <td>${c.nombre}</td>
          <td>${c.destino}</td>
          <td>
<form method="GET" action="/admin-categorias/editar/${c.id}" style="display:inline;">
<button type="submit">Editar</button>
</form>
            <form method="POST" action="/admin-categorias/eliminar/${c.id}" style="display:inline;">
              <button type="submit">Eliminar</button>
            </form>
          </td>
        </tr>
      `;
    });

    res.send(`
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Admin Categorías</title>
      </head>
      <body style="font-family: Arial; padding: 30px;">
        <h1>Administrar categorías</h1>

        <form method="POST" action="/admin-categorias/crear">
          <input name="nombre" placeholder="Nombre categoría" required>
          <select name="destino">
            <option value="cocina">Cocina</option>
            <option value="bar">Bar</option>
          </select>
          <button type="submit">Crear categoría</button>
        </form>

        <table border="1" cellpadding="8" style="margin-top:20px;">
          <tr>
            <th>Nombre</th>
            <th>Destino</th>
            <th>Acciones</th>
          </tr>
          ${filas}
        </table>
      </body>
      </html>
    `);
  });
});

app.post('/admin-categorias/eliminar/:id', requiereRol(['admin']), (req, res) => {
  db.run('DELETE FROM categorias WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin-categorias');
  });
});

app.get('/admin-categorias/editar/:id', requiereRol(['admin']), (req, res) => {
  db.get('SELECT * FROM categorias WHERE id=?', [req.params.id], (err, categoria) => {
    if (err) return res.status(500).send(err.message);
    if (!categoria) return res.send('Categoría no encontrada');

    res.send(`
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Editar categoría</title>
      </head>
      <body style="font-family: Arial; padding:30px;">
        <h1>Editar categoría</h1>

        <form method="POST" action="/admin-categorias/editar/${categoria.id}">
          <input name="nombre" value="${categoria.nombre}" required>

          <select name="destino">
            <option value="cocina" ${categoria.destino === 'cocina' ? 'selected' : ''}>Cocina</option>
            <option value="bar" ${categoria.destino === 'bar' ? 'selected' : ''}>Bar</option>
          </select>

          <button type="submit">Guardar cambios</button>
        </form>

      </body>
      </html>
    `);
  });
});

app.post('/admin-categorias/editar/:id', requiereRol(['admin']), (req, res) => {
  db.run(
    'UPDATE categorias SET nombre=?, destino=? WHERE id=?',
    [req.body.nombre, req.body.destino, req.params.id],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.redirect('/admin-categorias');
    }
  );
});


app.get('/admin-zonas-mesas', requiereRol(['admin']), (req, res) => {
  db.all('SELECT id, nombre FROM zonas WHERE activo=1 ORDER BY id', [], (err, zonas) => {
    if (err) return res.status(500).send(err.message);

    db.all(`
      SELECT mesas.id, mesas.numero, mesas.estado, zonas.nombre AS zona
      FROM mesas
      LEFT JOIN zonas ON mesas.zona_id = zonas.id
      ORDER BY zonas.id, mesas.numero
    `, [], (err, mesas) => {
      if (err) return res.status(500).send(err.message);

      let opcionesZonas = '';
      zonas.forEach(z => {
        opcionesZonas += `<option value="${z.id}">${z.nombre}</option>`;
      });

      let filasZonas = '';
      zonas.forEach(z => {
        filasZonas += `
          <tr>
            <td>${z.nombre}</td>
          </tr>
        `;
      });

      let filasMesas = '';
      mesas.forEach(m => {
        filasMesas += `
          <tr>
            <td>Mesa ${m.numero}</td>
            <td>${m.zona}</td>
            <td>${m.estado}</td>
          </tr>
        `;
      });

      res.send(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Zonas y Mesas</title>
          <style>
            body { font-family: Arial; background: #f4f4f4; padding: 30px; }
            form, table { background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; width: 100%; }
            input, select, button { padding: 10px; margin: 5px; }
            table { border-collapse: collapse; }
            th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Administrar zonas y mesas</h1>

          <form method="POST" action="/admin-zonas/crear">
            <h2>Nueva zona</h2>
            <input name="nombre" placeholder="Nombre de zona" required>
            <button type="submit">Crear zona</button>
          </form>

          <form method="POST" action="/admin-mesas/crear">
            <h2>Nueva mesa</h2>
            <input name="numero" placeholder="Número o nombre de mesa" required>
            <select name="zona_id" required>${opcionesZonas}</select>
            <button type="submit">Crear mesa</button>
          </form>

          <h2>Zonas</h2>
          <table>
            <tr><th>Zona</th></tr>
            ${filasZonas}
          </table>

          <h2>Mesas</h2>
          <table>
            <tr>
              <th>Mesa</th>
              <th>Zona</th>
              <th>Estado</th>
            </tr>
            ${filasMesas}
          </table>
        </body>
        </html>
      `);
    });
  });
});

app.post('/admin-zonas/crear', requiereRol(['admin']), (req, res) => {
  db.run(
    'INSERT INTO zonas (nombre, activo) VALUES (?, 1)',
    [req.body.nombre],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.redirect('/admin-zonas-mesas');
    }
  );
});

app.post('/admin-mesas/crear', requiereRol(['admin']), (req, res) => {
  db.run(
    "INSERT INTO mesas (numero, estado, zona_id) VALUES (?, 'libre', ?)",
    [req.body.numero, req.body.zona_id],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.redirect('/admin-zonas-mesas');
    }
  );
});

app.get('/admin/categorias', (req, res) => {
  db.all(
    "SELECT id, nombre, destino FROM categorias ORDER BY nombre",
    [],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});


app.delete('/admin/productos/:id',(req,res)=>{

db.run(
"DELETE FROM productos WHERE id=?",
[req.params.id],
function(err){

if(err) return res.status(500).json(err);

res.json({
ok:true
});

});

});


app.put('/admin/productos/:id',(req,res)=>{

const p=req.body;

db.run(

"UPDATE productos SET nombre=?,precio=?,categoria_id=? WHERE id=?",

[
p.nombre,
p.precio,
p.categoria_id,
req.params.id
],

function(err){

if(err) return res.status(500).json(err);

res.json({ok:true});

});

});


app.post('/admin/categorias',(req,res)=>{

const c=req.body;

db.run(

"INSERT INTO categorias(nombre,destino) VALUES(?,?)",

[
c.nombre,
c.destino
],

function(err){

if(err) return res.status(500).json(err);

res.json({
ok:true,
id:this.lastID
});

});

});


app.delete('/admin/categorias/:id',(req,res)=>{

db.run(

"DELETE FROM categorias WHERE id=?",

[req.params.id],

function(err){

if(err) return res.status(500).json(err);

res.json({
ok:true
});

});

});


app.post('/mesa/:mesa/ocupar-reserva', (req, res) => {
  const mesa = req.params.mesa;

  db.get(
    "SELECT id FROM mesas WHERE numero=?",
    [mesa],
    (err, mesaRow) => {
      if (err) return res.status(500).json({error:err.message});
      if (!mesaRow) return res.status(404).json({error:"Mesa no encontrada"});

      db.run(
        "UPDATE reservas SET estado='confirmada' WHERE mesa_id=? AND estado='activa'",
        [mesaRow.id],
        (err) => {
          if (err) return res.status(500).json({error:err.message});

          db.run(
            "UPDATE mesas SET estado='ocupada' WHERE id=?",
            [mesaRow.id],
            (err) => {
              if (err) return res.status(500).json({error:err.message});

              db.run(
                "INSERT INTO pedidos (mesa_id, estado, total) VALUES (?, 'abierto', 0)",
                [mesaRow.id],
                function(err){
                  if (err) return res.status(500).json({error:err.message});
                  res.json({ok:true,pedido:this.lastID});
                }
              );
            }
          );
        }
      );
    }
  );
});


const PUERTO_RESTAURANT_SERVICE = process.env.PORT || 3000;










app.get('/mesas', (req, res) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: "No autorizado" });
  }

  db.all("PRAGMA table_info(mesas)", [], (errMesas, columnasMesas) => {
    if (errMesas) {
      console.error("Error leyendo columnas mesas:", errMesas.message);
      return res.status(500).json({ error: "Error cargando mesas" });
    }

    db.all("PRAGMA table_info(zonas)", [], (errZonas, columnasZonas) => {
      if (errZonas) {
        console.error("Error leyendo columnas zonas:", errZonas.message);
        return res.status(500).json({ error: "Error cargando zonas" });
      }

      const colsMesas = (columnasMesas || []).map(c => c.name);
      const colsZonas = (columnasZonas || []).map(c => c.name);
      const condiciones = [];

      if (colsMesas.includes("activo")) {
        condiciones.push("COALESCE(mesas.activo, 1) = 1");
      }

      if (colsZonas.includes("activo")) {
        condiciones.push("COALESCE(zonas.activo, 1) = 1");
      }

      const where = condiciones.length ? "WHERE " + condiciones.join(" AND ") : "";

      const sql = `
        SELECT
          mesas.id,
          mesas.numero,
          CASE
            WHEN COALESCE(pedidos_abiertos.pedido_estado, '') = 'cuenta' THEN 'cuenta'
            WHEN COALESCE(mesas.estado, 'libre') = 'cuenta' THEN 'cuenta'
            WHEN pedidos_abiertos.pedido_id IS NOT NULL THEN 'ocupada'
            WHEN COALESCE(mesas.estado, 'libre') = 'reservada' THEN 'reservada'
            WHEN COALESCE(mesas.estado, 'libre') = 'ocupada' THEN 'ocupada'
            ELSE 'libre'
          END AS estado,
          mesas.zona_id,
          zonas.nombre AS zona,
          pedidos_abiertos.pedido_id AS pedido_abierto
        FROM mesas
        LEFT JOIN zonas ON zonas.id = mesas.zona_id
        LEFT JOIN (
          SELECT
            p1.mesa_id,
            p1.id AS pedido_id,
            p1.estado AS pedido_estado
          FROM pedidos p1
          INNER JOIN (
            SELECT mesa_id, MAX(id) AS max_id
            FROM pedidos
            WHERE estado != 'cerrado'
            GROUP BY mesa_id
          ) ultimos ON ultimos.max_id = p1.id
        ) pedidos_abiertos ON pedidos_abiertos.mesa_id = mesas.id
        ${where}
        ORDER BY zonas.nombre COLLATE NOCASE, mesas.numero COLLATE NOCASE
      `;

      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error("Error cargando mesas:", err.message);
          return res.status(500).json({ error: "Error cargando mesas" });
        }

        res.json(rows || []);
      });
    });
  });
});


app.listen(PUERTO_RESTAURANT_SERVICE, () => {
  console.log("Restaurant Service POS activo en http://localhost:" + PUERTO_RESTAURANT_SERVICE);
});
