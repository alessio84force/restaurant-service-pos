require("dotenv").config();

const express = require("express");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function env(nombre, defecto) {
  const valor = process.env[nombre];
  if (valor == null || String(valor).trim() === "") return defecto || "";
  return String(valor).trim();
}

function datosLegales() {
  return {
    nombreComercial: env("LEGAL_NOMBRE_COMERCIAL", "Restaurant Service POS"),
    titular: env("LEGAL_TITULAR_NOMBRE", "Titular pendiente de completar"),
    nif: env("LEGAL_TITULAR_NIF", "Pendiente de completar"),
    forma: env("LEGAL_FORMA_JURIDICA", "Autónomo / persona física"),
    domicilio: env("LEGAL_DOMICILIO_FISCAL", "Pendiente de completar"),
    cp: env("LEGAL_CODIGO_POSTAL", ""),
    ciudad: env("LEGAL_CIUDAD", ""),
    provincia: env("LEGAL_PROVINCIA", ""),
    pais: env("LEGAL_PAIS", "España"),
    email: env("LEGAL_EMAIL", "info@restaurantservicepos.com"),
    soporte: env("LEGAL_SOPORTE", "soporte@restaurantservicepos.com"),
    contacto: env("LEGAL_CONTACTO", "contacto@restaurantservicepos.com"),
    dominio: env("LEGAL_DOMINIO", "https://restaurantservicepos.com"),
    emailEnvio: env("LEGAL_EMAIL_ENVIO", "no-reply@send.restaurantservicepos.com"),
    pagos: env("LEGAL_PROVEEDOR_PAGOS", "Stripe"),
    emails: env("LEGAL_PROVEEDOR_EMAILS", "Resend"),
    dns: env("LEGAL_PROVEEDOR_DNS", "Cloudflare"),
    precio: env("LEGAL_PRECIO_MENSUAL", env("PRECIO_MENSUAL", "7.50"))
  };
}

function direccionCompleta(d) {
  return [d.domicilio, d.cp, d.ciudad, d.provincia, d.pais]
    .filter(Boolean)
    .join(", ");
}

