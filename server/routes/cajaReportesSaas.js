const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function euro(valor) {
  return Number(valor || 0).toFixed(2) + " €";
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function mesISO() {
  return new Date().toISOString().slice(0, 7);
}

function requiereCaja(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/login");
  }

  const rol = String(req.session.usuario.rol || "").toLowerCase();

  if (rol !== "admin" && rol !== "gerente") {
    return res.status(403).send("No tienes permisos para ver caja o reportes.");
  }

  return next();
}

function all(db, sql, params) {
  return new Promise((resolve) => {
    db.all(sql, params || [], function(err, rows) {
      if (err) {
        console.error("[cajaReportesSaas] SQL all:", err.message);
        return resolve([]);
      }

      resolve(rows || []);
    });
  });
}

function get(db, sql, params) {
  return new Promise((resolve) => {
    db.get(sql, params || [], function(err, row) {
      if (err) {
        console.error("[cajaReportesSaas] SQL get:", err.message);
        return resolve(null);
      }

      resolve(row || null);
    });
  });
}

function run(db, sql, params) {
  return new Promise((resolve) => {
    db.run(sql, params || [], function(err) {
      if (err) {
        console.error("[cajaReportesSaas] SQL run:", err.message);
        return resolve({ ok: false, error: err.message });
      }

      resolve({ ok: true, id: this.lastID, changes: this.changes });
    });
  });
}

function normalizarMetodo(metodo) {
  const m = String(metodo || "otros").toLowerCase();

  if (m.includes("efectivo") || m.includes("cash")) return "efectivo";
  if (m.includes("tarjeta") || m.includes("card") || m.includes("tpv")) return "tarjeta";
  if (m.includes("bizum")) return "bizum";

  return "otros";
}

async function resumenDia(db, restauranteId, fecha) {
  const pagos = await all(
    db,
    `SELECT
      pagos.id,
      pagos.pedido_id,
      pagos.metodo,
      pagos.importe,
      pagos.fecha,
      pagos.tpv,
      pagos.referencia,
      mesas.numero AS mesa,
      pedidos.total AS pedido_total
    FROM pagos
    LEFT JOIN pedidos
      ON pedidos.id = pagos.pedido_id
      AND COALESCE(pedidos.restaurante_id,1)=?
    LEFT JOIN mesas
      ON mesas.id = pedidos.mesa_id
      AND COALESCE(mesas.restaurante_id,1)=?
    WHERE COALESCE(pagos.restaurante_id,1)=?
    AND substr(pagos.fecha,1,10)=?
    ORDER BY pagos.fecha DESC, pagos.id DESC`,
    [restauranteId, restauranteId, restauranteId, fecha]
  );

  const pedidos = await all(
    db,
    `SELECT id, mesa_id, total, estado, creado_en, pagado_en
     FROM pedidos
     WHERE COALESCE(restaurante_id,1)=?
     AND estado='cerrado'
     AND (
       substr(COALESCE(pagado_en, creado_en),1,10)=?
       OR substr(creado_en,1,10)=?
     )
     ORDER BY COALESCE(pagado_en, creado_en) DESC, id DESC`,
    [restauranteId, fecha, fecha]
  );

  const resumen = {
    fecha: fecha,
    pagos: pagos,
    pedidos: pedidos,
    pagos_registrados: pagos.length,
    pedidos_cerrados: pedidos.length,
    efectivo: 0,
    tarjeta: 0,
    bizum: 0,
    otros: 0,
    total_pagos: 0,
    total_pedidos_cerrados: 0,
    total_caja: 0,
    ticket_medio: 0
  };

  pagos.forEach((p) => {
    const metodo = normalizarMetodo(p.metodo);
    const importe = Number(p.importe || 0);

    resumen[metodo] += importe;
    resumen.total_pagos += importe;
  });

  pedidos.forEach((p) => {
    resumen.total_pedidos_cerrados += Number(p.total || 0);
  });

  resumen.total_caja = resumen.total_pagos > 0 ? resumen.total_pagos : resumen.total_pedidos_cerrados;
  resumen.ticket_medio = resumen.pedidos_cerrados > 0 ? resumen.total_caja / resumen.pedidos_cerrados : 0;

  return resumen;
}

