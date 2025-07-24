const express = require("express");
const router = express.Router();
const { verifyToken } = require("../auth");
const chequeControllers = require("../controllers/chequeControllers");

router.get("/cheques", verifyToken, chequeControllers.getCheques);
router.get("/cheques/:id", verifyToken, chequeControllers.getChequeById);
router.get("/cheques/negocio/:id", verifyToken, chequeControllers.getChequesByNegocio);
router.post("/cheques", verifyToken, chequeControllers.addCheque);
router.put("/cheques/:id", verifyToken, chequeControllers.updateCheque);
router.delete("/cheques/:id", verifyToken, chequeControllers.deleteCheque);
router.post("/cheques/:id", verifyToken, chequeControllers.upCheque)

module.exports = router;