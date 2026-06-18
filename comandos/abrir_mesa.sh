#!/bin/bash

MESA=$1

if [ -z "$MESA" ]; then
  echo "Uso: ./comandos/abrir_mesa.sh NUMERO_MESA"
  exit 1
fi

sqlite3 database/restaurant_service.db "UPDATE mesas SET estado='ocupada' WHERE numero=$MESA;"

sqlite3 database/restaurant_service.db "INSERT INTO pedidos (mesa_id, estado, total) SELECT id, 'abierto', 0 FROM mesas WHERE numero=$MESA;"

echo "Mesa $MESA abierta correctamente."
