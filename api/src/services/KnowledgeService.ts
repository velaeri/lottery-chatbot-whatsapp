/**
 * Servicio para búsqueda inteligente en la base de conocimiento
 * Implementa algoritmos de similitud y matching para respuestas automáticas
 */

import { KnowledgeBase } from '../types';
import { SupabaseService } from './SupabaseService';

export interface KnowledgeMatch {
  id: string;
  question: string;
  answer: string;
  category: string;
  score: number;
}

export interface KnowledgeSearchResult {
  matches: KnowledgeMatch[];
  hasMatch: boolean;
  bestMatch?: KnowledgeMatch;
}

export class KnowledgeService {
  private supabaseService: SupabaseService;
  private knowledgeCache: KnowledgeBase[] = [];
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(supabaseService: SupabaseService) {
    this.supabaseService = supabaseService;
  }

  /**
   * Busca la mejor respuesta en la base de conocimiento
   */
  async searchKnowledge(query: string, category?: string): Promise<KnowledgeSearchResult> {
    await this.ensureKnowledgeCache();

    const normalizedQuery = this.normalizeText(query);
    const matches: KnowledgeMatch[] = [];

    // Filtrar por categoría si se especifica
    const knowledgeToSearch = category 
      ? this.knowledgeCache.filter(kb => kb.category === category)
      : this.knowledgeCache;

    // Calcular similitud para cada entrada
    for (const entry of knowledgeToSearch) {
      const score = this.calculateSimilarity(normalizedQuery, entry);
      
      if (score > 0.1) { // Umbral mínimo
        matches.push({
          id: entry.id,
          question: entry.question || '',
          answer: entry.answer,
          category: entry.category || 'general',
          score
        });
      }
    }

    // Ordenar por score descendente
    matches.sort((a, b) => b.score - a.score);

    // Determinar si hay una coincidencia válida
    const bestMatch = matches[0];
    const hasMatch = bestMatch && bestMatch.score > 0.3; // Umbral de confianza

    return {
      matches: matches.slice(0, 5), // Top 5 matches
      hasMatch: !!hasMatch,
      bestMatch: hasMatch ? bestMatch : undefined
    };
  }

  /**
   * Busca respuestas por categoría específica
   */
  async searchByCategory(category: string): Promise<KnowledgeBase[]> {
    return await this.supabaseService.getKnowledgeByCategory(category);
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  async getCategories(): Promise<string[]> {
    await this.ensureKnowledgeCache();
    
    const categories = new Set(
      this.knowledgeCache
        .map(kb => kb.category)
        .filter(cat => cat)
    );

    return Array.from(categories).sort();
  }

  /**
   * Busca respuestas para casos especiales (saludos, despedidas, etc.)
   */
  async getSpecialResponse(type: 'greeting' | 'farewell' | 'help' | 'unknown'): Promise<string | null> {
    const categoryMap = {
      greeting: 'saludos',
      farewell: 'despedidas', 
      help: 'ayuda',
      unknown: 'ayuda'
    };

    const category = categoryMap[type];
    const responses = await this.searchByCategory(category);
    
    return responses.length > 0 ? responses[0]!.answer : null;
  }

  /**
   * Detecta la intención del usuario basada en palabras clave
   */
  detectIntent(query: string): {
    intent: 'greeting' | 'farewell' | 'ticket_inquiry' | 'info_request' | 'help' | 'unknown';
    confidence: number;
  } {
    const normalizedQuery = this.normalizeText(query);

    // Patrones de intención
    const patterns = {
      greeting: ['hola', 'hello', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos'],
      farewell: ['adiós', 'adios', 'hasta luego', 'chao', 'bye', 'gracias', 'despedida'],
      ticket_inquiry: [/^\d{5}$/, 'billete', 'número', 'ticket', 'disponible'],
      info_request: ['horario', 'dirección', 'precio', 'como', 'cuando', 'donde', 'que es'],
      help: ['ayuda', 'help', 'que puedes hacer', 'opciones', 'no entiendo', 'menu', 'menú']
    };

    let bestIntent: keyof typeof patterns = 'unknown';
    let bestScore = 0;

    for (const [intent, keywords] of Object.entries(patterns)) {
      let score = 0;
      
      for (const keyword of keywords) {
        if (keyword instanceof RegExp) {
          if (keyword.test(normalizedQuery)) {
            score += 1.0;
          }
        } else if (normalizedQuery.includes(keyword)) {
          score += 0.8;
        }
      }

      // Normalizar score por número de keywords
      score = score / keywords.length;

      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent as keyof typeof patterns;
      }
    }

    return {
      intent: bestIntent,
      confidence: bestScore
    };
  }

  /**
   * Sugiere preguntas relacionadas
   */
  async getSuggestedQuestions(category?: string, limit: number = 5): Promise<string[]> {
    await this.ensureKnowledgeCache();

    const knowledgeToSearch = category 
      ? this.knowledgeCache.filter(kb => kb.category === category)
      : this.knowledgeCache;

    return knowledgeToSearch
      .filter(kb => kb.question)
      .map(kb => kb.question!)
      .slice(0, limit);
  }

  /**
   * Actualiza la caché de conocimiento
   */
  private async ensureKnowledgeCache(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastCacheUpdate > this.CACHE_TTL || this.knowledgeCache.length === 0) {
      this.knowledgeCache = await this.supabaseService.getAllKnowledge();
      this.lastCacheUpdate = now;
    }
  }

