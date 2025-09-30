/**
 * Utilidades compartidas para el sistema de chatbot de lotería
 */

import { REGEX, WHATSAPP_COMMANDS, SESSION_STATES } from '../constants';
import type { SessionState, MessageValidation, PhoneNumberValidation } from '../types';

// ===== UTILIDADES DE VALIDACIÓN =====

/**
 * Valida si un string es un número de billete válido
 */
export function isValidTicketNumber(ticketNumber: string): boolean {
  return REGEX.TICKET_NUMBER.test(ticketNumber.trim());
}

/**
 * Valida y formatea un número de teléfono
 */
export function validatePhoneNumber(phoneNumber: string): PhoneNumberValidation {
  const cleaned = phoneNumber.replace(/\s+/g, '');
  
  // Validación básica internacional
  const isValid = REGEX.PHONE_NUMBER.test(cleaned);
  
  // Formateo básico (agregar + si no lo tiene)
  let formatted = cleaned;
  if (isValid && !cleaned.startsWith('+')) {
    formatted = '+' + cleaned;
  }
  
  return {
    isValid,
    formatted,
    country: cleaned.startsWith('+34') ? 'ES' : undefined
  };
}

/**
 * Valida y clasifica un mensaje de usuario
 */
export function validateMessage(message: string): MessageValidation {
  const cleanMessage = message.toLowerCase().trim();
  
  // Verificar si es un comando
  for (const [commandType, commands] of Object.entries(WHATSAPP_COMMANDS)) {
    if (commands.some(cmd => cleanMessage.includes(cmd))) {
      return {
        isValid: true,
        type: 'command',
        extractedData: { command: commandType.toLowerCase() }
      };
    }
  }
  
  // Verificar si es un número de billete
  if (isValidTicketNumber(cleanMessage)) {
    return {
      isValid: true,
      type: 'number',
      extractedData: { ticketNumber: cleanMessage }
    };
  }
  
  // Verificar si es una confirmación
  const yesCommands = WHATSAPP_COMMANDS.YES;
  const noCommands = WHATSAPP_COMMANDS.NO;
  
  if (yesCommands.some(cmd => cleanMessage.includes(cmd))) {
    return {
      isValid: true,
      type: 'confirmation',
      extractedData: { confirmation: true }
    };
  }
  
  if (noCommands.some(cmd => cleanMessage.includes(cmd))) {
    return {
      isValid: true,
      type: 'confirmation',
      extractedData: { confirmation: false }
    };
  }
  
  // Mensaje de texto general
  return {
    isValid: true,
    type: 'text'
  };
}

// ===== UTILIDADES DE FORMATO =====

/**
 * Formatea un precio en euros
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

/**
 * Formatea una fecha para mostrar al usuario
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * Formatea un número de teléfono para mostrar
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Formato español: +34 600 123 456
  if (phoneNumber.startsWith('+34')) {
    const number = phoneNumber.substring(3);
    return `+34 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
  }
  
  return phoneNumber;
}

// ===== UTILIDADES DE TEXTO =====

/**
 * Trunca un texto a una longitud específica
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Limpia un mensaje de caracteres especiales
 */
export function sanitizeMessage(message: string): string {
  return message
    .replace(/[^\w\sáéíóúñü.,!?¿¡]/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
}

// ===== UTILIDADES DE SESIÓN =====

/**
 * Verifica si una sesión ha expirado
 */
export function isSessionExpired(lastUpdated: string, timeoutMinutes: number = 30): boolean {
  const lastUpdate = new Date(lastUpdated);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
  return diffMinutes > timeoutMinutes;
}

/**
 * Genera un ID único para una sesión
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===== UTILIDADES DE BÚSQUEDA =====

/**
 * Busca coincidencias de palabras clave en un texto
 */
export function searchKeywords(text: string, keywords: string): number {
  const textWords = text.toLowerCase().split(/\s+/);
  const keywordList = keywords.toLowerCase().split(',').map(k => k.trim());
  
  let matches = 0;
  keywordList.forEach(keyword => {
    if (textWords.some(word => word.includes(keyword) || keyword.includes(word))) {
      matches++;
    }
  });
  
  return matches;
}

/**
 * Calcula la similitud entre dos strings (algoritmo simple)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// ===== UTILIDADES DE ERROR =====

/**
 * Crea un objeto de error estandarizado
 */
export function createError(code: string, message: string, details?: any) {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Verifica si un error es de un tipo específico
 */
export function isErrorType(error: any, errorCode: string): boolean {
  return error && error.code === errorCode;
}

// ===== UTILIDADES DE TIEMPO =====

/**
 * Convierte minutos a milisegundos
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Convierte segundos a milisegundos
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Obtiene el timestamp actual
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// ===== UTILIDADES DE ARRAY =====

/**
 * Divide un array en chunks de tamaño específico
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Elimina duplicados de un array
 */
export function uniqueArray<T>(array: T[]): T[] {
  return [...new Set(array)];
}

// ===== UTILIDADES DE OBJETO =====

/**
 * Verifica si un objeto está vacío
 */
export function isEmpty(obj: any): boolean {
  return obj == null || Object.keys(obj).length === 0;
}

/**
 * Hace una copia profunda de un objeto
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ===== EXPORTACIONES =====
export * from './whatsapp';
export * from './database';
export * from './validation';

