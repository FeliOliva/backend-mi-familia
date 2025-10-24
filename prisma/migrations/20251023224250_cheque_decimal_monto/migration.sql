/*
  Warnings:

  - You are about to alter the column `cantidad` on the `detalleventa` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(6,2)`.

*/
-- AlterTable
ALTER TABLE `detalleventa` MODIFY `cantidad` DECIMAL(6, 2) NULL;
