const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database(
  path.join(__dirname, '..', 'database', 'restaurant_service.db')
);

app.get('/', (req, res) => {
  res.send('Restaurant Service POS API funcionando');
});

app.get('/mesas', (req, res) => {  const sql = `    SELECT mesas.id, mesas.numero, mesas.estado,           reservas.cliente AS reserva_cliente,           reservas.personas AS reserva_personas,           reservas.hora AS reserva_hora    FROM mesas    LEFT JOIN reservas ON reservas.mesa_id = mesas.id AND reservas.estado = 'activa'    ORDER BY mesas.numero  `;  db.all(sql, [], (err, rows) => {    if (err) return res.status(500).json({ error: err.message });    res.json(rows);  });});

app.get('/productos', (req, res) => {
  db.all(
    `SELECT productos.id, productos.nombre, productos.precio, categorias.nombre AS categoria
     FROM productos
     JOIN categorias ON productos.categoria_id = categorias.id
     WHERE productos.disponible = 1
     ORDER BY categorias.id, productos.id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
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
      SELECT pedido_lineas.id, productos.nombre, pedido_lineas.cantidad, pedido_lineas.precio,
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

app.get('/ticket/:mesa', (req, res) => {
  const mesa = req.params.mesa;

  const pedidoSql = `
    SELECT pedidos.id, mesas.numero AS mesa, pedidos.estado, pedidos.total, pedidos.creado_en
    FROM pedidos
    JOIN mesas ON pedidos.mesa_id = mesas.id
    WHERE mesas.numero = ? AND pedidos.estado = 'abierto'
    ORDER BY pedidos.id DESC
    LIMIT 1
  `;

  db.get(pedidoSql, [mesa], (err, pedido) => {
    if (err) return res.status(500).send(err.message);

    if (!pedido) {
      return res.send('<h1>No hay pedido abierto para esta mesa</h1>');
    }

    const lineasSql = `
      SELECT pedido_lineas.id, productos.nombre, pedido_lineas.cantidad, pedido_lineas.precio,
      (pedido_lineas.cantidad * pedido_lineas.precio) AS subtotal,
      pedido_lineas.nota
      FROM pedido_lineas
      JOIN productos ON pedido_lineas.producto_id = productos.id
      WHERE pedido_lineas.pedido_id = ?
    `;

    db.all(lineasSql, [pedido.id], (err, productos) => {
      if (err) return res.status(500).send(err.message);

      let filas = '';

      productos.forEach(p => {
        filas += `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>${p.precio.toFixed(2)}</td>
            <td>${p.subtotal.toFixed(2)}</td>
          </tr>
        `;
      });

      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Precuenta Mesa ${pedido.mesa}</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px; }
            .ticket { width: 320px; background: white; padding: 20px; margin: auto; border: 1px solid #ddd; }
            h1, h2, p { text-align: center; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th, td { border-bottom: 1px solid #ddd; padding: 6px 2px; text-align: left; }
            .total { text-align: right; font-size: 20px; margin-top: 15px; font-weight: bold; }
            button { width: 100%; padding: 12px; margin-top: 15px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
            @media print {
              body { background: white; padding: 0; }
              button { display: none; }
              .ticket { border: none; width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h1>Restaurant Service</h1>
            <p>Precuenta</p>
            <p>Mesa ${pedido.mesa} | Pedido ${pedido.id}</p>
            <p>${pedido.creado_en}</p>

            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>

            <div class="total">TOTAL: ${pedido.total.toFixed(2)} EUR</div>

            <button onclick="window.print()">Imprimir</button>
          </div>
        </body>
        </html>
      `;

      res.send(html);
    });
  });
});

