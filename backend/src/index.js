const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sociosRoutes = require('./routes/socios');
const pagosRoutes = require('./routes/pagos');
const asistenciasRoutes = require('./routes/asistencias');
const movimientosRoutes = require('./routes/movimientosRoutes');
const ejerciciosRoutes = require('./routes/ejercicios');
const rutinasRoutes = require('./routes/rutinas');
const noticiasRoutes = require('./routes/noticias');
const planesRoutes = require('./routes/planes');

const app = express();

// Configuración de CORS - permitir requests desde Vercel
app.use(cors({
  origin: ['https://gym-frontend-nine-ebon.vercel.app', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// ── Servir imágenes de ejercicios como archivos estáticos ──────────────────
app.use('/ejercicios-img', express.static(path.join(__dirname, '../uploads/ejercicios')));

app.use('/auth', authRoutes);
app.use('/socios', sociosRoutes);
app.use('/pagos', pagosRoutes);
app.use('/asistencias', asistenciasRoutes);
app.use('/movimientos', movimientosRoutes);
app.use('/ejercicios', ejerciciosRoutes);
app.use('/rutinas', rutinasRoutes);
app.use('/noticias', noticiasRoutes);
app.use('/api/planes', planesRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

// Solo iniciar servidor si NO está en Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Exportar para Vercel
module.exports = app;