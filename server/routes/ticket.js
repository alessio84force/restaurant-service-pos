const { imprimirCentroImpresion } = require("../printing/centroImpresionRuntime");
const express = require("express");

function ticketRoutes(db) {

  const router = express.Router();

  function escaparHTML(valor) {

    return String(valor || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

  function dinero(valor) {

    return Number(valor || 0).toFixed(2).replace(".", ",") + " EUR";

  }

  function obtenerConfiguracion(callback) {

    db.get(
      "SELECT * FROM configurazione WHERE id = 1",
      [],
      (err, config) => {

        if (err) return callback(err);

        callback(null, config || {
          nome_ristorante: "Restaurante",
          partita_iva: "",
          indirizzo: "",
          telefono: "",
          email: "",
          logo: "",
          iva: 10,
          mensaje_ticket: "Gracias por su visita"
        });

      }
    );

  }

  function obtenerLineasPedido(pedidoId, callback) {

    const lineasSql = `
      SELECT 
        pedido_lineas.id, 
        productos.nombre, 
        pedido_lineas.cantidad, 
        pedido_lineas.precio,
        (pedido_lineas.cantidad * pedido_lineas.precio) AS subtotal,
        pedido_lineas.nota
      FROM pedido_lineas
      JOIN productos ON pedido_lineas.producto_id = productos.id
      WHERE pedido_lineas.pedido_id = ?
      ORDER BY pedido_lineas.id
    `;

    db.all(lineasSql, [pedidoId], callback);

  }

  function obtenerPagosPedido(pedidoId, callback) {

    db.all(
      "SELECT * FROM pagos WHERE pedido_id = ? ORDER BY id",
      [pedidoId],
      callback
    );

  }


  function obtenerConfigTicketCentroImpresion(config) {
    try {
      const centro = config && config.config_impresion_json
        ? JSON.parse(config.config_impresion_json)
        : null;

      return centro && centro.ticket ? centro.ticket : { modo: "preview" };
    } catch (e) {
      return { modo: "preview" };
    }
  }

  function generarTextoTicketCentroImpresion(config, pedido, productos, pagos, tipo) {
    const titulo = tipo === "final" ? "TICKET FINAL" : "PRECUENTA";
    const total = Number(pedido.total || 0);
    const nombreRestaurante = config.nombre_ristorante || "Restaurant Service";
    const mensajeFinal = config.mensaje_ticket || "Gracias por su visita";

    let texto = "";
    texto += "================================\n";
    texto += String(nombreRestaurante).toUpperCase() + "\n";
    texto += "================================\n";
    texto += titulo + "\n";
    texto += "MESA: " + pedido.mesa + "\n";
    texto += "PEDIDO: " + pedido.id + "\n";
    texto += "FECHA: " + new Date().toLocaleString("es-ES") + "\n";
    texto += "--------------------------------\n";

    (productos || []).forEach((p) => {
      const cantidad = Number(p.cantidad || 0);
      const nombre = String(p.nombre || p.producto || "Producto").toUpperCase();
      const precio = Number(p.precio || 0);
      const subtotal = Number(p.subtotal || (cantidad * precio) || 0);

      texto += cantidad + " x " + nombre + "\n";
      texto += "  " + precio.toFixed(2) + " EUR  " + subtotal.toFixed(2) + " EUR\n";

      if (p.nota) {
        texto += "  >>> NOTA <<<\n";
        texto += "  " + String(p.nota).toUpperCase() + "\n";
      }
    });

    texto += "--------------------------------\n";
    texto += "TOTAL: " + total.toFixed(2) + " EUR\n";

    if (Array.isArray(pagos) && pagos.length > 0) {
      texto += "--------------------------------\n";
      texto += "PAGOS\n";

      pagos.forEach((pago) => {
        texto += String(pago.metodo || "pago").toUpperCase() + ": " + Number(pago.importe || 0).toFixed(2) + " EUR\n";
      });
    }

    if (tipo !== "final") {
      texto += "--------------------------------\n";
      texto += "PRECUENTA INFORMATIVA\n";
      texto += "REVise SU PEDIDO ANTES DEL PAGO\n";
    }

    texto += "--------------------------------\n";
    texto += String(mensajeFinal).toUpperCase() + "\n";
    texto += "================================\n\n\n";

    return texto;
  }

  function imprimirTicketCentroImpresion(db, config, pedido, productos, pagos, tipo) {
    const cfgTicket = obtenerConfigTicketCentroImpresion(config);

    imprimirCentroImpresion(
      db,
      "ticket",
      generarTextoTicketCentroImpresion(config, pedido, productos, pagos, tipo),
      function(resultadoImpresion) {
        if (resultadoImpresion && resultadoImpresion.modo === "escpos_red" && !resultadoImpresion.ok) {
          console.log("[TICKET] Ticket registrado, pero no se pudo imprimir por ESC/POS:", resultadoImpresion.motivo || resultadoImpresion.error || "sin detalle");
        }

        if (resultadoImpresion && resultadoImpresion.modo === "escpos_red" && resultadoImpresion.ok) {
          console.log("[TICKET] Ticket enviado por ESC/POS correctamente.");
        }
      }
    );

    return cfgTicket;
  }

  function generarHTMLTicket(config, pedido, productos, pagos, tipo) {

    const fecha = new Date().toLocaleString("es-ES");
    const total = Number(pedido.total || 0);
    const ivaPorcentaje = Number(config.iva || 10);
    const baseImponible = ivaPorcentaje > 0 ? total / (1 + (ivaPorcentaje / 100)) : total;
    const ivaImporte = total - baseImponible;

    let filas = "";

    productos.forEach(p => {

      filas += `
        <tr>
          <td class="producto">
            <strong>${escaparHTML(p.nombre)}</strong>
            ${p.nota ? `<div class="nota">Nota: ${escaparHTML(p.nota)}</div>` : ""}
          </td>
          <td class="cantidad">${p.cantidad}</td>
          <td class="importe">${dinero(p.subtotal)}</td>
        </tr>
      `;

    });

    let pagosHtml = "";

    if (Array.isArray(pagos) && pagos.length > 0) {

      pagosHtml = `
        <div class="pagos">
          <div class="titulo-seccion">Pagos</div>
          ${pagos.map(pago => `
            <div class="linea-pago">
              <span>${escaparHTML(String(pago.metodo || "").toUpperCase())}</span>
              <strong>${dinero(pago.importe)}</strong>
            </div>
          `).join("")}
        </div>
      `;

    }

    const logoHtml = config.logo
      ? `<img class="logo" src="${escaparHTML(config.logo)}" alt="Logo restaurante">`
      : "";

    const nifHtml = config.partita_iva
      ? `<div><strong>NIF/CIF:</strong> ${escaparHTML(config.partita_iva)}</div>`
      : "";

    const direccionHtml = config.indirizzo
      ? `<div>${escaparHTML(config.indirizzo)}</div>`
      : "";

    const telefonoHtml = config.telefono
      ? `<div>Tel: ${escaparHTML(config.telefono)}</div>`
      : "";

    const emailHtml = config.email
      ? `<div>${escaparHTML(config.email)}</div>`
      : "";

    const mensajeFinal = config.mensaje_ticket || "Gracias por su visita";

    const ticketCentroConfig = obtenerConfigTicketCentroImpresion(config);
    const ticketModoImpresion = String(ticketCentroConfig.modo || "preview");
    const autoPrintSistema = ticketModoImpresion === "sistema";

    const tituloDocumento = tipo === "final" ? "Ticket final" : "Precuenta";
    const avisoHtml = tipo === "final"
      ? `
        <div class="aviso">
          Documento emitido tras el pago.
        </div>
      `
      : `
        <div class="aviso">
          Precuenta informativa.<br>
          Revise su pedido antes del pago.
        </div>
      `;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${tituloDocumento} Mesa ${pedido.mesa}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 24px;
            background: #e5e7eb;
            font-family: Arial, sans-serif;
            color: #111827;
          }

          .ticket {
            width: 320px;
            background: white;
            margin: 0 auto;
            padding: 18px 16px;
            border-radius: 12px;
            box-shadow: 0 14px 34px rgba(15,23,42,.18);
          }

          .marca {
            text-align: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }

          .logo {
            max-width: 135px;
            max-height: 75px;
            object-fit: contain;
            margin-bottom: 8px;
          }

          .marca h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: .5px;
            text-transform: uppercase;
          }

          .marca p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #4b5563;
          }

          .datos-restaurante {
            margin-top: 8px;
            font-size: 11px;
            color: #374151;
            line-height: 1.35;
          }

          .datos {
            font-size: 13px;
            line-height: 1.45;
            border-bottom: 1px dashed #9ca3af;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }

          .datos strong {
            display: inline-block;
            min-width: 70px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          th {
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            border-bottom: 1px solid #111827;
            padding: 5px 0;
          }

          td {
            border-bottom: 1px dashed #d1d5db;
            padding: 8px 0;
            vertical-align: top;
          }

          .producto {
            width: 58%;
            padding-right: 6px;
          }

          .cantidad {
            width: 14%;
            text-align: center;
            font-weight: bold;
          }

          .importe {
            width: 28%;
            text-align: right;
            font-weight: bold;
          }

          .nota {
            margin-top: 3px;
            font-size: 11px;
            color: #dc2626;
            font-weight: bold;
          }

          .resumen {
            margin-top: 12px;
            border-top: 2px solid #111827;
            padding-top: 10px;
          }

          .linea-resumen,
          .linea-pago {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 4px;
          }

          .linea-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 22px;
            font-weight: 900;
            margin-top: 8px;
          }

          .pagos {
            margin-top: 12px;
            border-top: 1px dashed #9ca3af;
            padding-top: 10px;
          }

          .titulo-seccion {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 900;
            margin-bottom: 6px;
          }

          .aviso {
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px dashed #9ca3af;
            text-align: center;
            font-size: 11px;
            color: #4b5563;
            line-height: 1.35;
          }

          .gracias {
            margin-top: 12px;
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            white-space: pre-line;
          }

          .software {
            margin-top: 10px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
          }

          .acciones-ticket {
            width: 320px;
            margin: 16px auto 0 auto;
          }

          button {
            width: 100%;
            padding: 14px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          }

          button:hover {
            background: #1d4ed8;
          }

          @media print {
            body {
              background: white;
              padding: 0;
            }

            .ticket {
              width: 80mm;
              max-width: 80mm;
              margin: 0;
              padding: 0 3mm;
              border-radius: 0;
              box-shadow: none;
            }

            .acciones-ticket {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="marca">
            ${logoHtml}
            <h1>${escaparHTML(config.nome_ristorante || "Restaurante")}</h1>
            <p>${tituloDocumento}</p>

            <div class="datos-restaurante">
              ${nifHtml}
              ${direccionHtml}
              ${telefonoHtml}
              ${emailHtml}
            </div>
          </div>

          <div class="datos">
            <div><strong>Mesa:</strong> ${pedido.mesa}</div>
            <div><strong>Pedido:</strong> ${pedido.id}</div>
            <div><strong>Fecha:</strong> ${fecha}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>

          <div class="resumen">
            <div class="linea-resumen">
              <span>Base imponible</span>
              <strong>${dinero(baseImponible)}</strong>
            </div>
            <div class="linea-resumen">
              <span>IVA incluido ${ivaPorcentaje}%</span>
              <strong>${dinero(ivaImporte)}</strong>
            </div>
            <div class="linea-total">
              <span>TOTAL</span>
              <span>${dinero(total)}</span>
            </div>
          </div>

          ${pagosHtml}

          ${avisoHtml}

          <div class="gracias">
            ${escaparHTML(mensajeFinal)}
          </div>

          <div class="software">
            Restaurant Service POS
          </div>
        </div>

        <div class="acciones-ticket">
          <button onclick="window.print()">Imprimir</button>
          ${autoPrintSistema ? `
          <script>
            window.addEventListener('load', function(){
              setTimeout(function(){
                window.print();
              }, 600);
            });
          </script>
          ` : ""}
        </div>
      </body>
      </html>
    `;

  }

  router.get("/ticket/:mesa", (req, res) => {

    const mesa = req.params.mesa;

    obtenerConfiguracion((errConfig, config) => {

      if (errConfig) return res.status(500).send(errConfig.message);

      const pedidoSql = `
        SELECT 
          pedidos.id, 
          mesas.numero AS mesa, 
          pedidos.estado, 
          pedidos.total, 
          pedidos.creado_en
        FROM pedidos
        JOIN mesas ON pedidos.mesa_id = mesas.id
        WHERE mesas.numero = ? 
        AND pedidos.estado IN ('abierto','cuenta')
        ORDER BY pedidos.id DESC
        LIMIT 1
      `;

      db.get(pedidoSql, [mesa], (err, pedido) => {

        if (err) return res.status(500).send(err.message);

        if (!pedido) {
          return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>Sin pedido</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 30px; text-align: center; }
              </style>
            </head>
            <body>
              <h1>No hay pedido abierto para esta mesa</h1>
              <p>Mesa ${escaparHTML(mesa)}</p>
            </body>
            </html>
          `);
        }

        obtenerLineasPedido(pedido.id, (err, productos) => {

          if (err) return res.status(500).send(err.message);

          imprimirTicketCentroImpresion(db, config, pedido, productos, [], "precuenta");

          const html = generarHTMLTicket(config, pedido, productos, [], "precuenta");

          res.send(html);

        });

      });

    });

  });

  router.get("/ticket-final/:pedido", (req, res) => {

    const pedidoId = req.params.pedido;

    obtenerConfiguracion((errConfig, config) => {

      if (errConfig) return res.status(500).send(errConfig.message);

      const pedidoSql = `
        SELECT 
          pedidos.id, 
          mesas.numero AS mesa, 
          pedidos.estado, 
          pedidos.total, 
          pedidos.creado_en,
          pedidos.pagado_en
        FROM pedidos
        JOIN mesas ON pedidos.mesa_id = mesas.id
        WHERE pedidos.id = ?
        LIMIT 1
      `;

      db.get(pedidoSql, [pedidoId], (err, pedido) => {

        if (err) return res.status(500).send(err.message);

        if (!pedido) {
          return res.status(404).send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>Pedido no encontrado</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 30px; text-align: center; }
              </style>
            </head>
            <body>
              <h1>Pedido no encontrado</h1>
              <p>Pedido ${escaparHTML(pedidoId)}</p>
            </body>
            </html>
          `);
        }

        obtenerLineasPedido(pedido.id, (err, productos) => {

          if (err) return res.status(500).send(err.message);

          obtenerPagosPedido(pedido.id, (err, pagos) => {

            if (err) return res.status(500).send(err.message);

            imprimirTicketCentroImpresion(db, config, pedido, productos, pagos, "final");

            const html = generarHTMLTicket(config, pedido, productos, pagos, "final");

            res.send(html);

          });

        });

      });

    });

  });

  return router;

}

module.exports = ticketRoutes;
