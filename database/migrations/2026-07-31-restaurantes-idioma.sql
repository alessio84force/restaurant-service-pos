-- V2.9.0
-- Lingua principale del ristorante SaaS.
-- I clienti esistenti restano in spagnolo.

ALTER TABLE restaurantes
ADD COLUMN idioma TEXT NOT NULL DEFAULT 'es';