async function resumenMes(db, restauranteId, mes) {
  const pagos = await all(
    db,
    `SELECT metodo, importe, pedido_id, fecha
     FROM pagos
     WHERE COALESCE(restaurante_id,1)=?
     AND substr(fecha,1,7)=?`,
    [restauranteId, mes]
  );

  const pedidos = await all(
    db,
    `SELECT id, total, estado, creado_en, pagado_en
     FROM pedidos
     WHERE COALESCE(restaurante_id,1)=?
     AND estado='cerrado'
     AND (
       substr(COALESCE(pagado_en, creado_en),1,7)=?
       OR substr(creado_en,1,7)=?
     )`,
    [restauranteId, mes, mes]
  );

  const resumen = {
    mes: mes,
    pagos_registrados: pagos.length,
    pedidos_cerrados: pedidos.length,
    efectivo: 0,
    tarjeta: 0,
    bizum: 0,
    otros: 0,
    total_pagos: 0,
    total_pedidos_cerrados: 0,
    total_caja: 0,
    ticket_medio: 0
  };

  pagos.forEach((p) => {
    const metodo = normalizarMetodo(p.metodo);
    const importe = Number(p.importe || 0);

    resumen[metodo] += importe;
    resumen.total_pagos += importe;
  });

  pedidos.forEach((p) => {
    resumen.total_pedidos_cerrados += Number(p.total || 0);
  });

  resumen.total_caja = resumen.total_pagos > 0 ? resumen.total_pagos : resumen.total_pedidos_cerrados;
  resumen.ticket_medio = resumen.pedidos_cerrados > 0 ? resumen.total_caja / resumen.pedidos_cerrados : 0;

  return resumen;
}

