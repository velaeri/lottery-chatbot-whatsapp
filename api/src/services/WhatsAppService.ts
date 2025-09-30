/**
 * Servicio para interactuar con la API de WhatsApp Business
 * Maneja envío de mensajes y procesamiento de webhooks
 */

import { AppError } from '../types';

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
  interactive?: {
    type: 'button' | 'list';
    body: {
      text: string;
    };
    action: any;
  };
}

export interface WhatsAppWebhookMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
}

export interface WhatsAppWebhookContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppWebhookData {
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
        contacts?: WhatsAppWebhookContact[];
        messages?: WhatsAppWebhookMessage[];
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string = 'v18.0';
  private baseUrl: string = 'https://graph.facebook.com';

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  /**
   * Envía un mensaje de texto simple
   */
  async sendTextMessage(to: string, message: string, previewUrl: boolean = false): Promise<{ messageId: string }> {
    const payload: WhatsAppMessage = {
      to: this.formatPhoneNumber(to),
      type: 'text',
      text: {
        body: message,
        preview_url: previewUrl
      }
    };

    return await this.sendMessage(payload);
  }

  /**
   * Envía un mensaje con botones interactivos
   */
  async sendButtonMessage(
    to: string, 
    bodyText: string, 
    buttons: Array<{ id: string; title: string }>
  ): Promise<{ messageId: string }> {
    if (buttons.length > 3) {
      throw new AppError('WhatsApp button messages support maximum 3 buttons', 400);
    }

    const payload: WhatsAppMessage = {
      to: this.formatPhoneNumber(to),
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };

    return await this.sendMessage(payload);
  }

  /**
   * Envía un mensaje con lista de opciones
   */
  async sendListMessage(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ): Promise<{ messageId: string }> {
    const payload: WhatsAppMessage = {
      to: this.formatPhoneNumber(to),
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: bodyText
        },
        action: {
          button: buttonText,
          sections: sections
        }
      }
    };

    return await this.sendMessage(payload);
  }

  /**
   * Envía un mensaje usando una plantilla
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'es',
    components?: any[]
  ): Promise<{ messageId: string }> {
    const payload: WhatsAppMessage = {
      to: this.formatPhoneNumber(to),
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: components
      }
    };

    return await this.sendMessage(payload);
  }

  /**
   * Marca un mensaje como leído
   */
  async markAsRead(messageId: string): Promise<void> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AppError(`Failed to mark message as read: ${error.error?.message || 'Unknown error'}`, response.status);
    }
  }

  /**
   * Procesa datos del webhook de WhatsApp
   */
  processWebhookData(webhookData: WhatsAppWebhookData): {
    messages: Array<{
      messageId: string;
      from: string;
      timestamp: string;
      type: string;
      content: string;
      contact: {
        name: string;
        waId: string;
      };
    }>;
    statuses: Array<{
      messageId: string;
      status: string;
      timestamp: string;
      recipientId: string;
    }>;
  } {
    const messages: any[] = [];
    const statuses: any[] = [];

    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          // Procesar mensajes recibidos
          if (change.value.messages) {
            for (const message of change.value.messages) {
              const contact = change.value.contacts?.[0];
              
              let content = '';
              switch (message.type) {
                case 'text':
                  content = message.text?.body || '';
                  break;
                case 'image':
                case 'audio':
                case 'video':
                case 'document':
                  content = `[${message.type.toUpperCase()}]`;
                  break;
                default:
                  content = `[${message.type.toUpperCase()}]`;
              }

              messages.push({
                messageId: message.id,
                from: message.from,
                timestamp: message.timestamp,
                type: message.type,
                content,
                contact: {
                  name: contact?.profile?.name || 'Unknown',
                  waId: contact?.wa_id || message.from
                }
              });
            }
          }

          // Procesar estados de mensajes
          if (change.value.statuses) {
            for (const status of change.value.statuses) {
              statuses.push({
                messageId: status.id,
                status: status.status,
                timestamp: status.timestamp,
                recipientId: status.recipient_id
              });
            }
          }
        }
      }
    }

    return { messages, statuses };
  }

  /**
   * Valida el token de verificación del webhook
   */
  verifyWebhook(mode: string, token: string, challenge: string, verifyToken: string): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Obtiene información del perfil de un usuario
   */
  async getUserProfile(waId: string): Promise<{ name: string; about?: string }> {
    const url = `${this.baseUrl}/${this.apiVersion}/${waId}?fields=name,about`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new AppError(`Failed to get user profile: ${response.statusText}`, response.status);
    }

    return await response.json();
  }

  /**
   * Obtiene información del número de teléfono del negocio
   */
  async getPhoneNumberInfo(): Promise<{
    verifiedName: string;
    displayPhoneNumber: string;
    qualityRating: string;
  }> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new AppError(`Failed to get phone number info: ${response.statusText}`, response.status);
    }

    return await response.json();
  }

  /**
   * Envía un mensaje genérico
   */
  private async sendMessage(payload: WhatsAppMessage): Promise<{ messageId: string }> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const fullPayload = {
      messaging_product: 'whatsapp',
      ...payload
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fullPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AppError(
        `Failed to send WhatsApp message: ${error.error?.message || 'Unknown error'}`,
        response.status
      );
    }

    const result = await response.json();
    return { messageId: result.messages[0].id };
  }

  /**
   * Formatea un número de teléfono para WhatsApp
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remover espacios, guiones y paréntesis
    let formatted = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Si no empieza con +, asumir que es español y agregar +34
    if (!formatted.startsWith('+')) {
      if (formatted.startsWith('34')) {
        formatted = '+' + formatted;
      } else if (formatted.startsWith('6') || formatted.startsWith('7') || formatted.startsWith('9')) {
        formatted = '+34' + formatted;
      } else {
        formatted = '+' + formatted;
      }
    }

    return formatted;
  }

  /**
   * Valida si un número de teléfono es válido para WhatsApp
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    // Patrón básico para números internacionales
    const pattern = /^\+[1-9]\d{1,14}$/;
    return pattern.test(formatted);
  }

  /**
   * Obtiene estadísticas de mensajería
   */
  async getMessagingStats(startDate: string, endDate: string): Promise<{
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }> {
    // Nota: Esta funcionalidad requiere permisos especiales de WhatsApp Business API
    // Por ahora retornamos datos mock
    return {
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0
    };
  }
}

