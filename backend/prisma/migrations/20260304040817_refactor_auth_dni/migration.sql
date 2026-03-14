/*
  Warnings:

  - You are about to drop the column `email` on the `socios` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuarioId]` on the table `socios` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[dni]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dni` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "socios_email_key";

-- AlterTable (Users)
-- 1. Agregar DNI temporalmente nullable
ALTER TABLE "users" ADD COLUMN "dni" TEXT;

-- 2. Llenar DNIs con un valor único basado en el ID para evitar choques
UPDATE "users" SET "dni" = (1000000 + "id")::text WHERE "dni" IS NULL;

-- 3. Hacer el DNI NOT NULL
ALTER TABLE "users" ALTER COLUMN "dni" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable (Socios)
ALTER TABLE "socios" ADD COLUMN "usuarioId" INTEGER;

-- Mapear Socio a User conectando por el email antes de dropearlo
UPDATE "socios" s
SET "usuarioId" = u."id"
FROM "users" u
WHERE s."email" = u."email";

-- Ahora sí podemos dropear el email de socios
ALTER TABLE "socios" DROP COLUMN "email";

-- CreateIndex
CREATE UNIQUE INDEX "socios_usuarioId_key" ON "socios"("usuarioId");
CREATE UNIQUE INDEX "users_dni_key" ON "users"("dni");

-- AddForeignKey
ALTER TABLE "socios" ADD CONSTRAINT "socios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
