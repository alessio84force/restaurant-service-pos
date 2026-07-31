require("dotenv").config();

const express = require("express");
const { normalizarIdioma } = require("../utils/i18n");

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

function idiomaDesdeReq(req) {
  const queryIdioma =
    req &&
    req.query &&
    req.query.idioma;

  const sessionIdioma =
    req &&
    req.session &&
    (
      req.session.idioma ||
      (
        req.session.usuario &&
        req.session.usuario.idioma
      )
    );

  return normalizarIdioma(queryIdioma || sessionIdioma);
}

function hrefIdioma(path, idioma) {
  return path + "?idioma=" + encodeURIComponent(idioma);
}

function pagina(idiomaValor, titulo, subtitulo, contenido) {
  const d = datosLegales();
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      lang: "es",
      aviso: "Aviso legal",
      privacidad: "Privacidad",
      cookies: "Cookies",
      terminos: "Términos",
      suscripcion: "Suscripción",
      tratamiento: "Encargo tratamiento",
      volver: "Volver"
    },

    it: {
      lang: "it",
      aviso: "Note legali",
      privacidad: "Privacy",
      cookies: "Cookie",
      terminos: "Termini",
      suscripcion: "Abbonamento",
      tratamiento: "Trattamento dati",
      volver: "Torna al login"
    },

    en: {
      lang: "en",
      aviso: "Legal notice",
      privacidad: "Privacy",
      cookies: "Cookies",
      terminos: "Terms",
      suscripcion: "Subscription",
      tratamiento: "Data processing",
      volver: "Back to login"
    }
  };

  const t = textos[idioma] || textos.es;

  return `<!doctype html>
<html lang="${t.lang}">
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
        <a href="${hrefIdioma("/aviso-legal", idioma)}">${t.aviso}</a>
        <a href="${hrefIdioma("/privacidad", idioma)}">${t.privacidad}</a>
        <a href="${hrefIdioma("/cookies", idioma)}">${t.cookies}</a>
        <a href="${hrefIdioma("/terminos", idioma)}">${t.terminos}</a>
        <a href="${hrefIdioma("/condiciones-suscripcion", idioma)}">${t.suscripcion}</a>
        <a href="${hrefIdioma("/encargo-tratamiento", idioma)}">${t.tratamiento}</a>
        <a href="${hrefIdioma("/login", idioma)}">${t.volver}</a>
      </nav>
    </section>

    <section class="card">
      ${contenido}
    </section>

    <div class="footer">
      © 2026 ${escapar(d.nombreComercial)} ·
      <a href="${hrefIdioma("/aviso-legal", idioma)}">${t.aviso}</a> ·
      <a href="${hrefIdioma("/privacidad", idioma)}">${t.privacidad}</a> ·
      <a href="${hrefIdioma("/cookies", idioma)}">${t.cookies}</a> ·
      <a href="${hrefIdioma("/terminos", idioma)}">${t.terminos}</a>
    </div>

  </main>
</body>
</html>`;
}

function bloqueDatosTitular(idiomaValor) {
  const d = datosLegales();
  const idioma = normalizarIdioma(idiomaValor);

  const textos = {
    es: {
      comercial: "Nombre comercial",
      titular: "Titular",
      forma: "Forma jurídica",
      nif: "NIF/NIE",
      domicilio: "Domicilio fiscal",
      dominio: "Dominio",
      email: "Email legal",
      soporte: "Soporte"
    },

    it: {
      comercial: "Nome commerciale",
      titular: "Titolare",
      forma: "Forma giuridica",
      nif: "NIF/NIE",
      domicilio: "Domicilio fiscale",
      dominio: "Dominio",
      email: "Email legale",
      soporte: "Assistenza"
    },

    en: {
      comercial: "Trading name",
      titular: "Service provider",
      forma: "Legal form",
      nif: "Tax ID",
      domicilio: "Registered address",
      dominio: "Domain",
      email: "Legal email",
      soporte: "Support"
    }
  };

  const t = textos[idioma] || textos.es;

  return `
    <div class="datos">
      <div class="dato"><strong>${t.comercial}</strong><span>${escapar(d.nombreComercial)}</span></div>
      <div class="dato"><strong>${t.titular}</strong><span>${escapar(d.titular)}</span></div>
      <div class="dato"><strong>${t.forma}</strong><span>${escapar(d.forma)}</span></div>
      <div class="dato"><strong>${t.nif}</strong><span>${escapar(d.nif)}</span></div>
      <div class="dato"><strong>${t.domicilio}</strong><span>${escapar(direccionCompleta(d))}</span></div>
      <div class="dato"><strong>${t.dominio}</strong><span>${escapar(d.dominio)}</span></div>
      <div class="dato"><strong>${t.email}</strong><span>${escapar(d.email)}</span></div>
      <div class="dato"><strong>${t.soporte}</strong><span>${escapar(d.soporte)}</span></div>
    </div>
  `;
}

