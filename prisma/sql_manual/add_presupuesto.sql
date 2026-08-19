-- Migración manual ADITIVA: crea solo las tablas de Presupuestos.
-- No toca ninguna tabla existente (cheque, venta, etc.).
-- Generado a partir de prisma migrate diff (coincide con schema.prisma).

-- CreateTable
CREATE TABLE IF NOT EXISTS `presupuesto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nroPresupuesto` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,
    `total` INTEGER NOT NULL DEFAULT 0,
    `observacion` VARCHAR(191) NULL,
    `negocioId` INTEGER NULL,
    `ventaId` INTEGER NULL,

    UNIQUE INDEX `presupuesto_nroPresupuesto_key`(`nroPresupuesto`),
    INDEX `Presupuesto_negocioId_fkey`(`negocioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `detallepresupuesto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `precio` INTEGER NOT NULL,
    `cantidad` DECIMAL(6, 2) NOT NULL,
    `subTotal` INTEGER NOT NULL,
    `presupuestoId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `tipoUnidadId` INTEGER NULL,

    INDEX `DetallePresupuesto_presupuestoId_fkey`(`presupuestoId`),
    INDEX `DetallePresupuesto_productoId_fkey`(`productoId`),
    INDEX `DetallePresupuesto_tipoUnidadId_fkey`(`tipoUnidadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `presupuesto` ADD CONSTRAINT `Presupuesto_negocioId_fkey` FOREIGN KEY (`negocioId`) REFERENCES `negocio`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detallepresupuesto` ADD CONSTRAINT `DetallePresupuesto_presupuestoId_fkey` FOREIGN KEY (`presupuestoId`) REFERENCES `presupuesto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detallepresupuesto` ADD CONSTRAINT `DetallePresupuesto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detallepresupuesto` ADD CONSTRAINT `DetallePresupuesto_tipoUnidadId_fkey` FOREIGN KEY (`tipoUnidadId`) REFERENCES `tipounidad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
