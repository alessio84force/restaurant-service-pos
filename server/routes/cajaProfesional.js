const express = require("express");
const { imprimirCentroImpresion } = require("../printing/centroImpresionRuntime");

function escaparHTML(texto){
  return String(texto || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function euro(valor){
  return Number(valor || 0).toFixed(2) + " €";
}

function fechaHoyLocal(){
  const d = new Date();
  const p = (n) => String(n).padStart(2,"0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function mesActualLocal(){
  return fechaHoyLocal().slice(0,7);
}

function normalizarMetodo(metodo){
  const m = String(metodo || "").toLowerCase();

  if(m.includes("efectivo")) return "efectivo";
  if(m.includes("tarjeta")) return "tarjeta";
  if(m.includes("bizum")) return "bizum";

  return "otros";
}

function requiereCaja(req,res,next){
  if(!req.session || !req.session.usuario){
    return res.redirect("/login");
  }

  const rol = req.session.usuario.rol || req.session.usuario.role || "";

  if(rol === "admin" || rol === "gerente"){
    return next();
  }

  return res.status(403).send("No autorizado");
}

function asegurarCajaProfesional(db, callback){
  db.run(`
    CREATE TABLE IF NOT EXISTS cierres_caja (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      total_ventas REAL DEFAULT 0,
      pedidos_cerrados INTEGER DEFAULT 0,
      ticket_medio REAL DEFAULT 0,
      creado_en TEXT DEFAULT CURRENT_TIMESTAMP,
      tipo TEXT DEFAULT 'diario',
      periodo TEXT,
      efectivo REAL DEFAULT 0,
      tarjeta REAL DEFAULT 0,
      otros REAL DEFAULT 0,
      total_pagos REAL DEFAULT 0
    )
  `, [], (errCreate)=>{
    if(errCreate) return callback(errCreate);

    db.all("PRAGMA table_info(cierres_caja)", [], (errCols, columnas)=>{
      if(errCols) return callback(errCols);

      const nombres = (columnas || []).map(c => c.name);

      const necesarias = [
        { nombre:"bizum", sql:"ALTER TABLE cierres_caja ADD COLUMN bizum REAL DEFAULT 0" },
        { nombre:"efectivo_contado", sql:"ALTER TABLE cierres_caja ADD COLUMN efectivo_contado REAL DEFAULT 0" },
        { nombre:"diferencia_efectivo", sql:"ALTER TABLE cierres_caja ADD COLUMN diferencia_efectivo REAL DEFAULT 0" },
        { nombre:"observaciones", sql:"ALTER TABLE cierres_caja ADD COLUMN observaciones TEXT DEFAULT ''" }
      ].filter(c => !nombres.includes(c.nombre));

      function siguiente(i){
        if(i >= necesarias.length){
          return callback();
        }

        db.run(necesarias[i].sql, [], (errAlter)=>{
          if(errAlter && !String(errAlter.message || "").includes("duplicate column")){
            return callback(errAlter);
          }

          siguiente(i + 1);
        });
      }

      siguiente(0);
    });
  });
}

function calcularResumenDia(db, fecha, callback){
  asegurarCajaProfesional(db, (errAsegurar)=>{
    if(errAsegurar) return callback(errAsegurar);

    const sqlPagos = `
      SELECT
        pagos.id,
        pagos.pedido_id,
        pagos.metodo,
        pagos.importe,
        pagos.fecha,
        mesas.numero AS mesa,
        pedidos.total AS pedido_total
      FROM pagos
      LEFT JOIN pedidos ON pagos.pedido_id = pedidos.id
      LEFT JOIN mesas ON pedidos.mesa_id = mesas.id
      WHERE substr(pagos.fecha,1,10)=?
      ORDER BY pagos.fecha DESC, pagos.id DESC
    `;

    const sqlPedidos = `
      SELECT
        pedidos.id,
        pedidos.total,
        pedidos.pagado_en,
        pedidos.creado_en,
        mesas.numero AS mesa
      FROM pedidos
      LEFT JOIN mesas ON pedidos.mesa_id = mesas.id
      WHERE pedidos.estado='cerrado'
      AND (
        substr(pedidos.pagado_en,1,10)=?
        OR (pedidos.pagado_en IS NULL AND substr(pedidos.creado_en,1,10)=?)
      )
      ORDER BY pedidos.id DESC
    `;

    db.all(sqlPagos, [fecha], (errPagos, pagos)=>{
      if(errPagos) return callback(errPagos);

      db.all(sqlPedidos, [fecha, fecha], (errPedidos, pedidos)=>{
        if(errPedidos) return callback(errPedidos);

        const resumen = {
          fecha,
          efectivo:0,
          tarjeta:0,
          bizum:0,
          otros:0,
          total_pagos:0,
          total_pedidos_cerrados:0,
          pedidos_cerrados:Array.isArray(pedidos) ? pedidos.length : 0,
          pagos_registrados:Array.isArray(pagos) ? pagos.length : 0,
          pedidos_pagados:0,
          total_caja:0,
          ticket_medio:0,
          pagos: pagos || [],
          pedidos: pedidos || []
        };

        const pedidosUnicos = {};

        (pagos || []).forEach((pago)=>{
          const metodo = normalizarMetodo(pago.metodo);
          const importe = Number(pago.importe || 0);

          resumen[metodo] += importe;
          resumen.total_pagos += importe;

          if(pago.pedido_id){
            pedidosUnicos[pago.pedido_id] = true;
          }
        });

        (pedidos || []).forEach((pedido)=>{
          resumen.total_pedidos_cerrados += Number(pedido.total || 0);
        });

        resumen.pedidos_pagados = Object.keys(pedidosUnicos).length;
        resumen.total_caja = resumen.total_pagos > 0 ? resumen.total_pagos : resumen.total_pedidos_cerrados;

        const baseTickets = resumen.pedidos_pagados > 0
          ? resumen.pedidos_pagados
          : resumen.pedidos_cerrados;

        resumen.ticket_medio = baseTickets > 0 ? resumen.total_caja / baseTickets : 0;

        callback(null, resumen);
      });
    });
  });
}

function calcularResumenMes(db, mes, callback){
  asegurarCajaProfesional(db, (errAsegurar)=>{
    if(errAsegurar) return callback(errAsegurar);

    db.all(
      "SELECT metodo, importe, pedido_id FROM pagos WHERE substr(fecha,1,7)=?",
      [mes],
      (errPagos, pagos)=>{
        if(errPagos) return callback(errPagos);

        db.all(
          "SELECT id,total FROM pedidos WHERE estado='cerrado' AND (substr(pagado_en,1,7)=? OR (pagado_en IS NULL AND substr(creado_en,1,7)=?))",
          [mes, mes],
          (errPedidos, pedidos)=>{
            if(errPedidos) return callback(errPedidos);

            const resumen = {
              mes,
              efectivo:0,
              tarjeta:0,
              bizum:0,
              otros:0,
              total_pagos:0,
              pedidos_cerrados:Array.isArray(pedidos) ? pedidos.length : 0,
              pedidos_pagados:0,
              total_caja:0,
              ticket_medio:0
            };

            const pedidosUnicos = {};

            (pagos || []).forEach((pago)=>{
              const metodo = normalizarMetodo(pago.metodo);
              const importe = Number(pago.importe || 0);

              resumen[metodo] += importe;
              resumen.total_pagos += importe;

              if(pago.pedido_id){
                pedidosUnicos[pago.pedido_id] = true;
              }
            });

            resumen.pedidos_pagados = Object.keys(pedidosUnicos).length;
            resumen.total_caja = resumen.total_pagos;

            const baseTickets = resumen.pedidos_pagados > 0
              ? resumen.pedidos_pagados
              : resumen.pedidos_cerrados;

            resumen.ticket_medio = baseTickets > 0 ? resumen.total_caja / baseTickets : 0;

            callback(null, resumen);
          }
        );
      }
    );
  });
}

function cargarHistorico(db, callback){
  asegurarCajaProfesional(db, (errAsegurar)=>{
    if(errAsegurar) return callback(errAsegurar);

    db.all(`
      SELECT
        id,
        fecha,
        total_ventas,
        pedidos_cerrados,
        ticket_medio,
        creado_en,
        tipo,
        periodo,
        efectivo,
        tarjeta,
        otros,
        total_pagos,
        bizum,
        efectivo_contado,
        diferencia_efectivo,
        observaciones
      FROM cierres_caja
      ORDER BY id DESC
      LIMIT 20
    `, [], callback);
  });
}

function guardarCierreDiario(db, resumen, datos, callback){
  const efectivoContado = Number(datos.efectivo_contado || 0);
  const diferenciaEfectivo = efectivoContado - Number(resumen.efectivo || 0);
  const observaciones = String(datos.observaciones || "").trim();

  db.get(
    "SELECT id FROM cierres_caja WHERE tipo='diario' AND periodo=? ORDER BY id DESC LIMIT 1",
    [resumen.fecha],
    (errGet, cierre)=>{
      if(errGet) return callback(errGet);

      const valores = [
        resumen.fecha,
        resumen.total_caja,
        resumen.pedidos_pagados || resumen.pedidos_cerrados,
        resumen.ticket_medio,
        resumen.efectivo,
        resumen.tarjeta,
        resumen.otros,
        resumen.total_pagos,
        resumen.bizum,
        efectivoContado,
        diferenciaEfectivo,
        observaciones
      ];

      if(cierre){
        db.run(`
          UPDATE cierres_caja
          SET
            fecha=?,
            total_ventas=?,
            pedidos_cerrados=?,
            ticket_medio=?,
            efectivo=?,
            tarjeta=?,
            otros=?,
            total_pagos=?,
            bizum=?,
            efectivo_contado=?,
            diferencia_efectivo=?,
            observaciones=?,
            creado_en=CURRENT_TIMESTAMP
          WHERE id=?
        `, valores.concat([cierre.id]), callback);
      }else{
        db.run(`
          INSERT INTO cierres_caja
          (
            fecha,
            total_ventas,
            pedidos_cerrados,
            ticket_medio,
            efectivo,
            tarjeta,
            otros,
            total_pagos,
            bizum,
            efectivo_contado,
            diferencia_efectivo,
            observaciones,
            tipo,
            periodo
          )
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'diario', ?)
        `, valores.concat([resumen.fecha]), callback);
      }
    }
  );
}


function guardarCierreMensual(db, resumen, datos, callback){
  const observaciones = String(datos.observaciones_mensual || "").trim();
  const fechaCierre = resumen.mes + "-01";

  db.get(
    "SELECT id FROM cierres_caja WHERE tipo='mensual' AND periodo=? ORDER BY id DESC LIMIT 1",
    [resumen.mes],
    (errGet, cierre)=>{
      if(errGet) return callback(errGet);

      const valores = [
        fechaCierre,
        resumen.total_caja,
        resumen.pedidos_pagados || resumen.pedidos_cerrados,
        resumen.ticket_medio,
        resumen.efectivo,
        resumen.tarjeta,
        resumen.otros,
        resumen.total_pagos,
        resumen.bizum,
        observaciones
      ];

      if(cierre){
        db.run(`
          UPDATE cierres_caja
          SET
            fecha=?,
            total_ventas=?,
            pedidos_cerrados=?,
            ticket_medio=?,
            efectivo=?,
            tarjeta=?,
            otros=?,
            total_pagos=?,
            bizum=?,
            observaciones=?,
            creado_en=CURRENT_TIMESTAMP
          WHERE id=?
        `, valores.concat([cierre.id]), callback);
      }else{
        db.run(`
          INSERT INTO cierres_caja
          (
            fecha,
            total_ventas,
            pedidos_cerrados,
            ticket_medio,
            efectivo,
            tarjeta,
            otros,
            total_pagos,
            bizum,
            observaciones,
            tipo,
            periodo
          )
          VALUES(?,?,?,?,?,?,?,?,?,?, 'mensual', ?)
        `, valores.concat([resumen.mes]), callback);
      }
    }
  );
}

function textoReporteCajaMensual(resumen){
  let texto = "";
  texto += "================================\n";
  texto += "      CIERRE CAJA MENSUAL\n";
  texto += "================================\n";
  texto += "MES: " + resumen.mes + "\n";
  texto += "--------------------------------\n";
  texto += "TOTAL MES: " + euro(resumen.total_caja) + "\n";
  texto += "EFECTIVO: " + euro(resumen.efectivo) + "\n";
  texto += "TARJETA: " + euro(resumen.tarjeta) + "\n";
  texto += "BIZUM: " + euro(resumen.bizum) + "\n";
  texto += "OTROS: " + euro(resumen.otros) + "\n";
  texto += "--------------------------------\n";
  texto += "PEDIDOS PAGADOS: " + resumen.pedidos_pagados + "\n";
  texto += "PEDIDOS CERRADOS: " + resumen.pedidos_cerrados + "\n";
  texto += "TICKET MEDIO: " + euro(resumen.ticket_medio) + "\n";
  texto += "================================\n\n\n";

  return texto;
}

function textoReporteCaja(resumen){
  let texto = "";
  texto += "================================\n";
  texto += "      CIERRE CAJA DIARIA\n";
  texto += "================================\n";
  texto += "FECHA: " + resumen.fecha + "\n";
  texto += "--------------------------------\n";
  texto += "TOTAL CAJA: " + euro(resumen.total_caja) + "\n";
  texto += "EFECTIVO: " + euro(resumen.efectivo) + "\n";
  texto += "TARJETA: " + euro(resumen.tarjeta) + "\n";
  texto += "BIZUM: " + euro(resumen.bizum) + "\n";
  texto += "OTROS: " + euro(resumen.otros) + "\n";
  texto += "--------------------------------\n";
  texto += "PAGOS REGISTRADOS: " + resumen.pagos_registrados + "\n";
  texto += "PEDIDOS PAGADOS: " + resumen.pedidos_pagados + "\n";
  texto += "PEDIDOS CERRADOS: " + resumen.pedidos_cerrados + "\n";
  texto += "TICKET MEDIO: " + euro(resumen.ticket_medio) + "\n";
  texto += "================================\n\n\n";

  return texto;
}

function renderCaja(resumen, mesResumen, historico, mensaje){
  const pagosHtml = (resumen.pagos || []).map((pago)=>`
    <tr>
      <td>${escaparHTML(pago.fecha)}</td>
      <td>${escaparHTML(pago.mesa || "-")}</td>
      <td>${escaparHTML(pago.pedido_id || "-")}</td>
      <td>${escaparHTML(pago.metodo)}</td>
      <td>${euro(pago.importe)}</td>
    </tr>
  `).join("");

  const historicoHtml = (historico || []).map((c)=>`
    <tr>
      <td>${escaparHTML(c.fecha)}</td>
      <td>${escaparHTML(c.tipo)}</td>
      <td>${euro(c.total_ventas)}</td>
      <td>${escaparHTML(c.pedidos_cerrados)}</td>
      <td>${euro(c.ticket_medio)}</td>
      <td>${euro(c.efectivo)}</td>
      <td>${euro(c.tarjeta)}</td>
      <td>${euro(c.bizum)}</td>
      <td>${euro(c.diferencia_efectivo)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Caja diaria - Restaurant Service POS</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{
  margin:0;
  font-family:Arial, sans-serif;
  background:#f3f4f6;
  color:#111827;
}
.page{
  max-width:1220px;
  margin:0 auto;
  padding:28px;
}
.topbar{
  display:flex;
  justify-content:space-between;
  gap:14px;
  align-items:flex-start;
  margin-bottom:22px;
}
h1{
  margin:0;
  font-size:34px;
}
.sub{
  margin:8px 0 0 0;
  color:#6b7280;
  font-weight:700;
}
.btn-back{
  text-decoration:none;
  background:#fff;
  color:#111827;
  border:1px solid #d1d5db;
  padding:12px 16px;
  border-radius:14px;
  font-weight:900;
}
.notice{
  background:#ecfdf5;
  border:1px solid #a7f3d0;
  color:#065f46;
  padding:13px 16px;
  border-radius:14px;
  font-weight:900;
  margin-bottom:18px;
}
.panel{
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:24px;
  padding:20px;
  box-shadow:0 12px 28px rgba(15,23,42,0.07);
  margin-bottom:18px;
}
.panel h2{
  margin:0 0 14px 0;
}
.form-linea{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  align-items:end;
}
label{
  display:grid;
  gap:7px;
  font-size:13px;
  color:#374151;
  font-weight:900;
}
input, textarea{
  min-height:42px;
  border:1px solid #d1d5db;
  border-radius:12px;
  padding:0 11px;
  font-size:14px;
  font-weight:700;
  box-sizing:border-box;
}
textarea{
  padding:11px;
  min-height:70px;
}
.btn{
  border:0;
  border-radius:14px;
  min-height:44px;
  padding:0 16px;
  font-weight:900;
  cursor:pointer;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}
.btn-main{
  background:#111827;
  color:#fff;
}
.btn-green{
  background:#16a34a;
  color:#fff;
}
.btn-blue{
  background:#2563eb;
  color:#fff;
}
.btn-light{
  background:#f9fafb;
  color:#111827;
  border:1px solid #d1d5db;
}
.resumen{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:12px;
  margin-top:14px;
}
.card{
  background:#f9fafb;
  border:1px solid #e5e7eb;
  border-radius:18px;
  padding:16px;
}
.card span{
  display:block;
  color:#6b7280;
  font-size:13px;
  font-weight:900;
  margin-bottom:7px;
}
.card strong{
  font-size:24px;
}
.card.total{
  background:#111827;
  color:#fff;
}
.card.total span{
  color:#d1d5db;
}
.grid-cierre{
  display:grid;
  grid-template-columns:260px 1fr;
  gap:14px;
  margin-top:14px;
}
table{
  width:100%;
  border-collapse:collapse;
  font-size:14px;
}
th,td{
  text-align:left;
  padding:10px;
  border-bottom:1px solid #e5e7eb;
}
th{
  color:#374151;
  background:#f9fafb;
}
.scroll{
  overflow:auto;
}
@media(max-width:900px){
  .topbar{
    flex-direction:column;
  }
  .resumen{
    grid-template-columns:1fr;
  }
  .grid-cierre{
    grid-template-columns:1fr;
  }
}
</style>
</head>
<body>
<main class="page">
  <div class="topbar">
    <div>
      <h1>Caja diaria</h1>
      <p class="sub">Control profesional de pagos, ventas, efectivo, tarjeta, Bizum y cierre del día.</p>
    </div>
    <a class="btn-back" href="/configuracion">← Volver a configuración</a>
  </div>

  ${mensaje ? `<div class="notice">${escaparHTML(mensaje)}</div>` : ""}

  <section class="panel">
    <h2>Seleccionar día</h2>
    <form class="form-linea" method="GET" action="/configuracion-caja">
      <label>
        Fecha
        <input type="date" name="fecha" value="${escaparHTML(resumen.fecha)}">
      </label>
      <button class="btn btn-main" type="submit">Ver caja</button>
      <a class="btn btn-light" target="_blank" href="/configuracion-caja/reporte-diario?fecha=${encodeURIComponent(resumen.fecha)}">Ver reporte imprimible</a>
    </form>
  </section>

  <section class="panel">
    <h2>Resumen del día</h2>
    <div class="resumen">
      <div class="card total"><span>Total caja</span><strong>${euro(resumen.total_caja)}</strong></div>
      <div class="card"><span>Pedidos pagados</span><strong>${resumen.pedidos_pagados}</strong></div>
      <div class="card"><span>Pagos registrados</span><strong>${resumen.pagos_registrados}</strong></div>
      <div class="card"><span>Ticket medio</span><strong>${euro(resumen.ticket_medio)}</strong></div>
    </div>

    <div class="resumen">
      <div class="card"><span>Efectivo sistema</span><strong>${euro(resumen.efectivo)}</strong></div>
      <div class="card"><span>Tarjeta</span><strong>${euro(resumen.tarjeta)}</strong></div>
      <div class="card"><span>Bizum</span><strong>${euro(resumen.bizum)}</strong></div>
      <div class="card"><span>Otros</span><strong>${euro(resumen.otros)}</strong></div>
    </div>
  </section>

  <section class="panel">
    <h2>Cierre diario</h2>
    <form method="POST" action="/configuracion-caja/cierre-diario">
      <input type="hidden" name="fecha" value="${escaparHTML(resumen.fecha)}">

      <div class="grid-cierre">
        <label>
          Efectivo contado en caja
          <input type="number" step="0.01" name="efectivo_contado" placeholder="${Number(resumen.efectivo || 0).toFixed(2)}">
        </label>

        <label>
          Observaciones
          <textarea name="observaciones" placeholder="Ej. Todo correcto, falta cambio, propinas separadas, descuadre revisado..."></textarea>
        </label>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
        <button class="btn btn-green" type="submit">Guardar cierre diario</button>
        <a class="btn btn-blue" target="_blank" href="/configuracion-caja/reporte-diario?fecha=${encodeURIComponent(resumen.fecha)}&print=1">Imprimir reporte</a>
      </div>
    </form>
  </section>

  <section class="panel">
    <h2>Cierre mensual</h2>

    <form class="form-linea" method="GET" action="/configuracion-caja">
      <input type="hidden" name="fecha" value="${escaparHTML(resumen.fecha)}">
      <label>
        Mes
        <input type="month" name="mes" value="${escaparHTML(mesResumen.mes)}">
      </label>
      <button class="btn btn-main" type="submit">Ver mes</button>
      <a class="btn btn-light" target="_blank" href="/configuracion-caja/reporte-mensual?mes=${encodeURIComponent(mesResumen.mes)}">Ver reporte mensual</a>
    </form>

    <div class="resumen">
      <div class="card total"><span>Total mes</span><strong>${euro(mesResumen.total_caja)}</strong></div>
      <div class="card"><span>Pedidos pagados</span><strong>${mesResumen.pedidos_pagados}</strong></div>
      <div class="card"><span>Ticket medio</span><strong>${euro(mesResumen.ticket_medio)}</strong></div>
      <div class="card"><span>Pagos registrados</span><strong>${euro(mesResumen.total_pagos)}</strong></div>
    </div>

    <div class="resumen">
      <div class="card"><span>Efectivo</span><strong>${euro(mesResumen.efectivo)}</strong></div>
      <div class="card"><span>Tarjeta</span><strong>${euro(mesResumen.tarjeta)}</strong></div>
      <div class="card"><span>Bizum</span><strong>${euro(mesResumen.bizum)}</strong></div>
      <div class="card"><span>Otros</span><strong>${euro(mesResumen.otros)}</strong></div>
    </div>

    <form method="POST" action="/configuracion-caja/cierre-mensual" style="margin-top:14px;">
      <input type="hidden" name="mes" value="${escaparHTML(mesResumen.mes)}">

      <label>
        Observaciones cierre mensual
        <textarea name="observaciones_mensual" placeholder="Ej. Mes cerrado correctamente, revisar TPV, facturación enviada, etc."></textarea>
      </label>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
        <button class="btn btn-green" type="submit">Guardar cierre mensual</button>
        <a class="btn btn-blue" target="_blank" href="/configuracion-caja/reporte-mensual?mes=${encodeURIComponent(mesResumen.mes)}&print=1">Imprimir reporte mensual</a>
      </div>
    </form>
  </section>

  <section class="panel">
    <h2>Pagos del día</h2>
    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Mesa</th>
            <th>Pedido</th>
            <th>Método</th>
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          ${pagosHtml || `<tr><td colspan="5">Todavía no hay pagos registrados este día.</td></tr>`}
        </tbody>
      </table>
    </div>
  </section>

  <section class="panel">
    <h2>Histórico de cierres</h2>
    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Total</th>
            <th>Pedidos</th>
            <th>Ticket medio</th>
            <th>Efectivo</th>
            <th>Tarjeta</th>
            <th>Bizum</th>
            <th>Diferencia efectivo</th>
          </tr>
        </thead>
        <tbody>
          ${historicoHtml || `<tr><td colspan="9">Todavía no hay cierres guardados.</td></tr>`}
        </tbody>
      </table>
    </div>
  </section>
</main>
</body>
</html>
`;
}

function renderReporte(resumen, autoPrint){
  const pagosHtml = (resumen.pagos || []).map((pago)=>`
    <tr>
      <td>${escaparHTML(pago.fecha)}</td>
      <td>${escaparHTML(pago.mesa || "-")}</td>
      <td>${escaparHTML(pago.metodo)}</td>
      <td>${euro(pago.importe)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte caja ${escaparHTML(resumen.fecha)}</title>
<style>
body{
  font-family:Arial,sans-serif;
  background:#f3f4f6;
  margin:0;
  padding:24px;
  color:#111827;
}
.reporte{
  max-width:780px;
  margin:auto;
  background:#fff;
  padding:28px;
  border-radius:18px;
  box-shadow:0 12px 28px rgba(0,0,0,.1);
}
h1{margin-top:0;}
.grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:10px;
}
.card{
  border:1px solid #e5e7eb;
  border-radius:12px;
  padding:12px;
}
.card span{
  display:block;
  color:#6b7280;
  font-weight:900;
  font-size:12px;
}
.card strong{
  font-size:22px;
}
table{
  width:100%;
  border-collapse:collapse;
  margin-top:18px;
}
th,td{
  text-align:left;
  padding:9px;
  border-bottom:1px solid #e5e7eb;
}
.acciones{
  max-width:780px;
  margin:14px auto 0 auto;
  display:flex;
  gap:10px;
}
button,a{
  border:0;
  border-radius:12px;
  min-height:42px;
  padding:0 14px;
  font-weight:900;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  background:#111827;
  color:#fff;
  cursor:pointer;
}
@media print{
  body{
    background:#fff;
    padding:0;
  }
  .reporte{
    box-shadow:none;
    border-radius:0;
    max-width:none;
  }
  .acciones{
    display:none;
  }
}
</style>
</head>
<body>
  <div class="reporte">
    <h1>Reporte caja diaria</h1>
    <p><strong>Fecha:</strong> ${escaparHTML(resumen.fecha)}</p>

    <div class="grid">
      <div class="card"><span>Total caja</span><strong>${euro(resumen.total_caja)}</strong></div>
      <div class="card"><span>Ticket medio</span><strong>${euro(resumen.ticket_medio)}</strong></div>
      <div class="card"><span>Efectivo</span><strong>${euro(resumen.efectivo)}</strong></div>
      <div class="card"><span>Tarjeta</span><strong>${euro(resumen.tarjeta)}</strong></div>
      <div class="card"><span>Bizum</span><strong>${euro(resumen.bizum)}</strong></div>
      <div class="card"><span>Otros</span><strong>${euro(resumen.otros)}</strong></div>
    </div>

    <h2>Pagos del día</h2>
    <table>
      <thead>
        <tr>
          <th>Hora</th>
          <th>Mesa</th>
          <th>Método</th>
          <th>Importe</th>
        </tr>
      </thead>
      <tbody>
        ${pagosHtml || `<tr><td colspan="4">Sin pagos registrados.</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="acciones">
    <button onclick="window.print()">Imprimir</button>
    <a href="/configuracion-caja?fecha=${encodeURIComponent(resumen.fecha)}">Volver</a>
  </div>

  ${autoPrint ? `<script>window.addEventListener("load", function(){ setTimeout(function(){ window.print(); }, 600); });</script>` : ""}
</body>
</html>
`;
}


function renderReporteMensual(resumen, autoPrint){
  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte caja mensual ${escaparHTML(resumen.mes)}</title>
<style>
body{
  font-family:Arial,sans-serif;
  background:#f3f4f6;
  margin:0;
  padding:24px;
  color:#111827;
}
.reporte{
  max-width:780px;
  margin:auto;
  background:#fff;
  padding:28px;
  border-radius:18px;
  box-shadow:0 12px 28px rgba(0,0,0,.1);
}
h1{margin-top:0;}
.grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:10px;
}
.card{
  border:1px solid #e5e7eb;
  border-radius:12px;
  padding:12px;
}
.card span{
  display:block;
  color:#6b7280;
  font-weight:900;
  font-size:12px;
}
.card strong{
  font-size:22px;
}
.acciones{
  max-width:780px;
  margin:14px auto 0 auto;
  display:flex;
  gap:10px;
}
button,a{
  border:0;
  border-radius:12px;
  min-height:42px;
  padding:0 14px;
  font-weight:900;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  background:#111827;
  color:#fff;
  cursor:pointer;
}
@media print{
  body{
    background:#fff;
    padding:0;
  }
  .reporte{
    box-shadow:none;
    border-radius:0;
    max-width:none;
  }
  .acciones{
    display:none;
  }
}
</style>
</head>
<body>
  <div class="reporte">
    <h1>Reporte caja mensual</h1>
    <p><strong>Mes:</strong> ${escaparHTML(resumen.mes)}</p>

    <div class="grid">
      <div class="card"><span>Total mes</span><strong>${euro(resumen.total_caja)}</strong></div>
      <div class="card"><span>Ticket medio</span><strong>${euro(resumen.ticket_medio)}</strong></div>
      <div class="card"><span>Efectivo</span><strong>${euro(resumen.efectivo)}</strong></div>
      <div class="card"><span>Tarjeta</span><strong>${euro(resumen.tarjeta)}</strong></div>
      <div class="card"><span>Bizum</span><strong>${euro(resumen.bizum)}</strong></div>
      <div class="card"><span>Otros</span><strong>${euro(resumen.otros)}</strong></div>
      <div class="card"><span>Pedidos pagados</span><strong>${resumen.pedidos_pagados}</strong></div>
      <div class="card"><span>Pedidos cerrados</span><strong>${resumen.pedidos_cerrados}</strong></div>
    </div>
  </div>

  <div class="acciones">
    <button onclick="window.print()">Imprimir</button>
    <a href="/configuracion-caja?mes=${encodeURIComponent(resumen.mes)}">Volver</a>
  </div>

  ${autoPrint ? `<script>window.addEventListener("load", function(){ setTimeout(function(){ window.print(); }, 600); });</script>` : ""}
</body>
</html>
`;
}

function cajaProfesionalRoutes(db){
  const router = express.Router();

  router.get("/configuracion-caja", requiereCaja, (req,res)=>{
    const fecha = req.query.fecha || fechaHoyLocal();
    const mes = req.query.mes || fecha.slice(0,7) || mesActualLocal();

    calcularResumenDia(db, fecha, (errDia, resumenDia)=>{
      if(errDia){
        console.error("Error resumen caja diaria:", errDia.message);
        return res.status(500).send("Error cargando caja diaria");
      }

      calcularResumenMes(db, mes, (errMes, resumenMes)=>{
        if(errMes){
          console.error("Error resumen caja mensual:", errMes.message);
          return res.status(500).send("Error cargando caja mensual");
        }

        cargarHistorico(db, (errHist, historico)=>{
          if(errHist){
            console.error("Error histórico caja:", errHist.message);
            return res.status(500).send("Error cargando histórico de caja");
          }

          res.send(renderCaja(resumenDia, resumenMes, historico || [], req.query.ok || ""));
        });
      });
    });
  });

  router.get("/configuracion-caja/reporte-diario", requiereCaja, (req,res)=>{
    const fecha = req.query.fecha || fechaHoyLocal();

    calcularResumenDia(db, fecha, (errDia, resumenDia)=>{
      if(errDia){
        console.error("Error reporte caja:", errDia.message);
        return res.status(500).send("Error generando reporte de caja");
      }

      res.send(renderReporte(resumenDia, req.query.print === "1"));
    });
  });


  router.get("/configuracion-caja/reporte-mensual", requiereCaja, (req,res)=>{
    const mes = req.query.mes || mesActualLocal();

    calcularResumenMes(db, mes, (errMes, resumenMes)=>{
      if(errMes){
        console.error("Error reporte mensual caja:", errMes.message);
        return res.status(500).send("Error generando reporte mensual de caja");
      }

      res.send(renderReporteMensual(resumenMes, req.query.print === "1"));
    });
  });

  router.post("/configuracion-caja/cierre-mensual", requiereCaja, (req,res)=>{
    const mes = req.body.mes || mesActualLocal();

    calcularResumenMes(db, mes, (errMes, resumenMes)=>{
      if(errMes){
        console.error("Error calculando cierre mensual:", errMes.message);
        return res.redirect("/configuracion-caja?mes=" + encodeURIComponent(mes) + "&ok=Error calculando cierre mensual");
      }

      guardarCierreMensual(db, resumenMes, req.body || {}, (errGuardar)=>{
        if(errGuardar){
          console.error("Error guardando cierre mensual:", errGuardar.message);
          return res.redirect("/configuracion-caja?mes=" + encodeURIComponent(mes) + "&ok=Error guardando cierre mensual");
        }

        imprimirCentroImpresion(db, "reportes", textoReporteCajaMensual(resumenMes), function(resultadoImpresion){
          if(resultadoImpresion && resultadoImpresion.modo === "escpos_red" && !resultadoImpresion.ok){
            console.log("[CAJA] Cierre mensual guardado, pero no se pudo imprimir reporte por ESC/POS:", resultadoImpresion.motivo || resultadoImpresion.error || "sin detalle");
          }
        });

        res.redirect("/configuracion-caja?mes=" + encodeURIComponent(mes) + "&ok=Cierre mensual guardado correctamente");
      });
    });
  });

  router.post("/configuracion-caja/cierre-diario", requiereCaja, (req,res)=>{
    const fecha = req.body.fecha || fechaHoyLocal();

    calcularResumenDia(db, fecha, (errDia, resumenDia)=>{
      if(errDia){
        console.error("Error calculando cierre diario:", errDia.message);
        return res.redirect("/configuracion-caja?fecha=" + encodeURIComponent(fecha) + "&ok=Error calculando cierre diario");
      }

      guardarCierreDiario(db, resumenDia, req.body || {}, (errGuardar)=>{
        if(errGuardar){
          console.error("Error guardando cierre diario:", errGuardar.message);
          return res.redirect("/configuracion-caja?fecha=" + encodeURIComponent(fecha) + "&ok=Error guardando cierre diario");
        }

        imprimirCentroImpresion(db, "reportes", textoReporteCaja(resumenDia), function(resultadoImpresion){
          if(resultadoImpresion && resultadoImpresion.modo === "escpos_red" && !resultadoImpresion.ok){
            console.log("[CAJA] Cierre guardado, pero no se pudo imprimir reporte por ESC/POS:", resultadoImpresion.motivo || resultadoImpresion.error || "sin detalle");
          }
        });

        res.redirect("/configuracion-caja?fecha=" + encodeURIComponent(fecha) + "&ok=Cierre diario guardado correctamente");
      });
    });
  });

  return router;
}

module.exports = cajaProfesionalRoutes;
