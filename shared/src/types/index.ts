/**
 * Tipos compartidos para el sistema de chatbot de lotería
 */

// ===== TIPOS DE BASE DE DATOS =====

export interface LotteryTicket {
  id: string;
  ticket_number: string;
  status: 'available' | 'reserved' | 'sold';
  is_exclusive: boolean;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  id: string;
  phone_number: string;
  status: 'active' | 'inactive';
  name?: string;
  created_at: string;
}

export interface Order {
  id: string;
  ticket_id: string;
  user_phone: string;
  status: 'pending_review' | 'processed' | 'cancelled';
  created_at: string;
}

export interface UserSession {
  user_phone: string;
  state?: string;
  context?: Record<string, any>;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  question?: string;
  answer: string;
  keywords?: string;
}

// ===== TIPOS DE WHATSAPP =====

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
}

export interface WhatsAppWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
      };
      field: string;
    }>;
  }>;
}

// ===== TIPOS DE SESIÓN =====

export type SessionState = 
  | 'initial'
  | 'main_menu'
  | 'awaiting_ticket_number'
  | 'awaiting_purchase_confirmation'
  | 'processing_purchase'
  | 'chitchat';

export interface SessionContext {
  ticket_number?: string;
  ticket_price?: number;
  last_message?: string;
  retry_count?: number;
  [key: string]: any;
}

// ===== TIPOS DE RESPUESTA =====

export interface ChatbotResponse {
  success: boolean;
  message: string;
  next_state?: SessionState;
  context_update?: Partial<SessionContext>;
  error?: string;
}

export interface TicketAvailabilityResponse {
  available: boolean;
  ticket?: LotteryTicket;
  message: string;
  requires_subscription?: boolean;
}

// ===== TIPOS DE CONFIGURACIÓN =====

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  whatsapp: {
    apiKey: string;
    phoneNumberId: string;
    webhookVerifyToken: string;
  };
  n8n: {
    host: string;
    port: number;
    protocol: string;
    webhookUrl: string;
  };
  api: {
    port: number;
    host: string;
  };
}

// ===== TIPOS DE ERROR =====

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export type ErrorCode = 
  | 'TICKET_NOT_FOUND'
  | 'TICKET_NOT_AVAILABLE'
  | 'USER_NOT_SUBSCRIBER'
  | 'INVALID_MESSAGE_FORMAT'
  | 'DATABASE_ERROR'
  | 'WHATSAPP_API_ERROR'
  | 'UNKNOWN_ERROR';

// ===== TIPOS DE UTILIDAD =====

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== TIPOS DE WEBHOOK N8N =====

export interface N8nWebhookData {
  body: WhatsAppWebhook;
  headers: Record<string, string>;
  params: Record<string, string>;
  query: Record<string, string>;
}

export interface N8nExecutionData {
  userPhone: string;
  userMessage: string;
  messageType: string;
  timestamp: string;
  sessionState?: SessionState;
  sessionContext?: SessionContext;
}

// ===== EXPORTACIONES =====

export * from './database';
export * from './whatsapp';
export * from './api';

