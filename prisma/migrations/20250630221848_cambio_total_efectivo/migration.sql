/*
  Warnings:

  - You are about to drop the column `totalDiferido` on the `cierrecaja` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `cierrecaja` DROP COLUMN `totalDiferido`,
    ADD COLUMN `totalEfectivo` INTEGER NOT NULL DEFAULT 0;
