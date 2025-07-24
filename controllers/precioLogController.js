const precioLogModel = require("../models/precioLogModel");

const getPrecioLogs = async (req, res) => {
    try {
        const { articuloId } = req.params;
        const { page, limit } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).json({ error: "Los parámetros de paginación no son válidos" });
        }
        const precioLogs = await precioLogModel.getPrecioLogs(parseInt(articuloId), limitNumber, pageNumber);

        res.json(precioLogs);
    } catch (error) {
        console.error("Error al obtener los precios de venta:", error);
        res.status(500).json({ error: "Error al obtener los precios de venta" });
    }
};

module.exports = { getPrecioLogs };