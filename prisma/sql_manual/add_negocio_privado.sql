-- Migración manual ADITIVA: agrega el flag de negocio privado.
-- Columna con DEFAULT, así que las filas existentes quedan en false (no privado).

ALTER TABLE `negocio` ADD COLUMN `esPrivado` BOOLEAN NOT NULL DEFAULT false;
