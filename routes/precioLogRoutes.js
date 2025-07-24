const express = require("express");
const router = express.Router();
const precioLogController = require("../controllers/precioLogController");
const { verifyToken } = require("../auth");

router.get("/precioLogs/:articuloId", verifyToken, precioLogController.getPrecioLogs);

module.exports = router;