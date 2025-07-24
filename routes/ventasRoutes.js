const express = require("express");
const router = express.Router();
const ventasController = require("../controllers/ventasController");
const { verifyToken } = require("../auth");

router.get("/ventas", verifyToken, ventasController.getVentas);
router.get(
  "/ventas/pendientes",
  verifyToken,
  ventasController.getVentasPendientes
);
router.get(
  "/ventas/negocio/:id",
  verifyToken,
  ventasController.getVentasByNegocioId
);
router.get(
  "/ventas/negocio/:negocioId",
  verifyToken,
  ventasController.getVentasByNegocio
);
router.get("/ventas/:id", verifyToken, ventasController.getVentaById);
router.post("/ventas", verifyToken, ventasController.addVenta);
router.delete("/ventas/:id", verifyToken, ventasController.dropVenta);

module.exports = router;
