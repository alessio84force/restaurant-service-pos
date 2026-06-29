const express = require("express");
const fs = require("fs");
const path = require("path");

function barRoutes(db) {

  const router = express.Router();

  router.post("/bar/enviar/:mesa", (req, res) => {

    const mesa = req.params.mesa;

    const sql = `
      SELECT 
        pl.id,
        (pl.cantidad - COALESCE(pl.cantidad_enviada_bar, 0)) AS cantidad,
        p.nombre
      FROM pedido_lineas pl
      JOIN pedidos pe ON pe.id = pl.pedido_id
      JOIN mesas m ON m.id = pe.mesa_id
      JOIN productos p ON p.id = pl.producto_id
      JOIN categorias c ON c.id = p.categoria_id
      WHERE m.numero = ?
        AND pe.estado != 'cerrado'
        AND c.destino = 'bar'
        AND (pl.cantidad - COALESCE(pl.cantidad_enviada_bar, 0)) > 0
      ORDER BY pl.id
    `;

    db.all(sql, [mesa], (err, lineas) => {

      if (err) return res.status(500).json(err);

      if (lineas.length === 0) {
        return res.json({
          ok: true,
          mensaje: "Nada para enviar",
          mesa,
          lineas: []
        });
      }

      let texto = "";

      texto += "************************\n";
      texto += "BAR\n";
      texto += "Mesa " + mesa + "\n";
      texto += new Date().toLocaleString() + "\n";
      texto += "************************\n\n";

      lineas.forEach(l => {
        texto += l.cantidad + " x " + l.nombre + "\n";
      });

      texto += "\n************************\n";

      const carpetaPrint = path.join(__dirname, "..", "..", "prints");

      if (!fs.existsSync(carpetaPrint)) {
        fs.mkdirSync(carpetaPrint, { recursive: true });
      }

      const rutaPrint = path.join(carpetaPrint, "comanda_bar.txt");

      fs.writeFileSync(rutaPrint, texto);

      const ids = lineas.map(l => l.id);

      db.run(
        `UPDATE pedido_lineas 
         SET cantidad_enviada_bar = cantidad,
             enviada_bar = 1
         WHERE id IN (${ids.map(() => "?").join(",")})`,
        ids,
        function(err) {

          if (err) return res.status(500).json(err);

          res.json({
            ok: true,
            mensaje: "Comanda bar generada",
            archivo: "prints/comanda_bar.txt",
            mesa,
            lineas
          });

        }
      );

    });

  });

  return router;

}

module.exports = barRoutes;
