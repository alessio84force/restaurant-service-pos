-- V2.0.6C - Datos del restaurante en ticket
-- Añade mensaje personalizado al ticket/precuenta.

ALTER TABLE configurazione ADD COLUMN mensaje_ticket TEXT DEFAULT 'Gracias por su visita';
