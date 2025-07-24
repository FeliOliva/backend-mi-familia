-- DropForeignKey
ALTER TABLE `cierrecaja` DROP FOREIGN KEY `CierreCaja_usuarioId_fkey`;

-- DropIndex
DROP INDEX `CierreCaja_usuarioId_fkey` ON `cierrecaja`;

-- AlterTable
ALTER TABLE `cierrecaja` MODIFY `usuarioId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `CierreCaja` ADD CONSTRAINT `CierreCaja_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
