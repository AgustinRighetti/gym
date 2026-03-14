const express = require('express');
const router = express.Router();
const {
    getSocios,
    createSocio,
    getSocioMe,
    updatePlanPendiente,
    cancelarPlanPendiente,
    deleteSocio,
} = require('../controllers/socioController');
const { authenticateToken } = require('../middleware/auth');

router.get('/me', authenticateToken, getSocioMe);
router.get('/', authenticateToken, getSocios);
router.post('/', authenticateToken, createSocio);
router.put('/:id/plan', authenticateToken, updatePlanPendiente);
router.delete('/:id/plan-pendiente', authenticateToken, cancelarPlanPendiente);
router.delete('/:id', authenticateToken, deleteSocio);

module.exports = router;
