# 🎰 Lottery Chatbot - Sistema de Chatbot de WhatsApp para Lotería

Un sistema completo de chatbot de WhatsApp para tiendas de boletos de lotería, construido con n8n, Supabase y TypeScript.

## 🚀 Características

- ✅ **Consulta de disponibilidad** de números de lotería en tiempo real
- ✅ **Sistema de abonados** con acceso a números exclusivos
- ✅ **Gestión de inventario** robusta con Supabase
- ✅ **Procesamiento de pedidos** automatizado
- ✅ **Chitchat inteligente** con base de conocimiento
- ✅ **Gestión de sesiones** para conversaciones contextuales
- ✅ **Arquitectura escalable** lista para producción

## 📁 Estructura del Proyecto

```
lottery-chatbot/
├── 📂 n8n/                    # Configuración y workflows de n8n
│   ├── workflows/             # Flujos de trabajo JSON
│   ├── credentials/           # Plantillas de credenciales
│   └── package.json
├── 📂 api/                    # API TypeScript adicional
│   ├── src/                   # Código fuente TypeScript
│   └── package.json
├── 📂 database/               # Scripts y configuración de BD
│   ├── migrations/            # Migraciones SQL
│   ├── seeds/                 # Datos de prueba
│   └── package.json
├── 📂 shared/                 # Tipos y utilidades compartidas
│   ├── types/                 # Definiciones TypeScript
│   └── package.json
├── 📂 docs/                   # Documentación completa
│   ├── setup/                 # Guías de configuración
│   └── api/                   # Documentación de API
├── 📂 scripts/                # Scripts de deployment y utilidades
└── package.json              # Configuración del monorepo
```

## 🛠️ Tecnologías

- **n8n**: Plataforma de automatización y workflows
- **Supabase**: Base de datos PostgreSQL como servicio
- **WhatsApp Business API**: Comunicación con usuarios
- **TypeScript**: Desarrollo type-safe
- **360dialog**: Proveedor de API de WhatsApp

## ⚡ Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de 360dialog (para WhatsApp)

### Instalación

1. **Clonar e instalar dependencias:**
   ```bash
   git clone <repository-url>
   cd lottery-chatbot
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

3. **Configurar base de datos:**
   ```bash
   npm run db:setup
   npm run db:seed
   ```

4. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```

## 📖 Documentación

- [🔧 Guía de Configuración](./docs/setup/README.md)
- [🏗️ Arquitectura del Sistema](./docs/architecture.md)
- [🔄 Flujos de Trabajo](./docs/workflows.md)
- [📡 API Reference](./docs/api/README.md)
- [🚀 Deployment](./docs/deployment.md)

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Test específicos
npm run test:api
npm run test:workflows
```

## 🚀 Deployment

Ver la [Guía de Deployment](./docs/deployment.md) para instrucciones detalladas.

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Soporte

Para soporte y preguntas, consulta la [documentación](./docs/) o abre un issue.

---

**Desarrollado con ❤️ por Manus AI**

