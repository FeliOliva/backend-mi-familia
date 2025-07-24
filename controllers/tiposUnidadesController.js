const tipoUnidadesModel = require("../models/tiposUnidadesModel");
const getTiposUnidades = async (req, res) => {
  try {
    const tiposUnidades = await tipoUnidadesModel.getTiposUnidades();
    res.json(tiposUnidades);
  } catch (error) {
    console.error("Error al obtener los tipos de unidades:", error);
    res.status(500).json({ error: "Error al obtener los tipos de unidades" });
  }
};

const getTiposUnidadesById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Falta el id del tipo de unidad" });
    }
    const tipoUnidades = await tipoUnidadesModel.getTiposUnidadesById(id);
    res.json(tipoUnidades);
  } catch (error) {
    console.error("Error al obtener el tipo de unidad:", error);
    res.status(500).json({ error: "Error al obtener el tipo de unidad" });
  }
};
const addTiposUnidades = async (req, res) => {
  try {
    const { tipo } = req.body;
    if (!tipo) {
      return res
        .status(400)
        .json({ error: "Falta el tipo del tipo de unidad" });
    }
    const tipoNombre = tipo.toUpperCase();
    const tipoUnidades = await tipoUnidadesModel.addTiposUnidades(tipoNombre);
    res.json(tipoUnidades);
  } catch (error) {
    console.error("Error al añadir el tipo de unidad:", error);
    res.status(500).json({ error: "Error al añadir el tipo de unidad" });
  }
};

const updateTiposUnidades = async (req, res) => {
  try {
    const { tipo } = req.body;
    const { id } = req.params;
    if (!id || !tipo) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const tipoNombre = tipo.toUpperCase();
    const updatedTipoUnidades = await tipoUnidadesModel.updateTiposUnidades(
      id,
      tipoNombre
    );
    res.json(updatedTipoUnidades);
  } catch (error) {
    console.error("Error al actualizar el tipo de unidad:", error);
    res.status(500).json({ error: "Error al actualizar el tipo de unidad" });
  }
};

const dropTiposUnidades = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Falta el id del tipo de unidad" });
    }
    await tipoUnidadesModel.updateTipoUnidadesStatus(id, 0);
    res.json({ message: "Tipo de unidad eliminado" });
  } catch (error) {
    console.error("Error al eliminar el tipo de unidad:", error);
    res.status(500).json({ error: "Error al eliminar el tipo de unidad" });
  }
};

const upTiposUnidades = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Falta el id del tipo de unidad" });
    }
    const upTipoUnidades = await tipoUnidadesModel.updateTipoUnidadesStatus(
      id,
      1
    );
    res.json(upTipoUnidades);
  } catch (error) {
    console.error("Error al activar el tipo de unidad:", error);
    res.status(500).json({ error: "Error al activar el tipo de unidad" });
  }
};

module.exports = {
  getTiposUnidades,
  getTiposUnidadesById,
  addTiposUnidades,
  updateTiposUnidades,
  dropTiposUnidades,
  upTiposUnidades,
};
