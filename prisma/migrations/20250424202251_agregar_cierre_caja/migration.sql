-- AlterTable
ALTER TABLE `entregas` ADD COLUMN `ventaId` INTEGER NULL;

-- AlterTable
ALTER TABLE `negocio` ADD COLUMN `esCuentaCorriente` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `venta` ADD COLUMN `estadoPago` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `restoPendiente` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `totalPagado` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `CierreCaja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` INTEGER NOT NULL,
    `totalVentas` INTEGER NOT NULL DEFAULT 0,
    `totalPagado` INTEGER NOT NULL DEFAULT 0,
    `totalCuentaCorriente` INTEGER NOT NULL DEFAULT 0,
    `totalDiferido` INTEGER NOT NULL DEFAULT 0,
    `ingresoLimpio` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Entregas` ADD CONSTRAINT `Entregas_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `Venta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CierreCaja` ADD CONSTRAINT `CierreCaja_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
