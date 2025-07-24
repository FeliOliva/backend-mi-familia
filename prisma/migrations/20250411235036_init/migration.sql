-- CreateTable
CREATE TABLE `Cheque` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `banco` VARCHAR(191) NOT NULL,
    `nroCheque` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaEmision` DATETIME(3) NOT NULL,
    `fechaCobro` DATETIME(3) NOT NULL,
    `monto` INTEGER NOT NULL,
    `estado` INTEGER NOT NULL DEFAULT 1,
    `negocioId` INTEGER NULL,

    UNIQUE INDEX `Cheque_nroCheque_key`(`nroCheque`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Negocio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,
    `clienteId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Caja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoUnidad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MetodoPago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `editable` INTEGER NOT NULL DEFAULT 1,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `rol` INTEGER NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,
    `cajaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `precio` INTEGER NOT NULL,
    `precioInicial` INTEGER NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,
    `tipoUnidadId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrecioLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `precioAntiguo` INTEGER NOT NULL,
    `fechaAntigua` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `precioNuevo` INTEGER NOT NULL,
    `fechaNueva` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,
    `articuloId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Venta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nroVenta` VARCHAR(191) NOT NULL,
    `total` INTEGER NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clienteId` INTEGER NULL,
    `negocioId` INTEGER NOT NULL,
    `cajaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetalleVenta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `precio` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `subTotal` INTEGER NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` INTEGER NOT NULL DEFAULT 1,
    `ventaId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Entregas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nroEntrega` VARCHAR(191) NOT NULL,
    `monto` INTEGER NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clienteId` INTEGER NOT NULL,
    `negocioId` INTEGER NOT NULL,
    `metodoPagoId` INTEGER NULL,
    `cajaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotaCredito` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `motivo` VARCHAR(191) NOT NULL,
    `monto` INTEGER NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clienteId` INTEGER NOT NULL,
    `negocioId` INTEGER NOT NULL,
    `cajaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Cheque` ADD CONSTRAINT `Cheque_negocioId_fkey` FOREIGN KEY (`negocioId`) REFERENCES `Negocio`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Negocio` ADD CONSTRAINT `Negocio_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `Caja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_tipoUnidadId_fkey` FOREIGN KEY (`tipoUnidadId`) REFERENCES `TipoUnidad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrecioLog` ADD CONSTRAINT `PrecioLog_articuloId_fkey` FOREIGN KEY (`articuloId`) REFERENCES `Producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venta` ADD CONSTRAINT `Venta_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venta` ADD CONSTRAINT `Venta_negocioId_fkey` FOREIGN KEY (`negocioId`) REFERENCES `Negocio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venta` ADD CONSTRAINT `Venta_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `Caja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleVenta` ADD CONSTRAINT `DetalleVenta_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `Venta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleVenta` ADD CONSTRAINT `DetalleVenta_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entregas` ADD CONSTRAINT `Entregas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entregas` ADD CONSTRAINT `Entregas_negocioId_fkey` FOREIGN KEY (`negocioId`) REFERENCES `Negocio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entregas` ADD CONSTRAINT `Entregas_metodoPagoId_fkey` FOREIGN KEY (`metodoPagoId`) REFERENCES `MetodoPago`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entregas` ADD CONSTRAINT `Entregas_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `Caja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotaCredito` ADD CONSTRAINT `NotaCredito_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `Caja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotaCredito` ADD CONSTRAINT `NotaCredito_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotaCredito` ADD CONSTRAINT `NotaCredito_negocioId_fkey` FOREIGN KEY (`negocioId`) REFERENCES `Negocio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
