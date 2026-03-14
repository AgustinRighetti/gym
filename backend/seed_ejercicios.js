// seed_ejercicios.js — versión simple con createMany
// Correlo con: node seed_ejercicios.js
// Requiere: npm install @prisma/client

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, "ejercicios.json");

  if (!fs.existsSync(filePath)) {
    console.error("❌ No se encontró ejercicios.json");
    console.error("   Corré primero: python scraper_ejercicios.py");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`📦 ${raw.length} ejercicios encontrados en el JSON`);

  // Mapear al schema de Prisma
  const data = raw.map((ej) => ({
    nombre: ej.nombre,
    grupoMuscular: ej.grupoMuscular,
    imageUrl: ej.imageUrl ?? null,
    descripcion: ej.descripcion ?? null,
    wgerBaseId: ej._idOriginal ?? null,
  }));

  console.log("⏳ Insertando en la base de datos...");

  const result = await prisma.ejercicio.createMany({
    data,
    skipDuplicates: true, // si corrés el seed más de una vez, no rompe
  });

  console.log(`✅ ${result.count} ejercicios insertados correctamente`);
}

main()
  .catch((e) => {
    console.error("❌ Error al hacer el seed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());