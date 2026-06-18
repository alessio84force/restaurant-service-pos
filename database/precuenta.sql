.headers on
.mode column

SELECT 
  'RESTAURANT SERVICE POS' AS negocio;

SELECT 
  'Mesa ' || mesas.numero AS mesa,
  pedidos.id AS pedido,
  pedidos.estado,
  pedidos.total || ' €' AS total
FROM pedidos
JOIN mesas ON pedidos.mesa_id = mesas.id
WHERE pedidos.id = 1;

SELECT 
  productos.nombre AS producto,
  pedido_lineas.cantidad,
  pedido_lineas.precio || ' €' AS precio,
  (pedido_lineas.cantidad * pedido_lineas.precio) || ' €' AS subtotal,
  pedido_lineas.nota AS nota
FROM pedido_lineas
JOIN productos ON pedido_lineas.producto_id = productos.id
WHERE pedido_lineas.pedido_id = 1;
