const express = require("express");
const router = express.Router();
const { verifyToken, requireRol } = require("../auth");
const { bancos, motivosGasto } = require("../controllers/catalogosController");

// Listar: cualquier usuario logueado (el repartidor elige de la lista).
// Alta y edicion: solo admin (0) y encargado de ventas (1).
const soloAdminYEncargado = requireRol(0, 1);

router.get("/bancos", verifyToken, bancos.listar);
router.post("/bancos", verifyToken, soloAdminYEncargado, bancos.crear);
router.put("/bancos/:id", verifyToken, soloAdminYEncargado, bancos.actualizar);

router.get("/motivosGasto", verifyToken, motivosGasto.listar);
router.post("/motivosGasto", verifyToken, soloAdminYEncargado, motivosGasto.crear);
router.put("/motivosGasto/:id", verifyToken, soloAdminYEncargado, motivosGasto.actualizar);

module.exports = router;
