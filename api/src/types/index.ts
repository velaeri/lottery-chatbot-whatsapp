/**
 * Tipos TypeScript para la API del chatbot de lotería
 */

// Re-exportar tipos compartidos
export * from '../../../shared/src/types';

// Tipos específicos de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para validación de entrada
export interface TicketAvailabilityRequest {
  ticketNumber: string;
  userPhone: string;
}

export interface TicketAvailabilityResponse {
  available: boolean;
  ticketId?: string;
  price?: number;
  isExclusive?: boolean;
  requiresSubscription?: boolean;
  message: string;
}

export interface ReserveTicketRequest {
  ticketNumber: string;
  userPhone: string;
}

export interface ReserveTicketResponse {
  success: boolean;
  orderId?: string;
  message: string;
}

export interface KnowledgeSearchRequest {
  query: string;
  category?: string;
  limit?: number;
}

export interface KnowledgeSearchResponse {
  matches: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    score: number;
  }>;
  hasMatch: boolean;
  bestMatch?: {
    id: string;
    question: string;
    answer: string;
    category: string;
    score: number;
  };
}

export interface UserSessionRequest {
  userPhone: string;
  state?: string;
  context?: Record<string, any>;
}

export interface UserSessionResponse {
  userPhone: string;
  state: string;
  context: Record<string, any>;
  updatedAt: string;
}

// Tipos para logs
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  userPhone?: string;
  workflowId?: string;
  timestamp: string;
}

// Tipos para estadísticas
export interface SystemStats {
  tickets: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    exclusive: number;
  };
  orders: {
    total: number;
    pending: number;
    processed: number;
    cancelled: number;
  };
  users: {
    totalSessions: number;
    activeSessions: number;
    subscribers: number;
  };
  activity: {
    messagesLast24h: number;
    ordersLast24h: number;
    errorsLast24h: number;
  };
}

// Tipos para configuración
export interface AppConfig {
  port: number;
  nodeEnv: string;
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  whatsapp: {
    accessToken: string;
    phoneNumberId: string;
    webhookVerifyToken: string;
  };
  logging: {
    level: string;
    format: string;
  };
}

// Tipos para middleware
export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    role: string;
  };
}

// Tipos para errores personalizados
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Tipos para validación
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}

