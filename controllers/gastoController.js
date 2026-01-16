const gastoModel = require("../models/gastoModel");

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

const addGasto = async (req, res) => {
  try {
    const { motivo, monto, cajaId } = req.body;
    const usuarioId = req.user?.id;
    if (!motivo || !monto || !usuarioId || !cajaId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const gastoData = await gastoModel.addGasto({
      motivo: String(motivo).toUpperCase(),
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
    const { motivo, monto } = req.body;
    const { id } = req.params;
    if (!id || !motivo || !monto) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const gastoData = await gastoModel.updateGasto(
      id,
      String(motivo).toUpperCase(),
      parseInt(monto)
    );
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
