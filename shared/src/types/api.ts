/**
 * Tipos específicos para la API REST
 */

// ===== TIPOS DE REQUEST =====

export interface ApiRequest<T = any> {
  body: T;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// ===== ENDPOINTS DE TICKETS =====

export interface GetTicketsQuery {
  status?: 'available' | 'reserved' | 'sold';
  is_exclusive?: boolean;
  price_min?: number;
  price_max?: number;
  page?: number;
  limit?: number;
}

export interface CreateTicketRequest {
  ticket_number: string;
  price: number;
  is_exclusive?: boolean;
}

export interface UpdateTicketRequest {
  status?: 'available' | 'reserved' | 'sold';
  price?: number;
  is_exclusive?: boolean;
}

export interface CheckTicketAvailabilityRequest {
  ticket_number: string;
  user_phone: string;
}

// ===== ENDPOINTS DE ORDERS =====

export interface GetOrdersQuery {
  status?: 'pending_review' | 'processed' | 'cancelled';
  user_phone?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface CreateOrderRequest {
  ticket_number: string;
  user_phone: string;
}

export interface UpdateOrderRequest {
  status: 'pending_review' | 'processed' | 'cancelled';
  notes?: string;
}

// ===== ENDPOINTS DE SUBSCRIBERS =====

export interface GetSubscribersQuery {
  status?: 'active' | 'inactive';
  phone_number?: string;
  name?: string;
  page?: number;
  limit?: number;
}

export interface CreateSubscriberRequest {
  phone_number: string;
  name?: string;
}

export interface UpdateSubscriberRequest {
  status?: 'active' | 'inactive';
  name?: string;
}

export interface CheckSubscriberRequest {
  phone_number: string;
}

// ===== ENDPOINTS DE KNOWLEDGE BASE =====

export interface GetKnowledgeBaseQuery {
  keywords?: string;
  page?: number;
  limit?: number;
}

export interface CreateKnowledgeBaseRequest {
  question?: string;
  answer: string;
  keywords?: string;
}

export interface UpdateKnowledgeBaseRequest {
  question?: string;
  answer?: string;
  keywords?: string;
}

export interface SearchKnowledgeBaseRequest {
  query: string;
  limit?: number;
}

// ===== ENDPOINTS DE SESSIONS =====

export interface GetSessionRequest {
  user_phone: string;
}

export interface UpdateSessionRequest {
  user_phone: string;
  state?: string;
  context?: Record<string, any>;
}

export interface ClearSessionRequest {
  user_phone: string;
}

// ===== ENDPOINTS DE WHATSAPP =====

export interface SendMessageRequest {
  to: string;
  message: string;
  type?: 'text' | 'button' | 'list' | 'template';
  template_data?: {
    name: string;
    variables?: string[];
  };
}

export interface SendBulkMessageRequest {
  recipients: string[];
  message: string;
  type?: 'text' | 'template';
  template_data?: {
    name: string;
    variables?: string[];
  };
}

// ===== ENDPOINTS DE ANALYTICS =====

export interface GetAnalyticsQuery {
  date_from: string;
  date_to: string;
  metric?: 'messages' | 'orders' | 'users' | 'revenue';
  group_by?: 'day' | 'week' | 'month';
}

export interface AnalyticsData {
  period: string;
  messages_sent: number;
  messages_received: number;
  orders_created: number;
  orders_processed: number;
  unique_users: number;
  revenue: number;
}

// ===== TIPOS DE MIDDLEWARE =====

export interface AuthenticatedRequest extends ApiRequest {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// ===== TIPOS DE HEALTH CHECK =====

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: 'up' | 'down';
    whatsapp_api: 'up' | 'down';
    n8n: 'up' | 'down';
  };
  version: string;
}

