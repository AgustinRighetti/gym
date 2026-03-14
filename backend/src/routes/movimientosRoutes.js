const express = require('express');
const router  = express.Router();
const { getMovimientos, getResumen, createMovimiento, deleteMovimiento } = require('../controllers/movimientosController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/',        getMovimientos);
router.get('/resumen', getResumen);
router.post('/',       createMovimiento);
router.delete('/:id',  deleteMovimiento);

module.exports = router;