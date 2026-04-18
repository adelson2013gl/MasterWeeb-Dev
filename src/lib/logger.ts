type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  message: string;
  data?: any;
  context?: string;
  timestamp?: Date;
  level: LogLevel;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  context?: any;
  timestamp: Date;
}

interface SecurityConfig {
  enableConsoleLogs: boolean;
  enablePerformanceLogs: boolean;
  enableProductionLogs: boolean;
  sanitizeData: boolean;
  maxLogEntries: number;
}

class Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;
  private performanceMetrics: PerformanceMetric[] = [];
  private securityConfig: SecurityConfig;
  private sensitiveFields: string[];
  private piiFields: string[];
  private securityPatterns: RegExp[];
  private debugModeActive: boolean = false;

  constructor() {
    // Detectar ambiente de forma mais robusta
    this.isDevelopment = this.detectEnvironment();
    this.logLevel = this.getLogLevelFromEnv();
    this.securityConfig = this.initializeSecurityConfig();
    this.sensitiveFields = this.initializeSensitiveFields();
    this.piiFields = this.initializePiiFields();
    this.securityPatterns = this.initializeSecurityPatterns();
    
    // SEGURANÇA CRÍTICA: Em produção, desabilitar completamente console.log
    if (!this.isDevelopment) {
      this.overrideConsoleMethods();
    }
    
    // Log inicial apenas em desenvolvimento
    if (this.isDevelopment) {
      console.log('🔧 Logger inicializado com configurações de segurança:', {
        environment: import.meta.env.VITE_NODE_ENV,
        logLevel: this.logLevel,
        securityConfig: this.securityConfig,
        sensitiveFieldsCount: this.sensitiveFields.length,
        piiFieldsCount: this.piiFields.length
      });
    }
  }

  public enableImportDebugMode() {
    this.debugModeActive = true;
    console.log('🔧 LOGGER: Modo debug de importação ATIVADO - sanitização de emails desabilitada');
  }

  public disableImportDebugMode() {
    this.debugModeActive = false;
    console.log('🔒 LOGGER: Modo debug de importação DESATIVADO - sanitização normal');
  }

  public isImportDebugMode(): boolean {
    return this.debugModeActive;
  }

  private detectEnvironment(): boolean {
    const nodeEnv = import.meta.env.VITE_NODE_ENV;
    const mode = import.meta.env.MODE;
    const isDev = import.meta.env.DEV;
    
    // Considerado produção se qualquer um dos indicadores mostrar produção
    const isProduction = nodeEnv === 'production' || mode === 'production' || import.meta.env.PROD;
    
    return !isProduction && (isDev || nodeEnv === 'development' || mode === 'development');
  }

  private initializeSecurityConfig(): SecurityConfig {
    const isProd = !this.isDevelopment;
    
    return {
      enableConsoleLogs: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true' || this.isDevelopment,
      enablePerformanceLogs: import.meta.env.VITE_ENABLE_PERFORMANCE_LOGS === 'true' || this.isDevelopment,
      enableProductionLogs: import.meta.env.VITE_ENABLE_PRODUCTION_LOGS === 'true',
      sanitizeData: true, // SEMPRE sanitizar dados
      maxLogEntries: isProd ? 25 : 100
    };
  }

  private initializeSensitiveFields(): string[] {
    return [
      // Credenciais e tokens
      'senha', 'password', 'token', 'secret', 'key', 'access_token', 'refresh_token',
      'authorization', 'bearer', 'jwt', 'session_id', 'cookie', 'auth',
      
      // Dados pessoais (PII/LGPD)
      'cpf', 'cnpj', 'rg', 'cnh', 'passaporte', 'documento',
      'email', 'telefone', 'celular', 'phone', 'endereco', 'address',
      'cep', 'zip_code', 'postal_code',
      
      // IDs sensíveis
      'user_id', 'empresa_id', 'tecnico_id', 'admin_id',
      'client_id', 'customer_id', 'subscription_id',
      
      // Dados financeiros
      'card_number', 'credit_card', 'bank_account', 'pix_key',
      'salary', 'income', 'payment', 'billing',
      
      // Dados médicos/sensíveis
      'medical_record', 'health_info', 'biometric'
    ];
  }

  private initializePiiFields(): string[] {
    return [
      'nome', 'name', 'fullname', 'first_name', 'last_name',
      'birth_date', 'age', 'gender', 'nationality',
      'mother_name', 'father_name', 'spouse_name'
    ];
  }

  private initializeSecurityPatterns(): RegExp[] {
    return [
      // CPF: 000.000.000-00 ou 00000000000
      /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
      
      // Email: usuario@dominio.com
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      
      // Telefone: (11) 99999-9999 ou variações
      /\b(?:\+55\s?)?(?:\(\d{2}\)\s?)?(?:9\s?)?(?:\d{4}[-\s]?\d{4})\b/g,
      
      // Tokens JWT (começa com eyJ)
      /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
      
      // UUIDs
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      
      // Possíveis senhas (sequências alfanuméricas longas)
      /\b[A-Za-z0-9!@#$%^&*]{8,}\b/g
    ];
  }

  private overrideConsoleMethods(): void {
    // SEGURANÇA CRÍTICA: Desabilitar completamente console em produção
    const noop = () => {};
    const originalConsole = { ...console };
    
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.debug = noop;
    console.trace = noop;
    console.table = noop;
    console.group = noop;
    console.groupCollapsed = noop;
    
    // Manter apenas console.error para erros críticos, mas sanitizados
    console.error = (...args: any[]) => {
      if (this.securityConfig.enableProductionLogs) {
        const sanitizedArgs = args.map(arg => this.deepSanitizeData(arg));
        originalConsole.error('[SANITIZED]', ...sanitizedArgs);
      }
    };
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLogLevel = import.meta.env.VITE_LOG_LEVEL;
    if (envLogLevel && ['debug', 'info', 'warn', 'error'].includes(envLogLevel)) {
      return envLogLevel as LogLevel;
    }
    
    // Fallback baseado no ambiente - MAS MAIS RESTRITIVO
    if (this.isDevelopment) return 'debug';
    return 'error'; // Em produção, apenas erros críticos
  }

  private shouldLog(level: LogLevel): boolean {
    // Em produção, ser ainda mais restritivo
    if (!this.isDevelopment && level !== 'error') {
      return false;
    }
    
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }

  private maskPii(value: string): string {
    if (typeof value !== 'string') return value;
    
    let maskedValue = value;
    
    // NOVO: Em modo debug de importação, não mascarar emails
    if (this.debugModeActive && this.isDevelopment) {
      console.log('🔧 LOGGER DEBUG: Preservando emails para debug de importação');
      
      // Ainda mascarar outros dados sensíveis, mas preservar emails
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = maskedValue.match(emailPattern) || [];
      
      // Aplicar outros padrões exceto email
      this.securityPatterns.forEach((pattern, index) => {
        if (index !== 1) { // Pular padrão de email (índice 1)
          maskedValue = maskedValue.replace(pattern, (match) => {
            if (match.includes('.') && match.length === 14) {
              // CPF: mostrar apenas últimos 2 dígitos
              return `***.***.**-${match.slice(-2)}`;
            } else if (match.length > 10) {
              // Tokens/UUIDs: mostrar apenas início e fim
              return `${match.slice(0, 4)}***${match.slice(-4)}`;
            }
            return '[MASKED]';
          });
        }
      });
      
      return maskedValue;
    }
    
    // Aplicar padrões normais de mascaramento
    this.securityPatterns.forEach(pattern => {
      maskedValue = maskedValue.replace(pattern, (match) => {
        if (match.includes('@')) {
          // Email: mostrar apenas primeira letra e domínio
          const [user, domain] = match.split('@');
          return `${user[0]}***@${domain}`;
        } else if (match.includes('.') && match.length === 14) {
          // CPF: mostrar apenas últimos 2 dígitos
          return `***.***.**-${match.slice(-2)}`;
        } else if (match.length > 10) {
          // Tokens/UUIDs: mostrar apenas início e fim
          return `${match.slice(0, 4)}***${match.slice(-4)}`;
        }
        return '[MASKED]';
      });
    });
    
    return maskedValue;
  }

  private deepSanitizeData(data: any): any {
    // NOVO: Em modo debug, não sanitizar dados se solicitado
    if (this.debugModeActive && this.isDevelopment) {
      console.log('🔧 LOGGER DEBUG: Sanitização reduzida ativa');
      return this.lightSanitizeForDebug(data);
    }
    
    if (!this.securityConfig.sanitizeData) return data;
    if (data === null || data === undefined) return data;
    
    // Primitivos
    if (typeof data === 'string') {
      return this.maskPii(data);
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }
    
    // Arrays
    if (Array.isArray(data)) {
      return data.map(item => this.deepSanitizeData(item));
    }
    
    // Objetos
    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        
        // Remover completamente campos ultra-sensíveis
        if (this.sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
          sanitized[key] = '[REDACTED]';
          continue;
        }
        
        // Mascarar PII
        if (this.piiFields.some(field => lowerKey.includes(field.toLowerCase()))) {
          if (typeof value === 'string') {
            sanitized[key] = value.length > 0 ? `${value[0]}***` : '[EMPTY]';
          } else {
            sanitized[key] = '[PII_MASKED]';
          }
          continue;
        }
        
        // Recursivo para objetos aninhados
        sanitized[key] = this.deepSanitizeData(value);
      }
      
      return sanitized;
    }
    
    return data;
  }

  private lightSanitizeForDebug(data: any): any {
    if (data === null || data === undefined) return data;
    
    // Primitivos - apenas mascarar senhas e tokens
    if (typeof data === 'string') {
      let sanitized = data;
      // Apenas mascarar tokens JWT e possíveis senhas longas
      sanitized = sanitized.replace(/eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, '[JWT_TOKEN]');
      sanitized = sanitized.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID]');
      return sanitized;
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }
    
    // Arrays
    if (Array.isArray(data)) {
      return data.map(item => this.lightSanitizeForDebug(item));
    }
    
    // Objetos
    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        
        // Apenas redact senhas e tokens críticos
        if (lowerKey.includes('senha') || lowerKey.includes('password') || 
            lowerKey.includes('token') || lowerKey.includes('secret')) {
          sanitized[key] = '[REDACTED]';
          continue;
        }
        
        // Preservar emails, nomes, CPFs para debug de importação
        sanitized[key] = this.lightSanitizeForDebug(value);
      }
      
      return sanitized;
    }
    
    return data;
  }

  private formatMessage(logData: LogData): string {
    const timestamp = logData.timestamp?.toISOString() || new Date().toISOString();
    const context = logData.context ? `[${logData.context}]` : '';
    const level = logData.level.toUpperCase().padEnd(5);
    const env = this.isDevelopment ? '[DEV]' : '[PROD]';
    
    return `${timestamp} ${env} ${level} ${context} ${logData.message}`;
  }

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    if (!this.shouldLog(level)) return;

    const logData: LogData = {
      // CORREÇÃO CRÍTICA: Respeitar modo debug para mensagens
      message: this.debugModeActive && this.isDevelopment ? message : this.maskPii(message),
      data: this.deepSanitizeData(data),
      context,
      timestamp: new Date(),
      level
    };

    const formattedMessage = this.formatMessage(logData);

    // Console logs apenas se habilitado e em desenvolvimento
    if (this.securityConfig.enableConsoleLogs && this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error :
                           level === 'warn' ? console.warn :
                           level === 'debug' ? console.debug :
                           console.info;
      
      if (logData.data && Object.keys(logData.data).length > 0) {
        consoleMethod(formattedMessage, logData.data);
      } else {
        consoleMethod(formattedMessage);
      }
    }

    // Em produção, logs críticos vão para serviço seguro
    if (!this.isDevelopment && level === 'error') {
      this.sendToSecureLoggingService(logData);
    }
  }

  private sendToSecureLoggingService(logData: LogData) {
    try {
      // Armazenar apenas logs críticos sanitizados
      const secureLogEntry = {
        timestamp: logData.timestamp?.toISOString(),
        level: logData.level,
        message: logData.message, // Já sanitizado
        context: logData.context,
        environment: 'production',
        // NÃO incluir dados sensíveis
        hasData: !!logData.data
      };
      
      const logs = JSON.parse(localStorage.getItem('secure_error_logs') || '[]');
      logs.push(secureLogEntry);
      
      // Manter apenas os logs mais recentes
      if (logs.length > this.securityConfig.maxLogEntries) {
        logs.splice(0, logs.length - this.securityConfig.maxLogEntries);
      }
      
      localStorage.setItem('secure_error_logs', JSON.stringify(logs));
    } catch (error) {
      // Falha silenciosa em produção para não expor dados
      if (this.isDevelopment) {
        console.error('Erro ao armazenar log seguro:', error);
      }
    }
  }

  // Métodos públicos com sanitização automática
  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: any, context?: string) {
    this.log('error', message, data, context);
  }

  // Métodos especializados por contexto com sanitização extra
  auth(level: LogLevel, message: string, data?: any) {
    // Contexto de autenticação é sempre sensível
    const sanitizedData = this.deepSanitizeData(data);
    this.log(level, message, sanitizedData, 'AUTH');
  }

  api(level: LogLevel, message: string, data?: any) {
    this.log(level, message, data, 'API');
  }

  billing(level: LogLevel, message: string, data?: any) {
    // Dados de cobrança são sempre sensíveis
    const sanitizedData = this.deepSanitizeData(data);
    this.log(level, message, sanitizedData, 'BILLING');
  }

  admin(level: LogLevel, message: string, data?: any) {
    this.log(level, message, data, 'ADMIN');
  }

  database(level: LogLevel, message: string, data?: any) {
    this.log(level, message, data, 'DATABASE');
  }

  performance(operation: string, duration: number, context?: any) {
    if (!this.securityConfig.enablePerformanceLogs) return;

    const metric: PerformanceMetric = {
      operation,
      duration,
      context: this.deepSanitizeData(context),
      timestamp: new Date()
    };

    this.performanceMetrics.push(metric);
    
    // Manter apenas métricas recentes
    if (this.performanceMetrics.length > this.securityConfig.maxLogEntries) {
      this.performanceMetrics.shift();
    }

    this.info(`Performance: ${operation} (${duration}ms)`, context, 'PERF');
  }

  // Método especial para erros críticos de segurança
  securityAlert(message: string, data?: any) {
    this.error(`🚨 SECURITY ALERT: ${message}`, data, 'SECURITY');
  }

  // Métodos especiais para contextos sensíveis
  authError(action: string, error: any, context?: any) {
    this.auth('error', `Erro de autenticação: ${action}`, { error: error?.message || error, context });
  }

  apiError(endpoint: string, error: any, context?: any) {
    this.api('error', `Erro na API: ${endpoint}`, { error: error?.message || error, context });
  }

  // Obter métricas sanitizadas
  getPerformanceMetrics(): PerformanceMetric[] {
    return this.performanceMetrics.map(metric => ({
      ...metric,
      context: this.deepSanitizeData(metric.context)
    }));
  }

  clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }

  // Obter configuração atual (sanitizada)
  getConfig() {
    return {
      environment: this.isDevelopment ? 'development' : 'production',
      isDevelopment: this.isDevelopment,
      logLevel: this.logLevel,
      securityConfig: this.securityConfig,
      sensitiveFieldsCount: this.sensitiveFields.length,
      piiFieldsCount: this.piiFields.length,
      debugModeActive: this.debugModeActive,
      viteEnv: {
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        prod: import.meta.env.PROD
      }
    };
  }

  // Método para auditoria de segurança
  getSecurityReport() {
    if (!this.isDevelopment) {
      return { error: 'Security report only available in development' };
    }
    
    return {
      sensitiveFields: this.sensitiveFields,
      piiFields: this.piiFields,
      securityPatterns: this.securityPatterns.map(p => p.toString()),
      config: this.securityConfig,
      environment: this.isDevelopment ? 'development' : 'production',
      debugModeActive: this.debugModeActive
    };
  }
}

export const logger = new Logger();
