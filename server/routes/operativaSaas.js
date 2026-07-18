const express = require("express");
const fs = require("fs");
const path = require("path");
const { restauranteIdFromReq } = require("../utils/restauranteContext");

function requiereLoginJson(req, res, next) {
  if (req.session && req.session.usuario) return next();

  return res.status(401).json({
    ok: false,
    error: "No autenticado"
  });
}

function all(db, sql, params) {
  return new Promise((resolve) => {
    db.all(sql, params || [], function(err, rows) {
      if (err) {
        console.error("[operativaSaas] SQL all:", err.message);
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
        console.error("[operativaSaas] SQL get:", err.message);
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
        console.error("[operativaSaas] SQL run:", err.message);
        return resolve({ ok: false, error: err.message });
      }

      resolve({ ok: true, id: this.lastID, changes: this.changes });
    });
  });
}

function euro(n) {
  return Number(n || 0).toFixed(2) + " €";
}

function escapar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function limpiarTexto(valor) {
  return String(valor == null ? "" : valor)
    .replace(/[^\wáéíóúÁÉÍÓÚñÑüÜ .,_-]/g, "")
    .trim();
}

async function buscarMesa(db, restauranteId, mesaParam) {
  const mesaTexto = String(mesaParam || "").trim();

  return get(
    db,
    `SELECT id, numero, estado
     FROM mesas
     WHERE COALESCE(restaurante_id,1)=?
     AND COALESCE(activo,1)=1
     AND (CAST(numero AS TEXT)=? OR CAST(id AS TEXT)=?)
     LIMIT 1`,
    [restauranteId, mesaTexto, mesaTexto]
  );
}

async function buscarPedidoMesa(db, restauranteId, mesaId) {
  return get(
    db,
    `SELECT *
     FROM pedidos
     WHERE mesa_id=?
     AND estado!='cerrado'
     AND COALESCE(restaurante_id,1)=?
     ORDER BY id DESC
     LIMIT 1`,
    [mesaId, restauranteId]
  );
}

async function crearPedidoSiFalta(db, restauranteId, mesaId) {
  let pedido = await buscarPedidoMesa(db, restauranteId, mesaId);

  if (pedido) return pedido;

  const creado = await run(
    db,
    "INSERT INTO pedidos (mesa_id, estado, total, restaurante_id) VALUES (?, 'abierto', 0, ?)",
    [mesaId, restauranteId]
  );

  if (!creado.ok) return null;

  await run(
    db,
    "UPDATE mesas SET estado='ocupada' WHERE id=? AND COALESCE(restaurante_id,1)=?",
    [mesaId, restauranteId]
  );

  return get(
    db,
    "SELECT * FROM pedidos WHERE id=? AND COALESCE(restaurante_id,1)=?",
    [creado.id, restauranteId]
  );
}

async function recalcularTotalPedido(db, restauranteId, pedidoId) {
  const row = await get(
    db,
    `SELECT COALESCE(SUM(cantidad * precio),0) AS total
     FROM pedido_lineas
     WHERE pedido_id=?
     AND COALESCE(restaurante_id,1)=?`,
    [pedidoId, restauranteId]
  );

  const total = Number(row && row.total || 0);

  await run(
    db,
    "UPDATE pedidos SET total=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
    [total, pedidoId, restauranteId]
  );

  return total;
}

async function cargarLineasPedido(db, restauranteId, pedidoId) {
  return all(
    db,
    `SELECT
      pl.id,
      pl.id AS linea_id,
      pl.pedido_id,
      pl.producto_id,
      productos.nombre AS nombre,
      productos.nombre AS producto,
      pl.cantidad,
      pl.precio,
      pl.nota,
      COALESCE(pl.cantidad_enviada_bar,0) AS cantidad_enviada_bar,
      COALESCE(pl.cantidad_enviada_cocina,0) AS cantidad_enviada_cocina,
      COALESCE(productos.requiere_coccion,0) AS requiere_coccion,
      categorias.nombre AS categoria,
      COALESCE(categorias.destino,'cocina') AS destino
    FROM pedido_lineas pl
    JOIN pedidos
      ON pedidos.id = pl.pedido_id
      AND COALESCE(pedidos.restaurante_id,1)=?
    JOIN productos
      ON productos.id = pl.producto_id
      AND COALESCE(productos.restaurante_id,1)=?
    LEFT JOIN categorias
      ON categorias.id = productos.categoria_id
      AND COALESCE(categorias.restaurante_id,1)=?
    WHERE pl.pedido_id=?
    AND COALESCE(pl.restaurante_id,1)=?
    ORDER BY pl.id`,
    [restauranteId, restauranteId, restauranteId, pedidoId, restauranteId]
  );
}

