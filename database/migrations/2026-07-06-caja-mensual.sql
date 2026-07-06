-- V2.1.2 - Caja diaria y mensual
ALTER TABLE cierres_caja ADD COLUMN tipo TEXT DEFAULT 'diario';
ALTER TABLE cierres_caja ADD COLUMN periodo TEXT;
ALTER TABLE cierres_caja ADD COLUMN efectivo REAL DEFAULT 0;
ALTER TABLE cierres_caja ADD COLUMN tarjeta REAL DEFAULT 0;
ALTER TABLE cierres_caja ADD COLUMN otros REAL DEFAULT 0;
ALTER TABLE cierres_caja ADD COLUMN total_pagos REAL DEFAULT 0;
