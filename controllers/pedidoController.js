const pedidoModel = require("../models/pedidoModel");

const getPedidos = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      100
    );
    const estado = req.query.estado || "todos";

    const pedidosData = await pedidoModel.getPedidos({
      limit,
      page,
      estado,
    });

    res.status(200).json(pedidosData);
  } catch (error) {
    console.error("Error al obtener los pedidos:", error);
    res.status(500).json({ error: "Error al obtener los pedidos" });
  }
};

const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        error: "El id es obligatorio",
      });
    }
    const pedido = await pedidoModel.getPedidoById(id);
    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    res.json(pedido);
  } catch (error) {
    console.error("Error al obtener el pedido:", error);
    res.status(500).json({
      error: "Error al obtener el pedido",
    });
  }
};

const createPedido = async (req, res) => {
  try {
    const { detalles } = req.body;

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        error: "Debe incluir al menos un producto en el pedido",
      });
    }

    // Validar que cada detalle tenga los campos requeridos
    for (const detalle of detalles) {
      if (!detalle.productoId || !detalle.cantidad || !detalle.tipoUnidadId) {
        return res.status(400).json({
          error: "Cada detalle debe tener productoId, cantidad y tipoUnidadId",
        });
      }
      if (detalle.cantidad <= 0) {
        return res.status(400).json({
          error: "La cantidad debe ser mayor a 0",
        });
      }
    }

    const newPedido = await pedidoModel.createPedido(detalles);
    res.status(201).json(newPedido);
  } catch (error) {
    console.error("Error al crear el pedido:", error);
    res.status(500).json({ error: "Error al crear el pedido" });
  }
};

const deletePedido = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    const pedido = await pedidoModel.getPedidoById(id);
    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    await pedidoModel.deletePedido(id);
    res.json({ message: "Pedido eliminado correctamente", id: parseInt(id) });
  } catch (error) {
    console.error("Error al eliminar el pedido:", error);
    res.status(500).json({ error: "Error al eliminar el pedido" });
  }
};

const updatePedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { detalles } = req.body;

    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    const pedidoExistente = await pedidoModel.getPedidoById(id);
    if (!pedidoExistente) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        error: "Debe incluir al menos un producto en el pedido",
      });
    }

    // Validar que cada detalle tenga los campos requeridos
    for (const detalle of detalles) {
      if (!detalle.productoId || !detalle.cantidad || !detalle.tipoUnidadId) {
        return res.status(400).json({
          error: "Cada detalle debe tener productoId, cantidad y tipoUnidadId",
        });
      }
      if (detalle.cantidad <= 0) {
        return res.status(400).json({
          error: "La cantidad debe ser mayor a 0",
        });
      }
    }

    const updatedPedido = await pedidoModel.updatePedido(id, detalles);
    res.json(updatedPedido);
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    res.status(500).json({ error: "Error al actualizar el pedido" });
  }
};

module.exports = {
  getPedidos,
  getPedidoById,
  createPedido,
  deletePedido,
  updatePedido,
};


