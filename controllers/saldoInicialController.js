const saldoInicialModel = require("../models/saldoInicialModel");

const getSaldosIniciales = async (req, res) => {
  try {
    const saldos = await saldoInicialModel.getSaldosIniciales();
    res.status(200).json(saldos);
  } catch (error) {
    console.error("Error al obtener saldos iniciales:", error);
    res.status(500).json({ error: "Error al obtener los saldos iniciales" });
  }
};

const getSaldoInicialByNegocio = async (req, res) => {
  try {
    const { negocioId } = req.params;

    if (!negocioId) {
      return res.status(400).json({ error: "El negocioId es obligatorio" });
    }

    const saldo = await saldoInicialModel.getSaldoInicialByNegocio(negocioId);
    
    // Si no existe, devolver null en vez de error
    res.status(200).json(saldo);
  } catch (error) {
    console.error("Error al obtener saldo inicial:", error);
    res.status(500).json({ error: "Error al obtener el saldo inicial" });
  }
};

const createSaldoInicial = async (req, res) => {
  try {
    const { monto, descripcion, negocioId } = req.body;

    if (monto === undefined || monto === null) {
      return res.status(400).json({ error: "El monto es obligatorio" });
    }

    if (!negocioId) {
      return res.status(400).json({ error: "El negocioId es obligatorio" });
    }

    // Verificar si ya existe un saldo inicial para este negocio
    const existente = await saldoInicialModel.getSaldoInicialByNegocio(negocioId);
    if (existente) {
      return res.status(400).json({ 
        error: "Ya existe un saldo inicial para este negocio. Use PUT para actualizar." 
      });
    }

    const nuevoSaldo = await saldoInicialModel.createSaldoInicial({
      monto: parseInt(monto),
      descripcion,
      negocioId: parseInt(negocioId),
    });

    res.status(201).json(nuevoSaldo);
  } catch (error) {
    console.error("Error al crear saldo inicial:", error);
    res.status(500).json({ error: "Error al crear el saldo inicial" });
  }
};

const updateSaldoInicial = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, descripcion } = req.body;

    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    if (monto === undefined || monto === null) {
      return res.status(400).json({ error: "El monto es obligatorio" });
    }

    const saldoActualizado = await saldoInicialModel.updateSaldoInicial(id, {
      monto: parseInt(monto),
      descripcion,
    });

    res.status(200).json(saldoActualizado);
  } catch (error) {
    console.error("Error al actualizar saldo inicial:", error);
    res.status(500).json({ error: "Error al actualizar el saldo inicial" });
  }
};

const deleteSaldoInicial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    await saldoInicialModel.deleteSaldoInicial(id);
    res.status(200).json({ message: "Saldo inicial eliminado correctamente", id: parseInt(id) });
  } catch (error) {
    console.error("Error al eliminar saldo inicial:", error);
    res.status(500).json({ error: "Error al eliminar el saldo inicial" });
  }
};

module.exports = {
  getSaldosIniciales,
  getSaldoInicialByNegocio,
  createSaldoInicial,
  updateSaldoInicial,
  deleteSaldoInicial,
};


