-- V2.1.1 - Configuración de impresoras
ALTER TABLE configurazione ADD COLUMN stampante_ticket TEXT;
ALTER TABLE configurazione ADD COLUMN modo_impresion TEXT DEFAULT 'ventana';
