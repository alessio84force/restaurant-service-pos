const express = require("express");

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dbAll(db, sql, params) {
  return new Promise((resolve) => {
    db.all(sql, params || [], function(err, rows) {
      if (err) {
        console.error("[reportes] SQL error:", err.message);
        return resolve([]);
      }

      resolve(rows || []);
    });
  });
}

function dbGet(db, sql, params) {
  return new Promise((resolve) => {
    db.get(sql, params || [], function(err, row) {
      if (err) {
        console.error("[reportes] SQL error:", err.message);
        return resolve(null);
      }

      resolve(row || null);
    });
  });
}

async function tableExists(db, table) {
  const row = await dbGet(
    db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [table]
  );

  return !!row;
}

async function columns(db, table) {
  const exists = await tableExists(db, table);
  if (!exists) return [];

  const rows = await dbAll(db, `PRAGMA table_info(${table})`, []);
  return rows.map((r) => String(r.name || ""));
}

function pick(cols, nombres) {
  for (const n of nombres) {
    if (cols.includes(n)) return n;
  }

  return "";
}

function hoy() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function inicioMes() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-01";
}

function normalizarFecha(valor, defecto) {
  const v = String(valor || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  return defecto;
}

function filtroFechaSql(columna) {
  return `date(${columna}) >= date(?) AND date(${columna}) <= date(?)`;
}

function csvEscape(valor) {
  const v = String(valor == null ? "" : valor);

  if (/[",\n\r;]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"';
  }

  return v;
}

function toCsv(rows) {
  if (!rows || rows.length === 0) {
    return "sin_datos\n";
  }

  const headers = Object.keys(rows[0]);

  const lines = [
    headers.map(csvEscape).join(";")
  ];

  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(";"));
  }

  return lines.join("\n") + "\n";
}

function sendCsv(res, filename, rows) {
  const csv = toCsv(rows);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\ufeff" + csv);
}

async function pedidosResumen(db, desde, hasta) {
  const cols = await columns(db, "pedidos");
  if (!cols.length) return [];

  const id = pick(cols, ["id", "pedido_id"]);
  const mesa = pick(cols, ["mesa_id", "mesa", "mesa_numero", "numero_mesa"]);
  const estado = pick(cols, ["estado", "status"]);
  const total = pick(cols, ["total", "importe_total", "monto_total"]);
  const fecha = pick(cols, ["cerrado_en", "fecha_cierre", "created_at", "creado_en", "fecha"]);

  if (!id || !fecha) return [];

  const sql = `
    SELECT
      ${id} AS pedido_id,
      ${mesa ? mesa : "''"} AS mesa,
      ${estado ? estado : "''"} AS estado,
      ${total ? total : "0"} AS total,
      ${fecha} AS fecha
    FROM pedidos
    WHERE ${filtroFechaSql(fecha)}
    ORDER BY ${fecha} DESC
  `;

  return dbAll(db, sql, [desde, hasta]);
}

async function pagosMetodo(db, desde, hasta) {
  const tablas = [];

  if (await tableExists(db, "pagos_multiples")) tablas.push("pagos_multiples");
  if (await tableExists(db, "pagos")) tablas.push("pagos");

  const resultados = [];

  for (const tabla of tablas) {
    const cols = await columns(db, tabla);

    const metodo = pick(cols, ["metodo", "forma_pago", "tipo_pago", "tipo"]);
    const importe = pick(cols, ["importe", "cantidad", "monto", "total"]);
    const fecha = pick(cols, ["created_at", "creado_en", "fecha", "pagado_en"]);

    if (!metodo || !importe || !fecha) continue;

    const rows = await dbAll(
      db,
      `
        SELECT
          ? AS origen,
          COALESCE(${metodo}, 'sin_metodo') AS metodo,
          COUNT(*) AS operaciones,
          ROUND(SUM(COALESCE(${importe}, 0)), 2) AS total
        FROM ${tabla}
        WHERE ${filtroFechaSql(fecha)}
        GROUP BY COALESCE(${metodo}, 'sin_metodo')
        ORDER BY total DESC
      `,
      [tabla, desde, hasta]
    );

    for (const r of rows) resultados.push(r);
  }

  if (!resultados.length) return [];

  const agrupado = {};

  for (const r of resultados) {
    const k = String(r.metodo || "sin_metodo");

    if (!agrupado[k]) {
      agrupado[k] = {
        metodo: k,
        operaciones: 0,
        total: 0
      };
    }

    agrupado[k].operaciones += Number(r.operaciones || 0);
    agrupado[k].total += Number(r.total || 0);
  }

  return Object.values(agrupado).map((r) => ({
    metodo: r.metodo,
    operaciones: r.operaciones,
    total: Math.round(r.total * 100) / 100
  }));
}

