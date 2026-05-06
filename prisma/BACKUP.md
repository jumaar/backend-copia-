# Respaldo y Restauración de Base de Datos

## Requisitos previos

- Docker corriendo con el contenedor PostgreSQL (`vorak_db`)
- Archivo `.env` configurado con `DATABASE_URL`
- Credenciales: `admin / password123` (definidas en `.env`)
- Base de datos: `mi_base_de_datos`

---

## Crear un backup

```bash
docker exec vorak_db pg_dump -U admin -d mi_base_de_datos --no-owner --no-privileges | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

Esto genera un dump **completo** (esquema + datos) en `backups/`.

---

## Restaurar un backup

### Caso 1: Base de datos sin migraciones de Prisma (o esquema idéntico al backup)

El backup y la base actual tienen exactamente el mismo esquema. Solo hay que reemplazar los datos.

```bash
# 1. Eliminar conexiones activas y dropear la base
docker exec vorak_db psql -U admin -d postgres -c \
  "SELECT pg_terminate_backend(pg_stat_activity.pid)
   FROM pg_stat_activity
   WHERE pg_stat_activity.datname = 'mi_base_de_datos'
   AND pid <> pg_backend_pid();"

docker exec vorak_db psql -U admin -d postgres -c \
  "DROP DATABASE IF EXISTS mi_base_de_datos;"

# 2. Recrear la base vacía
docker exec vorak_db psql -U admin -d postgres -c \
  "CREATE DATABASE mi_base_de_datos OWNER admin;"

# 3. Restaurar el backup
gunzip -c backups/backup_YYYYMMDD_HHMMSS.sql.gz \
  | docker exec -i vorak_db psql -U admin -d mi_base_de_datos
```

---

### Caso 2: Base de datos con migraciones aplicadas (esquema actualizado)

La base actual tiene **más columnas o tablas** que el backup (por migraciones posteriores). Se restaura el backup y luego se sincroniza el esquema con Prisma sin perder datos.

```bash
# 1. Dropear y recrear la base
docker exec vorak_db psql -U admin -d postgres -c \
  "SELECT pg_terminate_backend(pg_stat_activity.pid)
   FROM pg_stat_activity
   WHERE pg_stat_activity.datname = 'mi_base_de_datos'
   AND pid <> pg_backend_pid();"

docker exec vorak_db psql -U admin -d postgres -c \
  "DROP DATABASE IF EXISTS mi_base_de_datos;"

docker exec vorak_db psql -U admin -d postgres -c \
  "CREATE DATABASE mi_base_de_datos OWNER admin;"

# 2. Restaurar el backup (esquema viejo + datos)
gunzip -c backups/backup_YYYYMMDD_HHMMSS.sql.gz \
  | docker exec -i vorak_db psql -U admin -d mi_base_de_datos

# 3. Sincronizar el esquema con el schema.prisma actual
npx prisma db push

# 4. Resolver migraciones que fallen por columnas ya existentes
npx prisma migrate status
# Si hay migraciones fallidas, marcarlas como aplicadas:
npx prisma migrate resolve --applied "NOMBRE_DE_LA_MIGRACION"

# 5. Verificar estado final
npx prisma migrate status   # Debe mostrar "Database schema is up to date!"
npx prisma validate         # Debe mostrar "The schema is valid"
```

---

### Caso 3: Backup de una migración anterior (esquema más antiguo)

Si el backup fue tomado antes de que se aplicaran nuevas migraciones, y la base actual ya tiene esas migraciones, el procedimiento es el mismo del **Caso 2**. El paso clave es el `prisma db push` que:

- Agrega las columnas/tablas nuevas que definió el `schema.prisma` actual
- **No borra los datos** existentes del backup
- Las columnas nuevas quedan con su valor por defecto (`@default(...)`) o `NULL`

---

## Resumen de comandos útiles

| Acción | Comando |
|---|---|
| Verificar estado de migraciones | `npx prisma migrate status` |
| Validar schema contra la base | `npx prisma validate` |
| Aplicar schema sin migraciones | `npx prisma db push` |
| Sincronizar migraciones | `npx prisma migrate deploy` |
| Marcar migración como aplicada | `npx prisma migrate resolve --applied "nombre"` |
| Regenerar Prisma Client | `npx prisma generate` |
| Ver tablas y registros | `docker exec vorak_db psql -U admin -d mi_base_de_datos -c "SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY 2 DESC;"` |
| Ver columnas de una tabla | `docker exec vorak_db psql -U admin -d mi_base_de_datos -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'NOMBRE_TABLA' ORDER BY ordinal_position;"` |
