const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPrecioLogs = async (articuloId, limit, page) => {
    try {
        console.log("limit", limit);
        console.log("page", page);
        console.log("articuloId", articuloId);
        const offset = (page - 1) * limit;
        const precioLogs = await prisma.preciolog.findMany({
            where: {
                articuloId: articuloId
            },
            skip: offset,
            take: limit
        });
        const totalPrecioLogs = await prisma.preciolog.count({
            where: {
                articuloId: articuloId
            }
        });
        return {
            precioLogs,
            total: totalPrecioLogs,
            totalPages: Math.ceil(totalPrecioLogs / limit),
            currentPage: page
        };
    } catch (error) {
        console.error("Error consultando precios de venta:", error);
        throw new Error("Error al obtener los precios de venta");
    }
}

module.exports = { getPrecioLogs };