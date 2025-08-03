
import { logger } from './logger';

/**
 * Utilitário temporário para facilitar a migração de console.logs para o sistema estruturado
 * Este arquivo deve ser removido após a migração completa
 */

// Wrapper temporário para console.log com categorização automática
export const logMigration = {
  // Para logs de desenvolvimento/debug
  dev: (message: string, data?: any, context?: string) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[MIGRATION] ${message}`, data, context || 'DEV');
    }
  },

  // Para logs de informação
  info: (message: string, data?: any, context?: string) => {
    logger.info(`[MIGRATION] ${message}`, data, context || 'INFO');
  },

  // Para logs de warning
  warn: (message: string, data?: any, context?: string) => {
    logger.warn(`[MIGRATION] ${message}`, data, context || 'WARN');
  },

  // Para logs de erro
  error: (message: string, data?: any, context?: string) => {
    logger.error(`[MIGRATION] ${message}`, data, context || 'ERROR');
  },

  // Wrapper para console.log direto que precisa ser convertido
  temp: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TEMP-LOG] ${message}`, data);
    }
    // TODO: Este método deve ser removido após migração completa
  }
};

// Lista de console.logs que ainda precisam ser convertidos
export const pendingMigrationLogs = [
  'src/components/admin/GestaoEmpresas.tsx - linha X',
  'src/services/configuracoes.service.ts - linha X',
  // Adicionar mais conforme necessário
];

// Estatísticas de migração
export const migrationStats = {
  totalConsoleLogsFound: 432,
  converted: 0,
  remaining: 432,
  categories: {
    AUTH: 0,
    API: 0,
    ADMIN: 0,
    BILLING: 0,
    DATABASE: 0,
    AGENDAS: 0,
    AGENDAMENTO: 0,
    AUDIT: 0
  }
};
