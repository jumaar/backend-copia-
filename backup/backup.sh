#!/bin/bash

# Salir inmediatamente si un comando falla
set -e
set -o pipefail

BACKUP_TYPE=$1
BACKUP_DIR="/backups"
MAX_ATTEMPTS=5
ATTEMPT_DELAY=60  # segundos

case "$BACKUP_TYPE" in
  hourly|daily|inicio)
    # Tipo de backup válido, continuar.
    ;;
  *)
    echo "Error: Se requiere un tipo de backup válido ('hourly', 'daily' o 'inicio'). Uso: $0 [hourly|daily|inicio]"
    exit 1
    ;;
esac

echo "$(date): Iniciando backup de tipo: ${BACKUP_TYPE}"

# Esperar a que la base de datos esté disponible
echo "$(date): Esperando a que la DB esté lista..."
ATTEMPT=1
while ! pg_isready -h db -U admin -d mi_base_de_datos -q; do
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "$(date): ERROR: No se pudo conectar a la DB después de $MAX_ATTEMPTS intentos."
    exit 1
  fi
  echo "$(date): DB no está lista, esperando ${ATTEMPT_DELAY} segundos... (intento $ATTEMPT/$MAX_ATTEMPTS)"
  sleep $ATTEMPT_DELAY
  ATTEMPT=$((ATTEMPT + 1))
done
echo "$(date): DB está lista."

# Crear el nombre del archivo de backup con la fecha y el tipo
FILENAME="${BACKUP_DIR}/backup_${BACKUP_TYPE}_$(date +%Y%m%d_%H%M%S).sql.gz"

# Función para intentar el backup
attempt_backup() {
  local attempt=$1
  echo "$(date): Ejecutando pg_dump (intento $attempt)..."
  if pg_dump -h db -U admin -d mi_base_de_datos -w | gzip > "$FILENAME"; then
    if [ -s "$FILENAME" ]; then
      echo "$(date): Backup creado exitosamente: ${FILENAME}"
      return 0
    else
      echo "$(date): Backup vacío, reintentando..."
      return 1
    fi
  else
    echo "$(date): ERROR: pg_dump falló. Código de salida: $?"
    return 1
  fi
}

# Intentar el backup hasta MAX_ATTEMPTS veces
for ATTEMPT in $(seq 1 $MAX_ATTEMPTS); do
  if attempt_backup $ATTEMPT; then
    break
  fi
  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    echo "$(date): Reintentando en ${ATTEMPT_DELAY} segundos..."
    sleep $ATTEMPT_DELAY
  else
    echo "$(date): ERROR: No se pudo crear un backup válido después de $MAX_ATTEMPTS intentos."
    exit 1
  fi
done

echo "$(date): Iniciando limpieza de backups antiguos..."
# Limpiar backups por hora más antiguos de 48 horas
find "${BACKUP_DIR}" -name "backup_hourly_*.sql.gz" -mmin +2880 -delete
# Limpiar backups de inicio más antiguos de 48 horas
find "${BACKUP_DIR}" -name "backup_inicio_*.sql.gz" -mmin +2880 -delete
# Limpiar backups diarios más antiguos de 15 días
find "${BACKUP_DIR}" -name "backup_daily_*.sql.gz" -mtime +15 -delete
echo "$(date): Limpieza completada."