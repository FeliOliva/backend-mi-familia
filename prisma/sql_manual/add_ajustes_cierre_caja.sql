-- Migración manual ADITIVA.
-- Registra pagos omitidos después de un cierre sin modificar ni reabrir el cierre original.

CREATE TABLE `ajustecierrecaja` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `cierreCajaId` INTEGER NOT NULL,
  `cajaId` INTEGER NULL,
  `negocioId` INTEGER NOT NULL,
  `ventaId` INTEGER NULL,
  `usuarioId` INTEGER NOT NULL,
  `monto` INTEGER NOT NULL,
  `metodoPago` VARCHAR(191) NOT NULL DEFAULT 'EFECTIVO',
  `fechaOperacion` DATETIME(3) NOT NULL,
  `motivo` VARCHAR(500) NOT NULL,
  `fechaRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AjusteCierreCaja_cierreCajaId_idx` (`cierreCajaId`),
  INDEX `AjusteCierreCaja_cajaId_idx` (`cajaId`),
  INDEX `AjusteCierreCaja_negocioId_idx` (`negocioId`),
  INDEX `AjusteCierreCaja_ventaId_idx` (`ventaId`),
  CONSTRAINT `AjusteCierreCaja_cierreCajaId_fkey`
    FOREIGN KEY (`cierreCajaId`) REFERENCES `cierrecaja` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `AjusteCierreCaja_cajaId_fkey`
    FOREIGN KEY (`cajaId`) REFERENCES `caja` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `AjusteCierreCaja_negocioId_fkey`
    FOREIGN KEY (`negocioId`) REFERENCES `negocio` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `AjusteCierreCaja_ventaId_fkey`
    FOREIGN KEY (`ventaId`) REFERENCES `venta` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `AjusteCierreCaja_usuarioId_fkey`
    FOREIGN KEY (`usuarioId`) REFERENCES `usuario` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
