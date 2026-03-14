const movimientosService = require('../services/movimientosServices');

// GET /movimientos
const getMovimientos = async (req, res) => {
  try {
    const { mes, anio, tipo, categoria } = req.query;
    const movimientos = await movimientosService.getMovimientos({
      mes: mes ? parseInt(mes) : undefined,
      anio: anio ? parseInt(anio) : undefined,
      tipo,
      categoria,
    });
    res.json(movimientos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
};

// GET /movimientos/resumen
const getResumen = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const resumen = await movimientosService.getResumen({
      mes: mes ? parseInt(mes) : undefined,
      anio: anio ? parseInt(anio) : undefined,
    });
    res.json(resumen);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener resumen' });
  }
};

// POST /movimientos
const createMovimiento = async (req, res) => {
  try {
    const { tipo, monto, descripcion, categoria, fecha } = req.body;

    if (!tipo || !monto || !descripcion || !categoria) {
      return res.status(400).json({ message: 'Faltan campos requeridos: tipo, monto, descripcion, categoria' });
    }
    if (!['INGRESO', 'EGRESO'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo debe ser INGRESO o EGRESO' });
    }
    if (isNaN(monto) || monto <= 0) {
      return res.status(400).json({ message: 'El monto debe ser un número positivo' });
    }

    const movimiento = await movimientosService.createMovimiento({
      tipo,
      monto: parseFloat(monto),
      descripcion,
      categoria,
      fecha: fecha ? new Date(fecha) : new Date(),
    });
    res.status(201).json(movimiento);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear movimiento' });
  }
};

// DELETE /movimientos/:id
const deleteMovimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const movimiento = await movimientosService.getMovimientoById(parseInt(id));

    if (!movimiento) {
      return res.status(404).json({ message: 'Movimiento no encontrado' });
    }
    // No se pueden eliminar movimientos automáticos (vinculados a un pago)
    if (movimiento.pagoId !== null) {
      return res.status(400).json({ message: 'No se puede eliminar un movimiento generado automáticamente por un pago' });
    }

    await movimientosService.deleteMovimiento(parseInt(id));
    res.json({ message: 'Movimiento eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar movimiento' });
  }
};

module.exports = { getMovimientos, getResumen, createMovimiento, deleteMovimiento };