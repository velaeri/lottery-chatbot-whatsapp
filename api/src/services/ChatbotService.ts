import { DeepSeekService, ConversationContext } from './DeepSeekService';
import { SupabaseService } from './SupabaseService';
import { z } from 'zod';

// Esquemas de validación
const MessageInputSchema = z.object({
  userId: z.string(),
  message: z.string().min(1),
  isSubscriber: z.boolean().optional().default(false)
});

export interface ChatbotResponse {
  message: string;
  requiresHumanIntervention: boolean;
  sessionState: string;
  metadata?: {
    ticketInfo?: any;
    orderCreated?: boolean;
    usedAI?: boolean;
  };
}

export class ChatbotService {
  private deepSeekService: DeepSeekService;
  private supabaseService: SupabaseService;

  constructor() {
    this.deepSeekService = new DeepSeekService();
    this.supabaseService = new SupabaseService();
  }

  /**
   * Procesa un mensaje del usuario de manera inteligente
   */
  async processMessage(
    userId: string, 
    message: string, 
    isSubscriber: boolean = false
  ): Promise<ChatbotResponse> {
    try {
      // Validar entrada
      const validatedInput = MessageInputSchema.parse({
        userId,
        message,
        isSubscriber
      });

      // Detectar si requiere lógica específica del negocio
      const businessLogicResult = await this.handleBusinessLogic(
        validatedInput.message, 
        validatedInput.userId, 
        validatedInput.isSubscriber
      );

      let finalMessage: string;
      let requiresHumanIntervention = false;
      let sessionState = 'main_menu';
      let metadata: any = {};

      if (businessLogicResult) {
        // Si hay lógica de negocio, usar DeepSeek para mejorar la respuesta
        if (this.deepSeekService.isAvailable()) {
          finalMessage = await this.deepSeekService.processMessage(
            validatedInput.userId,
            validatedInput.message,
            validatedInput.isSubscriber,
            businessLogicResult.message
          );
          metadata.usedAI = true;
        } else {
          finalMessage = businessLogicResult.message;
          metadata.usedAI = false;
        }

        requiresHumanIntervention = businessLogicResult.requiresHumanIntervention;
        sessionState = businessLogicResult.sessionState;
        metadata = { ...metadata, ...businessLogicResult.metadata };

      } else {
        // Solo conversación general, usar DeepSeek
        finalMessage = await this.deepSeekService.processMessage(
          validatedInput.userId,
          validatedInput.message,
          validatedInput.isSubscriber
        );
        metadata.usedAI = this.deepSeekService.isAvailable();
      }

      // Registrar la interacción
      await this.logInteraction(validatedInput.userId, validatedInput.message, finalMessage);

      return {
        message: finalMessage,
        requiresHumanIntervention,
        sessionState,
        metadata
      };

    } catch (error) {
      console.error('Error procesando mensaje:', error);
      
      return {
        message: '🤖 Disculpa, he tenido un problema técnico. ¿Podrías repetir tu mensaje?',
        requiresHumanIntervention: false,
        sessionState: 'main_menu',
        metadata: { error: true }
      };
    }
  }

  /**
   * Maneja la lógica específica del negocio (billetes, compras, etc.)
   */
  private async handleBusinessLogic(
    message: string, 
    userId: string, 
    isSubscriber: boolean
  ): Promise<{
    message: string;
    requiresHumanIntervention: boolean;
    sessionState: string;
    metadata: any;
  } | null> {
    
    const trimmedMessage = message.trim();

    // 1. Consulta de billetes (números de 5 dígitos)
    if (/^\d{5}$/.test(trimmedMessage)) {
      return await this.handleTicketInquiry(trimmedMessage, userId, isSubscriber);
    }

    // 2. Confirmaciones de compra
    if (this.isConfirmationMessage(message)) {
      return await this.handlePurchaseConfirmation(userId);
    }

    // 3. Cancelaciones
    if (this.isCancellationMessage(message)) {
      return await this.handlePurchaseCancellation(userId);
    }

    // 4. Solicitud de menú
    if (this.isMenuRequest(message)) {
      return {
        message: this.getMainMenuMessage(),
        requiresHumanIntervention: false,
        sessionState: 'main_menu',
        metadata: {}
      };
    }

    // No requiere lógica específica
    return null;
  }