async function ventasProducto(db, desde, hasta) {
  const lineCols = await columns(db, "pedido_lineas");
  const pedidoCols = await columns(db, "pedidos");

  if (!lineCols.length) return [];

  const lineaPedidoId = pick(lineCols, ["pedido_id", "id_pedido"]);
  const lineaProductoId = pick(lineCols, ["producto_id", "id_producto"]);
  const lineaNombre = pick(lineCols, ["producto_nombre", "nombre_producto", "nombre", "descripcion"]);
  const cantidad = pick(lineCols, ["cantidad", "qty", "unidades"]);
  const precio = pick(lineCols, ["precio_unitario", "precio", "precio_producto"]);
  const totalLinea = pick(lineCols, ["total", "importe", "subtotal"]);

  let fechaPedido = "";
  let pedidoId = "";

  if (pedidoCols.length) {
    pedidoId = pick(pedidoCols, ["id", "pedido_id"]);
    fechaPedido = pick(pedidoCols, ["cerrado_en", "fecha_cierre", "created_at", "creado_en", "fecha"]);
  }

  if (lineaPedidoId && pedidoId && fechaPedido) {
    const nombreExpr = lineaNombre
      ? `l.${lineaNombre}`
      : lineaProductoId
        ? `('Producto ' || l.${lineaProductoId})`
        : "'Producto sin nombre'";

    const cantidadExpr = cantidad ? `COALESCE(l.${cantidad}, 1)` : "1";

    let totalExpr = "0";
    if (totalLinea) {
      totalExpr = `COALESCE(l.${totalLinea}, 0)`;
    } else if (precio) {
      totalExpr = `COALESCE(l.${precio}, 0) * ${cantidadExpr}`;
    }

    return dbAll(
      db,
      `
        SELECT
          ${nombreExpr} AS producto,
          SUM(${cantidadExpr}) AS unidades,
          ROUND(SUM(${totalExpr}), 2) AS total
        FROM pedido_lineas l
        JOIN pedidos p ON p.${pedidoId} = l.${lineaPedidoId}
        WHERE ${filtroFechaSql("p." + fechaPedido)}
        GROUP BY ${nombreExpr}
        ORDER BY unidades DESC, total DESC
      `,
      [desde, hasta]
    );
  }

  const nombreExpr = lineaNombre
    ? lineaNombre
    : lineaProductoId
      ? `('Producto ' || ${lineaProductoId})`
      : "'Producto sin nombre'";

  const cantidadExpr = cantidad ? `COALESCE(${cantidad}, 1)` : "1";

  let totalExpr = "0";
  if (totalLinea) {
    totalExpr = `COALESCE(${totalLinea}, 0)`;
  } else if (precio) {
    totalExpr = `COALESCE(${precio}, 0) * ${cantidadExpr}`;
  }

  return dbAll(
    db,
    `
      SELECT
        ${nombreExpr} AS producto,
        SUM(${cantidadExpr}) AS unidades,
        ROUND(SUM(${totalExpr}), 2) AS total
      FROM pedido_lineas
      GROUP BY ${nombreExpr}
      ORDER BY unidades DESC, total DESC
    `,
    []
  );
}

async function resumenGeneral(db, desde, hasta) {
  const pedidos = await pedidosResumen(db, desde, hasta);
  const pagos = await pagosMetodo(db, desde, hasta);
  const productos = await ventasProducto(db, desde, hasta);

  const totalPedidos = pedidos.length;
  const totalVentasPedidos = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const totalPagos = pagos.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const unidades = productos.reduce((acc, p) => acc + Number(p.unidades || 0), 0);

  return [
    {
      desde,
      hasta,
      pedidos: totalPedidos,
      total_pedidos: Math.round(totalVentasPedidos * 100) / 100,
      total_pagos: Math.round(totalPagos * 100) / 100,
      productos_diferentes: productos.length,
      unidades_vendidas: unidades
    }
  ];
}

