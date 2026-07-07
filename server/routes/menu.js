const express = require("express");

function asegurarColumnaCoccion(db, callback) {
  db.all("PRAGMA table_info(productos)", [], (err, columnas) => {
    if (err) return callback(err);

    const existe = (columnas || []).some((c) => c.name === "requiere_coccion");

    if (existe) return callback();

    db.run(
      "ALTER TABLE productos ADD COLUMN requiere_coccion INTEGER DEFAULT 0",
      [],
      (errAlter) => {
        if (errAlter && !String(errAlter.message || "").includes("duplicate column")) {
          return callback(errAlter);
        }

        callback();
      }
    );
  });
}

function menuRoutes(db) {
  const router = express.Router();

  router.get("/menu", (req, res) => {
    asegurarColumnaCoccion(db, (errColumna) => {
      if (errColumna) {
        console.error("Error preparando columna requiere_coccion:", errColumna.message);
        return res.status(500).json({ error: "Error preparando menú" });
      }

      const sql = `
        SELECT
          categorias.id AS categoria_id,
          categorias.nombre AS categoria,
          categorias.destino AS destino,
          productos.id AS producto_id,
          productos.nombre AS producto,
          productos.precio AS precio,
          COALESCE(productos.requiere_coccion, 0) AS requiere_coccion
        FROM productos
        LEFT JOIN categorias ON categorias.id = productos.categoria_id
        WHERE COALESCE(productos.disponible, 1) = 1
        ORDER BY categorias.nombre COLLATE NOCASE, productos.nombre COLLATE NOCASE
      `;

      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error("Error cargando menú:", err.message);
          return res.status(500).json({ error: "Error cargando menú" });
        }

        res.json(rows || []);
      });
    });
  });

  return router;
}

module.exports = menuRoutes;
