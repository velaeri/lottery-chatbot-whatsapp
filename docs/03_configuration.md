# Guía de Configuración Detallada

Esta guía proporciona instrucciones detalladas para configurar cada componente del sistema.

## 1. Configuración del Entorno (`.env`)

El archivo `.env` en la raíz del proyecto centraliza toda la configuración. Puedes crearlo manualmente o usar el script `init-all`.

```env
# Configuración del Chatbot de Lotería

# Base de datos Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# WhatsApp Business API (opcional)
WHATSAPP_ACCESS_TOKEN=tu_access_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=lottery_chatbot_verify

# Configuración de la API
PORT=3000
NODE_ENV=development

# Configuración de n8n
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
```

- **`SUPABASE_URL`**: URL de tu proyecto Supabase.
- **`SUPABASE_SERVICE_ROLE_KEY`**: Clave de servicio de Supabase (secreta).
- **`WHATSAPP_ACCESS_TOKEN`**: Token de acceso de tu aplicación de WhatsApp.
- **`WHATSAPP_PHONE_NUMBER_ID`**: ID del número de teléfono de WhatsApp.
- **`WHATSAPP_WEBHOOK_VERIFY_TOKEN`**: Token para verificar el webhook de WhatsApp (puedes usar el valor por defecto).
- **`PORT`**: Puerto en el que se ejecutará la API de TypeScript.
- **`NODE_ENV`**: Entorno de ejecución (`development` o `production`).

## 2. Configuración de Supabase

### Creación del Proyecto

1. Ve a [Supabase](https://supabase.com/) y crea un nuevo proyecto.
2. Elige una región cercana a tus usuarios para menor latencia.
3. Guarda la contraseña de la base de datos en un lugar seguro.

### Obtención de Credenciales

1. En tu proyecto de Supabase, ve a `Settings > API`.
2. Copia la **URL del Proyecto** y pégala en `SUPABASE_URL` en tu archivo `.env`.
3. Copia la **`service_role` key** y pégala en `SUPABASE_SERVICE_ROLE_KEY`.

### Ejecución de Migraciones

El script de inicialización se encarga de esto automáticamente. Si necesitas hacerlo manualmente:

```bash
cd database
npm install
npm run setup
```

Esto ejecutará los archivos SQL en `database/migrations` y creará todas las tablas y funciones necesarias.

## 3. Configuración de n8n

### Inicio de n8n

```bash
cd n8n
npm run dev
```

Accede a n8n en [http://localhost:5678](http://localhost:5678).

### Creación de Credenciales

Debes crear dos credenciales en n8n:

**Credencial de Supabase:**

1. Ve a `Credentials > Add credential`.
2. Busca "Supabase" y selecciónalo.
3. **Authentication**: `API Key`.
4. **Project URL**: Pega tu `SUPABASE_URL`.
5. **API Key**: Pega tu `SUPABASE_SERVICE_ROLE_KEY`.
6. Guarda la credencial.

**Credencial de WhatsApp Business API:**

1. Ve a `Credentials > Add credential`.
2. Busca "WhatsApp Business" y selecciónalo.
3. **Authentication**: `Access Token`.
4. **Access Token**: Pega tu `WHATSAPP_ACCESS_TOKEN`.
5. **Phone Number ID**: Pega tu `WHATSAPP_PHONE_NUMBER_ID`.
6. Guarda la credencial.

### Importación y Activación de Workflows

1. Ve a `Workflows > Import from file`.
2. Selecciona todos los archivos JSON del directorio `n8n/workflows/`.
3. Una vez importados, activa cada uno de los workflows usando el interruptor en la lista de workflows.

## 4. Conectar WhatsApp

Esta es la parte más compleja y requiere una cuenta de Meta for Developers.

### Requisitos

- Una página de Facebook.
- Una cuenta de Meta Business.
- Un número de teléfono que no esté asociado a una cuenta de WhatsApp personal.

### Pasos

1. **Crear una App en Meta for Developers**:
   - Ve a [Meta for Developers](https://developers.facebook.com/).
   - Crea una nueva app de tipo "Business".
   - Añade el producto "WhatsApp" a tu app.

2. **Configurar la API**:
   - En la configuración de WhatsApp, se te proporcionará un **Access Token temporal** y un **Phone Number ID**.
   - Usa estos valores para `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` en tu archivo `.env`.

3. **Configurar el Webhook**:
   - Para que WhatsApp pueda enviar mensajes a n8n, necesitas una URL pública. Durante el desarrollo, puedes usar `ngrok`.
     ```bash
     ngrok http 5678
     ```
   - Copia la URL HTTPS que te proporciona ngrok (ej: `https://xxxx-xxxx.ngrok.io`).
   - En la configuración del webhook de WhatsApp, pega la URL de ngrok seguida de la ruta del webhook de n8n (ej: `https://xxxx-xxxx.ngrok.io/webhook/whatsapp`).
   - En **Verify Token**, usa el valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN` de tu archivo `.env`.

4. **Suscribirse a Eventos**:
   - En la configuración del webhook, suscríbete al evento `messages`.

5. **Enviar un Mensaje de Prueba**:
   - Usa la herramienta de prueba de la API de WhatsApp para enviar un mensaje a tu número de teléfono.
   - Deberías ver la ejecución en el workflow "Main Router" de n8n.

### Token de Acceso Permanente

El token de acceso inicial es temporal. Para producción, necesitas generar un token de acceso permanente. Sigue la [guía oficial de Meta](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#get-a-permanent-access-token) para ello.

## 5. Configuración de la API de TypeScript

La API se configura principalmente a través del archivo `.env`. No requiere configuración adicional para el desarrollo local.

### Variables de Entorno Clave

- **`PORT`**: Define el puerto en el que se ejecutará la API. Por defecto es `3000`.
- **`NODE_ENV`**: Cambia a `production` cuando despliegues el sistema. Esto activará optimizaciones y ocultará mensajes de error detallados.

### CORS en Producción

En `api/src/index.ts`, la configuración de CORS está preparada para producción. Deberás añadir el dominio de tu frontend si planeas tener una interfaz web.

```typescript
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] // Añadir dominios permitidos aquí
    : true,
  credentials: true
}));
```

## Troubleshooting de Configuración

- **Error de credenciales en n8n**: Asegúrate de que las credenciales en n8n coincidan exactamente con las de tu archivo `.env`.
- **Webhook de WhatsApp no se verifica**: Comprueba que el `Verify Token` es el mismo en Meta y en tu archivo `.env`, y que la URL de ngrok es correcta.
- **API no se conecta a Supabase**: Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` son correctos y que no hay firewalls bloqueando la conexión.

Para más detalles, consulta la [Guía de Troubleshooting](./07_troubleshooting.md).

