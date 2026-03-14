-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SOCIO');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('BASICO', 'FULL', 'ELITE');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('ACTIVO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "PagoEstado" AS ENUM ('PAGADO', 'PENDIENTE', 'VENCIDO');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'SOCIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "plan" "Plan" NOT NULL,
    "estado" "Estado" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "socios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "socioId" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "PagoEstado" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "socios_email_key" ON "socios"("email");

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
