const presupuestoModel = require("../models/presupuestoModel");

const validarDetalles = (detalles) => {
  if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
    return "Debe incluir al menos un producto en el presupuesto";
  }
  for (const detalle of detalles) {
    if (!detalle.productoId || detalle.cantidad == null || detalle.precio == null) {
      return "Cada detalle debe tener productoId, cantidad y precio";
    }
    if (Number(detalle.cantidad) <= 0) {
      return "La cantidad debe ser mayor a 0";
    }
    if (Number(detalle.precio) < 0) {
      return "El precio no puede ser negativo";
    }
  }
  return null;
};

const getPresupuestos = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      100
    );
    const estado = req.query.estado || "todos";

    const data = await presupuestoModel.getPresupuestos({ limit, page, estado });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener los presupuestos:", error);
    res.status(500).json({ error: "Error al obtener los presupuestos" });
  }
};

const getPresupuestoById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    const presupuesto = await presupuestoModel.getPresupuestoById(id);
    if (!presupuesto) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }
    res.json(presupuesto);
  } catch (error) {
    console.error("Error al obtener el presupuesto:", error);
    res.status(500).json({ error: "Error al obtener el presupuesto" });
  }
};

const createPresupuesto = async (req, res) => {
  try {
    const { detalles, negocioId, observacion } = req.body;

    const errorDetalles = validarDetalles(detalles);
    if (errorDetalles) {
      return res.status(400).json({ error: errorDetalles });
    }

    const nuevo = await presupuestoModel.createPresupuesto({
      negocioId,
      observacion,
      detalles,
    });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error("Error al crear el presupuesto:", error);
    res.status(500).json({ error: "Error al crear el presupuesto" });
  }
};

const updatePresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const { detalles, negocioId, observacion } = req.body;

    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    const existente = await presupuestoModel.getPresupuestoById(id);
    if (!existente) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    const errorDetalles = validarDetalles(detalles);
    if (errorDetalles) {
      return res.status(400).json({ error: errorDetalles });
    }

    const actualizado = await presupuestoModel.updatePresupuesto(id, {
      negocioId,
      observacion,
      detalles,
    });
    res.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar el presupuesto:", error);
    res.status(500).json({ error: "Error al actualizar el presupuesto" });
  }
};

const deletePresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    const existente = await presupuestoModel.getPresupuestoById(id);
    if (!existente) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    await presupuestoModel.deletePresupuesto(id);
    res.json({
      message: "Presupuesto eliminado correctamente",
      id: parseInt(id),
    });
  } catch (error) {
    console.error("Error al eliminar el presupuesto:", error);
    res.status(500).json({ error: "Error al eliminar el presupuesto" });
  }
};

// Convertir un presupuesto en una venta real
const convertirAVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { cajaId, usuarioId, negocioId } = req.body;

    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    const resultado = await presupuestoModel.convertirAVenta(id, {
      cajaId,
      usuarioId,
      negocioId,
    });
    res.status(201).json(resultado);
  } catch (error) {
    console.error("Error al convertir el presupuesto en venta:", error);
    res
      .status(400)
      .json({ error: error.message || "Error al convertir el presupuesto" });
  }
};

module.exports = {
  getPresupuestos,
  getPresupuestoById,
  createPresupuesto,
  updatePresupuesto,
  deletePresupuesto,
  convertirAVenta,
};
