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
            id:
              this.lastID,

            changes:
              this.changes
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

          resolve(
            rows || []
          );
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
      Number(
        max || 500
      )
    );
}


function serializzaCapacita(
  capacita
) {

  if (
    !capacita ||
    typeof capacita !==
      "object" ||
    Array.isArray(capacita)
  ) {
    return "";
  }

  try {

    const json =
      JSON.stringify(
        capacita
      );

    /*
     * Le capacita previste sono
     * molto piccole.
     *
     * Non tronchiamo JSON perché
     * diventerebbe invalido.
     */
    if (
      json.length > 4000
    ) {
      return "";
    }

    return json;

  } catch (_) {

    return "";

  }
}


function normalizzaStampanti(
  stampanti
) {

  if (
    !Array.isArray(stampanti)
  ) {
    throw new Error(
      "stampanti deve essere un array"
    );
  }

  if (
    stampanti.length > 100
  ) {
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

      if (
        !id ||
        !nome
      ) {
        return;
      }

      if (
        viste[id]
      ) {
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
            160
          ),

        uri:
          pulisci(
            stampante.uri,
            1000
          ),

        marca:
          pulisci(
            stampante.marca,
            120
          ),

        compatibilita:
          pulisci(
            stampante.compatibilita,
            50
          ),

        trasporto:
          pulisci(
            stampante.trasporto,
            50
          ),

        profilo:
          pulisci(
            stampante.profilo,
            120
          ),

        linguaggio:
          pulisci(
            stampante.linguaggio,
            80
          ),

        capacita_json:
          serializzaCapacita(
            stampante.capacita
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
    Number(
      restauranteId
    );

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
    new Date()
      .toISOString();

  /*
   * Una sincronizzazione indica
   * che il Bridge ha controllato
   * il proprio inventario.
   *
   * Per le stampanti che non sono
   * presenti:
   *
   * - stato diventa non_rilevata
   * - ultimo_contacto viene aggiornato
   *   alla sincronizzazione attuale
   * - ultimo_rilevato_en NON cambia
   *
   * In questo modo sappiamo quando
   * quella stampante e' stata vista
   * realmente l'ultima volta.
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

    /*
     * INSERT OR REPLACE viene
     * mantenuto per compatibilita'
     * con le versioni SQLite usate
     * dal progetto.
     */
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
        ultimo_contacto,
        marca,
        compatibilita,
        trasporto,
        profilo,
        linguaggio,
        capacita_json,
        ultimo_rilevato_en
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        'rilevata', ?,
        ?, ?, ?, ?, ?, ?, ?
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

        adesso,

        p.marca || null,
        p.compatibilita || null,
        p.trasporto || null,
        p.profilo || null,
        p.linguaggio || null,
        p.capacita_json || null,

        adesso
      ]
    );

  }

  return {
    ok:
      true,

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
      ultimo_contacto,
      marca,
      compatibilita,
      trasporto,
      profilo,
      linguaggio,
      capacita_json,
      ultimo_rilevato_en
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
      Number(
        restauranteId
      )
    ]
  );
}


module.exports = {
  sincronizzaStampanti,
  elencoStampanti
};
