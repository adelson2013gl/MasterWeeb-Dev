/**
 * Serviço de cache para empresas com retry logic
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { EMPRESA_STATUS, type Empresa, type EmpresaBasica } from '@/types/empresa';
import { adminMetrics } from '@/lib/adminMetrics';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class EmpresaCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 segundo

  /**
   * Busca empresas ativas com cache e retry
   */
  async getEmpresasAtivas(allowedIds?: string[]): Promise<EmpresaBasica[]> {
    const cacheKey = `empresas_ativas_${allowedIds?.join(',') || 'all'}`;
    
    // Verifica cache
    const cached = this.getFromCache<EmpresaBasica[]>(cacheKey);
    if (cached) {
      adminMetrics.incrementCounter('cache.hit', { type: 'empresas' });
      logger.debug('Empresas obtidas do cache', { cacheKey });
      return cached;
    }
    
    adminMetrics.incrementCounter('cache.miss', { type: 'empresas' });

    // Busca com retry
    const empresas = await this.retryOperation(async () => {
      let query = supabase
        .from('empresas')
        .select('id, nome')
        .eq('ativa', true)
        .order('nome');

      if (allowedIds && allowedIds.length > 0) {
        query = query.in('id', allowedIds);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar empresas: ${error.message}`);
      }

      return data || [];
    });

    // Armazena no cache
    this.setCache(cacheKey, empresas, this.DEFAULT_TTL);
    
    logger.info('Empresas carregadas e armazenadas no cache', { 
      count: empresas.length,
      cacheKey 
    });

    return empresas;
  }

  /**
   * Busca empresa por ID com cache
   */
  async getEmpresaById(id: string): Promise<Empresa | null> {
    const cacheKey = `empresa_${id}`;
    
    // Verifica cache
    const cached = this.getFromCache<Empresa>(cacheKey);
    if (cached) {
      adminMetrics.incrementCounter('cache.hit', { type: 'empresa' });
      return cached;
    }
    
    adminMetrics.incrementCounter('cache.miss', { type: 'empresa' });

    // Busca com retry
    const empresa = await this.retryOperation(async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Empresa não encontrada
        }
        throw new Error(`Erro ao buscar empresa: ${error.message}`);
      }

      return data;
    });

    if (empresa) {
      this.setCache(cacheKey, empresa, this.DEFAULT_TTL);
    }

    return empresa as Empresa;
  }

  /**
   * Invalida cache de empresas
   */
  invalidateEmpresasCache(): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith('empresas_') || key.startsWith('empresa_')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    logger.info('Cache de empresas invalidado', { 
      keysRemoved: keysToDelete.length 
    });
  }

  /**
   * Operação com retry logic
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erro desconhecido');
        
        logger.warn(`Tentativa ${attempt} falhou`, {
          error: lastError.message,
          attempt,
          maxRetries: retries
        });

        if (attempt < retries) {
          await this.delay(this.RETRY_DELAY * attempt); // Backoff exponencial
        }
      }
    }

    logger.error('Todas as tentativas falharam', {
      error: lastError!.message,
      maxRetries: retries
    });
    
    throw lastError!;
  }

  /**
   * Obtém item do cache se válido
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Armazena item no cache
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache completamente limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / (validEntries + expiredEntries) || 0
    };
  }
}

// Instância singleton
export const empresaCacheService = new EmpresaCacheService();