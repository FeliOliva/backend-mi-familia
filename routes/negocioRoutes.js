const express = require("express");
const router = express.Router();
const negocioController = require("../controllers/negocioController");
const { verifyToken } = require("../auth");

router.get("/negocio", verifyToken, negocioController.getNegocios);
router.get("/getAllNegocios", verifyToken, negocioController.getAllNegocios);
router.get("/negocio/:id", verifyToken, negocioController.getNegocioById);
router.post("/negocio", verifyToken, negocioController.addNegocio);
router.put("/negocio/:id", verifyToken, negocioController.updateNegocio);
router.delete("/negocio/:id", verifyToken, negocioController.deleteNegocio);
router.post("/negocio/:id", verifyToken, negocioController.upNegocio);
router.put("/negocio/:id/deshabilitar", negocioController.deshabilitarNegocio);
router.put("/negocio/:id/habilitar", negocioController.habilitarNegocio);
module.exports = router;