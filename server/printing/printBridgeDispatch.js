const crypto = require("crypto");

const {
  accodaLavoro
} = require("./printBridgeQueue");

function get(db, sql, params) {
  return new Promise(
    (resolve, reject) => {
      db.get(
        sql,
        params || [],
        function(err, row) {
          if (err) {
            return reject(err);
          }

          resolve(row || null);
        }
      );
    }
  );
}

function normalizzaDestino(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
}

function parseConfigJson(config) {
  try {
    if (
      !config ||
      !config.config_impresion_json
    ) {
      return {};
    }

    return (
      JSON.parse(
        config.config_impresion_json
      ) || {}
    );
  } catch (_) {
    return {};
  }
}

function creaIdempotencyKey(dati) {
  const linee =
    (dati.lineas || [])
      .map((linea) => ({
        id:
          Number(linea.id || 0),
        pedido:
          Number(linea.pedido || 0),
        cantidad_total:
          Number(
            linea.cantidad_total || 0
          ),
        cantidad_enviada:
          Number(
            linea.cantidad_enviada || 0
          ),
        cantidad:
          Number(
            linea.cantidad || 0
          ),
        nota:
          String(
            linea.nota || ""
          )
      }))
      .sort(
        (a, b) =>
          a.id - b.id
      );

  const payload =
    JSON.stringify({
      restaurante_id:
        Number(
          dati.restaurante_id
        ),
      destino:
        normalizzaDestino(
          dati.destino
        ),
      mesa:
        String(
          dati.mesa || ""
        ),
      lineas:
        linee
    });

  const hash =
    crypto
      .createHash("sha256")
      .update(payload)
      .digest("hex");

  return (
    "comanda:" +
    Number(
      dati.restaurante_id
    ) +
    ":" +
    normalizzaDestino(
      dati.destino
    ) +
    ":" +
    hash
  );
}

async function preparaComandaPrintBridge(
  db,
  dati
) {
  const restauranteId =
    Number(
      dati.restaurante_id
    );

  const destino =
    normalizzaDestino(
      dati.destino
    );

  if (!restauranteId) {
    throw new Error(
      "restaurante_id non valido"
    );
  }

  if (!destino) {
    throw new Error(
      "destino non valido"
    );
  }

  const config =
    await get(
      db,
      `
      SELECT *
      FROM configurazione
      WHERE COALESCE(
        restaurante_id,
        1
      )=?
      ORDER BY id DESC
      LIMIT 1
      `,
      [
        restauranteId
      ]
    );

  const configJson =
    parseConfigJson(
      config
    );

  const configDestino =
    configJson[destino] ||
    {};

  const modo =
    String(
      configDestino.modo ||
      (
        config &&
        config.modo_impresion
      ) ||
      "preview"
    )
      .trim()
      .toLowerCase();

  if (
    modo !==
    "print_bridge"
  ) {
    return {
      gestita: false,
      modo
    };
  }

  const bridge =
    await get(
      db,
      `
      SELECT
        restaurante_id,
        token_hash,
        bridge_nombre,
        bridge_version,
        ultimo_contacto
      FROM print_bridge_config
      WHERE restaurante_id=?
        AND token_hash IS NOT NULL
        AND TRIM(token_hash)<>''
      LIMIT 1
      `,
      [
        restauranteId
      ]
    );

  if (!bridge) {
    return {
      gestita: true,
      ok: false,
      modo:
        "print_bridge",
      error:
        "print_bridge_non_configurato"
    };
  }

  const printerId =
    String(
      configDestino.printer_id ||
      ""
    ).trim();

  const printerNombre =
    String(
      configDestino.nombre ||
      ""
    ).trim();

  if (
    !printerId &&
    !printerNombre
  ) {
    return {
      gestita: true,
      ok: false,
      modo:
        "print_bridge",
      error:
        "print_bridge_stampante_non_assegnata"
    };
  }

  const idempotencyKey =
    creaIdempotencyKey(
      dati
    );

  const risultato =
    await accodaLavoro(
      db,
      {
        restaurante_id:
          restauranteId,
        idempotency_key:
          idempotencyKey,
        tipo:
          "comanda",
        destino,
        contenuto:
          String(
            dati.contenuto || ""
          ),
        printer_id:
          printerId || null,
        printer_nombre:
          printerNombre || null
      }
    );

  return {
    gestita: true,
    ok: true,
    modo:
      "print_bridge",
    creato:
      risultato.creato,
    lavoro:
      risultato.lavoro,
    idempotency_key:
      idempotencyKey
  };
}

module.exports = {
  creaIdempotencyKey,
  preparaComandaPrintBridge
};
