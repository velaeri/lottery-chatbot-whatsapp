# Guía de Inicio Rápido

Esta guía te permitirá poner en marcha el sistema completo en menos de 10 minutos.

## Requisitos Previos

- **Node.js**: Versión 18 o superior
- **npm**: Versión 8 o superior
- **Git**: Instalado en tu sistema
- **Cuenta de Supabase**: [Crea una aquí](https://supabase.com/)

## Pasos de Instalación

### 1. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd lottery-chatbot
```

### 2. Ejecutar el Script de Inicialización

Este script interactivo te guiará en la configuración de todo el sistema.

```bash
cd scripts
npm install
npm run init-all
```

**Durante el script, se te pedirá:**

- **URL de Supabase**: La encontrarás en `Settings > API` en tu proyecto de Supabase.
- **Service Role Key de Supabase**: También en `Settings > API` (mantenla segura).
- **Configuración de WhatsApp (opcional)**: Puedes omitirla por ahora.

El script se encargará de:

- Crear el archivo `.env` con tu configuración.
- Instalar todas las dependencias del proyecto.
- Configurar la base de datos en Supabase.
- Cargar datos de prueba.

### 3. Iniciar los Servicios

Abre dos terminales separadas:

**Terminal 1: Iniciar n8n**

```bash
cd n8n
npm run dev
```

- **Accede a n8n**: [http://localhost:5678](http://localhost:5678)
- **Configura las credenciales**: 
  - Ve a `Credentials > Add credential`.
  - Crea una credencial de Supabase con los datos de tu proyecto.
  - Si configuraste WhatsApp, crea también la credencial correspondiente.
- **Importa y activa los workflows**: 
  - Ve a `Workflows > Import from file`.
  - Importa todos los archivos de `n8n/workflows/`.
  - Activa todos los workflows importados.

**Terminal 2: Iniciar la API**

```bash
cd api
npm run dev
```

La API se ejecutará en [http://localhost:3000](http://localhost:3000).

### 4. Probar el Sistema

Una vez que los servicios estén en marcha, puedes probar el sistema con el script de testing.

```bash
cd scripts
npm run test-system
```

Si todo está correcto, verás un reporte de tests exitosos.

## ¡Listo! El Sistema está en Marcha

Ahora tienes:

- **Base de datos Supabase** configurada y con datos.
- **Servidor n8n** ejecutándose con todos los workflows.
- **API de TypeScript** gestionando la lógica de negocio.

### Próximos Pasos

- **Conectar WhatsApp**: Sigue la [Guía de Configuración Detallada](./03_configuration.md#conectar-whatsapp) para conectar tu número de WhatsApp.
- **Explorar la API**: Revisa los endpoints disponibles en [http://localhost:3000/health](http://localhost:3000/health).
- **Personalizar el sistema**: Consulta la [Guía de Desarrollo](./06_development.md) para extender la funcionalidad.

## Troubleshooting

- **Error de conexión a Supabase**: Verifica que las credenciales en `.env` sean correctas.
- **API no se inicia**: Asegúrate de que el puerto 3000 no esté en uso.
- **n8n no se inicia**: Verifica que el puerto 5678 no esté en uso.

Para más detalles, consulta la [Guía de Troubleshooting](./07_troubleshooting.md).

