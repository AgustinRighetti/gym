const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function register(req, res) {
  try {
    const { dni, nombre, apellido, email, password, rol, telefono, plan } = req.body;

    if (!dni || !nombre || !password) {
      return res.status(400).json({ message: 'DNI, nombre y contraseña son obligatorios' });
    }

    const existingDni = await prisma.user.findUnique({ where: { dni } });
    if (existingDni) {
      return res.status(409).json({ message: 'El DNI ya está registrado' });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ message: 'El Email ya está registrado' });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const userRole = rol && rol === 'ADMIN' ? 'ADMIN' : 'SOCIO';

    const user = await prisma.user.create({
      data: {
        dni,
        nombre,
        email: email || null,
        password: hashed,
        rol: userRole,
      },
    });

    if (userRole === 'SOCIO') {
      const socioData = {
        usuarioId: user.id,
        nombre,
        apellido: apellido || '',
        telefono: telefono || null,
        plan: plan || 'UN_DIA',
      };

      await prisma.socio.create({ data: socioData });
    }

    const token = jwt.sign(
      { userId: user.id, rol: user.rol, dni: user.dni },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: { id: user.id, dni: user.dni, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

async function login(req, res) {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'DNI/Email y contraseña son obligatorios' });
    }

    // Buscar por DNI o por Email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { dni: identifier },
          { email: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, rol: user.rol, dni: user.dni },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, dni: user.dni, nombre: user.nombre, rol: user.rol } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

module.exports = {
  register,
  login,
};
