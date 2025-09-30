/**
 * Controlador para operaciones de base de conocimiento
 */

import { Request, Response, NextFunction } from 'express';
import { KnowledgeService } from '../services/KnowledgeService';
import { SupabaseService } from '../services/SupabaseService';
import { ApiResponse } from '../types';
import { AppError } from '../types';
import { z } from 'zod';

// Esquemas de validación
const searchKnowledgeSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  category: z.string().optional(),
  limit: z.number().min(1).max(20).optional().default(5)
});

const detectIntentSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty')
});

export class KnowledgeController {
  private knowledgeService: KnowledgeService;
  private supabaseService: SupabaseService;

  constructor(knowledgeService: KnowledgeService, supabaseService: SupabaseService) {
    this.knowledgeService = knowledgeService;
    this.supabaseService = supabaseService;
  }

  /**
   * Busca en la base de conocimiento
   * POST /api/knowledge/search
   */
  searchKnowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = searchKnowledgeSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new AppError('Invalid request data', 400);
      }

      const { query, category, limit } = validation.data;

      const searchResult = await this.knowledgeService.searchKnowledge(query, category);

      // Limitar resultados
      const limitedMatches = searchResult.matches.slice(0, limit);

      const response: ApiResponse = {
        success: true,
        data: {
          ...searchResult,
          matches: limitedMatches,
          query,
          category,
          totalMatches: searchResult.matches.length
        },
        timestamp: new Date().toISOString()
      };

      // Log de la búsqueda
      await this.supabaseService.createLog(
        'info',
        'Búsqueda en base de conocimiento',
        {
          query,
          category,
          hasMatch: searchResult.hasMatch,
          bestScore: searchResult.bestMatch?.score,
          totalMatches: searchResult.matches.length
        },
        undefined,
        'knowledge_search_api'
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Detecta la intención del usuario
   * POST /api/knowledge/detect-intent
   */
  detectIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = detectIntentSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new AppError('Invalid request data', 400);
      }

      const { query } = validation.data;

      const intentResult = this.knowledgeService.detectIntent(query);

      const response: ApiResponse = {
        success: true,
        data: {
          ...intentResult,
          query
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene respuesta especial por tipo
   * GET /api/knowledge/special/:type
   */
  getSpecialResponse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type } = req.params;

      if (!['greeting', 'farewell', 'help', 'unknown'].includes(type)) {
        throw new AppError('Invalid special response type', 400);
      }

      const response_text = await this.knowledgeService.getSpecialResponse(
        type as 'greeting' | 'farewell' | 'help' | 'unknown'
      );

      const response: ApiResponse = {
        success: true,
        data: {
          type,
          response: response_text,
          hasResponse: response_text !== null
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todas las categorías disponibles
   * GET /api/knowledge/categories
   */
  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.knowledgeService.getCategories();

      const response: ApiResponse = {
        success: true,
        data: categories,
        message: `Found ${categories.length} categories`,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene conocimiento por categoría
   * GET /api/knowledge/category/:category
   */
  getKnowledgeByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category } = req.params;

      const knowledge = await this.knowledgeService.searchByCategory(category);

      const response: ApiResponse = {
        success: true,
        data: knowledge,
        message: `Found ${knowledge.length} entries in category '${category}'`,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene preguntas sugeridas
   * GET /api/knowledge/suggestions
   */
  getSuggestedQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, limit = 5 } = req.query;

      const suggestions = await this.knowledgeService.getSuggestedQuestions(
        category as string,
        parseInt(limit as string) || 5
      );

      const response: ApiResponse = {
        success: true,
        data: suggestions,
        message: `Found ${suggestions.length} suggested questions`,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Procesa una consulta completa (búsqueda + intención)
   * POST /api/knowledge/process
   */
  processQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = searchKnowledgeSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new AppError('Invalid request data', 400);
      }

      const { query, category } = validation.data;

      // Detectar intención
      const intentResult = this.knowledgeService.detectIntent(query);

      // Buscar en base de conocimiento
      const searchResult = await this.knowledgeService.searchKnowledge(query, category);

      // Obtener respuesta especial si es necesario
      let specialResponse = null;
      if (!searchResult.hasMatch) {
        if (intentResult.intent !== 'unknown' && intentResult.confidence > 0.5) {
          specialResponse = await this.knowledgeService.getSpecialResponse(intentResult.intent);
        }
      }

      const response: ApiResponse = {
        success: true,
        data: {
          query,
          intent: intentResult,
          search: searchResult,
          specialResponse,
          recommendation: {
            useSearchResult: searchResult.hasMatch,
            useSpecialResponse: !searchResult.hasMatch && specialResponse !== null,
            useFallback: !searchResult.hasMatch && specialResponse === null
          }
        },
        timestamp: new Date().toISOString()
      };

      // Log del procesamiento completo
      await this.supabaseService.createLog(
        'info',
        'Consulta de conocimiento procesada completamente',
        {
          query,
          intent: intentResult.intent,
          intentConfidence: intentResult.confidence,
          hasSearchMatch: searchResult.hasMatch,
          hasSpecialResponse: specialResponse !== null,
          bestSearchScore: searchResult.bestMatch?.score
        },
        undefined,
        'knowledge_process_api'
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene estadísticas de la base de conocimiento
   * GET /api/knowledge/stats
   */
  getKnowledgeStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const allKnowledge = await this.supabaseService.getAllKnowledge();
      const categories = await this.knowledgeService.getCategories();

      // Calcular estadísticas por categoría
      const categoryStats = categories.map(category => {
        const entriesInCategory = allKnowledge.filter(kb => kb.category === category);
        return {
          category,
          count: entriesInCategory.length,
          hasQuestions: entriesInCategory.filter(kb => kb.question).length,
          hasKeywords: entriesInCategory.filter(kb => kb.keywords).length
        };
      });

      const response: ApiResponse = {
        success: true,
        data: {
          total: allKnowledge.length,
          categories: categories.length,
          categoryBreakdown: categoryStats,
          summary: {
            withQuestions: allKnowledge.filter(kb => kb.question).length,
            withKeywords: allKnowledge.filter(kb => kb.keywords).length,
            active: allKnowledge.filter(kb => kb.is_active).length
          }
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}