  /**
   * Maneja consultas de billetes específicos
   */
  private async handleTicketInquiry(
    ticketNumber: string, 
    userId: string, 
    isSubscriber: boolean
  ): Promise<{
    message: string;
    requiresHumanIntervention: boolean;
    sessionState: string;
    metadata: any;
  }> {
    try {
      // Buscar el billete en la base de datos
      const ticket = await this.supabaseService.getTicketByNumber(ticketNumber);

      if (!ticket) {
        return {
          message: `❌ Lo siento, el billete ${ticketNumber} no existe en nuestro sistema.\n\n¿Te gustaría consultar otro número?`,
          requiresHumanIntervention: false,
          sessionState: 'main_menu',
          metadata: { ticketNumber, found: false }
        };
      }

      if (ticket.status === 'sold') {
        return {
          message: `❌ El billete ${ticketNumber} ya ha sido vendido.\n\n¿Te gustaría consultar otro número disponible?`,
          requiresHumanIntervention: false,
          sessionState: 'main_menu',
          metadata: { ticketInfo: ticket, available: false }
        };
      }

      if (ticket.status === 'reserved') {
        return {
          message: `⏳ El billete ${ticketNumber} está temporalmente reservado.\n\n¿Te gustaría consultar otro número?`,
          requiresHumanIntervention: false,
          sessionState: 'main_menu',
          metadata: { ticketInfo: ticket, available: false }
        };
      }

      // Verificar acceso a billetes exclusivos
      if (ticket.is_exclusive && !isSubscriber) {
        return {
          message: `🔒 El billete ${ticketNumber} es exclusivo para abonados.\n\n💰 Precio: ${ticket.price}€\n📋 Para ser abonado, visita nuestra oficina con tu DNI. La suscripción cuesta 20€ anuales.\n\n¿Te gustaría consultar billetes regulares disponibles?`,
          requiresHumanIntervention: false,
          sessionState: 'main_menu',
          metadata: { ticketInfo: ticket, accessDenied: true }
        };
      }

      // Billete disponible - preparar para compra
      await this.updateUserSession(userId, 'purchase_confirmation', {
        ticket_number: ticketNumber,
        price: ticket.price
      });

      return {
        message: `✅ ¡Billete disponible!\n\n🎫 Número: ${ticketNumber}\n💰 Precio: ${ticket.price}€\n${ticket.is_exclusive ? '⭐ Billete exclusivo para abonados' : '📋 Billete regular'}\n\n¿Deseas comprarlo? Responde "sí" para confirmar o "no" para cancelar.`,
        requiresHumanIntervention: false,
        sessionState: 'purchase_confirmation',
        metadata: { ticketInfo: ticket, available: true }
      };

    } catch (error) {
      console.error('Error consultando billete:', error);
      return {
        message: `🤖 Ha ocurrido un error consultando el billete ${ticketNumber}. Por favor, inténtalo de nuevo.`,
        requiresHumanIntervention: false,
        sessionState: 'main_menu',
        metadata: { error: true }
      };
    }
  }

  /**
   * Maneja confirmaciones de compra
   */
  private async handlePurchaseConfirmation(userId: string): Promise<{
    message: string;
    requiresHumanIntervention: boolean;
    sessionState: string;
    metadata: any;
  }> {
    try {
      const session = await this.getUserSession(userId);
      
      if (!session || session.state !== 'purchase_confirmation') {
        return {
          message: 'No hay ninguna compra pendiente de confirmación. ¿Te gustaría consultar un billete?',
          requiresHumanIntervention: false,
          sessionState: 'main_menu',
          metadata: {}
        };
      }

      const { ticket_number, price } = session.context;

      // Reservar el billete
      await this.supabaseService.reserveTicket(ticket_number);

      // Crear orden para revisión humana
      const order = await this.supabaseService.createOrder({
        ticket_id: session.context.ticket_id,
        user_phone: userId,
        status: 'pending_review',
        notes: `Compra solicitada vía chatbot para billete ${ticket_number}`
      });

      // Limpiar sesión
      await this.updateUserSession(userId, 'main_menu', {});

      return {
        message: `🎉 ¡Compra confirmada!\n\n🎫 Billete: ${ticket_number}\n💰 Precio: ${price}€\n📋 Estado: Reservado temporalmente\n\n📞 Un operador se pondrá en contacto contigo en breve para completar el pago y la entrega.\n\n⏰ La reserva es válida por 24 horas.\n\n¿Necesitas algo más?`,
        requiresHumanIntervention: true,
        sessionState: 'main_menu',
        metadata: { orderCreated: true, orderId: order?.id }
      };

    } catch (error) {
      console.error('Error confirmando compra:', error);
      return {
        message: '🤖 Ha ocurrido un error procesando tu compra. Por favor, contacta con nosotros directamente.',
        requiresHumanIntervention: true,
        sessionState: 'main_menu',
        metadata: { error: true }
      };
    }
  }

