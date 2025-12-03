const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllCheques = async (limit, page) => {
  try {
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    const offset = (page - 1) * limit;
    const cheques = await prisma.cheque.findMany({
      skip: offset,
      take: limit,
      include: {
        negocio: {
          select: {
            nombre: true,
          },
        },
      },
    });
    const totalCheques = await prisma.cheque.count();
    return {
      cheques,
      total: totalCheques,
      totalPages: Math.ceil(totalCheques / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error obteniendo todos los cheques:", error);
    throw new Error("Error al obtener los cheques");
  }
};
const getChequeById = async (id) => {
  try {
    return await prisma.cheque.findUnique({
      where: { id: parseInt(id) },
      include: {
        negocio: {
          select: {
            nombre: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo el cheque por id:", error);
    throw new Error("Error al obtener el cheque por id");
  }
};
const getChequesByNegocio = async (negocioId, limit, page) => {
  try {
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    const offset = (page - 1) * limit;
    const cheques = await prisma.cheque.findMany({
      where: { negocioId: parseInt(negocioId) },
      skip: offset,
      take: limit,
      include: {
        negocio: {
          select: {
            nombre: true,
          },
        },
      },
    });
    const totalCheques = await prisma.cheque.count({
      where: { negocioId: parseInt(negocioId) },
    });
    return {
      cheques,
      total: totalCheques,
      totalPages: Math.ceil(totalCheques / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error obteniendo los cheques por negocio:", error);
    throw new Error("Error al obtener los cheques por negocio");
  }
};
const addCheque = async (cheque) => {
  try {
    return await prisma.cheque.create({ data: cheque });
  } catch (error) {
    console.error("Error añadiendo el cheque:", error);
    // Re-lanzamos el error original para poder chequear error.code en el controller
    throw error;
  }
};

const updateCheque = async (id, cheque) => {
  try {
    return await prisma.cheque.update({
      where: { id: parseInt(id) },
      data: cheque,
    });
  } catch (error) {
    console.error("Error actualizando el cheque:", error);
    throw new Error("Error al actualizar el cheque");
  }
};
const updateChequeStatus = async (id, estado) => {
  try {
    return await prisma.cheque.update({
      where: { id: parseInt(id) },
      data: { estado },
    });
  } catch (error) {
    console.error("Error actualizando el estado del cheque:", error);
    throw new Error("Error al actualizar el estado del cheque");
  }
};
module.exports = {
  getAllCheques,
  getChequeById,
  getChequesByNegocio,
  addCheque,
  updateCheque,
  updateChequeStatus,
};
