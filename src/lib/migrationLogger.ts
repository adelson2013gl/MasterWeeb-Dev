/**
 * Logger específico para scripts de migração
 * Funciona tanto em Node.js quanto no browser
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface MigrationLogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context: string;
}

class MigrationLogger {
  private context: string;
  private isProduction: boolean;

  constructor(context: string = 'MIGRATION') {
    this.context = context;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry: MigrationLogEntry = {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
      context: this.context
    };

    // Em produção, logs estruturados são silenciosos
    // Em desenvolvimento, mostrar no console com formatação
    if (!this.isProduction) {
      const icon = this.getIcon(level);
      const formattedMessage = `${icon} [${this.context}] ${message}`;
      
      if (data && Object.keys(data).length > 0) {
        console.log(formattedMessage, this.sanitizeData(data));
      } else {
        console.log(formattedMessage);
      }
    }

    // Em produção, armazenar apenas em estrutura de dados para auditoria
    this.storeLogEntry(entry);
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remover dados sensíveis dos logs
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }
      return sanitized;
    }
    
    return data;
  }

  private getIcon(level: LogLevel): string {
    const icons = {
      info: '📋',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    };
    return icons[level];
  }

  private storeLogEntry(entry: MigrationLogEntry) {
    // Em ambiente de migração, usar localStorage se disponível
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const logs = JSON.parse(localStorage.getItem('migration_logs') || '[]');
        logs.push(entry);
        
        // Manter apenas os últimos 50 logs
        if (logs.length > 50) {
          logs.splice(0, logs.length - 50);
        }
        
        localStorage.setItem('migration_logs', JSON.stringify(logs));
      } catch (error) {
        // Falha silenciosa para não quebrar a migração
      }
    }
  }

  // Métodos públicos
  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  success(message: string, data?: any) {
    this.log('success', message, data);
  }

  // Métodos específicos para migração
  startMigration(migrationName: string) {
    this.info(`🚀 Iniciando migração: ${migrationName}`);
  }

  finishMigration(migrationName: string, duration?: number) {
    const durationText = duration ? ` (${duration}ms)` : '';
    this.success(`🎉 Migração concluída: ${migrationName}${durationText}`);
  }

  step(stepNumber: number, totalSteps: number, description: string) {
    this.info(`📝 Passo ${stepNumber}/${totalSteps}: ${description}`);
  }

  // Obter logs para debugging
  getLogs(): MigrationLogEntry[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return JSON.parse(localStorage.getItem('migration_logs') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  }

  // Limpar logs
  clearLogs() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('migration_logs');
    }
  }
}

// Factory function para diferentes contextos
export const createMigrationLogger = (context: string) => new MigrationLogger(context);

// Instância padrão
export const migrationLogger = new MigrationLogger();