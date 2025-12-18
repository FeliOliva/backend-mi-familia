const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getSaldosIniciales = async () => {
  try {
    return await prisma.saldoinicial.findMany({
      where: { estado: 1 },
      include: {
        negocio: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { fechaCreacion: "desc" },
    });
  } catch (error) {
    console.error("Error al obtener saldos iniciales:", error);
    throw new Error("Error al obtener los saldos iniciales");
  }
};

const getSaldoInicialByNegocio = async (negocioId) => {
  try {
    return await prisma.saldoinicial.findUnique({
      where: { negocioId: parseInt(negocioId) },
      include: {
        negocio: {
          select: { id: true, nombre: true },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener saldo inicial por negocio:", error);
    throw new Error("Error al obtener el saldo inicial");
  }
};

const createSaldoInicial = async (data) => {
  try {
    return await prisma.saldoinicial.create({
      data: {
        monto: data.monto,
        descripcion: data.descripcion || null,
        negocioId: data.negocioId,
      },
      include: {
        negocio: {
          select: { id: true, nombre: true },
        },
      },
    });
  } catch (error) {
    console.error("Error al crear saldo inicial:", error);
    throw new Error("Error al crear el saldo inicial");
  }
};

const updateSaldoInicial = async (id, data) => {
  try {
    return await prisma.saldoinicial.update({
      where: { id: parseInt(id) },
      data: {
        monto: data.monto,
        descripcion: data.descripcion,
      },
      include: {
        negocio: {
          select: { id: true, nombre: true },
        },
      },
    });
  } catch (error) {
    console.error("Error al actualizar saldo inicial:", error);
    throw new Error("Error al actualizar el saldo inicial");
  }
};

const deleteSaldoInicial = async (id) => {
  try {
    return await prisma.saldoinicial.delete({
      where: { id: parseInt(id) },
    });
  } catch (error) {
    console.error("Error al eliminar saldo inicial:", error);
    throw new Error("Error al eliminar el saldo inicial");
  }
};

module.exports = {
  getSaldosIniciales,
  getSaldoInicialByNegocio,
  createSaldoInicial,
  updateSaldoInicial,
  deleteSaldoInicial,
};


