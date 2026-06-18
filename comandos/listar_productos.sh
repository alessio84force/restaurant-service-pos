#!/bin/bash

echo "=============================="
echo " RESTAURANT SERVICE POS"
echo " MENU DE PRODUCTOS"
echo "=============================="

sqlite3 database/restaurant_service.db "
SELECT
  productos.id || ' | ' ||
  productos.nombre || ' | ' ||
  printf('%.2f €', productos.precio)
FROM productos
ORDER BY productos.id;
"

echo "=============================="
