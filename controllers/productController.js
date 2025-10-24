const productsModel = require("../models/productModel");

const getAllProducts = async (req, res) => {
  try {
    const productsData = await productsModel.getAllProducts();
    res.status(200).json(productsData);
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    res.status(500).json({ error: "Error al obtener los productos" });
  }
};
// controllers/productsController.js
const getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      100
    );

    const q = (req.query.q || "").trim(); // texto de búsqueda
    const estado = req.query.estado || "todos"; // "activos" | "inactivos" | "todos"

    const productsData = await productsModel.getProducts({
      limit,
      page,
      q,
      estado,
    });

    res.status(200).json(productsData);
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    res.status(500).json({ error: "Error al obtener los productos" });
  }
};
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        error: "El id es obligatorio",
      });
    }
    const product = await productsModel.getProductById(id);
    res.json(product);
  } catch (error) {
    console.error("Error al obtener el producto", error);
    res.status(500).json({
      error: "Error al obtener el cliente",
    });
  }
};
const addProduct = async (req, res) => {
  try {
    const { nombre, precio, precioInicial, tipoUnidadId, rol_usuario } =
      req.body;
    console.log("data desde el back", req.body);
    if (rol_usuario !== 0) {
      return res
        .status(401)
        .json({ error: "No tiene permiso para realizar esta accion" });
    }
    if (!nombre || !precio || !precioInicial || !tipoUnidadId) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const newProduct = await productsModel.addProduct({
      nombre: nombre.toUpperCase(),
      precio,
      precioInicial,
      tipoUnidadId,
    });
    res.json(newProduct);
  } catch (error) {
    console.error("Error al agregar el producto", error);
    res.status(500).json({ error: "Error al agregar el producto" });
  }
};
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, tipoUnidadId } = req.body;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    const product = await productsModel.getProductById(id);
    if (product.precio !== precio) {
      const precioAntiguo = product.precio;
      await productsModel.updatePrecio(id, {
        precioAntiguo,
        precioNuevo: precio,
      });
    }
    const updatedProduct = await productsModel.updateProduct(id, {
      nombre: nombre.toUpperCase(),
      precio,
      tipoUnidadId,
    });
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
};
const dropProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    const deletedProduct = await productsModel.updateProductStatus(id, 0);
    res.json(deletedProduct);
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};
const upProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }
    const upProduct = await productsModel.updateProductStatus(id, 1);
    res.json(upProduct);
  } catch (error) {
    console.error("Error al activar el producto:", error);
    res.status(500).json({ error: "Error al activar el producto" });
  }
};
module.exports = {
  getAllProducts,
  getProducts,
  getProductById,
  addProduct,
  dropProduct,
  updateProduct,
  upProduct,
};
