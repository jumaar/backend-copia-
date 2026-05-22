-- Add fecha_activacion and fecha_creacion to ESTACIONES (previously added manually, no migration existed)
ALTER TABLE "ESTACIONES" ADD COLUMN IF NOT EXISTS "fecha_activacion" TIMESTAMP(3);
ALTER TABLE "ESTACIONES" ADD COLUMN IF NOT EXISTS "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add fecha_creacion to FRIGORIFICO (was in removed migration 20260405165446)
ALTER TABLE "FRIGORIFICO" ADD COLUMN IF NOT EXISTS "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
