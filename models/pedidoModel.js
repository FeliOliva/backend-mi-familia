const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getPedidos = async ({ limit, page, estado }) => {
  try {
    const skip = (page - 1) * limit;

    const where = estado === "activos"
      ? { estado: 1 }
      : estado === "inactivos"
      ? { estado: 0 }
      : {};

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fechaCreacion: "desc" }],
        include: {
          detallepedido: {
            include: {
              producto: { select: { id: true, nombre: true } },
              tipounidad: { select: { id: true, tipo: true } },
            },
          },
        },
      }),
      prisma.pedido.count({ where }),
    ]);

    return {
      pedidos,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error consultando pedidos:", error);
    throw new Error("Error al obtener los pedidos");
  }
};

const getPedidoById = async (id) => {
  try {
    return await prisma.pedido.findUnique({
      where: { id: parseInt(id) },
      include: {
        detallepedido: {
          include: {
            producto: { select: { id: true, nombre: true } },
            tipounidad: { select: { id: true, tipo: true } },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error consultando pedido:", error);
    throw new Error("Error al obtener el pedido");
  }
};

const generateNroPedido = async () => {
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, "");
  
  const lastPedido = await prisma.pedido.findFirst({
    where: {
      nroPedido: {
        startsWith: `PED-${datePrefix}`,
      },
    },
    orderBy: { nroPedido: "desc" },
  });

  let sequence = 1;
  if (lastPedido) {
    const lastSequence = parseInt(lastPedido.nroPedido.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  return `PED-${datePrefix}-${sequence.toString().padStart(4, "0")}`;
};

const createPedido = async (detalles) => {
  try {
    const nroPedido = await generateNroPedido();

    const pedido = await prisma.pedido.create({
      data: {
        nroPedido,
        detallepedido: {
          create: detalles.map((detalle) => ({
            cantidad: detalle.cantidad,
            productoId: detalle.productoId,
            tipoUnidadId: detalle.tipoUnidadId,
          })),
        },
      },
      include: {
        detallepedido: {
          include: {
            producto: { select: { id: true, nombre: true } },
            tipounidad: { select: { id: true, tipo: true } },
          },
        },
      },
    });

    return pedido;
  } catch (error) {
    console.error("Error creando pedido:", error);
    throw new Error("Error al crear el pedido");
  }
};

const updatePedidoStatus = async (id, estado) => {
  try {
    return await prisma.pedido.update({
      where: { id: parseInt(id) },
      data: { estado },
    });
  } catch (error) {
    console.error("Error actualizando estado del pedido:", error);
    throw new Error("Error al actualizar el estado del pedido");
  }
};

const deletePedido = async (id) => {
  try {
    return await prisma.pedido.delete({
      where: { id: parseInt(id) },
    });
  } catch (error) {
    console.error("Error eliminando pedido:", error);
    throw new Error("Error al eliminar el pedido");
  }
};

const updatePedido = async (id, detalles) => {
  try {
    const pedidoId = parseInt(id);

    // Eliminar detalles anteriores y crear los nuevos en una transacción
    const pedido = await prisma.$transaction(async (tx) => {
      // Eliminar detalles existentes
      await tx.detallepedido.deleteMany({
        where: { pedidoId },
      });

      // Actualizar pedido con nuevos detalles
      return await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          detallepedido: {
            create: detalles.map((detalle) => ({
              cantidad: detalle.cantidad,
              productoId: detalle.productoId,
              tipoUnidadId: detalle.tipoUnidadId,
            })),
          },
        },
        include: {
          detallepedido: {
            include: {
              producto: { select: { id: true, nombre: true } },
              tipounidad: { select: { id: true, tipo: true } },
            },
          },
        },
      });
    });

    return pedido;
  } catch (error) {
    console.error("Error actualizando pedido:", error);
    throw new Error("Error al actualizar el pedido");
  }
};

module.exports = {
  getPedidos,
  getPedidoById,
  createPedido,
  updatePedidoStatus,
  deletePedido,
  updatePedido,
};


