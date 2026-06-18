INSERT INTO mesas (numero, estado) VALUES
(1, 'libre'),
(2, 'ocupada'),
(3, 'libre'),
(4, 'reservada'),
(5, 'ocupada'),
(6, 'libre');

INSERT INTO categorias (nombre) VALUES
('Entrantes'),
('Primeros'),
('Segundos'),
('Postres'),
('Bebidas'),
('Cafés');

INSERT INTO productos (nombre, precio, categoria_id) VALUES
('Croquetas caseras', 8.50, 1),
('Ensaladilla rusa', 7.00, 1),
('Paella valenciana', 14.50, 2),
('Lasaña de carne', 12.00, 2),
('Entrecot a la parrilla', 19.90, 3),
('Lubina al horno', 18.50, 3),
('Tarta de queso', 6.00, 4),
('Flan casero', 4.50, 4),
('Coca-Cola', 2.50, 5),
('Cerveza', 3.00, 5),
('Café solo', 1.40, 6);
