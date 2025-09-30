/**
 * Constantes globales del sistema de chatbot de lotería
 */

// ===== ESTADOS DE SESIÓN =====
export const SESSION_STATES = {
  INITIAL: 'initial',
  MAIN_MENU: 'main_menu',
  AWAITING_TICKET_NUMBER: 'awaiting_ticket_number',
  AWAITING_PURCHASE_CONFIRMATION: 'awaiting_purchase_confirmation',
  PROCESSING_PURCHASE: 'processing_purchase',
  CHITCHAT: 'chitchat'
} as const;

// ===== ESTADOS DE TICKETS =====
export const TICKET_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold'
} as const;

// ===== ESTADOS DE PEDIDOS =====
export const ORDER_STATUS = {
  PENDING_REVIEW: 'pending_review',
  PROCESSED: 'processed',
  CANCELLED: 'cancelled'
} as const;

// ===== ESTADOS DE ABONADOS =====
export const SUBSCRIBER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

// ===== COMANDOS DE WHATSAPP =====
export const WHATSAPP_COMMANDS = {
  MENU: ['menu', 'menú', 'inicio', 'start', 'hola', 'hello'],
  HELP: ['ayuda', 'help', 'info'],
  CANCEL: ['cancelar', 'cancel', 'salir', 'exit'],
  YES: ['si', 'sí', 'yes', 'ok', 'vale', 'confirmar'],
  NO: ['no', 'nope', 'cancelar', 'cancel']
} as const;

// ===== MENSAJES PREDEFINIDOS =====
export const MESSAGES = {
  WELCOME: `¡Hola! 👋 Bienvenido a la Lotería XYZ.

Puedes:
1️⃣ Consultar la disponibilidad de un número (simplemente envíame el número)
2️⃣ Ver información de la empresa
3️⃣ Hablar con un agente

Escribe "menú" en cualquier momento para volver aquí.`,

  MENU: `📋 **Menú Principal**

¿Qué te gustaría hacer?

1️⃣ Consultar número de billete
2️⃣ Ver números disponibles
3️⃣ Información de la empresa
4️⃣ Hablar con un agente

Simplemente envía el número del billete que te interesa o escribe tu consulta.`,

  TICKET_NOT_FOUND: (ticketNumber: string) => 
    `❌ El número **${ticketNumber}** no parece ser un billete válido.
    
Por favor, verifica el número e inténtalo de nuevo.`,

  TICKET_NOT_AVAILABLE: (ticketNumber: string) => 
    `😔 Lo sentimos, el número **${ticketNumber}** ya no está disponible.
    
¿Te gustaría consultar otro número?`,

  TICKET_EXCLUSIVE: (ticketNumber: string) => 
    `🔒 El número **${ticketNumber}** es exclusivo para abonados.
    
¡Considera unirte a nuestro club de abonados para acceder a números exclusivos!`,

  TICKET_AVAILABLE: (ticketNumber: string, price: number) => 
    `✅ ¡Buenas noticias! El número **${ticketNumber}** está disponible.
    
💰 Precio: **${price}€**

¿Deseas solicitar su compra? Responde "sí" para confirmar.`,

  PURCHASE_CONFIRMED: (ticketNumber: string) => 
    `🎉 ¡Perfecto! Hemos recibido tu solicitud para el número **${ticketNumber}**.
    
Un operador la procesará en breve y te contactará para finalizar la compra.
    
📞 Te llamaremos pronto para completar el proceso.`,

  PURCHASE_CANCELLED: `❌ Compra cancelada. 
  
¿Hay algo más en lo que pueda ayudarte?`,

  INVALID_FORMAT: `🤔 No he entendido tu mensaje.
  
Puedes:
• Enviar un número de billete para consultar disponibilidad
• Escribir "menú" para ver las opciones
• Hacer una pregunta sobre nuestros servicios`,

  ERROR_GENERAL: `😅 Ha ocurrido un error inesperado.
  
Por favor, inténtalo de nuevo en unos momentos o contacta con nuestro soporte.`,

  GOODBYE: `👋 ¡Hasta pronto!
  
Gracias por usar nuestro servicio. Estaremos aquí cuando nos necesites.`
} as const;

// ===== CONFIGURACIÓN DE PAGINACIÓN =====
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
} as const;

// ===== CONFIGURACIÓN DE RATE LIMITING =====
export const RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 10,
  MESSAGES_PER_HOUR: 100,
  ORDERS_PER_DAY: 50
} as const;

// ===== CONFIGURACIÓN DE TIMEOUTS =====
export const TIMEOUTS = {
  SESSION_TIMEOUT_MINUTES: 30,
  RESERVATION_TIMEOUT_MINUTES: 5,
  WEBHOOK_TIMEOUT_SECONDS: 30,
  DATABASE_TIMEOUT_SECONDS: 10
} as const;

// ===== EXPRESIONES REGULARES =====
export const REGEX = {
  TICKET_NUMBER: /^\d{5}$/,
  PHONE_NUMBER: /^\+?[1-9]\d{1,14}$/,
  SPANISH_PHONE: /^(\+34|0034|34)?[6789]\d{8}$/
} as const;

// ===== CÓDIGOS DE ERROR =====
export const ERROR_CODES = {
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  TICKET_NOT_AVAILABLE: 'TICKET_NOT_AVAILABLE',
  USER_NOT_SUBSCRIBER: 'USER_NOT_SUBSCRIBER',
  INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  WHATSAPP_API_ERROR: 'WHATSAPP_API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// ===== CONFIGURACIÓN DE WHATSAPP =====
export const WHATSAPP_CONFIG = {
  API_VERSION: 'v18.0',
  BASE_URL: 'https://graph.facebook.com',
  MESSAGE_TYPES: {
    TEXT: 'text',
    INTERACTIVE: 'interactive',
    TEMPLATE: 'template'
  },
  BUTTON_LIMITS: {
    MAX_BUTTONS: 3,
    MAX_TITLE_LENGTH: 20,
    MAX_BODY_LENGTH: 1024
  }
} as const;

// ===== CONFIGURACIÓN DE BASE DE DATOS =====
export const DATABASE_CONFIG = {
  TABLES: {
    LOTTERY_TICKETS: 'lottery_tickets',
    SUBSCRIBERS: 'subscribers',
    ORDERS: 'orders',
    USER_SESSIONS: 'user_sessions',
    KNOWLEDGE_BASE: 'knowledge_base'
  },
  INDEXES: {
    TICKET_NUMBER: 'ix_lottery_tickets_ticket_number',
    PHONE_NUMBER: 'ix_subscribers_phone_number',
    USER_PHONE: 'ix_user_sessions_user_phone'
  }
} as const;

// ===== CONFIGURACIÓN DE LOGS =====
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

// ===== CONFIGURACIÓN DE EMPRESA =====
export const COMPANY_INFO = {
  NAME: 'Lotería XYZ',
  PHONE: '+34 900 123 456',
  EMAIL: 'info@loteriaxyz.com',
  ADDRESS: 'Calle Principal 123, 28001 Madrid',
  HOURS: 'Lunes a Viernes: 9:00 - 18:00',
  WEBSITE: 'https://www.loteriaxyz.com'
} as const;

