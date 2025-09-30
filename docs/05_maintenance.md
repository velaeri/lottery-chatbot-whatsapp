# Guía de Mantenimiento y Monitoreo

Esta guía describe las tareas de mantenimiento y monitoreo necesarias para asegurar el buen funcionamiento y la longevidad del sistema.

## Tareas de Mantenimiento Regulares

### 1. Actualizaciones de Software

**Frecuencia**: Mensual

- **Sistema Operativo**:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- **Dependencias del Proyecto**:
  - Revisa si hay actualizaciones de seguridad en las dependencias de `api`, `n8n`, `database` y `scripts`.
  - Usa `npm outdated` para ver las dependencias desactualizadas.
  - Actualiza con cuidado, probando en un entorno de desarrollo antes de desplegar en producción.

- **Imágenes Docker**:
  - Actualiza las imágenes base en los `Dockerfile` (ej: `node:18-alpine`).
  - Reconstruye las imágenes y despliega.

### 2. Backups

**Frecuencia**: Diario

- **Base de Datos Supabase**:
  - Supabase realiza backups automáticos diarios en sus planes de pago.
  - Para mayor seguridad, puedes realizar backups manuales:
    - Ve a `Database > Backups` en tu proyecto de Supabase.
    - Descarga un backup manual periódicamente.
  - También puedes usar `pg_dump` para crear backups desde la línea de comandos.

- **Volumen de n8n**:
  - El volumen `n8n_data` contiene tus workflows y credenciales.
  - Realiza un backup de este volumen regularmente.
    ```bash
    # Detener n8n
    docker-compose stop n8n

    # Crear backup
    sudo tar -czvf n8n_backup_$(date +%F).tar.gz /var/lib/docker/volumes/lottery-chatbot_n8n_data/_data

    # Iniciar n8n
    docker-compose start n8n
    ```
  - Mueve el archivo de backup a un lugar seguro (ej: un bucket de S3).

### 3. Rotación de Logs

**Frecuencia**: Semanal

- **Logs de Docker**:
  - Por defecto, los logs de Docker pueden crecer indefinidamente.
  - Configura la rotación de logs en tu `docker-compose.yml`:
    ```yaml
    services:
      api:
        # ...
        logging:
          driver: "json-file"
          options:
            max-size: "10m"
            max-file: "3"
      n8n:
        # ...
        logging:
          driver: "json-file"
          options:
            max-size: "10m"
            max-file: "3"
    ```

- **Logs de la Base de Datos (`system_logs`)**:
  - La tabla `system_logs` puede crecer rápidamente.
  - Considera archivar o eliminar logs antiguos periódicamente.
  - Puedes crear un script SQL que se ejecute semanalmente para mover logs de más de 30 días a otra tabla de archivo o eliminarlos.

## Monitoreo del Sistema

### 1. Health Checks

**Frecuencia**: Continuo

- Usa un servicio de monitoreo externo (como UptimeRobot, Better Uptime, etc.) para hacer ping a tu endpoint de health check (`https://api.tu-chatbot.com/health`) cada 5 minutos.
- Configura alertas por email o Slack si el endpoint falla.

### 2. Script de Health Check

**Frecuencia**: Diario (o bajo demanda)

- Ejecuta el script de health check para obtener un reporte detallado del estado del sistema.
  ```bash
  cd scripts
  npm run health-check
  ```
- Automatiza este script con un cron job para recibir reportes diarios.

### 3. Monitoreo de Recursos del Servidor

**Frecuencia**: Continuo

- Monitorea el uso de **CPU**, **RAM** y **espacio en disco** de tu servidor.
- Herramientas como `htop`, `df -h` y `free -m` son útiles para monitoreo manual.
- Considera instalar un agente de monitoreo (como Datadog, Netdata, etc.) para obtener gráficos y alertas en tiempo real.

### 4. Monitoreo de la API de WhatsApp

- **Calidad del Número**: Revisa la calidad de tu número de teléfono en el **WhatsApp Manager** de Meta. Si baja a "amarillo" o "rojo", reduce el volumen de mensajes para evitar bloqueos.
- **Límites de Mensajería**: Ten en cuenta los límites de mensajería de tu cuenta. Aumentarán a medida que envíes más mensajes de alta calidad.

### 5. Revisión de Logs

**Frecuencia**: Semanal (o cuando ocurra un problema)

- **Logs de la API y n8n**:
  - Revisa los logs en busca de errores o advertencias inusuales.
    ```bash
    docker logs lottery_api --since 24h | grep -i "error"
    docker logs lottery_n8n --since 24h | grep -i "error"
    ```

- **Logs de la Base de Datos (`system_logs`)**:
  - Consulta la tabla `system_logs` en Supabase para identificar problemas en los workflows o en las interacciones de los usuarios.
    ```sql
    SELECT * FROM system_logs WHERE level = 'error' AND created_at > now() - interval '1 day';
    ```

## Plan de Recuperación ante Desastres

1. **Fallo del Servidor**:
   - Si el servidor falla, levanta un nuevo servidor.
   - Instala Docker y Docker Compose.
   - Clona el repositorio.
   - Restaura los backups de la base de datos y del volumen de n8n.
   - Inicia los servicios con `docker-compose up -d`.
   - Actualiza la IP en tu configuración de DNS.

2. **Corrupción de la Base de Datos**:
   - Usa los backups automáticos de Supabase para restaurar la base de datos a un punto anterior en el tiempo.

3. **Fallo de n8n**:
   - Restaura el volumen `n8n_data` desde un backup.
   - Reinicia el contenedor de n8n.

## Contactos de Emergencia

Mantén una lista de contactos de emergencia:

- **Soporte de Supabase**
- **Soporte de tu proveedor de hosting**
- **Soporte de tu proveedor de la API de WhatsApp**
- **Desarrollador principal del proyecto**

