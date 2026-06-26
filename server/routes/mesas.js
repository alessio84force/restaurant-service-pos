const express = require('express');

function mesasRoutes(db) {

  const router = express.Router();

  router.post('/mesa/mover', (req, res) => {

    const origen = req.body.origen;
    const destino = req.body.destino;

    db.get("SELECT id FROM mesas WHERE numero=?", [origen], (err, mesaOrigen) => {
      if (err) return res.status(500).send(err.message);

      db.get("SELECT id FROM mesas WHERE numero=?", [destino], (err, mesaDestino) => {
        if (err) return res.status(500).send(err.message);

        db.run(
          "UPDATE pedidos SET mesa_id=? WHERE mesa_id=? AND estado!='cerrado'",
          [mesaDestino.id, mesaOrigen.id],
          () => {

            db.run("UPDATE mesas SET estado='libre' WHERE id=?", [mesaOrigen.id]);

            db.run(
              "UPDATE mesas SET estado='ocupada' WHERE id=?",
              [mesaDestino.id],
              () => res.json({ ok: true })
            );

          }
        );

      });

    });

  });

  router.post('/mesa/unir', (req, res) => {

    const origen = req.body.origen;
    const destino = req.body.destino;

    db.get("SELECT id FROM mesas WHERE numero=?", [origen], (err, mesaOrigen) => {

      db.get("SELECT id FROM mesas WHERE numero=?", [destino], (err, mesaDestino) => {

        db.get("SELECT id,total FROM pedidos WHERE mesa_id=? AND estado!='cerrado'", [mesaOrigen.id], (err, pedidoOrigen) => {

          db.get("SELECT id,total FROM pedidos WHERE mesa_id=? AND estado!='cerrado'", [mesaDestino.id], (err, pedidoDestino) => {

            if (!pedidoOrigen || !pedidoDestino) {
              return res.json({ error: "Las dos mesas deben tener un pedido abierto" });
            }

            db.run(
              "UPDATE lineas_pedido SET pedido_id=? WHERE pedido_id=?",
              [pedidoDestino.id, pedidoOrigen.id],
              () => {

                db.run(
                  "UPDATE pedidos SET total=total+? WHERE id=?",
                  [pedidoOrigen.total, pedidoDestino.id],
                  () => {

                    db.run("DELETE FROM pedidos WHERE id=?", [pedidoOrigen.id]);

                    db.run(
                      "UPDATE mesas SET estado='libre' WHERE id=?",
                      [mesaOrigen.id],
                      () => res.json({ ok: true })
                    );

                  }
                );

              }
            );

          });

        });

      });

    });

  });

  return router;

}

module.exports = mesasRoutes;
