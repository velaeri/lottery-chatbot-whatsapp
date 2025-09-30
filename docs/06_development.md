# Guía de Desarrollo

Esta guía está dirigida a desarrolladores que quieran extender, modificar o contribuir al proyecto.

## Estructura del Proyecto

El proyecto sigue una arquitectura de monorepo con separación clara de responsabilidades:

```
lottery-chatbot/
├── api/                    # API de TypeScript (lógica de negocio)
├── database/              # Migraciones y seeds de Supabase
├── docs/                  # Documentación del proyecto
├── n8n/                   # Workflows y configuración de n8n
├── scripts/               # Scripts de utilidades
├── shared/                # Código TypeScript compartido
├── .env.example           # Plantilla de variables de entorno
├── package.json           # Configuración del workspace raíz
└── README.md              # Información general del proyecto
```

## Configuración del Entorno de Desarrollo

### 1. Requisitos

- **Node.js**: Versión 18 o superior
- **npm**: Versión 8 o superior
- **Git**: Para control de versiones
- **Cuenta de Supabase**: Para la base de datos

### 2. Configuración Inicial

```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd lottery-chatbot

# Ejecutar el script de inicialización
cd scripts
npm install
npm run init-all
```

### 3. Iniciar los Servicios en Desarrollo

**Terminal 1: API de TypeScript**
```bash
cd api
npm run dev
```

**Terminal 2: n8n**
```bash
cd n8n
npm run dev
```

## Arquitectura de Desarrollo

### Flujo de Datos

1. **WhatsApp** → **n8n** (webhook)
2. **n8n** → **API TypeScript** (HTTP request)
3. **API TypeScript** → **Supabase** (SQL queries)
4. **Supabase** → **API TypeScript** (results)
5. **API TypeScript** → **n8n** (JSON response)
6. **n8n** → **WhatsApp** (formatted message)

### Principios de Diseño

- **Separación de responsabilidades**: n8n maneja la orquestación, la API maneja la lógica de negocio.
- **Tipado estricto**: Todo el código TypeScript usa tipos estrictos.
- **Validación de entrada**: Todos los endpoints validan la entrada con Zod.
- **Logging**: Todas las operaciones importantes se registran en la base de datos.
- **Error handling**: Manejo centralizado de errores con mensajes informativos.

## Desarrollo de Nuevas Funcionalidades

### 1. Añadir un Nuevo Endpoint a la API

**Paso 1: Definir tipos**
```typescript
// En api/src/types/index.ts
export interface NewFeatureRequest {
  param1: string;
  param2: number;
}

export interface NewFeatureResponse {
  result: string;
  success: boolean;
}
```

**Paso 2: Crear el controlador**
```typescript
// En api/src/controllers/NewFeatureController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const newFeatureSchema = z.object({
  param1: z.string().min(1),
  param2: z.number().positive()
});

export class NewFeatureController {
  handleNewFeature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = newFeatureSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new AppError('Invalid request data', 400);
      }

      const { param1, param2 } = validation.data;

      // Lógica de negocio aquí
      const result = await this.processNewFeature(param1, param2);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  private async processNewFeature(param1: string, param2: number): Promise<string> {
    // Implementar lógica aquí
    return `Processed ${param1} with ${param2}`;
  }
}
```

**Paso 3: Registrar la ruta**
```typescript
// En api/src/index.ts
import { NewFeatureController } from './controllers/NewFeatureController';

const newFeatureController = new NewFeatureController();

app.post('/api/new-feature', newFeatureController.handleNewFeature);
```

### 2. Crear un Nuevo Workflow en n8n

**Paso 1: Diseñar el flujo**
- Identifica el trigger (webhook, cron, etc.)
- Define los pasos de procesamiento
- Determina las llamadas a la API necesarias
- Planifica la respuesta al usuario

**Paso 2: Implementar en n8n**
- Crea el workflow en la interfaz de n8n
- Configura los nodos necesarios
- Prueba el flujo con datos de ejemplo

**Paso 3: Exportar y versionar**
```bash
# Exportar el workflow desde n8n
# Guardar el archivo JSON en n8n/workflows/
# Nombrar siguiendo la convención: XX_nombre_descriptivo.json
```

### 3. Añadir una Nueva Tabla a la Base de Datos

**Paso 1: Crear la migración**
```sql
-- En database/migrations/XXX_nueva_tabla.sql
CREATE TABLE nueva_tabla (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_nueva_tabla_nombre ON nueva_tabla(nombre);

-- Trigger para updated_at
CREATE TRIGGER set_updated_at_nueva_tabla
  BEFORE UPDATE ON nueva_tabla
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Paso 2: Actualizar los tipos**
```typescript
// En shared/src/types/database.ts
export interface NuevaTabla {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}
```

**Paso 3: Crear el servicio**
```typescript
// En api/src/services/SupabaseService.ts
async getNuevaTablaById(id: string): Promise<NuevaTabla | null> {
  const { data, error } = await this.client
    .from('nueva_tabla')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new AppError(`Error fetching nueva_tabla: ${error.message}`, 500);
  }

  return data;
}
```

## Testing

### 1. Testing de la API

```bash
cd api
npm test
```

### 2. Testing del Sistema Completo

```bash
cd scripts
npm run test-system
```

### 3. Testing Manual

- Usa herramientas como Postman o curl para probar los endpoints de la API.
- Usa la interfaz de n8n para probar workflows individualmente.
- Envía mensajes de WhatsApp para probar el flujo completo.

## Debugging

### 1. Logs de la API

```bash
# En desarrollo
cd api
npm run dev

# Los logs aparecerán en la consola
```

### 2. Logs de n8n

- Ve a la pestaña "Executions" en n8n para ver el historial de ejecuciones.
- Haz clic en una ejecución para ver los datos que pasaron por cada nodo.

### 3. Logs de la Base de Datos

```sql
-- Ver logs recientes
SELECT * FROM system_logs 
ORDER BY created_at DESC 
LIMIT 50;

-- Filtrar por nivel de error
SELECT * FROM system_logs 
WHERE level = 'error' 
AND created_at > NOW() - INTERVAL '1 hour';
```

## Convenciones de Código

### 1. TypeScript

- Usa tipos estrictos siempre.
- Nombra las interfaces con PascalCase.
- Usa camelCase para variables y funciones.
- Usa UPPER_SNAKE_CASE para constantes.

### 2. Base de Datos

- Nombra las tablas en singular y snake_case.
- Usa UUID para las claves primarias.
- Incluye siempre `created_at` y `updated_at`.

### 3. n8n

- Nombra los workflows con números y descripción: `01_main_router.json`.
- Usa nombres descriptivos para los nodos.
- Comenta los nodos complejos.

### 4. Git

- Usa commits descriptivos en inglés.
- Crea branches para nuevas funcionalidades: `feature/nueva-funcionalidad`.
- Haz pull requests para revisión de código.

## Contribuir al Proyecto

1. **Fork** el repositorio.
2. Crea una **branch** para tu funcionalidad.
3. Desarrolla y **prueba** tu código.
4. Actualiza la **documentación** si es necesario.
5. Envía un **pull request** con una descripción clara de los cambios.

## Recursos Útiles

- **[Documentación de n8n](https://docs.n8n.io/)**
- **[Documentación de Supabase](https://supabase.com/docs)**
- **[API de WhatsApp Business](https://developers.facebook.com/docs/whatsapp)**
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)**