async function cargarPedidoRespuesta(db, restauranteId, mesaParam) {
  const mesa = await buscarMesa(db, restauranteId, mesaParam);

  if (!mesa) {
    return {
      ok: false,
      status: 404,
      data: {
        ok: false,
        error: "Mesa no encontrada para este restaurante"
      }
    };
  }

  const pedido = await buscarPedidoMesa(db, restauranteId, mesa.id);

  if (!pedido) {
    return {
      ok: true,
      data: {
        ok: true,
        mesa: mesa.numero,
        mesa_id: mesa.id,
        pedido: null,
        pedido_id: null,
        productos: [],
        lineas: [],
        total: 0
      }
    };
  }

  const total = await recalcularTotalPedido(db, restauranteId, pedido.id);
  const lineas = await cargarLineasPedido(db, restauranteId, pedido.id);

  return {
    ok: true,
    data: {
      ok: true,
      mesa: mesa.numero,
      mesa_id: mesa.id,
      pedido: pedido.id,
      pedido_id: pedido.id,
      pedido_estado: pedido.estado,
      productos: lineas,
      lineas: lineas,
      total: total
    }
  };
}

function nuevaCantidadDesdeBody(actual, body) {
  const b = body || {};

  if (b.cantidad != null) return Number(b.cantidad);

  const cambioRaw = b.cambio != null ? b.cambio
    : b.delta != null ? b.delta
      : b.diferencia != null ? b.diferencia
        : null;

  if (cambioRaw != null) {
    const cambio = Number(cambioRaw);
    if (!Number.isNaN(cambio)) return Number(actual || 0) + cambio;
  }

  const accion = String(b.accion || b.operacion || b.tipo || "").toLowerCase();

  if (["mas", "más", "sumar", "plus", "+", "incrementar"].includes(accion)) {
    return Number(actual || 0) + 1;
  }

  if (["menos", "restar", "minus", "-", "decrementar"].includes(accion)) {
    return Number(actual || 0) - 1;
  }

  return Number(actual || 0);
}

async function lineaPropia(db, restauranteId, lineaId) {
  return get(
    db,
    `SELECT
      pl.*,
      pedidos.id AS pedido_id_real
    FROM pedido_lineas pl
    JOIN pedidos
      ON pedidos.id = pl.pedido_id
      AND COALESCE(pedidos.restaurante_id,1)=?
    WHERE pl.id=?
    AND COALESCE(pl.restaurante_id,1)=?`,
    [restauranteId, lineaId, restauranteId]
  );
}

async function pedidoPropio(db, restauranteId, pedidoId) {
  return get(
    db,
    `SELECT pedidos.*, mesas.numero AS mesa_numero
     FROM pedidos
     LEFT JOIN mesas
       ON mesas.id = pedidos.mesa_id
       AND COALESCE(mesas.restaurante_id,1)=?
     WHERE pedidos.id=?
     AND COALESCE(pedidos.restaurante_id,1)=?
     LIMIT 1`,
    [restauranteId, pedidoId, restauranteId]
  );
}

async function pagosPedido(db, restauranteId, pedidoId) {
  return all(
    db,
    `SELECT *
     FROM pagos
     WHERE pedido_id=?
     AND COALESCE(restaurante_id,1)=?
     ORDER BY id`,
    [pedidoId, restauranteId]
  );
}

async function resumenPendiente(db, restauranteId, pedidoId) {
  const pedido = await pedidoPropio(db, restauranteId, pedidoId);
  if (!pedido) return null;

  const row = await get(
    db,
    `SELECT COALESCE(SUM(importe),0) AS pagado
     FROM pagos
     WHERE pedido_id=?
     AND COALESCE(restaurante_id,1)=?`,
    [pedidoId, restauranteId]
  );

  const total = Number(pedido.total || 0);
  const pagado = Number(row && row.pagado || 0);
  const pendiente = Math.max(0, total - pagado);

  return {
    pedido: pedido,
    total: total,
    pagado: pagado,
    pendiente: pendiente
  };
}

