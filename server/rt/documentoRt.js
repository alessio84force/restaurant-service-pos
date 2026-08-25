function get(db, sql, params) {
  return new Promise(function(resolve, reject) {
    db.get(sql, params || [], function(err, row) {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function all(db, sql, params) {
  return new Promise(function(resolve, reject) {
    db.all(sql, params || [], function(err, rows) {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function numero(valor) {
  const n = Number(valor);

  if (!Number.isFinite(n)) {
    return null;
  }

  return n;
}

function dinero(valor) {
  const n = numero(valor);

  if (n === null) {
    return null;
  }

  return Number(n.toFixed(2));
}

async function construirDocumentoRt(
  db,
  restauranteId,
  pedidoId,
  idempotencyKey
) {
  restauranteId = Number(restauranteId);
  pedidoId = Number(pedidoId);

  if (!restauranteId || !pedidoId) {
    throw new Error(
      "Restaurante o pedido RT non valido"
    );
  }

  if (!idempotencyKey) {
    throw new Error(
      "Manca idempotency_key per il documento RT"
    );
  }

  const configuracion = await get(
    db,
    `SELECT
       restaurante_id,
       nome_ristorante,
       razon_social,
       partita_iva,
       pais,
       iva,
       rt_activo,
       rt_modo,
       rt_fabricante,
       rt_modelo
     FROM configurazione
     WHERE restaurante_id=?
     LIMIT 1`,
    [restauranteId]
  );

  if (!configuracion) {
    throw new Error(
      "Configurazione ristorante non trovata"
    );
  }

  const pedido = await get(
    db,
    `SELECT
       id,
       mesa_id,
       estado,
       total,
       restaurante_id
     FROM pedidos
     WHERE id=?
       AND COALESCE(restaurante_id,1)=?
     LIMIT 1`,
    [pedidoId, restauranteId]
  );

  if (!pedido) {
    throw new Error(
      "Pedido RT non trovato"
    );
  }

  const lineas = await all(
    db,
    `SELECT
       pl.id AS linea_id,
       pl.producto_id,
       COALESCE(pr.nombre, '') AS nombre,
       pl.cantidad,
       pl.precio,
       pl.iva
     FROM pedido_lineas pl
     LEFT JOIN productos pr
       ON pr.id=pl.producto_id
       AND COALESCE(pr.restaurante_id,1)=?
     WHERE pl.pedido_id=?
       AND COALESCE(pl.restaurante_id,1)=?
     ORDER BY pl.id`,
    [
      restauranteId,
      pedidoId,
      restauranteId
    ]
  );

  if (!lineas.length) {
    throw new Error(
      "Il pedido RT non contiene righe"
    );
  }

  const lineasDocumento = lineas.map(
    function(linea) {
      const cantidad = numero(linea.cantidad);
      const precio = dinero(linea.precio);
      const iva = numero(linea.iva);

      if (
        cantidad === null ||
        cantidad <= 0
      ) {
        throw new Error(
          "Quantita non valida nella riga RT " +
            linea.linea_id
        );
      }

      if (
        precio === null ||
        precio < 0
      ) {
        throw new Error(
          "Prezzo non valido nella riga RT " +
            linea.linea_id
        );
      }

      if (
        iva === null ||
        iva < 0 ||
        iva > 100
      ) {
        throw new Error(
          "IVA snapshot non valida nella riga RT " +
            linea.linea_id
        );
      }

      return {
        linea_id: linea.linea_id,
        producto_id: linea.producto_id,
        nombre: String(linea.nombre || ""),
        cantidad: cantidad,
        precio: precio,
        iva: iva,
        total_linea:
          dinero(cantidad * precio)
      };
    }
  );

  const pagos = await all(
    db,
    `SELECT
       id,
       metodo,
       importe,
       referencia
     FROM pagos
     WHERE pedido_id=?
       AND COALESCE(restaurante_id,1)=?
     ORDER BY id`,
    [pedidoId, restauranteId]
  );

  const pagosDocumento = pagos.map(
    function(pago) {
      const importe = dinero(pago.importe);

      if (
        importe === null ||
        importe <= 0
      ) {
        throw new Error(
          "Pagamento non valido nel pedido RT"
        );
      }

      return {
        pago_id: pago.id,
        metodo: String(pago.metodo || ""),
        importe: importe,
        referencia:
          pago.referencia == null
            ? null
            : String(pago.referencia)
      };
    }
  );

  const totalLineas = dinero(
    lineasDocumento.reduce(
      function(suma, linea) {
        return suma + linea.total_linea;
      },
      0
    )
  );

  const totalPedido = dinero(pedido.total);

  if (totalPedido === null) {
    throw new Error(
      "Totale pedido RT non valido"
    );
  }

  if (
    Math.abs(totalLineas - totalPedido) > 0.01
  ) {
    throw new Error(
      "Totale righe RT diverso dal totale pedido"
    );
  }

  const totalPagado = dinero(
    pagosDocumento.reduce(
      function(suma, pago) {
        return suma + pago.importe;
      },
      0
    )
  );

  return {
    version: 1,
    pedido_id: pedido.id,
    restaurante_id: restauranteId,
    mesa_id: pedido.mesa_id,
    estado_pedido: pedido.estado,
    idempotency_key:
      String(idempotencyKey),

    restaurante: {
      nombre:
        configuracion.nome_ristorante || "",
      razon_social:
        configuracion.razon_social || "",
      identificacion_fiscal:
        configuracion.partita_iva || "",
      pais:
        configuracion.pais || ""
    },

    lineas: lineasDocumento,
    pagos: pagosDocumento,

    total: totalPedido,
    total_pagado: totalPagado,
    pendiente:
      dinero(
        Math.max(
          0,
          totalPedido - totalPagado
        )
      )
  };
}

module.exports = {
  construirDocumentoRt
};