  /**
   * Normaliza texto para búsqueda
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s]/g, ' ') // Remover puntuación
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Calcula similitud entre query y entrada de conocimiento
   */
  private calculateSimilarity(query: string, entry: KnowledgeBase): number {
    const keywords = this.normalizeText(entry.keywords || '');
    const question = this.normalizeText(entry.question || '');
    
    // Calcular similitud con keywords
    const keywordScore = this.calculateTextSimilarity(query, keywords);
    
    // Calcular similitud con question
    const questionScore = this.calculateTextSimilarity(query, question);
    
    // Bonus por categoría específica
    let categoryBonus = 0;
    if (entry.category) {
      const categoryKeywords = this.getCategoryKeywords(entry.category);
      if (categoryKeywords.some(keyword => query.includes(keyword))) {
        categoryBonus = 0.2;
      }
    }

    // Retornar el mejor score con bonus
    return Math.max(keywordScore, questionScore) + categoryBonus;
  }

  /**
   * Calcula similitud entre dos textos
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    let matches = 0;
    let exactMatches = 0;

    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          exactMatches++;
          matches++;
          break;
        } else if (word1.includes(word2) || word2.includes(word1)) {
          matches += 0.7;
          break;
        } else if (this.levenshteinDistance(word1, word2) <= 2) {
          matches += 0.5;
          break;
        }
      }
    }

    // Bonus por coincidencias exactas
    const exactBonus = exactMatches * 0.3;
    
    return (matches / Math.max(words1.length, words2.length)) + exactBonus;
  }

  /**
   * Calcula distancia de Levenshtein entre dos strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0]![i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j]![0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]! + 1, // deletion
          matrix[j - 1]![i]! + 1, // insertion
          matrix[j - 1]![i - 1]! + indicator // substitution
        );
      }
    }

    return matrix[str2.length]![str1.length]!;
  }

  /**
   * Obtiene palabras clave por categoría
   */
  private getCategoryKeywords(category: string): string[] {
    const categoryKeywords: Record<string, string[]> = {
      'info_general': ['horario', 'dirección', 'teléfono', 'contacto', 'ubicación'],
      'proceso_compra': ['comprar', 'pago', 'como', 'proceso', 'método'],
      'info_billetes': ['billete', 'precio', 'exclusivo', 'regular'],
      'suscripcion': ['abonado', 'suscripción', 'beneficios', 'premium'],
      'sorteos': ['sorteo', 'fecha', 'cuando', 'resultado'],
      'premios': ['premio', 'ganancia', 'cuanto', 'bases'],
      'saludos': ['hola', 'buenas', 'saludo'],
      'despedidas': ['adiós', 'hasta luego', 'gracias'],
      'ayuda': ['ayuda', 'help', 'opciones', 'menu']
    };

    return categoryKeywords[category] || [];
  }
}

