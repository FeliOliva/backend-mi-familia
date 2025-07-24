const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getNegocios = async (limit, page) => {
  try {
    const offset = (page - 1) * limit;
    const negocios = await prisma.negocio.findMany({
      skip: offset,
      take: limit,
    });
    const totalNegocios = await prisma.negocio.count();
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
const getAllNegocios = async () => {
  try {
    const negocios = await prisma.negocio.findMany();
    const totalNegocios = await prisma.negocio.count();
    return {
      negocios,
      total: totalNegocios,
    };
  } catch (error) {
    console.error("Error consultando negocios:", error);
    throw new Error("Error al obtener los negocios");
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
};
