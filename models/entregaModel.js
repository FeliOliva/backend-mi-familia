const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllEntregas = async (limit, page) => {
  try {
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    const offset = (page - 1) * limit;
    const entregas = await prisma.entregas.findMany({
      skip: offset,
      take: limit,
      include: {
        negocio: {
          select: {
            nombre: true,
          },
        },
        metodoPago: {
          select: {
            nombre: true,
          },
        },
      },
    });
    const totalEntregas = await prisma.entregas.count();

    return {
      entregas,
      total: totalEntregas,
      totalPages: Math.ceil(totalEntregas / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error obteniendo todas las entregas:", error);
    throw new Error("Error al obtener las entregas");
  }
};

const updateVenta = async (id, data) => {
  try {
    return await prisma.venta.update({
      where: { id: parseInt(id) },
      data,
    });
  } catch (error) {
    console.error("Error actualizando venta:", error);
    throw new Error("Error al actualizar la venta");
  }
};

const getEntregaById = async (id) => {
  try {
    return await prisma.entregas.findUnique({
      where: { id: parseInt(id) },
      include: {
        negocio: {
          select: {
            nombre: true,
          },
        },
        metodoPago: {
          select: {
            nombre: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo entrega por id:", error);
    throw new Error("Error al obtener la entrega por id");
  }
};
const getVentaById = async (id) => {
  try {
    return await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: {
        detalles: {
          include: {
            producto: { select: { nombre: true } }, // Incluye nombre del producto
          },
        },
        negocio: {
          select: { nombre: true },
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo venta por id:", error);
    throw new Error("Error al obtener la venta por id");
  }
};

const getEntregasByNegocio = async (
  negocioId,
  limit,
  page,
  startDate,
  endDate,
  cajaId
) => {
  try {
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;
    const offset = (page - 1) * limit;

    // Convertir fechas a UTC correctamente
    const filterStartDate = startDate ? new Date(startDate) : null;
    const filterEndDate = endDate ? new Date(endDate) : null;

    if (filterEndDate) {
      filterEndDate.setUTCHours(23, 59, 59, 999); // Asegurar que se incluye todo el día en UTC
    }

    const whereClause = {
      negocioId: parseInt(negocioId),
      estado: 1,
      ...(filterStartDate && {
        fechaCreacion: { gte: filterStartDate.toISOString() },
      }),
      ...(filterEndDate && {
        fechaCreacion: { lte: filterEndDate.toISOString() },
      }),
      ...(cajaId && { cajaId: parseInt(cajaId) }),
    };

    const entregas = await prisma.entregas.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      include: {
        negocio: { select: { nombre: true } },
        metodoPago: { select: { nombre: true } },
      },
    });

    const totalEntregas = await prisma.entregas.count({ where: whereClause });

    return {
      entregas,
      total: totalEntregas,
      totalPages: Math.ceil(totalEntregas / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error obteniendo entregas por negocio:", error);
    throw new Error("Error al obtener las entregas del negocio");
  }
};

const addEntrega = async (data) => {
  try {
    // Generar número de entrega automáticamente
    const ultimaEntrega = await prisma.entregas.findFirst({
      orderBy: { id: "desc" },
    });

    const nroEntrega = `E${String(
      ultimaEntrega ? ultimaEntrega.id + 1 : 1
    ).padStart(5, "0")}`;

    // Crear nueva entrega con los datos proporcionados y el número generado
    return await prisma.entregas.create({
      data: {
        ...data,
        nroEntrega,
        fechaCreacion: new Date(),
      },
      include: {
        negocio: {
          select: {
            nombre: true,
          },
        },
        metodoPago: {
          select: {
            nombre: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error agregando entrega:", error);
    throw new Error("Error al agregar la entrega");
  }
};

const actualizarVentaPorEntrega = async (ventaId, monto) => {
  try {
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: {
        negocio: {
          select: { nombre: true },
        },
        caja: {
          select: { nombre: true },
        },
        detalles: {
          include: {
            producto: {
              select: { nombre: true }, // importante incluir nombre
            },
          },
        },
      },
    });

    if (!venta) {
      throw new Error("No se encontró la venta asociada");
    }

    const nuevoTotalPagado = venta.totalPagado + monto;
    const nuevoRestoPendiente = venta.total - nuevoTotalPagado;

    let nuevoEstadoPago;
    let estadoSocket;

    if (nuevoRestoPendiente <= 0) {
      nuevoEstadoPago = 2;
      estadoSocket = "venta-pagada";
    } else {
      nuevoEstadoPago = 5;
      estadoSocket = "venta-pagada-parcialmente";
    }

    // Actualizar solo los campos necesarios
    await prisma.venta.update({
      where: { id: ventaId },
      data: {
        totalPagado: nuevoTotalPagado,
        restoPendiente: nuevoRestoPendiente > 0 ? nuevoRestoPendiente : 0,
        estadoPago: nuevoEstadoPago,
      },
    });

    // Volver a consultar con los includes deseados
    const ventaActualizada = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: {
        negocio: { select: { nombre: true } },
        caja: { select: { nombre: true } },
        detalles: {
          include: {
            producto: { select: { nombre: true } },
          },
        },
      },
    });

    return { venta: ventaActualizada, estadoSocket };
  } catch (error) {
    console.error("Error actualizando venta:", error);
    throw new Error("Error al actualizar la venta");
  }
};

const marcarVentaParaPagoOtroDia = async (ventaId) => {
  try {
    return await prisma.venta.update({
      where: { id: ventaId },
      data: { estadoPago: 3 },
      include: {
        detalles: true,
      },
    });
  } catch (error) {
    console.error("Error marcando venta para otro día:", error);
    throw new Error("Error al marcar la venta para pago en otro día");
  }
};

const updateEntrega = async (id, monto) => {
  try {
    return await prisma.entregas.update({
      where: { id: parseInt(id) },
      data: { monto },
    });
  } catch (error) {
    console.error("Error actualizando entrega:", error);
    throw new Error("Error al actualizar la entrega");
  }
};

const dropEntrega = async (id) => {
  try {
    return await prisma.entregas.delete({
      where: { id: parseInt(id) },
    });
  } catch (error) {
    console.error("Error eliminando entrega:", error);
    throw new Error("Error al eliminar la entrega");
  }
};

const getUltimaEntregaDelDia = async () => {
  try {
    const hoy = new Date();
    const inicioDelDia = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );
    const finDelDia = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
      23,
      59,
      59,
      999
    );

    const ultimaEntrega = await prisma.entregas.findFirst({
      where: {
        fechaCreacion: {
          gte: inicioDelDia,
          lte: finDelDia,
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return ultimaEntrega;
  } catch (error) {
    console.error("Error al obtener la última entrega del día:", error);
    throw error;
  }
};

const getTotalesEntregasDelDiaPorCaja = async () => {
  const hoy = new Date();
  const inicioDelDia = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate()
  );
  const finDelDia = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    23,
    59,
    59,
    999
  );

  // 1. Cajas cerradas hoy
  const cierresHoy = await prisma.cierreCaja.findMany({
    where: {
      fecha: {
        gte: inicioDelDia,
        lte: finDelDia,
      },
    },
    select: { cajaId: true },
  });
  const cajasCerradas = cierresHoy.map((c) => c.cajaId);

  // 2. Traer entregas agrupadas por cajaId y metodoPagoId
  const agrupadas = await prisma.entregas.groupBy({
    by: ["cajaId", "metodoPagoId"],
    where: {
      fechaCreacion: {
        gte: inicioDelDia,
        lte: finDelDia,
      },
      ...(cajasCerradas.length > 0 && { cajaId: { notIn: cajasCerradas } }),
    },
    _sum: {
      monto: true,
    },
  });

  // 3. Traer los nombres de métodos de pago
  const metodos = await prisma.metodoPago.findMany({
    select: { id: true, nombre: true },
  });

  // 4. Mapear y agrupar por cajaId
  const cajasMap = {};

  agrupadas.forEach((registro) => {
    const { cajaId, metodoPagoId, _sum } = registro;
    const metodo = metodos.find((m) => m.id === metodoPagoId);
    const monto = _sum.monto || 0;
    const nombreMetodo = metodo?.nombre?.toLowerCase() || "";

    if (!cajasMap[cajaId]) {
      cajasMap[cajaId] = {
        cajaId,
        totalEfectivo: 0,
        totalOtros: 0,
        totalEntregado: 0,
        metodosPago: [],
      };
    }

    cajasMap[cajaId].totalEntregado += monto;

    if (nombreMetodo === "efectivo") {
      cajasMap[cajaId].totalEfectivo += monto;
    } else {
      cajasMap[cajaId].totalOtros += monto;
    }

    cajasMap[cajaId].metodosPago.push({
      metodoPagoId,
      nombre: metodo?.nombre || `Método ${metodoPagoId}`,
      total: monto,
    });
  });

  return Object.values(cajasMap);
};

module.exports = {
  getAllEntregas,
  getEntregaById,
  getEntregasByNegocio,
  addEntrega,
  updateEntrega,
  dropEntrega,
  getVentaById,
  updateVenta,
  getUltimaEntregaDelDia,
  actualizarVentaPorEntrega,
  marcarVentaParaPagoOtroDia,
  getTotalesEntregasDelDiaPorCaja,
};