async function guardarCierre(db, restauranteId, tipo, periodo, resumen, body) {
  const existente = await get(
    db,
    `SELECT id
     FROM cierres_caja
     WHERE tipo=?
     AND periodo=?
     AND COALESCE(restaurante_id,1)=?
     ORDER BY id DESC
     LIMIT 1`,
    [tipo, periodo, restauranteId]
  );

  const efectivoContado = Number((body || {}).efectivo_contado || 0);
  const diferencia = efectivoContado - Number(resumen.efectivo || 0);
  const observaciones = String((body || {}).observaciones || "").trim();

  if (existente) {
    await run(
      db,
      `UPDATE cierres_caja
       SET fecha=?,
           total_ventas=?,
           pedidos_cerrados=?,
           ticket_medio=?,
           efectivo=?,
           tarjeta=?,
           bizum=?,
           otros=?,
           total_pagos=?,
           efectivo_contado=?,
           diferencia_efectivo=?,
           observaciones=?
       WHERE id=?
       AND COALESCE(restaurante_id,1)=?`,
      [
        tipo === "diario" ? periodo : periodo + "-01",
        resumen.total_caja,
        resumen.pedidos_cerrados,
        resumen.ticket_medio,
        resumen.efectivo,
        resumen.tarjeta,
        resumen.bizum,
        resumen.otros,
        resumen.total_pagos,
        efectivoContado,
        diferencia,
        observaciones,
        existente.id,
        restauranteId
      ]
    );

    return existente.id;
  }

  const creado = await run(
    db,
    `INSERT INTO cierres_caja
     (fecha, total_ventas, pedidos_cerrados, ticket_medio, tipo, periodo, efectivo, tarjeta, otros, total_pagos, bizum, efectivo_contado, diferencia_efectivo, observaciones, restaurante_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tipo === "diario" ? periodo : periodo + "-01",
      resumen.total_caja,
      resumen.pedidos_cerrados,
      resumen.ticket_medio,
      tipo,
      periodo,
      resumen.efectivo,
      resumen.tarjeta,
      resumen.otros,
      resumen.total_pagos,
      resumen.bizum,
      efectivoContado,
      diferencia,
      observaciones,
      restauranteId
    ]
  );

  return creado.id;
}

async function ultimosCierres(db, restauranteId) {
  return all(
    db,
    `SELECT *
     FROM cierres_caja
     WHERE COALESCE(restaurante_id,1)=?
     ORDER BY creado_en DESC, id DESC
     LIMIT 20`,
    [restauranteId]
  );
}

async function ventasProductos(db, restauranteId, desde, hasta) {
  return all(
    db,
    `SELECT
      productos.nombre AS producto,
      categorias.nombre AS categoria,
      COALESCE(SUM(pedido_lineas.cantidad),0) AS unidades,
      COALESCE(SUM(pedido_lineas.cantidad * pedido_lineas.precio),0) AS total
    FROM pedido_lineas
    JOIN pedidos
      ON pedidos.id = pedido_lineas.pedido_id
      AND COALESCE(pedidos.restaurante_id,1)=?
    JOIN productos
      ON productos.id = pedido_lineas.producto_id
      AND COALESCE(productos.restaurante_id,1)=?
    LEFT JOIN categorias
      ON categorias.id = productos.categoria_id
      AND COALESCE(categorias.restaurante_id,1)=?
    WHERE COALESCE(pedido_lineas.restaurante_id,1)=?
    AND substr(COALESCE(pedidos.pagado_en, pedidos.creado_en),1,10) BETWEEN ? AND ?
    GROUP BY productos.id, productos.nombre, categorias.nombre
    ORDER BY total DESC, unidades DESC, producto COLLATE NOCASE`,
    [restauranteId, restauranteId, restauranteId, restauranteId, desde, hasta]
  );
}

async function pedidosReporte(db, restauranteId, desde, hasta) {
  return all(
    db,
    `SELECT
      pedidos.id,
      mesas.numero AS mesa,
      pedidos.estado,
      pedidos.total,
      pedidos.metodo_pago,
      pedidos.creado_en,
      pedidos.pagado_en
    FROM pedidos
    LEFT JOIN mesas
      ON mesas.id = pedidos.mesa_id
      AND COALESCE(mesas.restaurante_id,1)=?
    WHERE COALESCE(pedidos.restaurante_id,1)=?
    AND substr(COALESCE(pedidos.pagado_en, pedidos.creado_en),1,10) BETWEEN ? AND ?
    ORDER BY COALESCE(pedidos.pagado_en, pedidos.creado_en) DESC, pedidos.id DESC`,
    [restauranteId, restauranteId, desde, hasta]
  );
}

async function pagosReporte(db, restauranteId, desde, hasta) {
  return all(
    db,
    `SELECT
      pagos.id,
      pagos.pedido_id,
      mesas.numero AS mesa,
      pagos.metodo,
      pagos.importe,
      pagos.fecha,
      pagos.tpv,
      pagos.referencia
    FROM pagos
    LEFT JOIN pedidos
      ON pedidos.id = pagos.pedido_id
      AND COALESCE(pedidos.restaurante_id,1)=?
    LEFT JOIN mesas
      ON mesas.id = pedidos.mesa_id
      AND COALESCE(mesas.restaurante_id,1)=?
    WHERE COALESCE(pagos.restaurante_id,1)=?
    AND substr(pagos.fecha,1,10) BETWEEN ? AND ?
    ORDER BY pagos.fecha DESC, pagos.id DESC`,
    [restauranteId, restauranteId, restauranteId, desde, hasta]
  );
}

function renderCaja(resumenDiaData, resumenMesData, cierres, query) {
  const ok = query.ok || "";
  const fecha = resumenDiaData.fecha;
  const mes = resumenMesData.mes;

  const pagosHtml = resumenDiaData.pagos.map((p) => `
    <tr>
      <td>${escapar(p.fecha)}</td>
      <td>${escapar(p.mesa || "-")}</td>
      <td>${escapar(p.pedido_id || "-")}</td>
      <td>${escapar(p.metodo)}</td>
      <td>${euro(p.importe)}</td>
    </tr>
  `).join("");

  const cierresHtml = cierres.map((c) => `
    <tr>
      <td>${escapar(c.tipo)}</td>
      <td>${escapar(c.periodo || c.fecha)}</td>
      <td>${euro(c.total_ventas)}</td>
      <td>${escapar(c.pedidos_cerrados)}</td>
      <td>${euro(c.ticket_medio)}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Caja - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;}
    .wrap{max-width:1180px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#111827,#14532d);color:white;border-radius:26px;padding:28px;margin-bottom:18px;box-shadow:0 18px 42px rgba(15,23,42,.16);}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#dcfce7;line-height:1.5;}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,button{display:inline-block;border:0;border-radius:12px;padding:11px 14px;background:#16a34a;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    a.sec,button.sec{background:#e5e7eb;color:#111827;}
    .msg{border-radius:15px;padding:12px 14px;margin-bottom:14px;font-weight:900;background:#ecfdf5;color:#14532d;border:1px solid #86efac;}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px;}
    .card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    .metric{background:white;border:1px solid #e5e7eb;border-radius:18px;padding:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    .metric span{display:block;color:#6b7280;font-weight:900;font-size:13px;}
    .metric strong{display:block;font-size:24px;margin-top:5px;}
    h2{margin:0 0 14px;font-size:23px;}
    form.line{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin-bottom:12px;}
    label{display:block;font-weight:900;font-size:13px;margin-bottom:6px;color:#374151;}
    input,textarea{border:1px solid #d1d5db;border-radius:12px;padding:10px;font-size:15px;background:white;}
    textarea{width:100%;min-height:70px;}
    table{width:100%;border-collapse:collapse;}
    th,td{padding:11px;border-bottom:1px solid #e5e7eb;text-align:left;}
    th{font-size:12px;text-transform:uppercase;color:#6b7280;}
    @media(max-width:850px){.grid{grid-template-columns:1fr 1fr;} table,thead,tbody,tr,td,th{display:block;} th{display:none;}}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Caja y pagos</h1>
      <p>Ventas, pagos, cierre diario, cierre mensual e histórico del restaurante actual.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/configuracion-reportes">Reportes CSV</a>
        <a class="btn sec" href="/app/v2">Abrir POS</a>
      </div>
    </section>

    ${ok ? `<div class="msg">${escapar(ok)}</div>` : ""}

    <section class="card">
      <h2>Resumen diario</h2>
      <form class="line" method="GET" action="/configuracion-caja">
        <div>
          <label>Fecha</label>
          <input type="date" name="fecha" value="${escapar(fecha)}">
        </div>
        <button type="submit">Ver fecha</button>
        <a class="btn sec" target="_blank" href="/configuracion-caja/reporte-diario?fecha=${encodeURIComponent(fecha)}">Reporte imprimible</a>
      </form>

      <div class="grid">
        <div class="metric"><span>Total caja</span><strong>${euro(resumenDiaData.total_caja)}</strong></div>
        <div class="metric"><span>Efectivo</span><strong>${euro(resumenDiaData.efectivo)}</strong></div>
        <div class="metric"><span>Tarjeta</span><strong>${euro(resumenDiaData.tarjeta)}</strong></div>
        <div class="metric"><span>Ticket medio</span><strong>${euro(resumenDiaData.ticket_medio)}</strong></div>
      </div>

      <form method="POST" action="/configuracion-caja/cierre-diario">
        <input type="hidden" name="fecha" value="${escapar(fecha)}">
        <label>Efectivo contado</label>
        <input type="number" step="0.01" name="efectivo_contado" value="${Number(resumenDiaData.efectivo || 0).toFixed(2)}">
        <label>Observaciones</label>
        <textarea name="observaciones" placeholder="Notas del cierre diario..."></textarea>
        <br><br>
        <button type="submit">Guardar cierre diario</button>
      </form>
    </section>

    <section class="card">
      <h2>Pagos del día</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Mesa</th><th>Pedido</th><th>Método</th><th>Importe</th></tr></thead>
        <tbody>${pagosHtml || `<tr><td colspan="5">Todavía no hay pagos registrados este día.</td></tr>`}</tbody>
      </table>
    </section>

    <section class="card">
      <h2>Resumen mensual</h2>
      <form class="line" method="GET" action="/configuracion-caja">
        <div>
          <label>Mes</label>
          <input type="month" name="mes" value="${escapar(mes)}">
        </div>
        <button type="submit">Ver mes</button>
        <a class="btn sec" target="_blank" href="/configuracion-caja/reporte-mensual?mes=${encodeURIComponent(mes)}">Reporte mensual</a>
      </form>

      <div class="grid">
        <div class="metric"><span>Total mes</span><strong>${euro(resumenMesData.total_caja)}</strong></div>
        <div class="metric"><span>Pagos</span><strong>${euro(resumenMesData.total_pagos)}</strong></div>
        <div class="metric"><span>Pedidos cerrados</span><strong>${resumenMesData.pedidos_cerrados}</strong></div>
        <div class="metric"><span>Ticket medio</span><strong>${euro(resumenMesData.ticket_medio)}</strong></div>
      </div>

      <form method="POST" action="/configuracion-caja/cierre-mensual">
        <input type="hidden" name="mes" value="${escapar(mes)}">
        <button type="submit">Guardar cierre mensual</button>
      </form>
    </section>

    <section class="card">
      <h2>Últimos cierres guardados</h2>
      <table>
        <thead><tr><th>Tipo</th><th>Periodo</th><th>Total</th><th>Pedidos</th><th>Ticket medio</th></tr></thead>
        <tbody>${cierresHtml || `<tr><td colspan="5">Sin cierres guardados todavía.</td></tr>`}</tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}

function renderReporteHtml(titulo, resumen, filasHtml) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:28px;color:#111827;}
    h1{margin:0 0 8px;}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0;}
    .card{border:1px solid #e5e7eb;border-radius:12px;padding:12px;}
    .card span{display:block;color:#6b7280;font-weight:800;font-size:12px;}
    .card strong{font-size:22px;}
    table{width:100%;border-collapse:collapse;margin-top:18px;}
    th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;}
    th{font-size:12px;text-transform:uppercase;color:#6b7280;}
    @media print{button,a{display:none;}}
  </style>
</head>
<body>
  <button onclick="window.print()">Imprimir</button>
  <h1>${escapar(titulo)}</h1>
  <div class="grid">
    <div class="card"><span>Total caja</span><strong>${euro(resumen.total_caja)}</strong></div>
    <div class="card"><span>Efectivo</span><strong>${euro(resumen.efectivo)}</strong></div>
    <div class="card"><span>Tarjeta</span><strong>${euro(resumen.tarjeta)}</strong></div>
    <div class="card"><span>Ticket medio</span><strong>${euro(resumen.ticket_medio)}</strong></div>
  </div>
  ${filasHtml}
</body>
</html>`;
}

function csvEscape(valor) {
  const v = String(valor == null ? "" : valor);
  return '"' + v.replace(/"/g, '""') + '"';
}

function sendCsv(res, filename, rows) {
  const data = rows || [];
  const headers = data.length ? Object.keys(data[0]) : ["sin_datos"];
  const lines = [headers.map(csvEscape).join(",")];

  data.forEach((row) => {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  });

  if (!data.length) lines.push(csvEscape("Sin datos"));

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="' + filename + '"');
  res.send("\ufeff" + lines.join("\n"));
}

function renderReportes(desde, hasta, resumen) {
  const qs = "desde=" + encodeURIComponent(desde) + "&hasta=" + encodeURIComponent(hasta);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reportes - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}
    body{margin:0;background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;}
    .wrap{max-width:1080px;margin:0 auto;padding:28px 18px 70px;}
    .hero{background:linear-gradient(135deg,#111827,#1e3a8a);color:white;border-radius:26px;padding:28px;margin-bottom:18px;}
    .hero h1{margin:0 0 8px;font-size:32px;}
    .hero p{margin:0;color:#dbeafe;}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
    a.btn,button{display:inline-block;border:0;border-radius:12px;padding:11px 14px;background:#2563eb;color:white;text-decoration:none;font-weight:900;cursor:pointer;font-size:14px;}
    a.sec{background:#e5e7eb;color:#111827;}
    .card{background:white;border:1px solid #e5e7eb;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.07);}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}
    .export{border:1px solid #e5e7eb;border-radius:18px;padding:16px;background:#f9fafb;}
    label{display:block;font-weight:900;font-size:13px;margin-bottom:6px;color:#374151;}
    input{border:1px solid #d1d5db;border-radius:12px;padding:10px;font-size:15px;background:white;}
    form{display:flex;flex-wrap:wrap;gap:10px;align-items:end;}
    @media(max-width:850px){.grid{grid-template-columns:1fr;}}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Reportes CSV</h1>
      <p>Exporta solo los datos del restaurante actual.</p>
      <div class="actions">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/configuracion-caja">Caja</a>
      </div>
    </section>

    <section class="card">
      <form method="GET" action="/configuracion-reportes">
        <div>
          <label>Desde</label>
          <input type="date" name="desde" value="${escapar(desde)}">
        </div>
        <div>
          <label>Hasta</label>
          <input type="date" name="hasta" value="${escapar(hasta)}">
        </div>
        <button type="submit">Filtrar</button>
      </form>
    </section>

    <section class="grid">
      <div class="export">
        <h3>Resumen</h3>
        <p>Total caja: <strong>${euro(resumen.total_caja)}</strong></p>
        <a class="btn" href="/configuracion-reportes/export/resumen?${qs}">Descargar CSV</a>
      </div>
      <div class="export">
        <h3>Pedidos</h3>
        <p>Pedidos cerrados y abiertos del rango.</p>
        <a class="btn" href="/configuracion-reportes/export/pedidos?${qs}">Descargar CSV</a>
      </div>
      <div class="export">
        <h3>Pagos</h3>
        <p>Pagos registrados por método.</p>
        <a class="btn" href="/configuracion-reportes/export/pagos?${qs}">Descargar CSV</a>
      </div>
      <div class="export">
        <h3>Productos</h3>
        <p>Unidades vendidas por producto.</p>
        <a class="btn" href="/configuracion-reportes/export/productos?${qs}">Descargar CSV</a>
      </div>
    </section>
  </main>
</body>
</html>`;
}

module.exports = function cajaReportesSaasRoutes(db) {
  const router = express.Router();

  router.get("/cierre-caja", requiereCaja, function(req, res) {
    res.redirect("/configuracion-caja");
  });

  router.get("/configuracion-caja", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const fecha = String(req.query.fecha || hoyISO()).slice(0, 10);
    const mes = String(req.query.mes || mesISO()).slice(0, 7);

    const dia = await resumenDia(db, restauranteId, fecha);
    const mesData = await resumenMes(db, restauranteId, mes);
    const cierres = await ultimosCierres(db, restauranteId);

    res.send(renderCaja(dia, mesData, cierres, req.query || {}));
  });

  router.get("/configuracion-caja/reporte-diario", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const fecha = String(req.query.fecha || hoyISO()).slice(0, 10);
    const resumen = await resumenDia(db, restauranteId, fecha);

    const filas = resumen.pagos.map((p) => `
      <tr>
        <td>${escapar(p.fecha)}</td>
        <td>${escapar(p.mesa || "-")}</td>
        <td>${escapar(p.pedido_id || "-")}</td>
        <td>${escapar(p.metodo)}</td>
        <td>${euro(p.importe)}</td>
      </tr>
    `).join("");

    res.send(renderReporteHtml(
      "Reporte diario " + fecha,
      resumen,
      `<table><thead><tr><th>Fecha</th><th>Mesa</th><th>Pedido</th><th>Método</th><th>Importe</th></tr></thead><tbody>${filas || `<tr><td colspan="5">Sin pagos.</td></tr>`}</tbody></table>`
    ));
  });

  router.get("/configuracion-caja/reporte-mensual", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const mes = String(req.query.mes || mesISO()).slice(0, 7);
    const resumen = await resumenMes(db, restauranteId, mes);

    res.send(renderReporteHtml(
      "Reporte mensual " + mes,
      resumen,
      `<p>Pagos registrados: ${resumen.pagos_registrados}. Pedidos cerrados: ${resumen.pedidos_cerrados}.</p>`
    ));
  });

  router.post("/configuracion-caja/cierre-diario", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const fecha = String((req.body || {}).fecha || hoyISO()).slice(0, 10);
    const resumen = await resumenDia(db, restauranteId, fecha);

    await guardarCierre(db, restauranteId, "diario", fecha, resumen, req.body || {});

    res.redirect("/configuracion-caja?fecha=" + encodeURIComponent(fecha) + "&ok=" + encodeURIComponent("Cierre diario guardado correctamente"));
  });

  router.post("/configuracion-caja/cierre-mensual", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const mes = String((req.body || {}).mes || mesISO()).slice(0, 7);
    const resumen = await resumenMes(db, restauranteId, mes);

    await guardarCierre(db, restauranteId, "mensual", mes, resumen, req.body || {});

    res.redirect("/configuracion-caja?mes=" + encodeURIComponent(mes) + "&ok=" + encodeURIComponent("Cierre mensual guardado correctamente"));
  });

  router.post("/cierre-caja/cerrar", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const fecha = hoyISO();
    const resumen = await resumenDia(db, restauranteId, fecha);

    await guardarCierre(db, restauranteId, "diario", fecha, resumen, req.body || {});

    res.redirect("/configuracion-caja?fecha=" + encodeURIComponent(fecha) + "&ok=" + encodeURIComponent("Cierre diario guardado correctamente"));
  });

  router.get("/configuracion-reportes", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const desde = String(req.query.desde || hoyISO()).slice(0, 10);
    const hasta = String(req.query.hasta || hoyISO()).slice(0, 10);
    const pagos = await pagosReporte(db, restauranteId, desde, hasta);
    const total = pagos.reduce((acc, p) => acc + Number(p.importe || 0), 0);

    res.send(renderReportes(desde, hasta, { total_caja: total }));
  });

  router.get("/configuracion-reportes/export/resumen", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const desde = String(req.query.desde || hoyISO()).slice(0, 10);
    const hasta = String(req.query.hasta || hoyISO()).slice(0, 10);
    const pagos = await pagosReporte(db, restauranteId, desde, hasta);
    const pedidos = await pedidosReporte(db, restauranteId, desde, hasta);
    const productos = await ventasProductos(db, restauranteId, desde, hasta);

    const totalPagos = pagos.reduce((acc, p) => acc + Number(p.importe || 0), 0);
    const unidades = productos.reduce((acc, p) => acc + Number(p.unidades || 0), 0);

    sendCsv(res, "resumen_" + desde + "_" + hasta + ".csv", [{
      desde: desde,
      hasta: hasta,
      total_pagos: totalPagos.toFixed(2),
      pagos: pagos.length,
      pedidos: pedidos.length,
      productos_diferentes: productos.length,
      unidades: unidades
    }]);
  });

  router.get("/configuracion-reportes/export/pedidos", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const desde = String(req.query.desde || hoyISO()).slice(0, 10);
    const hasta = String(req.query.hasta || hoyISO()).slice(0, 10);
    const rows = await pedidosReporte(db, restauranteId, desde, hasta);

    sendCsv(res, "pedidos_" + desde + "_" + hasta + ".csv", rows);
  });

  router.get("/configuracion-reportes/export/pagos", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const desde = String(req.query.desde || hoyISO()).slice(0, 10);
    const hasta = String(req.query.hasta || hoyISO()).slice(0, 10);
    const rows = await pagosReporte(db, restauranteId, desde, hasta);

    sendCsv(res, "pagos_" + desde + "_" + hasta + ".csv", rows);
  });

  router.get("/configuracion-reportes/export/productos", requiereCaja, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const desde = String(req.query.desde || hoyISO()).slice(0, 10);
    const hasta = String(req.query.hasta || hoyISO()).slice(0, 10);
    const rows = await ventasProductos(db, restauranteId, desde, hasta);

    sendCsv(res, "ventas_producto_" + desde + "_" + hasta + ".csv", rows);
  });

  return router;
};
