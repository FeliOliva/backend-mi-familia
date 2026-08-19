const express = require("express");
const router = express.Router();
const presupuestoController = require("../controllers/presupuestoController");
const { verifyToken } = require("../auth");

router.get("/presupuestos", verifyToken, presupuestoController.getPresupuestos);
router.get(
  "/presupuestos/:id",
  verifyToken,
  presupuestoController.getPresupuestoById
);
router.post(
  "/presupuestos",
  verifyToken,
  presupuestoController.createPresupuesto
);
router.put(
  "/presupuestos/:id",
  verifyToken,
  presupuestoController.updatePresupuesto
);
router.delete(
  "/presupuestos/:id",
  verifyToken,
  presupuestoController.deletePresupuesto
);
router.post(
  "/presupuestos/:id/convertir-venta",
  verifyToken,
  presupuestoController.convertirAVenta
);

module.exports = router;
