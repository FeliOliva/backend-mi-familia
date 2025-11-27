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
        detalleventa: {
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
        metodopago: {
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

// entregaModel.js (o donde tengas la lógica de ventas)
const actualizarVentaPorEntrega = async (ventaId, montoEntrega) => {
  const venta = await prisma.venta.findUnique({
    where: { id: Number(ventaId) },
  });

  if (!venta) {
    throw new Error("Venta no encontrada");
  }

  const totalPagadoAnterior = venta.totalPagado || 0;
  const totalPagadoNuevo = totalPagadoAnterior + Number(montoEntrega || 0);

  const total = Number(venta.total || 0);
  const restoPendiente = Math.max(0, total - totalPagadoNuevo);

  let nuevoEstado;

  if (restoPendiente <= 0) {
    // Se pagó todo
    nuevoEstado = 2; // COBRADA
  } else {
    // Se pagó algo, pero queda pendiente
    nuevoEstado = 5; // PAGO PARCIAL
  }

  const ventaActualizada = await prisma.venta.update({
    where: { id: Number(ventaId) },
    data: {
      totalPagado: totalPagadoNuevo,
      estadoPago: nuevoEstado,
      restoPendiente, // si lo tenés en el modelo
    },
  });

  // esto lo usás en el controller para el socket
  return {
    venta: ventaActualizada,
    estadoSocket: "venta-actualizada",
  };
};

const marcarVentaParaPagoOtroDia = async (ventaId) => {
  try {
    return await prisma.venta.update({
      where: { id: ventaId },
      data: { estadoPago: 3 },
      include: {
        detalleventa: true,
      },
    });
  } catch (error) {
    console.error("Error marcando venta para otro día:", error);
    throw new Error("Error al marcar la venta para pago en otro día");
  }
};
const getEntregasPorVenta = async (ventaId) => {
  return await prisma.entregas.findMany({
    where: { ventaId },
    orderBy: { fechaCreacion: "asc" },
    include: {
      metodopago: { select: { nombre: true } },
    },
  });
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

  // 1) Último cierre DEFINITIVO (estado = 1) por caja en el día
  const cierresPorCaja = await prisma.cierrecaja.groupBy({
    by: ["cajaId"],
    where: {
      fecha: {
        gte: inicioDelDia,
        lte: finDelDia,
      },
      estado: 1, // solo cierres definitivos (los del admin)
    },
    _max: {
      fecha: true,
    },
  });

  const ultimoCierrePorCaja = {};
  cierresPorCaja.forEach((c) => {
    ultimoCierrePorCaja[c.cajaId] = c._max.fecha;
  });

  // 2) Todas las entregas del día (sin filtrar por caja todavía)
  const entregasHoy = await prisma.entregas.findMany({
    where: {
      fechaCreacion: {
        gte: inicioDelDia,
        lte: finDelDia,
      },
    },
    select: {
      cajaId: true,
      metodoPagoId: true,
      monto: true,
      fechaCreacion: true,
    },
  });

  // 3) Nombres de métodos de pago
  const metodos = await prisma.metodopago.findMany({
    select: { id: true, nombre: true },
  });

  const cajasMap = {};

  // 4) Armar totales de ENTREGAS, excluyendo las anteriores al último cierre definitivo
  for (const e of entregasHoy) {
    const cajaId = e.cajaId;
    const fechaEntrega = e.fechaCreacion;
    const fechaUltimoCierre = ultimoCierrePorCaja[cajaId];

    // Si ya hubo un cierre definitivo y esta entrega es anterior o igual a ese cierre, no la contamos
    if (fechaUltimoCierre && fechaEntrega <= fechaUltimoCierre) {
      continue;
    }

    const metodo = metodos.find((m) => m.id === e.metodoPagoId);
    const nombreMetodo = metodo?.nombre?.toLowerCase() || "";
    const monto = e.monto || 0;

    if (!cajasMap[cajaId]) {
      cajasMap[cajaId] = {
        cajaId,
        totalEfectivo: 0,
        totalOtros: 0,
        totalEntregado: 0,
        totalCuentaCorriente: 0,
        metodospago: [],
      };
    }

    cajasMap[cajaId].totalEntregado += monto;

    if (nombreMetodo === "efectivo") {
      cajasMap[cajaId].totalEfectivo += monto;
    } else {
      cajasMap[cajaId].totalOtros += monto;
    }

    // podés agrupar por método si querés, pero para simplificar dejemos un registro por groupBy original
    cajasMap[cajaId].metodospago.push({
      metodoPagoId: e.metodoPagoId,
      nombre: metodo?.nombre || `Método ${e.metodoPagoId}`,
      total: monto,
    });
  }

  // 5) Ventas con deuda (Cuenta Corriente / pago parcial / pago otro día)
  const ventasConDeuda = await prisma.venta.findMany({
    where: {
      fechaCreacion: {
        gte: inicioDelDia,
        lte: finDelDia,
      },
      // estados que siguen teniendo algo pendiente:
      // 4 = Cuenta Corriente, 5 = Pago parcial, 3 = Pago otro día
      estadoPago: { in: [3, 4, 5] },
    },
    select: {
      cajaId: true,
      total: true,
      totalPagado: true,
      fechaCreacion: true,
    },
  });

  for (const v of ventasConDeuda) {
    const cajaId = v.cajaId;
    const fechaVenta = v.fechaCreacion;
    const fechaUltimoCierre = ultimoCierrePorCaja[cajaId];

    // Si la venta es anterior o igual al último cierre definitivo, no entra en el saldo actual
    if (fechaUltimoCierre && fechaVenta <= fechaUltimoCierre) {
      continue;
    }

    const pendiente = Number(v.total || 0) - Number(v.totalPagado || 0);
    if (pendiente <= 0) continue;

    if (!cajasMap[cajaId]) {
      cajasMap[cajaId] = {
        cajaId,
        totalEfectivo: 0,
        totalOtros: 0,
        totalEntregado: 0,
        totalCuentaCorriente: 0,
        metodospago: [],
      };
    }

    cajasMap[cajaId].totalCuentaCorriente += pendiente;
  }

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
  getEntregasPorVenta,
};
