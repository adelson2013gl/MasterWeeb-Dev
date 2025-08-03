// Configurações centralizadas para exportação de agendamentos
export const EXPORT_CONFIG = {
  FORMATS: {
    DATE: 'dd/MM/yyyy',
    DATETIME: 'dd/MM/yyyy HH:mm:ss',
    FILENAME: 'yyyyMMdd_HHmmss'
  },
  LABELS: {
    NO_APPOINTMENTS: '--- Sem agendamentos ---',
    NOT_AVAILABLE: 'N/A'
  },
  CACHE: {
    DURATION: 5 * 60 * 1000, // 5 minutos
    MAX_SIZE: 100, // máximo de entradas no cache
    KEY_PREFIX: 'export_agendamentos_cache'
  },
  PERFORMANCE: {
    BATCH_SIZE: 1000, // processar em lotes
    MAX_RECORDS: 10000 // limite máximo de registros
  },
  EXCEL: {
    SHEET_NAMES: {
      AGENDA_FORMAT: 'Agendas por Turno',
      CONFIRMED: 'Agendamentos Confirmados',
      PENDING: 'Lista de Reservas',
      SUMMARY: 'Resumo Executivo'
    }
  }
};

// Tipos para validação
export interface ExportData {
  data: string;
  cidade: string;
  regiao: string;
  turno: string;
  cpfEntregador: string;
  nomeEntregador: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}