-- V2.0.9 - Permite ocultar mesas sin eliminarlas
ALTER TABLE mesas ADD COLUMN activo INTEGER DEFAULT 1;