app.get('/cocina', (req, res) => {
  const sql = `
    SELECT 
      pedido_lineas.id AS id,
      mesas.numero AS mesa,
      pedidos.id AS pedido,
      productos.nombre AS producto,
      pedido_lineas.cantidad,
      pedido_lineas.nota
    FROM pedido_lineas
    JOIN pedidos ON pedido_lineas.pedido_id = pedidos.id
    JOIN mesas ON pedidos.mesa_id = mesas.id
    JOIN productos ON pedido_lineas.producto_id = productos.id
    JOIN categorias ON productos.categoria_id = categorias.id
    WHERE pedidos.estado = 'abierto'
    AND pedido_lineas.preparado = 0
    AND categorias.destino = 'cocina'
    ORDER BY pedidos.id, pedido_lineas.id
  `;

  db.all(sql, [], (err, lineas) => {
    if (err) return res.status(500).send(err.message);

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Cocina - Restaurant Service POS</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px; }
          h1 { text-align: center; }
          .comanda { background: white; padding: 15px; margin: 10px auto; max-width: 500px; border-radius: 10px; border-left: 6px solid #dc2626; }
          .producto { font-size: 20px; font-weight: bold; }
          .nota { color: #dc2626; font-weight: bold; }
          button { padding: 10px; background: #16a34a; color: white; border: none; border-radius: 8px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>COCINA</h1>
    `;

    if (lineas.length === 0) {
      html += '<p style="text-align:center;">No hay comandas pendientes.</p>';
    }

    lineas.forEach(l => {
      html += `
        <div class="comanda">
          <p><strong>Mesa ${l.mesa}</strong> | Pedido ${l.pedido}</p>
          <p class="producto">${l.cantidad} x ${l.producto}</p>
          ${l.nota ? `<p class="nota">Nota: ${l.nota}</p>` : ''}
          <button onclick="fetch('http://localhost:3000/linea/${l.id}/preparado', { method: 'POST' }).then(() => location.reload())">Preparado</button>
        </div>
      `;
    });

    html += `
      </body>
      </html>
    `;

    res.send(html);
  });
});

app.get('/bar', (req, res) => {
  const sql = `
    SELECT 
      pedido_lineas.id AS id,
      mesas.numero AS mesa,
      pedidos.id AS pedido,
      productos.nombre AS producto,
      pedido_lineas.cantidad,
      pedido_lineas.nota
    FROM pedido_lineas
    JOIN pedidos ON pedido_lineas.pedido_id = pedidos.id
    JOIN mesas ON pedidos.mesa_id = mesas.id
    JOIN productos ON pedido_lineas.producto_id = productos.id
    JOIN categorias ON productos.categoria_id = categorias.id
    WHERE pedidos.estado = 'abierto'
    AND pedido_lineas.preparado = 0
    AND categorias.destino = 'bar'
    ORDER BY pedidos.id, pedido_lineas.id
  `;

  db.all(sql, [], (err, lineas) => {
    if (err) return res.status(500).send(err.message);

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Bar - Restaurant Service POS</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px; }
          h1 { text-align: center; }
          .comanda { background: white; padding: 15px; margin: 10px auto; max-width: 500px; border-radius: 10px; border-left: 6px solid #2563eb; }
          .producto { font-size: 20px; font-weight: bold; }
          .nota { color: #2563eb; font-weight: bold; }
          button { padding: 10px; background: #16a34a; color: white; border: none; border-radius: 8px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>BAR</h1>
    `;

    if (lineas.length === 0) {
      html += '<p style="text-align:center;">No hay comandas pendientes.</p>';
    }

    lineas.forEach(l => {
      html += `
        <div class="comanda">
          <p><strong>Mesa ${l.mesa}</strong> | Pedido ${l.pedido}</p>
          <p class="producto">${l.cantidad} x ${l.producto}</p>
          ${l.nota ? `<p class="nota">Nota: ${l.nota}</p>` : ''}
          <button onclick="fetch('http://localhost:3000/linea/${l.id}/preparado', { method: 'POST' }).then(() => location.reload())">Preparado</button>
        </div>
      `;
    });

    html += `
      </body>
      </html>
    `;

    res.send(html);
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
        res.json({ mensaje: 'Mesa abierta correctamente', mesa: mesa });
      }
    );
  });
});

app.post('/anadir-producto', (req, res) => {
  const mesa = req.body.mesa;
  const producto = req.body.producto;
  const cantidad = req.body.cantidad || 1;

  const pedidoSql = `
    SELECT pedidos.id
    FROM pedidos
    JOIN mesas ON pedidos.mesa_id = mesas.id
    WHERE mesas.numero = ? AND pedidos.estado = 'abierto'
    ORDER BY pedidos.id DESC
    LIMIT 1
  `;

  db.get(pedidoSql, [mesa], (err, pedido) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!pedido) {
      return res.status(400).json({ error: 'No hay pedido abierto para esta mesa' });
    }

    db.get('SELECT precio FROM productos WHERE id=?', [producto], (err, productoDb) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!productoDb) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      db.run(
        'INSERT INTO pedido_lineas (pedido_id, producto_id, cantidad, precio, nota) VALUES (?, ?, ?, ?, ?)',
        [pedido.id, producto, cantidad, productoDb.precio, ''],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });

          db.run(
            'UPDATE pedidos SET total = (SELECT SUM(cantidad * precio) FROM pedido_lineas WHERE pedido_id=?) WHERE id=?',
            [pedido.id, pedido.id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });

              res.json({
                mensaje: 'Producto añadido correctamente',
                mesa: mesa,
                producto: producto,
                cantidad: cantidad
              });
            }
          );
        }
      );
    });
  });
});

