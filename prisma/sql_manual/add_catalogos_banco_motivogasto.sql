-- Migración manual ADITIVA: catálogos de bancos y de motivos de gasto.
--
-- Objetivo: dejar de cargar banco y motivo como texto libre, que generaba
-- variantes (GASOIL / GASOLI / GASIOL, CORDOBA / BANCOR...) y rompía las
-- estadísticas.
--
-- Las sentencias de esquema salen de `prisma migrate diff` (coinciden con
-- schema.prisma). El resto de ese diff NO se aplica: borraría tablas legacy.
--
-- Compatibilidad: NO se borran cheque.banco ni gasto.motivo. Se completan con
-- el nombre del catálogo, porque estadísticas, cierre de caja y PDFs leen esos
-- textos; así siguen funcionando y además quedan agrupados correctamente.
--
-- Requiere que ya esté aplicada add_cheque_entregaId.sql.

-- 1) Esquema -------------------------------------------------------------------

CREATE TABLE `banco` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Banco_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `motivogasto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `MotivoGasto_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `cheque` ADD COLUMN `bancoId` INTEGER NULL,
    ADD COLUMN `esElectronico` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `gasto` ADD COLUMN `detalle` VARCHAR(191) NULL,
    ADD COLUMN `motivoGastoId` INTEGER NULL;

CREATE INDEX `Cheque_bancoId_fkey` ON `cheque`(`bancoId`);

CREATE INDEX `Gasto_motivoGastoId_fkey` ON `gasto`(`motivoGastoId`);

