const resumenCuentaModel = require("../models/resumenCuentaModel");

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
    
    // Extender el rango hasta el final del día siguiente en hora local
    // Esto asegura que incluya todos los registros del día solicitado en UTC
    // Ejemplo: Si pedimos hasta el 28 y estamos en UTC-3:
    // - Fin del día 28 local = 02:59:59 del 29 UTC
    // - Pero un registro a las 00:59:54 del 28 local = 03:59:54 del 28 UTC
    // - Necesitamos incluir hasta el final del día siguiente (29) para capturar todos los registros del 28
    const fechaFinSiguienteDia = new Date(añoFin, mesFin, diaFin + 1, 23, 59, 59, 999);
    const filterEndDate = fechaFinSiguienteDia;
    
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
  resumenDia,
};
