const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProducts = async () => {
    try {
        const products = await prisma.producto.findMany({
            include: {
                tipoUnidad: true,
            }
        });
        const totalProducts = await prisma.producto.count();

        return {
            products,
            total: totalProducts,
        };
    } catch (error) {
        console.error("Error consultando productos:", error);
        throw new Error("Error al obtener los productos");
    }
}

const getProducts = async (limit, page) => {
    try {
        const offset = (page - 1) * limit;
        const products = await prisma.producto.findMany({
            skip: offset,
            take: limit,
            include: {
                tipoUnidad: {
                    select: {
                        tipo: true, // 👈 solo el campo tipo
                    },
                },
            },
        });
        const totalProducts = await prisma.producto.count();
        return {
            products,
            total: totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page
        };
    } catch (error) {
        console.error("Error consultando productos:", error);
        throw new Error("Error al obtener los productos");
    }
};

const getProductById = async (id) => {
    try {
        return await prisma.producto.findUnique({ where: { id: parseInt(id) } });
    } catch (error) {
        console.error("Error consultando productos:", error);
        throw new Error("Error al obtener el producto");
    }
};
const addProduct = async (data) => {
    try {
        return await prisma.producto.create({ data });
    } catch (error) {
        console.error("Error consultando productos:", error);
        throw new Error("Error al obtener el producto");
    }
};
const updateProduct = async (id, data) => {
    try {
        return await prisma.producto.update({ where: { id: parseInt(id) }, data });
    } catch (error) {
        console.error("Error consultando productos:", error);
        throw new Error("Error al obtener el producto");
    }
};
const updateProductStatus = async (id, estado) => {
    try {
        return await prisma.producto.update({ where: { id: parseInt(id) }, data: { estado } });
    } catch (error) {
        console.error("Error consultando productos:", error);
        throw new Error("Error al obtener el producto");
    }
};
const updatePrecio = async (id, data) => {
    try {
        const precioAntiguo = parseInt(data.precioAntiguo, 10);
        const precioNuevo = parseInt(data.precioNuevo, 10);

        return await prisma.precioLog.create({
            data: {
                precioAntiguo, precioNuevo, articuloId: parseInt(id, 10)
            }
        });
    } catch (error) {
        console.error("Error consultando productos:", error);
        throw new Error("Error al obtener el producto");
    }
};

module.exports = { getAllProducts, getProducts, getProductById, addProduct, updateProduct, updateProductStatus, updatePrecio };
