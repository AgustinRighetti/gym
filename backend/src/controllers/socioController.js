const prisma = require('../prisma');

const PLAN_MONTOS = {
  UN_DIA: 24000,
  DOS_DIAS: 28000,
  TRES_DIAS: 30000,
  LIBRE: 34000,
};

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
      if (days > 30 && socio.estado !== 'VENCIDO') {
        await prisma.socio.update({
          where: { id: socio.id },
          data: { estado: 'VENCIDO' },
        });
      }
    }
  }
}

async function getSocios(req, res) {
  try {
    await updateStates();
    const socios = await prisma.socio.findMany({
      include: { pagos: { orderBy: { fecha: 'desc' } } },
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
    if (!nombre || !apellido || !email || !plan) {
      return res.status(400).json({ message: 'Faltan campos' });
    }

    const existing = await prisma.socio.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email ya existe para otro socio' });
    }

    const socio = await prisma.socio.create({
      data: { nombre, apellido, email, telefono, plan },
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

    const socio = await prisma.socio.findUnique({
      where: { usuarioId: userId },
      include: { pagos: { orderBy: { fecha: 'desc' } } },
    });

    if (!socio) return res.status(404).json({ message: 'Socio no encontrado' });

    const now = new Date();
    const lastPago = socio.pagos[0];
    if (lastPago) {
      const diff = now - new Date(lastPago.fecha);
      const days = diff / (1000 * 60 * 60 * 24);
      if (days > 30 && socio.estado !== 'VENCIDO') {
        await prisma.socio.update({
          where: { id: socio.id },
          data: { estado: 'VENCIDO' },
        });
        socio.estado = 'VENCIDO';
      }
    }

    res.json(socio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener socio' });
  }
}

// PUT /socios/:id/plan — admin o socio (socio: 1 cambio por ciclo)
async function updatePlanPendiente(req, res) {
  try {
    const socioId = parseInt(req.params.id);
    const { plan } = req.body;
    const requesterRol = req.user.rol;

    // Validar plan
    if (!PLANES_VALIDOS.includes(plan)) {
      return res.status(400).json({ message: 'Plan inválido. Debe ser UN_DIA, DOS_DIAS, TRES_DIAS o LIBRE' });
    }

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: { pagos: { orderBy: { fecha: 'desc' }, take: 1 } },
    });

    if (!socio) return res.status(404).json({ message: 'Socio no encontrado' });

    // Validar que no sea el mismo plan actual
    if (socio.plan === plan) {
      return res.status(400).json({ message: 'El plan seleccionado es igual al plan actual' });
    }

    if (requesterRol === 'SOCIO') {
      // El socio solo puede modificar su propio perfil
      const userId = req.user.userId;
      if (socio.usuarioId !== userId) {
        return res.status(403).json({ message: 'No tenés permiso para modificar este perfil' });
      }

      // Validar 1 cambio por ciclo: si ya hay planPendiente registrado DESPUÉS del vencimiento del último pago,
      // significa que ya solicitó un cambio en este ciclo.
      if (socio.planPendiente && socio.planPendienteFecha) {
        const lastPago = socio.pagos[0];
        if (lastPago) {
          const vencimiento = new Date(lastPago.vencimiento);
          const fechaSolicitud = new Date(socio.planPendienteFecha);
          // Si la solicitud anterior es posterior al inicio del ciclo actual (fecha del pago), ya usó su cambio
          const inicioCiclo = new Date(lastPago.fecha);
          if (fechaSolicitud >= inicioCiclo) {
            return res.status(409).json({
              message: 'Ya solicitaste un cambio de plan en este ciclo. Podés solicitar otro en tu próxima renovación.',
            });
          }
        } else {
          // Sin pagos registrados, pero ya tiene pendiente: bloqueamos igual
          return res.status(409).json({
            message: 'Ya tenés un cambio de plan pendiente.',
          });
        }
      }
    }
    // Admin: sin restricción de frecuencia

    const updated = await prisma.socio.update({
      where: { id: socioId },
      data: {
        planPendiente: plan,
        planPendienteFecha: new Date(),
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
      select: { usuarioId: true }
    });

    if (!socio) return res.status(404).json({ message: 'Socio no encontrado' });

    // Eliminar en orden para respetar FKs
    await prisma.$transaction([
      // 1. Eliminar asistencias
      prisma.asistencia.deleteMany({ where: { socioId } }),
      // 2. Eliminar pagos
      prisma.pago.deleteMany({ where: { socioId } }),
      // 3. Eliminar el Socio
      prisma.socio.delete({ where: { id: socioId } }),
    ]);

    // 4. Eliminar el Usuario asociado si existe
    if (socio.usuarioId) {
      await prisma.user.delete({ where: { id: socio.usuarioId } });
    }

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

    if (!socio.planPendiente) {
      return res.status(400).json({ message: 'Este socio no tiene un cambio de plan pendiente' });
    }

    await prisma.socio.update({
      where: { id: socioId },
      data: {
        planPendiente: null,
        planPendienteFecha: null,
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
