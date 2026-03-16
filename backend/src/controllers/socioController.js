const prisma = require('../prisma');

const PLANES_VALIDOS = ['UN_DIA', 'DOS_DIAS', 'TRES_DIAS', 'LIBRE'];

// helper para chequear vencimientos
async function updateStates() {
  const socios = await prisma.socio.findMany({ include: { pagos: true } });
  const now = new Date();

  for (const socio of socios) {
    const lastPago = socio.pagos.sort((a, b) => b.fecha - a.fecha)[0];
    if (lastPago) {
      const diff = now - new Date(lastPago.fecha);
      const days = diff / (1000 * 60 * 60 * 24);
      // Si querés manejar estado, podrías agregar un campo "estado" al schema
    }
  }
}

async function getSocios(req, res) {
  try {
    await updateStates();
    const socios = await prisma.socio.findMany({
      include: {
        plan: true,
        planPendiente: true,
        pagos: { orderBy: { fecha: 'desc' } },
      },
    });
    res.json(socios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener socios' });
  }
}

async function createSocio(req, res) {
  try {
    const { nombre, apellido, email, telefono, plan } = req.body;
    if (!nombre || !apellido || !plan) {
      return res.status(400).json({ message: 'Faltan campos' });
    }

    if (email) {
      const existing = await prisma.socio.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ message: 'Email ya existe para otro socio' });
      }
    }

    // Buscar el plan por código
    const planRecord = await prisma.plan.findUnique({ where: { codigo: plan } });

    const socio = await prisma.socio.create({
      data: {
        nombre,
        apellido,
        email: email || null,
        password: '',
        telefono: telefono || null,
        planId: planRecord ? planRecord.id : null,
      },
    });

    res.status(201).json(socio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear socio' });
  }
}

async function getSocioMe(req, res) {
  try {
    const userId = req.user.userId;

    // Buscar el User para obtener el socioId
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.socioId) {
      return res.status(404).json({ message: 'Socio no encontrado' });
    }

    const socio = await prisma.socio.findUnique({
      where: { id: user.socioId },
      include: {
        plan: true,
        planPendiente: true,
        pagos: { orderBy: { fecha: 'desc' } },
      },
    });

    if (!socio) return res.status(404).json({ message: 'Socio no encontrado' });

    res.json(socio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener socio' });
  }
}

// PUT /socios/:id/plan — admin o socio
async function updatePlanPendiente(req, res) {
  try {
    const socioId = parseInt(req.params.id);
    const { plan } = req.body;
    const requesterRol = req.user.rol;

    if (!PLANES_VALIDOS.includes(plan)) {
      return res.status(400).json({ message: 'Plan inválido. Debe ser UN_DIA, DOS_DIAS, TRES_DIAS o LIBRE' });
    }

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: {
        plan: true,
        user: true,
        pagos: { orderBy: { fecha: 'desc' }, take: 1 },
      },
    });

    if (!socio) return res.status(404).json({ message: 'Socio no encontrado' });

    // Buscar el nuevo plan
    const planRecord = await prisma.plan.findUnique({ where: { codigo: plan } });
    if (!planRecord) return res.status(400).json({ message: 'Plan no encontrado' });

    // Validar que no sea el mismo plan actual
    if (socio.planId === planRecord.id) {
      return res.status(400).json({ message: 'El plan seleccionado es igual al plan actual' });
    }

    if (requesterRol === 'SOCIO') {
      const userId = req.user.userId;
      if (!socio.user || socio.user.id !== userId) {
        return res.status(403).json({ message: 'No tenés permiso para modificar este perfil' });
      }

      if (socio.planPendienteId) {
        return res.status(409).json({
          message: 'Ya tenés un cambio de plan pendiente.',
        });
      }
    }

    const updated = await prisma.socio.update({
      where: { id: socioId },
      data: {
        planPendienteId: planRecord.id,
      },
    });

    res.json({
      message: `Cambio a plan ${plan} programado para la próxima renovación`,
      socio: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el plan' });
  }
}

// DELETE /socios/:id — solo admin
async function deleteSocio(req, res) {
  try {
    if (req.user.rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Solo el admin puede eliminar socios' });
    }

    const socioId = parseInt(req.params.id);

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: { user: true },
    });

    if (!socio) return res.status(404).json({ message: 'Socio no encontrado' });

    // Eliminar en orden para respetar FKs
    // Primero eliminar el User asociado (tiene FK hacia Socio)
    if (socio.user) {
      await prisma.user.delete({ where: { id: socio.user.id } });
    }

    await prisma.$transaction([
      prisma.socioRutina.deleteMany({ where: { socioId } }),
      prisma.asistencia.deleteMany({ where: { socioId } }),
      prisma.pago.deleteMany({ where: { socioId } }),
      prisma.socio.delete({ where: { id: socioId } }),
    ]);

    res.json({ message: 'Socio eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el socio' });
  }
}

// DELETE /socios/:id/plan-pendiente — solo admin
async function cancelarPlanPendiente(req, res) {
  try {
    if (req.user.rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Solo el admin puede cancelar cambios de plan' });
    }

    const socioId = parseInt(req.params.id);

    const socio = await prisma.socio.findUnique({ where: { id: socioId } });
    if (!socio) return res.status(404).json({ message: 'Socio no encontrado' });

    if (!socio.planPendienteId) {
      return res.status(400).json({ message: 'Este socio no tiene un cambio de plan pendiente' });
    }

    await prisma.socio.update({
      where: { id: socioId },
      data: {
        planPendienteId: null,
      },
    });

    res.json({ message: 'Cambio de plan cancelado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cancelar el plan pendiente' });
  }
}

module.exports = {
  getSocios,
  createSocio,
  getSocioMe,
  updatePlanPendiente,
  cancelarPlanPendiente,
  deleteSocio,
};