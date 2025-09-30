# Configuración de Credenciales para n8n

Este directorio contiene las plantillas de credenciales necesarias para el funcionamiento del chatbot de lotería.

## Credenciales Requeridas

### 1. Supabase API
**Archivo:** `supabase-template.json`

**Configuración requerida:**
- `host`: URL de tu proyecto de Supabase (ej: `https://abcdefgh.supabase.co`)
- `serviceRole`: Clave de service role de Supabase

**Cómo obtener:**
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a Settings > API
3. Copia la "Project URL" y la "service_role key"

### 2. WhatsApp Business API
**Archivo:** `whatsapp-template.json`

**Configuración requerida:**
- `accessToken`: Token de acceso de la API de WhatsApp Business
- `phoneNumberId`: ID del número de teléfono de WhatsApp Business

**Cómo obtener:**
1. Regístrate en [360dialog.com](https://360dialog.com) o tu proveedor preferido
2. Sigue el proceso de verificación de WhatsApp Business
3. Obtén el access token y phone number ID del panel de control

## Configuración en n8n

### Método 1: Interfaz Web
1. Inicia n8n: `npm run dev`
2. Ve a `http://localhost:5678`
3. Ve a Settings > Credentials
4. Haz clic en "Add Credential"
5. Selecciona el tipo de credencial
6. Completa los campos con tus datos

### Método 2: Importación de Archivos
1. Copia las plantillas y renómbralas sin `-template`
2. Completa los campos `YOUR_*` con tus datos reales
3. Usa el script de importación: `npm run import`

## Seguridad

⚠️ **IMPORTANTE:**
- Nunca subas archivos de credenciales reales al control de versiones
- Los archivos `*-template.json` son solo plantillas
- Mantén tus tokens y claves seguras
- Usa variables de entorno en producción

## Variables de Entorno

Alternativamente, puedes configurar las credenciales usando variables de entorno:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

## Verificación

Para verificar que las credenciales están configuradas correctamente:

1. Ve a n8n
2. Crea un workflow de prueba
3. Añade un nodo de Supabase o WhatsApp
4. Selecciona tus credenciales
5. Ejecuta una operación de prueba

