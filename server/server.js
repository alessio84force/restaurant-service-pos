const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(
  path.join(__dirname, '..', 'database', 'restaurant_service.db')
);

app.get('/', (req, res) => {
  res.send('Restaurant Service POS API funcionando');
});

app.get('/mesas', (req, res) => {
  db.all('SELECT * FROM mesas ORDER BY numero', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/pedido/:mesa', (req, res) => {
  const mesa = req.params.mesa;

  const pedidoSql = `
    SELECT pedidos.id, mesas.numero AS mesa, pedidos.estado, pedidos.total
    FROM pedidos
    JOIN mesas ON pedidos.mesa_id = mesas.id
    WHERE mesas.numero = ? AND pedidos.estado = 'abierto'
    ORDER BY pedidos.id DESC
    LIMIT 1
  `;

  db.get(pedidoSql, [mesa], (err, pedido) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!pedido) {
      return res.json({ mesa: mesa, pedido: null, productos: [], total: 0 });
    }

    const lineasSql = `
      SELECT productos.nombre, pedido_lineas.cantidad, pedido_lineas.precio,
      (pedido_lineas.cantidad * pedido_lineas.precio) AS subtotal,
      pedido_lineas.nota
      FROM pedido_lineas
      JOIN productos ON pedido_lineas.producto_id = productos.id
      WHERE pedido_lineas.pedido_id = ?
    `;

    db.all(lineasSql, [pedido.id], (err, productos) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        mesa: pedido.mesa,
        pedido: pedido.id,
        estado: pedido.estado,
        productos: productos,
        total: pedido.total
      });
    });
  });
});

app.post('/abrir-mesa/:mesa', (req, res) => {
  const mesa = req.params.mesa;

  db.run("UPDATE mesas SET estado='ocupada' WHERE numero=?", [mesa], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    db.run(
      "INSERT INTO pedidos (mesa_id, estado, total) SELECT id, 'abierto', 0 FROM mesas WHERE numero=?",
      [mesa],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          mensaje: 'Mesa abierta correctamente',
          mesa: mesa
        });
      }
    );
  });
});

app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});
