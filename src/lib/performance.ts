
import { logger } from '@/lib/logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: any;
}

// Tipos específicos para Performance API
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled = process.env.NODE_ENV === 'development';

  // Medir tempo de carregamento de componentes
  measureComponentLoad(componentName: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric('component_load', duration, { componentName });
      
      if (duration > 100) {
        logger.warn(`Componente ${componentName} demorou ${duration.toFixed(2)}ms para carregar`, 
          { duration, componentName }, 'PERFORMANCE');
      }
    };
  }

  // Medir tempo de queries
  measureQuery(queryKey: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric('query_duration', duration, { queryKey });
      
      if (duration > 500) {
        logger.warn(`Query ${queryKey} demorou ${duration.toFixed(2)}ms`, 
          { duration, queryKey }, 'PERFORMANCE');
      }
    };
  }

  // Medir Web Vitals
  measureWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Largest Contentful Paint
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('lcp', entry.startTime, { entry: entry.toJSON() });
          logger.performance('LCP', entry.startTime);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      logger.debug('LCP observer não suportado', { error }, 'PERFORMANCE');
    }

    // First Input Delay
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const eventEntry = entry as PerformanceEventTiming;
          const fid = eventEntry.processingStart - eventEntry.startTime;
          this.recordMetric('fid', fid, { entry: entry.toJSON() });
          logger.performance('FID', fid);
        }
      }).observe({ entryTypes: ['first-input'] });
    } catch (error) {
      logger.debug('FID observer não suportado', { error }, 'PERFORMANCE');
    }

    // Cumulative Layout Shift
    try {
      new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          const layoutEntry = entry as LayoutShiftEntry;
          if (!layoutEntry.hadRecentInput) {
            clsValue += layoutEntry.value;
          }
        }
        if (clsValue > 0) {
          this.recordMetric('cls', clsValue);
          logger.performance('CLS', clsValue);
        }
      }).observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      logger.debug('CLS observer não suportado', { error }, 'PERFORMANCE');
    }
  }

  // Monitorar uso de memória
  measureMemoryUsage() {
    if (!this.isEnabled || typeof window === 'undefined' || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    const memoryData = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };

    this.recordMetric('memory_usage', memory.usedJSHeapSize, memoryData);
    
    // Alertar se uso de memória estiver alto
    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      logger.warn('Alto uso de memória detectado', memoryData, 'PERFORMANCE');
    }
  }

  private recordMetric(name: string, value: number, context?: any) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(metric);
    
    // Manter apenas as últimas 100 métricas para evitar vazamento de memória
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Obter relatório de performance
  getPerformanceReport() {
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    const report: Record<string, any> = {};
    
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      report[name] = {
        count: values.length,
        average: avg.toFixed(2),
        max: max.toFixed(2),
        min: min.toFixed(2),
      };
    });

    return report;
  }

  // Limpar métricas
  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook para medir performance de componentes React
export const usePerformanceMonitor = (componentName: string) => {
  const measureEnd = performanceMonitor.measureComponentLoad(componentName);
  
  return {
    measureEnd,
    getReport: () => performanceMonitor.getPerformanceReport(),
  };
};
