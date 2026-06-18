#!/bin/bash

MESA=$1

if [ -z "$MESA" ]; then
  echo "Uso: ./comandos/ver_pedido.sh NUMERO_MESA"
  exit 1
fi

PEDIDO_ID=$(sqlite3 database/restaurant_service.db "SELECT pedidos.id FROM pedidos JOIN mesas ON pedidos.mesa_id = mesas.id WHERE mesas.numero=$MESA AND pedidos.estado='abierto' ORDER BY pedidos.id DESC LIMIT 1;")

if [ -z "$PEDIDO_ID" ]; then
  echo "No hay pedido abierto para la Mesa $MESA"
  exit 1
fi

echo "=============================="
echo " RESTAURANT SERVICE POS"
echo " Mesa $MESA - Pedido $PEDIDO_ID"
echo "=============================="

sqlite3 database/restaurant_service.db "
SELECT 
  productos.nombre || ' x' || pedido_lineas.cantidad || ' - ' || 
  (pedido_lineas.cantidad * pedido_lineas.precio) || ' €'
FROM pedido_lineas
JOIN productos ON pedido_lineas.producto_id = productos.id
WHERE pedido_lineas.pedido_id=$PEDIDO_ID;
"

TOTAL=$(sqlite3 database/restaurant_service.db "SELECT total FROM pedidos WHERE id=$PEDIDO_ID;")

echo "------------------------------"
echo "TOTAL: $TOTAL €"
echo "=============================="