function formatearComanda(destino, mesa, lineas) {
  let texto = "";
  texto += "RESTAURANT SERVICE POS\n";
  texto += "COMANDA " + limpiarTexto(destino).toUpperCase() + "\n";
  texto += "MESA: " + limpiarTexto(mesa) + "\n";
  texto += "HORA: " + new Date().toLocaleString("es-ES") + "\n";
  texto += "------------------------------\n";

  lineas.forEach((l) => {
    texto += Number(l.cantidad || 0) + " x " + limpiarTexto(l.nombre || l.producto || "Producto").toUpperCase() + "\n";
    if (l.nota) {
      texto += "  >>> NOTA <<<\n";
      texto += "  " + limpiarTexto(l.nota).toUpperCase() + "\n";
    }
  });

  texto += "------------------------------\n";
  texto += "TOTAL LINEAS: " + lineas.length + "\n";

  return texto;
}

function guardarPrint(nombreArchivo, contenido) {
  const carpeta = path.join(process.cwd(), "prints");

  try {
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(path.join(carpeta, nombreArchivo), contenido, "utf8");
  } catch (err) {
    console.error("[operativaSaas] No se pudo guardar print:", err.message);
  }
}

async function enviarComandaDestino(db, restauranteId, mesaParam, destinoRaw) {
  const destino = String(destinoRaw || "").trim().toLowerCase();
  const mesa = await buscarMesa(db, restauranteId, mesaParam);

  if (!mesa) {
    return {
      ok: false,
      status: 404,
      data: {
        ok: false,
        error: "Mesa no encontrada para este restaurante"
      }
    };
  }

  const lineas = await all(
    db,
    `SELECT
      pl.id,
      pl.id AS linea_id,
      pl.pedido_id,
      productos.nombre AS nombre,
      productos.nombre AS producto,
      pl.nota,
      pl.cantidad AS cantidad_total,
      COALESCE(cel.cantidad_enviada,0) AS cantidad_enviada,
      pl.cantidad - COALESCE(cel.cantidad_enviada,0) AS cantidad
    FROM pedido_lineas pl
    JOIN pedidos
      ON pedidos.id = pl.pedido_id
      AND pedidos.estado!='cerrado'
      AND COALESCE(pedidos.restaurante_id,1)=?
    JOIN mesas
      ON mesas.id = pedidos.mesa_id
      AND COALESCE(mesas.restaurante_id,1)=?
      AND (CAST(mesas.numero AS TEXT)=? OR CAST(mesas.id AS TEXT)=?)
    JOIN productos
      ON productos.id = pl.producto_id
      AND COALESCE(productos.restaurante_id,1)=?
    JOIN categorias
      ON categorias.id = productos.categoria_id
      AND COALESCE(categorias.restaurante_id,1)=?
    LEFT JOIN comanda_envios_linea cel
      ON cel.linea_id = pl.id
      AND LOWER(cel.destino)=LOWER(?)
      AND COALESCE(cel.restaurante_id,1)=?
    WHERE COALESCE(pl.restaurante_id,1)=?
    AND LOWER(COALESCE(categorias.destino,'cocina'))=LOWER(?)
    AND (pl.cantidad - COALESCE(cel.cantidad_enviada,0)) > 0
    ORDER BY pl.id`,
    [
      restauranteId,
      restauranteId,
      String(mesaParam),
      String(mesaParam),
      restauranteId,
      restauranteId,
      destino,
      restauranteId,
      restauranteId,
      destino
    ]
  );

  if (!lineas.length) {
    return {
      ok: true,
      data: {
        ok: true,
        mensaje: "Nada para enviar",
        lineas: [],
        destino: destino
      }
    };
  }

  for (const linea of lineas) {
    await run(
      db,
      `INSERT OR IGNORE INTO comanda_envios_linea
       (linea_id, destino, cantidad_enviada, actualizado_en, restaurante_id)
       VALUES (?, ?, 0, CURRENT_TIMESTAMP, ?)`,
      [linea.id, destino, restauranteId]
    );

    await run(
      db,
      `UPDATE comanda_envios_linea
       SET cantidad_enviada=?, actualizado_en=CURRENT_TIMESTAMP
       WHERE linea_id=?
       AND LOWER(destino)=LOWER(?)
       AND COALESCE(restaurante_id,1)=?`,
      [linea.cantidad_total, linea.id, destino, restauranteId]
    );

    if (destino === "bar") {
      await run(
        db,
        "UPDATE pedido_lineas SET cantidad_enviada_bar=cantidad, enviada_bar=1 WHERE id=? AND COALESCE(restaurante_id,1)=?",
        [linea.id, restauranteId]
      );
    }

    if (destino === "cocina") {
      await run(
        db,
        "UPDATE pedido_lineas SET cantidad_enviada_cocina=cantidad, enviada_cocina=1 WHERE id=? AND COALESCE(restaurante_id,1)=?",
        [linea.id, restauranteId]
      );
    }
  }

  const texto = formatearComanda(destino, mesa.numero, lineas);
  const archivo = "comanda_" + destino.replace(/[^a-z0-9_-]/g, "_") + ".txt";
  guardarPrint(archivo, texto);

  return {
    ok: true,
    data: {
      ok: true,
      mensaje: "Comanda " + destino + " generada",
      archivo: "prints/" + archivo,
      destino: destino,
      lineas: lineas.map((l) => ({
        id: l.id,
        linea_id: l.id,
        pedido_id: l.pedido_id,
        nombre: l.nombre,
        producto: l.producto,
        cantidad: l.cantidad,
        nota: l.nota || ""
      }))
    }
  };
}

