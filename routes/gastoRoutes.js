const express = require("express");
const router = express.Router();
const gastoController = require("../controllers/gastoController");
const { verifyToken } = require("../auth");

router.get("/gastos", verifyToken, gastoController.getGastos);
router.get("/gastos/dia", verifyToken, gastoController.getGastosDelDia);
router.get(
  "/gastos/totales-dia-caja",
  verifyToken,
  gastoController.getTotalesGastosDelDiaPorCaja
);
router.get("/gastos/:id", verifyToken, gastoController.getGastoById);
router.post("/gastos", verifyToken, gastoController.addGasto);
router.put("/gastos/:id", verifyToken, gastoController.updateGasto);
router.delete("/gastos/:id", verifyToken, gastoController.dropGasto);

module.exports = router;
