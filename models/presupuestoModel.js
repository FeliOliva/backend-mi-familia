const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const detalleInclude = {
  detallepresupuesto: {
    include: {
      producto: { select: { id: true, nombre: true } },
      tipounidad: { select: { id: true, tipo: true } },
    },
  },
  negocio: { select: { id: true, nombre: true, esCuentaCorriente: true } },
};

const getPresupuestos = async ({ limit, page, estado }) => {
  try {
    const skip = (page - 1) * limit;

    const where =
      estado === "activos"
        ? { estado: 1 }
        : estado === "inactivos"
        ? { estado: 0 }
        : {};

    const [presupuestos, total] = await Promise.all([
      prisma.presupuesto.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fechaCreacion: "desc" }],
        include: detalleInclude,
      }),
      prisma.presupuesto.count({ where }),
    ]);

    return {
      presupuestos,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error consultando presupuestos:", error);
    throw new Error("Error al obtener los presupuestos");
  }
};

const getPresupuestoById = async (id) => {
  try {
    return await prisma.presupuesto.findUnique({
      where: { id: parseInt(id) },
      include: detalleInclude,
    });
  } catch (error) {
    console.error("Error consultando presupuesto:", error);
    throw new Error("Error al obtener el presupuesto");
  }
};

const generateNroPresupuesto = async () => {
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, "");

  const lastPresupuesto = await prisma.presupuesto.findFirst({
    where: { nroPresupuesto: { startsWith: `PRE-${datePrefix}` } },
    orderBy: { nroPresupuesto: "desc" },
  });

  let sequence = 1;
  if (lastPresupuesto) {
    const lastSequence = parseInt(
      lastPresupuesto.nroPresupuesto.split("-")[2],
      10
    );
    sequence = lastSequence + 1;
  }

  return `PRE-${datePrefix}-${sequence.toString().padStart(4, "0")}`;
};

// Normaliza los detalles entrantes: calcula subTotal y total
const procesarDetalles = (detalles = []) => {
  const procesados = detalles.map((detalle) => {
    const cantidadNum = Number(detalle.cantidad || 0);
    const precioNum = Math.round(Number(detalle.precio || 0));
    const subTotal =
      detalle.subTotal != null
        ? Math.round(Number(detalle.subTotal))
        : Math.round(cantidadNum * precioNum);
    return {
      cantidad: cantidadNum,
      precio: precioNum,
      subTotal,
      productoId: parseInt(detalle.productoId),
      tipoUnidadId:
        detalle.tipoUnidadId != null ? parseInt(detalle.tipoUnidadId) : null,
    };
  });
  const total = procesados.reduce((sum, d) => sum + d.subTotal, 0);
  return { procesados, total };
};

const createPresupuesto = async ({
  negocioId,
  observacion,
  detalles,
}) => {
  try {
    const nroPresupuesto = await generateNroPresupuesto();
    const { procesados, total } = procesarDetalles(detalles);

    const presupuesto = await prisma.presupuesto.create({
      data: {
        nroPresupuesto,
        total,
        observacion: observacion || null,
        negocioId: negocioId != null ? parseInt(negocioId) : null,
        detallepresupuesto: {
          create: procesados.map((d) => ({
            cantidad: d.cantidad,
            precio: d.precio,
            subTotal: d.subTotal,
            productoId: d.productoId,
            tipoUnidadId: d.tipoUnidadId,
          })),
        },
      },
      include: detalleInclude,
    });

    return presupuesto;
  } catch (error) {
    console.error("Error creando presupuesto:", error);
    throw new Error("Error al crear el presupuesto");
  }
};

const updatePresupuesto = async (id, { negocioId, observacion, detalles }) => {
  try {
    const presupuestoId = parseInt(id);
    const { procesados, total } = procesarDetalles(detalles);

    const presupuesto = await prisma.$transaction(async (tx) => {
      await tx.detallepresupuesto.deleteMany({ where: { presupuestoId } });

      const data = {
        total,
        detallepresupuesto: {
          create: procesados.map((d) => ({
            cantidad: d.cantidad,
            precio: d.precio,
            subTotal: d.subTotal,
            productoId: d.productoId,
            tipoUnidadId: d.tipoUnidadId,
          })),
        },
      };
      // Solo actualizar campos si vienen definidos
      if (observacion !== undefined) {
        data.observacion =
          observacion != null && String(observacion).trim() !== ""
            ? String(observacion).trim()
            : null;
      }
      if (negocioId !== undefined) {
        data.negocioId = negocioId != null ? parseInt(negocioId) : null;
      }

      return await tx.presupuesto.update({
        where: { id: presupuestoId },
        data,
        include: detalleInclude,
      });
    });

    return presupuesto;
  } catch (error) {
    console.error("Error actualizando presupuesto:", error);
    throw new Error("Error al actualizar el presupuesto");
  }
};

