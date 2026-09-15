function run(db, sql, params) {
  return new Promise(
    (resolve, reject) => {
      db.run(
        sql,
        params || [],
        function(err) {
          if (err) {
            return reject(err);
          }

          resolve({
            id: this.lastID,
            changes: this.changes
          });
        }
      );
    }
  );
}

function all(db, sql, params) {
  return new Promise(
    (resolve, reject) => {
      db.all(
        sql,
        params || [],
        function(err, rows) {
          if (err) {
            return reject(err);
          }

          resolve(rows || []);
        }
      );
    }
  );
}

function pulisci(valor, max) {
  return String(
    valor == null
      ? ""
      : valor
  )
    .trim()
    .slice(
      0,
      Number(max || 500)
    );
}

function normalizzaStampanti(stampanti) {
  if (!Array.isArray(stampanti)) {
    throw new Error(
      "stampanti deve essere un array"
    );
  }

  if (stampanti.length > 100) {
    throw new Error(
      "troppe stampanti"
    );
  }

  const viste = {};
  const risultato = [];

  stampanti.forEach(
    (stampante) => {
      const id =
        pulisci(
          stampante &&
          stampante.id,
          120
        );

      const nome =
        pulisci(
          stampante &&
          stampante.nome,
          240
        );

      if (!id || !nome) {
        return;
      }

      if (viste[id]) {
        return;
      }

      viste[id] = true;

      risultato.push({
        id,
        nome,
        tipo:
          pulisci(
            stampante.tipo,
            50
          ),
        connessione:
          pulisci(
            stampante.connessione,
            120
          ),
        uri:
          pulisci(
            stampante.uri,
            1000
          )
      });
    }
  );

  return risultato;
}

async function sincronizzaStampanti(

  db,

  restauranteId,

  bridgeId,

  stampanti

) {

  const ristorante =
    Number(restauranteId);

  const bridge =
    pulisci(
      bridgeId,
      120
    );

  if (!ristorante) {
    throw new Error(
      "restaurante_id non valido"
    );
  }

  if (!bridge) {
    throw new Error(
      "bridge_id obbligatorio"
    );
  }

  const elenco =
    normalizzaStampanti(
      stampanti
    );

  const adesso =
    new Date().toISOString();

  /*
   * Niente BEGIN/COMMIT sulla connessione
   * SQLite condivisa dal server.
   *
   * Due Print Bridge possono sincronizzarsi
   * contemporaneamente senza aprire
   * transazioni annidate.
   */

  await run(
    db,
    `
    UPDATE print_bridge_printers
    SET
      stato='non_rilevata',
      ultimo_contacto=?
    WHERE restaurante_id=?
      AND bridge_id=?
    `,
    [
      adesso,
      ristorante,
      bridge
    ]
  );

  for (
    let i = 0;
    i < elenco.length;
    i++
  ) {
    const p =
      elenco[i];

    await run(
      db,
      `
      INSERT OR REPLACE INTO print_bridge_printers
      (
        restaurante_id,
        bridge_id,
        printer_id,
        printer_nome,
        tipo,
        connessione,
        uri,
        stato,
        ultimo_contacto
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        'rilevata', ?
      )
      `,
      [
        ristorante,
        bridge,
        p.id,
        p.nome,
        p.tipo || null,
        p.connessione || null,
        p.uri || null,
        adesso
      ]
    );
  }

  return {
    ok: true,

    restaurante_id:
      ristorante,

    bridge_id:
      bridge,

    rilevate:
      elenco.length,

    ultimo_contacto:
      adesso
  };
}

async function elencoStampanti(
  db,
  restauranteId
) {
  return all(
    db,
    `
    SELECT
      restaurante_id,
      bridge_id,
      printer_id,
      printer_nome,
      tipo,
      connessione,
      uri,
      stato,
      ultimo_contacto
    FROM print_bridge_printers
    WHERE restaurante_id=?
    ORDER BY
      CASE
        WHEN stato='rilevata'
        THEN 0
        ELSE 1
      END,
      printer_nome,
      printer_id
    `,
    [
      Number(restauranteId)
    ]
  );
}

module.exports = {
  sincronizzaStampanti,
  elencoStampanti
};
