const resumenCuentaModel = require("../models/resumenCuentaModel");

const getResumenCuentaByNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Las fechas de inicio y fin son obligatorias" });
    }
    const filterStartDate = new Date(startDate);
    const filterEndDate = new Date(endDate);
    filterStartDate.setHours(0, 0, 0, 0);
    filterEndDate.setHours(23, 59, 59, 999);
    const resumenData = await resumenCuentaModel.getResumenCuentaByNegocio(
      parseInt(id),
      filterStartDate,
      filterEndDate,
    );
    res.json(resumenData);
  } catch (error) {
    console.error("Error al obtener el resumen de cuenta por negocio:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el resumen de cuenta por negocio" });
  }
};
const resumenDia = async (req, res) => {
  try {
    const { cajaId } = req.query;

    if (!cajaId) {
      return res.status(400).json({ error: "El ID de la caja es obligatorio" });
    }

    const resumenData = await resumenCuentaModel.getResumenDia(
      parseInt(cajaId)
    );
    res.json(resumenData);
  } catch (error) {
    console.error("Error al obtener el resumen del día:", error);
    res.status(500).json({ error: "Error al obtener el resumen del día" });
  }
};

module.exports = {
  getResumenCuentaByNegocio,
  resumenDia,
};
