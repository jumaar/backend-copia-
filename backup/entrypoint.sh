#!/bin/bash

# Salir inmediatamente si un comando falla
set -e

echo "$(date): [Entrypoint] El contenedor de backup se ha iniciado."

# 1. Ejecutar un backup inicial al arrancar el contenedor.
echo "$(date): [Entrypoint] Ejecutando backup de inicio..."
/usr/local/bin/backup.sh inicio
echo "$(date): [Entrypoint] Backup de inicio completado."

# 2. Iniciar el demonio de cron en primer plano para mantener el contenedor activo.
echo "$(date): [Entrypoint] Iniciando el servicio cron..."
cron -f