module.exports = function legalProfesionalRoutes() {
  const router = express.Router();

  router.get("/aviso-legal", function(req, res) {
    const idioma = idiomaDesdeReq(req);
    const d = datosLegales();

    const textos = {
      es: {
        titulo: "Aviso legal",
        subtitulo: "Información identificativa del titular de Restaurant Service POS.",
        contenido: `
          <h2>1. Titular del servicio</h2>
          <p>En cumplimiento de las obligaciones de información aplicables a los servicios prestados por vía electrónica, se informa de los datos identificativos del titular de este sitio y del servicio Restaurant Service POS.</p>
          ${bloqueDatosTitular("es")}

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
      },

      it: {
        titulo: "Note legali",
        subtitulo: "Informazioni identificative sul titolare di Restaurant Service POS.",
        contenido: `
          <h2>1. Titolare del servizio</h2>
          <p>In adempimento agli obblighi informativi applicabili ai servizi forniti per via elettronica, vengono indicati i dati identificativi del titolare di questo sito e del servizio Restaurant Service POS.</p>
          ${bloqueDatosTitular("it")}

          <h2>2. Oggetto del servizio</h2>
          <p>${escapar(d.nombreComercial)} è un sistema di gestione per ristoranti, bar e attività di ristorazione. Il servizio consente di gestire tavoli, prodotti, comande, stampa, cassa, utenti operativi, prove gratuite, abbonamenti e comunicazioni transazionali relative all'utilizzo del software.</p>

          <h2>3. Condizioni di utilizzo</h2>
          <p>L'accesso e l'utilizzo del servizio implicano l'accettazione dei termini e delle condizioni pubblicati su questo sito. L'utente si impegna a utilizzare il sistema in modo lecito, diligente e conforme alla normativa applicabile alla propria attività di ristorazione.</p>

          <h2>4. Proprietà intellettuale</h2>
          <p>Il software, il design, la struttura, il codice, i testi, gli elementi grafici e la denominazione commerciale Restaurant Service POS appartengono al relativo titolare o sono utilizzati con adeguata autorizzazione. Non è consentito copiare, distribuire, rivendere, modificare o sfruttare il software senza espressa autorizzazione.</p>

          <h2>5. Comunicazioni</h2>
          <p>Per questioni legali o generali è possibile contattare ${escapar(d.email)}. Per assistenza tecnica è possibile contattare ${escapar(d.soporte)}.</p>

          <h2>6. Legge applicabile</h2>
          <p>Il servizio è inizialmente rivolto al mercato spagnolo ed è disciplinato dalla normativa spagnola ed europea applicabile, fatte salve le norme imperative eventualmente applicabili all'utente.</p>
        `
      },

      en: {
        titulo: "Legal notice",
        subtitulo: "Identification information for the provider of Restaurant Service POS.",
        contenido: `
          <h2>1. Service provider</h2>
          <p>In accordance with the information requirements applicable to electronically provided services, the identification details of the provider of this website and the Restaurant Service POS service are set out below.</p>
          ${bloqueDatosTitular("en")}

          <h2>2. Purpose of the service</h2>
          <p>${escapar(d.nombreComercial)} is a management system for restaurants, bars and hospitality businesses. The service allows users to manage tables, products, orders, printing, cash operations, operational users, free trials, subscriptions and transactional communications related to the use of the software.</p>

          <h2>3. Terms of use</h2>
          <p>Access to and use of the service implies acceptance of the terms and conditions published on this website. Users agree to use the system lawfully, diligently and in accordance with the regulations applicable to their restaurant business.</p>

          <h2>4. Intellectual property</h2>
          <p>The software, design, structure, code, texts, graphic elements and Restaurant Service POS trade name belong to their respective owner or are used with sufficient authorization. The software may not be copied, distributed, resold, modified or exploited without express authorization.</p>

          <h2>5. Communications</h2>
          <p>For legal or general enquiries, contact ${escapar(d.email)}. For technical support, contact ${escapar(d.soporte)}.</p>

          <h2>6. Applicable law</h2>
          <p>The service is initially aimed at the Spanish market and is governed by applicable Spanish and European legislation, without prejudice to any mandatory rules that may apply to the user.</p>
        `
      }
    };

    const t = textos[idioma] || textos.es;

    res.send(pagina(
      idioma,
      t.titulo,
      t.subtitulo,
      t.contenido
    ));
  });

  router.get("/privacidad", function(req, res) {
    const idioma = idiomaDesdeReq(req);
    const d = datosLegales();

    const textos = {
      es: {
        titulo: "Política de privacidad",
        subtitulo: "Información sobre el tratamiento de datos personales en Restaurant Service POS.",
        contenido: `
          <h2>1. Responsable del tratamiento</h2>
          <p>El responsable de los datos necesarios para la contratación, gestión de cuenta, suscripción, soporte y comunicaciones del servicio es:</p>
          ${bloqueDatosTitular("es")}

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
      },

      it: {
        titulo: "Informativa sulla privacy",
        subtitulo: "Informazioni sul trattamento dei dati personali in Restaurant Service POS.",
        contenido: `
          <h2>1. Titolare del trattamento</h2>
          <p>Il titolare dei dati necessari per la contrattazione, la gestione dell'account, l'abbonamento, l'assistenza e le comunicazioni relative al servizio è:</p>
          ${bloqueDatosTitular("it")}

          <h2>2. Dati trattati</h2>
          <p>Per fornire il servizio possono essere trattate le seguenti categorie di dati:</p>
          <ul>
            <li>Dati identificativi e di contatto del titolare o responsabile del ristorante: nome, email, telefono, indirizzo e identificativo fiscale quando necessario.</li>
            <li>Dati del ristorante: nome commerciale, indirizzo, configurazione di sale, tavoli, prodotti, categorie, destinazioni delle comande e stampanti.</li>
            <li>Dati degli utenti interni creati dal ristorante: email o identificativo, ruolo operativo e stato di accesso.</li>
            <li>Dati tecnici e di abbonamento: stato della prova gratuita, piano, identificativi di pagamento di ${escapar(d.pagos)}, eventi dell'abbonamento e registri necessari per l'assistenza.</li>
            <li>Comunicazioni transazionali necessarie al servizio, inviate tramite ${escapar(d.emails)} da ${escapar(d.emailEnvio)}.</li>
          </ul>

          <h2>3. Finalità</h2>
          <p>I dati vengono trattati per creare e gestire l'account del ristorante, consentire l'utilizzo del POS, gestire la prova gratuita e l'abbonamento, elaborare i pagamenti, inviare comunicazioni transazionali, fornire assistenza tecnica, migliorare la sicurezza e adempiere agli obblighi legali.</p>

          <h2>4. Base giuridica</h2>
          <p>Le principali basi giuridiche sono l'esecuzione di un rapporto contrattuale o precontrattuale, l'adempimento di obblighi legali e il legittimo interesse a mantenere la sicurezza, l'assistenza e il funzionamento del servizio.</p>

          <h2>5. Fornitori e destinatari</h2>
          <p>Per fornire il servizio vengono utilizzati fornitori tecnici necessari:</p>
          <ul>
            <li>${escapar(d.pagos)} per pagamenti, abbonamenti e identificativi di fatturazione.</li>
            <li>${escapar(d.emails)} per le comunicazioni transazionali del sistema.</li>
            <li>${escapar(d.dns)} per dominio, DNS e servizi tecnici associati.</li>
          </ul>
          <p>I dati personali non vengono venduti a terzi.</p>

          <h2>6. Dati operativi del ristorante</h2>
          <p>Il ristorante è responsabile dei dati che inserisce e gestisce nella propria attività quotidiana, compresi eventuali dati relativi a ordini, tavoli, cassa, dipendenti o propri clienti. Restaurant Service POS agisce come fornitore tecnico secondo quanto indicato nell'accordo sul trattamento dei dati.</p>

          <h2>7. Conservazione</h2>
          <p>I dati saranno conservati per la durata del rapporto contrattuale e per i periodi necessari all'assistenza, alle responsabilità legali, agli obblighi fiscali o alla difesa da eventuali reclami. Successivamente saranno bloccati o eliminati quando previsto.</p>

          <h2>8. Diritti</h2>
          <p>È possibile richiedere accesso, rettifica, cancellazione, opposizione, limitazione o portabilità scrivendo a ${escapar(d.email)}. È inoltre possibile rivolgersi all'autorità di controllo competente qualora si ritenga che i propri diritti non siano stati adeguatamente tutelati.</p>

          <h2>9. Sicurezza</h2>
          <p>Il sistema applica misure tecniche ragionevoli quali autenticazione, ruoli utente, hashing delle password, separazione dei permessi, utilizzo di fornitori specializzati e limitazione dei dati a quanto necessario per il funzionamento del servizio.</p>
        `
      },

      en: {
        titulo: "Privacy Policy",
        subtitulo: "Information about the processing of personal data in Restaurant Service POS.",
        contenido: `
          <h2>1. Data controller</h2>
          <p>The controller of the data required for contracting, account management, subscriptions, support and service communications is:</p>
          ${bloqueDatosTitular("en")}

          <h2>2. Data processed</h2>
          <p>The following categories of data may be processed in order to provide the service:</p>
          <ul>
            <li>Identification and contact details of the restaurant owner or responsible person: name, email, phone number, address and tax identification where required.</li>
            <li>Restaurant data: trading name, address, configuration of areas, tables, products, categories, order destinations and printers.</li>
            <li>Data relating to internal users created by the restaurant: email or identifier, operational role and access status.</li>
            <li>Technical and subscription data: free-trial status, plan, ${escapar(d.pagos)} payment identifiers, subscription events and records required for support.</li>
            <li>Transactional communications required for the service, sent through ${escapar(d.emails)} from ${escapar(d.emailEnvio)}.</li>
          </ul>

          <h2>3. Purposes</h2>
          <p>Data is processed to create and manage the restaurant account, provide access to the POS, manage the free trial and subscription, process payments, send transactional communications, provide technical support, improve security and comply with legal obligations.</p>

          <h2>4. Legal basis</h2>
          <p>The main legal bases are the performance of a contractual or pre-contractual relationship, compliance with legal obligations and the legitimate interest in maintaining the security, support and operation of the service.</p>

          <h2>5. Service providers and recipients</h2>
          <p>The service uses the following necessary technical providers:</p>
          <ul>
            <li>${escapar(d.pagos)} for payments, subscriptions and billing identifiers.</li>
            <li>${escapar(d.emails)} for transactional system emails.</li>
            <li>${escapar(d.dns)} for domain, DNS and related technical services.</li>
          </ul>
          <p>Personal data is not sold to third parties.</p>

          <h2>6. Restaurant operational data</h2>
          <p>The restaurant is responsible for the data it enters and manages as part of its daily operations, including any data relating to orders, tables, cash operations, employees or its own customers. Restaurant Service POS acts as a technical provider under the terms set out in the Data Processing Agreement.</p>

          <h2>7. Retention</h2>
          <p>Data will be retained while the contractual relationship remains in force and for the periods necessary for support, legal responsibilities, tax obligations or the defence of claims. It will subsequently be restricted or deleted where appropriate.</p>

          <h2>8. Rights</h2>
          <p>You may request access, rectification, erasure, objection, restriction or portability by writing to ${escapar(d.email)}. You may also contact the competent supervisory authority if you believe your rights have not been properly addressed.</p>

          <h2>9. Security</h2>
          <p>The system applies reasonable technical measures including authentication, user roles, password hashing, permission separation, specialist service providers and limiting data processing to what is necessary for operation of the service.</p>
        `
      }
    };

    const t = textos[idioma] || textos.es;

    res.send(pagina(
      idioma,
      t.titulo,
      t.subtitulo,
      t.contenido
    ));
  });

  router.get("/cookies", function(req, res) {
    const idioma = idiomaDesdeReq(req);
    const d = datosLegales();

    const textos = {
      es: {
        titulo: "Política de cookies",
        subtitulo: "Información sobre cookies técnicas y tecnologías necesarias.",
        contenido: `
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
      },

      it: {
        titulo: "Informativa sui cookie",
        subtitulo: "Informazioni sui cookie tecnici e sulle tecnologie necessarie.",
        contenido: `
          <h2>1. Utilizzo attuale dei cookie</h2>
          <p>Restaurant Service POS utilizza cookie o meccanismi tecnici equivalenti necessari per il funzionamento del login, della sessione utente, della sicurezza e della navigazione interna del sistema.</p>

          <h2>2. Cookie tecnici</h2>
          <p>I cookie tecnici sono necessari per consentire all'utente di accedere, mantenere attiva la sessione, entrare nelle aree protette e utilizzare il POS in modo sicuro. Questi cookie non hanno finalità pubblicitarie.</p>

          <h2>3. Analisi e marketing</h2>
          <p>Attualmente il sistema non utilizza cookie di analisi pubblicitaria, remarketing, profilazione commerciale o tracciamento di terze parti con finalità pubblicitarie.</p>

          <h2>4. Modifiche future</h2>
          <p>Qualora in futuro venissero introdotti strumenti di analisi, pixel pubblicitari o cookie non tecnici, questa informativa sarà aggiornata e verrà introdotto il relativo meccanismo di consenso prima del loro utilizzo.</p>

          <h2>5. Contatti</h2>
          <p>Per qualsiasi domanda relativa ai cookie o a tecnologie simili è possibile scrivere a ${escapar(d.email)}.</p>
        `
      },

      en: {
        titulo: "Cookie Policy",
        subtitulo: "Information about technical cookies and necessary technologies.",
        contenido: `
          <h2>1. Current use of cookies</h2>
          <p>Restaurant Service POS uses cookies or equivalent technical mechanisms required for login, user sessions, security and internal navigation of the system.</p>

          <h2>2. Technical cookies</h2>
          <p>Technical cookies are necessary to allow users to sign in, keep their session active, access protected areas and use the POS securely. These cookies are not used for advertising purposes.</p>

          <h2>3. Analytics and marketing</h2>
          <p>The system currently does not use advertising analytics cookies, remarketing cookies, commercial profiling or third-party tracking for advertising purposes.</p>

          <h2>4. Future changes</h2>
          <p>If analytics tools, advertising pixels or non-technical cookies are introduced in the future, this policy will be updated and the corresponding consent mechanism will be implemented before they are used.</p>

          <h2>5. Contact</h2>
          <p>For any questions about cookies or similar technologies, you can write to ${escapar(d.email)}.</p>
        `
      }
    };

    const t = textos[idioma] || textos.es;

    res.send(pagina(
      idioma,
      t.titulo,
      t.subtitulo,
      t.contenido
    ));
  });

  router.get("/terminos", function(req, res) {
    const idioma = idiomaDesdeReq(req);
    const d = datosLegales();

    const textos = {
      es: {
        titulo: "Términos y condiciones",
        subtitulo: "Condiciones generales de uso de Restaurant Service POS.",
        contenido: `
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
      },

      it: {
        titulo: "Termini e condizioni",
        subtitulo: "Condizioni generali di utilizzo di Restaurant Service POS.",
        contenido: `
          <h2>1. Oggetto</h2>
          <p>I presenti termini regolano l'accesso e l'utilizzo di ${escapar(d.nombreComercial)}, un software gestionale per ristoranti, bar e attività di ristorazione.</p>

          <h2>2. Registrazione e account</h2>
          <p>Il ristorante deve fornire dati veritieri per creare il proprio account. Il titolare del ristorante o la persona autorizzata è responsabile della custodia delle credenziali e della creazione esclusivamente di utenti interni autorizzati.</p>

          <h2>3. Utilizzo consentito</h2>
          <p>Il sistema deve essere utilizzato per la normale gestione del ristorante. È vietato accedere senza autorizzazione, tentare di compromettere il sistema, rivendere il servizio, copiare il software o utilizzarlo per finalità illecite.</p>

          <h2>4. Prova gratuita</h2>
          <p>Il servizio può offrire un periodo di prova gratuito temporaneo. Al termine della prova, l'accesso potrà richiedere l'attivazione di un abbonamento a pagamento.</p>

          <h2>5. Prezzo e abbonamento</h2>
          <p>Il prezzo mensile previsto è di ${escapar(d.precio)} € al mese, salvo promozioni, accordi specifici o modifiche comunicate prima della sottoscrizione. I pagamenti sono gestiti tramite ${escapar(d.pagos)}.</p>

          <h2>6. Cancellazione</h2>
          <p>Il cliente può richiedere la cancellazione dell'abbonamento scrivendo a ${escapar(d.soporte)} oppure utilizzando gli strumenti disponibili nel pannello quando saranno abilitati. La cancellazione non incide sugli importi già maturati, salvo ove diversamente previsto dalla legge.</p>

          <h2>7. Assistenza</h2>
          <p>L'assistenza sarà fornita in modo ragionevole tramite ${escapar(d.soporte)}. Il servizio è in continua evoluzione e può ricevere miglioramenti, modifiche tecniche o aggiornamenti.</p>

          <h2>8. Responsabilità del ristorante</h2>
          <p>Il ristorante è responsabile dell'accuratezza dei propri dati, della configurazione, dei prezzi, dei prodotti, delle imposte, delle chiusure di cassa, degli adempimenti fiscali, dell'utilizzo da parte dei dipendenti e del trattamento dei dati dei propri clienti.</p>

          <h2>9. Disponibilità</h2>
          <p>Si cercherà di mantenere il sistema operativo, ma non viene garantita l'assenza assoluta di errori, interruzioni, problemi tecnici o necessità di manutenzione. L'utente deve mantenere copie e controlli interni adeguati alla propria attività.</p>

          <h2>10. Modifiche</h2>
          <p>I presenti termini possono essere aggiornati per riflettere modifiche tecniche, commerciali, legali o operative. La versione vigente sarà quella pubblicata in questa pagina.</p>
        `
      },

      en: {
        titulo: "Terms and Conditions",
        subtitulo: "General terms of use of Restaurant Service POS.",
        contenido: `
          <h2>1. Purpose</h2>
          <p>These terms govern access to and use of ${escapar(d.nombreComercial)}, restaurant management software for restaurants, bars and hospitality businesses.</p>

          <h2>2. Registration and account</h2>
          <p>The restaurant must provide accurate information when creating its account. The restaurant owner or authorized person is responsible for safeguarding account credentials and for creating only authorized internal users.</p>

          <h2>3. Permitted use</h2>
          <p>The system must be used for the ordinary management of the restaurant. Unauthorized access, attempts to compromise the system, resale of the service, copying of the software or use for unlawful purposes are prohibited.</p>

          <h2>4. Free trial</h2>
          <p>The service may offer a temporary free trial. Once the trial ends, continued access may require activation of a paid subscription.</p>

          <h2>5. Price and subscription</h2>
          <p>The expected monthly price is ${escapar(d.precio)} € per month, except where promotions, specific agreements or changes communicated before subscription apply. Payments are managed through ${escapar(d.pagos)}.</p>

          <h2>6. Cancellation</h2>
          <p>The customer may request cancellation of the subscription by writing to ${escapar(d.soporte)} or by using the mechanisms available in the account panel when enabled. Cancellation will not affect amounts already due, unless otherwise required by law.</p>

          <h2>7. Support</h2>
          <p>Support will be provided on a reasonable basis through ${escapar(d.soporte)}. The service is under continuous development and may receive improvements, technical changes or updates.</p>

          <h2>8. Restaurant responsibility</h2>
          <p>The restaurant is responsible for the accuracy of its data, configuration, prices, products, taxes, cash closings, tax compliance, employee use and processing of data relating to its own customers.</p>

          <h2>9. Availability</h2>
          <p>Reasonable efforts will be made to keep the system operational, but absolute freedom from errors, interruptions, technical incidents or maintenance requirements cannot be guaranteed. Users should maintain appropriate copies and internal controls for their business.</p>

          <h2>10. Amendments</h2>
          <p>These terms may be updated to reflect technical, commercial, legal or operational changes. The version in force will be the version published on this page.</p>
        `
      }
    };

    const t = textos[idioma] || textos.es;

    res.send(pagina(
      idioma,
      t.titulo,
      t.subtitulo,
      t.contenido
    ));
  });

  router.get("/condiciones-suscripcion", function(req, res) {
    const idioma = idiomaDesdeReq(req);
    const d = datosLegales();

    res.send(pagina(idioma,
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
    const idioma = idiomaDesdeReq(req);
    const d = datosLegales();

    res.send(pagina(idioma,
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
