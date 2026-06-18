#!/bin/bash

echo "=============================="
echo " RESTAURANT SERVICE POS"
echo " PEDIDOS ABIERTOS"
echo "=============================="

sqlite3 database/restaurant_service.db "
SELECT
  'Pedido ' || pedidos.id ||
  ' | Mesa ' || mesas.numero ||
  ' | Estado: ' || pedidos.estado ||
  ' | Total: ' || printf('%.2f €', pedidos.total)
FROM pedidos
JOIN mesas ON pedidos.mesa_id = mesas.id
WHERE pedidos.estado='abierto'
ORDER BY pedidos.id;
"

echo "=============================="
