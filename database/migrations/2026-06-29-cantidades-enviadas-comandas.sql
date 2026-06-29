-- V2.0.5 - Cantidades enviadas en comandas
-- Permite enviar solo las unidades nuevas añadidas después de una primera comanda.

ALTER TABLE pedido_lineas ADD COLUMN cantidad_enviada_bar INTEGER DEFAULT 0;
ALTER TABLE pedido_lineas ADD COLUMN cantidad_enviada_cocina INTEGER DEFAULT 0;
