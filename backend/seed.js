require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, 'ejercicios.json'), 'utf-8');
  const data = JSON.parse(raw);

  const existentes = await prisma.ejercicio.findMany({ select: { nombre: true } });
  const nombresExistentes = new Set(existentes.map(e => e.nombre));

  const nuevos = data
    .filter(e => !nombresExistentes.has(e.nombre))
    .map(e => ({
      nombre: e.nombre,
      grupoMuscular: e.grupoMuscular,
      descripcion: e.descripcion || null,
      imageUrl: e.imageUrl || null,
      wgerBaseId: e.wgerBaseId || null,
    }));

  if (nuevos.length === 0) {
    console.log(`Sin cambios: los ${nombresExistentes.size} ejercicios ya estaban cargados.`);
    return;
  }

  const result = await prisma.ejercicio.createMany({ data: nuevos });
  console.log(`✅ ${result.count} ejercicios insertados. ${nombresExistentes.size} ya existían.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