app.post('/linea/:id/cantidad', (req, res) => {
  const id = req.params.id;
  const cambio = req.body.cambio;

  db.get('SELECT pedido_id, cantidad FROM pedido_lineas WHERE id=?', [id], (err, linea) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!linea) {
      return res.status(404).json({ error: 'Linea no encontrada' });
    }

    const nuevaCantidad = linea.cantidad + cambio;

    if (nuevaCantidad <= 0) {
      db.run('DELETE FROM pedido_lineas WHERE id=?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        actualizarTotal(linea.pedido_id, res);
      });
      return;
    }

    db.run('UPDATE pedido_lineas SET cantidad=? WHERE id=?', [nuevaCantidad, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      actualizarTotal(linea.pedido_id, res);
    });
  });
});

app.delete('/linea/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT pedido_id FROM pedido_lineas WHERE id=?', [id], (err, linea) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!linea) {
      return res.status(404).json({ error: 'Linea no encontrada' });
    }

    db.run('DELETE FROM pedido_lineas WHERE id=?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      actualizarTotal(linea.pedido_id, res);
    });
  });
});

app.post('/linea/:id/preparado', (req, res) => {
  const id = req.params.id;

  db.run(
    'UPDATE pedido_lineas SET preparado = 1 WHERE id=?',
    [id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        mensaje: 'Linea marcada como preparada',
        linea: id
      });
    }
  );
});

app.post('/cerrar-mesa/:mesa', (req, res) => {
  const mesa = req.params.mesa;

  const pedidoSql = `
    SELECT pedidos.id
    FROM pedidos
    JOIN mesas ON pedidos.mesa_id = mesas.id
    WHERE mesas.numero = ? AND pedidos.estado = 'abierto'
    ORDER BY pedidos.id DESC
    LIMIT 1
  `;

  db.get(pedidoSql, [mesa], (err, pedido) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!pedido) {
      return res.status(400).json({ error: 'No hay pedido abierto para esta mesa' });
    }

    db.run("UPDATE pedidos SET estado='cerrado' WHERE id=?", [pedido.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      db.run("UPDATE mesas SET estado='libre' WHERE numero=?", [mesa], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          mensaje: 'Mesa cerrada correctamente',
          mesa: mesa,
          pedido: pedido.id
        });
      });
    });
  });
});

function actualizarTotal(pedidoId, res) {
  db.run(
    'UPDATE pedidos SET total = COALESCE((SELECT SUM(cantidad * precio) FROM pedido_lineas WHERE pedido_id=?), 0) WHERE id=?',
    [pedidoId, pedidoId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Pedido actualizado correctamente' });
    }
  );
}

app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});

app.get('/ventas', (req, res) => {
  const sql = `
    SELECT 
      pedidos.id,
      mesas.numero AS mesa,
      pedidos.total,
      pedidos.creado_en
    FROM pedidos
    JOIN mesas ON pedidos.mesa_id = mesas.id
    WHERE pedidos.estado = 'cerrado'
    ORDER BY pedidos.id DESC
  `;

  db.all(sql, [], (err, pedidos) => {
    if (err) return res.status(500).send(err.message);

    let total = pedidos.reduce((sum, p) => sum + p.total, 0);

    let filas = '';
    pedidos.forEach(p => {
      filas += `
        <tr>
          <td>${p.id}</td>
          <td>Mesa ${p.mesa}</td>
          <td>${p.total.toFixed(2)} EUR</td>
          <td>${p.creado_en}</td>
        </tr>
      `;
    });

    res.send(`
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ventas</title>
        <style>
          body { font-family: Arial; background: #f4f4f4; padding: 30px; }
          h1 { text-align: center; }
          table { width: 100%; background: white; border-collapse: collapse; }
          th, td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { font-size: 24px; font-weight: bold; text-align: right; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Historial de ventas</h1>
        <div class="total">TOTAL: ${total.toFixed(2)} EUR</div>
        <table>
          <tr>
            <th>Pedido</th>
            <th>Mesa</th>
            <th>Total</th>
            <th>Fecha</th>
          </tr>
          ${filas}
        </table>
      </body>
      </html>
    `);
  });
});

