/**
 * Tipos específicos para la integración con WhatsApp Business API
 */

// ===== TIPOS DE MENSAJES SALIENTES =====

export interface WhatsAppTextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
    preview_url?: boolean;
  };
}

export interface WhatsAppButtonMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
    };
  };
}

export interface WhatsAppListMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'list';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      button: string;
      sections: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

export interface WhatsAppTemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'header' | 'body' | 'footer';
      parameters?: Array<{
        type: 'text';
        text: string;
      }>;
    }>;
  };
}

export type WhatsAppOutgoingMessage = 
  | WhatsAppTextMessage 
  | WhatsAppButtonMessage 
  | WhatsAppListMessage 
  | WhatsAppTemplateMessage;

// ===== TIPOS DE RESPUESTA DE API =====

export interface WhatsAppSendResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details: string;
    };
    error_subcode?: number;
    fbtrace_id: string;
  };
}

// ===== TIPOS DE WEBHOOK =====

export interface WhatsAppWebhookVerification {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

export interface WhatsAppStatusUpdate {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp?: string;
    origin: {
      type: string;
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
    error_data?: {
      details: string;
    };
  }>;
}

// ===== TIPOS DE CONFIGURACIÓN =====

export interface WhatsAppConfig {
  apiKey: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  apiVersion?: string;
  baseUrl?: string;
}

// ===== TIPOS DE UTILIDAD =====

export interface MessageContext {
  userPhone: string;
  userName?: string;
  messageId: string;
  timestamp: string;
  isFromSubscriber?: boolean;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables?: string[];
  category: 'welcome' | 'confirmation' | 'error' | 'info';
}

// ===== TIPOS DE VALIDACIÓN =====

export interface PhoneNumberValidation {
  isValid: boolean;
  formatted: string;
  country?: string;
  carrier?: string;
}

export interface MessageValidation {
  isValid: boolean;
  type: 'text' | 'command' | 'number' | 'confirmation';
  extractedData?: {
    ticketNumber?: string;
    command?: string;
    confirmation?: boolean;
  };
}

