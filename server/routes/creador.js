const express = require("express");

function creadorRoutes(db) {
  const router = express.Router();

  const EMAILS_CREADOR = String(process.env.CREADOR_EMAILS || "alessio84force@gmail.com")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  function escapar(valor) {
    return String(valor == null ? "" : valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizar(valor) {
    return String(valor == null ? "" : valor).trim();
  }

  function euro(valor) {
    return Number(valor || 0).toFixed(2) + " €";
  }

  function fecha(valor) {
    if (!valor) return "-";
    try {
      const d = new Date(valor);
      if (isNaN(d.getTime())) return String(valor);
      return d.toLocaleDateString("es-ES");
    } catch (e) {
      return String(valor);
    }
  }

  function diasRestantes(valor) {
    if (!valor) return null;
    const fin = new Date(valor);
    if (isNaN(fin.getTime())) return null;
    const hoy = new Date();
    const diff = fin.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function claseEstado(estado) {
    const e = String(estado || "").toLowerCase();
    if (e.includes("activo") || e.includes("pagado") || e.includes("gratis")) return "ok";
    if (e.includes("expirado") || e.includes("bloqueado") || e.includes("eliminado")) return "danger";
    if (e.includes("pendiente")) return "warn";
    return "trial";
  }

  function estadoComercial(cliente) {
    const estado = String(
      cliente.suscripcion_estado ||
      cliente.restaurante_estado ||
      cliente.plan_tipo ||
      ""
    ).toLowerCase();

    const trialFin = cliente.trial_fin || cliente.restaurante_trial_fin;
    const dias = diasRestantes(trialFin);

    if (estado === "activo" || estado === "pagado") return "activo";
    if (estado === "gratis_vida") return "gratis_vida";
    if (estado === "stripe_pendiente") return "pendiente_pago";
    if (dias !== null && dias < 0) return "trial_expirado";
    if (estado === "trial" || estado === "prueba" || dias !== null) return "trial";
    return estado || "sin_estado";
  }

  function fiscalCompleto(cliente) {
    return Number(cliente.datos_fiscales_completos || cliente.config_datos_fiscales_completos || 0) === 1;
  }

  function requireCreador(req, res, next) {
    if (!req.session || !req.session.usuario) {
      return res.redirect("/login");
    }

    const email = String(req.session.usuario.email || "").toLowerCase();
    const rol = String(req.session.usuario.rol || "").toLowerCase();

    if (EMAILS_CREADOR.includes(email) && rol === "admin") {
      return next();
    }

    return res.status(403).send(`
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Acceso creador denegado</title>
        <style>
          body{font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:30px;color:#111827;}
          .box{max-width:560px;margin:90px auto;background:#fff;border-radius:24px;padding:30px;box-shadow:0 18px 44px rgba(15,23,42,.14);text-align:center;}
          a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:14px;background:#111827;color:#fff;text-decoration:none;font-weight:900;}
          p{color:#6b7280;font-weight:700;line-height:1.5;}
        </style>
      </head>
      <body>
        <div class="box">
          <h1>Acceso no autorizado</h1>
          <p>Esta zona está reservada al creador del sistema.</p>
          <a href="/configuracion">Volver</a>
        </div>
      </body>
      </html>
    `);
  }

  function all(sql, params) {
    return new Promise((resolve, reject) => {
      db.all(sql, params || [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  function get(sql, params) {
    return new Promise((resolve, reject) => {
      db.get(sql, params || [], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  async function asegurarTablasComerciales() {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS creador_pagos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER,
            propietario_email TEXT,
            concepto TEXT,
            importe REAL DEFAULT 0,
            moneda TEXT DEFAULT 'EUR',
            estado TEXT DEFAULT 'pendiente',
            stripe_payment_id TEXT,
            stripe_invoice_id TEXT,
            creado_en TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `, [], err => err ? reject(err) : resolve());
      });
    });
  }

  async function cargarClientes() {
    await asegurarTablasComerciales();

    return all(`
      SELECT
        r.id AS restaurante_id,
        r.nombre AS restaurante_nombre,
        r.propietario_nombre AS restaurante_propietario_nombre,
        r.propietario_email AS restaurante_propietario_email,
        r.propietario_telefono AS restaurante_propietario_telefono,
        r.nif AS restaurante_nif,
        r.direccion AS restaurante_direccion,
        r.estado AS restaurante_estado,
        r.trial_inicio AS restaurante_trial_inicio,
        r.trial_fin AS restaurante_trial_fin,
        r.plan_tipo AS restaurante_plan_tipo,
        r.promocion_aplicada AS restaurante_promocion_aplicada,
        r.stripe_customer_id AS restaurante_stripe_customer_id,
        r.stripe_subscription_id AS restaurante_stripe_subscription_id,
        r.creado_en AS restaurante_creado_en,
        r.actualizado_en AS restaurante_actualizado_en,
        r.razon_social,
        r.codigo_postal,
        r.ciudad,
        r.provincia,
        r.pais,
        r.email_facturacion,
        r.datos_fiscales_completos,

        c.id AS config_id,
        c.nome_ristorante,
        c.partita_iva,
        c.indirizzo,
        c.telefono,
        c.email AS config_email,
        c.suscripcion_estado,
        c.trial_inicio,
        c.trial_fin,
        c.plan_tipo,
        c.promocion_aplicada,
        c.suscripcion_activada_en,
        c.stripe_customer_id,
        c.stripe_subscription_id,
        c.ultimo_pago_stripe_en,
        c.proximo_pago_stripe_en,
        c.propietario_nombre AS config_propietario_nombre,
        c.propietario_email AS config_propietario_email,
        c.propietario_telefono AS config_propietario_telefono,
        c.datos_fiscales_completos AS config_datos_fiscales_completos,

        (SELECT COUNT(*) FROM usuarios u WHERE u.restaurante_id = r.id) AS total_usuarios,
        (SELECT COUNT(*) FROM usuarios u WHERE u.restaurante_id = r.id AND COALESCE(u.activo,1)=1) AS usuarios_activos,
        (SELECT COUNT(*) FROM mesas m WHERE m.restaurante_id = r.id) AS total_mesas,
        (SELECT COUNT(*) FROM productos p WHERE p.restaurante_id = r.id) AS total_productos,
        (SELECT COUNT(*) FROM pedidos pe WHERE pe.restaurante_id = r.id) AS total_pedidos,
        (SELECT COUNT(*) FROM pagos pa WHERE pa.restaurante_id = r.id) AS total_pagos,
        (SELECT COALESCE(SUM(pa.importe),0) FROM pagos pa WHERE pa.restaurante_id = r.id) AS total_ventas
      FROM restaurantes r
      LEFT JOIN configurazione c ON c.restaurante_id = r.id
      ORDER BY r.id DESC
    `, []);
  }

  async function cargarClienteDetalle(id) {
    const cliente = await get(`
      SELECT
        r.id AS restaurante_id,
        r.nombre AS restaurante_nombre,
        r.propietario_nombre AS restaurante_propietario_nombre,
        r.propietario_email AS restaurante_propietario_email,
        r.propietario_telefono AS restaurante_propietario_telefono,
        r.nif AS restaurante_nif,
        r.direccion AS restaurante_direccion,
        r.estado AS restaurante_estado,
        r.trial_inicio AS restaurante_trial_inicio,
        r.trial_fin AS restaurante_trial_fin,
        r.plan_tipo AS restaurante_plan_tipo,
        r.promocion_aplicada AS restaurante_promocion_aplicada,
        r.stripe_customer_id AS restaurante_stripe_customer_id,
        r.stripe_subscription_id AS restaurante_stripe_subscription_id,
        r.creado_en AS restaurante_creado_en,
        r.actualizado_en AS restaurante_actualizado_en,
        r.razon_social,
        r.codigo_postal,
        r.ciudad,
        r.provincia,
        r.pais,
        r.email_facturacion,
        r.datos_fiscales_completos,

        c.id AS config_id,
        c.nome_ristorante,
        c.partita_iva,
        c.indirizzo,
        c.telefono,
        c.email AS config_email,
        c.suscripcion_estado,
        c.trial_inicio,
        c.trial_fin,
        c.plan_tipo,
        c.promocion_aplicada,
        c.suscripcion_activada_en,
        c.stripe_customer_id,
        c.stripe_subscription_id,
        c.ultimo_pago_stripe_en,
        c.proximo_pago_stripe_en,
        c.propietario_nombre AS config_propietario_nombre,
        c.propietario_email AS config_propietario_email,
        c.propietario_telefono AS config_propietario_telefono,
        c.datos_fiscales_completos AS config_datos_fiscales_completos
      FROM restaurantes r
      LEFT JOIN configurazione c ON c.restaurante_id = r.id
      WHERE r.id = ?
      LIMIT 1
    `, [id]);

    if (!cliente) return null;

    const usuarios = await all(`
      SELECT id,nombre,email,rol,activo,creado_en
      FROM usuarios
      WHERE restaurante_id = ?
      ORDER BY id
    `, [id]);

    const pedidos = await all(`
      SELECT id,mesa_id,estado,total,creado_en,pagado_en
      FROM pedidos
      WHERE restaurante_id = ?
      ORDER BY id DESC
      LIMIT 20
    `, [id]);

    const pagos = await all(`
      SELECT id,pedido_id,metodo,importe,fecha,tpv,referencia
      FROM pagos
      WHERE restaurante_id = ?
      ORDER BY id DESC
      LIMIT 20
    `, [id]);

    const metricas = await get(`
      SELECT
        (SELECT COUNT(*) FROM usuarios WHERE restaurante_id = ?) AS total_usuarios,
        (SELECT COUNT(*) FROM mesas WHERE restaurante_id = ?) AS total_mesas,
        (SELECT COUNT(*) FROM productos WHERE restaurante_id = ?) AS total_productos,
        (SELECT COUNT(*) FROM pedidos WHERE restaurante_id = ?) AS total_pedidos,
        (SELECT COUNT(*) FROM pagos WHERE restaurante_id = ?) AS total_pagos,
        (SELECT COALESCE(SUM(importe),0) FROM pagos WHERE restaurante_id = ?) AS total_ventas
    `, [id, id, id, id, id, id]);

    return { cliente, usuarios, pedidos, pagos, metricas: metricas || {} };
  }

  function htmlLayout(titulo, contenido) {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)} - Panel Creador</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Arial,Helvetica,sans-serif;
      background:
        radial-gradient(circle at 10% 8%, rgba(245,158,11,.20), transparent 30%),
        radial-gradient(circle at 86% 14%, rgba(168,85,247,.18), transparent 28%),
        linear-gradient(135deg,#0f172a 0%,#111827 32%,#f8fafc 32%,#f3f4f6 100%);
      color:#111827;
    }
    .wrap{max-width:1260px;margin:0 auto;padding:24px 18px 60px}
    .hero{
      position:relative;
      overflow:hidden;
      border-radius:30px;
      padding:26px;
      background:
        linear-gradient(135deg,rgba(17,24,39,.96),rgba(124,45,18,.76)),
        radial-gradient(circle at 92% 18%, rgba(245,158,11,.60), transparent 32%);
      color:white;
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
    .hero h1{margin:0 0 8px;font-size:34px;letter-spacing:-.045em;line-height:1.02}
    .hero p{margin:0;color:#ffedd5;line-height:1.5;max-width:820px}
    .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
    a.btn,button{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:40px;
      padding:0 14px;
      border:0;
      border-radius:13px;
      background:linear-gradient(135deg,#f59e0b,#7c2d12);
      color:white;
      text-decoration:none;
      font-weight:900;
      box-shadow:0 10px 24px rgba(15,23,42,.14);
      cursor:pointer;
    }
    a.btn.sec,button.sec{background:linear-gradient(135deg,#ffffff,#ffedd5);color:#111827}
    .stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:16px}
    .stat,.card{
      background:rgba(255,255,255,.94);
      border:1px solid rgba(229,231,235,.92);
      border-radius:24px;
      box-shadow:0 14px 36px rgba(15,23,42,.09);
      backdrop-filter:blur(12px);
    }
    .stat{padding:16px}
    .stat strong{display:block;font-size:25px;letter-spacing:-.04em;color:#111827}
    .stat span{display:block;color:#6b7280;font-size:13px;font-weight:800;margin-top:3px}
    .card{padding:18px;margin-bottom:16px}
    .card h2{margin:0 0 12px;font-size:23px;letter-spacing:-.04em}
    .toolbar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px}
    input,select,textarea{
      width:100%;
      border:1px solid #d1d5db;
      border-radius:14px;
      padding:11px 12px;
      background:linear-gradient(180deg,#ffffff,#f9fafb);
      font-weight:700;
    }
    .search{max-width:420px}
    table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border-radius:18px;background:white}
    th,td{padding:12px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
    th{background:#f9fafb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
    tr:last-child td{border-bottom:0}
    .muted{color:#6b7280;font-size:13px;line-height:1.45}
    .strong{font-weight:900;color:#111827}
    .badge{
      display:inline-flex;
      align-items:center;
      min-height:25px;
      padding:0 9px;
      border-radius:999px;
      font-size:12px;
      font-weight:900;
      border:1px solid transparent;
      white-space:nowrap;
    }
    .badge.ok{background:#ecfdf5;color:#166534;border-color:#bbf7d0}
    .badge.warn{background:#fff7ed;color:#92400e;border-color:#fed7aa}
    .badge.danger{background:#fef2f2;color:#991b1b;border-color:#fecaca}
    .badge.trial{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .mini{border:1px solid #e5e7eb;border-radius:18px;padding:14px;background:linear-gradient(180deg,#ffffff,#f9fafb)}
    .mini strong{display:block;margin-bottom:5px}
    .mini span{color:#4b5563;line-height:1.5}
    .mono{font-family:Menlo,Consolas,monospace;font-size:12px}
    @media(max-width:950px){
      body{background:#f3f4f6}
      .stats{grid-template-columns:repeat(2,minmax(0,1fr))}
      .grid{grid-template-columns:1fr}
      table{display:block;overflow-x:auto}
    }
  </style>
</head>
<body>
  <main class="wrap">
    ${contenido}
  </main>
</body>
</html>`;
  }

  function renderPanel(clientes, filtro) {
    const q = normalizar(filtro).toLowerCase();

    const filtrados = q
      ? clientes.filter(c => [
          c.restaurante_id,
          c.restaurante_nombre,
          c.nome_ristorante,
          c.restaurante_propietario_nombre,
          c.config_propietario_nombre,
          c.restaurante_propietario_email,
          c.config_propietario_email,
          c.restaurante_nif,
          c.partita_iva,
          c.razon_social,
          c.email_facturacion
        ].some(v => String(v || "").toLowerCase().includes(q)))
      : clientes;

    const total = filtrados.length;
    const activos = filtrados.filter(c => ["activo","gratis_vida"].includes(estadoComercial(c))).length;
    const trial = filtrados.filter(c => estadoComercial(c) === "trial").length;
    const expirados = filtrados.filter(c => estadoComercial(c) === "trial_expirado").length;
    const fiscalesOk = filtrados.filter(fiscalCompleto).length;
    const ventas = filtrados.reduce((acc,c) => acc + Number(c.total_ventas || 0), 0);

    const filas = filtrados.map(c => {
      const estado = estadoComercial(c);
      const fiscal = fiscalCompleto(c);
      const nombre = c.nome_ristorante || c.restaurante_nombre || "Restaurante";
      const propietario = c.config_propietario_nombre || c.restaurante_propietario_nombre || "-";
      const email = c.config_propietario_email || c.restaurante_propietario_email || c.email_facturacion || "-";
      const nif = c.partita_iva || c.restaurante_nif || "-";
      const trialFin = c.trial_fin || c.restaurante_trial_fin || "";
      const dias = diasRestantes(trialFin);

      return `
        <tr>
          <td>
            <div class="strong">#${escapar(c.restaurante_id)} · ${escapar(nombre)}</div>
            <div class="muted">${escapar(c.razon_social || "Sin razón social")}</div>
            <div class="muted">NIF/CIF: ${escapar(nif)}</div>
          </td>
          <td>
            <div class="strong">${escapar(propietario)}</div>
            <div class="muted">${escapar(email)}</div>
            <div class="muted">${escapar(c.telefono || c.restaurante_propietario_telefono || "-")}</div>
          </td>
          <td>
            <span class="badge ${claseEstado(estado)}">${escapar(estado)}</span>
            <div class="muted">Trial fin: ${escapar(fecha(trialFin))}</div>
            <div class="muted">${dias == null ? "" : (dias >= 0 ? dias + " días restantes" : Math.abs(dias) + " días vencido")}</div>
          </td>
          <td>
            <span class="badge ${fiscal ? "ok" : "warn"}">${fiscal ? "fiscal completo" : "fiscal pendiente"}</span>
            <div class="muted">${escapar(c.email_facturacion || "-")}</div>
            <div class="muted">${escapar([c.ciudad,c.provincia,c.pais].filter(Boolean).join(", ") || "-")}</div>
          </td>
          <td>
            <div class="muted">Usuarios: <strong>${Number(c.total_usuarios || 0)}</strong> / activos ${Number(c.usuarios_activos || 0)}</div>
            <div class="muted">Mesas: <strong>${Number(c.total_mesas || 0)}</strong></div>
            <div class="muted">Productos: <strong>${Number(c.total_productos || 0)}</strong></div>
            <div class="muted">Pedidos: <strong>${Number(c.total_pedidos || 0)}</strong></div>
          </td>
          <td>
            <div class="strong">${euro(c.total_ventas)}</div>
            <div class="muted">Pagos POS: ${Number(c.total_pagos || 0)}</div>
          </td>
          <td>
            <a class="btn sec" href="/creador/cliente/${encodeURIComponent(c.restaurante_id)}">Ver ficha</a>
          </td>
        </tr>
      `;
    }).join("");

    return htmlLayout("Panel Creador", `
      <section class="hero">
        <h1>Panel Creador SaaS</h1>
        <p>Control interno de clientes Restaurant Service POS: datos fiscales, trial, suscripción, usuarios, mesas, productos, pedidos y actividad básica por restaurante.</p>
        <div class="actions">
          <a class="btn sec" href="/configuracion">Volver a configuración</a>
          <a class="btn" href="/creador">Actualizar</a>
        </div>
      </section>

      <section class="stats">
        <div class="stat"><strong>${total}</strong><span>Clientes</span></div>
        <div class="stat"><strong>${activos}</strong><span>Activos / gratis</span></div>
        <div class="stat"><strong>${trial}</strong><span>En trial</span></div>
        <div class="stat"><strong>${expirados}</strong><span>Trial vencido</span></div>
        <div class="stat"><strong>${fiscalesOk}/${total}</strong><span>Fiscales completos</span></div>
      </section>

      <section class="card">
        <div class="toolbar">
          <h2>Clientes SaaS</h2>
          <form method="GET" action="/creador" class="search">
            <input name="q" value="${escapar(filtro || "")}" placeholder="Buscar por restaurante, email, NIF, razón social...">
          </form>
        </div>
        <div class="muted" style="margin-bottom:12px;">Ventas POS registradas en restaurantes filtrados: <strong>${euro(ventas)}</strong></div>
        <table>
          <thead>
            <tr>
              <th>Restaurante</th>
              <th>Propietario</th>
              <th>Estado</th>
              <th>Fiscal</th>
              <th>Uso</th>
              <th>Ventas POS</th>
              <th>Ficha</th>
            </tr>
          </thead>
          <tbody>
            ${filas || `<tr><td colspan="7" class="muted">No hay clientes con ese filtro.</td></tr>`}
          </tbody>
        </table>
      </section>

      <section class="card">
        <h2>Próximas acciones</h2>
        <div class="grid">
          <div class="mini"><strong>M3 — Suspender / Reactivar</strong><span>Bloquear el acceso de un cliente sin borrar sus datos.</span></div>
          <div class="mini"><strong>M4 — Eliminar cliente</strong><span>Crear backup, desactivar usuarios y marcar cliente como eliminado.</span></div>
          <div class="mini"><strong>M5 — Extender trial</strong><span>Modificar manualmente la fecha de prueba de un restaurante.</span></div>
          <div class="mini"><strong>M6 — Historial administrativo</strong><span>Registrar acciones hechas desde el panel creador.</span></div>
        </div>
      </section>
    `);
  }

  function renderDetalle(data) {
    const c = data.cliente;
    const m = data.metricas || {};
    const estado = estadoComercial(c);
    const fiscal = fiscalCompleto(c);
    const nombre = c.nome_ristorante || c.restaurante_nombre || "Restaurante";
    const propietario = c.config_propietario_nombre || c.restaurante_propietario_nombre || "-";
    const email = c.config_propietario_email || c.restaurante_propietario_email || c.email_facturacion || "-";
    const nif = c.partita_iva || c.restaurante_nif || "-";

    const usuariosHtml = data.usuarios.map(u => `
      <tr>
        <td>#${escapar(u.id)}</td>
        <td>${escapar(u.nombre)}</td>
        <td>${escapar(u.email)}</td>
        <td>${escapar(u.rol)}</td>
        <td><span class="badge ${Number(u.activo || 0) === 1 ? "ok" : "danger"}">${Number(u.activo || 0) === 1 ? "activo" : "inactivo"}</span></td>
      </tr>
    `).join("");

    const pedidosHtml = data.pedidos.map(p => `
      <tr>
        <td>#${escapar(p.id)}</td>
        <td>${escapar(p.mesa_id || "-")}</td>
        <td><span class="badge ${claseEstado(p.estado)}">${escapar(p.estado)}</span></td>
        <td>${euro(p.total)}</td>
        <td>${escapar(fecha(p.creado_en))}</td>
      </tr>
    `).join("");

    const pagosHtml = data.pagos.map(p => `
      <tr>
        <td>#${escapar(p.id)}</td>
        <td>${escapar(p.metodo)}</td>
        <td>${euro(p.importe)}</td>
        <td>${escapar(fecha(p.fecha))}</td>
        <td class="mono">${escapar(p.referencia || "-")}</td>
      </tr>
    `).join("");

    return htmlLayout("Ficha cliente", `
      <section class="hero">
        <h1>${escapar(nombre)}</h1>
        <p>Ficha interna del cliente SaaS #${escapar(c.restaurante_id)}. Vista de datos fiscales, suscripción, usuarios y actividad operativa.</p>
        <div class="actions">
          <a class="btn sec" href="/creador">Volver al panel</a>
          <a class="btn sec" href="/configuracion">Configuración</a>
        </div>
      </section>

      <section class="stats">
        <div class="stat"><strong>${Number(m.total_usuarios || 0)}</strong><span>Usuarios</span></div>
        <div class="stat"><strong>${Number(m.total_mesas || 0)}</strong><span>Mesas</span></div>
        <div class="stat"><strong>${Number(m.total_productos || 0)}</strong><span>Productos</span></div>
        <div class="stat"><strong>${Number(m.total_pedidos || 0)}</strong><span>Pedidos</span></div>
        <div class="stat"><strong>${euro(m.total_ventas)}</strong><span>Ventas POS</span></div>
      </section>

      <section class="card">
        <h2>Datos principales</h2>
        <div class="grid">
          <div class="mini"><strong>Restaurante</strong><span>${escapar(nombre)}</span></div>
          <div class="mini"><strong>Propietario</strong><span>${escapar(propietario)}<br>${escapar(email)}</span></div>
          <div class="mini"><strong>Estado</strong><span><span class="badge ${claseEstado(estado)}">${escapar(estado)}</span></span></div>
          <div class="mini"><strong>Fiscal</strong><span><span class="badge ${fiscal ? "ok" : "warn"}">${fiscal ? "completo" : "pendiente"}</span></span></div>
        </div>
      </section>

      <section class="card">
        <h2>Datos fiscales</h2>
        <div class="grid">
          <div class="mini"><strong>Razón social</strong><span>${escapar(c.razon_social || "-")}</span></div>
          <div class="mini"><strong>NIF/CIF/VAT</strong><span>${escapar(nif)}</span></div>
          <div class="mini"><strong>Dirección fiscal</strong><span>${escapar(c.indirizzo || c.restaurante_direccion || "-")}</span></div>
          <div class="mini"><strong>Ciudad</strong><span>${escapar([c.codigo_postal,c.ciudad,c.provincia,c.pais].filter(Boolean).join(", ") || "-")}</span></div>
          <div class="mini"><strong>Email facturación</strong><span>${escapar(c.email_facturacion || "-")}</span></div>
          <div class="mini"><strong>Teléfono</strong><span>${escapar(c.telefono || c.restaurante_propietario_telefono || "-")}</span></div>
        </div>
      </section>

      <section class="card">
        <h2>Suscripción / trial</h2>
        <div class="grid">
          <div class="mini"><strong>Estado suscripción</strong><span>${escapar(c.suscripcion_estado || c.restaurante_estado || "-")}</span></div>
          <div class="mini"><strong>Plan</strong><span>${escapar(c.plan_tipo || c.restaurante_plan_tipo || "-")}</span></div>
          <div class="mini"><strong>Trial inicio</strong><span>${escapar(fecha(c.trial_inicio || c.restaurante_trial_inicio))}</span></div>
          <div class="mini"><strong>Trial fin</strong><span>${escapar(fecha(c.trial_fin || c.restaurante_trial_fin))}</span></div>
          <div class="mini"><strong>Stripe customer</strong><span class="mono">${escapar(c.stripe_customer_id || c.restaurante_stripe_customer_id || "-")}</span></div>
          <div class="mini"><strong>Stripe subscription</strong><span class="mono">${escapar(c.stripe_subscription_id || c.restaurante_stripe_subscription_id || "-")}</span></div>
        </div>
      </section>

      <section class="card">
        <h2>Usuarios</h2>
        <table>
          <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr></thead>
          <tbody>${usuariosHtml || `<tr><td colspan="5" class="muted">Sin usuarios.</td></tr>`}</tbody>
        </table>
      </section>

      <section class="card">
        <h2>Últimos pedidos</h2>
        <table>
          <thead><tr><th>ID</th><th>Mesa</th><th>Estado</th><th>Total</th><th>Fecha</th></tr></thead>
          <tbody>${pedidosHtml || `<tr><td colspan="5" class="muted">Sin pedidos.</td></tr>`}</tbody>
        </table>
      </section>

      <section class="card">
        <h2>Últimos pagos POS</h2>
        <table>
          <thead><tr><th>ID</th><th>Método</th><th>Importe</th><th>Fecha</th><th>Referencia</th></tr></thead>
          <tbody>${pagosHtml || `<tr><td colspan="5" class="muted">Sin pagos.</td></tr>`}</tbody>
        </table>
      </section>

      <section class="card">
        <h2>Acciones administrativas</h2>
        <div class="grid">
          <div class="mini"><strong>Próximo paso M3</strong><span>Añadiremos suspender y reactivar cliente.</span></div>
          <div class="mini"><strong>Próximo paso M4</strong><span>Añadiremos eliminación segura con backup previo.</span></div>
        </div>
      </section>
    `);
  }

  router.get("/api/creador/soy-creador", function(req, res) {
    if (!req.session || !req.session.usuario) {
      return res.json({ creador: false });
    }

    const email = String(req.session.usuario.email || "").toLowerCase();
    const rol = String(req.session.usuario.rol || "").toLowerCase();

    return res.json({
      creador: EMAILS_CREADOR.includes(email) && rol === "admin",
      email: req.session.usuario.email || "",
      rol: req.session.usuario.rol || ""
    });
  });

  router.get("/creador", requireCreador, async function(req, res) {
    try {
      const clientes = await cargarClientes();
      res.send(renderPanel(clientes, req.query.q || ""));
    } catch (err) {
      console.error("Error Panel Creador SaaS:", err);
      res.status(500).send("Error cargando Panel Creador SaaS: " + escapar(err.message));
    }
  });

  router.get("/creador/cliente/:id", requireCreador, async function(req, res) {
    try {
      const id = Number(req.params.id || 0);
      if (!id) return res.status(400).send("Cliente no válido");

      const data = await cargarClienteDetalle(id);
      if (!data) return res.status(404).send("Cliente no encontrado");

      res.send(renderDetalle(data));
    } catch (err) {
      console.error("Error ficha cliente creador:", err);
      res.status(500).send("Error cargando ficha cliente: " + escapar(err.message));
    }
  });

  return router;
}

module.exports = creadorRoutes;
