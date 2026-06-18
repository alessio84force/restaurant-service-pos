#!/bin/bash

echo "=============================="
echo " RESTAURANT SERVICE POS"
echo " PRODUCTOS POR CATEGORIA"
echo "=============================="

sqlite3 database/restaurant_service.db "
SELECT
  categorias.nombre || ' -> ' ||
  productos.id || ' | ' ||
  productos.nombre || ' | ' ||
  printf('%.2f €', productos.precio)
FROM productos
JOIN categorias ON productos.categoria_id = categorias.id
ORDER BY categorias.id, productos.id;
"

echo "=============================="
