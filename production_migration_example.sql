-- Ejemplo de migración controlada para producción
-- Ejecutar en orden después de pruebas exhaustivas

-- 1. Backup completo antes de migrar
pg_dump mi_base_de_datos > backup_pre_migration.sql

-- 2. Agregar columnas con defaults seguros
ALTER TABLE "TIENDAS" ADD COLUMN fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "NEVERAS" ADD COLUMN fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "NEVERAS" ADD COLUMN fecha_activacion TIMESTAMP NULL;

-- 3. Verificar que no hay datos NULL donde no deberían
SELECT COUNT(*) FROM "TIENDAS" WHERE fecha_creacion IS NULL;
SELECT COUNT(*) FROM "NEVERAS" WHERE fecha_creacion IS NULL;

-- 4. Regenerar cliente Prisma
npx prisma generate

-- 5. Probar aplicación con datos de prueba
-- 6. Si todo OK, aplicar a producción
