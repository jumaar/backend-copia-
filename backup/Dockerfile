# Usar la imagen oficial de PostgreSQL como base
FROM postgres:16

# Instalar cron (necesario para la imagen base Debian de Postgres)
RUN apt-get update && apt-get -y install cron

# Crear directorio para almacenar los backups
RUN mkdir -p /backups

# Copiar el script de backup, crontab y entrypoint
COPY backup.sh /usr/local/bin/backup.sh
COPY crontab /etc/cron.d/backup-cron
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Dar permisos de ejecución y permisos correctos para cron (0644 para system cron)
RUN chmod +x /usr/local/bin/backup.sh && \
    chmod 0644 /etc/cron.d/backup-cron && \
    chmod +x /usr/local/bin/entrypoint.sh

# Crear el archivo de log para cron
RUN touch /var/log/cron.log

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]