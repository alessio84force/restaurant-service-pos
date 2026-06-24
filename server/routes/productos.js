const express = require('express');

function productosRoutes(db) {
  const router = express.Router();

  router.get('/productos', (req, res) => {
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

  return router;
}

module.exports = productosRoutes;
