const express = require("express");
const router = express.Router();
const tiposUnidadesController = require("../controllers/tiposUnidadesController");
const { verifyToken } = require("../auth");

router.get("/tiposUnidades", verifyToken, tiposUnidadesController.getTiposUnidades);
router.get("/tiposUnidades/:id", verifyToken, tiposUnidadesController.getTiposUnidadesById);
router.post("/tiposUnidades", verifyToken, tiposUnidadesController.addTiposUnidades);
router.put("/tiposUnidades/:id", verifyToken, tiposUnidadesController.updateTiposUnidades);
router.delete("/tiposUnidades/:id", verifyToken, tiposUnidadesController.dropTiposUnidades);
router.post("/tiposUnidades/:id", verifyToken, tiposUnidadesController.upTiposUnidades);

module.exports = router;