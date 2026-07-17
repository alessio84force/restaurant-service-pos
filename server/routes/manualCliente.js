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

    body{
      margin:0;
      font-family:Arial, Helvetica, sans-serif;
      background:var(--bg);
      color:var(--text);
    }

    .wrap{
      max-width:1100px;
      margin:0 auto;
      padding:28px 18px 60px;
    }

    .hero{
      background:linear-gradient(135deg,#0f172a,#1e3a8a);
      color:white;
      border-radius:26px;
      padding:30px;
      box-shadow:0 20px 50px rgba(15,23,42,.18);
      margin-bottom:20px;
    }

    .hero h1{
      margin:0 0 8px;
      font-size:34px;
      line-height:1.12;
    }

    .hero p{
      margin:0;
      color:#dbeafe;
      line-height:1.5;
      font-size:15px;
      max-width:760px;
    }

    .hero-actions{
      margin-top:18px;
      display:flex;
      flex-wrap:wrap;
      gap:10px;
    }

    .hero-actions a{
      color:white;
      text-decoration:none;
      border:1px solid rgba(255,255,255,.35);
      border-radius:999px;
      padding:9px 13px;
      font-size:13px;
      font-weight:800;
      background:rgba(255,255,255,.08);
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
      background:white;
      border:1px solid var(--line);
      border-radius:20px;
      padding:16px;
      box-shadow:0 10px 26px rgba(15,23,42,.07);
    }

    .indice h2{
      margin:0 0 12px;
      font-size:18px;
    }

    .indice a{
      display:block;
      text-decoration:none;
      color:#1f2937;
      border-radius:10px;
      padding:9px 10px;
      font-size:14px;
      font-weight:700;
    }

    .indice a:hover{
      background:#eff6ff;
      color:#1d4ed8;
    }

    .card{
      background:white;
      border:1px solid var(--line);
      border-radius:22px;
      padding:24px;
      box-shadow:0 10px 26px rgba(15,23,42,.07);
      margin-bottom:16px;
    }

    h2{
      margin:0 0 12px;
      font-size:25px;
      color:var(--dark);
    }

    h3{
      margin:20px 0 8px;
      font-size:18px;
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
      border-radius:15px;
      padding:13px 14px 13px 48px;
      background:#f9fafb;
      position:relative;
      line-height:1.5;
      color:#374151;
      font-size:15px;
    }

    .paso:before{
      content:counter(paso);
      position:absolute;
      left:13px;
      top:12px;
      width:24px;
      height:24px;
      border-radius:50%;
      background:#2563eb;
      color:white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:13px;
      font-weight:900;
    }

    .tip{
      background:#ecfdf5;
      border:1px solid #86efac;
      color:#14532d;
      border-radius:16px;
      padding:14px 16px;
      line-height:1.55;
      margin:14px 0;
      font-size:14px;
    }

    .alerta{
      background:#fffbeb;
      border:1px solid #fbbf24;
      color:#78350f;
      border-radius:16px;
      padding:14px 16px;
      line-height:1.55;
      margin:14px 0;
      font-size:14px;
    }

    .grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin:14px 0;
    }

    .mini{
      border:1px solid var(--line);
      background:#f9fafb;
      border-radius:16px;
      padding:15px;
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
      font-size:13px;
    }

    .estado{
      display:inline-block;
      padding:4px 8px;
      border-radius:999px;
      font-size:12px;
      font-weight:800;
    }

    .verde{background:#dcfce7;color:#166534;}
    .azul{background:#dbeafe;color:#1e40af;}
    .amarillo{background:#fef3c7;color:#92400e;}
    .rojo{background:#fee2e2;color:#991b1b;}

    .footer{
      text-align:center;
      color:#6b7280;
      font-size:13px;
      margin-top:22px;
      line-height:1.5;
    }

    .footer a{
      color:#2563eb;
      text-decoration:none;
      font-weight:800;
    }

    @media(max-width:860px){
      .layout{
        grid-template-columns:1fr;
      }

      .indice{
        position:static;
      }

      .grid{
        grid-template-columns:1fr;
      }

      .hero h1{
        font-size:27px;
      }

      .card{
        padding:19px;
      }
    }

    @media print{
      .indice,.hero-actions{display:none;}
      body{background:white;}
      .card,.hero{box-shadow:none;}
      .layout{display:block;}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Manual de uso de ${escapar(d.nombre)}</h1>
      <p>Guía rápida para aprender a configurar el restaurante, trabajar con mesas, enviar comandas, cobrar y cerrar caja sin depender de asistencia técnica.</p>
      <div class="hero-actions">
        <a href="/configuracion">Volver a configuración</a>
        <a href="/app/v2">Abrir POS</a>
        <a href="/camarero">Vista camarero</a>
        <a href="javascript:window.print()">Imprimir manual</a>
      </div>
    </section>

    <div class="layout">
      <aside class="indice">
        <h2>Índice</h2>
        <a href="#inicio">1. Primer acceso</a>
        <a href="#configuracion">2. Configuración inicial</a>
        <a href="#mesas">3. Salas y mesas</a>
        <a href="#productos">4. Productos</a>
        <a href="#impresion">5. Impresoras</a>
        <a href="#servicio">6. Trabajo diario</a>
        <a href="#comandas">7. Comandas</a>
        <a href="#cobro">8. Cobro</a>
        <a href="#caja">9. Caja</a>
        <a href="#movil">10. Camarero móvil</a>
        <a href="#usuarios">11. Usuarios</a>
        <a href="#faq">12. Preguntas frecuentes</a>
      </aside>

      <section>
        <article id="inicio" class="card">
          <h2>1. Primer acceso</h2>
          <p>Al entrar por primera vez, el propietario o responsable del restaurante accede con el email y la contraseña facilitados en el alta.</p>
          <div class="pasos">
            <div class="paso">Abrir la página de login.</div>
            <div class="paso">Escribir email y contraseña.</div>
            <div class="paso">Entrar en <strong>Configuración</strong> para preparar el restaurante.</div>
            <div class="paso">Después de configurar mesas, productos e impresoras, abrir el POS y empezar a trabajar.</div>
          </div>
          <div class="tip">Consejo: antes del primer servicio real, conviene hacer una prueba completa con una mesa ficticia.</div>
        </article>

        <article id="configuracion" class="card">
          <h2>2. Configuración inicial recomendada</h2>
          <p>Antes de usar el POS durante un servicio, siga este orden:</p>
          <div class="grid">
            <div class="mini"><strong>1. Datos del restaurante</strong><span>Nombre, propietario, datos de contacto y configuración general.</span></div>
            <div class="mini"><strong>2. Salas y mesas</strong><span>Crear las zonas reales del local y sus mesas.</span></div>
            <div class="mini"><strong>3. Productos</strong><span>Crear categorías, productos, precios y destino de comanda.</span></div>
            <div class="mini"><strong>4. Impresión</strong><span>Probar ticket, bar, cocina y otros destinos.</span></div>
          </div>
          <p>La configuración puede cambiarse más adelante, pero es mejor dejarla preparada antes de abrir el restaurante al público.</p>
        </article>

        <article id="mesas" class="card">
          <h2>3. Salas, zonas y mesas</h2>
          <p>El restaurante puede crear libremente sus zonas: sala principal, terraza, barra, comedor privado, planta inferior o cualquier distribución real.</p>
          <div class="pasos">
            <div class="paso">Entrar en <strong>Configuración de mesas</strong>.</div>
            <div class="paso">Crear una zona o sala.</div>
            <div class="paso">Crear las mesas con el número o nombre que usa el restaurante.</div>
            <div class="paso">Guardar y volver al POS.</div>
          </div>
          <h3>Colores de las mesas</h3>
          <p><span class="estado verde">Libre</span> mesa disponible. <span class="estado azul">Ocupada</span> mesa abierta con pedido. <span class="estado amarillo">Cuenta</span> mesa pendiente de cobro. <span class="estado rojo">Reservada</span> mesa reservada o bloqueada.</p>
        </article>

        <article id="productos" class="card">
          <h2>4. Productos, categorías y destinos</h2>
          <p>Los productos se organizan por categorías. Cada categoría o producto debe tener un destino de comanda para saber dónde se imprime o se envía.</p>
          <div class="grid">
            <div class="mini"><strong>Bar</strong><span>Bebidas, cafés, refrescos, vinos, cervezas.</span></div>
            <div class="mini"><strong>Cocina</strong><span>Platos, entrantes, carnes, pescados, postres.</span></div>
            <div class="mini"><strong>Pizzeria</strong><span>Ejemplo de destino adicional para restaurantes con varias partidas.</span></div>
            <div class="mini"><strong>Otros destinos</strong><span>Se pueden crear nuevos destinos según el funcionamiento del restaurante.</span></div>
          </div>
          <div class="alerta">Importante: si un producto no tiene destino correcto, puede no salir en la comanda esperada.</div>
        </article>

        <article id="impresion" class="card">
          <h2>5. Centro de impresión</h2>
          <p>El centro de impresión permite configurar cada destino: caja/ticket, bar, cocina, pizzeria o cualquier otro destino creado.</p>
          <div class="pasos">
            <div class="paso">Entrar en <strong>Configuración de impresoras</strong>.</div>
            <div class="paso">Elegir el destino que se quiere configurar.</div>
            <div class="paso">Mantener en modo <strong>preview</strong> mientras se hacen pruebas.</div>
            <div class="paso">Generar prueba de impresión.</div>
            <div class="paso">Cuando el técnico conecte impresoras reales, cambiar el modo correspondiente.</div>
          </div>
          <div class="tip">Para empezar, el modo preview es suficiente: permite verificar que cada comanda se genera correctamente.</div>
        </article>

        <article id="servicio" class="card">
          <h2>6. Trabajo diario en el POS</h2>
          <p>El flujo normal de un servicio es sencillo:</p>
          <div class="pasos">
            <div class="paso">Abrir el POS.</div>
            <div class="paso">Seleccionar una mesa libre.</div>
            <div class="paso">Añadir bebidas o productos iniciales.</div>
            <div class="paso">Enviar comandas.</div>
            <div class="paso">Añadir más productos durante el servicio si el cliente lo pide.</div>
            <div class="paso">Pedir cuenta o precuenta.</div>
            <div class="paso">Cobrar y cerrar la mesa.</div>
          </div>
        </article>

        <article id="comandas" class="card">
          <h2>7. Enviar comandas</h2>
          <p>El botón <strong>Enviar comandas</strong> envía cada producto al destino correspondiente: bar, cocina, pizzeria u otros destinos configurados.</p>
          <h3>Comandas incrementales</h3>
          <p>Si una mesa ya envió 2 cervezas y luego se añade 1 cerveza más, el sistema solo envía la nueva unidad pendiente. Así se evitan duplicados.</p>
          <div class="alerta">Antes de cada servicio real, conviene hacer una prueba: una bebida al bar, un plato a cocina y un producto a otro destino si existe.</div>
        </article>

        <article id="cobro" class="card">
          <h2>8. Cobro y cierre de mesa</h2>
          <p>Al terminar el consumo, el camarero puede generar cuenta, cobrar y cerrar la mesa.</p>
          <div class="pasos">
            <div class="paso">Seleccionar la mesa.</div>
            <div class="paso">Revisar el pedido.</div>
            <div class="paso">Pulsar <strong>Cuenta</strong> o <strong>Cobrar</strong>.</div>
            <div class="paso">Registrar el pago: efectivo, tarjeta u otro método disponible.</div>
            <div class="paso">Cerrar mesa para dejarla libre de nuevo.</div>
          </div>
          <p>El sistema permite controlar pagos y dejar la mesa disponible para el siguiente cliente.</p>
        </article>

        <article id="caja" class="card">
          <h2>9. Caja diaria y cierre</h2>
          <p>La caja permite revisar ventas, métodos de pago y cierre diario.</p>
          <div class="pasos">
            <div class="paso">Entrar en <strong>Caja</strong> desde configuración o panel correspondiente.</div>
            <div class="paso">Revisar ventas del día.</div>
            <div class="paso">Comprobar efectivo, tarjeta y otros métodos.</div>
            <div class="paso">Generar cierre diario.</div>
            <div class="paso">Guardar o imprimir el resumen si es necesario.</div>
          </div>
        </article>

        <article id="movil" class="card">
          <h2>10. Vista móvil del camarero</h2>
          <p>El camarero puede usar un móvil o tablet dentro de la misma red del restaurante para abrir mesas, añadir productos y enviar comandas.</p>
          <div class="pasos">
            <div class="paso">El propietario crea un usuario camarero.</div>
            <div class="paso">El camarero entra desde el móvil.</div>
            <div class="paso">Selecciona mesa, añade productos y envía comandas.</div>
            <div class="paso">El POS del ordenador se actualiza automáticamente.</div>
          </div>
          <div class="tip">Recomendación: usar móviles o tablets del restaurante, no dispositivos personales si se quiere más control.</div>
        </article>

        <article id="usuarios" class="card">
          <h2>11. Usuarios y permisos</h2>
          <p>El sistema diferencia entre propietario/administrador y camarero.</p>
          <div class="grid">
            <div class="mini"><strong>Propietario / administrador</strong><span>Puede acceder a configuración, productos, mesas, caja, suscripción y gestión general.</span></div>
            <div class="mini"><strong>Camarero</strong><span>Puede trabajar con mesas, pedidos y comandas, pero no debe modificar la configuración general.</span></div>
          </div>
          <p>Cuando un trabajador deja el restaurante, se recomienda desactivar su usuario.</p>
        </article>

        <article id="faq" class="card">
          <h2>12. Preguntas frecuentes</h2>

          <h3>No aparece una mesa</h3>
          <p>Revise que la mesa exista, esté activa y pertenezca a una zona activa.</p>

          <h3>Un producto no sale en cocina o bar</h3>
          <p>Revise el destino del producto o de su categoría.</p>

          <h3>La impresora no imprime</h3>
          <p>Primero pruebe en modo preview. Si en preview se genera la comanda, el problema está en la conexión o configuración de la impresora.</p>

          <h3>El camarero no puede entrar</h3>
          <p>Revise que el usuario esté activo, que la contraseña sea correcta y que tenga rol camarero.</p>

          <h3>La mesa sigue ocupada después de cobrar</h3>
          <p>Revise que se haya completado el cierre de mesa. Una mesa cerrada debe quedar libre para volver a usarla.</p>

          <h3>Necesito ayuda</h3>
          <p>Puede escribir a <strong>${escapar(d.soporte)}</strong>. Incluya nombre del restaurante, problema, mesa afectada y una captura si es posible.</p>
        </article>
      </section>
    </div>

    <div class="footer">
      ${escapar(d.nombre)} · Soporte: <a href="mailto:${escapar(d.soporte)}">${escapar(d.soporte)}</a> · Contacto: <a href="mailto:${escapar(d.email)}">${escapar(d.email)}</a>
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
