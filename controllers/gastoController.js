const gastoModel = require("../models/gastoModel");
const { PrismaClient } = require("@prisma/client");
const { normalizarNombre } = require("./catalogosController");
const prisma = new PrismaClient();

const getGastos = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;

    if (
      isNaN(pageNumber) ||
      pageNumber < 1 ||
      isNaN(limitNumber) ||
      limitNumber < 1
    ) {
      return res
        .status(400)
        .json({ error: "Parámetros de paginación no válidos" });
    }
    const usuarioId = req.user?.id;
    const gastosData = await gastoModel.getGastos(
      limitNumber,
      pageNumber,
      usuarioId
    );
    res.json(gastosData);
  } catch (error) {
    console.error("Error al obtener los gastos:", error);
    res.status(500).json({ error: "Error al obtener los gastos" });
  }
};

const getGastoById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    const gastoData = await gastoModel.getGastoById(id);
    const usuarioId = req.user?.id;
    if (gastoData && usuarioId && gastoData.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "No autorizado" });
    }
    res.json(gastoData);
  } catch (error) {
    console.error("Error al obtener el gasto:", error);
    res.status(500).json({ error: "Error al obtener el gasto" });
  }
};

const getTotalesGastosDelDiaPorCaja = async (req, res) => {
  try {
    const totales = await gastoModel.getTotalesGastosDelDiaPorCaja();
    res.json(totales);
  } catch (error) {
    console.error("Error al obtener los totales de gastos del día por caja:", error);
    res.status(500).json({
      error: "Error al obtener los totales de gastos del día por caja",
    });
  }
};

const getGastosDelDia = async (req, res) => {
  try {
    const { cajaId } = req.query;
    const usuarioId = req.user?.id;
    const gastos = await gastoModel.getGastosDelDia({ usuarioId, cajaId });
    res.json(gastos);
  } catch (error) {
    console.error("Error al obtener los gastos del día:", error);
    res.status(500).json({ error: "Error al obtener los gastos del día" });
  }
};

/**
 * Resuelve el motivo del gasto contra el catalogo.
 * - motivoGastoId (front nuevo): se usa ese motivo.
 * - solo texto `motivo` (front viejo durante el deploy): se busca por nombre;
 *   si no esta en el catalogo va a OTRO con el texto como detalle, para no
 *   perder el dato.
 * Devuelve { motivo, motivoGastoId, detalle } o null si no hay motivo.
 */
const resolverMotivo = async ({ motivoGastoId, motivo, detalle }) => {
  const detalleLimpio = detalle ? String(detalle).trim().toUpperCase() || null : null;
  if (motivoGastoId) {
    const m = await prisma.motivogasto.findUnique({ where: { id: parseInt(motivoGastoId) } });
    return m ? { motivo: m.nombre, motivoGastoId: m.id, detalle: detalleLimpio } : null;
  }
  const nombre = normalizarNombre(motivo);
  if (!nombre) return null;
  const m = await prisma.motivogasto.findUnique({ where: { nombre } });
  if (m) return { motivo: m.nombre, motivoGastoId: m.id, detalle: detalleLimpio };
  const otro = await prisma.motivogasto.findUnique({ where: { nombre: "OTRO" } });
  return {
    motivo: otro ? otro.nombre : nombre,
    motivoGastoId: otro ? otro.id : null,
    detalle: detalleLimpio || nombre,
  };
};

const addGasto = async (req, res) => {
  try {
    const { motivo, motivoGastoId, detalle, monto, cajaId } = req.body;
    const usuarioId = req.user?.id;
    if ((!motivo && !motivoGastoId) || !monto || !usuarioId || !cajaId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    const motivoResuelto = await resolverMotivo({ motivoGastoId, motivo, detalle });
    if (!motivoResuelto) {
      return res.status(400).json({ error: "Motivo inválido" });
    }

    const gastoData = await gastoModel.addGasto({
      ...motivoResuelto,
      monto: parseInt(monto),
      estado: 1,
      usuarioId: parseInt(usuarioId),
      cajaId: parseInt(cajaId),
    });
    res.json(gastoData);
  } catch (error) {
    console.error("Error al agregar el gasto", error);
    res.status(500).json({ error: "Error al agregar el gasto" });
  }
};

const updateGasto = async (req, res) => {
  try {
    const { motivo, motivoGastoId, detalle, monto } = req.body;
    const { id } = req.params;
    if (!id || (!motivo && !motivoGastoId) || !monto) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    const motivoResuelto = await resolverMotivo({ motivoGastoId, motivo, detalle });
    if (!motivoResuelto) {
      return res.status(400).json({ error: "Motivo inválido" });
    }

    const gastoData = await gastoModel.updateGasto(id, {
      ...motivoResuelto,
      monto: parseInt(monto),
    });
    res.json(gastoData);
  } catch (error) {
    console.error("Error al actualizar el gasto", error);
    res.status(500).json({ error: "Error al actualizar el gasto" });
  }
};

const dropGasto = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ error: "Falta el id del gasto" });
    }
    const deletedGasto = await gastoModel.dropGasto(id);
    res.json(deletedGasto);
  } catch (error) {
    console.error("Error al eliminar el gasto", error);
    res.status(500).json({ error: "Error al eliminar el gasto" });
  }
};

module.exports = {
  getGastos,
  getGastoById,
  getTotalesGastosDelDiaPorCaja,
  getGastosDelDia,
  addGasto,
  updateGasto,
  dropGasto,
};
