const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Función auxiliar para obtener inicio del día (misma lógica que entregaModel)
const getInicioDelDiaUTC = () => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = ahora.getMonth();
  const dia = ahora.getDate();
  
  // Crear fecha que representa 00:00:00 del día actual en la zona horaria local
  const fechaLocal = new Date(año, mes, dia, 0, 0, 0, 0);
  
  return fechaLocal;
};

// Función auxiliar para obtener fin del día (misma lógica que entregaModel)
const getFinDelDiaUTC = () => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = ahora.getMonth();
  const dia = ahora.getDate();
  
  // Crear fecha que representa 23:59:59.999 del día actual en la zona horaria local
  const fechaLocal = new Date(año, mes, dia, 23, 59, 59, 999);
  
  return fechaLocal;
};

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
        totalEfectivoBruto: data.totalEfectivoBruto || data.totalEfectivo || 0,
        totalGastos: data.totalGastos || 0,
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
        ajustecierrecaja: {
          select: {
            id: true,
            monto: true,
            metodoPago: true,
            fechaOperacion: true,
            motivo: true,
            negocio: { select: { nombre: true } },
          },
          orderBy: { fechaRegistro: "asc" },
        },
      },
      orderBy: { fecha: "desc" },
    }).then((cierres) =>
      cierres.map((cierre) => {
        const ajustes = cierre.ajustecierrecaja || [];
        const ajusteTotal = ajustes.reduce((total, ajuste) => total + Number(ajuste.monto || 0), 0);
        const ajusteEfectivo = ajustes
          .filter((ajuste) => ajuste.metodoPago === "EFECTIVO")
          .reduce((total, ajuste) => total + Number(ajuste.monto || 0), 0);

        return {
          ...cierre,
          ajustes,
          ajusteTotal,
          ajusteEfectivo,
          totalVentasAjustado: Number(cierre.totalVentas || 0) + ajusteTotal,
          totalPagadoAjustado: Number(cierre.totalPagado || 0) + ajusteTotal,
          totalEfectivoAjustado: Number(cierre.totalEfectivo || 0) + ajusteEfectivo,
          totalEfectivoBrutoAjustado:
            Number(cierre.totalEfectivoBruto || 0) + ajusteEfectivo,
        };
      })
    );
  } catch (error) {
    console.error("Error al obtener cierres de caja:", error);
    throw new Error("Error al obtener cierres de caja");
  }
};

const crearAjusteCierreCaja = async ({
  cierreId,
  negocioId,
  ventaId,
  monto,
  metodoPago,
  fechaOperacion,
  motivo,
  usuarioId,
}) => {
  const cierre = await prisma.cierrecaja.findUnique({
    where: { id: cierreId },
    select: { id: true, cajaId: true, estado: true },
  });

  if (!cierre) throw new Error("Cierre no encontrado");
  if (Number(cierre.estado) === 0) {
    const error = new Error("Solo se pueden ajustar cierres cerrados");
    error.code = "AJUSTE_CIERRE_ABIERTO";
    throw error;
  }

  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    select: { id: true },
  });
  if (!negocio) throw new Error("Negocio no encontrado");

  if (ventaId) {
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      select: { id: true, negocioId: true },
    });
    if (!venta) throw new Error("Venta no encontrada");
    if (venta.negocioId !== negocioId) {
      throw new Error("La venta no pertenece al negocio seleccionado");
    }
  }

  return prisma.ajustecierrecaja.create({
    data: {
      cierreCajaId: cierre.id,
      cajaId: cierre.cajaId,
      negocioId,
      ventaId: ventaId || null,
      usuarioId,
      monto,
      metodoPago,
      fechaOperacion: new Date(fechaOperacion),
      motivo,
    },
    include: {
      negocio: { select: { nombre: true } },
      venta: { select: { nroVenta: true } },
      usuario: { select: { usuario: true } },
    },
  });
};

const getAjustesCierreCaja = async (cierreId) =>
  prisma.ajustecierrecaja.findMany({
    where: { cierreCajaId: cierreId },
    include: {
      negocio: { select: { nombre: true } },
      venta: { select: { nroVenta: true } },
      usuario: { select: { usuario: true } },
    },
    orderBy: { fechaRegistro: "asc" },
  });

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
        negocio: { select: { nombre: true, esCuentaCorriente: true } }, // Obtener negocio directamente de la entrega
        venta: {
          select: {
            nroVenta: true,
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
      negocioNombre: e.negocio?.nombre || "SIN NEGOCIO", // Usar el negocio de la entrega directamente
      metodoPago: e.metodopago?.nombre || "SIN MÉTODO",
      monto: Number(e.monto || 0),
      origenCobro: e.negocio?.esCuentaCorriente
        ? "PAGO_CUENTA_CORRIENTE"
        : "VENTA_DEL_DIA",
    }));
  } catch (error) {
    console.error("Error al obtener detalle de ventas del cierre:", error);
    throw new Error("Error al obtener detalle de ventas del cierre");
  }
};

/**
 * Verifica si ya existe un cierre de caja (de cualquier estado) para una caja en el día actual
 * Usa la misma lógica de fechas que getTotalesEntregasDelDiaPorCaja para mantener consistencia
 * @param {number} cajaId - ID de la caja
 * @returns {Promise<boolean>} - true si existe un cierre, false si no
 */
const existeCierreCajaParaFecha = async (cajaId) => {
  try {
    // Usar las mismas funciones auxiliares que getTotalesEntregasDelDiaPorCaja
    const inicioDelDia = getInicioDelDiaUTC();
    const finDelDia = getFinDelDiaUTC();

    // Buscar cualquier cierre de caja (de cualquier estado) para esta caja en el día actual
    const cierreExistente = await prisma.cierrecaja.findFirst({
      where: {
        cajaId: parseInt(cajaId),
        fecha: {
          gte: inicioDelDia,
          lte: finDelDia,
        },
        // No filtrar por estado, verificar todos los cierres (0=automático, 1=cerrado, etc.)
      },
      select: {
        id: true,
        estado: true,
        fecha: true,
      },
    });

    if (cierreExistente) {
      console.log(`   ℹ️  Cierre existente encontrado: ID ${cierreExistente.id}, estado ${cierreExistente.estado}, fecha ${cierreExistente.fecha.toISOString()}`);
    }

    return !!cierreExistente;
  } catch (error) {
    console.error("Error verificando si existe cierre de caja:", error);
    // En caso de error, ser más restrictivo y asumir que existe para evitar duplicados
    return true;
  }
};

module.exports = {
  crearAjusteCierreCaja,
  getAjustesCierreCaja,
  getCajas,
  crearCierreCaja,
  getCierresCaja,
  getCajaById,
  crearCierreCajaPendiente,
  cerrarCierreCajaPendiente,
  getDetalleMetodosPorCierre,
  editarCierreCaja,
  getDetalleVentasPorCierre,
  existeCierreCajaParaFecha,
};
