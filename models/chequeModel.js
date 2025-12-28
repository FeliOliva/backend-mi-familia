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

// Verificar si un cheque tiene una entrega asociada que está en un cierre de caja
const verificarChequeEnCierreCaja = async (chequeId) => {
  try {
    const cheque = await prisma.cheque.findUnique({
      where: { id: parseInt(chequeId) },
      select: {
        id: true,
        negocioId: true,
        monto: true,
        fechaCreacion: true,
      },
    });

    console.log("Cheque encontrado:", cheque);

    if (!cheque || !cheque.negocioId) {
      console.log("Cheque no encontrado o sin negocioId");
      return { tieneEntrega: false, enCierre: false };
    }

    // Buscar el método de pago CHEQUE
    const metodoCheque = await prisma.metodopago.findFirst({
      where: {
        nombre: "CHEQUE",
      },
      select: { id: true },
    });

    console.log("Método de pago CHEQUE:", metodoCheque);

    if (!metodoCheque) {
      console.log("No se encontró el método de pago CHEQUE");
      return { tieneEntrega: false, enCierre: false };
    }

    // Buscar entregas que coincidan con el cheque:
    // - Mismo negocioId
    // - Mismo monto
    // - Método de pago CHEQUE
    // - Creada dentro de 2 horas después de la creación del cheque (ampliar el rango)
    const fechaInicio = new Date(cheque.fechaCreacion.getTime() - 60 * 60 * 1000); // 1 hora antes también
    const fechaFin = new Date(cheque.fechaCreacion.getTime() + 2 * 60 * 60 * 1000); // 2 horas después

    console.log("Buscando entregas entre:", fechaInicio, "y", fechaFin);

    const entregas = await prisma.entregas.findMany({
      where: {
        negocioId: cheque.negocioId,
        monto: cheque.monto,
        metodoPagoId: metodoCheque.id,
        fechaCreacion: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      select: {
        id: true,
        cajaId: true,
        fechaCreacion: true,
      },
    });

    console.log("Entregas encontradas:", entregas);

    if (!entregas || entregas.length === 0) {
      console.log("No se encontraron entregas asociadas al cheque");
      return { tieneEntrega: false, enCierre: false };
    }

    // Verificar para cada entrega si está en un cierre de caja definitivo
    for (const entrega of entregas) {
      if (!entrega.cajaId) {
        console.log("Entrega sin cajaId:", entrega.id);
        continue;
      }

      console.log("Verificando entrega:", entrega.id, "caja:", entrega.cajaId);

      // Verificar si hay un cierre de caja definitivo (estado = 1) después de la fecha de la entrega
      const cierresDespues = await prisma.cierrecaja.findFirst({
        where: {
          cajaId: entrega.cajaId,
          estado: 1, // Cierre definitivo
          fecha: {
            gte: entrega.fechaCreacion,
          },
        },
        select: {
          id: true,
          fecha: true,
        },
      });

      console.log("Cierres después de la entrega:", cierresDespues);

      if (cierresDespues) {
        console.log("Entrega está en un cierre de caja!");
        return {
          tieneEntrega: true,
          enCierre: true,
          entregaId: entrega.id,
          cierreId: cierresDespues.id,
        };
      }
    }

    console.log("Entrega encontrada pero no está en cierre");
    return {
      tieneEntrega: true,
      enCierre: false,
      entregaId: entregas[0].id,
      cierreId: null,
    };
  } catch (error) {
    console.error("Error verificando cheque en cierre de caja:", error);
    throw new Error("Error al verificar si el cheque está en un cierre de caja");
  }
};

module.exports = {
  getAllCheques,
  getChequeById,
  getChequesByNegocio,
  addCheque,
  updateCheque,
  updateChequeStatus,
  verificarChequeEnCierreCaja,
};
