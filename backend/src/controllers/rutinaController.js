const prisma = require('../prisma');

// Obtener rutinas de un socio con ejercicios
async function getRutinasPorSocio(req, res) {
  try {
    const { socioId } = req.params;

    const rutinas = await prisma.rutina.findMany({
      where: { socios: { some: { socioId: parseInt(socioId) } } },
      include: {
        ejercicios: {
          include: {
            ejercicio: true
          },
          orderBy: { diaSemana: 'asc' }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(rutinas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener rutinas' });
  }
}

// Crear nueva rutina
async function createRutina(req, res) {
  try {
    const { nombre, descripcion, socioId, ejercicios } = req.body;

    if (!nombre || !socioId) {
      return res.status(400).json({ message: 'Nombre y socioId son requeridos' });
    }

    // Verificar que el socio existe
    const socio = await prisma.socio.findUnique({
      where: { id: parseInt(socioId) }
    });

    if (!socio) {
      return res.status(404).json({ message: 'Socio no encontrado' });
    }

    const rutina = await prisma.rutina.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        socios: { create: { socioId: parseInt(socioId) } },
        ejercicios: {
          create: ejercicios && ejercicios.length > 0 ? ejercicios.map(e => ({
            ejercicioId: parseInt(e.ejercicioId),
            series: parseInt(e.series),
            repeticiones: parseInt(e.repeticiones),
            diaSemana: e.diaSemana,
            notas: e.notas || null
          })) : []
        }
      },
      include: {
        ejercicios: {
          include: { ejercicio: true }
        }
      }
    });

    res.status(201).json(rutina);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear rutina' });
  }
}

// Obtener rutina por ID
async function getRutinaById(req, res) {
  try {
    const { id } = req.params;

    const rutina = await prisma.rutina.findUnique({
      where: { id: parseInt(id) },
      include: {
        socios: { include: { socio: true } },
        ejercicios: {
          include: { ejercicio: true },
          orderBy: { diaSemana: 'asc' }
        }
      }
    });

    if (!rutina) {
      return res.status(404).json({ message: 'Rutina no encontrada' });
    }

    res.json(rutina);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener rutina' });
  }
}

// Actualizar rutina
async function updateRutina(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, ejercicios } = req.body;

    // Actualizar datos básicos
    const rutina = await prisma.rutina.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion })
      }
    });

    // Si hay ejercicios, actualizar la relación
    if (ejercicios) {
      // Eliminar ejercicios anteriores
      await prisma.rutinaEjercicio.deleteMany({
        where: { rutinaId: parseInt(id) }
      });

      // Crear nuevos
      if (ejercicios.length > 0) {
        await prisma.rutinaEjercicio.createMany({
          data: ejercicios.map(e => ({
            rutinaId: parseInt(id),
            ejercicioId: parseInt(e.ejercicioId),
            series: parseInt(e.series),
            repeticiones: parseInt(e.repeticiones),
            diaSemana: e.diaSemana,
            notas: e.notas || null
          }))
        });
      }
    }

    // Obtener la rutina actualizada
    const rutinaActualizada = await prisma.rutina.findUnique({
      where: { id: parseInt(id) },
      include: {
        ejercicios: {
          include: { ejercicio: true },
          orderBy: { diaSemana: 'asc' }
        }
      }
    });

    res.json(rutinaActualizada);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Rutina no encontrada' });
    }
    res.status(500).json({ message: 'Error al actualizar rutina' });
  }
}

// Eliminar rutina
async function deleteRutina(req, res) {
  try {
    const { id } = req.params;

    await prisma.rutina.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Rutina eliminada' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Rutina no encontrada' });
    }
    res.status(500).json({ message: 'Error al eliminar rutina' });
  }
}

module.exports = {
  getRutinasPorSocio,
  createRutina,
  getRutinaById,
  updateRutina,
  deleteRutina
};
