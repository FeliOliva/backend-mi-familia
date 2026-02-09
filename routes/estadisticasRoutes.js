const express = require("express");
const router = express.Router();
const estadisticasController = require("../controllers/estadisticasController");

router.get("/estadisticas", estadisticasController.getEstadisticas);

module.exports = router;
