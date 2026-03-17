const prisma = require('../prisma');
const movimientosService = require('../services/movimientosServices');

const PLAN_MONTOS = {
  UN_DIA: 24000,
  DOS_DIAS: 28000,
  TRES_DIAS: 30000,
  LIBRE: 34000,
};

async function getPagos(req, res) {
  try {
    const pagos = await prisma.pago.findMany({ include: { socio: true } });
    res.json(pagos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener pagos' });
  }
}

async function createPago(req, res) {
  try {
    const { socioId, monto } = req.body;
    if (!socioId) {
      return res.status(400).json({ message: 'Falta socioId' });
    }

    // Incluir el plan y planPendiente en la consulta
    let socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: { plan: true, planPendiente: true },
    });
    if (!socio) {
      return res.status(404).json({ message: 'Socio no encontrado' });
    }

    // Si hay plan pendiente, aplicarlo
    if (socio.planPendienteId) {
      socio = await prisma.socio.update({
        where: { id: socioId },
        data: {
          planId: socio.planPendienteId,
          planPendienteId: null,
        },
        include: { plan: true },
      });
    }

    // Calcular monto según el código del plan
    const montoFinal = monto ?? (socio.plan ? PLAN_MONTOS[socio.plan.codigo] : 0);

    const fecha = new Date();
    const vencimiento = new Date(fecha);
    vencimiento.setDate(vencimiento.getDate() + 30);

    const pago = await prisma.pago.create({
      data: {
        socio: { connect: { id: socioId } },
        monto: montoFinal,
        fecha,
        vencimiento,
        estado: 'PAGADO',
      },
    });

    // Crear movimiento de ingreso automático
    await movimientosService.createMovimiento({
      tipo: 'INGRESO',
      monto: montoFinal,
      descripcion: `Cuota mensual — ${socio.nombre} ${socio.apellido}`,
      categoria: 'Cuota mensual',
      fecha,
      pagoId: pago.id,
    });

    res.status(201).json(pago);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear pago' });
  }
}

async function updatePago(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado) {
      return res.status(400).json({ message: 'Estado requerido' });
    }

    const pago = await prisma.pago.update({
      where: { id: parseInt(id) },
      data: { estado },
    });

    res.json(pago);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar pago' });
  }
}

module.exports = {
  getPagos,
  createPago,
  updatePago,
};