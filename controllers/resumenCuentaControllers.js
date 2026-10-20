const resumenCuentaModel = require("../models/resumenCuentaModel");

const parsearFechaLocal = (fecha, finDeDia = false) => {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(
    anio,
    mes - 1,
    dia,
    finDeDia ? 23 : 0,
    finDeDia ? 59 : 0,
    finDeDia ? 59 : 0,
    finDeDia ? 999 : 0
  );
};

const getSaldoAnteriorByNegocio = async (req, res) => {
  try {
    const negocioId = Number(req.params.id);
    const { startDate } = req.query;
    if (!Number.isInteger(negocioId) || !/^\d{4}-\d{2}-\d{2}$/.test(startDate || "")) {
      return res.status(400).json({ error: "El negocio y la fecha de inicio son obligatorios" });
    }

    const fechaInicio = parsearFechaLocal(startDate);
    if (Number.isNaN(fechaInicio.getTime())) {
      return res.status(400).json({ error: "La fecha de inicio es inválida" });
    }

    const saldoAnterior = await resumenCuentaModel.getSaldoAnteriorByNegocio(negocioId, fechaInicio);
    res.json({ saldoAnterior });
  } catch (error) {
    console.error("Error al obtener el saldo anterior del negocio:", error);
    res.status(500).json({ error: "Error al obtener el saldo anterior del negocio" });
  }
};

const getResumenCuentaByNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    console.log("fechas", startDate, endDate);

    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    const negocioId = parseInt(id, 10);
    if (Number.isNaN(negocioId)) {
      return res.status(400).json({ error: "El id es inválido" });
    }
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Las fechas de inicio y fin son obligatorias" });
    }
    const filterStartDate = parsearFechaLocal(startDate);
    const filterEndDate = parsearFechaLocal(endDate, true);
    
    console.log("Fechas procesadas - Inicio:", filterStartDate.toISOString(), "Fin:", filterEndDate.toISOString());
    const resumenData = await resumenCuentaModel.getResumenCuentaByNegocio(
      negocioId,
      filterStartDate,
      filterEndDate,
    );
    console.log("📊 Resumen de cuenta para negocio", id, ":", JSON.stringify(resumenData, null, 2));
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
  getSaldoAnteriorByNegocio,
  getResumenCuentaByNegocio,
  resumenDia,
};
