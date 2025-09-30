/**
 * Servicio para interactuar con Supabase
 * Proporciona métodos tipados para todas las operaciones de base de datos
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, LotteryTicket, Subscriber, Order, UserSession, KnowledgeBase, SystemLog } from '../types';
import { AppError } from '../types';

export class SupabaseService {
  private client: SupabaseClient<Database>;

  constructor(url?: string, serviceRoleKey?: string) {
    const supabaseUrl = url || process.env.SUPABASE_URL;
    const supabaseKey = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL y Service Role Key son requeridos');
    }
    
    this.client = createClient<Database>(supabaseUrl, supabaseKey);
  }

  // =====================================================
  // LOTTERY TICKETS
  // =====================================================

  async getTicketByNumber(ticketNumber: string): Promise<LotteryTicket | null> {
    const { data, error } = await this.client
      .from('lottery_tickets')
      .select('*')
      .eq('ticket_number', ticketNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Error fetching ticket: ${error.message}`, 500);
    }

    return data;
  }

  async checkTicketAvailability(ticketNumber: string, userPhone: string): Promise<{
    available: boolean;
    ticketId?: string;
    price?: number;
    isExclusive?: boolean;
    requiresSubscription?: boolean;
  }> {
    const { data, error } = await this.client
      .rpc('check_ticket_availability', {
        p_ticket_number: ticketNumber,
        p_user_phone: userPhone
      });

    if (error) {
      throw new AppError(`Error checking availability: ${error.message}`, 500);
    }

    return data[0] || { available: false };
  }

  async reserveTicket(ticketNumber: string, userPhone: string): Promise<{
    success: boolean;
    orderId?: string;
    message: string;
  }> {
    const { data, error } = await this.client
      .rpc('reserve_ticket', {
        p_ticket_number: ticketNumber,
        p_user_phone: userPhone
      });

    if (error) {
      throw new AppError(`Error reserving ticket: ${error.message}`, 500);
    }

    return data[0] || { success: false, message: 'Unknown error' };
  }

  async getAvailableTickets(isExclusive?: boolean, limit: number = 50): Promise<LotteryTicket[]> {
    let query = this.client
      .from('lottery_tickets')
      .select('*')
      .eq('status', 'available')
      .order('ticket_number')
      .limit(limit);

    if (isExclusive !== undefined) {
      query = query.eq('is_exclusive', isExclusive);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(`Error fetching tickets: ${error.message}`, 500);
    }

    return data || [];
  }

  async updateTicketStatus(ticketId: string, status: 'available' | 'reserved' | 'sold'): Promise<void> {
    const { error } = await this.client
      .from('lottery_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (error) {
      throw new AppError(`Error updating ticket status: ${error.message}`, 500);
    }
  }

  // =====================================================
  // SUBSCRIBERS
  // =====================================================

  async getSubscriber(phoneNumber: string): Promise<Subscriber | null> {
    const { data, error } = await this.client
      .from('subscribers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Error fetching subscriber: ${error.message}`, 500);
    }

    return data;
  }

  async isActiveSubscriber(phoneNumber: string): Promise<boolean> {
    const subscriber = await this.getSubscriber(phoneNumber);
    return subscriber !== null;
  }

  async getAllSubscribers(): Promise<Subscriber[]> {
    const { data, error } = await this.client
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Error fetching subscribers: ${error.message}`, 500);
    }

    return data || [];
  }

  // =====================================================
  // ORDERS
  // =====================================================

  async createOrder(ticketId: string, userPhone: string, notes?: string): Promise<Order> {
    const { data, error } = await this.client
      .from('orders')
      .insert({
        ticket_id: ticketId,
        user_phone: userPhone,
        status: 'pending_review',
        notes: notes || 'Solicitud automática desde chatbot'
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Error creating order: ${error.message}`, 500);
    }

    return data;
  }

  async getOrdersByUser(userPhone: string): Promise<Order[]> {
    const { data, error } = await this.client
      .from('orders')
      .select(`
        *,
        lottery_tickets (
          ticket_number,
          price,
          is_exclusive
        )
      `)
      .eq('user_phone', userPhone)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Error fetching orders: ${error.message}`, 500);
    }

    return data || [];
  }

  async getPendingOrders(): Promise<Order[]> {
    const { data, error } = await this.client
      .from('orders')
      .select(`
        *,
        lottery_tickets (
          ticket_number,
          price,
          is_exclusive
        )
      `)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Error fetching pending orders: ${error.message}`, 500);
    }

    return data || [];
  }

  async updateOrderStatus(orderId: string, status: 'pending_review' | 'processed' | 'cancelled'): Promise<void> {
    const { error } = await this.client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      throw new AppError(`Error updating order status: ${error.message}`, 500);
    }
  }

  // =====================================================
  // USER SESSIONS
  // =====================================================

  async getUserSession(userPhone: string): Promise<UserSession | null> {
    const { data, error } = await this.client
      .from('user_sessions')
      .select('*')
      .eq('user_phone', userPhone)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Error fetching session: ${error.message}`, 500);
    }

    return data;
  }

  async upsertUserSession(userPhone: string, state: string, context: Record<string, any> = {}): Promise<UserSession> {
    const { data, error } = await this.client
      .from('user_sessions')
      .upsert({
        user_phone: userPhone,
        state,
        context,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Error upserting session: ${error.message}`, 500);
    }

    return data;
  }

  async clearUserSession(userPhone: string): Promise<void> {
    const { error } = await this.client
      .from('user_sessions')
      .delete()
      .eq('user_phone', userPhone);

    if (error) {
      throw new AppError(`Error clearing session: ${error.message}`, 500);
    }
  }

  async getActiveSessions(hoursAgo: number = 24): Promise<UserSession[]> {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.client
      .from('user_sessions')
      .select('*')
      .gte('updated_at', cutoffTime)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new AppError(`Error fetching active sessions: ${error.message}`, 500);
    }

    return data || [];
  }

  // =====================================================
  // KNOWLEDGE BASE
  // =====================================================

  async searchKnowledge(query: string, category?: string): Promise<KnowledgeBase[]> {
    let queryBuilder = this.client
      .from('knowledge_base')
      .select('*')
      .eq('is_active', true);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new AppError(`Error searching knowledge base: ${error.message}`, 500);
    }

    return data || [];
  }

  async getKnowledgeByCategory(category: string): Promise<KnowledgeBase[]> {
    const { data, error } = await this.client
      .from('knowledge_base')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at');

    if (error) {
      throw new AppError(`Error fetching knowledge by category: ${error.message}`, 500);
    }

    return data || [];
  }

  async getAllKnowledge(): Promise<KnowledgeBase[]> {
    const { data, error } = await this.client
      .from('knowledge_base')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      throw new AppError(`Error fetching all knowledge: ${error.message}`, 500);
    }

    return data || [];
  }

  // =====================================================
  // SYSTEM LOGS
  // =====================================================

  async createLog(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, any>,
    userPhone?: string,
    workflowId?: string
  ): Promise<SystemLog> {
    const { data, error } = await this.client
      .from('system_logs')
      .insert({
        level,
        message,
        context: context || {},
        user_phone: userPhone,
        workflow_id: workflowId
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Error creating log: ${error.message}`, 500);
    }

    return data;
  }

  async getLogs(
    level?: string,
    userPhone?: string,
    workflowId?: string,
    limit: number = 100
  ): Promise<SystemLog[]> {
    let query = this.client
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (level) {
      query = query.eq('level', level);
    }

    if (userPhone) {
      query = query.eq('user_phone', userPhone);
    }

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(`Error fetching logs: ${error.message}`, 500);
    }

    return data || [];
  }

  async getLogsByDateRange(startDate: string, endDate: string): Promise<SystemLog[]> {
    const { data, error } = await this.client
      .from('system_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Error fetching logs by date range: ${error.message}`, 500);
    }

    return data || [];
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  async getSystemStats(): Promise<{
    tickets: { total: number; available: number; reserved: number; sold: number; exclusive: number };
    orders: { total: number; pending: number; processed: number; cancelled: number };
    users: { totalSessions: number; activeSessions: number; subscribers: number };
    activity: { messagesLast24h: number; ordersLast24h: number; errorsLast24h: number };
  }> {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Tickets stats
    const { data: ticketsData } = await this.client
      .from('lottery_tickets')
      .select('status, is_exclusive');

    // Orders stats
    const { data: ordersData } = await this.client
      .from('orders')
      .select('status, created_at');

    // Sessions stats
    const { data: sessionsData } = await this.client
      .from('user_sessions')
      .select('updated_at');

    // Subscribers stats
    const { data: subscribersData } = await this.client
      .from('subscribers')
      .select('status')
      .eq('status', 'active');

    // Logs stats
    const { data: logsData } = await this.client
      .from('system_logs')
      .select('level, created_at')
      .gte('created_at', cutoffTime);

    // Calculate stats
    const tickets = {
      total: ticketsData?.length || 0,
      available: ticketsData?.filter(t => t.status === 'available').length || 0,
      reserved: ticketsData?.filter(t => t.status === 'reserved').length || 0,
      sold: ticketsData?.filter(t => t.status === 'sold').length || 0,
      exclusive: ticketsData?.filter(t => t.is_exclusive).length || 0
    };

    const orders = {
      total: ordersData?.length || 0,
      pending: ordersData?.filter(o => o.status === 'pending_review').length || 0,
      processed: ordersData?.filter(o => o.status === 'processed').length || 0,
      cancelled: ordersData?.filter(o => o.status === 'cancelled').length || 0
    };

    const users = {
      totalSessions: sessionsData?.length || 0,
      activeSessions: sessionsData?.filter(s => s.updated_at >= cutoffTime).length || 0,
      subscribers: subscribersData?.length || 0
    };

    const activity = {
      messagesLast24h: logsData?.filter(l => l.level === 'info').length || 0,
      ordersLast24h: ordersData?.filter(o => o.created_at >= cutoffTime).length || 0,
      errorsLast24h: logsData?.filter(l => l.level === 'error').length || 0
    };

    return { tickets, orders, users, activity };
  }
}