  /**
   * Maneja cancelaciones de compra
   */
  private async handlePurchaseCancellation(userId: string): Promise<{
    message: string;
    requiresHumanIntervention: boolean;
    sessionState: string;
    metadata: any;
  }> {
    const session = await this.getUserSession(userId);
    
    if (!session || session.state !== 'purchase_confirmation') {
      return {
        message: 'No hay ninguna compra pendiente de cancelación. ¿En qué más puedo ayudarte?',
        requiresHumanIntervention: false,
        sessionState: 'main_menu',
        metadata: {}
      };
    }

    // Limpiar sesión
    await this.updateUserSession(userId, 'main_menu', {});

    return {
      message: '❌ Compra cancelada.\n\n¿Te gustaría consultar otro billete o necesitas ayuda con algo más?',
      requiresHumanIntervention: false,
      sessionState: 'main_menu',
      metadata: { cancelled: true }
    };
  }

  /**
   * Detecta mensajes de confirmación
   */
  private isConfirmationMessage(message: string): boolean {
    const confirmationWords = ['sí', 'si', 'confirmo', 'comprar', 'quiero', 'acepto', 'ok'];
    const lowerMessage = message.toLowerCase().trim();
    return confirmationWords.some(word => lowerMessage.includes(word));
  }

  /**
   * Detecta mensajes de cancelación
   */
  private isCancellationMessage(message: string): boolean {
    const cancellationWords = ['no', 'cancelar', 'no quiero', 'rechazar', 'nada'];
    const lowerMessage = message.toLowerCase().trim();
    return cancellationWords.some(word => lowerMessage.includes(word));
  }

  /**
   * Detecta solicitudes de menú
   */
  private isMenuRequest(message: string): boolean {
    const menuWords = ['menú', 'menu', 'opciones', 'ayuda', 'inicio'];
    const lowerMessage = message.toLowerCase().trim();
    return menuWords.some(word => lowerMessage.includes(word));
  }

  /**
   * Obtiene el mensaje del menú principal
   */
  private getMainMenuMessage(): string {
    return `🎰 ¡Bienvenido a Lotería El Trébol!\n\n¿En qué puedo ayudarte?\n\n🎫 Consultar disponibilidad: Envía el número de 5 dígitos\n💬 Información general: Pregúntame sobre horarios, ubicación, etc.\n🎯 Sorteos: Información sobre fechas y premios\n\nEjemplo: Envía "12345" para consultar ese billete`;
  }

  /**
   * Actualiza la sesión del usuario
   */
  private async updateUserSession(userId: string, state: string, context: any): Promise<void> {
    try {
      await this.supabaseService.updateUserSession(userId, state, context);
      
      // También actualizar en DeepSeek
      this.deepSeekService.updateContext(userId, {
        currentState: state,
        sessionData: context
      });
    } catch (error) {
      console.error('Error actualizando sesión:', error);
    }
  }

  /**
   * Obtiene la sesión del usuario
   */
  private async getUserSession(userId: string): Promise<any> {
    try {
      return await this.supabaseService.getUserSession(userId);
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  }

  /**
   * Registra la interacción para auditoría
   */
  private async logInteraction(userId: string, userMessage: string, botResponse: string): Promise<void> {
    try {
      await this.supabaseService.logSystemEvent('info', 'Chat interaction', {
        userId,
        userMessage: userMessage.substring(0, 100), // Limitar longitud
        botResponse: botResponse.substring(0, 100),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error registrando interacción:', error);
    }
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats(): {
    deepSeekAvailable: boolean;
    deepSeekStats: any;
    supabaseConnected: boolean;
  } {
    return {
      deepSeekAvailable: this.deepSeekService.isAvailable(),
      deepSeekStats: this.deepSeekService.getStats(),
      supabaseConnected: this.supabaseService.isConnected()
    };
  }
}

