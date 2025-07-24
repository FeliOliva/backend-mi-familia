-- AlterTable
ALTER TABLE `cierrecaja` ADD COLUMN `cajaId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `CierreCaja` ADD CONSTRAINT `CierreCaja_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `Caja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
