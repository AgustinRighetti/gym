const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de Multer (memoria para subir a Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
});

/**
 * GET /api/noticias
 * Lista las noticias. Si es ADMIN, ve todas. Si es SOCIO/Público, solo PUBLICADO.
 */
router.get('/', async (req, res) => {
  try {
    const { rol } = req.query; // Podríamos usar el token si estuviera presente, pero permitimos público
    
    // Si no hay token o no es admin, solo mostrar publicadas
    let whereClause = { estado: 'PUBLICADO' };
    
    // Nota: En una app real, verificaríamos el token aquí. 
    // Por simplicidad y según el pedido, permitimos un flag o verificamos si hay auth.
    // Pero el requisito dice: "públicas si estado=PUBLICADO, todas si ADMIN"
    
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.rol === 'ADMIN') {
          whereClause = {}; // Admin ve todo
        }
      } catch (err) {
        // Token inválido, seguimos como público
      }
    }

    const noticias = await prisma.noticia.findMany({
      where: whereClause,
      orderBy: { fecha: 'desc' },
    });
    res.json(noticias);
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    res.status(500).json({ message: 'Error al obtener las noticias' });
  }
});

/**
 * POST /api/noticias
 * Crea una noticia con upload a Cloudinary (solo ADMIN)
 */
router.post('/', authenticateToken, requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { titulo, contenido, estado } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'La imagen es obligatoria' });
    }

    // Subir a Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'impulso_gym_noticias',
    });

    const noticia = await prisma.noticia.create({
      data: {
        titulo,
        contenido,
        estado: estado || 'BORRADOR',
        imagen: result.secure_url,
      },
    });

    res.status(201).json(noticia);
  } catch (error) {
    console.error('Error al crear noticia:', error);
    res.status(500).json({ message: 'Error al crear la noticia' });
  }
});

/**
 * PUT /api/noticias/:id
 * Edita una noticia (solo ADMIN)
 */
router.put('/:id', authenticateToken, requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, contenido, estado } = req.body;
    
    let updateData = {
      titulo,
      contenido,
      estado,
    };

    // Si hay una nueva imagen, subirla y actualizar la URL
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'impulso_gym_noticias',
      });
      updateData.imagen = result.secure_url;
    }

    const noticia = await prisma.noticia.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(noticia);
  } catch (error) {
    console.error('Error al editar noticia:', error);
    res.status(500).json({ message: 'Error al editar la noticia' });
  }
});

/**
 * DELETE /api/noticias/:id
 * Elimina noticia y su imagen de Cloudinary (solo ADMIN)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const noticia = await prisma.noticia.findUnique({
      where: { id: parseInt(id) },
    });

    if (!noticia) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    // Extraer public_id de la URL de Cloudinary para borrarla
    // Ejemplo URL: https://res.cloudinary.com/demo/image/upload/v12345678/impulso_gym_noticias/abc123.jpg
    const parts = noticia.imagen.split('/');
    const fileName = parts[parts.length - 1].split('.')[0]; // abc123
    const folderName = parts[parts.length - 2]; // impulso_gym_noticias
    const publicId = `${folderName}/${fileName}`;

    await cloudinary.uploader.destroy(publicId);

    await prisma.noticia.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Noticia eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    res.status(500).json({ message: 'Error al eliminar la noticia' });
  }
});

module.exports = router;
