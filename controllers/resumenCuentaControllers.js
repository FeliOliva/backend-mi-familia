const resumenCuentaModel = require("../models/resumenCuentaModel");

const parseStartDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const getSaldoAnteriorByNegocio = async (req, res) => {
  try {
    const negocioId = Number.parseInt(req.params.id, 10);
    const fechaInicio = parseStartDate(req.query.startDate);
    if (!Number.isInteger(negocioId) || negocioId <= 0) {
      return res.status(400).json({ error: "El id es inválido" });
    }
    if (!fechaInicio) {
      return res.status(400).json({ error: "La fecha de inicio es inválida" });
    }

    const saldoAnterior = await resumenCuentaModel.getSaldoAnteriorByNegocio(
      negocioId,
      fechaInicio,
    );
    return res.json({ saldoAnterior });
  } catch (error) {
    console.error("Error al calcular saldo anterior del resumen:", error);
    return res.status(500).json({ error: "Error al calcular el saldo anterior" });
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
    // Parsear fechas y asegurar que incluyan todo el día en la zona horaria local
    // Parsear el string "YYYY-MM-DD" correctamente para evitar interpretación UTC
    const [añoInicioStr, mesInicioStr, diaInicioStr] = startDate.split('-');
    const añoInicio = parseInt(añoInicioStr, 10);
    const mesInicio = parseInt(mesInicioStr, 10) - 1; // Los meses en JS son 0-indexed
    const diaInicio = parseInt(diaInicioStr, 10);
    const filterStartDate = new Date(añoInicio, mesInicio, diaInicio, 0, 0, 0, 0);
    
    const [añoFinStr, mesFinStr, diaFinStr] = endDate.split('-');
    const añoFin = parseInt(añoFinStr, 10);
    const mesFin = parseInt(mesFinStr, 10) - 1; // Los meses en JS son 0-indexed
    const diaFin = parseInt(diaFinStr, 10);
    
    // Crear fecha de fin del día en hora local (23:59:59.999)
    const fechaFinLocal = new Date(añoFin, mesFin, diaFin, 23, 59, 59, 999);
    
    const filterEndDate = fechaFinLocal;
    
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
  getResumenCuentaByNegocio,
  getSaldoAnteriorByNegocio,
  resumenDia,
};
