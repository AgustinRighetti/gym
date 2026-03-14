const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifica que el token sea válido
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Verifica que el usuario sea ADMIN
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol ADMIN' });
  }
  next();
}

// Mantener authenticateToken por si otros archivos lo usan
const authenticateToken = requireAuth;

module.exports = {
  authenticateToken,
  requireAuth,
  requireAdmin,
};