app.get('/dashboard', (req, res) => {
  const datos = {};

  db.get("SELECT COALESCE(SUM(total), 0) AS ventas FROM pedidos WHERE estado='cerrado'", [], (err, row) => {
    if (err) return res.status(500).send(err.message);
    datos.ventas = row.ventas;

    db.get("SELECT COUNT(*) AS mesas_abiertas FROM mesas WHERE estado='ocupada'", [], (err, row) => {
      if (err) return res.status(500).send(err.message);
      datos.mesas_abiertas = row.mesas_abiertas;

      db.get("SELECT COUNT(*) AS pedidos_activos FROM pedidos WHERE estado='abierto'", [], (err, row) => {
        if (err) return res.status(500).send(err.message);
        datos.pedidos_activos = row.pedidos_activos;

        db.get("SELECT COUNT(*) AS pedidos_cerrados FROM pedidos WHERE estado='cerrado'", [], (err, row) => {
          if (err) return res.status(500).send(err.message);
          datos.pedidos_cerrados = row.pedidos_cerrados;

          const ticketMedio = datos.pedidos_cerrados > 0
            ? datos.ventas / datos.pedidos_cerrados
            : 0;

          res.send(`
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Dashboard Gerencia</title>
              <style>
                body { font-family: Arial; background: #f4f4f4; padding: 30px; }
                h1 { text-align: center; }
                .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 900px; margin: auto; }
                .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); text-align: center; }
                .number { font-size: 36px; font-weight: bold; color: #2563eb; }
                .label { color: #555; margin-top: 8px; }
              </style>
            </head>
            <body>
              <h1>Dashboard de Gerencia</h1>
              <div class="grid">
                <div class="card">
                  <div class="number">${datos.ventas.toFixed(2)} EUR</div>
                  <div class="label">Ventas cerradas</div>
                </div>
                <div class="card">
                  <div class="number">${datos.mesas_abiertas}</div>
                  <div class="label">Mesas abiertas</div>
                </div>
                <div class="card">
                  <div class="number">${datos.pedidos_activos}</div>
                  <div class="label">Pedidos activos</div>
                </div>
                <div class="card">
                  <div class="number">${ticketMedio.toFixed(2)} EUR</div>
                  <div class="label">Ticket medio</div>
                </div>
              </div>
            </body>
            </html>
          `);
        });
      });
    });
  });
});

