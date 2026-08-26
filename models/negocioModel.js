const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Los negocios privados solo son visibles para el admin (esAdmin === true)
const filtroPrivado = (esAdmin) => (esAdmin ? {} : { esPrivado: false });

const getNegocios = async (limit, page, esAdmin = false) => {
  try {
    const offset = (page - 1) * limit;
    const where = filtroPrivado(esAdmin);
    const negocios = await prisma.negocio.findMany({
      where,
      skip: offset,
      take: limit,
    });
    const totalNegocios = await prisma.negocio.count({ where });
    return {
      negocios,
      total: totalNegocios,
      totalPages: Math.ceil(totalNegocios / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error consultando negocios:", error);
    throw new Error("Error al obtener los negocios");
  }
};
const getAllNegocios = async (esAdmin = false) => {
  try {
    const where = filtroPrivado(esAdmin);
    const negocios = await prisma.negocio.findMany({ where });
    const totalNegocios = await prisma.negocio.count({ where });
    return {
      negocios,
      total: totalNegocios,
    };
  } catch (error) {
    console.error("Error consultando negocios:", error);
    throw new Error("Error al obtener los negocios");
  }
};
const getNegociosConVentasPorCaja = async (cajaId, esAdmin = false) => {
  try {
    const cajaIdNum = parseInt(cajaId);
    if (Number.isNaN(cajaIdNum)) {
      throw new Error("cajaId inválido");
    }

    const whereClause = {
      ...filtroPrivado(esAdmin),
      venta: {
        some: {
          cajaId: cajaIdNum,
          // Solo ventas con deuda/pedientes (no cobradas)
          estadoPago: { in: [1, 3, 4, 5] },
        },
      },
    };

    const [negocios, totalNegocios] = await Promise.all([
      prisma.negocio.findMany({ where: whereClause }),
      prisma.negocio.count({ where: whereClause }),
    ]);

    return {
      negocios,
      total: totalNegocios,
    };
  } catch (error) {
    console.error("Error consultando negocios por caja:", error);
    throw new Error("Error al obtener los negocios por caja");
  }
};
const getNegocioById = async (id) => {
  try {
    return await prisma.negocio.findUnique({ where: { id: parseInt(id) } });
  } catch (error) {
    console.error("Error consultando negocios:", error);
    throw new Error("Error al obtener el negocio");
  }
};
const addNegocio = async (data) => {
  try {
    return await prisma.negocio.create({ data });
  } catch (error) {
    console.error("Error agregado el negocio:", error);
    throw error;
  }
};

const updateNegocio = async (id, data) => {
  try {
    return await prisma.negocio.update({ where: { id: parseInt(id) }, data });
  } catch (error) {
    console.error("Error eliminando el negocio:", error);
    throw error;
  }
};

const updateNegocioStatus = async (id, estado) => {
  try {
    return await prisma.negocio.update({
      where: { id: parseInt(id) },
      data: { estado },
    });
  } catch (error) {
    console.error("Error actualizando el estado del negocio: ", error);
    throw error;
  }
};
module.exports = {
  getAllNegocios,
  getNegocios,
  addNegocio,
  updateNegocio,
  updateNegocioStatus,
  getNegocioById,
  getNegociosConVentasPorCaja,
};
