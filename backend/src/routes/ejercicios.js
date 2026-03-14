const express = require('express');
const router = express.Router();
const {
  getEjercicios,
  createEjercicio,
  getEjercicioById,
  updateEjercicio,
  deleteEjercicio
} = require('../controllers/ejercicioController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Listar todos
router.get('/', getEjercicios);

// Crear (solo admin)
router.post('/', requireAuth, requireAdmin, createEjercicio);

// Obtener por ID
router.get('/:id', getEjercicioById);

// Actualizar (solo admin)
router.put('/:id', requireAuth, requireAdmin, updateEjercicio);

// Eliminar (solo admin)
router.delete('/:id', requireAuth, requireAdmin, deleteEjercicio);

module.exports = router;
