#!/bin/bash

echo "=============================="
echo " RESTAURANT SERVICE POS"
echo " ESTADO DE MESAS"
echo "=============================="

sqlite3 database/restaurant_service.db "
SELECT
  'Mesa ' || numero || ' -> ' || estado
FROM mesas
ORDER BY numero;
"

echo "=============================="
