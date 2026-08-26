const {
  construirDocumentoRt
} = require("./documentoRt");

const simulacion =
  require("./adapters/simulacion");

const sqlite3 =
  require("sqlite3").verbose();

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

function cerrarDb(db) {
  return new Promise(function(resolve, reject) {
    db.close(function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function abrirDbDedicado(filename) {
  return new Promise(function(resolve, reject) {
    const conexion =
      new sqlite3.Database(
        filename,
        function(err) {
          if (err) {
            return reject(err);
          }

          conexion.configure(
            "busyTimeout",
            5000
          );

          resolve(conexion);
        }
      );
  });
}

async function conTransaccionReconciliacion(
  dbPrincipal,
  trabajo
) {
  const filename =
    dbPrincipal &&
    typeof dbPrincipal.filename === "string"
      ? dbPrincipal.filename
      : "";

  if (
    !filename ||
    filename === ":memory:"
  ) {
    throw new Error(
      "Database RT non valido per riconciliazione"
    );
  }

  if (typeof trabajo !== "function") {
    throw new Error(
      "Operazione di riconciliazione non valida"
    );
  }

  const conexion =
    await abrirDbDedicado(filename);

  let iniziata = false;

  try {
    await run(
      conexion,
      "BEGIN IMMEDIATE",
      []
    );

    iniziata = true;

    const risultato =
      await trabajo(conexion);

    await run(
      conexion,
      "COMMIT",
      []
    );

    iniziata = false;

    await cerrarDb(conexion);

    return risultato;
  } catch (err) {
    if (iniziata) {
      try {
        await run(
          conexion,
          "ROLLBACK",
          []
        );
      } catch (rollbackErr) {
        console.error(
          "[RT Italia] Errore rollback riconciliazione:",
          mensajeError(rollbackErr)
        );
      }
    }

    try {
      await cerrarDb(conexion);
    } catch (closeErr) {
      console.error(
        "[RT Italia] Errore chiusura DB riconciliazione:",
        mensajeError(closeErr)
      );
    }

    throw err;
  }
}

async function registrarEventoRt(
  db,
  datos
) {
  const evento = datos || {};

  const resultado = await run(
    db,
    `INSERT INTO rt_eventos
     (
       restaurante_id,
       pedido_id,
       usuario_id,
       tipo,
       estado_anterior,
       estado_nuevo,
       documento_id,
       idempotency_key,
       nota
     )
     VALUES
     (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(evento.restauranteId),
      Number(evento.pedidoId),
      evento.usuarioId
        ? Number(evento.usuarioId)
        : null,
      String(evento.tipo || ""),
      evento.estadoAnterior == null
        ? null
        : String(evento.estadoAnterior),
      evento.estadoNuevo == null
        ? null
        : String(evento.estadoNuevo),
      evento.documentoId == null
        ? null
        : String(evento.documentoId),
      evento.idempotencyKey == null
        ? null
        : String(evento.idempotencyKey),
      evento.nota == null
        ? null
        : String(evento.nota)
    ]
  );

  if (!resultado.id) {
    throw new Error(
      "Impossibile registrare evento RT"
    );
  }

  return resultado.id;
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

async function confirmarRtEmitidoManualmente(
  dbPrincipal,
  restauranteId,
  pedidoId,
  usuarioId,
  datos
) {
  const rid = Number(restauranteId || 0);
  const pid = Number(pedidoId || 0);
  const uid = Number(usuarioId || 0);
  const entrada = datos || {};

  const documentoId =
    String(
      entrada.documentoId || ""
    ).trim();

  const nota =
    String(
      entrada.nota || ""
    ).trim();

  const emitidoEnEntrada =
    entrada.emitidoEn == null
      ? ""
      : String(
          entrada.emitidoEn
        ).trim();

  if (rid <= 0 || pid <= 0 || uid <= 0) {
    throw new Error(
      "Identificadores non validi per riconciliazione RT"
    );
  }

  if (!documentoId) {
    throw new Error(
      "Documento RT obbligatorio"
    );
  }

  if (!nota) {
    throw new Error(
      "Nota di verifica obbligatoria"
    );
  }

  return conTransaccionReconciliacion(
    dbPrincipal,
    async function(db) {
      const pedido = await get(
        db,
        `SELECT
           id,
           mesa_id,
           estado,
           total,
           COALESCE(rt_estado,'no_requerido')
             AS rt_estado,
           rt_documento_id,
           rt_emitido_en,
           rt_idempotency_key
         FROM pedidos
         WHERE id=?
           AND COALESCE(restaurante_id,1)=?
         LIMIT 1`,
        [
          pid,
          rid
        ]
      );

      if (!pedido) {
        throw new Error(
          "Pedido non trovato"
        );
      }

      if (pedido.rt_estado !== "incerto") {
        throw new Error(
          "La riconciliazione manuale richiede stato incerto"
        );
      }

      if (
        pedido.rt_documento_id &&
        String(pedido.rt_documento_id) !==
          documentoId
      ) {
        throw new Error(
          "Documento RT diverso da quello già registrato"
        );
      }

      const rowPagos = await get(
        db,
        `SELECT
           COALESCE(SUM(importe),0) AS pagado
         FROM pagos
         WHERE pedido_id=?
           AND COALESCE(restaurante_id,1)=?`,
        [
          pid,
          rid
        ]
      );

      const total =
        Number(pedido.total || 0);

      const pagado =
        Number(
          rowPagos &&
          rowPagos.pagado || 0
        );

      const pendiente =
        Math.max(
          0,
          total - pagado
        );

      if (pendiente > 0.005) {
        throw new Error(
          "Il pedido ha ancora saldo pendente"
        );
      }

      const mesaId =
        Number(pedido.mesa_id || 0);

      if (mesaId <= 0) {
        throw new Error(
          "Mesa non valida per il pedido"
        );
      }

      const emitidoEn =
        emitidoEnEntrada ||
        pedido.rt_emitido_en ||
        new Date().toISOString();

      const cambio = await run(
        db,
        `UPDATE pedidos
         SET
           rt_estado='emitido',
           rt_documento_id=?,
           rt_emitido_en=?,
           rt_ultimo_error=NULL,
           rt_enviando_desde=NULL,
           estado='cerrado',
           pagado_en=COALESCE(
             pagado_en,
             CURRENT_TIMESTAMP
           )
         WHERE id=?
           AND COALESCE(restaurante_id,1)=?
           AND rt_estado='incerto'`,
        [
          documentoId,
          emitidoEn,
          pid,
          rid
        ]
      );

      if (cambio.changes !== 1) {
        throw new Error(
          "Stato RT modificato durante la riconciliazione"
        );
      }

      const mesa = await run(
        db,
        `UPDATE mesas
         SET estado='libre'
         WHERE id=?
           AND COALESCE(restaurante_id,1)=?`,
        [
          mesaId,
          rid
        ]
      );

      if (mesa.changes !== 1) {
        throw new Error(
          "Impossibile liberare la mesa"
        );
      }

      const eventoId =
        await registrarEventoRt(
          db,
          {
            restauranteId: rid,
            pedidoId: pid,
            usuarioId: uid,
            tipo:
              "reconciliacion_emitido_manual",
            estadoAnterior:
              "incerto",
            estadoNuevo:
              "emitido",
            documentoId:
              documentoId,
            idempotencyKey:
              pedido.rt_idempotency_key,
            nota:
              nota
          }
        );

      return {
        ok: true,
        estado: "emitido",
        cerrado: true,
        documento_id:
          documentoId,
        emitido_en:
          emitidoEn,
        evento_id:
          eventoId
      };
    }
  );
}

async function confirmarRtNoEmitidoManualmente(
  dbPrincipal,
  restauranteId,
  pedidoId,
  usuarioId,
  datos
) {
  const rid = Number(restauranteId || 0);
  const pid = Number(pedidoId || 0);
  const uid = Number(usuarioId || 0);
  const entrada = datos || {};

  const nota =
    String(
      entrada.nota || ""
    ).trim();

  if (rid <= 0 || pid <= 0 || uid <= 0) {
    throw new Error(
      "Identificadores non validi per riconciliazione RT"
    );
  }

  if (!nota) {
    throw new Error(
      "Nota di verifica obbligatoria"
    );
  }

  return conTransaccionReconciliacion(
    dbPrincipal,
    async function(db) {
      const pedido = await get(
        db,
        `SELECT
           id,
           estado,
           total,
           COALESCE(rt_estado,'no_requerido')
             AS rt_estado,
           rt_documento_id,
           rt_emitido_en,
           rt_idempotency_key
         FROM pedidos
         WHERE id=?
           AND COALESCE(restaurante_id,1)=?
         LIMIT 1`,
        [
          pid,
          rid
        ]
      );

      if (!pedido) {
        throw new Error(
          "Pedido non trovato"
        );
      }

      if (pedido.rt_estado !== "incerto") {
        throw new Error(
          "La riconciliazione manuale richiede stato incerto"
        );
      }

      if (
        pedido.rt_documento_id ||
        pedido.rt_emitido_en
      ) {
        throw new Error(
          "Il pedido contiene già dati di un possibile documento RT emesso"
        );
      }

      const rowPagos = await get(
        db,
        `SELECT
           COALESCE(SUM(importe),0) AS pagado
         FROM pagos
         WHERE pedido_id=?
           AND COALESCE(restaurante_id,1)=?`,
        [
          pid,
          rid
        ]
      );

      const total =
        Number(pedido.total || 0);

      const pagado =
        Number(
          rowPagos &&
          rowPagos.pagado || 0
        );

      const pendiente =
        Math.max(
          0,
          total - pagado
        );

      if (pendiente > 0.005) {
        throw new Error(
          "Il pedido ha ancora saldo pendente"
        );
      }

      const cambio = await run(
        db,
        `UPDATE pedidos
         SET
           rt_estado='error',
           rt_ultimo_error=
             'Verificato manualmente: documento RT non emesso',
           rt_enviando_desde=NULL
         WHERE id=?
           AND COALESCE(restaurante_id,1)=?
           AND rt_estado='incerto'
           AND rt_documento_id IS NULL
           AND rt_emitido_en IS NULL`,
        [
          pid,
          rid
        ]
      );

      if (cambio.changes !== 1) {
        throw new Error(
          "Stato RT modificato durante la riconciliazione"
        );
      }

      const eventoId =
        await registrarEventoRt(
          db,
          {
            restauranteId: rid,
            pedidoId: pid,
            usuarioId: uid,
            tipo:
              "reconciliacion_no_emitido_manual",
            estadoAnterior:
              "incerto",
            estadoNuevo:
              "error",
            documentoId:
              null,
            idempotencyKey:
              pedido.rt_idempotency_key,
            nota:
              nota
          }
        );

      return {
        ok: true,
        estado: "error",
        cerrado: false,
        retry_permitido: true,
        idempotency_key:
          pedido.rt_idempotency_key,
        evento_id:
          eventoId
      };
    }
  );
}

async function marcarRtEnviandoComoIncertoManualmente(
  dbPrincipal,
  restauranteId,
  pedidoId,
  usuarioId,
  datos
) {
  const rid = Number(restauranteId || 0);
  const pid = Number(pedidoId || 0);
  const uid = Number(usuarioId || 0);
  const entrada = datos || {};

  const nota =
    String(
      entrada.nota || ""
    ).trim();

  if (rid <= 0 || pid <= 0 || uid <= 0) {
    throw new Error(
      "Identificadores non validi per riconciliazione RT"
    );
  }

  if (!nota) {
    throw new Error(
      "Nota di verifica obbligatoria"
    );
  }

  return conTransaccionReconciliacion(
    dbPrincipal,
    async function(db) {
      const pedido = await get(
        db,
        `SELECT
           id,
           estado,
           COALESCE(rt_estado,'no_requerido')
             AS rt_estado,
           rt_documento_id,
           rt_emitido_en,
           rt_idempotency_key,
           rt_enviando_desde,
           (
             julianday('now') -
             julianday(rt_enviando_desde)
           ) * 86400.0
             AS rt_enviando_segundos
         FROM pedidos
         WHERE id=?
           AND COALESCE(restaurante_id,1)=?
         LIMIT 1`,
        [
          pid,
          rid
        ]
      );

      if (!pedido) {
        throw new Error(
          "Pedido non trovato"
        );
      }

      if (pedido.rt_estado !== "enviando") {
        throw new Error(
          "La riconciliazione richiede stato enviando"
        );
      }

      const segundosEnviando =
        pedido.rt_enviando_segundos == null
          ? null
          : Number(
              pedido.rt_enviando_segundos
            );

      if (
        segundosEnviando == null ||
        !Number.isFinite(segundosEnviando) ||
        segundosEnviando < 0
      ) {
        throw new Error(
          "Timestamp RT enviando non disponibile o non valido"
        );
      }

      if (segundosEnviando < 120) {
        throw new Error(
          "Invio RT ancora troppo recente per la riconciliazione manuale"
        );
      }

      const enviandoDesde =
        pedido.rt_enviando_desde == null
          ? null
          : String(
              pedido.rt_enviando_desde
            );

      const cambio = await run(
        db,
        `UPDATE pedidos
         SET
           rt_estado='incerto',
           rt_ultimo_error=
             'Invio RT interrotto per verifica manuale',
           rt_enviando_desde=NULL
         WHERE id=?
           AND COALESCE(restaurante_id,1)=?
           AND rt_estado='enviando'`,
        [
          pid,
          rid
        ]
      );

      if (cambio.changes !== 1) {
        throw new Error(
          "Stato RT modificato durante la riconciliazione"
        );
      }

      const notaAudit =
        enviandoDesde
          ? nota +
            " | enviando_desde=" +
            enviandoDesde
          : nota +
            " | enviando_desde=non_disponibile";

      const eventoId =
        await registrarEventoRt(
          db,
          {
            restauranteId: rid,
            pedidoId: pid,
            usuarioId: uid,
            tipo:
              "reconciliacion_enviando_incerto_manual",
            estadoAnterior:
              "enviando",
            estadoNuevo:
              "incerto",
            documentoId:
              pedido.rt_documento_id,
            idempotencyKey:
              pedido.rt_idempotency_key,
            nota:
              notaAudit
          }
        );

      return {
        ok: true,
        estado: "incerto",
        cerrado: false,
        requiere_revision: true,
        retry_permitido: false,
        enviando_desde:
          enviandoDesde,
        idempotency_key:
          pedido.rt_idempotency_key,
        evento_id:
          eventoId
      };
    }
  );
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
  emitirPedidoRt,
  confirmarRtEmitidoManualmente,
  confirmarRtNoEmitidoManualmente,
  marcarRtEnviandoComoIncertoManualmente
};
