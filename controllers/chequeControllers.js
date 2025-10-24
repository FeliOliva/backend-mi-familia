const chequeModel = require("../models/chequeModel");

const getCheques = async (req, res) => {
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
    const chequesData = await chequeModel.getAllCheques(
      limitNumber,
      pageNumber
    );
    res.json(chequesData);
  } catch (error) {
    console.error("Error al obtener los cheques:", error);
    res.status(500).json({ error: "Error al obtener los cheques" });
  }
};
const getChequeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    const chequeData = await chequeModel.getChequeById(id);
    res.json(chequeData);
  } catch (error) {
    console.error("Error al obtener el cheque por id:", error);
    res.status(500).json({ error: "Error al obtener el cheque por id" });
  }
};
const getChequesByNegocio = async (req, res) => {
  try {
    const { id } = req.params;
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

    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const chequesData = await chequeModel.getChequesByNegocio(
      id,
      limitNumber,
      pageNumber
    );

    res.json(chequesData);
  } catch (error) {
    console.error("Error al obtener los cheques por negocio:", error);
    res.status(500).json({ error: "Error al obtener los cheques por negocio" });
  }
};
const addCheque = async (req, res) => {
  try {
    const { banco, nroCheque, fechaEmision, fechaCobro, monto, negocioId } =
      req.body;
    console.log("data del cheque en add: ", res.body);
    // Verificar que todos los campos estén presentes
    if (
      !banco ||
      !nroCheque ||
      !fechaEmision ||
      !fechaCobro ||
      !monto ||
      !negocioId
    ) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    // Función para convertir "DD/MM/YYYY" a formato ISO
    const parseDate = (dateString) => {
      const [day, month, year] = dateString.split("/").map(Number);
      return new Date(year, month - 1, day).toISOString(); // Formato ISO
    };

    const cheque = {
      banco: banco.toUpperCase(),
      nroCheque,
      fechaEmision: parseDate(fechaEmision),
      fechaCobro: parseDate(fechaCobro),
      monto: monto,
      negocioId: parseInt(negocioId, 10),
    };
    const newCheque = await chequeModel.addCheque(cheque);

    res.json(newCheque);
  } catch (error) {
    console.error("Error al agregar cheque:", error);
    res.status(500).json({ error: "Error al agregar cheque" });
  }
};

const updateCheque = async (req, res) => {
  try {
    const { id } = req.params;
    const { banco, nroCheque, fechaEmision, fechaCobro, monto, negocioId } =
      req.body;
    if (
      !banco ||
      !nroCheque ||
      !fechaEmision ||
      !fechaCobro ||
      !monto ||
      !negocioId
    ) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    // Función para convertir "DD/MM/YYYY" a formato ISO
    const parseDate = (dateString) => {
      const [day, month, year] = dateString.split("/").map(Number);
      return new Date(year, month - 1, day).toISOString(); // Formato ISO
    };
    const updatedCheque = await chequeModel.updateCheque(id, {
      banco: banco.toUpperCase(),
      nroCheque,
      fechaEmision: parseDate(fechaEmision),
      fechaCobro: parseDate(fechaCobro),
      monto: parseInt(monto),
      negocioId: parseInt(negocioId),
    });
    res.json(updatedCheque);
  } catch (error) {
    console.error("Error al actualizar cheque:", error);
    res.status(500).json({ error: "Error al actualizar cheque" });
  }
};
const deleteCheque = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    await clearChequeCache();
    await chequeModel.updateChequeStatus(id, 0);
    res.json({ message: "Cheque eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar cheque:", error);
    res.status(500).json({ error: "Error al eliminar cheque" });
  }
};
const upCheque = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    await clearChequeCache();
    await chequeModel.updateChequeStatus(id, 1);
    res.json({ message: "Cheque actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar cheque:", error);
    res.status(500).json({ error: "Error al actualizar cheque" });
  }
};
module.exports = {
  getCheques,
  getChequeById,
  getChequesByNegocio,
  addCheque,
  updateCheque,
  deleteCheque,
  upCheque,
};