app.get('/admin-productos', (req, res) => {
  db.all('SELECT id, nombre, destino FROM categorias ORDER BY nombre', [], (err, categorias) => {
    if (err) return res.status(500).send(err.message);

    db.all(`
      SELECT productos.id, productos.nombre, productos.precio, productos.disponible,
             categorias.nombre AS categoria, categorias.destino
      FROM productos
      JOIN categorias ON productos.categoria_id = categorias.id
      ORDER BY categorias.nombre, productos.nombre
    `, [], (err, productos) => {
      if (err) return res.status(500).send(err.message);

      let opciones = '';
      categorias.forEach(c => {
        opciones += `<option value="${c.id}">${c.nombre} (${c.destino})</option>`;
      });

      let filas = '';
      productos.forEach(p => {
        filas += `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.precio.toFixed(2)} EUR</td>
            <td>${p.categoria}</td>
            <td>${p.destino}</td>
            <td>${p.disponible ? "Si" : "No"}</td>
            <td>
<form method="GET" action="/admin-productos/editar/${p.id}" style="display:inline;"><button type="submit">Editar</button></form>
              <form method="POST" action="/admin-productos/activar/${p.id}" style="display:inline;"><button type="submit">Activar</button></form>
              <form method="POST" action="/admin-productos/desactivar/${p.id}" style="display:inline;"><button type="submit">Desactivar</button></form>
              <form method="POST" action="/admin-productos/eliminar/${p.id}" style="display:inline;"><button type="submit">Eliminar</button></form>
            </td>
          </tr>
        `;
      });

      res.send(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Admin Productos</title>
          <style>
            body { font-family: Arial; background: #f4f4f4; padding: 30px; }
            form, table { background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; width: 100%; }
            input, select, button { padding: 10px; margin: 5px; }
            table { border-collapse: collapse; }
            th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Administrar productos</h1>

<form method="POST" action="/admin-categorias/crear">
<h2>Nueva categoría</h2>
<input name="nombre" placeholder="Nombre de categoría" required>
<select name="destino" required>
<option value="cocina">Cocina</option>
<option value="bar">Bar</option>
</select>
<button type="submit">Crear categoría</button>
</form>

          <form method="POST" action="/admin-productos/crear">
            <h2>Nuevo producto</h2>
            <input name="nombre" placeholder="Nombre del producto" required>
            <input name="precio" type="number" step="0.01" placeholder="Precio" required>
            <select name="categoria_id" required>${opciones}</select>
            <button type="submit">Crear producto</button>
          </form>

          <table>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Categoría</th>
              <th>Destino</th>
              <th>Disponible</th>
<th>Acciones</th>
            </tr>
            ${filas}
          </table>
        </body>
        </html>
      `);
    });
  });
});

app.post('/admin-categorias/crear', (req, res) => {
  const nombre = req.body.nombre;
  const destino = req.body.destino;

  db.run(
    'INSERT INTO categorias (nombre, destino) VALUES (?, ?)',
    [nombre, destino],
    function(err) {
      if (err) {
        return res.status(500).send(err.message);
      }

      res.redirect('/admin-productos');
    }
  );
});


app.post('/admin-productos/activar/:id', (req, res) => {
  db.run('UPDATE productos SET disponible=1 WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin-productos');
  });
});

app.post('/admin-productos/desactivar/:id', (req, res) => {
  db.run('UPDATE productos SET disponible=0 WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin-productos');
  });
});

app.post('/admin-productos/eliminar/:id', (req, res) => {
  db.run('DELETE FROM productos WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin-productos');
  });
});

app.get('/admin-productos/editar/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM productos WHERE id=?', [id], (err, producto) => {
    if (err) return res.status(500).send(err.message);

    if (!producto) {
      return res.send('Producto no encontrado');
    }

    db.all('SELECT id, nombre, destino FROM categorias ORDER BY nombre', [], (err, categorias) => {
      if (err) return res.status(500).send(err.message);

      let opciones = '';
      categorias.forEach(c => {
        const selected = c.id === producto.categoria_id ? 'selected' : '';
        opciones += `<option value="${c.id}" ${selected}>${c.nombre} (${c.destino})</option>`;
      });

      res.send(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Editar producto</title>
          <style>
            body { font-family: Arial; background: #f4f4f4; padding: 30px; }
            form { background: white; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; }
            input, select, button { width: 100%; padding: 10px; margin: 8px 0; }
          </style>
        </head>
        <body>
          <form method="POST" action="/admin-productos/editar/${producto.id}">
            <h1>Editar producto</h1>
            <input name="nombre" value="${producto.nombre}" required>
            <input name="precio" type="number" step="0.01" value="${producto.precio}" required>
            <select name="categoria_id" required>${opciones}</select>
            <button type="submit">Guardar cambios</button>
          </form>
        </body>
        </html>
      `);
    });
  });
});

app.post('/admin-productos/editar/:id', (req, res) => {
  const id = req.params.id;
  const nombre = req.body.nombre;
  const precio = req.body.precio;
  const categoria_id = req.body.categoria_id;

  db.run(
    'UPDATE productos SET nombre=?, precio=?, categoria_id=? WHERE id=?',
    [nombre, precio, categoria_id, id],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.redirect('/admin-productos');
    }
  );
});

app.get('/reservas', (req, res) => {
  const sql = `
    SELECT reservas.id, mesas.numero AS mesa, reservas.cliente, reservas.personas,
           reservas.telefono, reservas.fecha, reservas.hora, reservas.estado
    FROM reservas
    JOIN mesas ON reservas.mesa_id = mesas.id
    ORDER BY reservas.fecha, reservas.hora
  `;

  db.all(sql, [], (err, reservas) => {
    if (err) return res.status(500).send(err.message);

    let filas = '';
    reservas.forEach(r => {
      filas += `
        <tr>
          <td>Mesa ${r.mesa}</td>
          <td>${r.cliente}</td>
          <td>${r.personas}</td>
          <td>${r.telefono}</td>
          <td>${r.fecha}</td>
          <td>${r.hora}</td>
          <td>${r.estado}</td>
<td>
<form method="POST" action="/reservas/${r.id}/confirmar" style="display:inline;"><button type="submit">Confirmar llegada</button></form>
<form method="POST" action="/reservas/${r.id}/cancelar" style="display:inline;"><button type="submit">Cancelar</button></form>
</td>
        </tr>
      `;
    });

    res.send(`
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reservas</title>
        <style>
          body { font-family: Arial; background: #f4f4f4; padding: 30px; }
          table { width: 100%; background: white; border-collapse: collapse; }
          th, td { padding: 10px; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Reservas</h1>
<form method="POST" action="/reservas/crear" style="background:white; padding:20px; margin-bottom:25px;">
<h2>Nueva reserva</h2>
<select name="mesa_id" required><option value="1">Mesa 1</option><option value="2">Mesa 2</option><option value="3">Mesa 3</option><option value="4">Mesa 4</option><option value="5">Mesa 5</option><option value="6">Mesa 6</option></select>
<input name="cliente" placeholder="Cliente" required>
<input name="personas" type="number" placeholder="Personas" required>
<input name="telefono" placeholder="Telefono">
<input name="fecha" type="date" required>
<input name="hora" type="time" required>
<button type="submit">Crear reserva</button>
</form>
        <table>
          <tr>
            <th>Mesa</th>
            <th>Cliente</th>
            <th>Personas</th>
            <th>Telefono</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Estado</th>
<th>Acciones</th>
          </tr>
          ${filas}
        </table>
      </body>
      </html>
    `);
  });
});

