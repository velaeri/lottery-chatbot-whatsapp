# Scripts de Utilidades

Este directorio contiene scripts de utilidades para la gestión y mantenimiento del chatbot de lotería.

## Scripts Disponibles

### 🚀 `init-all.js`
**Inicialización completa del sistema**

Configura todo el entorno desde cero, incluyendo variables de entorno, base de datos y dependencias.

```bash
npm run init-all
# o
node init-all.js
```

**Características:**
- Configuración interactiva de variables de entorno
- Instalación automática de dependencias
- Configuración de base de datos Supabase
- Carga opcional de datos de prueba
- Validación completa del setup

### 🧪 `test-system.js`
**Testing completo del sistema**

Verifica que todos los componentes funcionen correctamente.

```bash
npm run test-system
# o
node test-system.js
```

**Verifica:**
- Variables de entorno
- Conexión a base de datos
- API del sistema
- n8n
- WhatsApp Business API
- Workflows de n8n

### 🏥 `health-check.js`
**Monitoreo de salud del sistema**

Realiza un chequeo de salud de todos los componentes en tiempo real.

```bash
npm run health-check
# o
node health-check.js
```

**Monitorea:**
- Estado de la base de datos
- Rendimiento de la API
- Disponibilidad de n8n
- Configuración de WhatsApp
- Recursos del sistema (memoria, CPU, disco)

### 🎲 `generate-data.js`
**Generador de datos de prueba**

Genera datos adicionales para testing y desarrollo.

```bash
npm run generate-data
# o
node generate-data.js
```

**Puede generar:**
- Billetes de lotería adicionales
- Abonados de prueba
- Entradas de base de conocimiento
- Órdenes de ejemplo
- Sesiones de usuario

### ✅ `validate-config.js`
**Validador de configuración**

Valida que todas las configuraciones sean correctas y estén completas.

```bash
npm run validate-config
# o
node validate-config.js
```

### 💾 `backup-system.js`
**Sistema de backup**

Crea backups de la base de datos y configuraciones importantes.

```bash
npm run backup-system
# o
node backup-system.js
```

### 🚀 `deploy-check.js`
**Verificación pre-deployment**

Verifica que el sistema esté listo para producción.

```bash
npm run deploy-check
# o
node deploy-check.js
```

## Instalación de Dependencias

```bash
cd scripts
npm install
```

## Variables de Entorno Requeridas

Los scripts requieren las siguientes variables de entorno (configuradas en `.env` en la raíz del proyecto):

```env
# Base de datos
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# WhatsApp (opcional)
WHATSAPP_ACCESS_TOKEN=tu_access_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=tu_verify_token

# API
PORT=3000
NODE_ENV=development

# n8n
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
```

## Uso Típico

### Primera vez (setup completo)
```bash
# 1. Inicializar todo el sistema
npm run init-all

# 2. Verificar que todo funciona
npm run test-system

# 3. Generar datos adicionales si es necesario
npm run generate-data
```

### Mantenimiento regular
```bash
# Verificar salud del sistema
npm run health-check

# Validar configuración
npm run validate-config

# Crear backup
npm run backup-system
```

### Antes de deployment
```bash
# Verificar que está listo para producción
npm run deploy-check

# Test completo final
npm run test-system
```

## Características de los Scripts

### 🎨 Interfaz Amigable
- Colores y iconos para mejor legibilidad
- Spinners para operaciones largas
- Prompts interactivos cuando es necesario

### 🛡️ Manejo de Errores
- Validación de entrada
- Mensajes de error claros
- Sugerencias de solución

### 📊 Reporting Detallado
- Resultados estructurados
- Métricas de rendimiento
- Logs detallados

### 🔧 Configuración Flexible
- Opciones interactivas
- Configuración por variables de entorno
- Modo silencioso disponible

## Troubleshooting

### Error: "Cannot connect to Supabase"
- Verificar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- Comprobar conectividad a internet
- Verificar que el proyecto Supabase esté activo

### Error: "API not responding"
- Verificar que la API esté ejecutándose: `cd api && npm run dev`
- Comprobar el puerto configurado en `PORT`
- Verificar logs de la API

### Error: "n8n not available"
- Verificar que n8n esté ejecutándose: `cd n8n && npm run dev`
- Comprobar configuración de `N8N_HOST` y `N8N_PORT`
- Verificar que n8n esté configurado correctamente

### Error: "WhatsApp configuration invalid"
- Verificar tokens de WhatsApp Business API
- Comprobar que el Phone Number ID sea correcto
- Verificar permisos de la aplicación de WhatsApp

## Contribuir

Para añadir nuevos scripts:

1. Crear el archivo en este directorio
2. Seguir la estructura de los scripts existentes
3. Añadir el comando en `package.json`
4. Documentar en este README
5. Incluir manejo de errores y logging apropiado

## Dependencias

- `chalk`: Colores en terminal
- `ora`: Spinners de carga
- `inquirer`: Prompts interactivos
- `axios`: Peticiones HTTP
- `@supabase/supabase-js`: Cliente de Supabase
- `dotenv`: Manejo de variables de entorno

