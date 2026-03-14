/*
  Warnings:

  - You are about to drop the column `socioId` on the `rutinas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fmTemplateId]` on the table `rutinas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "rutinas" DROP CONSTRAINT "rutinas_socioId_fkey";

-- AlterTable
ALTER TABLE "rutina_ejercicios" ADD COLUMN     "bloque" TEXT,
ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "repeticiones" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "rutinas" DROP COLUMN "socioId",
ADD COLUMN     "fmTemplateId" INTEGER;

-- CreateTable
CREATE TABLE "socio_rutinas" (
    "id" SERIAL NOT NULL,
    "socioId" INTEGER NOT NULL,
    "rutinaId" INTEGER NOT NULL,
    "asignadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socio_rutinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noticias" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "imagen" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "noticias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "socio_rutinas_socioId_rutinaId_key" ON "socio_rutinas"("socioId", "rutinaId");

-- CreateIndex
CREATE UNIQUE INDEX "rutinas_fmTemplateId_key" ON "rutinas"("fmTemplateId");

-- AddForeignKey
ALTER TABLE "socio_rutinas" ADD CONSTRAINT "socio_rutinas_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "socios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socio_rutinas" ADD CONSTRAINT "socio_rutinas_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "rutinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
