/**
 * Tipos específicos para operaciones de base de datos
 */

// ===== TIPOS DE FILTROS =====

export interface TicketFilters {
  status?: 'available' | 'reserved' | 'sold';
  is_exclusive?: boolean;
  price_min?: number;
  price_max?: number;
  ticket_number?: string;
}

export interface OrderFilters {
  status?: 'pending_review' | 'processed' | 'cancelled';
  user_phone?: string;
  date_from?: string;
  date_to?: string;
}

export interface SubscriberFilters {
  status?: 'active' | 'inactive';
  phone_number?: string;
  name?: string;
}

// ===== TIPOS DE CREACIÓN =====

export interface CreateTicketData {
  ticket_number: string;
  status?: 'available' | 'reserved' | 'sold';
  is_exclusive?: boolean;
  price: number;
}

export interface CreateOrderData {
  ticket_id: string;
  user_phone: string;
  status?: 'pending_review' | 'processed' | 'cancelled';
}

export interface CreateSubscriberData {
  phone_number: string;
  status?: 'active' | 'inactive';
  name?: string;
}

export interface CreateKnowledgeBaseData {
  question?: string;
  answer: string;
  keywords?: string;
}

// ===== TIPOS DE ACTUALIZACIÓN =====

export interface UpdateTicketData {
  status?: 'available' | 'reserved' | 'sold';
  is_exclusive?: boolean;
  price?: number;
}

export interface UpdateOrderData {
  status?: 'pending_review' | 'processed' | 'cancelled';
}

export interface UpdateSubscriberData {
  status?: 'active' | 'inactive';
  name?: string;
}

export interface UpdateSessionData {
  state?: string;
  context?: Record<string, any>;
}

// ===== TIPOS DE CONSULTA =====

export interface DatabaseQueryOptions {
  select?: string[];
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface SupabaseListResponse<T> {
  data: T[] | null;
  error: any;
  count?: number;
}

// ===== TIPOS DE TRANSACCIÓN =====

export interface TicketReservationData {
  ticket_id: string;
  user_phone: string;
  reservation_expires_at?: string;
}

export interface PurchaseTransactionData {
  ticket: CreateTicketData;
  order: CreateOrderData;
  session_update: UpdateSessionData;
}

