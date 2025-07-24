-- AlterTable
ALTER TABLE `venta` ADD COLUMN `usuarioId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Venta` ADD CONSTRAINT `Venta_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
