const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const resumenCuentaControllers = require('../controllers/resumenCuentaControllers');

router.get('/resumenCuenta/negocio/:id', verifyToken, resumenCuentaControllers.getResumenCuentaByNegocio);
router.get('/resumenCuenta/negocio/:id/saldo-anterior', verifyToken, resumenCuentaControllers.getSaldoAnteriorByNegocio);
router.get('/resumenDia', verifyToken, resumenCuentaControllers.resumenDia);

module.exports = router;
