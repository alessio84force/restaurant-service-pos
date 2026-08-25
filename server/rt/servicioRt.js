const {
  construirDocumentoRt
} = require("./documentoRt");

const simulacion =
  require("./adapters/simulacion");

function get(db, sql, params) {
  return new Promise(function(resolve, reject) {
    db.get(sql, params || [], function(err, row) {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function run(db, sql, params) {
  return new Promise(function(resolve, reject) {
    db.run(sql, params || [], function(err) {
      if (err) return reject(err);

      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

function mensajeError(err) {
  if (!err) {
    return "Errore RT sconosciuto";
  }

  if (err.message) {
    return String(err.message);
  }

  return String(err);
}

function adaptadoresDisponibles(opciones) {
  const personalizados =
    opciones &&
    opciones.adaptadores &&
    typeof opciones.adaptadores === "object"
      ? opciones.adaptadores
      : {};

  return Object.assign(
    {
      simulacion: simulacion
    },
    personalizados
  );
}

async function cargarConfiguracionRt(
  db,
  restauranteId
) {
  return get(
    db,
    `SELECT
       restaurante_id,
       COALESCE(rt_activo,0) AS rt_activo,
       COALESCE(rt_modo,'simulacion') AS rt_modo,
       COALESCE(rt_fabricante,'') AS rt_fabricante,
       COALESCE(rt_modelo,'') AS rt_modelo
     FROM configurazione
     WHERE restaurante_id=?
     LIMIT 1`,
    [restauranteId]
  );
}

async function cargarPedidoRt(
  db,
  restauranteId,
  pedidoId
) {
  return get(
    db,
    `SELECT
       id,
       mesa_id,
       estado,
       total,
       restaurante_id,
       COALESCE(rt_estado,'no_requerido') AS rt_estado,
       rt_documento_id,
       rt_emitido_en,
       rt_ultimo_error,
       rt_idempotency_key,
       rt_enviando_desde
     FROM pedidos
     WHERE id=?
       AND COALESCE(restaurante_id,1)=?
     LIMIT 1`,
    [
      pedidoId,
      restauranteId
    ]
  );
}

function resultadoEmitido(pedido) {
  return {
    ok: true,
    requerido: true,
    ya_emitido: true,
    estado: "emitido",
    documento_id:
      pedido.rt_documento_id,
    emitido_en:
      pedido.rt_emitido_en,
    idempotency_key:
      pedido.rt_idempotency_key
  };
}

async function guardarError(
  db,
  restauranteId,
  pedidoId,
  idempotencyKey,
  err
) {
  const mensaje = mensajeError(err);

  await run(
    db,
    `UPDATE pedidos
     SET
       rt_estado='error',
       rt_ultimo_error=?,
       rt_enviando_desde=NULL
     WHERE id=?
       AND COALESCE(restaurante_id,1)=?
       AND rt_idempotency_key=?
       AND COALESCE(rt_estado,'no_requerido')<>'emitido'`,
    [
      mensaje,
      pedidoId,
      restauranteId,
      idempotencyKey
    ]
  );

  return mensaje;
}

async function emitirPedidoRt(
  db,
  restauranteId,
  pedidoId,
  opciones
) {
  restauranteId = Number(restauranteId);
  pedidoId = Number(pedidoId);

  if (!restauranteId || !pedidoId) {
    throw new Error(
      "Restaurante o pedido RT non valido"
    );
  }

  const configuracion =
    await cargarConfiguracionRt(
      db,
      restauranteId
    );

  if (!configuracion) {
    throw new Error(
      "Configurazione RT non trovata"
    );
  }

  const pedidoInicial =
    await cargarPedidoRt(
      db,
      restauranteId,
      pedidoId
    );

  if (!pedidoInicial) {
    throw new Error(
      "Pedido RT non trovato"
    );
  }

  if (Number(configuracion.rt_activo) !== 1) {
    return {
      ok: true,
      requerido: false,
      estado: "no_requerido"
    };
  }

  if (
    pedidoInicial.rt_estado === "emitido"
  ) {
    return resultadoEmitido(
      pedidoInicial
    );
  }

  if (
    pedidoInicial.rt_estado === "enviando"
  ) {
    return {
      ok: false,
      requerido: true,
      en_proceso: true,
      estado: "enviando",
      idempotency_key:
        pedidoInicial.rt_idempotency_key
    };
  }

  if (
    pedidoInicial.rt_estado === "incerto"
  ) {
    return {
      ok: false,
      requerido: true,
      requiere_revision: true,
      estado: "incerto",
      error:
        pedidoInicial.rt_ultimo_error ||
        "Esito emissione RT da verificare",
      documento_id:
        pedidoInicial.rt_documento_id,
      idempotency_key:
        pedidoInicial.rt_idempotency_key
    };
  }

  const idempotencyKey =
    pedidoInicial.rt_idempotency_key ||
    (
      "rt:" +
      restauranteId +
      ":pedido:" +
      pedidoId
    );

  await run(
    db,
    `UPDATE pedidos
     SET
       rt_estado='pendiente',
       rt_idempotency_key=?,
       rt_ultimo_error=NULL,
       rt_enviando_desde=NULL
     WHERE id=?
       AND COALESCE(restaurante_id,1)=?
       AND COALESCE(rt_estado,'no_requerido')
           IN ('no_requerido','pendiente','error')`,
    [
      idempotencyKey,
      pedidoId,
      restauranteId
    ]
  );

  let documento;

  try {
    documento =
      await construirDocumentoRt(
        db,
        restauranteId,
        pedidoId,
        idempotencyKey
      );
  } catch (err) {
    const mensaje =
      await guardarError(
        db,
        restauranteId,
        pedidoId,
        idempotencyKey,
        err
      );

    return {
      ok: false,
      requerido: true,
      estado: "error",
      error: mensaje,
      idempotency_key:
        idempotencyKey
    };
  }

  if (
    Number(documento.pendiente || 0) > 0.005
  ) {
    return {
      ok: false,
      requerido: true,
      listo: false,
      estado: "pendiente",
      pendiente:
        documento.pendiente,
      idempotency_key:
        idempotencyKey
    };
  }

  const claim = await run(
    db,
    `UPDATE pedidos
     SET
       rt_estado='enviando',
       rt_ultimo_error=NULL,
       rt_enviando_desde=CURRENT_TIMESTAMP
     WHERE id=?
       AND COALESCE(restaurante_id,1)=?
       AND rt_idempotency_key=?
       AND COALESCE(rt_estado,'no_requerido')
           IN ('pendiente','error')`,
    [
      pedidoId,
      restauranteId,
      idempotencyKey
    ]
  );

  if (claim.changes !== 1) {
    const actual =
      await cargarPedidoRt(
        db,
        restauranteId,
        pedidoId
      );

    if (
      actual &&
      actual.rt_estado === "emitido"
    ) {
      return resultadoEmitido(actual);
    }

    return {
      ok: false,
      requerido: true,
      en_proceso:
        actual &&
        actual.rt_estado === "enviando",
      estado:
        actual
          ? actual.rt_estado
          : "desconocido",
      idempotency_key:
        actual
          ? actual.rt_idempotency_key
          : idempotencyKey
    };
  }

  const adaptadores =
    adaptadoresDisponibles(opciones);

  const modo =
    String(
      configuracion.rt_modo ||
      "simulacion"
    ).trim();

  const adapter =
    adaptadores[modo];

  if (
    !adapter ||
    typeof adapter.emitir !== "function"
  ) {
    const mensaje =
      await guardarError(
        db,
        restauranteId,
        pedidoId,
        idempotencyKey,
        new Error(
          "Modalita RT non supportata: " +
          modo
        )
      );

    return {
      ok: false,
      requerido: true,
      estado: "error",
      error: mensaje,
      idempotency_key:
        idempotencyKey
    };
  }

  let adapterChiamato = false;

  try {
    adapterChiamato = true;

    const risposta =
      await adapter.emitir(documento);

    if (
      !risposta ||
      risposta.ok !== true ||
      !risposta.documento_id
    ) {
      throw new Error(
        "Risposta RT non valida"
      );
    }

    const emitidoEn =
      risposta.emitido_en ||
      new Date().toISOString();

    const salvataggio = await run(
      db,
      `UPDATE pedidos
       SET
         rt_estado='emitido',
         rt_documento_id=?,
         rt_emitido_en=?,
         rt_ultimo_error=NULL,
         rt_enviando_desde=NULL
       WHERE id=?
         AND COALESCE(restaurante_id,1)=?
         AND rt_idempotency_key=?
         AND rt_estado='enviando'`,
      [
        String(risposta.documento_id),
        String(emitidoEn),
        pedidoId,
        restauranteId,
        idempotencyKey
      ]
    );

    if (salvataggio.changes !== 1) {
      await run(
        db,
        `UPDATE pedidos
         SET
           rt_estado='incerto',
           rt_documento_id=?,
           rt_emitido_en=?,
           rt_ultimo_error=?,
           rt_enviando_desde=NULL
         WHERE id=?
           AND COALESCE(restaurante_id,1)=?
           AND rt_idempotency_key=?
           AND COALESCE(rt_estado,'no_requerido')<>'emitido'`,
        [
          String(risposta.documento_id),
          String(emitidoEn),
          "RT ha risposto OK ma lo stato locale non e stato confermato",
          pedidoId,
          restauranteId,
          idempotencyKey
        ]
      );

      return {
        ok: false,
        requerido: true,
        requiere_revision: true,
        estado: "incerto",
        documento_id:
          String(risposta.documento_id),
        emitido_en:
          String(emitidoEn),
        error:
          "RT ha risposto OK ma lo stato locale non e stato confermato",
        idempotency_key:
          idempotencyKey
      };
    }

    return {
      ok: true,
      requerido: true,
      ya_emitido: false,
      estado: "emitido",
      documento_id:
        String(risposta.documento_id),
      emitido_en:
        String(emitidoEn),
      idempotency_key:
        idempotencyKey
    };
  } catch (err) {
    const actual =
      await cargarPedidoRt(
        db,
        restauranteId,
        pedidoId
      );

    if (
      actual &&
      actual.rt_estado === "emitido"
    ) {
      return resultadoEmitido(actual);
    }

    if (adapterChiamato) {
      const mensaje =
        mensajeError(err);

      await run(
        db,
        `UPDATE pedidos
         SET
           rt_estado='incerto',
           rt_ultimo_error=?,
           rt_enviando_desde=NULL
         WHERE id=?
           AND COALESCE(restaurante_id,1)=?
           AND rt_idempotency_key=?
           AND COALESCE(rt_estado,'no_requerido')<>'emitido'`,
        [
          mensaje,
          pedidoId,
          restauranteId,
          idempotencyKey
        ]
      );

      return {
        ok: false,
        requerido: true,
        requiere_revision: true,
        estado: "incerto",
        error: mensaje,
        idempotency_key:
          idempotencyKey
      };
    }

    const mensaje =
      await guardarError(
        db,
        restauranteId,
        pedidoId,
        idempotencyKey,
        err
      );

    return {
      ok: false,
      requerido: true,
      estado: "error",
      error: mensaje,
      idempotency_key:
        idempotencyKey
    };
  }
}

module.exports = {
  emitirPedidoRt
};
