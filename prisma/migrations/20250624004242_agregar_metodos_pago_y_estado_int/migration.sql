/*
  Warnings:

  - You are about to alter the column `estado` on the `cierrecaja` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `cierrecaja` MODIFY `estado` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `CierreCajaMetodoPago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cierreCajaId` INTEGER NOT NULL,
    `metodoPago` VARCHAR(191) NOT NULL,
    `total` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CierreCajaMetodoPago` ADD CONSTRAINT `CierreCajaMetodoPago_cierreCajaId_fkey` FOREIGN KEY (`cierreCajaId`) REFERENCES `CierreCaja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