ALTER TABLE `cheque` ADD CONSTRAINT `Cheque_bancoId_fkey` FOREIGN KEY (`bancoId`) REFERENCES `banco`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `gasto` ADD CONSTRAINT `Gasto_motivoGastoId_fkey` FOREIGN KEY (`motivoGastoId`) REFERENCES `motivogasto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) Carga inicial de los catálogos --------------------------------------------

INSERT INTO `banco` (`nombre`) VALUES
  ('MACRO'), ('GALICIA'), ('PATAGONIA'), ('BANCOR'), ('CREDICOOP'),
  ('NACION'), ('ICBC'), ('SANTANDER'), ('SUPERVIELLE'), ('BBVA');

INSERT INTO `motivogasto` (`nombre`) VALUES
  ('COMBUSTIBLE'), ('DESCARGA'), ('CADETE'), ('MERCADO'), ('GOMERIA'),
  ('COMPRA MERCADERIA'), ('RETIRO'), ('VIAJE'), ('OTRO');

-- 3) Bancos: normalizar los cheques existentes ---------------------------------
--
-- Equivalencias: CORDOBA = BANCOR (Banco de Córdoba), SANTANDER RIO = SANTANDER,
-- BBVA FRANCES = BBVA. "ECHEQ." no es un banco sino un cheque electrónico: se
-- marca esElectronico y el banco queda vacío para completarlo al editar.
-- Un banco que no esté en la lista queda con bancoId NULL y su texto original.

CREATE TEMPORARY TABLE `map_banco` (
  `original` VARCHAR(191) NOT NULL PRIMARY KEY,
  `nombre`   VARCHAR(191) NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `map_banco` (`original`, `nombre`) VALUES
  ('MACRO', 'MACRO'), ('GALICIA', 'GALICIA'), ('PATAGONIA', 'PATAGONIA'),
  ('BANCOR', 'BANCOR'), ('CORDOBA', 'BANCOR'), ('CREDICOOP', 'CREDICOOP'),
  ('NACION', 'NACION'), ('ICBC', 'ICBC'), ('SANTANDER', 'SANTANDER'),
  ('SANTANDER RIO', 'SANTANDER'), ('SUPERVIELLE', 'SUPERVIELLE'),
  ('BBVA', 'BBVA'), ('BBVA FRANCES', 'BBVA');

UPDATE `cheque` c
JOIN `map_banco` m ON m.original = UPPER(TRIM(c.banco))
JOIN `banco` b ON b.nombre = m.nombre
SET c.bancoId = b.id, c.banco = b.nombre
WHERE c.bancoId IS NULL;

UPDATE `cheque`
SET esElectronico = true
WHERE UPPER(TRIM(banco)) IN ('ECHEQ', 'ECHEQ.', 'E-CHEQ', 'E CHEQ');

DROP TEMPORARY TABLE `map_banco`;

-- 4) Gastos: normalizar los motivos existentes ---------------------------------
--
-- COMBUSTIBLE = GASOIL, GASOLI, GASIOL, GASOLINA. Cuando el texto original
-- tenía un dato específico (DESCARGA PAPA, RETIRO LUCAS) se guarda en detalle.
-- Todo lo que no esté en la lista va a OTRO con el texto original como
-- detalle, así no se pierde nada y se puede reclasificar después.

CREATE TEMPORARY TABLE `map_motivo` (
  `original` VARCHAR(191) NOT NULL PRIMARY KEY,
  `nombre`   VARCHAR(191) NOT NULL,
  `detalle`  VARCHAR(191) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `map_motivo` (`original`, `nombre`, `detalle`) VALUES
  ('GASOIL', 'COMBUSTIBLE', NULL),
  ('GAS OIL', 'COMBUSTIBLE', NULL),
  ('GASOLI', 'COMBUSTIBLE', NULL),
  ('GASIOL', 'COMBUSTIBLE', NULL),
  ('GASOLINA', 'COMBUSTIBLE', NULL),
  ('NAFTA', 'COMBUSTIBLE', NULL),
  ('DESCARGA', 'DESCARGA', NULL),
  ('DESCARGA PAPA', 'DESCARGA', 'PAPA'),
  ('DESCARGA POPO', 'DESCARGA', 'POPO'),
  ('CADETE', 'CADETE', NULL),
  ('CADETERIA', 'CADETE', NULL),
  ('MERCADO', 'MERCADO', NULL),
  ('GOMERIA', 'GOMERIA', NULL),
  ('LECHUGAS', 'COMPRA MERCADERIA', 'LECHUGAS'),
  ('ACELGAS', 'COMPRA MERCADERIA', 'ACELGAS'),
  ('LUCAS', 'RETIRO', 'LUCAS'),
  ('RETIRO LUCAS', 'RETIRO', 'LUCAS');

UPDATE `gasto` g
JOIN `map_motivo` m ON m.original = UPPER(TRIM(g.motivo))
JOIN `motivogasto` mg ON mg.nombre = m.nombre
SET g.motivoGastoId = mg.id,
    g.detalle = COALESCE(g.detalle, m.detalle),
    g.motivo = mg.nombre
WHERE g.motivoGastoId IS NULL;

-- Viajes: "VIAJE DE ... " -> VIAJE, el resto del texto como detalle.
UPDATE `gasto` g
JOIN `motivogasto` mg ON mg.nombre = 'VIAJE'
SET g.motivoGastoId = mg.id,
    g.detalle = COALESCE(g.detalle, TRIM(SUBSTRING(TRIM(g.motivo), 6))),
    g.motivo = mg.nombre
WHERE g.motivoGastoId IS NULL
  AND UPPER(TRIM(g.motivo)) LIKE 'VIAJE %';

-- Todo lo demás -> OTRO, conservando el texto original en detalle.
UPDATE `gasto` g
JOIN `motivogasto` mg ON mg.nombre = 'OTRO'
SET g.motivoGastoId = mg.id,
    g.detalle = COALESCE(g.detalle, TRIM(g.motivo)),
    g.motivo = mg.nombre
WHERE g.motivoGastoId IS NULL;

DROP TEMPORARY TABLE `map_motivo`;

-- Verificación (opcional):
-- SELECT motivo, detalle, COUNT(*) FROM gasto GROUP BY motivo, detalle ORDER BY motivo;
-- SELECT banco, bancoId, esElectronico, COUNT(*) FROM cheque GROUP BY banco, bancoId, esElectronico;
