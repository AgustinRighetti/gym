const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PLANES = [
  { codigo: 'UN_DIA', nombre: '1 Día', diasSemana: 1, precio: 24000 },
  { codigo: 'DOS_DIAS', nombre: '2 Días', diasSemana: 2, precio: 28000 },
  { codigo: 'TRES_DIAS', nombre: '3 Días', diasSemana: 3, precio: 30000 },
  { codigo: 'LIBRE', nombre: 'Libre', diasSemana: null, precio: 34000 },
];

async function main() {
  console.log('Seeding planes...');
  for (const plan of PLANES) {
    await prisma.plan.upsert({
      where: { codigo: plan.codigo },
      update: {},
      create: plan,
    });
  }

  console.log('Updating socios...');
  const socios = await prisma.socio.findMany();
  for (const socio of socios) {
    const plan = PLANES.find(p => p.codigo === socio.plan);
    if (plan) {
      await prisma.socio.update({
        where: { id: socio.id },
        data: { planId: plan.id },
      });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });