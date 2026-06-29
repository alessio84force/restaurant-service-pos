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
          mensaje_ticket: "Gracias por su visita"
        });

      }
    );

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

        db.all(lineasSql, [pedido.id], (err, productos) => {

          if (err) return res.status(500).send(err.message);

          const fecha = new Date().toLocaleString("es-ES");

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

          const logoHtml = config.logo
            ? `<img class="logo" src="${escaparHTML(config.logo)}" alt="Logo restaurante">`
            : "";

          const nifHtml = config.partita_iva
            ? `<div>${escaparHTML(config.partita_iva)}</div>`
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

          const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>Precuenta Mesa ${pedido.mesa}</title>
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

                .linea-total {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  font-size: 22px;
                  font-weight: 900;
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
                  <p>Precuenta</p>

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
                  <div class="linea-total">
                    <span>TOTAL</span>
                    <span>${dinero(pedido.total)}</span>
                  </div>
                </div>

                <div class="aviso">
                  Precuenta informativa.<br>
                  Revise su pedido antes del pago.
                </div>

                <div class="gracias">
                  ${escaparHTML(mensajeFinal)}
                </div>

                <div class="software">
                  Restaurant Service POS
                </div>
              </div>

              <div class="acciones-ticket">
                <button onclick="window.print()">Imprimir</button>
              </div>
            </body>
            </html>
          `;

          res.send(html);

        });

      });

    });

  });

  return router;

}

module.exports = ticketRoutes;
