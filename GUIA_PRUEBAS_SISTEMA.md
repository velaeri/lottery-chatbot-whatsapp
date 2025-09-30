# 🧪 Guía de Pruebas del Sistema Completo

## Introducción

Esta guía proporciona instrucciones detalladas para verificar el funcionamiento completo del sistema de chatbot de lotería con trazabilidad avanzada. El sistema ha sido diseñado para ser completamente transparente y mostrar todos los procesos internos de manera visual y profesional.

## Configuración Inicial

### Acceso a los Sistemas

El sistema cuenta con dos backends desplegados permanentemente que pueden ser utilizados de forma intercambiable:

**Backend Node.js**: https://0vhlizcg9gg5.manus.space - Implementación tradicional con código TypeScript simulado en Flask, que incluye trazabilidad completa de cada operación, desde la recepción del mensaje hasta la respuesta final.

**Backend N8N**: https://g8h3ilc3w357.manus.space - Implementación basada en workflows automatizados que procesa las consultas mediante flujos visuales, ofreciendo una alternativa robusta al backend tradicional.

**Frontend Web**: Una vez publicado por el usuario, proporcionará una interfaz completa con visualización de trazas en tres modos diferentes: flujo básico, mejorado con conexiones animadas, y detallado con análisis técnico completo.

## Casos de Prueba Principales

### Prueba 1: Consulta de Billete Existente

**Objetivo**: Verificar que el sistema puede consultar billetes reales en la base de datos y mostrar el flujo completo de trazas.

**Pasos a seguir**:
1. Acceder al frontend web una vez publicado
2. Escribir el número "10000" en el campo de mensaje
3. Enviar el mensaje y observar la respuesta streaming
4. Hacer clic en el botón "Trazas" que aparece junto al mensaje del bot
5. Explorar los tres modos de visualización: Flujo, Mejorado y Detallado

**Resultado esperado**: El sistema debe mostrar información completa del billete, incluyendo precio y disponibilidad. Las trazas deben mostrar aproximadamente 14 pasos del proceso, desde la recepción del mensaje hasta la respuesta final, incluyendo consultas a la base de datos y procesamiento con IA.

### Prueba 2: Consulta de Información General

**Objetivo**: Verificar el procesamiento de consultas generales mediante IA sin acceso a base de datos.

**Pasos a seguir**:
1. Escribir "¿Cuál es el horario?" en el chat
2. Observar la respuesta del sistema
3. Revisar las trazas generadas para este tipo de consulta
4. Cambiar al backend N8N usando el panel de configuración
5. Repetir la misma consulta y comparar respuestas

**Resultado esperado**: El sistema debe proporcionar información sobre horarios de atención, ubicación y servicios. Las trazas deben mostrar procesamiento directo con IA sin consultas a base de datos, con tiempos de respuesta similares entre ambos backends.

### Prueba 3: Comparación de Backends

**Objetivo**: Verificar que ambos backends funcionan correctamente y proporcionan trazabilidad completa.

**Pasos a seguir**:
1. Realizar la misma consulta ("10090") en ambos backends
2. Comparar los tiempos de respuesta mostrados en las métricas
3. Analizar las diferencias en las trazas generadas
4. Verificar que ambos backends acceden correctamente a la base de datos

**Resultado esperado**: Ambos backends deben proporcionar respuestas equivalentes con trazabilidad completa, aunque pueden diferir en la implementación interna y estructura de las trazas.

### Prueba 4: Visualización Avanzada de Trazas

**Objetivo**: Verificar todas las funcionalidades de visualización de trazas implementadas.

**Pasos a seguir**:
1. Realizar una consulta que genere múltiples trazas
2. Abrir el modal de visualización de trazas
3. Probar el modo "Flujo" y verificar las conexiones entre nodos
4. Cambiar al modo "Mejorado" y observar las métricas en tiempo real
5. Explorar el modo "Detallado" expandiendo diferentes pasos
6. Utilizar las funciones de copia y descarga de datos
7. Verificar las animaciones y transiciones visuales

**Resultado esperado**: La visualización debe mostrar un flujo profesional con conexiones animadas, métricas precisas de rendimiento, y detalles técnicos completos de cada paso del proceso.

## Verificación de Funcionalidades Específicas

### Trazabilidad y Transparencia

El sistema implementa un enfoque completamente honesto donde cada operación es registrada y mostrada al usuario. Las trazas incluyen timestamps precisos, duraciones en milisegundos, inputs y outputs de cada función, y manejo completo de errores. Esta transparencia permite a los usuarios entender exactamente cómo el sistema procesa sus consultas.

### Gestión de Estados de Usuario

El sistema diferencia entre usuarios regulares y abonados, controlando el acceso a billetes exclusivos. Esta funcionalidad puede probarse activando el modo "Abonado" en el panel de configuración y consultando billetes marcados como exclusivos en la base de datos.

### Manejo de Errores y Robustez

El sistema incluye manejo robusto de errores con fallbacks automáticos cuando los servicios externos no están disponibles. Esto puede verificarse desconectando temporalmente la conexión a internet o utilizando números de billete que no existen en la base de datos.

## Métricas de Rendimiento

### Tiempos de Respuesta Esperados

Las consultas típicas deben completarse en un rango de 4 a 8 segundos, dependiendo de la complejidad del procesamiento requerido. Las consultas que requieren acceso a base de datos y procesamiento con IA naturalmente toman más tiempo que las consultas simples de información general.

### Análisis de Trazas

Cada traza debe incluir información detallada sobre la duración de cada paso, permitiendo identificar posibles cuellos de botella en el sistema. Las métricas mostradas incluyen tiempo total, promedio por paso, y tasa de éxito del proceso completo.

## Resolución de Problemas

### Problemas Comunes

Si el sistema no responde correctamente, verificar primero que ambos backends estén activos mediante las URLs de health check. Los errores de conectividad se muestran claramente en las trazas con información detallada para facilitar el debugging.

### Verificación de Conectividad

Los backends pueden verificarse directamente mediante curl o herramientas similares. Ambos deben responder con código HTTP 200 en sus endpoints de salud y procesar correctamente las consultas POST al endpoint /chat.

## Conclusiones de las Pruebas

Al completar estas pruebas, se debe verificar que el sistema cumple con todos los objetivos de transparencia, robustez y funcionalidad. La visualización de trazas debe proporcionar una comprensión completa de los procesos internos, mientras que la interfaz de usuario debe ser intuitiva y responsive en diferentes dispositivos.

El sistema está diseñado para ser completamente honesto en sus operaciones, mostrando tanto éxitos como errores de manera clara y profesional, lo que permite a los usuarios confiar en la transparencia del proceso de consulta de billetes de lotería.
