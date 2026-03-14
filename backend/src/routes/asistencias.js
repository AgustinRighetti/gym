const express = require('express');
const router = express.Router();
const {
    registrarAsistenciaDNI,
    getAsistenciasSocio,
    getAsistenciasSemana,
} = require('../controllers/asistenciaController');
const { authenticateToken } = require('../middleware/auth');

// POST /asistencias/checkin — público (sin JWT, para tecladito DNI)
router.post('/checkin', registrarAsistenciaDNI);

// GET /asistencias/socio/:socioId — autenticado (admin o el propio socio)
router.get('/socio/:socioId', authenticateToken, getAsistenciasSocio);

// GET /asistencias/semana — solo admin
router.get('/semana', authenticateToken, getAsistenciasSemana);

module.exports = router;
