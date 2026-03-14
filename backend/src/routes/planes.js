const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// Listar todos los planes
router.get('/', requireAdmin, async (req, res) => {
  const planes = await prisma.plan.findMany({
    include: {
      socios: true,
      sociosPend: true,
    },
  });
  res.json(planes.map(plan => ({
    ...plan,
    countSocios: plan.socios.length,
    countSociosPend: plan.sociosPend.length,
  })));
});

// Obtener un plan
router.get('/:id', requireAdmin, async (req, res) => {
  const plan = await prisma.plan.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });
  res.json(plan);
});

// Crear un plan
router.post('/', requireAdmin, async (req, res) => {
  const { codigo, nombre, diasSemana, precio, activo } = req.body;
  try {
    const plan = await prisma.plan.create({
      data: { codigo, nombre, diasSemana, precio, activo },
    });
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el plan' });
  }
});

// Editar un plan
router.put('/:id', requireAdmin, async (req, res) => {
  const { codigo, nombre, diasSemana, precio, activo } = req.body;
  try {
    const plan = await prisma.plan.update({
      where: { id: parseInt(req.params.id) },
      data: { codigo, nombre, diasSemana, precio, activo },
    });
    res.json(plan);
  } catch (error) {
    res.status(400).json({ error: 'Error al editar el plan' });
  }
});

// Eliminar un plan
router.delete('/:id', requireAdmin, async (req, res) => {
  const planId = parseInt(req.params.id);
  const socios = await prisma.socio.findMany({
    where: { OR: [{ planId }, { planPendienteId: planId }] },
  });
  if (socios.length > 0) {
    return res.status(400).json({ error: 'No se puede eliminar un plan con socios asignados' });
  }
  await prisma.plan.delete({ where: { id: planId } });
  res.status(204).send();
});

// Activar/desactivar un plan
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  const plan = await prisma.plan.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });
  const updatedPlan = await prisma.plan.update({
    where: { id: plan.id },
    data: { activo: !plan.activo },
  });
  res.json(updatedPlan);
});

module.exports = router;