const express = require("express");
const fs = require("fs");
const path = require("path");

function limpiarTextoTicket(texto) {

  return String(texto || "")
    .replace(/\s+/g, " ")
    .trim();

}

function lineaSeparadora() {

  return "================================\n";

}

function lineaCorta() {

  return "--------------------------------\n";

}

function formatearComandaCocina(mesa, lineas) {

  const ahora = new Date().toLocaleString("es-ES");

  const pedido = lineas.length > 0 ? lineas[0].pedido : "";

  let texto = "";

  texto += lineaSeparadora();
  texto += "       RESTAURANT SERVICE\n";
  texto += lineaSeparadora();
  texto += "COMANDA COCINA\n";
  texto += "MESA: " + mesa + "\n";
  texto += "PEDIDO: " + pedido + "\n";
  texto += "HORA: " + ahora + "\n";
  texto += lineaCorta();

  lineas.forEach(l => {

    texto += l.cantidad + " x " + limpiarTextoTicket(l.nombre).toUpperCase() + "\n";

    if (l.nota) {
      texto += "  NOTA: " + limpiarTextoTicket(l.nota).toUpperCase() + "\n";
    }

  });

  texto += lineaCorta();
  texto += "TOTAL LINEAS: " + lineas.length + "\n";
  texto += lineaSeparadora();
  texto += "\n\n";

  return texto;

}

function cocinaRoutes(db) {

  const router = express.Router();

  router.post("/cocina/enviar/:mesa", (req, res) => {

    const mesa = req.params.mesa;

    const sql = `
      SELECT
        pl.id,
        pe.id AS pedido,
        (pl.cantidad - COALESCE(pl.cantidad_enviada_cocina, 0)) AS cantidad,
        p.nombre,
        pl.nota
      FROM pedido_lineas pl
      JOIN pedidos pe ON pe.id = pl.pedido_id
      JOIN mesas m ON m.id = pe.mesa_id
      JOIN productos p ON p.id = pl.producto_id
      JOIN categorias c ON c.id = p.categoria_id
      WHERE m.numero = ?
        AND pe.estado != 'cerrado'
        AND c.destino = 'cocina'
        AND (pl.cantidad - COALESCE(pl.cantidad_enviada_cocina, 0)) > 0
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

      const ticket = formatearComandaCocina(mesa, lineas);

      const carpetaPrint = path.join(__dirname, "..", "..", "prints");

      if (!fs.existsSync(carpetaPrint)) {
        fs.mkdirSync(carpetaPrint, { recursive: true });
      }

      const rutaPrint = path.join(carpetaPrint, "comanda_cocina.txt");

      fs.writeFileSync(rutaPrint, ticket);

      const ids = lineas.map(l => l.id);

      db.run(
        `UPDATE pedido_lineas
         SET cantidad_enviada_cocina = cantidad,
             enviada_cocina = 1
         WHERE id IN (${ids.map(() => "?").join(",")})`,
        ids,
        function(err) {

          if (err) return res.status(500).json(err);

          res.json({
            ok: true,
            mensaje: "Comanda cocina generada",
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