function pagina(titulo, subtitulo, contenido) {
  const d = datosLegales();

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)} - ${escapar(d.nombreComercial)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root{
      --bg:#f3f4f6;
      --card:#ffffff;
      --text:#111827;
      --muted:#6b7280;
      --line:#e5e7eb;
      --brand:#2563eb;
      --dark:#0f172a;
    }

    *{box-sizing:border-box;}

    body{
      margin:0;
      font-family:Arial, Helvetica, sans-serif;
      background:var(--bg);
      color:var(--text);
    }

    .wrap{
      max-width:980px;
      margin:0 auto;
      padding:28px 18px 54px;
    }

    .top{
      background:linear-gradient(135deg,#0f172a,#1e3a8a);
      color:white;
      border-radius:24px;
      padding:28px;
      box-shadow:0 18px 45px rgba(15,23,42,.16);
      margin-bottom:20px;
    }

    .top h1{
      margin:0 0 8px;
      font-size:32px;
      line-height:1.15;
    }

    .top p{
      margin:0;
      color:#dbeafe;
      line-height:1.5;
      font-size:15px;
    }

    .nav{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin:16px 0 0;
    }

    .nav a{
      color:white;
      text-decoration:none;
      border:1px solid rgba(255,255,255,.35);
      border-radius:999px;
      padding:8px 11px;
      font-size:13px;
      font-weight:700;
    }

    .card{
      background:var(--card);
      border:1px solid var(--line);
      border-radius:20px;
      padding:24px;
      box-shadow:0 10px 30px rgba(15,23,42,.08);
      margin-bottom:16px;
    }

    h2{
      margin:22px 0 8px;
      font-size:21px;
      color:var(--dark);
    }

    h2:first-child{margin-top:0;}

    h3{
      margin:18px 0 8px;
      font-size:17px;
      color:var(--dark);
    }

    p, li{
      line-height:1.6;
      color:#374151;
      font-size:15px;
    }

    ul{
      padding-left:21px;
    }

    .datos{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin:14px 0;
    }

    .dato{
      background:#f9fafb;
      border:1px solid var(--line);
      border-radius:14px;
      padding:13px;
    }

    .dato strong{
      display:block;
      font-size:12px;
      text-transform:uppercase;
      letter-spacing:.04em;
      color:var(--muted);
      margin-bottom:5px;
    }

    .dato span{
      font-size:15px;
      font-weight:700;
      overflow-wrap:anywhere;
    }

    .nota{
      background:#fffbeb;
      border:1px solid #f59e0b;
      color:#92400e;
      border-radius:16px;
      padding:14px 16px;
      margin-top:18px;
      font-size:14px;
      line-height:1.55;
    }

    .footer{
      text-align:center;
      color:#6b7280;
      font-size:13px;
      padding:12px 0;
    }

    .footer a{
      color:#2563eb;
      text-decoration:none;
      font-weight:700;
    }

    @media(max-width:720px){
      .top h1{font-size:25px;}
      .datos{grid-template-columns:1fr;}
      .card{padding:18px;}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="top">
      <h1>${escapar(titulo)}</h1>
      <p>${escapar(subtitulo)}</p>
      <nav class="nav">
        <a href="/aviso-legal">Aviso legal</a>
        <a href="/privacidad">Privacidad</a>
        <a href="/cookies">Cookies</a>
        <a href="/terminos">Términos</a>
        <a href="/condiciones-suscripcion">Suscripción</a>
        <a href="/encargo-tratamiento">Encargo tratamiento</a>
        <a href="/login">Volver</a>
      </nav>
    </section>

    <section class="card">
      ${contenido}
    </section>

    <div class="footer">
      © 2026 ${escapar(d.nombreComercial)} ·
      <a href="/aviso-legal">Aviso legal</a> ·
      <a href="/privacidad">Privacidad</a> ·
      <a href="/cookies">Cookies</a> ·
      <a href="/terminos">Términos</a>
    </div>
  </main>
</body>
</html>`;
}

function bloqueDatosTitular() {
  const d = datosLegales();

  return `
    <div class="datos">
      <div class="dato"><strong>Nombre comercial</strong><span>${escapar(d.nombreComercial)}</span></div>
      <div class="dato"><strong>Titular</strong><span>${escapar(d.titular)}</span></div>
      <div class="dato"><strong>Forma jurídica</strong><span>${escapar(d.forma)}</span></div>
      <div class="dato"><strong>NIF/NIE</strong><span>${escapar(d.nif)}</span></div>
      <div class="dato"><strong>Domicilio fiscal</strong><span>${escapar(direccionCompleta(d))}</span></div>
      <div class="dato"><strong>Dominio</strong><span>${escapar(d.dominio)}</span></div>
      <div class="dato"><strong>Email legal</strong><span>${escapar(d.email)}</span></div>
      <div class="dato"><strong>Soporte</strong><span>${escapar(d.soporte)}</span></div>
    </div>
  `;
}

module.exports = function legalProfesionalRoutes() {
  const router = express.Router();

  router.get("/aviso-legal", function(req, res) {
    const d = datosLegales();

    res.send(pagina(
      "Aviso legal",
      "Información identificativa del titular de Restaurant Service POS.",
      `
        <h2>1. Titular del servicio</h2>
        <p>En cumplimiento de las obligaciones de información aplicables a los servicios prestados por vía electrónica, se informa de los datos identificativos del titular de este sitio y del servicio Restaurant Service POS.</p>
        ${bloqueDatosTitular()}

        <h2>2. Objeto del servicio</h2>
        <p>${escapar(d.nombreComercial)} es un sistema de gestión para restaurantes, bares y negocios de hostelería. El servicio permite gestionar mesas, productos, comandas, impresión, caja, usuarios operativos, pruebas gratuitas, suscripciones y comunicaciones transaccionales relacionadas con el uso del software.</p>

        <h2>3. Condiciones de uso</h2>
        <p>El acceso y uso del servicio implica la aceptación de los términos y condiciones publicados en este sitio. El usuario se compromete a utilizar el sistema de forma lícita, diligente y conforme a la normativa aplicable a su actividad de restauración.</p>

        <h2>4. Propiedad intelectual</h2>
        <p>El software, diseño, estructura, código, textos, elementos gráficos y denominación comercial Restaurant Service POS pertenecen a su titular o cuentan con autorización suficiente para su uso. No se permite copiar, distribuir, revender, modificar o explotar el software sin autorización expresa.</p>

        <h2>5. Comunicaciones</h2>
        <p>Para cuestiones legales o generales puede contactar en ${escapar(d.email)}. Para soporte técnico puede contactar en ${escapar(d.soporte)}.</p>

        <h2>6. Legislación aplicable</h2>
        <p>El servicio se dirige inicialmente al mercado español y se rige por la normativa española y europea aplicable, sin perjuicio de las normas imperativas que puedan corresponder al usuario.</p>
      `
    ));
  });

  router.get("/privacidad", function(req, res) {
    const d = datosLegales();

    res.send(pagina(
      "Política de privacidad",
      "Información sobre el tratamiento de datos personales en Restaurant Service POS.",
      `
        <h2>1. Responsable del tratamiento</h2>
        <p>El responsable de los datos necesarios para la contratación, gestión de cuenta, suscripción, soporte y comunicaciones del servicio es:</p>
        ${bloqueDatosTitular()}

        <h2>2. Datos tratados</h2>
        <p>Para prestar el servicio se pueden tratar las siguientes categorías de datos:</p>
        <ul>
          <li>Datos identificativos y de contacto del titular o responsable del restaurante: nombre, email, teléfono, dirección, NIF/CIF cuando sea necesario.</li>
          <li>Datos del restaurante: nombre comercial, dirección, configuración de salas, mesas, productos, categorías, destinos de comanda e impresoras.</li>
          <li>Datos de usuarios internos creados por el restaurante: email o identificador, rol operativo y estado de acceso.</li>
          <li>Datos técnicos y de suscripción: estado de prueba gratuita, plan, identificadores de pago de ${escapar(d.pagos)}, eventos de suscripción y registros necesarios para soporte.</li>
          <li>Comunicaciones transaccionales necesarias para el servicio, enviadas mediante ${escapar(d.emails)} desde ${escapar(d.emailEnvio)}.</li>
        </ul>

        <h2>3. Finalidades</h2>
        <p>Los datos se tratan para crear y gestionar la cuenta del restaurante, permitir el uso del POS, gestionar la prueba gratuita y la suscripción, procesar pagos, enviar emails transaccionales, prestar soporte técnico, mejorar la seguridad y cumplir obligaciones legales.</p>

        <h2>4. Base jurídica</h2>
        <p>Las bases jurídicas principales son la ejecución de una relación contractual o precontractual, el cumplimiento de obligaciones legales y el interés legítimo en mantener la seguridad, soporte y funcionamiento del servicio.</p>

        <h2>5. Proveedores y destinatarios</h2>
        <p>Para prestar el servicio se utilizan proveedores técnicos necesarios:</p>
        <ul>
          <li>${escapar(d.pagos)} para pagos, suscripciones e identificadores de facturación.</li>
          <li>${escapar(d.emails)} para emails transaccionales del sistema.</li>
          <li>${escapar(d.dns)} para dominio, DNS y servicios técnicos asociados.</li>
        </ul>
        <p>No se venden datos personales a terceros.</p>

        <h2>6. Datos operativos del restaurante</h2>
        <p>El restaurante es responsable de los datos que introduce y gestiona en su actividad diaria, incluyendo datos relacionados con pedidos, mesas, caja, empleados o clientes propios si los introdujera en el sistema. Restaurant Service POS actúa como proveedor técnico en los términos indicados en el documento de encargo del tratamiento.</p>

        <h2>7. Conservación</h2>
        <p>Los datos se conservarán mientras exista relación contractual, durante los plazos necesarios para soporte, responsabilidades legales, obligaciones fiscales o defensa de reclamaciones, y posteriormente se bloquearán o eliminarán cuando corresponda.</p>

        <h2>8. Derechos</h2>
        <p>Puede solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad escribiendo a ${escapar(d.email)}. También puede contactar con la autoridad de control competente si considera que sus derechos no han sido atendidos correctamente.</p>

        <h2>9. Seguridad</h2>
        <p>El sistema aplica medidas técnicas razonables como autenticación, roles de usuario, hashing de contraseñas, separación de permisos, uso de proveedores especializados y limitación de datos al funcionamiento necesario del servicio.</p>
      `
    ));
  });

  router.get("/cookies", function(req, res) {
    const d = datosLegales();

    res.send(pagina(
      "Política de cookies",
      "Información sobre cookies técnicas y tecnologías necesarias.",
      `
        <h2>1. Uso actual de cookies</h2>
        <p>Restaurant Service POS utiliza cookies o mecanismos técnicos equivalentes necesarios para el funcionamiento del login, la sesión de usuario, la seguridad y la navegación interna del sistema.</p>

        <h2>2. Cookies técnicas</h2>
        <p>Las cookies técnicas son necesarias para que el usuario pueda iniciar sesión, mantener su sesión activa, acceder a las zonas protegidas y utilizar el POS de forma segura. Estas cookies no tienen finalidad publicitaria.</p>

        <h2>3. Analytics y marketing</h2>
        <p>Actualmente el sistema no utiliza cookies de analítica publicitaria, remarketing, perfiles comerciales ni seguimiento de terceros con fines publicitarios.</p>

        <h2>4. Cambios futuros</h2>
        <p>Si en el futuro se incorporan herramientas como analítica, píxeles publicitarios o cookies no técnicas, esta política se actualizará y se incorporará el mecanismo de consentimiento correspondiente antes de su uso.</p>

        <h2>5. Contacto</h2>
        <p>Para cualquier duda sobre cookies o tecnologías similares puede escribir a ${escapar(d.email)}.</p>
      `
    ));
  });

  router.get("/terminos", function(req, res) {
    const d = datosLegales();

    res.send(pagina(
      "Términos y condiciones",
      "Condiciones generales de uso de Restaurant Service POS.",
      `
        <h2>1. Objeto</h2>
        <p>Estos términos regulan el acceso y uso de ${escapar(d.nombreComercial)}, un software de gestión para restaurantes, bares y negocios de hostelería.</p>

        <h2>2. Alta y cuenta</h2>
        <p>El restaurante debe facilitar datos veraces para crear su cuenta. El titular del restaurante o persona autorizada es responsable de custodiar sus credenciales y de crear únicamente usuarios internos autorizados.</p>

        <h2>3. Uso permitido</h2>
        <p>El sistema debe utilizarse para la gestión ordinaria del restaurante. Queda prohibido acceder sin autorización, intentar vulnerar el sistema, revender el servicio, copiar el software o utilizarlo para fines ilícitos.</p>

        <h2>4. Prueba gratuita</h2>
        <p>El servicio puede ofrecer una prueba gratuita temporal. Finalizada la prueba, el acceso podrá requerir la activación de una suscripción de pago.</p>

        <h2>5. Precio y suscripción</h2>
        <p>El precio mensual previsto es de ${escapar(d.precio)} € al mes, salvo promociones, acuerdos específicos o cambios comunicados antes de la contratación. Los pagos se gestionan mediante ${escapar(d.pagos)}.</p>

        <h2>6. Cancelación</h2>
        <p>El cliente podrá solicitar la cancelación de la suscripción escribiendo a ${escapar(d.soporte)} o utilizando los mecanismos disponibles en el panel cuando estén habilitados. La cancelación no afectará a importes ya devengados, salvo que legalmente corresponda otra cosa.</p>

        <h2>7. Soporte</h2>
        <p>El soporte se prestará de forma razonable a través de ${escapar(d.soporte)}. El servicio se encuentra en evolución y puede recibir mejoras, cambios técnicos o actualizaciones.</p>

        <h2>8. Responsabilidad del restaurante</h2>
        <p>El restaurante es responsable de la exactitud de sus datos, configuración, precios, productos, impuestos, cierres de caja, cumplimiento fiscal, uso de empleados y tratamiento de datos de sus propios clientes.</p>

        <h2>9. Disponibilidad</h2>
        <p>Se procurará mantener el sistema operativo, pero no se garantiza ausencia absoluta de errores, interrupciones, incidencias técnicas o necesidades de mantenimiento. El usuario debe mantener copias y controles internos adecuados para su negocio.</p>

        <h2>10. Modificaciones</h2>
        <p>Estos términos podrán actualizarse para reflejar cambios técnicos, comerciales, legales o de funcionamiento. La versión vigente será la publicada en esta página.</p>
      `
    ));
  });

  router.get("/condiciones-suscripcion", function(req, res) {
    const d = datosLegales();

    res.send(pagina(
      "Condiciones de suscripción",
      "Información sobre prueba gratuita, precio, pagos y cancelación.",
      `
        <h2>1. Prueba gratuita</h2>
        <p>Restaurant Service POS puede ofrecer una prueba gratuita inicial para que el restaurante valore el funcionamiento del sistema antes de activar la suscripción.</p>

        <h2>2. Precio mensual</h2>
        <p>El precio base previsto es de ${escapar(d.precio)} € al mes, salvo promoción, acuerdo especial o cambio comunicado antes de contratar.</p>

        <h2>3. Medio de pago</h2>
        <p>Los pagos y la gestión de suscripciones se realizan mediante ${escapar(d.pagos)}. Restaurant Service POS no almacena los datos completos de la tarjeta bancaria.</p>

        <h2>4. Renovación</h2>
        <p>La suscripción se renueva mensualmente mientras permanezca activa. En caso de impago, fallo de tarjeta o cancelación, el acceso podrá quedar limitado hasta regularizar la situación.</p>

        <h2>5. Cancelación</h2>
        <p>La cancelación puede solicitarse escribiendo a ${escapar(d.soporte)}. Cuando exista un panel de gestión automatizada, también podrá realizarse desde dicho panel.</p>

        <h2>6. Promociones</h2>
        <p>Las promociones, códigos de prueba ampliada o accesos especiales se aplican según las condiciones comunicadas en cada caso.</p>
      `
    ));
  });

  router.get("/encargo-tratamiento", function(req, res) {
    const d = datosLegales();

    res.send(pagina(
      "Encargo del tratamiento",
      "Base informativa sobre el tratamiento de datos entre el restaurante y Restaurant Service POS.",
      `
        <h2>1. Partes</h2>
        <p>El restaurante usuario del software actúa como responsable del tratamiento respecto de los datos personales que introduce o gestiona en su actividad diaria.</p>
        <p>${escapar(d.nombreComercial)}, titularidad de ${escapar(d.titular)}, actúa como proveedor técnico y, cuando corresponda, como encargado del tratamiento para prestar soporte, mantenimiento y funcionamiento del software.</p>

        <h2>2. Objeto del encargo</h2>
        <p>El encargo consiste en facilitar el uso técnico del POS, mantener funcionalidades de cuenta, usuarios, suscripción, comunicaciones transaccionales, soporte e incidencias relacionadas con el servicio.</p>

        <h2>3. Datos afectados</h2>
        <p>Pueden tratarse datos del restaurante, usuarios internos, configuración del negocio, información técnica de suscripción y, si el restaurante los introduce, datos operativos relacionados con pedidos, mesas, empleados o clientes.</p>

        <h2>4. Finalidad</h2>
        <p>Los datos se tratarán únicamente para prestar el servicio contratado, mantener la seguridad, gestionar soporte, comunicaciones necesarias y obligaciones legales o contractuales asociadas.</p>

        <h2>5. Obligaciones del encargado</h2>
        <ul>
          <li>Tratar los datos siguiendo las instrucciones del restaurante y para las finalidades del servicio.</li>
          <li>No utilizar los datos para finalidades propias incompatibles.</li>
          <li>Aplicar medidas técnicas y organizativas razonables.</li>
          <li>Limitar el acceso a personal o proveedores necesarios.</li>
          <li>Colaborar razonablemente en la atención de derechos o incidencias de seguridad.</li>
        </ul>

        <h2>6. Subencargados y proveedores</h2>
        <p>Para prestar el servicio pueden intervenir proveedores técnicos necesarios como ${escapar(d.pagos)} para pagos, ${escapar(d.emails)} para emails transaccionales y ${escapar(d.dns)} para dominio, DNS o servicios técnicos asociados.</p>

        <h2>7. Devolución o eliminación</h2>
        <p>Finalizada la relación, los datos podrán ser eliminados, bloqueados o conservados únicamente durante los plazos necesarios para responsabilidades legales, técnicas, fiscales o de seguridad.</p>

        <h2>8. Documento base</h2>
        <p>Esta página funciona como base informativa inicial. Para clientes que requieran un contrato específico de encargo del tratamiento, podrá formalizarse un documento individual firmado entre las partes.</p>

        <div class="nota">
          Recomendación: antes de escalar comercialmente el servicio o firmar con clientes de mayor tamaño, este documento debe ser revisado por un asesor legal especializado en protección de datos.
        </div>
      `
    ));
  });

  return router;
};
