const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getResumenCuentaByNegocio = async (
  negocioId,
  startDate,
  endDate
) => {
  const [ventas, entregas, notasCredito] = await Promise.all([
    prisma.venta.findMany({
      where: {
        negocioId,
        fechaCreacion: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        nroVenta: true,
        fechaCreacion: true,
        total: true,
        cajaId: true,
        detalles: {
          // Incluye los detalles de la venta
          select: {
            id: true,
            cantidad: true,
            precio: true,
            subTotal: true,
            producto: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    }),

    prisma.entregas.findMany({
      where: {
        negocioId,
        fechaCreacion: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        monto: true,
        metodoPagoId: true,
        nroEntrega: true,
        metodoPago: {
          select: { nombre: true },
        },
        fechaCreacion: true,
      },
    }),

    prisma.notaCredito.findMany({
      where: {
        negocioId,
        fechaCreacion: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        monto: true,
        fechaCreacion: true,
        motivo: true,
      },
    }),
  ]);

  const result = [
    ...ventas.map((v) => ({
      tipo: "Venta",
      id: v.id,
      numero: v.nroVenta,
      fecha: v.fechaCreacion,
      monto: v.total,
      metodo_pago: null,
      cajaId: v.cajaId,
      detalles: v.detalles, // Incluye los detalles en el resultado
    })),
    ...entregas.map((e) => ({
      tipo: "Entrega",
      id: e.id,
      numero: e.nroEntrega,
      fecha: e.fechaCreacion,
      monto: e.monto,
      metodo_pago: e.metodoPago?.nombre || null,
    })),
    ...notasCredito.map((nc) => ({
      tipo: "Nota de Crédito",
      id: nc.id,
      numero: null,
      fecha: nc.fechaCreacion,
      monto: nc.monto,
      metodo_pago: null,
    })),
  ];

  result.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  return result;
};

const getResumenDia = async (cajaId) => {
  const hoy = new Date();
  const startDate = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    0,
    0,
    0
  );
  const endDate = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    23,
    59,
    59
  );

  const [ventas, entregas, notasCredito] = await Promise.all([
    prisma.venta.findMany({
      where: {
        fechaCreacion: {
          gte: startDate,
          lte: endDate,
        },
        cajaId: cajaId,
      },
      select: {
        id: true,
        nroVenta: true,
        total: true,
        cajaId: true,
        estadoPago: true,
        negocio: {
          select: {
            id: true,
            nombre: true,
          },
        },
        detalles: {
          select: {
            id: true,
            cantidad: true,
            precio: true,
            subTotal: true,
            producto: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    }),

    prisma.entregas.findMany({
      where: {
        fechaCreacion: {
          gte: startDate,
          lte: endDate,
        },
        cajaId: cajaId,
      },
      select: {
        id: true,
        monto: true,
        nroEntrega: true,
        cajaId: true,
        metodoPago: {
          select: { nombre: true },
        },
        negocio: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    }),

    prisma.notaCredito.findMany({
      where: {
        fechaCreacion: {
          gte: startDate,
          lte: endDate,
        },
        cajaId: cajaId,
      },
      select: {
        id: true,
        monto: true,
        motivo: true,
        cajaId: true,
        negocio: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    }),
  ]);

  const result = [
    ...ventas.map((v) => ({
      tipo: "Venta",
      id: v.id,
      numero: v.nroVenta,
      estado: v.estadoPago,
      monto: v.total,
      metodo_pago: null,
      negocio: v.negocio,
      detalles: v.detalles,
    })),
    ...entregas.map((e) => ({
      tipo: "Entrega",
      id: e.id,
      numero: e.nroEntrega,
      monto: e.monto,
      metodo_pago: e.metodoPago?.nombre || null,
      negocio: e.negocio,
    })),
    ...notasCredito.map((nc) => ({
      tipo: "Nota de Crédito",
      id: nc.id,
      numero: null,
      monto: nc.monto,
      metodo_pago: null,
      negocio: nc.negocio,
    })),
  ];

  return result;
};

module.exports = {
  getResumenCuentaByNegocio,
  getResumenDia,
};