app.post('/reservas/crear', (req, res) => {
  const mesa_id = req.body.mesa_id;
  const cliente = req.body.cliente;
  const personas = req.body.personas;
  const telefono = req.body.telefono;
  const fecha = req.body.fecha;
  const hora = req.body.hora;

  db.run(
    'INSERT INTO reservas (mesa_id, cliente, personas, telefono, fecha, hora, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [mesa_id, cliente, personas, telefono, fecha, hora, 'activa'],
    function(err) {
      if (err) return res.status(500).send(err.message);

      db.run("UPDATE mesas SET estado='reservada' WHERE id=?", [mesa_id], function(err) {
        if (err) return res.status(500).send(err.message);
        res.redirect('/reservas');
      });
    }
  );
});

app.post('/reservas/:id/confirmar', (req, res) => {
  const id = req.params.id;

  db.get('SELECT mesa_id FROM reservas WHERE id=?', [id], (err, reserva) => {
    if (err) return res.status(500).send(err.message);
    if (!reserva) return res.status(404).send('Reserva no encontrada');

    db.run("UPDATE reservas SET estado='confirmada' WHERE id=?", [id], function(err) {
      if (err) return res.status(500).send(err.message);

      db.run("UPDATE mesas SET estado='ocupada' WHERE id=?", [reserva.mesa_id], function(err) {
        if (err) return res.status(500).send(err.message);
        res.redirect('/reservas');
      });
    });
  });
});

app.post('/reservas/:id/cancelar', (req, res) => {
  const id = req.params.id;

  db.get('SELECT mesa_id FROM reservas WHERE id=?', [id], (err, reserva) => {
    if (err) return res.status(500).send(err.message);
    if (!reserva) return res.status(404).send('Reserva no encontrada');

    db.run("UPDATE reservas SET estado='cancelada' WHERE id=?", [id], function(err) {
      if (err) return res.status(500).send(err.message);

      db.run("UPDATE mesas SET estado='libre' WHERE id=?", [reserva.mesa_id], function(err) {
        if (err) return res.status(500).send(err.message);
        res.redirect('/reservas');
      });
    });
  });
});

app.get('/cierre-caja', (req, res) => {
  const fechaHoy = new Date().toISOString().slice(0, 10);

  db.get(
    "SELECT COALESCE(SUM(total), 0) AS total_ventas, COUNT(*) AS pedidos_cerrados FROM pedidos WHERE estado='cerrado'",
    [],
    (err, resumen) => {
      if (err) return res.status(500).send(err.message);

      const ticketMedio = resumen.pedidos_cerrados > 0
        ? resumen.total_ventas / resumen.pedidos_cerrados
        : 0;

      db.all('SELECT * FROM cierres_caja ORDER BY id DESC', [], (err, cierres) => {
        if (err) return res.status(500).send(err.message);

        let filas = '';
        cierres.forEach(c => {
          filas += `
            <tr>
              <td>${c.fecha}</td>
              <td>${c.total_ventas.toFixed(2)} EUR</td>
              <td>${c.pedidos_cerrados}</td>
              <td>${c.ticket_medio.toFixed(2)} EUR</td>
              <td>${c.creado_en}</td>
            </tr>
          `;
        });

        res.send(`
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Cierre de Caja</title>
            <style>
              body { font-family: Arial; background: #f4f4f4; padding: 30px; }
              .card, table { background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; width: 100%; }
              .total { font-size: 32px; font-weight: bold; color: #2563eb; }
              th, td { padding: 10px; border-bottom: 1px solid #ddd; }
              button { padding: 12px 20px; background: #16a34a; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
            </style>
          </head>
          <body>
            <h1>Cierre de Caja Diario</h1>

            <div class="card">
              <h2>Resumen actual</h2>
              <p>Fecha: ${fechaHoy}</p>
              <p class="total">${resumen.total_ventas.toFixed(2)} EUR</p>
              <p>Pedidos cerrados: ${resumen.pedidos_cerrados}</p>
              <p>Ticket medio: ${ticketMedio.toFixed(2)} EUR</p>

              <form method="POST" action="/cierre-caja/cerrar">
                <button type="submit">Cerrar caja</button>
              </form>
            </div>

            <h2>Historial de cierres</h2>
            <table>
              <tr>
                <th>Fecha</th>
                <th>Total ventas</th>
                <th>Pedidos cerrados</th>
                <th>Ticket medio</th>
                <th>Creado en</th>
              </tr>
              ${filas}
            </table>
          </body>
          </html>
        `);
      });
    }
  );
});

