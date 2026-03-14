const prisma = require('../prisma');
const { buscarEjercicioWger, obtenerImagenEjercicio } = require('../services/wgerService');

// Listar todos los ejercicios
async function getEjercicios(req, res) {
  try {
    const ejercicios = await prisma.ejercicio.findMany({
      orderBy: { grupoMuscular: 'asc' }
    });
    res.json(ejercicios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener ejercicios' });
  }
}

// Crear ejercicio nuevo (busca imagen en Wger automáticamente)
async function createEjercicio(req, res) {
  try {
    const { nombre, grupoMuscular, descripcion } = req.body;

    if (!nombre || !grupoMuscular) {
      return res.status(400).json({ message: 'Nombre y grupo muscular son requeridos' });
    }

    // Buscar en Wger
    let imageUrl = null;
    let wgerBaseId = null;

    try {
      wgerBaseId = await buscarEjercicioWger(nombre);
      if (wgerBaseId) {
        imageUrl = await obtenerImagenEjercicio(wgerBaseId);
      }
    } catch (error) {
      console.warn('No se pudo obtener imagen de Wger:', error.message);
    }

    const ejercicio = await prisma.ejercicio.create({
      data: {
        nombre,
        grupoMuscular,
        descripcion: descripcion || null,
        imageUrl,
        wgerBaseId
      }
    });

    res.status(201).json(ejercicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear ejercicio' });
  }
}

// Obtener un ejercicio por ID
async function getEjercicioById(req, res) {
  try {
    const { id } = req.params;
    const ejercicio = await prisma.ejercicio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ejercicio) {
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }

    res.json(ejercicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener ejercicio' });
  }
}

// Actualizar ejercicio
async function updateEjercicio(req, res) {
  try {
    const { id } = req.params;
    const { nombre, grupoMuscular, descripcion, imageUrl } = req.body;

    const ejercicio = await prisma.ejercicio.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre && { nombre }),
        ...(grupoMuscular && { grupoMuscular }),
        ...(descripcion !== undefined && { descripcion }),
        ...(imageUrl && { imageUrl })
      }
    });

    res.json(ejercicio);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }
    res.status(500).json({ message: 'Error al actualizar ejercicio' });
  }
}

// Eliminar ejercicio
async function deleteEjercicio(req, res) {
  try {
    const { id } = req.params;

    await prisma.ejercicio.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Ejercicio eliminado' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }
    res.status(500).json({ message: 'Error al eliminar ejercicio' });
  }
}

module.exports = {
  getEjercicios,
  createEjercicio,
  getEjercicioById,
  updateEjercicio,
  deleteEjercicio
};
