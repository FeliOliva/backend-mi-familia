const express = require("express");
const router = express.Router();
const cajaControllers = require("../controllers/cajaControllers");
const { verifyToken } = require("../auth");

router.get("/caja", verifyToken, cajaControllers.getCaja);
router.get(
  "/cierre-caja/:id/detalle-metodos",
  verifyToken,
  cajaControllers.getDetalleMetodosPorCierre
);
router.get("/cierres-caja", cajaControllers.getCierresCaja);
router.get("/caja/:id", verifyToken, cajaControllers.getCajaById);
router.get(
  "/cierre-caja/:id/detalle-ventas",
  verifyToken,
  cajaControllers.getDetalleVentasPorCierre
);
router.post("/cierre-caja", verifyToken, cajaControllers.crearCierreCaja);
router.patch(
  "/cierre-caja/:id/cerrar",
  verifyToken,
  cajaControllers.cerrarCierreCajaPendiente
);
router.patch("/cierre-caja/:id", verifyToken, cajaControllers.editarCierreCaja);

module.exports = router;