const updatePresupuestoStatus = async (id, estado) => {
  try {
    return await prisma.presupuesto.update({
      where: { id: parseInt(id) },
      data: { estado },
    });
  } catch (error) {
    console.error("Error actualizando estado del presupuesto:", error);
    throw new Error("Error al actualizar el estado del presupuesto");
  }
};

const deletePresupuesto = async (id) => {
  try {
    return await prisma.presupuesto.delete({ where: { id: parseInt(id) } });
  } catch (error) {
    console.error("Error eliminando presupuesto:", error);
    throw new Error("Error al eliminar el presupuesto");
  }
};

const generarNroVenta = () => {
  const numeroAleatorio = Math.floor(10000 + Math.random() * 90000);
  return `V${numeroAleatorio}`;
};

/**
 * Convierte un presupuesto en una venta real.
 * Requiere que el presupuesto tenga negocio asociado (o que se pase uno).
 * Crea la venta + detalleventa y marca el presupuesto con el ventaId generado.
 */
const convertirAVenta = async (id, { cajaId, usuarioId, negocioId } = {}) => {
  try {
    const presupuestoId = parseInt(id);

    return await prisma.$transaction(async (tx) => {
      const presupuesto = await tx.presupuesto.findUnique({
        where: { id: presupuestoId },
        include: { detallepresupuesto: true },
      });

      if (!presupuesto) {
        throw new Error("Presupuesto no encontrado");
      }
      if (presupuesto.ventaId) {
        throw new Error("Este presupuesto ya fue convertido en una venta");
      }

      const negocioFinal =
        negocioId != null ? parseInt(negocioId) : presupuesto.negocioId;
      if (!negocioFinal) {
        throw new Error(
          "El presupuesto no tiene negocio asociado; elegí uno para convertirlo en venta"
        );
      }
      if (
        !presupuesto.detallepresupuesto ||
        presupuesto.detallepresupuesto.length === 0
      ) {
        throw new Error("El presupuesto no tiene productos");
      }

      const negocio = await tx.negocio.findUnique({
        where: { id: negocioFinal },
        select: { esCuentaCorriente: true },
      });
      if (!negocio) {
        throw new Error("Negocio no encontrado");
      }

      const detalles = presupuesto.detallepresupuesto.map((d) => ({
        precio: d.precio,
        cantidad: Number(d.cantidad),
        subTotal: d.subTotal,
        productoId: d.productoId,
      }));
      const total = detalles.reduce((sum, d) => sum + d.subTotal, 0);
      const estadoPago = negocio.esCuentaCorriente ? 4 : 1;

      const venta = await tx.venta.create({
        data: {
          nroVenta: generarNroVenta(),
          total,
          totalPagado: 0,
          restoPendiente: total,
          estadoPago,
          observacion: presupuesto.observacion || null,
          negocioId: negocioFinal,
          cajaId: cajaId != null ? parseInt(cajaId) : null,
          usuarioId: usuarioId != null ? parseInt(usuarioId) : null,
        },
      });

      await tx.detalleventa.createMany({
        data: detalles.map((d) => ({
          precio: d.precio,
          cantidad: d.cantidad,
          subTotal: d.subTotal,
          ventaId: venta.id,
          productoId: d.productoId,
        })),
      });

      // Marcar el presupuesto como convertido (y su negocio si no lo tenía)
      await tx.presupuesto.update({
        where: { id: presupuestoId },
        data: {
          ventaId: venta.id,
          negocioId: negocioFinal,
          estado: 0, // inactivo: ya se concretó
        },
      });

      return { venta, presupuestoId };
    });
  } catch (error) {
    console.error("Error convirtiendo presupuesto en venta:", error);
    throw new Error(
      error.message || "Error al convertir el presupuesto en venta"
    );
  }
};

module.exports = {
  getPresupuestos,
  getPresupuestoById,
  createPresupuesto,
  updatePresupuesto,
  updatePresupuestoStatus,
  deletePresupuesto,
  convertirAVenta,
};
