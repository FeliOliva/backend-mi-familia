const express = require("express");
const router = express.Router();
const entregasControllers = require("../controllers/entregasControllers");
const { verifyToken } = require("../auth");

router.get("/entregas", verifyToken, entregasControllers.getEntregas);
router.get(
  "/entregas/totales-dia-caja",
  verifyToken,
  entregasControllers.getTotalesEntregasDelDiaPorCaja
);
router.get("/entregas/:id", verifyToken, entregasControllers.getEntregaById);
router.get(
  "/entregas/venta/:ventaId",
  verifyToken,
  entregasControllers.getEntregasPorVenta
);
router.get(
  "/entregas/negocio/:negocioId",
  verifyToken,
  entregasControllers.getEntregasByNegocio
);
router.post(
  "/entregas/cambiarEstado",
  verifyToken,
  entregasControllers.cambiarEstadoVenta
);
router.post("/entregas", verifyToken, entregasControllers.addEntrega);
router.put("/entregas/:id", verifyToken, entregasControllers.updateEntrega);
router.delete("/entregas/:id", verifyToken, entregasControllers.dropEntrega);

module.exports = router;