async function renderTicketMesa(db, restauranteId, mesaParam) {
  const respuesta = await cargarPedidoRespuesta(db, restauranteId, mesaParam);

  if (!respuesta.ok) {
    return `<!doctype html><html><body><h1>Mesa no encontrada</h1></body></html>`;
  }

  const data = respuesta.data;
  const lineas = data.lineas || [];

  const lineasHtml = lineas.map((l) => {
    const cantidad = Number(l.cantidad || 0);
    const precio = Number(l.precio || 0);
    const total = cantidad * precio;

    return `
      <tr>
        <td>${escapar(l.nombre || l.producto || "Producto")}</td>
        <td>${cantidad}</td>
        <td>${euro(precio)}</td>
        <td>${euro(total)}</td>
      </tr>
    `;
  }).join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ticket mesa ${escapar(data.mesa)}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f3f4f6;color:#111827;}
    .ticket{max-width:420px;margin:24px auto;background:white;border:1px solid #e5e7eb;border-radius:18px;padding:22px;}
    h1{text-align:center;margin:0 0 8px;font-size:24px;}
    .sub{text-align:center;color:#6b7280;font-weight:800;margin-bottom:18px;}
    table{width:100%;border-collapse:collapse;}
    th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;font-size:14px;}
    th{text-transform:uppercase;font-size:12px;color:#6b7280;}
    .total{display:flex;justify-content:space-between;margin-top:18px;font-size:22px;font-weight:900;}
    .acciones{text-align:center;margin-top:18px;}
    button{border:0;border-radius:12px;background:#111827;color:white;padding:11px 16px;font-weight:900;cursor:pointer;}
  </style>
</head>
<body>
  <div class="ticket">
    <h1>Restaurant Service POS</h1>
    <div class="sub">Mesa ${escapar(data.mesa)} · Pedido ${escapar(data.pedido || "-")}</div>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cant.</th>
          <th>Precio</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineasHtml || '<tr><td colspan="4">Sin productos</td></tr>'}
      </tbody>
    </table>
    <div class="total">
      <span>Total</span>
      <span>${euro(data.total)}</span>
    </div>
    <div class="acciones">
      <button onclick="window.print()">Imprimir</button>
    </div>
  </div>
</body>
</html>`;
}

module.exports = function operativaSaasRoutes(db) {
  const router = express.Router();

  router.get("/pedido/:mesa", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const respuesta = await cargarPedidoRespuesta(db, restauranteId, req.params.mesa);

    if (!respuesta.ok) {
      return res.status(respuesta.status || 500).json(respuesta.data);
    }

    res.json(respuesta.data);
  });

  router.post("/anadir-producto", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const body = req.body || {};
    const numeroMesa = body.mesa || body.numeroMesa || body.numero_mesa || body.mesa_id;
    const productoId = Number(body.producto || body.producto_id || body.id_producto || 0);
    const cantidad = Math.max(1, Number(body.cantidad || 1));
    const nota = String(body.nota || "").trim();

    if (!numeroMesa || !productoId) {
      return res.status(400).json({
        ok: false,
        error: "Faltan mesa o producto"
      });
    }

    const mesa = await buscarMesa(db, restauranteId, numeroMesa);

    if (!mesa) {
      return res.status(404).json({
        ok: false,
        error: "Mesa no encontrada para este restaurante"
      });
    }

    const producto = await get(
      db,
      "SELECT id, precio FROM productos WHERE id=? AND COALESCE(restaurante_id,1)=? AND COALESCE(disponible,1)=1",
      [productoId, restauranteId]
    );

    if (!producto) {
      return res.status(404).json({
        ok: false,
        error: "Producto no encontrado para este restaurante"
      });
    }

    const pedido = await crearPedidoSiFalta(db, restauranteId, mesa.id);

    if (!pedido) {
      return res.status(500).json({
        ok: false,
        error: "No se pudo crear el pedido"
      });
    }

    const lineaExistente = nota
      ? null
      : await get(
        db,
        `SELECT id, cantidad
         FROM pedido_lineas
         WHERE pedido_id=?
         AND producto_id=?
         AND COALESCE(restaurante_id,1)=?
         AND (nota IS NULL OR TRIM(nota)='')
         ORDER BY id DESC
         LIMIT 1`,
        [pedido.id, productoId, restauranteId]
      );

    if (lineaExistente) {
      await run(
        db,
        "UPDATE pedido_lineas SET cantidad=cantidad+? WHERE id=? AND COALESCE(restaurante_id,1)=?",
        [cantidad, lineaExistente.id, restauranteId]
      );
    } else {
      await run(
        db,
        `INSERT INTO pedido_lineas
         (pedido_id, producto_id, cantidad, precio, nota, restaurante_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pedido.id, productoId, cantidad, Number(producto.precio || 0), nota, restauranteId]
      );
    }

    const total = await recalcularTotalPedido(db, restauranteId, pedido.id);

    res.json({
      ok: true,
      pedido_id: pedido.id,
      total: total
    });
  });

  async function actualizarCantidadLinea(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const lineaId = Number(req.params.linea || 0);
    const linea = await lineaPropia(db, restauranteId, lineaId);

    if (!linea) {
      return res.status(404).json({
        ok: false,
        error: "Línea no encontrada para este restaurante"
      });
    }

    const nuevaCantidad = nuevaCantidadDesdeBody(linea.cantidad, req.body || {});

    if (nuevaCantidad <= 0) {
      await run(
        db,
        "DELETE FROM pedido_lineas WHERE id=? AND COALESCE(restaurante_id,1)=?",
        [lineaId, restauranteId]
      );

      const totalBorrado = await recalcularTotalPedido(db, restauranteId, linea.pedido_id);

      return res.json({
        ok: true,
        eliminada: true,
        cantidad: 0,
        total: totalBorrado
      });
    }

    await run(
      db,
      "UPDATE pedido_lineas SET cantidad=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [nuevaCantidad, lineaId, restauranteId]
    );

    const total = await recalcularTotalPedido(db, restauranteId, linea.pedido_id);

    res.json({
      ok: true,
      eliminada: false,
      cantidad: nuevaCantidad,
      total: total
    });
  }

  router.post("/linea/:linea/cantidad", requiereLoginJson, actualizarCantidadLinea);
  router.post("/pedido-linea/:linea/cantidad", requiereLoginJson, actualizarCantidadLinea);
  router.post("/linea-pedido/:linea/cantidad", requiereLoginJson, actualizarCantidadLinea);

  router.post("/linea/:linea/nota", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const lineaId = Number(req.params.linea || 0);
    const nota = String((req.body || {}).nota || (req.body || {}).texto || "").trim();

    const linea = await lineaPropia(db, restauranteId, lineaId);

    if (!linea) {
      return res.status(404).json({
        ok: false,
        error: "Línea no encontrada para este restaurante"
      });
    }

    await run(
      db,
      "UPDATE pedido_lineas SET nota=? WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [nota, lineaId, restauranteId]
    );

    res.json({
      ok: true,
      nota: nota
    });
  });

  router.post("/mesa/:mesa/cuenta", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const mesa = await buscarMesa(db, restauranteId, req.params.mesa);

    if (!mesa) {
      return res.status(404).json({
        ok: false,
        error: "Mesa no encontrada para este restaurante"
      });
    }

    const pedido = await buscarPedidoMesa(db, restauranteId, mesa.id);

    if (!pedido) {
      return res.status(404).json({
        ok: false,
        error: "No hay pedido abierto en esta mesa"
      });
    }

    await recalcularTotalPedido(db, restauranteId, pedido.id);

    await run(
      db,
      "UPDATE pedidos SET estado='cuenta' WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [pedido.id, restauranteId]
    );

    await run(
      db,
      "UPDATE mesas SET estado='cuenta' WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [mesa.id, restauranteId]
    );

    res.json({
      ok: true,
      pedido_id: pedido.id
    });
  });

  router.get("/pedido/:id/pagos", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const pedidoId = Number(req.params.id || 0);
    const pedido = await pedidoPropio(db, restauranteId, pedidoId);

    if (!pedido) {
      return res.status(404).json({
        ok: false,
        error: "Pedido no encontrado para este restaurante"
      });
    }

    const pagos = await pagosPedido(db, restauranteId, pedidoId);
    res.json(pagos);
  });

  router.get("/pedido/:id/pendiente", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const pedidoId = Number(req.params.id || 0);
    const resumen = await resumenPendiente(db, restauranteId, pedidoId);

    if (!resumen) {
      return res.status(404).json({
        ok: false,
        error: "Pedido no encontrado para este restaurante"
      });
    }

    res.json({
      ok: true,
      total: resumen.total,
      pagado: resumen.pagado,
      pendiente: resumen.pendiente
    });
  });

  router.post("/pedido/:id/pago", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const pedidoId = Number(req.params.id || 0);
    const body = req.body || {};
    const pedido = await pedidoPropio(db, restauranteId, pedidoId);

    if (!pedido) {
      return res.status(404).json({
        ok: false,
        error: "Pedido no encontrado para este restaurante"
      });
    }

    const importe = Number(body.importe || 0);

    if (!importe || Number.isNaN(importe) || importe <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Importe no válido"
      });
    }

    const metodo = String(body.metodo || "efectivo").trim() || "efectivo";
    const usuarioId = req.session && req.session.usuario ? Number(req.session.usuario.id || 0) : null;

    const pago = await run(
      db,
      `INSERT INTO pagos
       (pedido_id, metodo, importe, usuario_id, tpv, referencia, importe_recibido, cambio, restaurante_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedidoId,
        metodo,
        importe,
        usuarioId || null,
        body.tpv || "",
        body.referencia || "",
        Number(body.importe_recibido || 0),
        Number(body.cambio || 0),
        restauranteId
      ]
    );

    const resumen = await resumenPendiente(db, restauranteId, pedidoId);

    if (resumen && resumen.pendiente <= 0.005) {
      await run(
        db,
        "UPDATE pedidos SET estado='cerrado', pagado_en=CURRENT_TIMESTAMP WHERE id=? AND COALESCE(restaurante_id,1)=?",
        [pedidoId, restauranteId]
      );
    }

    res.json({
      ok: true,
      pago_id: pago.id,
      pendiente: resumen ? resumen.pendiente : 0
    });
  });

  router.post("/cerrar-mesa/:mesa", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const mesa = await buscarMesa(db, restauranteId, req.params.mesa);

    if (!mesa) {
      return res.status(404).json({
        ok: false,
        error: "Mesa no encontrada para este restaurante"
      });
    }

    const pedido = await buscarPedidoMesa(db, restauranteId, mesa.id);

    if (pedido) {
      await recalcularTotalPedido(db, restauranteId, pedido.id);

      await run(
        db,
        "UPDATE pedidos SET estado='cerrado', pagado_en=COALESCE(pagado_en,CURRENT_TIMESTAMP) WHERE id=? AND COALESCE(restaurante_id,1)=?",
        [pedido.id, restauranteId]
      );
    }

    await run(
      db,
      "UPDATE mesas SET estado='libre' WHERE id=? AND COALESCE(restaurante_id,1)=?",
      [mesa.id, restauranteId]
    );

    res.json({
      ok: true
    });
  });

  router.post("/bar/enviar/:mesa", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const resultado = await enviarComandaDestino(db, restauranteId, req.params.mesa, "bar");

    if (!resultado.ok) {
      return res.status(resultado.status || 500).json(resultado.data);
    }

    res.json(resultado.data);
  });

  router.post("/cocina/enviar/:mesa", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const resultado = await enviarComandaDestino(db, restauranteId, req.params.mesa, "cocina");

    if (!resultado.ok) {
      return res.status(resultado.status || 500).json(resultado.data);
    }

    res.json(resultado.data);
  });

  router.post("/comandas/enviar/:destino/:mesa", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const resultado = await enviarComandaDestino(db, restauranteId, req.params.mesa, req.params.destino);

    if (!resultado.ok) {
      return res.status(resultado.status || 500).json(resultado.data);
    }

    res.json(resultado.data);
  });

  router.get("/ticket/:mesa", requiereLoginJson, async function(req, res) {
    const restauranteId = restauranteIdFromReq(req);
    const html = await renderTicketMesa(db, restauranteId, req.params.mesa);
    res.send(html);
  });

  return router;
};
