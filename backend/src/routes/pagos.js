const express = require('express');
const router = express.Router();
const { getPagos, createPago, updatePago } = require('../controllers/pagoController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getPagos);
router.post('/', authenticateToken, createPago);
router.put('/:id', authenticateToken, updatePago);

module.exports = router;
