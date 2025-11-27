const negocioModel = require("../models/negocioModel");

const getNegocios = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    if (pageNumber < 1 || limitNumber < 1) {
      return res
        .status(400)
        .json({ error: "Los parámetros de paginación no son válidos" });
    }

    const negociosData = await negocioModel.getNegocios(
      limitNumber,
      pageNumber
    );
    res.status(200).json(negociosData);
  } catch (error) {
    console.error("Error al obtener los negocios:", error);
    res.status(500).json({ error: "Error al obtener los negocios" });
  }
};

const getAllNegocios = async (req, res) => {
  try {
    const negociosData = await negocioModel.getAllNegocios();
    res.status(200).json(negociosData);
  } catch (error) {
    console.error("Error al obtener los negocios:", error);
    res.status(500).json({ error: "Error al obtener los negocios" });
  }
};
const getNegocioById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    const negocio = await negocioModel.getNegocioById(id);
    res.json(negocio);
  } catch (error) {
    console.error("Error al obtener el negocio:", error);
    res.status(500).json({ error: "Error al obtener el negocio" });
  }
};
const addNegocio = async (req, res) => {
  try {
    const { nombre, direccion, esCuentaCorriente, esEditable, rol_usuario } =
      req.body;
    if (![0, 1].includes(rol_usuario)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para realizar esta acción" });
    }
    if (!nombre || !direccion) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const newNegocio = await negocioModel.addNegocio({
      nombre: nombre.toUpperCase(),
      direccion: direccion.toUpperCase(),
      esCuentaCorriente: !!esCuentaCorriente,
      esEditable: !!esEditable, // ⬅️ nuevo
    });
    res.json(newNegocio);
  } catch (error) {
    console.error("Error al agregar un negocio:", error);
    res.status(500).json({ error: "Error al agregar el negocio" });
  }
};
const updateNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    const { nombre, direccion, esCuentaCorriente, esEditable, rol_usuario } =
      req.body;
    if (rol_usuario !== 0) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para realizar esta acción" });
    }

    if (!nombre || !direccion) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const negocio = await negocioModel.getNegocioById(id);
    if (!negocio) {
      return res.status(404).json({ error: "El negocio no existe" });
    }
    await negocioModel.updateNegocio(id, {
      nombre: nombre.toUpperCase(),
      direccion: direccion.toUpperCase(),
      esCuentaCorriente,
      esEditable,
    });
    res.status(200).json({ message: "Negocio actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el negocio:", error);
    res.status(500).json({ error: "Error al actualizar el negocio" });
  }
};

const deleteNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    const deletedNegocio = await negocioModel.updateNegocioStatus(id, 0);
    res.json(deletedNegocio);
  } catch (error) {
    console.error("Error al eliminar el negocio:", error);
    res.status(500).json({ error: "Error al eliminar el negocio" });
  }
};
const upNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    const upNegocio = await negocioModel.updateNegocioStatus(id, 1);
    res.json(upNegocio);
  } catch (error) {
    console.error("Error al activar el negocio:", error);
    res.status(500).json({ error: "Error al activar el negocio" });
  }
};

const deshabilitarNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    await negocioModel.updateNegocioStatus(id, 0);
    res.json({ message: "Negocio deshabilitado" });
  } catch (error) {
    res.status(500).json({ error: "Error al deshabilitar el negocio" });
  }
};

const habilitarNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    await negocioModel.updateNegocioStatus(id, 1);
    res.json({ message: "Negocio habilitado" });
  } catch (error) {
    res.status(500).json({ error: "Error al habilitar el negocio" });
  }
};

module.exports = {
  getNegocios,
  addNegocio,
  updateNegocio,
  deleteNegocio,
  upNegocio,
  getNegocioById,
  getAllNegocios,
  deshabilitarNegocio,
  habilitarNegocio,
};
