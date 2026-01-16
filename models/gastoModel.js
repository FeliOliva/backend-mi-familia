const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Función auxiliar para obtener inicio del día en UTC
const getInicioDelDiaUTC = () => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = ahora.getMonth();
  const dia = ahora.getDate();
  return new Date(año, mes, dia, 0, 0, 0, 0);
};

// Función auxiliar para obtener fin del día en UTC
const getFinDelDiaUTC = () => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = ahora.getMonth();
  const dia = ahora.getDate();
  return new Date(año, mes, dia, 23, 59, 59, 999);
};

const getGastos = async (limit, page, usuarioId) => {
  try {
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    const offset = (page - 1) * limit;
    const where = { estado: 1 };
    if (usuarioId) {
      where.usuarioId = parseInt(usuarioId);
    }
    const gastos = await prisma.gasto.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { fechaCreacion: "desc" },
      include: {
        usuario: {
          select: {
            id: true,
            usuario: true,
          },
        },
      },
    });
    const totalGastos = await prisma.gasto.count({ where });

    return {
      gastos,
      total: totalGastos,
      totalPages: Math.ceil(totalGastos / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error al obtener todos los gastos", error);
    throw new Error("Error al obtener los gastos");
  }
};

const getGastoById = async (id) => {
  try {
    return await prisma.gasto.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: {
          select: {
            id: true,
            usuario: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener el gasto", error);
    throw new Error("Error al obtener el gasto");
  }
};

const addGasto = async (data) => {
  try {
    return await prisma.gasto.create({
      data,
    });
  } catch (error) {
    console.error("Error al agregar el gasto", error);
    throw new Error("Error al agregar el gasto");
  }
};

const updateGasto = async (id, motivo, monto) => {
  try {
    return await prisma.gasto.update({
      where: { id: parseInt(id) },
      data: { motivo, monto },
    });
  } catch (error) {
    console.error("Error al actualizar el gasto", error);
    throw new Error("Error al actualizar el gasto");
  }
};

const dropGasto = async (id) => {
  try {
    return await prisma.gasto.update({
      where: { id: parseInt(id) },
      data: { estado: 0 },
    });
  } catch (error) {
    console.error("Error al eliminar el gasto", error);
    throw new Error("Error al eliminar el gasto");
  }
};

const getTotalesGastosDelDiaPorCaja = async () => {
  const inicioDelDia = getInicioDelDiaUTC();
  const finDelDia = getFinDelDiaUTC();

  // 1) Último cierre definitivo por caja en el día
  const cierresPorCaja = await prisma.cierrecaja.groupBy({
    by: ["cajaId"],
    where: {
      fecha: {
        gte: inicioDelDia,
        lte: finDelDia,
      },
      estado: 1,
    },
    _max: {
      fecha: true,
    },
  });

  const ultimoCierrePorCaja = {};
  cierresPorCaja.forEach((c) => {
    ultimoCierrePorCaja[c.cajaId] = c._max.fecha;
  });

  // 2) Gastos del día
  const gastosHoy = await prisma.gasto.findMany({
    where: {
      fechaCreacion: {
        gte: inicioDelDia,
        lte: finDelDia,
      },
      estado: 1,
    },
    select: {
      cajaId: true,
      monto: true,
      fechaCreacion: true,
    },
  });

  const cajasMap = {};

  for (const g of gastosHoy) {
    const cajaId = g.cajaId;
    const fechaGasto = g.fechaCreacion;
    const fechaUltimoCierre = ultimoCierrePorCaja[cajaId];

    if (fechaUltimoCierre && fechaGasto <= fechaUltimoCierre) {
      continue;
    }

    if (!cajasMap[cajaId]) {
      cajasMap[cajaId] = { cajaId, totalGastos: 0 };
    }

    cajasMap[cajaId].totalGastos += g.monto || 0;
  }

  return Object.values(cajasMap);
};

const getGastosDelDia = async ({ usuarioId, cajaId }) => {
  const inicioDelDia = getInicioDelDiaUTC();
  const finDelDia = getFinDelDiaUTC();

  const where = {
    estado: 1,
    fechaCreacion: {
      gte: inicioDelDia,
      lte: finDelDia,
    },
  };

  if (usuarioId) {
    where.usuarioId = parseInt(usuarioId);
  }
  if (cajaId) {
    where.cajaId = parseInt(cajaId);
  }

  return await prisma.gasto.findMany({
    where,
    orderBy: { fechaCreacion: "desc" },
    include: {
      usuario: {
        select: { id: true, usuario: true },
      },
      caja: {
        select: { id: true, nombre: true },
      },
    },
  });
};

module.exports = {
  getGastos,
  getGastoById,
  addGasto,
  updateGasto,
  dropGasto,
  getTotalesGastosDelDiaPorCaja,
  getGastosDelDia,
};
