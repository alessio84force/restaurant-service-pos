#!/bin/bash

MESA=$1
PRODUCTO=$2
CANTIDAD=$3

if [ -z "$MESA" ] || [ -z "$PRODUCTO" ] || [ -z "$CANTIDAD" ]; then
  echo "Uso: ./comandos/anadir_producto.sh NUMERO_MESA ID_PRODUCTO CANTIDAD"
  exit 1
fi

PEDIDO_ID=$(sqlite3 database/restaurant_service.db "SELECT pedidos.id FROM pedidos JOIN mesas ON pedidos.mesa_id = mesas.id WHERE mesas.numero=$MESA AND pedidos.estado='abierto' ORDER BY pedidos.id DESC LIMIT 1;")

if [ -z "$PEDIDO_ID" ]; then
  echo "No hay pedido abierto para la Mesa $MESA"
  exit 1
fi

PRECIO=$(sqlite3 database/restaurant_service.db "SELECT precio FROM productos WHERE id=$PRODUCTO;")

if [ -z "$PRECIO" ]; then
  echo "Producto no encontrado"
  exit 1
fi

sqlite3 database/restaurant_service.db "INSERT INTO pedido_lineas (pedido_id, producto_id, cantidad, precio, nota) VALUES ($PEDIDO_ID, $PRODUCTO, $CANTIDAD, $PRECIO, '');"

sqlite3 database/restaurant_service.db "UPDATE pedidos SET total = (SELECT SUM(cantidad * precio) FROM pedido_lineas WHERE pedido_id=$PEDIDO_ID) WHERE id=$PEDIDO_ID;"

echo "Producto $PRODUCTO añadido a Mesa $MESA correctamente."
