
import { logger } from '@/lib/logger';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

class Analytics {
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
    
    // Em desenvolvimento, apenas logar
    if (process.env.NODE_ENV === 'development') {
      logger.info('Analytics inicializado em modo desenvolvimento', { sessionId: this.sessionId }, 'ANALYTICS');
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Definir usuário
  setUserId(userId: string) {
    this.userId = userId;
    logger.debug('UserId definido', { userId, sessionId: this.sessionId }, 'ANALYTICS');
  }

  // Rastrear evento
  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.pathname : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Analytics event', analyticsEvent, 'ANALYTICS');
    } else {
      this.queue.push(analyticsEvent);
      this.processQueue();
    }
  }

  // Rastrear visualização de página
  trackPageView(path: string, title?: string) {
    this.track('page_view', {
      path,
      title: title || document.title,
      referrer: document.referrer,
    });
  }

  // Rastrear ação do usuário
  trackUserAction(action: string, context?: Record<string, any>) {
    this.track('user_action', {
      action,
      ...context,
    });
  }

  // Rastrear erro
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  // Rastrear performance
  trackPerformance(metric: string, value: number, context?: Record<string, any>) {
    this.track('performance', {
      metric,
      value,
      ...context,
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) return;

    try {
      // Em produção, aqui você enviaria para um serviço de analytics
      // Por enquanto, vamos armazenar no localStorage
      const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      const allEvents = [...existingEvents, ...this.queue];
      
      // Manter apenas os últimos 1000 eventos
      const eventsToStore = allEvents.slice(-1000);
      localStorage.setItem('analytics_events', JSON.stringify(eventsToStore));
      
      logger.info(`${this.queue.length} eventos analytics processados`, {}, 'ANALYTICS');
      this.queue = [];
      
    } catch (error) {
      logger.error('Erro ao processar fila de analytics', { error }, 'ANALYTICS');
    }
  }

  // Obter estatísticas da sessão
  getSessionStats() {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    const sessionEvents = events.filter((e: AnalyticsEvent) => e.sessionId === this.sessionId);
    
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      eventCount: sessionEvents.length,
      startTime: sessionEvents[0]?.timestamp,
      lastEventTime: sessionEvents[sessionEvents.length - 1]?.timestamp,
      events: sessionEvents,
    };
  }

  // Limpar dados
  clearData() {
    localStorage.removeItem('analytics_events');
    this.queue = [];
    logger.info('Dados de analytics limpos', {}, 'ANALYTICS');
  }
}

export const analytics = new Analytics();

// Hook para rastrear componentes React
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
  };
};
