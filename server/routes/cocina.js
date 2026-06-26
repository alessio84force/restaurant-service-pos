const express = require("express");
const fs = require("fs");
const path = require("path");

function cocinaRoutes(db) {

  const router = express.Router();

  router.post("/cocina/enviar/:mesa", (req, res) => {

    const mesa = req.params.mesa;

    const sql = `
      SELECT
        pl.id,
        pl.cantidad,
        p.nombre
      FROM pedido_lineas pl
      JOIN pedidos pe ON pe.id = pl.pedido_id
      JOIN mesas m ON m.id = pe.mesa_id
      JOIN productos p ON p.id = pl.producto_id
      JOIN categorias c ON c.id = p.categoria_id
      WHERE
        m.numero = ?
        AND pe.estado != 'cerrado'
        AND c.destino = 'cocina'
        AND pl.enviada_cocina = 0
    `;

    db.all(sql, [mesa], (err, lineas) => {

      if (err) return res.status(500).json(err);

      if (lineas.length === 0) {
        return res.json({
          ok: true,
          mensaje: "Nada para enviar"
        });
      }

      let ticket = "";

      ticket += "************************\n";
      ticket += "*****   COCINA   *******\n";
      ticket += "************************\n\n";
      ticket += "Mesa: " + mesa + "\n";
      ticket += new Date().toLocaleString() + "\n\n";

      lineas.forEach(l => {
        ticket += l.cantidad + " x " + l.nombre + "\n";
      });

      ticket += "\n************************\n";

      fs.writeFileSync(
        path.join(__dirname, "..", "..", "prints", "comanda_cocina.txt"),
        ticket
      );

      const ids = lineas.map(x => x.id);

      db.run(
        `UPDATE pedido_lineas
         SET enviada_cocina = 1
         WHERE id IN (${ids.map(() => "?").join(",")})`,
        ids,
        () => {
          res.json({
            ok: true,
            mesa,
            lineas
          });
        }
      );

    });

  });

  return router;

}

module.exports = cocinaRoutes;
