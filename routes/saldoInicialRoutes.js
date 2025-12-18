const express = require("express");
const router = express.Router();
const saldoInicialController = require("../controllers/saldoInicialController");
const { verifyToken } = require("../auth");

router.get("/saldos-iniciales", verifyToken, saldoInicialController.getSaldosIniciales);
router.get("/saldos-iniciales/:negocioId", verifyToken, saldoInicialController.getSaldoInicialByNegocio);
router.post("/saldos-iniciales", verifyToken, saldoInicialController.createSaldoInicial);
router.put("/saldos-iniciales/:id", verifyToken, saldoInicialController.updateSaldoInicial);
router.delete("/saldos-iniciales/:id", verifyToken, saldoInicialController.deleteSaldoInicial);

module.exports = router;


