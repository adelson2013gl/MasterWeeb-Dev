import { logger } from './logger';

class SupabaseSecurityManager {
  private isProduction: boolean;
  private originalConsole: any = {};
  private sensitivePatterns: RegExp[];
  private debugMode: boolean = false;

  constructor() {
    this.isProduction = import.meta.env.PROD || import.meta.env.VITE_NODE_ENV === 'production';
    this.sensitivePatterns = [
      // URLs do Supabase com parâmetros sensíveis
      /https:\/\/[a-z0-9]+\.supabase\.co\/rest\/v1\/[^?\s]+\?[^\s]*/gi,
      
      // IDs de empresa, usuário, etc.
      /empresa_id=eq\.[a-f0-9-]+/gi,
      /user_id=eq\.[a-f0-9-]+/gi,
      /tecnico_id=eq\.[a-f0-9-]+/gi,
      
      // Códigos de erro HTTP com contexto sensível
      /GET.*supabase\.co.*[0-9]{3}/gi,
      /POST.*supabase\.co.*[0-9]{3}/gi,
      /PUT.*supabase\.co.*[0-9]{3}/gi,
      /DELETE.*supabase\.co.*[0-9]{3}/gi,
    ];
    
    this.initializeSecurityMeasures();
  }

  public enableDebugMode() {
    this.debugMode = true;
    logger.info('🔧 SecurityManager: Modo debug ATIVADO - sanitização reduzida');
  }

  public disableDebugMode() {
    this.debugMode = false;
    logger.info('🔒 SecurityManager: Modo debug DESATIVADO - sanitização normal');
  }

  public isDebugMode(): boolean {
    return this.debugMode;
  }

  private initializeSecurityMeasures() {
    if (this.isProduction) {
      this.suppressSupabaseLogs();
      this.setupNetworkErrorInterception();
    } else {
      // Em desenvolvimento, ainda aplicar sanitização básica
      this.setupDevelopmentLogging();
    }
  }

  private suppressSupabaseLogs() {
    // Interceptar e suprimir logs específicos do Supabase
    this.interceptConsoleMethod('warn', this.shouldSuppressLog.bind(this));
    this.interceptConsoleMethod('error', this.shouldSuppressLog.bind(this));
    this.interceptConsoleMethod('info', this.shouldSuppressLog.bind(this));
    this.interceptConsoleMethod('debug', this.shouldSuppressLog.bind(this));
  }

  private interceptConsoleMethod(method: 'warn' | 'error' | 'info' | 'debug', suppressFn: (message: string) => boolean) {
    if (!this.originalConsole[method]) {
      this.originalConsole[method] = console[method];
    }

    console[method] = (...args: any[]) => {
      const message = args.join(' ');
      
      if (suppressFn(message)) {
        // SEGURANÇA: Suprimir log e registrar para auditoria interna
        logger.securityAlert(`Suppressed ${method} log in production`, {
          type: `console_${method}_suppressed`,
          timestamp: new Date().toISOString(),
          hasArgs: args.length > 0
        });
        return;
      }

      // Se não deve ser suprimido, sanitizar e prosseguir
      const sanitizedArgs = this.sanitizeLogArguments(args);
      this.originalConsole[method].apply(console, sanitizedArgs);
    };
  }

  private shouldSuppressLog(message: string): boolean {
    if (!this.isProduction) return false;

    // NOVO: Em modo debug, não suprimir logs
    if (this.debugMode) {
      logger.info('🔧 DEBUG MODE: Log não suprimido', { message: message.substring(0, 100) });
      return false;
    }

    // Verificar se contém padrões sensíveis
    return this.sensitivePatterns.some(pattern => pattern.test(message)) ||
           message.includes('supabase.co') ||
           message.includes('Bad Request') ||
           message.includes('Not Found') ||
           message.includes('Unauthorized') ||
           /[0-9]{3}\s+\(.*Request\)/.test(message);
  }

