const express = require('express');
const { requiereRol } = require('../middleware/auth');

function zonasRoutes(db) {
  const router = express.Router();

  router.get('/admin-zonas-mesas', requiereRol(['admin']), (req, res) => {

    db.all('SELECT id, nombre FROM zonas WHERE activo=1 ORDER BY id', [], (err, zonas) => {
      if (err) return res.status(500).send(err.message);

      db.all(`
        SELECT mesas.id,
               mesas.numero,
               mesas.estado,
               zonas.nombre AS zona
        FROM mesas
        LEFT JOIN zonas ON mesas.zona_id = zonas.id
        ORDER BY zonas.id, mesas.numero
      `, [], (err, mesas) => {

        if (err) return res.status(500).send(err.message);

        let opciones = '';
        zonas.forEach(z=>{
          opciones += `<option value="${z.id}">${z.nombre}</option>`;
        });

        let htmlZonas='';
        zonas.forEach(z=>{
          htmlZonas += `<tr><td>${z.nombre}</td></tr>`;
        });

        let htmlMesas='';
        mesas.forEach(m=>{
          htmlMesas += `
          <tr>
            <td>${m.numero}</td>
            <td>${m.zona}</td>
            <td>${m.estado}</td>
          </tr>`;
        });

        res.send(`
        <html>
        <head>
        <meta charset="UTF-8">
        <style>
        body{font-family:Arial;padding:30px;background:#f5f5f5;}
        table{border-collapse:collapse;width:100%;background:white;margin-bottom:25px;}
        th,td{border:1px solid #ddd;padding:10px;}
        form{background:white;padding:20px;margin-bottom:20px;}
        input,select,button{padding:8px;}
        </style>
        </head>

        <body>

        <h1>Zonas y Mesas</h1>

        <form method="POST" action="/admin-zonas/crear">
        <h3>Nueva zona</h3>
        <input name="nombre" required>
        <button>Crear</button>
        </form>

        <form method="POST" action="/admin-mesas/crear">
        <h3>Nueva mesa</h3>
        <input name="numero" required>
        <select name="zona_id">
        ${opciones}
        </select>
        <button>Crear</button>
        </form>

        <h2>Zonas</h2>

        <table>
        <tr><th>Nombre</th></tr>
        ${htmlZonas}
        </table>

        <h2>Mesas</h2>

        <table>
        <tr>
        <th>Mesa</th>
        <th>Zona</th>
        <th>Estado</th>
        </tr>

        ${htmlMesas}

        </table>

        </body>
        </html>
        `);

      });

    });

  });

  router.post('/admin-zonas/crear', requiereRol(['admin']), (req,res)=>{
      db.run(
        "INSERT INTO zonas(nombre,activo) VALUES(?,1)",
        [req.body.nombre],
        ()=>res.redirect('/admin-zonas-mesas')
      );
  });

  router.post('/admin-mesas/crear', requiereRol(['admin']), (req,res)=>{
      db.run(
        "INSERT INTO mesas(numero,estado,zona_id) VALUES(?,'libre',?)",
        [req.body.numero,req.body.zona_id],
        ()=>res.redirect('/admin-zonas-mesas')
      );
  });

  return router;
}

module.exports = zonasRoutes;
