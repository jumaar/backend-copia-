#!/bin/bash

# Salir inmediatamente si un comando falla
set -e

BACKUP_TYPE=$1
BACKUP_DIR="/backups"

if [ -z "$BACKUP_TYPE" ]; then
  echo "Error: Se requiere un tipo de backup ('hourly' o 'daily')."
  exit 1
fi

echo "$(date): Iniciando backup de tipo: ${BACKUP_TYPE}"

# Crear el nombre del archivo de backup con la fecha y el tipo
FILENAME="${BACKUP_DIR}/backup_${BACKUP_TYPE}_$(date +%Y%m%d_%H%M%S).sql.gz"

# Ejecutar pg_dump con compresión y verificación
echo "$(date): Ejecutando pg_dump..."
if pg_dump -h db -U admin -d mi_base_de_datos -w | gzip > "$FILENAME"; then
  echo "$(date): Backup creado exitosamente: ${FILENAME}"
  # Verificar que el archivo no esté vacío
  if [ -s "$FILENAME" ]; then
    echo "$(date): Backup verificado como no vacío."
  else
    echo "$(date): ERROR: El backup está vacío. Verifica la conexión a la DB."
    exit 1
  fi
else
  echo "$(date): ERROR: pg_dump falló. Código de salida: $?"
  exit 1
fi

echo "$(date): Iniciando limpieza de backups antiguos..."
# Limpiar backups por hora más antiguos de 48 horas
find "${BACKUP_DIR}" -name "backup_hourly_*.sql.gz" -mmin +2880 -delete
# Limpiar backups diarios más antiguos de 15 días
find "${BACKUP_DIR}" -name "backup_daily_*.sql.gz" -mtime +15 -delete
echo "$(date): Limpieza completada."