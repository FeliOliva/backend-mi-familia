const express = require("express");
const router = express.Router();
const cajaControllers = require("../controllers/cajaControllers");
const { verifyToken } = require("../auth");

router.get("/caja", verifyToken, cajaControllers.getCaja);
router.post("/cierre-caja", verifyToken, cajaControllers.crearCierreCaja);
router.get(
  "/cierre-caja/:id/detalle-metodos",
  verifyToken,
  cajaControllers.getDetalleMetodosPorCierre
);
router.get("/cierres-caja", cajaControllers.getCierresCaja);
router.patch(
  "/cierre-caja/:id/cerrar",
  verifyToken,
  cajaControllers.cerrarCierreCajaPendiente
);
router.get("/caja/:id", verifyToken, cajaControllers.getCajaById);
router.patch("/cierre-caja/:id", verifyToken, cajaControllers.editarCierreCaja);

module.exports = router;
