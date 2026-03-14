-- Paso 1: Agregar columna temporal TEXT
ALTER TABLE "socios" ADD COLUMN "plan_new" TEXT;

-- Paso 2: Mapear valores viejos del enum a los nuevos strings
UPDATE "socios" SET "plan_new" = CASE
  WHEN "plan"::text = 'BASICO' THEN 'UN_DIA'
  WHEN "plan"::text = 'FULL'   THEN 'TRES_DIAS'
  WHEN "plan"::text = 'ELITE'  THEN 'LIBRE'
  ELSE 'UN_DIA'
END;

-- Paso 3: Hacer la columna nueva NOT NULL
ALTER TABLE "socios" ALTER COLUMN "plan_new" SET NOT NULL;

-- Paso 4: Dropear la columna vieja (enum)
ALTER TABLE "socios" DROP COLUMN "plan";

-- Paso 5: Renombrar la nueva columna
ALTER TABLE "socios" RENAME COLUMN "plan_new" TO "plan";

-- Paso 6: Dropear el enum viejo
DROP TYPE "Plan";

-- CreateTable
CREATE TABLE "asistencias" (
    "id" SERIAL NOT NULL,
    "socioId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "semana" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "alerta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
