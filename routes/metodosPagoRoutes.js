const express = require("express");
const router = express.Router();
const metodosPagoModel = require("../models/metodoPagoModel");
const { verifyToken } = require("../auth");

router.get("/metodosPago", verifyToken, metodosPagoModel.getMetodosPago);

module.exports = router;