/*
  Warnings:

  - You are about to drop the column `clienteId` on the `entregas` table. All the data in the column will be lost.
  - You are about to drop the column `clienteId` on the `negocio` table. All the data in the column will be lost.
  - You are about to drop the column `clienteId` on the `notacredito` table. All the data in the column will be lost.
  - You are about to drop the column `clienteId` on the `venta` table. All the data in the column will be lost.
  - You are about to drop the `cliente` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `entregas` DROP FOREIGN KEY `Entregas_clienteId_fkey`;

-- DropForeignKey
ALTER TABLE `negocio` DROP FOREIGN KEY `Negocio_clienteId_fkey`;

-- DropForeignKey
ALTER TABLE `notacredito` DROP FOREIGN KEY `NotaCredito_clienteId_fkey`;

-- DropForeignKey
ALTER TABLE `venta` DROP FOREIGN KEY `Venta_clienteId_fkey`;

-- DropIndex
DROP INDEX `Entregas_clienteId_fkey` ON `entregas`;

-- DropIndex
DROP INDEX `Negocio_clienteId_fkey` ON `negocio`;

-- DropIndex
DROP INDEX `NotaCredito_clienteId_fkey` ON `notacredito`;

-- DropIndex
DROP INDEX `Venta_clienteId_fkey` ON `venta`;

-- AlterTable
ALTER TABLE `entregas` DROP COLUMN `clienteId`;

-- AlterTable
ALTER TABLE `negocio` DROP COLUMN `clienteId`;

-- AlterTable
ALTER TABLE `notacredito` DROP COLUMN `clienteId`;

-- AlterTable
ALTER TABLE `venta` DROP COLUMN `clienteId`;

-- DropTable
DROP TABLE `cliente`;
