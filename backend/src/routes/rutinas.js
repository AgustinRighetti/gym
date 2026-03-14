const express = require('express');
const router = express.Router();
const {
  getRutinasPorSocio,
  createRutina,
  getRutinaById,
  updateRutina,
  deleteRutina
} = require('../controllers/rutinaController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Obtener rutinas de un socio
router.get('/socio/:socioId', getRutinasPorSocio);

// Crear rutina (solo admin)
router.post('/', requireAuth, requireAdmin, createRutina);

// Obtener rutina por ID
router.get('/:id', getRutinaById);

// Actualizar rutina (solo admin)
router.put('/:id', requireAuth, requireAdmin, updateRutina);

// Eliminar rutina (solo admin)
router.delete('/:id', requireAuth, requireAdmin, deleteRutina);

module.exports = router;
