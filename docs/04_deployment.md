# Guía de Despliegue en Producción

Esta guía cubre los pasos para desplegar el chatbot de lotería en un entorno de producción.

## Requisitos Previos

- **Servidor**: Un servidor virtual (VPS) o una plataforma de hosting (como DigitalOcean, Vultr, AWS, etc.) con al menos 1GB de RAM.
- **Dominio**: Un nombre de dominio para tu API (ej: `api.tu-chatbot.com`).
- **Docker y Docker Compose**: Instalados en tu servidor.
- **Base de datos Supabase**: Ya configurada.
- **Credenciales de WhatsApp**: Token de acceso permanente y Phone Number ID.

## Estrategia de Despliegue

Usaremos **Docker** para contenerizar la API y n8n, y **Docker Compose** para orquestar los servicios. Esto asegura un entorno consistente y facilita la gestión.

## Pasos de Despliegue

### 1. Preparar el Servidor

1. **Actualizar el sistema**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Instalar Docker y Docker Compose**:
   - Sigue la [guía oficial de Docker](https://docs.docker.com/engine/install/ubuntu/) para instalar Docker.
   - Sigue la [guía oficial de Docker Compose](https://docs.docker.com/compose/install/) para instalar Docker Compose.

3. **Instalar un servidor web (Nginx)** como proxy inverso:
   ```bash
   sudo apt install nginx -y
   ```

4. **Configurar el firewall**:
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

### 2. Configurar el Proyecto para Producción

1. **Clonar el repositorio** en tu servidor:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd lottery-chatbot
   ```

2. **Crear el archivo `.env` de producción**:
   - Copia `.env.example` a `.env`.
   - Rellena todas las variables con tus credenciales de producción.
   - **IMPORTANTE**: Cambia `NODE_ENV` a `production`.
     ```env
     NODE_ENV=production
     ```

### 3. Crear Archivos Docker

**`Dockerfile` para la API (en `api/Dockerfile`)**:

```dockerfile
# Etapa de build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa de producción
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**`docker-compose.yml` (en la raíz del proyecto)**:

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: lottery_api
    restart: always
    env_file:
      - .env
    ports:
      - "3000:3000"
    networks:
      - chatbot_network

  n8n:
    image: n8nio/n8n
    container_name: lottery_n8n
    restart: always
    env_file:
      - .env
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - chatbot_network

networks:
  chatbot_network:

volumes:
  n8n_data:
```

### 4. Configurar Nginx como Proxy Inverso

1. **Crear un archivo de configuración para tu dominio**:
   ```bash
   sudo nano /etc/nginx/sites-available/api.tu-chatbot.com
   ```

2. **Añadir la siguiente configuración**:
   ```nginx
   server {
       listen 80;
       server_name api.tu-chatbot.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

   server {
       listen 80;
       server_name n8n.tu-chatbot.com;

       location / {
           proxy_pass http://localhost:5678;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Activar la configuración**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.tu-chatbot.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Configurar DNS**: Apunta `api.tu-chatbot.com` y `n8n.tu-chatbot.com` a la IP de tu servidor.

5. **(Recomendado) Instalar SSL con Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d api.tu-chatbot.com -d n8n.tu-chatbot.com
   ```

### 5. Iniciar los Servicios

Desde la raíz de tu proyecto, ejecuta:

```bash
docker-compose up -d --build
```

Esto construirá las imágenes y levantará los contenedores en segundo plano.

### 6. Configuración Final

1. **Configurar n8n en producción**:
   - Accede a n8n a través de tu dominio (`https://n8n.tu-chatbot.com`).
   - Crea tus credenciales de Supabase y WhatsApp como en desarrollo.
   - Importa y activa los workflows.

2. **Actualizar el Webhook de WhatsApp**:
   - En la configuración de tu app de Meta, cambia la URL del webhook a la URL de producción de n8n:
     `https://n8n.tu-chatbot.com/webhook/whatsapp`

## Actualizaciones del Sistema

Para actualizar el sistema con nuevos cambios:

1. **Obtener los últimos cambios**:
   ```bash
   git pull
   ```

2. **Reconstruir y reiniciar los contenedores**:
   ```bash
   docker-compose up -d --build
   ```

Docker Compose se encargará de reconstruir solo los servicios que han cambiado y reiniciarlos sin downtime (o con un downtime mínimo).

## Monitoreo y Logs

- **Ver logs de la API**:
  ```bash
  docker logs lottery_api
  ```

- **Ver logs de n8n**:
  ```bash
  docker logs lottery_n8n
  ```

- **Health Check**: Accede a `https://api.tu-chatbot.com/health` para verificar el estado del sistema.

## Seguridad en Producción

- **Variables de Entorno**: No comitas el archivo `.env` a tu repositorio. Usa un gestor de secretos si es posible.
- **Firewall**: Asegúrate de que solo los puertos necesarios (80, 443) estén abiertos al público.
- **Actualizaciones**: Mantén tu servidor y dependencias actualizadas regularmente.
- **Backups**: Configura backups automáticos de tu base de datos Supabase y del volumen de datos de n8n. Consulta la [Guía de Mantenimiento](./05_maintenance.md).

