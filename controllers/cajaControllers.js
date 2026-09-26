const cajaModel = require("../models/cajaModel");

const crearAjusteCierreCaja = async (req, res) => {
  try {
    const cierreId = parseInt(req.params.id, 10);
    const {
      negocioId,
      ventaId,
      monto,
      metodoPago = "EFECTIVO",
      fechaOperacion,
      motivo,
    } = req.body;

    if (!Number.isInteger(cierreId) || cierreId <= 0) {
      return res.status(400).json({ error: "ID de cierre inválido" });
    }
    if (!Number.isInteger(Number(negocioId)) || Number(negocioId) <= 0) {
      return res.status(400).json({ error: "El negocio es obligatorio" });
    }
    if (!Number.isInteger(Number(monto)) || Number(monto) <= 0) {
      return res.status(400).json({ error: "El monto debe ser un entero mayor a cero" });
    }
    if (!fechaOperacion || !motivo || String(motivo).trim().length < 5) {
      return res.status(400).json({ error: "La fecha y el motivo son obligatorios" });
    }
    if (Number.isNaN(new Date(fechaOperacion).getTime())) {
      return res.status(400).json({ error: "La fecha de operación es inválida" });
    }
    const metodosPermitidos = new Set([
      "EFECTIVO",
      "TRANSFERENCIA/QR",
      "TARJETA DEBITO",
      "TARJETA CREDITO",
      "CHEQUE",
    ]);
    if (!metodosPermitidos.has(String(metodoPago).trim().toUpperCase())) {
      return res.status(400).json({ error: "Método de pago inválido" });
    }

    const ajuste = await cajaModel.crearAjusteCierreCaja({
      cierreId,
      negocioId: Number(negocioId),
      ventaId: ventaId ? Number(ventaId) : null,
      monto: Number(monto),
      metodoPago: String(metodoPago).trim().toUpperCase(),
      fechaOperacion,
      motivo: String(motivo).trim(),
      usuarioId: req.user.id,
    });

    res.status(201).json(ajuste);
  } catch (error) {
    console.error("Error al crear ajuste de cierre:", error);
    const status = error.code === "AJUSTE_CIERRE_ABIERTO" ? 409 : 400;
    res.status(status).json({ error: error.message || "Error al crear ajuste de cierre" });
  }
};

const getAjustesCierreCaja = async (req, res) => {
  try {
    const cierreId = parseInt(req.params.id, 10);
    if (!Number.isInteger(cierreId) || cierreId <= 0) {
      return res.status(400).json({ error: "ID de cierre inválido" });
    }
    res.json(await cajaModel.getAjustesCierreCaja(cierreId));
  } catch (error) {
    console.error("Error al obtener ajustes de cierre:", error);
    res.status(500).json({ error: "Error al obtener ajustes de cierre" });
  }
};

const getCaja = async (req, res) => {
  try {
    const cajas = await cajaModel.getCajas();
    res.status(200).json(cajas);
  } catch (error) {
    console.error("Error al obtener las cajas:", error);
    res.status(500).json({ error: "Error al obtener las cajas" });
  }
};

const crearCierreCaja = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const data = { ...req.body, usuarioId };
    console.log("data del cierre de caja: ", data);
    const cierre = await cajaModel.crearCierreCaja(data);
    res.status(201).json(cierre);
  } catch (error) {
    res.status(500).json({ error: "Error al crear cierre de caja" });
  }
};
const editarCierreCaja = async (req, res) => {
  try {
    const cierreId = parseInt(req.params.id);
    const { ingresoLimpio, estado } = req.body;

    const cierreActualizado = await cajaModel.editarCierreCaja(
      cierreId,
      ingresoLimpio,
      estado
    );

    res.json(cierreActualizado);
  } catch (error) {
    console.error("Error al editar cierre de caja:", error);
    res.status(500).json({ error: "Error al editar cierre de caja" });
  }
};

const getDetalleMetodosPorCierre = async (req, res) => {
  try {
    const cierreId = parseInt(req.params.id);
    const detalle = await cajaModel.getDetalleMetodosPorCierre(cierreId);
    res.json(detalle);
  } catch (error) {
    console.error("Error al obtener métodos de pago del cierre:", error);
    res
      .status(500)
      .json({ error: "Error al obtener detalle de métodos de pago" });
  }
};

const getCierresCaja = async (req, res) => {
  try {
    const cierres = await cajaModel.getCierresCaja();
    console.log("cierres", cierres);
    res.status(200).json(cierres);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener cierres de caja" });
  }
};

const cerrarCierreCajaPendiente = async (req, res) => {
  try {
    const cierreId = parseInt(req.params.id);
    const usuarioId = req.user.id;
    const cierre = await cajaModel.cerrarCierreCajaPendiente(
      cierreId,
      usuarioId
    );
    res.json(cierre);
  } catch (error) {
    res.status(500).json({ error: "Error al cerrar cierre pendiente" });
  }
};

const getCajaById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const caja = await cajaModel.getCajaById(id);
    if (!caja) {
      return res.status(404).json({ error: "Caja no encontrada" });
    }
    res.status(200).json(caja);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la caja" });
  }
};
const getDetalleVentasPorCierre = async (req, res) => {
  try {
    const cierreId = parseInt(req.params.id, 10);
    if (isNaN(cierreId)) {
      return res.status(400).json({ error: "ID de cierre inválido" });
    }

    const detalle = await cajaModel.getDetalleVentasPorCierre(cierreId);
    res.json(detalle);
  } catch (error) {
    console.error("Error al obtener detalle de ventas del cierre:", error);
    res
      .status(500)
      .json({ error: "Error al obtener detalle de ventas del cierre" });
  }
};

module.exports = {
  crearAjusteCierreCaja,
  getAjustesCierreCaja,
  getCaja,
  crearCierreCaja,
  getCierresCaja,
  cerrarCierreCajaPendiente,
  getCajaById,
  getDetalleMetodosPorCierre,
  editarCierreCaja,
  getDetalleVentasPorCierre,
};
