.headers on
.mode column

SELECT
  '*** COCINA ***' AS destino;

SELECT
  productos.nombre AS producto,
  pedido_lineas.cantidad,
  pedido_lineas.nota
FROM pedido_lineas
JOIN productos ON pedido_lineas.producto_id = productos.id
WHERE pedido_lineas.pedido_id = 1
AND productos.categoria_id IN (1,2,3,4);
