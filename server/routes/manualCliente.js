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

function datos() {
  return {
    nombre: env("LEGAL_NOMBRE_COMERCIAL", "Restaurant Service POS"),
    soporte: env("LEGAL_SOPORTE", "soporte@restaurantservicepos.com"),
    email: env("LEGAL_EMAIL", "info@restaurantservicepos.com")
  };
}

function paginaManual() {
  const d = datos();

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Manual de uso - ${escapar(d.nombre)}</title>
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
      --ok:#16a34a;
      --warn:#f59e0b;
    }

    *{box-sizing:border-box;}

    html{scroll-behavior:smooth;}

    body{
      margin:0;
      font-family:Arial, Helvetica, sans-serif;
      background:
        radial-gradient(circle at 10% 8%, rgba(245,158,11,.20), transparent 30%),
        radial-gradient(circle at 86% 14%, rgba(59,130,246,.18), transparent 28%),
        linear-gradient(135deg,#0f172a 0%,#111827 32%,#f8fafc 32%,#f3f4f6 100%);
      color:var(--text);
    }

    .wrap{
      max-width:1180px;
      margin:0 auto;
      padding:24px 18px 60px;
    }

    .hero{
      position:relative;
      overflow:hidden;
      background:
        linear-gradient(135deg,rgba(17,24,39,.96),rgba(30,64,175,.68)),
        radial-gradient(circle at 92% 18%, rgba(245,158,11,.60), transparent 32%);
      color:white;
      border-radius:30px;
      padding:28px;
      box-shadow:0 24px 70px rgba(15,23,42,.28);
      border:1px solid rgba(255,255,255,.14);
      margin-bottom:18px;
    }

    .hero:after{
      content:"";
      position:absolute;
      right:-88px;
      top:-88px;
      width:230px;
      height:230px;
      border-radius:999px;
      background:rgba(255,255,255,.12);
      border:1px solid rgba(255,255,255,.16);
      pointer-events:none;
    }

    .hero h1{
      position:relative;
      z-index:1;
      margin:0 0 8px;
      font-size:34px;
      letter-spacing:-.045em;
      line-height:1.02;
    }

    .hero p{
      position:relative;
      z-index:1;
      margin:0;
      color:#dbeafe;
      line-height:1.5;
      font-size:15px;
      max-width:780px;
    }

    .hero-actions{
      position:relative;
      z-index:1;
      margin-top:18px;
      display:flex;
      flex-wrap:wrap;
      gap:10px;
    }

    .hero-actions a,
    a.btn,
    button{
      display:inline-block;
      color:white;
      text-decoration:none;
      border:1px solid rgba(255,255,255,.22);
      border-radius:13px;
      padding:10px 14px;
      font-size:13px;
      font-weight:900;
      background:linear-gradient(135deg,#2563eb,#14b8a6);
      box-shadow:0 10px 24px rgba(15,23,42,.14);
      transition:transform .16s ease, box-shadow .16s ease;
      cursor:pointer;
    }

    .hero-actions a:hover,
    a.btn:hover,
    button:hover{
      transform:translateY(-2px);
      box-shadow:0 16px 34px rgba(15,23,42,.20);
    }

    .hero-actions a.sec,
    a.sec,
    button.sec{
      background:linear-gradient(135deg,#ffffff,#dbeafe);
      color:#0f172a;
      border:1px solid rgba(255,255,255,.72);
    }

    .layout{
      display:grid;
      grid-template-columns:280px minmax(0,1fr);
      gap:18px;
      align-items:start;
    }

    .indice{
      position:sticky;
      top:14px;
      background:rgba(255,255,255,.94);
      border:1px solid rgba(229,231,235,.92);
      border-radius:24px;
      padding:16px;
      box-shadow:0 14px 36px rgba(15,23,42,.09);
      backdrop-filter:blur(12px);
    }

    .indice h2{
      margin:0 0 12px;
      font-size:18px;
      letter-spacing:-.035em;
    }

    .indice a{
      display:block;
      text-decoration:none;
      color:#1f2937;
      border-radius:12px;
      padding:9px 10px;
      font-size:14px;
      font-weight:800;
    }

    .indice a:hover{
      background:#eff6ff;
      color:#1d4ed8;
    }

    .card{
      background:rgba(255,255,255,.94);
      border:1px solid rgba(229,231,235,.92);
      border-radius:24px;
      padding:22px;
      box-shadow:0 14px 36px rgba(15,23,42,.09);
      margin-bottom:16px;
      backdrop-filter:blur(12px);
    }

    h2{
      margin:0 0 12px;
      font-size:25px;
      letter-spacing:-.04em;
      color:var(--dark);
    }

    h3{
      margin:20px 0 8px;
      font-size:18px;
      letter-spacing:-.03em;
      color:var(--dark);
    }

    p, li{
      color:#374151;
      font-size:15px;
      line-height:1.6;
    }

    ul, ol{
      padding-left:22px;
    }

    .pasos{
      counter-reset:paso;
      display:grid;
      gap:10px;
      margin-top:12px;
    }

    .paso{
      counter-increment:paso;
      border:1px solid var(--line);
      border-radius:18px;
      padding:13px 14px 13px 48px;
      background:linear-gradient(180deg,#ffffff,#f9fafb);
      position:relative;
      line-height:1.5;
      color:#374151;
      font-size:15px;
      box-shadow:0 8px 20px rgba(15,23,42,.05);
    }

    .paso:before{
      content:counter(paso);
      position:absolute;
      left:13px;
      top:12px;
      width:24px;
      height:24px;
      border-radius:50%;
      background:linear-gradient(135deg,#2563eb,#14b8a6);
      color:white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:13px;
      font-weight:900;
    }

    .tip{
      background:linear-gradient(135deg,#ecfdf5,#f0fdfa);
      border:1px solid #99f6e4;
      color:#14532d;
      border-radius:18px;
      padding:14px 16px;
      line-height:1.55;
      margin:14px 0;
      font-size:14px;
      box-shadow:0 10px 24px rgba(15,23,42,.06);
    }

    .alerta{
      background:linear-gradient(135deg,#fff7ed,#fef3c7);
      border:1px solid #fed7aa;
      color:#78350f;
      border-radius:18px;
      padding:14px 16px;
      line-height:1.55;
      margin:14px 0;
      font-size:14px;
      box-shadow:0 10px 24px rgba(15,23,42,.06);
    }

    .grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin:14px 0;
    }

    .mini{
      border:1px solid var(--line);
      background:linear-gradient(180deg,#ffffff,#f9fafb);
      border-radius:18px;
      padding:15px;
      box-shadow:0 10px 24px rgba(15,23,42,.05);
    }

    .mini strong{
      display:block;
      font-size:16px;
      margin-bottom:5px;
      color:#111827;
    }

    .mini span{
      display:block;
      color:#4b5563;
      line-height:1.5;
      font-size:14px;
    }

    code{
      background:#f1f5f9;
      border:1px solid #e2e8f0;
      border-radius:8px;
      padding:2px 6px;
      color:#0f172a;
      font-weight:800;
    }

    .badge{
      display:inline-block;
      border-radius:999px;
      padding:5px 9px;
      font-size:12px;
      font-weight:900;
      background:#eff6ff;
      color:#1d4ed8;
      margin:3px 4px 3px 0;
    }

    .checklist{
      display:grid;
      gap:8px;
      margin-top:10px;
    }

    .check{
      border:1px solid #e5e7eb;
      border-radius:16px;
      padding:11px 13px;
      background:#f9fafb;
      font-weight:800;
      color:#374151;
    }

    .check:before{
      content:"✓";
      color:#16a34a;
      font-weight:1000;
      margin-right:8px;
    }

    .footer{
      color:#6b7280;
      font-size:13px;
      margin-top:18px;
      text-align:center;
    }

    @media(max-width:850px){
      body{background:#f3f4f6;}
      .layout{grid-template-columns:1fr;}
      .indice{position:static;}
      .grid{grid-template-columns:1fr;}
      .hero h1{font-size:30px;}
    }

    @media print{
      body{background:white;}
      .hero-actions,.indice{display:none;}
      .layout{display:block;}
      .card,.hero{box-shadow:none;border:1px solid #e5e7eb;}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Manual de uso</h1>
      <p>Guía práctica para usar ${escapar(d.nombre)} en modo self-service: crear cuenta, activar trial, configurar el restaurante, trabajar con el POS, controlar caja y gestionar la suscripción.</p>
      <div class="hero-actions">
        <a href="/configuracion" class="sec">Volver a configuración</a>
        <a href="/app/v2">Abrir POS</a>
        <a href="javascript:window.print()" class="sec">Imprimir manual</a>
      </div>
    </section>

    <div class="layout">
      <aside class="indice">
        <h2>Índice</h2>
        <a href="#inicio">1. Flujo self-service</a>
        <a href="#registro">2. Crear cuenta y trial</a>
        <a href="#fiscales">3. Datos fiscales</a>
        <a href="#configuracion">4. Configuración inicial</a>
        <a href="#mesas">5. Salas y mesas</a>
        <a href="#productos">6. Productos y destinos</a>
        <a href="#impresion">7. Impresión</a>
        <a href="#pos">8. Trabajo diario POS</a>
        <a href="#cobro">9. Cuenta y cobro</a>
        <a href="#caja">10. Caja y reportes</a>
        <a href="#usuarios">11. Usuarios y roles</a>
        <a href="#backups">12. Backups</a>
        <a href="#suscripcion">13. Suscripción</a>
        <a href="#ayuda">14. Ayuda</a>
      </aside>

      <section>
        <article id="inicio" class="card">
          <h2>1. Flujo self-service</h2>
          <p>Restaurant Service POS está pensado para que el propietario pueda empezar sin asistencia técnica obligatoria. El flujo normal es:</p>
          <div class="pasos">
            <div class="paso">Crear una cuenta nueva desde la página de registro.</div>
            <div class="paso">Entrar en el periodo de prueba gratuito.</div>
            <div class="paso">Completar datos fiscales y datos del restaurante.</div>
            <div class="paso">Configurar salas, mesas, productos, destinos e impresión.</div>
            <div class="paso">Usar el POS durante el servicio.</div>
            <div class="paso">Cuando termine el trial, activar la suscripción mensual.</div>
          </div>
          <div class="tip">Recomendación: antes del primer servicio real, crear al menos una sala, una mesa, una categoría, un producto y probar una cuenta.</div>
        </article>

        <article id="registro" class="card">
          <h2>2. Crear cuenta y trial</h2>
          <p>El propietario crea la cuenta del restaurante desde <code>/registro</code>. Al registrarse, el sistema crea un restaurante propio y separa sus datos del resto de clientes.</p>
          <div class="grid">
            <div class="mini"><strong>Cuenta del propietario</strong><span>Email, contraseña y datos de acceso del administrador principal.</span></div>
            <div class="mini"><strong>Trial gratuito</strong><span>Periodo inicial para configurar y probar el sistema antes del pago.</span></div>
          </div>
          <div class="alerta">El propietario debe guardar bien su email y contraseña. Desde esa cuenta podrá crear usuarios camareros o gerentes.</div>
        </article>

        <article id="fiscales" class="card">
          <h2>3. Datos fiscales obligatorios</h2>
          <p>Antes de activar la suscripción de pago, el restaurante debe tener completos sus datos fiscales para facturación.</p>
          <div class="checklist">
            <div class="check">Nombre comercial</div>
            <div class="check">Razón social o nombre fiscal</div>
            <div class="check">NIF, CIF o VAT</div>
            <div class="check">Dirección fiscal completa</div>
            <div class="check">Código postal, ciudad, provincia y país</div>
            <div class="check">Email de facturación</div>
          </div>
          <p>Estos datos se modifican en <strong>Configuración → Restaurante</strong>. Si faltan datos fiscales, el pago de la suscripción queda bloqueado hasta completarlos.</p>
        </article>

        <article id="configuracion" class="card">
          <h2>4. Configuración inicial</h2>
          <p>Desde <strong>Configuración</strong> se accede a todas las áreas principales del sistema.</p>
          <div class="grid">
            <div class="mini"><strong>Restaurante</strong><span>Datos fiscales, logo, ticket y mensaje de cuenta.</span></div>
            <div class="mini"><strong>Productos</strong><span>Categorías, precios y disponibilidad.</span></div>
            <div class="mini"><strong>Mesas</strong><span>Salas, zonas y numeración del local.</span></div>
            <div class="mini"><strong>Impresoras y destinos</strong><span>Ticket, bar, cocina y otros puntos de comanda.</span></div>
          </div>
        </article>

        <article id="mesas" class="card">
          <h2>5. Salas, zonas y mesas</h2>
          <p>El restaurante puede crear sus propias zonas según su organización real: sala principal, terraza, sala inferior, privado o cualquier otra.</p>
          <div class="pasos">
            <div class="paso">Entrar en <strong>Configuración → Mesas</strong>.</div>
            <div class="paso">Crear una zona o sala.</div>
            <div class="paso">Crear las mesas con el número o nombre que usa el restaurante.</div>
            <div class="paso">Guardar y volver al POS.</div>
          </div>
          <h3>Colores habituales de mesas</h3>
          <span class="badge">Libre</span>
          <span class="badge">Ocupada</span>
          <span class="badge">Cuenta pedida</span>
          <span class="badge">Reservada</span>
        </article>

        <article id="productos" class="card">
          <h2>6. Productos, categorías y destinos</h2>
          <p>Los productos se organizan por categorías. Cada producto tendrá precio, disponibilidad y un destino de comanda.</p>
          <div class="grid">
            <div class="mini"><strong>Bar</strong><span>Bebidas, cafés, copas o productos que no pasan por cocina.</span></div>
            <div class="mini"><strong>Cocina</strong><span>Platos, raciones o productos que debe preparar cocina.</span></div>
            <div class="mini"><strong>Otros destinos</strong><span>Pizzeria, parrilla, barra exterior o cualquier destino personalizado.</span></div>
            <div class="mini"><strong>Disponibilidad</strong><span>Permite ocultar productos que no se venden ese día.</span></div>
          </div>
        </article>

        <article id="impresion" class="card">
          <h2>7. Impresión y destinos</h2>
          <p>El sistema permite trabajar con impresión sencilla por ventana o con configuración de impresoras cuando el restaurante lo necesite.</p>
          <div class="pasos">
            <div class="paso">Entrar en <strong>Configuración → Destinos</strong> para revisar bar, cocina y destinos personalizados.</div>
            <div class="paso">Entrar en <strong>Configuración → Impresoras</strong>.</div>
            <div class="paso">Probar ticket, bar y cocina.</div>
            <div class="paso">Ajustar el modo de impresión según el equipo del restaurante.</div>
          </div>
          <div class="tip">Para empezar, puede usarse la vista previa de ticket y comanda. La conexión con impresoras reales se puede preparar después.</div>
        </article>

        <article id="pos" class="card">
          <h2>8. Trabajo diario en el POS</h2>
          <p>Durante el servicio, el camarero trabaja desde el POS de sala.</p>
          <div class="pasos">
            <div class="paso">Abrir el POS desde <strong>Abrir POS</strong>.</div>
            <div class="paso">Seleccionar una mesa libre.</div>
            <div class="paso">Añadir bebidas, platos o productos.</div>
            <div class="paso">Enviar comandas a bar, cocina u otros destinos.</div>
            <div class="paso">Añadir más productos si el cliente pide algo nuevo.</div>
            <div class="paso">Pedir cuenta, cobrar y cerrar la mesa.</div>
          </div>
        </article>

        <article id="cobro" class="card">
          <h2>9. Cuenta, precuenta y cobro</h2>
          <p>Al terminar el consumo, el sistema permite generar cuenta, imprimir vista previa y cobrar.</p>
          <div class="grid">
            <div class="mini"><strong>Cuenta</strong><span>Genera el ticket con los datos fiscales, logo y mensaje del restaurante.</span></div>
            <div class="mini"><strong>Pago</strong><span>Permite registrar efectivo, tarjeta u otros métodos disponibles.</span></div>
            <div class="mini"><strong>Cierre de mesa</strong><span>Cuando el pedido queda pagado, la mesa vuelve a estar libre.</span></div>
            <div class="mini"><strong>Pagos separados</strong><span>El restaurante puede registrar diferentes pagos para una misma mesa.</span></div>
          </div>
        </article>

        <article id="caja" class="card">
          <h2>10. Caja y reportes</h2>
          <p>La caja ayuda a revisar ventas, métodos de pago y cierres diarios o mensuales.</p>
          <div class="pasos">
            <div class="paso">Entrar en <strong>Configuración → Caja</strong>.</div>
            <div class="paso">Revisar ventas del día y pagos registrados.</div>
            <div class="paso">Guardar cierre diario cuando termine el servicio.</div>
            <div class="paso">Usar <strong>Reportes</strong> para exportar CSV de pagos, productos o pedidos.</div>
          </div>
        </article>

        <article id="usuarios" class="card">
          <h2>11. Usuarios y roles</h2>
          <p>El propietario puede crear usuarios para el equipo. Cada rol tiene permisos diferentes.</p>
          <div class="grid">
            <div class="mini"><strong>Administrador</strong><span>Control completo: configuración, usuarios, suscripción, caja y datos fiscales.</span></div>
            <div class="mini"><strong>Gerente</strong><span>Puede gestionar gran parte de la configuración operativa del restaurante.</span></div>
            <div class="mini"><strong>Camarero</strong><span>Debe usar el POS para mesas, pedidos y comandas, sin modificar la configuración general.</span></div>
            <div class="mini"><strong>Usuarios inactivos</strong><span>Se pueden desactivar usuarios cuando un trabajador deja el restaurante.</span></div>
          </div>
        </article>

        <article id="backups" class="card">
          <h2>12. Backups</h2>
          <p>Los backups permiten descargar una copia de seguridad del restaurante actual.</p>
          <div class="pasos">
            <div class="paso">Entrar en <strong>Configuración → Backups</strong>.</div>
            <div class="paso">Crear un backup.</div>
            <div class="paso">Descargar el archivo generado.</div>
            <div class="paso">Guardar la copia en un lugar seguro.</div>
          </div>
          <div class="tip">Cada backup está separado por restaurante. No mezcla datos de otros clientes.</div>
        </article>

        <article id="suscripcion" class="card">
          <h2>13. Suscripción</h2>
          <p>Desde <strong>Configuración → Suscripción</strong> se revisa el estado del trial y el pago mensual.</p>
          <div class="grid">
            <div class="mini"><strong>Trial</strong><span>Periodo de prueba para configurar y comprobar el sistema.</span></div>
            <div class="mini"><strong>Datos fiscales</strong><span>Si faltan datos fiscales, el pago queda bloqueado.</span></div>
            <div class="mini"><strong>Pago Stripe</strong><span>Cuando Stripe esté configurado, el cliente podrá pagar desde esta pantalla.</span></div>
            <div class="mini"><strong>Estado</strong><span>Permite ver si la suscripción está activa, pendiente o en trial.</span></div>
          </div>
        </article>

        <article id="ayuda" class="card">
          <h2>14. Ayuda y soporte</h2>
          <p>Si algo no funciona, seguir este orden:</p>
          <div class="pasos">
            <div class="paso">Comprobar que el usuario ha iniciado sesión.</div>
            <div class="paso">Revisar si los datos fiscales están completos.</div>
            <div class="paso">Probar primero con una mesa y un producto de ejemplo.</div>
            <div class="paso">Hacer un backup antes de cambios importantes.</div>
            <div class="paso">Contactar con soporte si el error continúa.</div>
          </div>
          <p><strong>Soporte:</strong> ${escapar(d.soporte)}</p>
          <p><strong>Email:</strong> ${escapar(d.email)}</p>
        </article>

        <div class="footer">
          Manual actualizado para Restaurant Service POS Self-Service SaaS.
        </div>
      </section>
    </div>
  </main>
</body>
</html>`;
}

module.exports = function manualClienteRoutes() {
  const router = express.Router();

  router.get("/manual", function(req, res) {
    res.send(paginaManual());
  });

  router.get("/ayuda", function(req, res) {
    res.redirect("/manual");
  });

  return router;
};