  private sanitizeLogArguments(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'string') {
        let sanitized = arg;
        
        // NOVO: Em modo debug, não sanitizar emails para importação
        if (this.debugMode) {
          logger.info('🔧 DEBUG MODE: Sanitização reduzida para:', { 
            original: arg.substring(0, 50),
            isEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(arg)
          });
          
          // Ainda substituir UUIDs e tokens, mas manter emails
          sanitized = sanitized.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '[UUID]');
          sanitized = sanitized.replace(/https:\/\/[a-z0-9]+\.supabase\.co[^\s]*/gi, '[SUPABASE_URL]');
          sanitized = sanitized.replace(/eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, '[JWT_TOKEN]');
          
          return sanitized;
        }
        
        // Substituir UUIDs
        sanitized = sanitized.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '[UUID]');
        
        // Substituir emails
        sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
        
        // Substituir URLs do Supabase
        sanitized = sanitized.replace(/https:\/\/[a-z0-9]+\.supabase\.co[^\s]*/gi, '[SUPABASE_URL]');
        
        // Substituir tokens
        sanitized = sanitized.replace(/eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, '[JWT_TOKEN]');
        
        return sanitized;
      }
      
      if (typeof arg === 'object' && arg !== null) {
        return this.deepSanitizeObject(arg);
      }
      
      return arg;
    });
  }

  private deepSanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // NOVO: Em modo debug, não redact emails
      if (this.debugMode && lowerKey === 'email') {
        sanitized[key] = value;
        continue;
      }
      
      // Campos sempre redacted
      if (lowerKey.includes('id') || 
          lowerKey.includes('token') || 
          lowerKey.includes('email') ||
          lowerKey.includes('password')) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Recursivo para objetos aninhados
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.deepSanitizeObject(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeLogArguments([value])[0];
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private setupNetworkErrorInterception() {
    // Interceptar fetch global para Supabase
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      try {
        const response = await originalFetch(input, init);
        
        // Se é uma requisição para Supabase e falhou
        if (url.includes('supabase.co') && !response.ok) {
          // Em produção, não deixar o erro aparecer no console
          if (this.isProduction) {
            logger.securityAlert('Supabase request failed (suppressed)', {
              status: response.status,
              endpoint: '[REDACTED]',
              timestamp: new Date().toISOString()
            });
          }
        }
        
        return response;
      } catch (error) {
        // Interceptar erros de rede
        if (url.includes('supabase.co') && this.isProduction) {
          logger.securityAlert('Supabase network error (suppressed)', {
            type: 'network_error',
            timestamp: new Date().toISOString()
          });
        }
        
        throw error;
      }
    };
  }

  private setupDevelopmentLogging() {
    // Em desenvolvimento, apenas sanitizar logs sensíveis
    ['warn', 'error'].forEach(method => {
      const originalMethod = console[method as keyof Console] as Function;
      
      (console[method as keyof Console] as any) = (...args: any[]) => {
        const sanitizedArgs = this.sanitizeLogArguments(args);
        originalMethod.apply(console, sanitizedArgs);
      };
    });
  }

  // Método para desabilitar temporariamente a supressão (debugging)
  public temporarilyDisableSuppression(duration: number = 10000) {
    if (!this.isProduction) {
      console.log('🔧 Debug mode: Suppression disabled temporarily');
      
      // Restaurar métodos originais
      Object.keys(this.originalConsole).forEach(method => {
        (console as any)[method] = this.originalConsole[method];
      });
      
      // Reativar após duração especificada
      setTimeout(() => {
        this.suppressSupabaseLogs();
        console.log('🔒 Debug mode: Suppression re-enabled');
      }, duration);
    }
  }

  // Relatório de segurança
  public getSecurityReport() {
    return {
      isProduction: this.isProduction,
      suppressionActive: this.isProduction,
      debugMode: this.debugMode,
      sensitivePatterns: this.sensitivePatterns.length,
      interceptedMethods: Object.keys(this.originalConsole),
      timestamp: new Date().toISOString()
    };
  }
}

export const supabaseSecurityManager = new SupabaseSecurityManager();

// Expor globalmente apenas em desenvolvimento para debugging
if (import.meta.env.DEV) {
  (window as any).supabaseSecurityManager = supabaseSecurityManager;
}
