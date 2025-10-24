const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllProducts = async () => {
  try {
    const products = await prisma.producto.findMany({
      include: {
        tipounidad: { select: { tipo: true } },
      },
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
};
// models/productModel.js
const getProducts = async ({ limit, page, q, estado }) => {
  try {
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        q ? { nombre: { contains: q } } : {}, // ← sin "mode"
        estado === "activos"
          ? { estado: 1 }
          : estado === "inactivos"
          ? { estado: 0 }
          : {},
      ],
    };

    const [productsRaw, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ nombre: "asc" }],
        include: {
          tipounidad: { select: { id: true, tipo: true } },
        },
      }),
      prisma.producto.count({ where }),
    ]);

    const products = productsRaw.map((p) => ({
      ...p,
      tipoUnidad: p.tipounidad,
    }));

    return {
      products,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
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
    return await prisma.producto.update({
      where: { id: parseInt(id) },
      data: { estado },
    });
  } catch (error) {
    console.error("Error consultando productos:", error);
    throw new Error("Error al obtener el producto");
  }
};
const updatePrecio = async (id, data) => {
  try {
    const precioAntiguo = parseInt(data.precioAntiguo, 10);
    const precioNuevo = parseInt(data.precioNuevo, 10);

    return await prisma.preciolog.create({
      data: {
        precioAntiguo,
        precioNuevo,
        articuloId: parseInt(id, 10),
      },
    });
  } catch (error) {
    console.error("Error consultando productos:", error);
    throw new Error("Error al obtener el producto");
  }
};

module.exports = {
  getAllProducts,
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  updateProductStatus,
  updatePrecio,
};