function page(req) {
  const desde = normalizarFecha(req.query.desde, inicioMes());
  const hasta = normalizarFecha(req.query.hasta, hoy());

  const qs = `desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reportes - Restaurant Service POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{box-sizing:border-box;}

    body{
      margin:0;
      font-family:Arial, Helvetica, sans-serif;
      background:#f3f4f6;
      color:#111827;
    }

    .wrap{
      max-width:1050px;
      margin:0 auto;
      padding:28px 18px 60px;
    }

    .hero{
      background:linear-gradient(135deg,#0f172a,#1e3a8a);
      color:white;
      border-radius:26px;
      padding:30px;
      box-shadow:0 20px 50px rgba(15,23,42,.18);
      margin-bottom:18px;
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
      max-width:760px;
    }

    .card{
      background:white;
      border:1px solid #e5e7eb;
      border-radius:22px;
      padding:24px;
      box-shadow:0 10px 26px rgba(15,23,42,.07);
      margin-bottom:16px;
    }

    h2{
      margin:0 0 12px;
      font-size:24px;
    }

    p{
      color:#374151;
      font-size:15px;
      line-height:1.6;
    }

    .filtros{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:12px;
      align-items:end;
    }

    label{
      display:block;
      font-weight:900;
      font-size:13px;
      margin-bottom:6px;
      color:#374151;
    }

    input{
      width:100%;
      border:1px solid #d1d5db;
      border-radius:12px;
      padding:11px;
      font-size:15px;
    }

    .btn, button.btn{
      display:inline-block;
      border:0;
      border-radius:12px;
      padding:11px 14px;
      font-weight:900;
      font-size:14px;
      text-decoration:none;
      cursor:pointer;
      background:#2563eb;
      color:white;
      text-align:center;
    }

    .btn.sec{
      background:#e5e7eb;
      color:#111827;
    }

    .grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:14px;
    }

    .reporte{
      border:1px solid #e5e7eb;
      border-radius:18px;
      padding:18px;
      background:#f9fafb;
    }

    .reporte h3{
      margin:0 0 8px;
      font-size:19px;
      color:#111827;
    }

    .reporte p{
      margin:0 0 14px;
    }

    .acciones{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:18px;
    }

    .alerta{
      background:#fffbeb;
      border:1px solid #fbbf24;
      color:#78350f;
      border-radius:16px;
      padding:14px 16px;
      line-height:1.55;
      margin-top:14px;
      font-size:14px;
    }

    @media(max-width:760px){
      .hero h1{font-size:27px;}
      .filtros{grid-template-columns:1fr;}
      .grid{grid-template-columns:1fr;}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Reportes del restaurante</h1>
      <p>Exporta datos del restaurante en CSV para revisión interna, control de caja o entrega al gestor.</p>
    </section>

    <section class="card">
      <h2>Rango de fechas</h2>
      <form method="GET" action="/configuracion-reportes" class="filtros">
        <div>
          <label>Desde</label>
          <input type="date" name="desde" value="${escapar(desde)}">
        </div>
        <div>
          <label>Hasta</label>
          <input type="date" name="hasta" value="${escapar(hasta)}">
        </div>
        <button class="btn" type="submit">Actualizar fechas</button>
      </form>

      <div class="acciones">
        <a class="btn sec" href="/configuracion">Volver a configuración</a>
        <a class="btn sec" href="/configuracion-backups">Backups</a>
        <a class="btn sec" href="/manual#caja">Ayuda caja</a>
      </div>
    </section>

    <section class="card">
      <h2>Exportaciones CSV</h2>

      <div class="grid">
        <div class="reporte">
          <h3>Resumen general</h3>
          <p>Pedidos, total de ventas, pagos y unidades vendidas en el periodo seleccionado.</p>
          <a class="btn" href="/configuracion-reportes/export/resumen?${qs}">Descargar CSV</a>
        </div>

        <div class="reporte">
          <h3>Pedidos</h3>
          <p>Listado de pedidos con mesa, estado, total y fecha.</p>
          <a class="btn" href="/configuracion-reportes/export/pedidos?${qs}">Descargar CSV</a>
        </div>

        <div class="reporte">
          <h3>Pagos por método</h3>
          <p>Totales agrupados por efectivo, tarjeta u otros métodos registrados.</p>
          <a class="btn" href="/configuracion-reportes/export/pagos?${qs}">Descargar CSV</a>
        </div>

        <div class="reporte">
          <h3>Ventas por producto</h3>
          <p>Unidades vendidas y total por producto.</p>
          <a class="btn" href="/configuracion-reportes/export/productos?${qs}">Descargar CSV</a>
        </div>
      </div>

      <div class="alerta">
        Los archivos CSV se pueden abrir con Excel, Numbers, Google Sheets o enviarse al gestor. Si un reporte sale vacío, normalmente significa que no hay datos cerrados en ese rango.
      </div>
    </section>
  </main>
</body>
</html>`;
}

module.exports = function reportesRestauranteRoutes(db) {
  const router = express.Router();

  router.get("/configuracion-reportes", function(req, res) {
    res.send(page(req));
  });

  router.get("/configuracion-reportes/export/resumen", async function(req, res) {
    const desde = normalizarFecha(req.query.desde, inicioMes());
    const hasta = normalizarFecha(req.query.hasta, hoy());
    const rows = await resumenGeneral(db, desde, hasta);

    sendCsv(res, `resumen_restaurante_${desde}_${hasta}.csv`, rows);
  });

  router.get("/configuracion-reportes/export/pedidos", async function(req, res) {
    const desde = normalizarFecha(req.query.desde, inicioMes());
    const hasta = normalizarFecha(req.query.hasta, hoy());
    const rows = await pedidosResumen(db, desde, hasta);

    sendCsv(res, `pedidos_${desde}_${hasta}.csv`, rows);
  });

  router.get("/configuracion-reportes/export/pagos", async function(req, res) {
    const desde = normalizarFecha(req.query.desde, inicioMes());
    const hasta = normalizarFecha(req.query.hasta, hoy());
    const rows = await pagosMetodo(db, desde, hasta);

    sendCsv(res, `pagos_metodo_${desde}_${hasta}.csv`, rows);
  });

  router.get("/configuracion-reportes/export/productos", async function(req, res) {
    const desde = normalizarFecha(req.query.desde, inicioMes());
    const hasta = normalizarFecha(req.query.hasta, hoy());
    const rows = await ventasProducto(db, desde, hasta);

    sendCsv(res, `ventas_producto_${desde}_${hasta}.csv`, rows);
  });

  return router;
};
