# Usar la imagen oficial de PostgreSQL como base
FROM postgres:16

# Instalar cron
RUN apt-get update && apt-get -y install cron

# Copiar el script de backup y el archivo crontab al contenedor
COPY backup.sh /usr/local/bin/backup.sh
COPY crontab /etc/cron.d/backup-cron

# Dar permisos de ejecución al script y al crontab
RUN chmod 0644 /etc/cron.d/backup-cron && \
    chmod +x /usr/local/bin/backup.sh

# Crear el archivo de log para cron
RUN touch /var/log/cron.log