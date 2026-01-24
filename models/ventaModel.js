const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { cantidadConUnidad } = require("../utils/format");

async function getVentas({ limit, page, q, estado, startDate, endDate }) {
  try {
    const skip = (page - 1) * limit;

    const fechaCreacion = {};
    if (startDate) fechaCreacion.gte = startDate;
    if (endDate) fechaCreacion.lte = endDate;

    const where = {
      AND: [
        // Búsqueda por número de venta
        q ? { nroVenta: { contains: q } } : {},
        // Filtro por estado (si aplica)
        estado === "activos"
          ? { estadoPago: { not: 0 } }
          : estado === "inactivos"
          ? { estadoPago: 0 }
          : {},
        Object.keys(fechaCreacion).length ? { fechaCreacion } : {},
      ],
    };

    const [ventasRaw, total] = await Promise.all([
      prisma.venta.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaCreacion: "desc" },
        include: {
          negocio: { select: { nombre: true, direccion: true } },
          caja: { select: { nombre: true } },
          detalleventa: {
            include: {
              producto: {
                select: {
                  nombre: true,
                  tipounidad: { select: { tipo: true } },
                },
              },
            },
          },
        },
      }),
      prisma.venta.count({ where }),
    ]);

    const ventas = ventasRaw.map((v) => ({
      ...v,
      detalles: v.detalleventa.map((d) => ({
        ...d,
        cantidadConUnidad: cantidadConUnidad(d),
      })),
    }));

    return {
      ventas,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error al obtener las ventas:", error);
    throw new Error("Error al obtener las ventas");
  }
}

const getNegocioById = async (negocioId) => {
  try {
    return await prisma.negocio.findUnique({
      where: { id: parseInt(negocioId) },
    });
  } catch (error) {
    console.error("Error al obtener el negocio:", error);
    throw new Error("Error al obtener el negocio");
  }
};

