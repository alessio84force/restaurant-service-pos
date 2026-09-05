function all(db, sql, params) {
  return new Promise(function(resolve, reject) {
    db.all(sql, params || [], function(err, rows) {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function normalizarMetodoPos(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}

function normalizarFabricante(valor) {
  return String(valor || "")
    .trim()
    .toUpperCase();
}

async function cargarMapeoPagosRt(
  db,
  restauranteId,
  fabricante,
  pagos
) {
  const rid = Number(restauranteId || 0);
  const fabricanteNormalizado =
    normalizarFabricante(fabricante);

  if (!db) {
    throw new Error(
      "Database non disponibile per mappatura pagamenti RT"
    );
  }

  if (rid <= 0) {
    throw new Error(
      "Restaurante non valido per mappatura pagamenti RT"
    );
  }

  if (!fabricanteNormalizado) {
    throw new Error(
      "Fabbricante RT non configurato"
    );
  }

  if (!Array.isArray(pagos)) {
    throw new Error(
      "Pagamenti RT non validi"
    );
  }

  const metodiRichiesti = [];

  pagos.forEach(function(pago) {
    const metodo =
      normalizarMetodoPos(
        pago && pago.metodo
      );

    if (!metodo) {
      throw new Error(
        "Metodo di pagamento POS non valido"
      );
    }

    if (metodiRichiesti.indexOf(metodo) === -1) {
      metodiRichiesti.push(metodo);
    }
  });

  if (!metodiRichiesti.length) {
    return {
      fabricante: fabricanteNormalizado,
      metodi: {}
    };
  }

  const rows = await all(
    db,
    `SELECT
       metodo_pos,
       metodo_rt_id,
       metodo_rt_nombre
     FROM rt_mapeo_pagos
     WHERE restaurante_id=?
       AND UPPER(TRIM(fabricante))=?
     ORDER BY metodo_pos`,
    [
      rid,
      fabricanteNormalizado
    ]
  );

  const metodi = {};

  rows.forEach(function(row) {
    const metodoPos =
      normalizarMetodoPos(
        row.metodo_pos
      );

    const metodoRtId =
      String(
        row.metodo_rt_id || ""
      ).trim();

    if (
      !metodoPos ||
      !metodoRtId
    ) {
      return;
    }

    if (metodi[metodoPos]) {
      throw new Error(
        "Mappatura pagamento RT ambigua: " +
        metodoPos
      );
    }

    metodi[metodoPos] = {
      metodo_pos: metodoPos,
      metodo_rt_id: metodoRtId,
      metodo_rt_nombre:
        row.metodo_rt_nombre == null
          ? null
          : String(
              row.metodo_rt_nombre
            )
    };
  });

  const mancanti =
    metodiRichiesti.filter(
      function(metodo) {
        return !metodi[metodo];
      }
    );

  if (mancanti.length) {
    throw new Error(
      "Mappatura pagamento RT mancante: " +
      mancanti.join(", ")
    );
  }

  return {
    fabricante: fabricanteNormalizado,
    metodi: metodi
  };
}

module.exports = {
  cargarMapeoPagosRt
};
