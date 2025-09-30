# 🎰 Chatbot de Lotería - Sitio Web con Trazabilidad Avanzada

## Descripción

Este sitio web implementa un sistema completo de chatbot para una tienda de lotería con **visualización avanzada de trazas tipo flujo de nodos**. El sistema es completamente transparente y muestra todos los procesos internos de manera visual y profesional.

## Características Principales

### Visualización de Trazas Innovadora

El sitio web incluye un sistema único de visualización de trazas que permite ver exactamente cómo el sistema procesa cada consulta. Esta funcionalidad se presenta en tres modos diferentes:

**Modo Flujo** proporciona una vista básica con nodos agrupados que muestran las principales etapas del procesamiento, desde la recepción del mensaje hasta la respuesta final.

**Modo Mejorado** ofrece una experiencia visual avanzada con conexiones animadas entre pasos, métricas en tiempo real del rendimiento del sistema, y análisis automático de la eficiencia de cada operación.

**Modo Detallado** presenta un análisis técnico completo con panels expandibles que muestran inputs y outputs de cada función, tiempos de ejecución precisos, y la capacidad de descargar datos técnicos para análisis posterior.

### Funcionalidades del Chatbot

El sistema puede procesar diferentes tipos de consultas de manera inteligente. Para consultas de billetes de lotería, detecta automáticamente números de 5 dígitos y consulta la base de datos en tiempo real para verificar disponibilidad y precios. Para consultas generales sobre horarios, ubicación o servicios, utiliza procesamiento de lenguaje natural para proporcionar respuestas contextuales y útiles.

### Arquitectura Dual de Backends

El sitio web permite alternar entre dos implementaciones de backend diferentes, cada una con sus propias ventajas. El backend Node.js utiliza una implementación tradicional con código estructurado que proporciona trazabilidad detallada de cada operación. El backend N8N emplea workflows automatizados que procesan las consultas mediante flujos visuales, ofreciendo una alternativa robusta y escalable.

## Tecnologías Implementadas

### Frontend Moderno

La interfaz está construida con React 18 utilizando hooks modernos para gestión de estado, Vite para optimización de build y desarrollo rápido, Tailwind CSS para estilos responsive y profesionales, y Lucide React para iconografía consistente.

### Backend Robusto

Los backends están implementados con Flask para APIs REST eficientes, integración completa con Supabase para base de datos en tiempo real, DeepSeek AI para procesamiento de lenguaje natural avanzado, y CORS habilitado para acceso cross-origin seguro.

### Sistema de Trazabilidad

Cada operación del sistema es registrada con timestamps precisos en milisegundos, duraciones detalladas de cada paso del proceso, inputs y outputs completos de todas las funciones, y manejo exhaustivo de errores con stack traces preservados.

## Casos de Uso Principales

### Consulta de Billetes

Los usuarios pueden escribir cualquier número de 5 dígitos para consultar la disponibilidad de billetes específicos. El sistema verifica automáticamente en la base de datos, muestra precios actualizados, controla el acceso a billetes exclusivos para abonados, y proporciona información completa sobre el estado del billete.

### Información General

Para consultas sobre el negocio, los usuarios pueden preguntar sobre horarios de atención, ubicación de la tienda, información sobre sorteos, o detalles sobre la suscripción de abonados. El sistema procesa estas consultas mediante IA y proporciona respuestas contextuales y útiles.

### Análisis de Rendimiento

Cada interacción genera métricas detalladas que incluyen tiempo total de procesamiento, tiempo promedio por paso de la operación, identificación de posibles cuellos de botella, y tasa de éxito general del sistema.

## Seguridad y Robustez

El sistema implementa manejo completo de errores con try-catch en todas las operaciones críticas, fallbacks automáticos cuando servicios externos no están disponibles, logging estructurado para debugging eficiente, y timeouts configurados para evitar bloqueos del sistema.

## Acceso al Sistema

Una vez desplegado, el sitio web estará disponible permanentemente con acceso inmediato a todas las funcionalidades. Los usuarios pueden comenzar a interactuar inmediatamente escribiendo consultas en el chat, alternar entre diferentes backends para comparar rendimiento, explorar las trazas detalladas de cada operación, y acceder a métricas en tiempo real del sistema.

## Datos de Prueba

El sistema incluye datos reales de prueba para demostrar todas las funcionalidades. Los números de billete 10000, 10090, y 10115 están disponibles en la base de datos para consultas de prueba. Las consultas generales como "¿Cuál es el horario?" o "¿Dónde están ubicados?" demuestran el procesamiento de lenguaje natural.

## Soporte y Mantenimiento

El sistema está diseñado para ser completamente autónomo con monitoreo automático de la salud de los backends, logging completo para resolución de problemas, métricas de rendimiento en tiempo real, y documentación técnica completa para mantenimiento futuro.

Este sitio web representa una implementación completa y profesional de un sistema de chatbot con trazabilidad avanzada, diseñado para proporcionar transparencia total en todas las operaciones mientras mantiene una experiencia de usuario intuitiva y atractiva.
