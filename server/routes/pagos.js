const express = require('express');
const { requiereRol } = require('../middleware/auth');

function pagosRoutes(db) {
  const router = express.Router();

  router.post('/mesa/:mesa/cuenta', (req, res) => {
    const mesa = req.params.mesa;

    const sql = `
      SELECT pedidos.id
      FROM pedidos
      JOIN mesas ON pedidos.mesa_id = mesas.id
      WHERE mesas.numero = ? AND pedidos.estado = 'abierto'
      ORDER BY pedidos.id DESC
      LIMIT 1
    `;

    db.get(sql, [mesa], (err, pedido) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!pedido) return res.status(400).json({ error: 'No hay pedido abierto' });

      db.run("UPDATE pedidos SET estado='cuenta' WHERE id=?", [pedido.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        db.run("UPDATE mesas SET estado='cuenta' WHERE numero=?", [mesa], function(err) {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            mensaje: 'Cuenta entregada',
            mesa: mesa,
            pedido: pedido.id
          });
        });
      });
    });
  });

  router.post('/mesa/:mesa/pagar', (req, res) => {
    const mesa = req.params.mesa;
    const metodo = req.body.metodo;
    const efectivo = Number(req.body.efectivo || 0);
    const tarjeta = Number(req.body.tarjeta || 0);

    const sql = `
      SELECT pedidos.id, pedidos.total
      FROM pedidos
      JOIN mesas ON pedidos.mesa_id = mesas.id
      WHERE mesas.numero = ? AND pedidos.estado IN ('abierto', 'cuenta')
      ORDER BY pedidos.id DESC
      LIMIT 1
    `;

    db.get(sql, [mesa], (err, pedido) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!pedido) return res.status(400).json({ error: 'No hay pedido pendiente de pago' });

      db.run(
        "UPDATE pedidos SET estado='cerrado', metodo_pago=?, efectivo=?, tarjeta=?, pagado_en=CURRENT_TIMESTAMP WHERE id=?",
        [metodo, efectivo, tarjeta, pedido.id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });

          db.run("UPDATE mesas SET estado='libre' WHERE numero=?", [mesa], function(err) {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
              mensaje: 'Pago registrado y mesa liberada',
              mesa: mesa,
              total: pedido.total,
              metodo: metodo,
              efectivo: efectivo,
              tarjeta: tarjeta
            });
          });
        }
      );
    });
  });

  return router;
}

module.exports = pagosRoutes;
