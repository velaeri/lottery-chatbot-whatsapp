/**
 * Controlador para operaciones relacionadas con billetes de lotería
 */

import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../services/SupabaseService';
import { ApiResponse, TicketAvailabilityRequest, ReserveTicketRequest } from '../types';
import { AppError } from '../types';
import { z } from 'zod';

// Esquemas de validación
const ticketAvailabilitySchema = z.object({
  ticketNumber: z.string().regex(/^\d{5}$/, 'Ticket number must be exactly 5 digits'),
  userPhone: z.string().min(10, 'Phone number must be at least 10 characters')
});

const reserveTicketSchema = z.object({
  ticketNumber: z.string().regex(/^\d{5}$/, 'Ticket number must be exactly 5 digits'),
  userPhone: z.string().min(10, 'Phone number must be at least 10 characters')
});

const getTicketsSchema = z.object({
  isExclusive: z.string().optional().transform(val => val === 'true'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  status: z.enum(['available', 'reserved', 'sold']).optional()
});

export class TicketController {
  private supabaseService: SupabaseService;

  constructor(supabaseService: SupabaseService) {
    this.supabaseService = supabaseService;
  }

  /**
   * Verifica la disponibilidad de un billete
   * POST /api/tickets/check-availability
   */
  checkAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = ticketAvailabilitySchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new AppError('Invalid request data', 400);
      }

      const { ticketNumber, userPhone } = validation.data;

      // Verificar disponibilidad usando la función de base de datos
      const availability = await this.supabaseService.checkTicketAvailability(ticketNumber, userPhone);

      let message = '';
      if (!availability.available) {
        if (availability.requiresSubscription) {
          message = 'Este billete es exclusivo para abonados';
        } else {
          message = 'Billete no disponible';
        }
      } else {
        message = 'Billete disponible';
      }

      const response: ApiResponse = {
        success: true,
        data: {
          ...availability,
          message
        },
        timestamp: new Date().toISOString()
      };

      // Log de la consulta
      await this.supabaseService.createLog(
        'info',
        'Consulta de disponibilidad de billete',
        {
          ticketNumber,
          userPhone,
          result: availability.available ? 'available' : 'not_available',
          isExclusive: availability.isExclusive,
          requiresSubscription: availability.requiresSubscription
        },
        userPhone,
        'ticket_availability_api'
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reserva un billete
   * POST /api/tickets/reserve
   */
  reserveTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = reserveTicketSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new AppError('Invalid request data', 400);
      }

      const { ticketNumber, userPhone } = validation.data;

      // Reservar usando la función de base de datos
      const result = await this.supabaseService.reserveTicket(ticketNumber, userPhone);

      const response: ApiResponse = {
        success: result.success,
        data: result,
        timestamp: new Date().toISOString()
      };

      // Log de la reserva
      await this.supabaseService.createLog(
        result.success ? 'info' : 'warn',
        result.success ? 'Billete reservado exitosamente' : 'Fallo en reserva de billete',
        {
          ticketNumber,
          userPhone,
          orderId: result.orderId,
          message: result.message
        },
        userPhone,
        'ticket_reservation_api'
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene información de un billete específico
   * GET /api/tickets/:ticketNumber
   */
  getTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ticketNumber } = req.params;

      if (!/^\d{5}$/.test(ticketNumber)) {
        throw new AppError('Invalid ticket number format', 400);
      }

      const ticket = await this.supabaseService.getTicketByNumber(ticketNumber);

      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: ticket,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene lista de billetes disponibles
   * GET /api/tickets
   */
  getTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = getTicketsSchema.safeParse(req.query);
      
      if (!validation.success) {
        throw new AppError('Invalid query parameters', 400);
      }

      const { isExclusive, limit } = validation.data;

      const tickets = await this.supabaseService.getAvailableTickets(isExclusive, limit);

      const response: ApiResponse = {
        success: true,
        data: tickets,
        message: `Found ${tickets.length} tickets`,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza el estado de un billete
   * PUT /api/tickets/:ticketId/status
   */
  updateTicketStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;

      if (!['available', 'reserved', 'sold'].includes(status)) {
        throw new AppError('Invalid status', 400);
      }

      await this.supabaseService.updateTicketStatus(ticketId, status);

      const response: ApiResponse = {
        success: true,
        message: 'Ticket status updated successfully',
        timestamp: new Date().toISOString()
      };

      // Log del cambio de estado
      await this.supabaseService.createLog(
        'info',
        'Estado de billete actualizado',
        {
          ticketId,
          newStatus: status
        },
        undefined,
        'ticket_status_update_api'
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene estadísticas de billetes
   * GET /api/tickets/stats
   */
  getTicketStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.supabaseService.getSystemStats();

      const response: ApiResponse = {
        success: true,
        data: {
          tickets: stats.tickets,
          summary: {
            totalTickets: stats.tickets.total,
            availabilityRate: stats.tickets.total > 0 
              ? Math.round((stats.tickets.available / stats.tickets.total) * 100) 
              : 0,
            exclusivePercentage: stats.tickets.total > 0 
              ? Math.round((stats.tickets.exclusive / stats.tickets.total) * 100) 
              : 0
          }
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Busca billetes por criterios
   * POST /api/tickets/search
   */
  searchTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        minPrice, 
        maxPrice, 
        isExclusive, 
        status = 'available',
        limit = 50 
      } = req.body;

      // Por ahora, usar el método básico de obtener billetes
      // En el futuro se puede implementar búsqueda más avanzada
      const tickets = await this.supabaseService.getAvailableTickets(isExclusive, limit);

      // Filtrar por precio si se especifica
      let filteredTickets = tickets;
      if (minPrice !== undefined || maxPrice !== undefined) {
        filteredTickets = tickets.filter(ticket => {
          const price = parseFloat(ticket.price.toString());
          if (minPrice !== undefined && price < minPrice) return false;
          if (maxPrice !== undefined && price > maxPrice) return false;
          return true;
        });
      }

      const response: ApiResponse = {
        success: true,
        data: filteredTickets,
        message: `Found ${filteredTickets.length} tickets matching criteria`,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}

