const express = require("express");
const router = express.Router();
const estadisticasController = require("../controllers/estadisticasController");

router.get("/estadisticas", estadisticasController.getEstadisticas);
router.get("/estadisticas/productos-vendidos", estadisticasController.getProductosVendidos);
router.get("/estadisticas/productos-clientes", estadisticasController.getProductosClientes);

module.exports = router;
