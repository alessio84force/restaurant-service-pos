const express = require('express');
const { requiereRol } = require('../middleware/auth');

function pagosRoutes(db) {
  const router = express.Router();


  router.post('/mesa/:mesa/cuenta', (req, res) => {
    const mesa = req.params.mesa;

    const sql = `
      SELECT
        mesas.id AS mesa_id,
        pedidos.id AS pedido_id
      FROM mesas
      JOIN pedidos ON pedidos.mesa_id = mesas.id
      WHERE mesas.numero = ?
        AND pedidos.estado != 'cerrado'
      ORDER BY pedidos.id DESC
      LIMIT 1
    `;

    db.get(sql, [mesa], (err, row) => {
      if (err) {
        console.error("Error buscando pedido para cuenta:", err.message);
        return res.status(500).json({ error: "Error buscando pedido" });
      }

      if (!row) {
        return res.status(404).json({ error: "No hay pedido abierto" });
      }

      db.run("UPDATE pedidos SET estado='cuenta' WHERE id=?", [row.pedido_id], (errPedido) => {
        if (errPedido) {
          console.error("Error poniendo pedido en cuenta:", errPedido.message);
          return res.status(500).json({ error: "Error poniendo pedido en cuenta" });
        }

        db.run("UPDATE mesas SET estado='cuenta' WHERE id=?", [row.mesa_id], (errMesa) => {
          if (errMesa) {
            console.error("Error poniendo mesa en cuenta:", errMesa.message);
            return res.status(500).json({ error: "Error poniendo mesa en cuenta" });
          }

          res.json({
            ok: true,
            mesa: mesa,
            pedido: row.pedido_id,
            estado: "cuenta"
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


  router.post('/cerrar-mesa/:mesa', (req, res) => {
    const mesa = req.params.mesa;

    const sqlPedido = `
      SELECT
        mesas.id AS mesa_id,
        mesas.numero AS mesa_numero,
        pedidos.id AS pedido_id,
        COALESCE(pedidos.total, 0) AS total
      FROM mesas
      JOIN pedidos ON pedidos.mesa_id = mesas.id
      WHERE mesas.numero = ?
        AND pedidos.estado != 'cerrado'
      ORDER BY pedidos.id DESC
      LIMIT 1
    `;

    db.get(sqlPedido, [mesa], (err, row) => {
      if (err) {
        console.error("Error buscando pedido para cerrar mesa:", err.message);
        return res.status(500).json({ error: "Error buscando pedido para cerrar mesa" });
      }

      if (!row) {
        return res.status(404).json({ error: "No hay pedido abierto para esta mesa" });
      }

      db.get(
        "SELECT COALESCE(SUM(importe), 0) AS pagado FROM pagos WHERE pedido_id=?",
        [row.pedido_id],
        (errPagos, pagosRow) => {
          if (errPagos) {
            console.error("Error sumando pagos:", errPagos.message);
            return res.status(500).json({ error: "Error sumando pagos" });
          }

          const total = Math.round(Number(row.total || 0) * 100) / 100;
          const pagado = Math.round(Number((pagosRow && pagosRow.pagado) || 0) * 100) / 100;
          const pendiente = Math.round((total - pagado) * 100) / 100;

          if (pendiente > 0.009) {
            return res.status(400).json({
              error: "La cuenta todavía tiene importe pendiente",
              total: total,
              pagado: pagado,
              pendiente: pendiente
            });
          }

          db.run(
            "UPDATE pedidos SET estado='cerrado', pagado_en=CURRENT_TIMESTAMP WHERE id=?",
            [row.pedido_id],
            (errCerrarPedido) => {
              if (errCerrarPedido) {
                console.error("Error cerrando pedido:", errCerrarPedido.message);
                return res.status(500).json({ error: "Error cerrando pedido" });
              }

              db.run(
                "UPDATE mesas SET estado='libre' WHERE id=?",
                [row.mesa_id],
                (errLiberarMesa) => {
                  if (errLiberarMesa) {
                    console.error("Error liberando mesa:", errLiberarMesa.message);
                    return res.status(500).json({ error: "Error liberando mesa" });
                  }

                  res.json({
                    ok: true,
                    mesa: row.mesa_numero,
                    pedido: row.pedido_id,
                    total: total,
                    pagado: pagado,
                    pendiente: 0,
                    estado_mesa: "libre"
                  });
                }
              );
            }
          );
        }
      );
    });
  });

  return router;
}

module.exports = pagosRoutes;
