#!/bin/bash

MESA=$1

if [ -z "$MESA" ]; then
  echo "Uso: ./comandos/cerrar_mesa.sh NUMERO_MESA"
  exit 1
fi

PEDIDO_ID=$(sqlite3 database/restaurant_service.db "SELECT pedidos.id FROM pedidos JOIN mesas ON pedidos.mesa_id = mesas.id WHERE mesas.numero=$MESA AND pedidos.estado='abierto' ORDER BY pedidos.id DESC LIMIT 1;")

if [ -z "$PEDIDO_ID" ]; then
  echo "No hay pedido abierto para la Mesa $MESA"
  exit 1
fi

sqlite3 database/restaurant_service.db "UPDATE pedidos SET estado='cerrado' WHERE id=$PEDIDO_ID;"

sqlite3 database/restaurant_service.db "UPDATE mesas SET estado='libre' WHERE numero=$MESA;"

echo "Mesa $MESA cerrada correctamente."
echo "Pedido $PEDIDO_ID archivado."
