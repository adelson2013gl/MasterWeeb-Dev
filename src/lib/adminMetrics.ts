/**
 * Sistema de métricas para operações de administração
 */

import { logger } from './logger';

interface MetricEvent {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
}

class AdminMetricsService {
  private metrics: MetricEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // Limite para evitar vazamento de memória

  /**
   * Registra uma métrica de contador
   */
  incrementCounter(name: string, tags?: Record<string, string>): void {
    this.addMetric({
      name,
      value: 1,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * Registra uma métrica de valor
   */
  recordValue(name: string, value: number, tags?: Record<string, string>): void {
    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * Mede o tempo de execução de uma operação
   */
  async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let result: T;

    try {
      result = await operation();
      success = true;
      return result;
    } catch (error) {
      logger.error(`Operação ${operationName} falhou`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        metadata
      });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      
      this.recordPerformance({
        operation: operationName,
        duration,
        success,
        timestamp: startTime,
        metadata
      });

      // Registra métricas específicas
      this.recordValue(`${operationName}.duration`, duration, {
        success: success.toString()
      });
      
      this.incrementCounter(`${operationName}.total`, {
        success: success.toString()
      });
    }
  }

  /**
   * Obtém estatísticas de uma operação
   */
  getOperationStats(operationName: string, timeWindowMs = 60000): {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.performanceMetrics.filter(
      m => m.operation === operationName && m.timestamp >= cutoff
    );

    if (relevantMetrics.length === 0) {
      return {
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0
      };
    }

    const successMetrics = relevantMetrics.filter(m => m.success);
    const durations = relevantMetrics.map(m => m.duration);

    return {
      totalCalls: relevantMetrics.length,
      successCalls: successMetrics.length,
      failedCalls: relevantMetrics.length - successMetrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: successMetrics.length / relevantMetrics.length
    };
  }

  /**
   * Obtém métricas de cache
   */
  getCacheMetrics(timeWindowMs = 60000): {
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const cacheMetrics = this.metrics.filter(
      m => (m.name.includes('cache.hit') || m.name.includes('cache.miss')) && 
           m.timestamp >= cutoff
    );

    const hits = cacheMetrics
      .filter(m => m.name.includes('cache.hit'))
      .reduce((sum, m) => sum + m.value, 0);
    
    const misses = cacheMetrics
      .filter(m => m.name.includes('cache.miss'))
      .reduce((sum, m) => sum + m.value, 0);

    const total = hits + misses;
    
    return {
      hits,
      misses,
      hitRate: total > 0 ? hits / total : 0
    };
  }

  /**
   * Obtém resumo geral das métricas
   */
  getMetricsSummary(timeWindowMs = 300000): Record<string, any> {
    const adminOperations = [
      'admin.list',
      'admin.create',
      'admin.update',
      'admin.delete',
      'empresas.list',
      'permissions.calculate'
    ];

    const summary: Record<string, any> = {
      timestamp: new Date().toISOString(),
      timeWindow: `${timeWindowMs / 1000}s`,
      operations: {},
      cache: this.getCacheMetrics(timeWindowMs)
    };

    adminOperations.forEach(operation => {
      summary.operations[operation] = this.getOperationStats(operation, timeWindowMs);
    });

    return summary;
  }

  /**
   * Limpa métricas antigas
   */
  cleanupOldMetrics(maxAgeMs = 3600000): void { // 1 hora por padrão
    const cutoff = Date.now() - maxAgeMs;
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp >= cutoff);
    
    logger.debug('Métricas antigas removidas', {
      cutoff: new Date(cutoff).toISOString(),
      remainingMetrics: this.metrics.length,
      remainingPerformanceMetrics: this.performanceMetrics.length
    });
  }

  /**
   * Adiciona uma métrica
   */
  private addMetric(metric: MetricEvent): void {
    this.metrics.push(metric);
    
    // Limita o número de métricas
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Registra métrica de performance
   */
  private recordPerformance(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric);
    
    // Limita o número de métricas de performance
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Exporta métricas para logging
   */
  logMetricsSummary(): void {
    const summary = this.getMetricsSummary();
    logger.info('Resumo de métricas de administração', summary);
  }
}

// Instância singleton
export const adminMetrics = new AdminMetricsService();

// Limpeza automática a cada 30 minutos
setInterval(() => {
  adminMetrics.cleanupOldMetrics();
}, 30 * 60 * 1000);

// Log de métricas a cada 5 minutos
setInterval(() => {
  adminMetrics.logMetricsSummary();
}, 5 * 60 * 1000);