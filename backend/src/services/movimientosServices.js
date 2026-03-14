const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMovimientos = async ({ mes, anio, tipo, categoria } = {}) => {
  const now = new Date();
  const targetMes  = mes  ?? now.getMonth() + 1;
  const targetAnio = anio ?? now.getFullYear();

  const desde = new Date(targetAnio, targetMes - 1, 1);
  const hasta  = new Date(targetAnio, targetMes, 1); // exclusive

  const where = {
    fecha: { gte: desde, lt: hasta },
    ...(tipo      && { tipo }),
    ...(categoria && { categoria }),
  };

  return prisma.movimiento.findMany({
    where,
    orderBy: { fecha: 'desc' },
    include: {
      pago: {
        include: {
          socio: { select: { nombre: true, apellido: true } },
        },
      },
    },
  });
};

const getMovimientoById = async (id) => {
  return prisma.movimiento.findUnique({ where: { id } });
};

// Resumen del mes actual + gráfico últimos 6 meses
const getResumen = async ({ mes, anio } = {}) => {
  const now = new Date();
  const targetMes  = mes  ?? now.getMonth() + 1;
  const targetAnio = anio ?? now.getFullYear();

  // Balance mes seleccionado
  const desde = new Date(targetAnio, targetMes - 1, 1);
  const hasta  = new Date(targetAnio, targetMes, 1);

  const movimientosMes = await prisma.movimiento.findMany({
    where: { fecha: { gte: desde, lt: hasta } },
  });

  const totalIngresos = movimientosMes
    .filter(m => m.tipo === 'INGRESO')
    .reduce((acc, m) => acc + m.monto, 0);

  const totalEgresos = movimientosMes
    .filter(m => m.tipo === 'EGRESO')
    .reduce((acc, m) => acc + m.monto, 0);

  // Resumen por categoría del mes
  const porCategoria = movimientosMes.reduce((acc, m) => {
    if (!acc[m.categoria]) acc[m.categoria] = { ingreso: 0, egreso: 0 };
    if (m.tipo === 'INGRESO') acc[m.categoria].ingreso += m.monto;
    else acc[m.categoria].egreso += m.monto;
    return acc;
  }, {});

  // Gráfico: últimos 6 meses
  const grafico = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(targetAnio, targetMes - 1 - i, 1);
    const mesNum  = d.getMonth() + 1;
    const anioNum = d.getFullYear();
    const desdeG  = new Date(anioNum, mesNum - 1, 1);
    const hastaG  = new Date(anioNum, mesNum, 1);

    const movs = await prisma.movimiento.findMany({
      where: { fecha: { gte: desdeG, lt: hastaG } },
      select: { tipo: true, monto: true },
    });

    const ingresos = movs.filter(m => m.tipo === 'INGRESO').reduce((a, m) => a + m.monto, 0);
    const egresos  = movs.filter(m => m.tipo === 'EGRESO').reduce((a, m) => a + m.monto, 0);

    grafico.push({
      mes: d.toLocaleString('es-AR', { month: 'short', year: '2-digit' }),
      mesNum,
      anioNum,
      ingresos,
      egresos,
      balance: ingresos - egresos,
    });
  }

  return {
    mes: targetMes,
    anio: targetAnio,
    totalIngresos,
    totalEgresos,
    balance: totalIngresos - totalEgresos,
    porCategoria,
    grafico,
  };
};

const createMovimiento = async ({ tipo, monto, descripcion, categoria, fecha, pagoId }) => {
  return prisma.movimiento.create({
    data: { tipo, monto, descripcion, categoria, fecha, pagoId: pagoId ?? null },
  });
};

const deleteMovimiento = async (id) => {
  return prisma.movimiento.delete({ where: { id } });
};

module.exports = {
  getMovimientos,
  getMovimientoById,
  getResumen,
  createMovimiento,
  deleteMovimiento,
};