app.post('/cierre-caja/cerrar', (req, res) => {
  const fechaHoy = new Date().toISOString().slice(0, 10);

  db.get(
    "SELECT COALESCE(SUM(total), 0) AS total_ventas, COUNT(*) AS pedidos_cerrados FROM pedidos WHERE estado='cerrado'",
    [],
    (err, resumen) => {
      if (err) return res.status(500).send(err.message);

      const ticketMedio = resumen.pedidos_cerrados > 0
        ? resumen.total_ventas / resumen.pedidos_cerrados
        : 0;

      db.run(
        'INSERT INTO cierres_caja (fecha, total_ventas, pedidos_cerrados, ticket_medio) VALUES (?, ?, ?, ?)',
        [fechaHoy, resumen.total_ventas, resumen.pedidos_cerrados, ticketMedio],
        function(err) {
          if (err) return res.status(500).send(err.message);
          res.redirect('/cierre-caja');
        }
      );
    }
  );
});

app.get('/login', (req, res) => {
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Login</title>
      <style>
        body { font-family: Arial; background: #f4f4f4; padding: 40px; }
        form { background: white; padding: 25px; max-width: 400px; margin: auto; border-radius: 10px; }
        input, button { width: 100%; padding: 12px; margin: 8px 0; }
        button { background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; }
      </style>
    </head>
    <body>
      <form method="POST" action="/login">
        <h1>Restaurant Service POS</h1>
        <h2>Acceso</h2>
        <input name="email" type="email" placeholder="Email" required>
        <input name="password" type="password" placeholder="Contraseña" required>
        <button type="submit">Entrar</button>
      </form>
    </body>
    </html>
  `);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.get(
    'SELECT id, nombre, email, rol FROM usuarios WHERE email=? AND password=? AND activo=1',
    [email, password],
    (err, usuario) => {
      if (err) return res.status(500).send(err.message);

      if (!usuario) {
        return res.send('Usuario o contraseña incorrectos');
      }

let menu = "";

if (usuario.rol === "admin") {
menu += `<li><a href="http://localhost:8000">Sala</a></li>`;
menu += `<li><a href="/cocina">Cocina</a></li>`;
menu += `<li><a href="/bar">Bar</a></li>`;
menu += `<li><a href="/reservas">Reservas</a></li>`;
menu += `<li><a href="/admin-productos">Admin productos</a></li>`;
menu += `<li><a href="/dashboard">Dashboard</a></li>`;
menu += `<li><a href="/cierre-caja">Cierre de caja</a></li>`;
}

if (usuario.rol === "camarero") {
menu += `<li><a href="http://localhost:8000">Sala</a></li>`;
menu += `<li><a href="/reservas">Reservas</a></li>`;
}

if (usuario.rol === "cocina") {
menu += `<li><a href="/cocina">Cocina</a></li>`;
}

if (usuario.rol === "bar") {
menu += `<li><a href="/bar">Bar</a></li>`;
}

if (usuario.rol === "gerente") {
menu += `<li><a href="/dashboard">Dashboard</a></li>`;
menu += `<li><a href="/ventas">Historial ventas</a></li>`;
menu += `<li><a href="/cierre-caja">Cierre de caja</a></li>`;
}

res.send(`
<html>
<head>
<meta charset="UTF-8">
<title>Panel usuario</title>
</head>
<body style="font-family: Arial; padding: 30px;">
<h1>Bienvenido, ${usuario.nombre}</h1>
<p>Rol: ${usuario.rol}</p>
<ul>${menu}</ul>
</body>
</html>
`);
    }
  );
});

app.get('/admin-usuarios', (req, res) => {
  db.all('SELECT id, nombre, email, rol, activo FROM usuarios ORDER BY id', [], (err, usuarios) => {
    if (err) return res.status(500).send(err.message);

    let filas = '';

    usuarios.forEach(u => {
      filas += `
        <tr>
          <td>${u.nombre}</td>
          <td>${u.email}</td>
          <td>${u.rol}</td>
          <td>${u.activo ? 'Si' : 'No'}</td>
<td>
<form method="GET" action="/admin-usuarios/editar/${u.id}" style="display:inline;"><button type="submit">Editar</button></form>
<form method="POST" action="/admin-usuarios/activar/${u.id}" style="display:inline;"><button type="submit">Activar</button></form>
<form method="POST" action="/admin-usuarios/desactivar/${u.id}" style="display:inline;"><button type="submit">Desactivar</button></form>
<form method="POST" action="/admin-usuarios/eliminar/${u.id}" style="display:inline;"><button type="submit">Eliminar</button></form>
</td>
        </tr>
      `;
    });

    res.send(`
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Admin Usuarios</title>
        <style>
          body { font-family: Arial; background: #f4f4f4; padding: 30px; }
          form, table { background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; width: 100%; }
          input, select, button { padding: 10px; margin: 5px; }
          table { border-collapse: collapse; }
          th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Administrar usuarios</h1>

        <form method="POST" action="/admin-usuarios/crear">
          <h2>Nuevo usuario</h2>
          <input name="nombre" placeholder="Nombre" required>
          <input name="email" type="email" placeholder="Email" required>
          <input name="password" placeholder="Contraseña" required>
          <select name="rol" required>
            <option value="admin">Admin</option>
            <option value="camarero">Camarero</option>
            <option value="cocina">Cocina</option>
            <option value="bar">Bar</option>
            <option value="gerente">Gerente</option>
          </select>
          <button type="submit">Crear usuario</button>
        </form>

        <table>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Activo</th>
<th>Acciones</th>
          </tr>
          ${filas}
        </table>
      </body>
      </html>
    `);
  });
});

app.post('/admin-usuarios/crear', (req, res) => {
  const nombre = req.body.nombre;
  const email = req.body.email;
  const password = req.body.password;
  const rol = req.body.rol;

  db.run(
    'INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, 1)',
    [nombre, email, password, rol],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.redirect('/admin-usuarios');
    }
  );
});

app.post('/admin-usuarios/activar/:id', (req, res) => {
  db.run(
    'UPDATE usuarios SET activo=1 WHERE id=?',
    [req.params.id],
    () => res.redirect('/admin-usuarios')
  );
});

app.post('/admin-usuarios/desactivar/:id', (req, res) => {
  db.run(
    'UPDATE usuarios SET activo=0 WHERE id=?',
    [req.params.id],
    () => res.redirect('/admin-usuarios')
  );
});

app.post('/admin-usuarios/eliminar/:id', (req, res) => {
  db.run(
    'DELETE FROM usuarios WHERE id=?',
    [req.params.id],
    () => res.redirect('/admin-usuarios')
  );
});


app.get('/admin-usuarios/editar/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM usuarios WHERE id=?', [id], (err, usuario) => {
    if (err) return res.status(500).send(err.message);

    if (!usuario) {
      return res.send('Usuario no encontrado');
    }

    res.send(`
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Editar usuario</title>
        <style>
          body { font-family: Arial; background: #f4f4f4; padding: 30px; }
          form { background: white; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; }
          input, select, button { width: 100%; padding: 10px; margin: 8px 0; }
        </style>
      </head>
      <body>
        <form method="POST" action="/admin-usuarios/editar/${usuario.id}">
          <h1>Editar usuario</h1>

          <input name="nombre" value="${usuario.nombre}" required>
          <input name="email" type="email" value="${usuario.email}" required>
          <input name="password" value="${usuario.password}" required>

          <select name="rol" required>
            <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="camarero" ${usuario.rol === 'camarero' ? 'selected' : ''}>Camarero</option>
            <option value="cocina" ${usuario.rol === 'cocina' ? 'selected' : ''}>Cocina</option>
            <option value="bar" ${usuario.rol === 'bar' ? 'selected' : ''}>Bar</option>
            <option value="gerente" ${usuario.rol === 'gerente' ? 'selected' : ''}>Gerente</option>
          </select>

          <button type="submit">Guardar cambios</button>
        </form>
      </body>
      </html>
    `);
  });
});

app.post('/admin-usuarios/editar/:id', (req, res) => {
  const id = req.params.id;
  const nombre = req.body.nombre;
  const email = req.body.email;
  const password = req.body.password;
  const rol = req.body.rol;

  db.run(
    'UPDATE usuarios SET nombre=?, email=?, password=?, rol=? WHERE id=?',
    [nombre, email, password, rol, id],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.redirect('/admin-usuarios');
    }
  );
});