const getVentasPendientes = async () => {
  try {
    return await prisma.venta.findMany({
      where: {
        estadoPago: {
          in: [1, 3],
        },
      },
      include: {
        negocio: {
          select: { nombre: true },
        },
        caja: {
          select: { nombre: true },
        },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener las ventas pendientes:", error);
    throw new Error("Error al obtener las ventas pendientes");
  }
};

const getVentasByNegocioId = async (negocioId, cajaId, startDate, endDate) => {
  try {
    const ventas = await prisma.venta.findMany({
      where: {
        negocioId: parseInt(negocioId),
        cajaId: parseInt(cajaId),
        fechaCreacion: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        negocio: {
          select: { nombre: true },
        },
        caja: {
          select: { nombre: true },
        },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    const totalVentas = await prisma.venta.count({
      where: {
        negocioId: parseInt(negocioId),
        cajaId: parseInt(cajaId),
        fechaCreacion: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      ventas,
      total: totalVentas,
    };
  } catch (error) {
    console.error("Error al obtener las ventas por negocio y caja:", error);
    throw new Error("Error al obtener las ventas por negocio y caja");
  }
};

const getVentaById = async (id) => {
  try {
    return await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: {
        negocio: {
          select: { nombre: true, direccion: true },
        },
        detalleventa: {
          include: {
            producto: {
              select: { nombre: true },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error consultando ventas:", error);
    throw new Error("Error al obtener la venta");
  }
};

const getVentasByNegocio = async (
  negocioId,
  limit,
  page,
  startDate,
  endDate,
  cajaId
) => {
  try {
    if (!negocioId || isNaN(parseInt(negocioId))) {
      throw new Error("NegocioId inválido o no proporcionado");
    }

    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;
    const offset = (page - 1) * limit;

    const filterStartDate = startDate ? new Date(startDate) : null;
    const filterEndDate = endDate ? new Date(endDate) : null;
    if (filterEndDate) {
      filterEndDate.setHours(23, 59, 59, 999);
    }

    const whereClause = {
      negocioId: parseInt(negocioId),
      ...(cajaId && { cajaId: parseInt(cajaId) }),
    };

    const fechaCreacion = {};
    if (filterStartDate) fechaCreacion.gte = filterStartDate;
    if (filterEndDate) fechaCreacion.lte = filterEndDate;
    if (Object.keys(fechaCreacion).length) {
      whereClause.fechaCreacion = fechaCreacion;
    }

    const ventas = await prisma.venta.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      include: {
        negocio: { select: { nombre: true, direccion: true } },
        caja: { select: { nombre: true } },
        detalles: { include: { producto: true } },
      },
    });

    const totalVentas = await prisma.venta.count({ where: whereClause });

    return {
      ventas,
      total: totalVentas,
      totalPages: Math.ceil(totalVentas / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error al obtener la venta por negocio:", error);
    throw new Error("Error al obtener la venta por negocio");
  }
};

const addVenta = async (data) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      const nuevaVenta = await prisma.venta.create({
        data: {
          nroVenta: data.nroVenta,
          total: data.total,
          totalPagado: data.totalPagado,
          restoPendiente: data.restoPendiente,
          estadoPago: data.estadoPago,
          observacion: data.observacion || null,
          negocioId: data.negocioId,
          cajaId: data.cajaId || null,
          usuarioId: data.usuarioId,
        },
      });

      await prisma.detalleventa.createMany({
        data: data.detalles.map((detalle) => ({
          precio: detalle.precio,
          cantidad: detalle.cantidad,
          subTotal: detalle.subTotal,
          ventaId: nuevaVenta.id,
          productoId: detalle.productoId,
        })),
      });

      return {
        ...nuevaVenta,
        detalles: data.detalles,
      };
    });
  } catch (error) {
    console.error("Error al agregar la venta:", error);
    throw new Error("Error al agregar la venta");
  }
};

const updateVenta = async (id, data) => {
  try {
    const ventaId = parseInt(id);

    return await prisma.$transaction(async (tx) => {
      // 1) Traer venta original (para tener caja y negocio anterior, totalPagado, etc.)
      const ventaOriginal = await tx.venta.findUnique({
        where: { id: ventaId },
        select: {
          id: true,
          nroVenta: true,
          totalPagado: true,
          restoPendiente: true,
          estadoPago: true,
          negocioId: true,
          cajaId: true,
          observacion: true,
        },
      });

      if (!ventaOriginal) {
        throw new Error("Venta no encontrada");
      }

      const cajaAnterior = ventaOriginal.cajaId;
      const negocioAnterior = ventaOriginal.negocioId;

      // 2) Verificar si cambió el negocio y determinar el estadoPago
      const nuevoNegocioId = data.negocioId ?? ventaOriginal.negocioId;
      const cambioNegocio = negocioAnterior !== nuevoNegocioId;

      let estadoPago = ventaOriginal.estadoPago;

      // Si cambió el negocio, recalcular el estadoPago según el tipo de negocio
      if (cambioNegocio) {
        const nuevoNegocio = await tx.negocio.findUnique({
          where: { id: nuevoNegocioId },
          select: { esCuentaCorriente: true },
        });

        if (nuevoNegocio) {
          // Si el nuevo negocio es cuenta corriente y la venta no está cobrada (2)
          if (nuevoNegocio.esCuentaCorriente && ventaOriginal.estadoPago !== 2) {
            estadoPago = 4; // Cuenta corriente
          }
          // Si el nuevo negocio NO es cuenta corriente y el estado actual es 4
          else if (!nuevoNegocio.esCuentaCorriente && ventaOriginal.estadoPago === 4) {
            estadoPago = 1; // Pendiente normal
          }
        }
      }

      // 3) Preparar detalles nuevos
      const detallesInput = Array.isArray(data.detalles) ? data.detalles : [];

      const detallesProcesados = detallesInput.map((detalle) => {
        const cantidadNum =
          typeof detalle.cantidad === "string"
            ? Number(detalle.cantidad)
            : Number(detalle.cantidad || 0);

        const precioNum = Number(detalle.precio || 0);
        const subTotalCalc =
          detalle.subTotal != null
            ? Number(detalle.subTotal)
            : cantidadNum * precioNum;

        return {
          precio: precioNum,
          cantidad: cantidadNum,
          subTotal: subTotalCalc,
          productoId: detalle.productoId,
        };
      });

      const totalRecalculado = detallesProcesados.reduce(
        (sum, d) => sum + d.subTotal,
        0
      );

      const totalPagado = ventaOriginal.totalPagado || 0;
      const restoPendiente = Math.max(0, totalRecalculado - totalPagado);

      // 4) Borrar detalles viejos
      await tx.detalleventa.deleteMany({
        where: { ventaId },
      });

      // 5) Actualizar cabecera de venta
      const ventaActualizada = await tx.venta.update({
        where: { id: ventaId },
        data: {
          nroVenta: data.nroVenta ?? ventaOriginal.nroVenta,
          total: totalRecalculado,
          totalPagado,
          restoPendiente,
          estadoPago,
          observacion: data.observacion ?? ventaOriginal.observacion,
          negocioId: nuevoNegocioId,
          cajaId: data.cajaId ?? ventaOriginal.cajaId,
        },
        include: {
          negocio: { select: { id: true, nombre: true, esCuentaCorriente: true } },
        },
      });

      // 6) Crear nuevos detalles
      await tx.detalleventa.createMany({
        data: detallesProcesados.map((d) => ({
          ...d,
          ventaId: ventaActualizada.id,
        })),
      });

      // 7) Volvemos un objeto "simple" para el controller
      return {
        ...ventaActualizada,
        detalles: detallesProcesados,
        cajaAnterior,
        negocioAnterior,
      };
    });
  } catch (error) {
    console.error("Error al actualizar la venta:", error);
    throw new Error("Error al actualizar la venta");
  }
};

const dropVenta = async (id) => {
  try {
    await prisma.detalleventa.deleteMany({
      where: {
        ventaId: parseInt(id),
      },
    });

    await prisma.venta.delete({
      where: {
        id: parseInt(id),
      },
    });
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    throw new Error("Error al eliminar la venta");
  }
};

module.exports = {
  getVentas,
  getVentaById,
  dropVenta,
  addVenta,
  getVentasByNegocio,
  updateVenta,
  getVentasByNegocioId,
  getNegocioById,
  getVentasPendientes,
};
