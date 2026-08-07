const { imprimirCentroImpresion } = require("../printing/centroImpresionRuntime");
const express = require("express");
const { restauranteIdFromReq } = require("../utils/restauranteContext");
const { normalizarIdioma } = require("../utils/i18n");

function ticketRoutes(db) {

  const router = express.Router();


  function textosTicketV2(idiomaValor) {

    const idioma = normalizarIdioma(
      idiomaValor
    );

    const textos = {
      es: {
        lang: "es",
        locale: "es-ES",
        restaurante: "Restaurante",
        gracias: "Gracias por su visita",
        ticketFinal: "Ticket final",
        precuenta: "Precuenta",
        mesa: "Mesa",
        pedido: "Pedido",
        fecha: "Fecha",
        producto: "Producto",
        cantidad: "Cant.",
        total: "Total",
        nota: "Nota",
        pagos: "Pagos",
        pago: "Pago",
        tarjeta: "Tarjeta",
        efectivo: "Efectivo",
        bizum: "Bizum",
        baseImponible: "Base imponible",
        ivaIncluido: "IVA incluido",
        imprimir: "Imprimir",
        documentoPagado:
          "Documento emitido tras el pago.",
        precuentaInformativa:
          "Precuenta informativa.",
        revisarPedido:
          "Revise su pedido antes del pago.",
        nif: "NIF/CIF",
        telefono: "Tel",
        logo: "Logo restaurante",
        sinPedidoTitulo: "Sin pedido",
        sinPedidoMensaje:
          "No hay pedido abierto para esta mesa",
        pedidoNoEncontradoTitulo:
          "Pedido no encontrado"
      },

      it: {
        lang: "it",
        locale: "it-IT",
        restaurante: "Ristorante",
        gracias: "Grazie per la visita",
        ticketFinal: "Ticket finale",
        precuenta: "Preconto",
        mesa: "Tavolo",
        pedido: "Ordine",
        fecha: "Data",
        producto: "Prodotto",
        cantidad: "Qtà",
        total: "Totale",
        nota: "Nota",
        pagos: "Pagamenti",
        pago: "Pagamento",
        tarjeta: "Carta",
        efectivo: "Contanti",
        bizum: "Bizum",
        baseImponible: "Imponibile",
        ivaIncluido: "IVA inclusa",
        imprimir: "Stampa",
        documentoPagado:
          "Documento emesso dopo il pagamento.",
        precuentaInformativa:
          "Preconto informativo.",
        revisarPedido:
          "Controlla l'ordine prima del pagamento.",
        nif: "P. IVA",
        telefono: "Tel",
        logo: "Logo ristorante",
        sinPedidoTitulo: "Nessun ordine",
        sinPedidoMensaje:
          "Non c'è un ordine aperto per questo tavolo",
        pedidoNoEncontradoTitulo:
          "Ordine non trovato"
      },

      en: {
        lang: "en",
        locale: "en-GB",
        restaurante: "Restaurant",
        gracias: "Thank you for visiting",
        ticketFinal: "Final receipt",
        precuenta: "Bill preview",
        mesa: "Table",
        pedido: "Order",
        fecha: "Date",
        producto: "Product",
        cantidad: "Qty.",
        total: "Total",
        nota: "Note",
        pagos: "Payments",
        pago: "Payment",
        tarjeta: "Card",
        efectivo: "Cash",
        bizum: "Bizum",
        baseImponible: "Net amount",
        ivaIncluido: "VAT included",
        imprimir: "Print",
        documentoPagado:
          "Document issued after payment.",
        precuentaInformativa:
          "Informative bill preview.",
        revisarPedido:
          "Check the order before payment.",
        nif: "VAT No.",
        telefono: "Tel",
        logo: "Restaurant logo",
        sinPedidoTitulo: "No order",
        sinPedidoMensaje:
          "There is no open order for this table",
        pedidoNoEncontradoTitulo:
          "Order not found"
      }
    };

    return textos[idioma] || textos.es;
  }

  function formatearMetodoTicketV2(
    metodo,
    textos
  ) {

    const valor = String(
      metodo || ""
    ).trim().toLowerCase();

    if (valor === "tarjeta") {
      return textos.tarjeta;
    }

    if (valor === "efectivo") {
      return textos.efectivo;
    }

    if (valor === "bizum") {
      return textos.bizum;
    }

    return metodo || textos.pago;
  }

  function requiereLoginTicket(req, res, next) {
    if (
      req.session &&
      req.session.usuario
    ) {
      return next();
    }

    return res.status(401).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Sesión no válida</title>
      </head>
      <body style="font-family:Arial,sans-serif;padding:30px;text-align:center;">
        <h1>Sesión no válida</h1>
        <p>Inicia sesión para consultar el ticket.</p>
      </body>
      </html>
    `);
  }

  function generarPaginaErrorTicketV2(
    textos,
    titulo,
    mensaje,
    etiqueta,
    valor
  ) {

    return `
      <!DOCTYPE html>
      <html lang="${textos.lang}">
      <head>
        <meta charset="UTF-8">
        <title>${escaparHTML(titulo)}</title>
      </head>
      <body style="font-family:Arial,sans-serif;padding:30px;text-align:center;">
        <h1>${escaparHTML(mensaje)}</h1>
        <p>
          ${escaparHTML(etiqueta)}
          ${escaparHTML(valor)}
        </p>
      </body>
      </html>
    `;
  }

  function escaparHTML(valor) {

    return String(valor || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

  function dinero(valor, locale) {

    return new Intl.NumberFormat(
      locale || "es-ES",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(
      Number(valor || 0)
    ) + " EUR";
  }

  function obtenerConfiguracion(restauranteId, callback) {

    db.get(
      `
      SELECT
        configurazione.*,
        COALESCE(restaurantes.idioma,'es') AS idioma
      FROM configurazione
      LEFT JOIN restaurantes
        ON restaurantes.id = ?
      WHERE COALESCE(configurazione.restaurante_id,1)=?
      ORDER BY configurazione.id DESC
      LIMIT 1
      `,
      [restauranteId, restauranteId],
      (err, config) => {

        if (err) {
          return callback(err);
        }

        callback(null, config || {
          nome_ristorante: "Restaurante",
          partita_iva: "",
          indirizzo: "",
          telefono: "",
          email: "",
          logo: "",
          iva: 10,
          idioma: "es",
          mensaje_ticket: "Gracias por su visita"
        });
      }
    );
  }

  function obtenerLineasPedido(
    pedidoId,
    restauranteId,
    callback
  ) {

    const lineasSql = `
      SELECT
        pedido_lineas.id,
        productos.nombre,
        pedido_lineas.cantidad,
        pedido_lineas.precio,
        (
          pedido_lineas.cantidad *
          pedido_lineas.precio
        ) AS subtotal,
        pedido_lineas.nota
      FROM pedido_lineas
      JOIN productos
        ON pedido_lineas.producto_id = productos.id
        AND COALESCE(productos.restaurante_id,1)=?
      WHERE pedido_lineas.pedido_id=?
        AND COALESCE(pedido_lineas.restaurante_id,1)=?
      ORDER BY pedido_lineas.id
    `;

    db.all(
      lineasSql,
      [
        restauranteId,
        pedidoId,
        restauranteId
      ],
      callback
    );
  }

  function obtenerPagosPedido(
    pedidoId,
    restauranteId,
    callback
  ) {

    db.all(
      `
      SELECT *
      FROM pagos
      WHERE pedido_id=?
        AND COALESCE(restaurante_id,1)=?
      ORDER BY id
      `,
      [pedidoId, restauranteId],
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

  function generarTextoTicketCentroImpresion(
    config,
    pedido,
    productos,
    pagos,
    tipo
  ) {

    const textos = textosTicketV2(
      config && config.idioma
    );

    const titulo = tipo === "final"
      ? textos.ticketFinal.toUpperCase()
      : textos.precuenta.toUpperCase();

    const total = Number(
      pedido.total || 0
    );

    const nombreRestaurante =
      config.nome_ristorante ||
      config.nombre_ristorante ||
      textos.restaurante;

    const mensajeFinal =
      config.mensaje_ticket ||
      textos.gracias;

    function importe(valor) {
      return dinero(
        valor,
        textos.locale
      );
    }

    let texto = "";

    texto += "================================\n";
    texto += String(nombreRestaurante).toUpperCase() + "\n";
    texto += "================================\n";
    texto += titulo + "\n";

    texto +=
      textos.mesa.toUpperCase() +
      ": " +
      pedido.mesa +
      "\n";

    texto +=
      textos.pedido.toUpperCase() +
      ": " +
      pedido.id +
      "\n";

    texto +=
      textos.fecha.toUpperCase() +
      ": " +
      new Date().toLocaleString(
        textos.locale
      ) +
      "\n";

    texto += "--------------------------------\n";

    (productos || []).forEach((producto) => {

      const cantidad = Number(
        producto.cantidad || 0
      );

      const nombre = String(
        producto.nombre ||
        producto.producto ||
        textos.producto
      ).toUpperCase();

      const precio = Number(
        producto.precio || 0
      );

      const subtotal = Number(
        producto.subtotal ||
        cantidad * precio ||
        0
      );

      texto +=
        cantidad +
        " x " +
        nombre +
        "\n";

      texto +=
        "  " +
        importe(precio) +
        "  " +
        importe(subtotal) +
        "\n";

      if (producto.nota) {
        texto +=
          "  >>> " +
          textos.nota.toUpperCase() +
          " <<<\n";

        texto +=
          "  " +
          String(producto.nota).toUpperCase() +
          "\n";
      }
    });

    texto += "--------------------------------\n";

    texto +=
      textos.total.toUpperCase() +
      ": " +
      importe(total) +
      "\n";

    if (
      Array.isArray(pagos) &&
      pagos.length > 0
    ) {

      texto += "--------------------------------\n";
      texto += textos.pagos.toUpperCase() + "\n";

      pagos.forEach((pago) => {
        texto +=
          formatearMetodoTicketV2(
            pago.metodo,
            textos
          ).toUpperCase() +
          ": " +
          importe(pago.importe) +
          "\n";
      });
    }

    if (tipo !== "final") {
      texto += "--------------------------------\n";

      texto +=
        textos.precuentaInformativa
          .toUpperCase() +
        "\n";

      texto +=
        textos.revisarPedido
          .toUpperCase() +
        "\n";
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

    const textos = textosTicketV2(
      config && config.idioma
    );

    const fecha = new Date().toLocaleString(
      textos.locale
    );
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
            ${p.nota ? `<div class="nota">${textos.nota}: ${escaparHTML(p.nota)}</div>` : ""}
          </td>
          <td class="cantidad">${p.cantidad}</td>
          <td class="importe">${dinero(
              p.subtotal,
              textos.locale
            )}</td>
        </tr>
      `;

    });

    let pagosHtml = "";

    if (Array.isArray(pagos) && pagos.length > 0) {

      pagosHtml = `
        <div class="pagos">
          <div class="titulo-seccion">${textos.pagos}</div>
          ${pagos.map(pago => `
            <div class="linea-pago">
              <span>${escaparHTML(
                formatearMetodoTicketV2(
                  pago.metodo,
                  textos
                )
              )}</span>
              <strong>${dinero(
                pago.importe,
                textos.locale
              )}</strong>
            </div>
          `).join("")}
        </div>
      `;

    }

    const logoHtml = config.logo
      ? `<img class="logo" src="${escaparHTML(config.logo)}" alt="${textos.logo}">`
      : "";

    const nifHtml = config.partita_iva
      ? `<div><strong>${textos.nif}:</strong> ${escaparHTML(config.partita_iva)}</div>`
      : "";

    const direccionHtml = config.indirizzo
      ? `<div>${escaparHTML(config.indirizzo)}</div>`
      : "";

    const telefonoHtml = config.telefono
      ? `<div>${textos.telefono}: ${escaparHTML(config.telefono)}</div>`
      : "";

    const emailHtml = config.email
      ? `<div>${escaparHTML(config.email)}</div>`
      : "";

    const mensajeFinal =
      config.mensaje_ticket ||
      textos.gracias;

    const ticketCentroConfig = obtenerConfigTicketCentroImpresion(config);
    const ticketModoImpresion = String(ticketCentroConfig.modo || "preview");
    const autoPrintSistema = ticketModoImpresion === "sistema";

    const tituloDocumento =
      tipo === "final"
        ? textos.ticketFinal
        : textos.precuenta;
    const avisoHtml = tipo === "final"
      ? `
        <div class="aviso">
          ${textos.documentoPagado}
        </div>
      `
      : `
        <div class="aviso">
          ${textos.precuentaInformativa}<br>
          ${textos.revisarPedido}
        </div>
      `;

    return `
      <!DOCTYPE html>
      <html lang="${textos.lang}">
      <head>
        <meta charset="UTF-8">
        <title>${tituloDocumento} - ${textos.mesa} ${pedido.mesa}</title>
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
            <h1>${escaparHTML(
              config.nome_ristorante ||
              config.nombre_ristorante ||
              textos.restaurante
            )}</h1>
            <p>${tituloDocumento}</p>

            <div class="datos-restaurante">
              ${nifHtml}
              ${direccionHtml}
              ${telefonoHtml}
              ${emailHtml}
            </div>
          </div>

          <div class="datos">
            <div><strong>${textos.mesa}:</strong> ${pedido.mesa}</div>
            <div><strong>${textos.pedido}:</strong> ${pedido.id}</div>
            <div><strong>${textos.fecha}:</strong> ${fecha}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${textos.producto}</th>
                <th>${textos.cantidad}</th>
                <th>${textos.total}</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>

          <div class="resumen">
            <div class="linea-resumen">
              <span>${textos.baseImponible}</span>
              <strong>${dinero(
                baseImponible,
                textos.locale
              )}</strong>
            </div>
            <div class="linea-resumen">
              <span>${textos.ivaIncluido} ${ivaPorcentaje}%</span>
              <strong>${dinero(
                ivaImporte,
                textos.locale
              )}</strong>
            </div>
            <div class="linea-total">
              <span>${textos.total.toUpperCase()}</span>
              <span>${dinero(
              total,
              textos.locale
            )}</span>
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
          <button onclick="window.print()">${textos.imprimir}</button>
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

  router.get(
    "/ticket/:mesa",
    requiereLoginTicket,
    (req, res) => {

      const restauranteId =
        restauranteIdFromReq(req);

      const mesa = req.params.mesa;

      obtenerConfiguracion(
        restauranteId,
        (errConfig, config) => {

          if (errConfig) {
            return res
              .status(500)
              .send(errConfig.message);
          }

          const pedidoSql = `
            SELECT
              pedidos.id,
              mesas.numero AS mesa,
              pedidos.estado,
              pedidos.total,
              pedidos.creado_en
            FROM pedidos
            JOIN mesas
              ON pedidos.mesa_id = mesas.id
              AND COALESCE(mesas.restaurante_id,1)=?
            WHERE mesas.numero=?
              AND COALESCE(pedidos.restaurante_id,1)=?
              AND pedidos.estado IN ('abierto','cuenta')
            ORDER BY pedidos.id DESC
            LIMIT 1
          `;

          db.get(
            pedidoSql,
            [
              restauranteId,
              mesa,
              restauranteId
            ],
            (err, pedido) => {

              if (err) {
                return res
                  .status(500)
                  .send(err.message);
              }

              if (!pedido) {

                const textos =
                  textosTicketV2(
                    config && config.idioma
                  );

                return res.status(404).send(
                  generarPaginaErrorTicketV2(
                    textos,
                    textos.sinPedidoTitulo,
                    textos.sinPedidoMensaje,
                    textos.mesa,
                    mesa
                  )
                );
              }

              obtenerLineasPedido(
                pedido.id,
                restauranteId,
                (errLineas, productos) => {

                  if (errLineas) {
                    return res
                      .status(500)
                      .send(errLineas.message);
                  }

                  imprimirTicketCentroImpresion(
                    db,
                    config,
                    pedido,
                    productos,
                    [],
                    "precuenta"
                  );

                  const html = generarHTMLTicket(
                    config,
                    pedido,
                    productos,
                    [],
                    "precuenta"
                  );

                  res.send(html);
                }
              );
            }
          );
        }
      );
    }
  );

  router.get(
    "/ticket-final/:pedido",
    requiereLoginTicket,
    (req, res) => {

      const restauranteId =
        restauranteIdFromReq(req);

      const pedidoId = req.params.pedido;

      obtenerConfiguracion(
        restauranteId,
        (errConfig, config) => {

          if (errConfig) {
            return res
              .status(500)
              .send(errConfig.message);
          }

          const pedidoSql = `
            SELECT
              pedidos.id,
              mesas.numero AS mesa,
              pedidos.estado,
              pedidos.total,
              pedidos.creado_en,
              pedidos.pagado_en
            FROM pedidos
            JOIN mesas
              ON pedidos.mesa_id = mesas.id
              AND COALESCE(mesas.restaurante_id,1)=?
            WHERE pedidos.id=?
              AND COALESCE(pedidos.restaurante_id,1)=?
            LIMIT 1
          `;

          db.get(
            pedidoSql,
            [
              restauranteId,
              pedidoId,
              restauranteId
            ],
            (err, pedido) => {

              if (err) {
                return res
                  .status(500)
                  .send(err.message);
              }

              if (!pedido) {

                const textos =
                  textosTicketV2(
                    config && config.idioma
                  );

                return res.status(404).send(
                  generarPaginaErrorTicketV2(
                    textos,
                    textos.pedidoNoEncontradoTitulo,
                    textos.pedidoNoEncontradoTitulo,
                    textos.pedido,
                    pedidoId
                  )
                );
              }

              obtenerLineasPedido(
                pedido.id,
                restauranteId,
                (errLineas, productos) => {

                  if (errLineas) {
                    return res
                      .status(500)
                      .send(errLineas.message);
                  }

                  obtenerPagosPedido(
                    pedido.id,
                    restauranteId,
                    (errPagos, pagos) => {

                      if (errPagos) {
                        return res
                          .status(500)
                          .send(errPagos.message);
                      }

                      imprimirTicketCentroImpresion(
                        db,
                        config,
                        pedido,
                        productos,
                        pagos,
                        "final"
                      );

                      const html = generarHTMLTicket(
                        config,
                        pedido,
                        productos,
                        pagos,
                        "final"
                      );

                      res.send(html);
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );

  return router;

}

module.exports = ticketRoutes;
