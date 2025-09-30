# Guía de Troubleshooting

Esta guía proporciona soluciones a los problemas más comunes que puedes encontrar al usar el chatbot de lotería.

## Problemas de Configuración

### Error: "Variables de entorno faltantes"

**Síntoma**: El script de testing muestra que faltan variables de entorno.

**Causa**: El archivo `.env` no existe o no contiene las variables requeridas.

**Solución**:
1. Verifica que existe el archivo `.env` en la raíz del proyecto.
2. Copia `.env.example` a `.env` si no existe:
   ```bash
   cp .env.example .env
   ```
3. Rellena todas las variables requeridas:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Opcionalmente: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

### Error: "Cannot connect to Supabase"

**Síntoma**: La API o los scripts no pueden conectarse a Supabase.

**Causas posibles**:
- URL de Supabase incorrecta
- Service Role Key incorrecta
- Proyecto de Supabase pausado o eliminado
- Problemas de red

**Soluciones**:
1. **Verificar credenciales**:
   - Ve a tu proyecto en [Supabase](https://supabase.com/dashboard)
   - En `Settings > API`, copia la URL y la Service Role Key
   - Asegúrate de que coinciden con tu archivo `.env`

2. **Verificar estado del proyecto**:
   - Asegúrate de que tu proyecto de Supabase esté activo
   - Si está pausado, reactívalo

3. **Probar conectividad**:
   ```bash
   curl -H "Authorization: Bearer TU_SERVICE_ROLE_KEY" \
        "https://tu-proyecto.supabase.co/rest/v1/"
   ```

### Error: "WhatsApp credentials invalid"

**Síntoma**: Los tests de WhatsApp fallan con credenciales inválidas.

**Causas posibles**:
- Access Token expirado o incorrecto
- Phone Number ID incorrecto
- Aplicación de WhatsApp no configurada correctamente

**Soluciones**:
1. **Verificar token**:
   - Ve a [Meta for Developers](https://developers.facebook.com/)
   - Verifica que tu aplicación esté activa
   - Genera un nuevo Access Token si es necesario

2. **Verificar Phone Number ID**:
   - En la configuración de WhatsApp de tu app, copia el Phone Number ID correcto

3. **Probar la API manualmente**:
   ```bash
   curl -H "Authorization: Bearer TU_ACCESS_TOKEN" \
        "https://graph.facebook.com/v18.0/TU_PHONE_NUMBER_ID"
   ```

## Problemas de Servicios

### Error: "API not responding" / "ECONNREFUSED"

**Síntoma**: Los tests muestran que la API no responde.

**Causa**: La API de TypeScript no está ejecutándose.

**Solución**:
1. **Iniciar la API**:
   ```bash
   cd api
   npm run dev
   ```

2. **Verificar el puerto**:
   - Asegúrate de que el puerto 3000 no esté en uso por otro proceso
   - Cambia el puerto en `.env` si es necesario:
     ```env
     PORT=3001
     ```

3. **Verificar logs**:
   - Revisa los logs de la API en busca de errores de inicio

### Error: "n8n not available"

**Síntoma**: Los tests muestran que n8n no está disponible.

**Causa**: n8n no está ejecutándose.

**Solución**:
1. **Iniciar n8n**:
   ```bash
   cd n8n
   npm run dev
   ```

2. **Verificar el puerto**:
   - Asegúrate de que el puerto 5678 no esté en uso
   - Cambia el puerto en `.env` si es necesario:
     ```env
     N8N_PORT=5679
     ```

3. **Acceder a la interfaz**:
   - Ve a [http://localhost:5678](http://localhost:5678)
   - Verifica que la interfaz carga correctamente

### Error: "Database tables not found"

**Síntoma**: Errores al acceder a tablas de la base de datos.

**Causa**: Las migraciones de la base de datos no se han ejecutado.

**Solución**:
1. **Ejecutar migraciones**:
   ```bash
   cd database
   npm run setup
   ```

2. **Verificar en Supabase**:
   - Ve a tu proyecto en Supabase
   - En `Table Editor`, verifica que las tablas existen:
     - `lottery_tickets`
     - `subscribers`
     - `orders`
     - `user_sessions`
     - `knowledge_base`
     - `system_logs`

3. **Cargar datos de prueba**:
   ```bash
   cd database
   npm run seed
   ```

## Problemas de n8n

### Error: "Workflow execution failed"

**Síntoma**: Los workflows de n8n fallan al ejecutarse.

**Causas posibles**:
- Credenciales no configuradas
- Endpoints de la API incorrectos
- Datos de entrada inválidos

**Soluciones**:
1. **Verificar credenciales**:
   - Ve a `Credentials` en n8n
   - Asegúrate de que las credenciales de Supabase y WhatsApp están configuradas
   - Prueba las credenciales usando el botón "Test"

2. **Verificar endpoints**:
   - En los nodos HTTP Request, verifica que las URLs apunten a `http://localhost:3000`
   - Asegúrate de que la API esté ejecutándose

3. **Revisar logs de ejecución**:
   - Ve a `Executions` en n8n
   - Haz clic en una ejecución fallida para ver los detalles
   - Revisa los datos que pasaron por cada nodo

### Error: "Webhook not receiving messages"

**Síntoma**: Los mensajes de WhatsApp no llegan a n8n.

**Causas posibles**:
- Webhook URL incorrecta en Meta
- n8n no accesible desde internet
- Verify Token incorrecto

**Soluciones**:
1. **Verificar URL del webhook**:
   - En desarrollo, usa ngrok para exponer n8n:
     ```bash
     ngrok http 5678
     ```
   - Configura la URL en Meta: `https://xxxx.ngrok.io/webhook/whatsapp`

2. **Verificar Verify Token**:
   - Asegúrate de que el token en Meta coincide con `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

3. **Probar el webhook**:
   - Usa la herramienta de prueba de Meta para enviar un mensaje
   - Verifica que aparece en las ejecuciones de n8n

## Problemas de Rendimiento

### Lentitud en las respuestas

**Síntoma**: El chatbot tarda mucho en responder.

**Causas posibles**:
- Consultas lentas a la base de datos
- API sobrecargada
- Problemas de red

**Soluciones**:
1. **Optimizar consultas**:
   - Revisa los logs de Supabase para identificar consultas lentas
   - Añade índices si es necesario

2. **Monitorear recursos**:
   ```bash
   cd scripts
   npm run health-check
   ```

3. **Escalar recursos**:
   - Considera actualizar tu plan de Supabase
   - Aumenta los recursos del servidor si usas VPS

### Memoria insuficiente

**Síntoma**: Los procesos se cierran inesperadamente.

**Causa**: Falta de memoria RAM.

**Soluciones**:
1. **Monitorear uso de memoria**:
   ```bash
   free -h
   htop
   ```

2. **Optimizar código**:
   - Revisa el código en busca de memory leaks
   - Limita el tamaño de los logs en memoria

3. **Aumentar memoria**:
   - Considera actualizar tu servidor
   - Configura swap si es necesario

## Problemas de Datos

### Datos de prueba corruptos

**Síntoma**: Los datos en la base de datos parecen incorrectos.

**Solución**:
1. **Limpiar y recargar datos**:
   ```bash
   cd database
   # Eliminar datos existentes (cuidado en producción)
   npm run clean
   # Recargar datos de prueba
   npm run seed
   ```

### Logs de sistema creciendo demasiado

**Síntoma**: La tabla `system_logs` ocupa mucho espacio.

**Solución**:
1. **Limpiar logs antiguos**:
   ```sql
   DELETE FROM system_logs 
   WHERE created_at < NOW() - INTERVAL '30 days';
   ```

2. **Configurar rotación automática**:
   - Crea un cron job para limpiar logs periódicamente

## Herramientas de Diagnóstico

### Scripts de utilidades

```bash
# Test completo del sistema
cd scripts
npm run test-system

# Health check detallado
npm run health-check

# Validar configuración
npm run validate-config
```

### Logs útiles

```bash
# Logs de la API
cd api
npm run dev  # Los logs aparecen en consola

# Logs de Docker (en producción)
docker logs lottery_api
docker logs lottery_n8n

# Logs de la base de datos
# Consultar la tabla system_logs en Supabase
```

### Endpoints de diagnóstico

```bash
# Health check de la API
curl http://localhost:3000/health

# Estado detallado
curl http://localhost:3000/api/status

# Estadísticas del sistema
curl http://localhost:3000/api/tickets/stats
```

## Contacto de Soporte

Si ninguna de estas soluciones resuelve tu problema:

1. **Revisa los logs** detalladamente
2. **Documenta el problema** con pasos para reproducirlo
3. **Incluye información del entorno** (SO, versiones, configuración)
4. **Contacta al equipo de desarrollo** con toda la información recopilada

## Problemas Conocidos

### Deprecation Warning de punycode

**Síntoma**: Aparece un warning sobre el módulo punycode.

**Causa**: Dependencia interna de Node.js que será removida en versiones futuras.

**Solución**: Este warning no afecta la funcionalidad. Se resolverá automáticamente cuando las dependencias se actualicen.

