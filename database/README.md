# 🗄️ Database Module - Lottery Chatbot

Este módulo contiene toda la configuración, migraciones y scripts relacionados con la base de datos Supabase del proyecto.

## 📁 Estructura

```
database/
├── migrations/           # Scripts de migración SQL
│   └── 001_initial_schema.sql
├── seeds/               # Datos de prueba
│   └── 001_sample_data.sql
├── scripts/             # Scripts de Node.js
│   ├── setup.js         # Configuración inicial
│   ├── seed.js          # Carga de datos de prueba
│   ├── migrate.js       # Ejecutor de migraciones
│   ├── reset.js         # Reset completo de BD
│   ├── backup.js        # Backup de datos
│   └── restore.js       # Restauración de datos
└── package.json
```

## 🚀 Comandos Disponibles

### Configuración Inicial
```bash
npm run setup
```
Crea todas las tablas, índices, funciones y triggers necesarios.

### Cargar Datos de Prueba
```bash
npm run seed
```
Inserta datos de ejemplo para testing y desarrollo.

### Migrar Base de Datos
```bash
npm run migrate
```
Ejecuta migraciones pendientes.

### Reset Completo
```bash
npm run reset
```
⚠️ **PELIGRO**: Elimina todos los datos y recrea la estructura.

### Backup y Restauración
```bash
npm run backup    # Crear backup
npm run restore   # Restaurar desde backup
```

## 🏗️ Esquema de Base de Datos

### Tablas Principales

#### `lottery_tickets`
Inventario de billetes de lotería.
- `id` (UUID): Identificador único
- `ticket_number` (VARCHAR): Número del billete
- `status` (VARCHAR): Estado (available, reserved, sold)
- `is_exclusive` (BOOLEAN): Si es exclusivo para abonados
- `price` (NUMERIC): Precio del billete

#### `subscribers`
Usuarios abonados con privilegios especiales.
- `id` (UUID): Identificador único
- `phone_number` (VARCHAR): Número de teléfono
- `status` (VARCHAR): Estado (active, inactive)
- `name` (VARCHAR): Nombre del abonado

#### `orders`
Solicitudes de compra generadas por el chatbot.
- `id` (UUID): Identificador único
- `ticket_id` (UUID): Referencia al billete
- `user_phone` (VARCHAR): Teléfono del cliente
- `status` (VARCHAR): Estado (pending_review, processed, cancelled)

#### `user_sessions`
Estado de conversaciones activas.
- `user_phone` (VARCHAR): Teléfono del usuario (PK)
- `state` (VARCHAR): Estado actual de la conversación
- `context` (JSONB): Datos contextuales de la sesión

#### `knowledge_base`
Base de conocimiento para respuestas automáticas.
- `id` (UUID): Identificador único
- `question` (TEXT): Pregunta o tema
- `answer` (TEXT): Respuesta predefinida
- `keywords` (TEXT): Palabras clave para búsqueda
- `category` (VARCHAR): Categoría de la respuesta

#### `system_logs`
Logs del sistema para auditoría.
- `id` (UUID): Identificador único
- `level` (VARCHAR): Nivel de log (debug, info, warn, error)
- `message` (TEXT): Mensaje del log
- `context` (JSONB): Contexto adicional
- `user_phone` (VARCHAR): Usuario relacionado (opcional)
- `workflow_id` (VARCHAR): ID del workflow de n8n

### Funciones de Negocio

#### `check_ticket_availability(ticket_number, user_phone)`
Verifica si un billete está disponible para un usuario específico.
- Considera el estado del billete
- Verifica si es exclusivo y si el usuario es abonado
- Retorna disponibilidad, precio y requisitos

#### `reserve_ticket(ticket_number, user_phone)`
Reserva un billete para un usuario.
- Actualiza el estado del billete a 'reserved'
- Crea una orden en estado 'pending_review'
- Operación atómica

## 📊 Datos de Prueba

### Billetes Disponibles
- **Regulares**: 12345-12354 (€20-30)
- **Exclusivos**: 99001-99005 (€50-100)
- **Especiales**: 00001 (€200), 77777 (€150), 99999 (€300)
- **Vendidos/Reservados**: 11111, 22222, 33333

### Usuarios de Prueba
- **Abonado**: +34600123456 (Juan Pérez)
- **Usuario regular**: +34600999999

### Base de Conocimiento
Incluye respuestas para:
- Información general (horarios, dirección, contacto)
- Proceso de compra
- Información de billetes
- Suscripciones
- Sorteos y premios

## 🔧 Configuración

### Variables de Entorno Requeridas
```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### Permisos de Supabase
El service role key debe tener permisos para:
- Crear y modificar tablas
- Insertar, actualizar y eliminar datos
- Crear funciones y triggers
- Ejecutar consultas SQL directas

## 🔒 Seguridad

### Row Level Security (RLS)
- Las políticas RLS están deshabilitadas durante el desarrollo
- Para producción, se deben configurar políticas específicas
- El acceso se controla a través del service role key

### Datos Sensibles
- Los números de teléfono se almacenan en formato internacional
- Los logs pueden contener información sensible
- Se recomienda implementar rotación de logs

## 🚨 Troubleshooting

### Error: "Variables de entorno no encontradas"
```bash
# Crear archivo .env en la raíz del proyecto
cp .env.example .env
# Editar con tus credenciales reales
```

### Error: "No se puede conectar a Supabase"
1. Verificar que el proyecto esté activo
2. Verificar las credenciales
3. Verificar conectividad de red

### Error: "Tabla no encontrada"
```bash
# Ejecutar configuración inicial
npm run setup
```

### Error: "Permisos insuficientes"
- Verificar que uses el service role key (no el anon key)
- Verificar que el proyecto tenga los permisos correctos

## 📈 Monitoreo

### Métricas Importantes
- Número de billetes disponibles por categoría
- Órdenes pendientes de revisión
- Sesiones activas de usuarios
- Errores en logs del sistema

### Consultas Útiles
```sql
-- Billetes disponibles por tipo
SELECT is_exclusive, COUNT(*) 
FROM lottery_tickets 
WHERE status = 'available' 
GROUP BY is_exclusive;

-- Órdenes pendientes
SELECT COUNT(*) 
FROM orders 
WHERE status = 'pending_review';

-- Sesiones activas (últimas 24h)
SELECT COUNT(*) 
FROM user_sessions 
WHERE updated_at > NOW() - INTERVAL '24 hours';
```

## 🔄 Mantenimiento

### Tareas Regulares
- Limpiar sesiones expiradas (>30 días)
- Rotar logs antiguos (>90 días)
- Backup de datos críticos
- Monitorear rendimiento de consultas

### Scripts de Mantenimiento
```bash
# Limpiar sesiones expiradas
npm run clean-sessions

# Rotar logs
npm run rotate-logs

# Backup automático
npm run backup
```

