const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getCajas = async () => {
  try {
    // Incluye las ventas asociadas a cada caja y suma el total
    const cajas = await prisma.caja.findMany({
      include: {
        venta: {
          select: { total: true, estadoPago: true },
        },
      },
    });

    // Calcula el total solo de ventas cobradas (estadoPago === 2)
    return cajas.map((caja) => ({
      ...caja,
      totalVentas: caja.venta
        .filter((v) => v.estadoPago === 2)
        .reduce((acc, v) => acc + v.total, 0),
    }));
  } catch (error) {
    console.error("Error al obtener las cajas:", error);
    throw new Error("Error al obtener las cajas");
  }
};

const crearCierreCaja = async (data) => {
  try {
    // 👇 aceptar tanto 'metodoPago' como 'metodosPago'
    const listaMetodos = data.metodoPago || data.metodosPago || [];

    return await prisma.cierrecaja.create({
      data: {
        fecha: new Date(),
        usuario: data.usuarioId
          ? { connect: { id: data.usuarioId } }
          : undefined,
        caja: data.cajaId ? { connect: { id: data.cajaId } } : undefined,
        totalVentas: data.totalVentas,
        totalPagado: data.totalPagado,
        totalCuentaCorriente: data.totalCuentaCorriente || 0,
        totalEfectivo: data.totalEfectivo || 0,
        ingresoLimpio: data.ingresoLimpio || 0,
        estado: data.estado || 0,
        cierrecajametodopago:
          listaMetodos.length > 0
            ? {
                create: listaMetodos.map((metodo) => ({
                  metodoPago: metodo.nombre,
                  total: metodo.total,
                })),
              }
            : undefined,
      },
      include: {
        cierrecajametodopago: true,
      },
    });
  } catch (error) {
    console.error("Error al crear cierre de caja:", error);
    throw new Error("Error al crear cierre de caja");
  }
};

const getDetalleMetodosPorCierre = async (cierreId) => {
  try {
    return await prisma.cierrecajametodopago.findMany({
      where: { cierreCajaId: cierreId },
    });
  } catch (error) {
    console.error("Error al obtener métodos de pago del cierre:", error);
    throw new Error("Error al obtener detalle de métodos de pago");
  }
};

const getCierresCaja = async () => {
  try {
    return await prisma.cierrecaja.findMany({
      include: {
        usuario: { select: { usuario: true } },
        caja: { select: { nombre: true } },
      },
      orderBy: { fecha: "desc" },
    });
  } catch (error) {
    console.error("Error al obtener cierres de caja:", error);
    throw new Error("Error al obtener cierres de caja");
  }
};

const crearCierreCajaPendiente = async (cajaId, totalVentas = 0) => {
  try {
    return await prisma.cierrecaja.create({
      data: {
        fecha: new Date(),
        usuarioId: null,
        cajaId,
        totalVentas,
        totalPagado: 0,
        totalCuentaCorriente: 0,
        totalDiferido: 0,
        ingresoLimpio: 0,
        estado: "pendiente",
      },
    });
  } catch (error) {
    console.error("Error al crear cierre de caja pendiente:", error);
    throw new Error("Error al crear cierre de caja pendiente");
  }
};

const cerrarCierreCajaPendiente = async (cierreId, usuarioId) => {
  try {
    return await prisma.cierrecaja.update({
      where: { id: cierreId },
      data: {
        estado: "cerrado",
        usuarioId,
        fecha: new Date(), // opcional: actualiza la fecha de cierre
      },
    });
  } catch (error) {
    console.error("Error al cerrar cierre pendiente:", error);
    throw new Error("Error al cerrar cierre pendiente");
  }
};

const getCajaById = async (id) => {
  try {
    return await prisma.caja.findUnique({
      where: { id },
      include: {
        venta: {
          select: { total: true, estadoPago: true },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener la caja:", error);
    throw new Error("Error al obtener la caja");
  }
};

const editarCierreCaja = async (cierreId, ingresoLimpio, estado) => {
  try {
    const cierre = await prisma.cierrecaja.findUnique({
      where: { id: cierreId },
    });

    if (!cierre) {
      throw new Error("Cierre no encontrado");
    }

    const cierreActualizado = await prisma.cierrecaja.update({
      where: { id: cierreId },
      data: {
        ingresoLimpio: ingresoLimpio,
        estado: estado,
      },
    });

    return cierreActualizado;
  } catch (error) {
    console.error("Error al editar cierre de caja:", error);
    throw new Error("Error al editar cierre de caja");
  }
};

const getDetalleVentasPorCierre = async (cierreId) => {
  try {
    const cierre = await prisma.cierrecaja.findUnique({
      where: { id: cierreId },
      select: { id: true, fecha: true, cajaId: true },
    });

    if (!cierre) {
      throw new Error("Cierre no encontrado");
    }

    const fecha = cierre.fecha;
    const inicioDelDia = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate()
    );
    const finDelDia = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate(),
      23,
      59,
      59,
      999
    );

    const entregas = await prisma.entregas.findMany({
      where: {
        cajaId: cierre.cajaId,
        fechaCreacion: {
          gte: inicioDelDia,
          lte: finDelDia,
        },
      },
      select: {
        id: true,
        monto: true,
        ventaId: true,
        metodopago: { select: { nombre: true } },
        venta: {
          select: {
            nroVenta: true,
            negocio: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaCreacion: "asc" },
    });

    // Normalizamos a un formato simple para el front
    return entregas.map((e) => ({
      entregaId: e.id,
      ventaId: e.ventaId,
      nroVenta: e.venta?.nroVenta || null,
      negocioNombre: e.venta?.negocio?.nombre || null,
      metodoPago: e.metodopago?.nombre || "SIN MÉTODO",
      monto: Number(e.monto || 0),
    }));
  } catch (error) {
    console.error("Error al obtener detalle de ventas del cierre:", error);
    throw new Error("Error al obtener detalle de ventas del cierre");
  }
};

module.exports = {
  getCajas,
  crearCierreCaja,
  getCierresCaja,
  getCajaById,
  crearCierreCajaPendiente,
  cerrarCierreCajaPendiente,
  getDetalleMetodosPorCierre,
  editarCierreCaja,
  getDetalleVentasPorCierre,
};
