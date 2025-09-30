import { z } from 'zod';

// Esquemas de validación
const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string()
});

const ChatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(ChatMessageSchema),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional()
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConversationContext {
  userId: string;
  isSubscriber: boolean;
  currentState: string;
  lastTicketInquiry?: string;
  conversationHistory: ChatMessage[];
  sessionData: Record<string, any>;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  error?: string;
}

export class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private conversationContexts: Map<string, ConversationContext>;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.model = 'deepseek-chat';
    this.conversationContexts = new Map();
    
    if (!this.apiKey) {
      console.warn('⚠️ DEEPSEEK_API_KEY no configurada. El chatbot usará respuestas predefinidas.');
    }
  }

  /**
   * Obtiene o crea el contexto de conversación para un usuario
   */
  private getConversationContext(userId: string, isSubscriber: boolean = false): ConversationContext {
    if (!this.conversationContexts.has(userId)) {
      this.conversationContexts.set(userId, {
        userId,
        isSubscriber,
        currentState: 'main_menu',
        conversationHistory: [],
        sessionData: {}
      });
    }
    
    const context = this.conversationContexts.get(userId)!;
    context.isSubscriber = isSubscriber; // Actualizar estado de suscripción
    return context;
  }

  /**
   * Genera el prompt del sistema optimizado para el chatbot de lotería
   */
  private generateSystemPrompt(context: ConversationContext): string {
    return `Eres un asistente virtual de "Lotería El Trébol", una tienda de billetes de lotería en España.

INFORMACIÓN DE LA EMPRESA:
- Nombre: Lotería El Trébol
- Horario: Lunes a viernes 9:00-18:00, sábados 9:00-14:00
- Ubicación: Calle Principal 123, Madrid
- Sorteos: Todos los sábados a las 20:00
- Suscripción de abonados: 20€ anuales (acceso a billetes exclusivos)

ESTADO DEL USUARIO:
- Tipo: ${context.isSubscriber ? 'Abonado (acceso a billetes exclusivos)' : 'Usuario regular'}
- Estado actual: ${context.currentState}
${context.lastTicketInquiry ? `- Último billete consultado: ${context.lastTicketInquiry}` : ''}

INSTRUCCIONES IMPORTANTES:
1. NUNCA inventes números de billetes o precios. Solo usa la información que te proporcione el sistema.
2. Para consultas de billetes específicos, responde que necesitas verificar en el sistema.
3. Sé amigable, profesional y usa emojis apropiados.
4. Si el usuario pregunta por billetes exclusivos y no es abonado, explica los beneficios de la suscripción.
5. Para compras, siempre menciona que un operador humano completará el proceso.
6. Mantén las respuestas concisas pero informativas.
7. Responde de manera natural y conversacional.

EJEMPLOS DE RESPUESTAS:
- Consulta de horario: "🕒 Nuestro horario es de lunes a viernes de 9:00 a 18:00 y sábados de 9:00 a 14:00. ¿En qué más puedo ayudarte?"
- Consulta de ubicación: "📍 Estamos en Calle Principal 123, Madrid. ¡Te esperamos!"
- Consulta general de billetes: "🎫 Para consultar un billete específico, envíame el número de 5 dígitos y verificaré su disponibilidad."

Responde de manera natural y conversacional, pero siempre mantén el contexto del negocio de lotería.`;
  }

  /**
   * Procesa un mensaje con streaming
   */
  async *processMessageStream(
    userId: string, 
    message: string, 
    isSubscriber: boolean = false,
    businessLogicResult?: string
  ): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      // Si no hay API key, usar respuestas predefinidas
      if (!this.apiKey) {
        const fallbackResponse = this.getFallbackResponse(message);
        yield { content: fallbackResponse, isComplete: true };
        return;
      }

      const context = this.getConversationContext(userId, isSubscriber);
      
      // Si hay resultado de lógica de negocio, usarlo como contexto
      let userMessage = message;
      if (businessLogicResult) {
        userMessage = `Usuario escribió: "${message}"\nResultado del sistema: ${businessLogicResult}\n\nPor favor, reformula esta respuesta de manera más natural y conversacional, manteniendo toda la información importante.`;
      }

      // Agregar mensaje del usuario al historial
      context.conversationHistory.push({
        role: 'user',
        content: message
      });

      // Mantener solo los últimos 10 mensajes para no exceder límites
      if (context.conversationHistory.length > 10) {
        context.conversationHistory = context.conversationHistory.slice(-10);
      }

      // Preparar mensajes para la API
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this.generateSystemPrompt(context)
        },
        ...context.conversationHistory.slice(-5), // Últimos 5 mensajes para contexto
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Validar entrada
      const validatedInput = ChatCompletionSchema.parse({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true
      });

      // Llamar a la API de DeepSeek con streaming
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(validatedInput)
      });

      if (!response.ok) {
        console.error('Error en DeepSeek API:', response.status, response.statusText);
        yield { content: this.getFallbackResponse(message), isComplete: true };
        return;
      }

      if (!response.body) {
        yield { content: this.getFallbackResponse(message), isComplete: true };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // Agregar respuesta completa al historial
                context.conversationHistory.push({
                  role: 'assistant',
                  content: fullContent
                });
                
                yield { content: '', isComplete: true };
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullContent += content;
                  yield { content, isComplete: false };
                }
              } catch (parseError) {
                // Ignorar errores de parsing de chunks individuales
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Si llegamos aquí sin completar, agregar el contenido al historial
      if (fullContent) {
        context.conversationHistory.push({
          role: 'assistant',
          content: fullContent
        });
      }

      yield { content: '', isComplete: true };

    } catch (error) {
      console.error('Error procesando mensaje con streaming:', error);
      yield { 
        content: this.getFallbackResponse(message), 
        isComplete: true,
        error: 'Error de conexión con DeepSeek'
      };
    }
  }

  /**
   * Procesa un mensaje sin streaming (método original para compatibilidad)
   */
  async processMessage(
    userId: string, 
    message: string, 
    isSubscriber: boolean = false,
    businessLogicResult?: string
  ): Promise<string> {
    let fullResponse = '';
    
    for await (const chunk of this.processMessageStream(userId, message, isSubscriber, businessLogicResult)) {
      if (chunk.content) {
        fullResponse += chunk.content;
      }
      if (chunk.isComplete) {
        break;
      }
    }
    
    return fullResponse || this.getFallbackResponse(message);
  }

  /**
   * Detecta si el mensaje requiere lógica específica del negocio
   */
  private requiresBusinessLogic(message: string): boolean {
    // Números de billete (5 dígitos)
    if (/^\d{5}$/.test(message.trim())) {
      return true;
    }

    // Confirmaciones de compra
    const confirmationWords = ['sí', 'si', 'confirmo', 'comprar', 'quiero'];
    const cancellationWords = ['no', 'cancelar', 'no quiero'];
    
    const lowerMessage = message.toLowerCase();
    
    if (confirmationWords.some(word => lowerMessage.includes(word)) ||
        cancellationWords.some(word => lowerMessage.includes(word))) {
      return true;
    }

    return false;
  }

  /**
   * Respuestas de fallback cuando DeepSeek no está disponible
   */
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Respuestas básicas predefinidas
    if (lowerMessage.includes('horario')) {
      return '🕒 Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 y sábados de 9:00 a 14:00. ¿En qué más puedo ayudarte?';
    }

    if (lowerMessage.includes('ubicacion') || lowerMessage.includes('direccion') || lowerMessage.includes('donde')) {
      return '📍 Estamos ubicados en Calle Principal 123, Madrid. ¡Te esperamos! ¿Necesitas algo más?';
    }

    if (lowerMessage.includes('sorteo')) {
      return '🎯 Los sorteos se realizan todos los sábados a las 20:00. Los resultados se publican inmediatamente. ¿Te gustaría consultar algún billete?';
    }

    if (lowerMessage.includes('abonado') || lowerMessage.includes('suscripcion')) {
      return '⭐ La suscripción de abonado cuesta 20€ anuales y te da acceso a billetes exclusivos. Visita nuestra oficina con tu DNI para suscribirte. ¿Quieres más información?';
    }

    // Respuesta genérica
    return `🤔 Entiendo que preguntas sobre "${message}". 

Puedo ayudarte con:
🎫 Consultar billetes (envía un número de 5 dígitos)
📍 Información sobre horarios y ubicación  
🎯 Información sobre sorteos
💰 Proceso de compra

¿En qué más puedo ayudarte?`;
  }

  /**
   * Actualiza el contexto de conversación
   */
  updateContext(userId: string, updates: Partial<ConversationContext>): void {
    const context = this.conversationContexts.get(userId);
    if (context) {
      Object.assign(context, updates);
    }
  }

  /**
   * Limpia el contexto de conversación de un usuario
   */
  clearContext(userId: string): void {
    this.conversationContexts.delete(userId);
  }

  /**
   * Verifica si DeepSeek está disponible
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats(): { 
    activeContexts: number; 
    isConfigured: boolean; 
    model: string;
  } {
    return {
      activeContexts: this.conversationContexts.size,
      isConfigured: this.isAvailable(),
      model: this.model
    };
  }
}

