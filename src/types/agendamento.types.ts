/**
 * Tipos TypeScript rigorosos para agendamentos - ESTRUTURA SLOTMASTER RESTAURADA
 * Este arquivo define interfaces para a estrutura original SlotMaster
 */

// Status possíveis para um agendamento - ATUALIZADO PARA BANCO
export type StatusAgendamento = 
  | 'agendado'
  | 'pendente' 
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'
  | 'nao_compareceu';

// Tipos de agendamento - ATUALIZADO PARA BANCO (mantendo retrocompatibilidade)
export type TipoAgendamento = 'vaga' | 'entrega' | 'reserva' | 'especial';

// Interface para dados de turno
export interface TurnoData {
  id: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
}

// Interface para dados de região
export interface RegiaoData {
  id: string;
  nome: string;
  cidade: {
    id: string;
    nome: string;
  };
}

// Interface para dados de agenda - ESTRUTURA REAL DO BANCO
export interface AgendaData {
  id: string;
  data_agenda: string;
  vagas_disponiveis: number;
  vagas_ocupadas: number;
  permite_reserva: boolean;  // ADICIONADO: nova coluna
  created_by?: string;  // ADICIONADO: referência ao criador
  turno: TurnoData;
  regiao: RegiaoData;
}

// Interface principal para agendamento - ESTRUTURA SLOTMASTER COMPLETA
export interface AgendamentoCompleto {
  // Propriedades básicas do agendamento
  id: string;
  agenda_id: string; // CAMPO RESTAURADO - CHAVE ESTRANGEIRA
  entregador_id: string;
  status: StatusAgendamento;
  tipo: TipoAgendamento;
  data_agendamento: string;
  data_cancelamento?: string;
  motivo_cancelamento?: string;  // ADICIONADO: nova coluna
  observacoes?: string;
  valor?: number;
  created_at: string;
  updated_at: string;
  
  // Dados do cliente - CAMPOS SLOTMASTER
  cliente_nome: string;
  cliente_telefone: string;
  endereco_coleta: string;
  endereco_entrega: string;
  
  // Propriedades flattened para facilitar acesso nos componentes
  data_agenda: string;
  turno_nome: string;
  hora_inicio: string;
  hora_fim: string;
  regiao_nome: string;
  cidade_nome: string;
  
  // Campos legados para compatibilidade
  data: string; // alias para data_agenda
  
  // Estrutura aninhada completa
  agenda: AgendaData;
}

// Interface para validação de dados vindos da API - ESTRUTURA SLOTMASTER
export interface AgendamentoRawFromAPI {
  id: string;
  agenda_id: string; // CAMPO RESTAURADO
  entregador_id: string;
  status: string;
  tipo: string;
  data_agendamento: string;
  data_cancelamento?: string;
  motivo_cancelamento?: string;  // ADICIONADO: nova coluna
  observacoes?: string;
  valor?: number;
  created_at: string;
  updated_at: string;
  
  // Dados do cliente - CAMPOS SLOTMASTER
  cliente_nome: string;
  cliente_telefone: string;
  endereco_coleta: string;
  endereco_entrega: string;
  
  // Dados da agenda via JOIN - ESTRUTURA REAL DO BANCO
  agendas: {
    id: string;
    data_agenda: string;
    vagas_disponiveis: number;
    vagas_ocupadas: number;
    permite_reserva: boolean;  // ADICIONADO: nova coluna
    created_by?: string;  // ADICIONADO: referência ao criador
    turnos: {
      id: string;
      nome: string;
      hora_inicio: string;
      hora_fim: string;
    };
    regioes: {
      id: string;
      nome: string;
      cidades: {
        id: string;
        nome: string;
      };
    };
  };
}

// Type guards para validação em runtime
export function isValidStatusAgendamento(status: string): status is StatusAgendamento {
  return ['agendado', 'pendente', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu'].includes(status);
}

export function isValidTipoAgendamento(tipo: string): tipo is TipoAgendamento {
  return ['vaga', 'entrega', 'reserva', 'especial'].includes(tipo);
}

// Função para validar se um objeto tem a estrutura esperada de agendamento - SLOTMASTER
export function isValidAgendamentoRaw(obj: any): obj is AgendamentoRawFromAPI {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.agenda_id === 'string' &&
    typeof obj.entregador_id === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.tipo === 'string' &&
    typeof obj.data_agendamento === 'string' &&
    typeof obj.cliente_nome === 'string' &&
    typeof obj.cliente_telefone === 'string' &&
    typeof obj.endereco_coleta === 'string' &&
    typeof obj.endereco_entrega === 'string' &&
    obj.agendas &&
    typeof obj.agendas.id === 'string' &&
    typeof obj.agendas.data_agenda === 'string' &&
    typeof obj.agendas.vagas_disponiveis === 'number' &&
    typeof obj.agendas.vagas_ocupadas === 'number' &&
    typeof obj.agendas.permite_reserva === 'boolean' &&
    obj.agendas.turnos &&
    typeof obj.agendas.turnos.id === 'string' &&
    typeof obj.agendas.turnos.nome === 'string' &&
    typeof obj.agendas.turnos.hora_inicio === 'string' &&
    typeof obj.agendas.turnos.hora_fim === 'string' &&
    obj.agendas.regioes &&
    typeof obj.agendas.regioes.id === 'string' &&
    typeof obj.agendas.regioes.nome === 'string' &&
    obj.agendas.regioes.cidades &&
    typeof obj.agendas.regioes.cidades.id === 'string' &&
    typeof obj.agendas.regioes.cidades.nome === 'string'
  );
}

// Função para transformar dados raw da API em AgendamentoCompleto - SLOTMASTER
export function transformAgendamentoFromAPI(raw: AgendamentoRawFromAPI): AgendamentoCompleto {
  if (!isValidAgendamentoRaw(raw)) {
    throw new Error('Dados de agendamento inválidos recebidos da API - estrutura SlotMaster');
  }

  if (!isValidStatusAgendamento(raw.status)) {
    console.warn(`Status de agendamento inválido: ${raw.status}. Usando 'pendente' como fallback.`);
  }

  if (!isValidTipoAgendamento(raw.tipo)) {
    console.warn(`Tipo de agendamento inválido: ${raw.tipo}. Usando 'entrega' como fallback.`);
  }

  return {
    // Propriedades básicas do agendamento
    id: raw.id,
    agenda_id: raw.agenda_id, // CAMPO RESTAURADO
    entregador_id: raw.entregador_id,
    status: isValidStatusAgendamento(raw.status) ? raw.status : 'pendente',
    tipo: isValidTipoAgendamento(raw.tipo) ? raw.tipo : 'entrega',
    data_agendamento: raw.data_agendamento,
    data_cancelamento: raw.data_cancelamento,
    motivo_cancelamento: raw.motivo_cancelamento,
    observacoes: raw.observacoes,
    valor: raw.valor,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    
    // Dados do cliente - CAMPOS SLOTMASTER
    cliente_nome: raw.cliente_nome,
    cliente_telefone: raw.cliente_telefone,
    endereco_coleta: raw.endereco_coleta,
    endereco_entrega: raw.endereco_entrega,
    
    // Propriedades flattened para facilitar acesso nos componentes
    data_agenda: raw.agendas.data_agenda,
    turno_nome: raw.agendas.turnos.nome,
    hora_inicio: raw.agendas.turnos.hora_inicio,
    hora_fim: raw.agendas.turnos.hora_fim,
    regiao_nome: raw.agendas.regioes.nome,
    cidade_nome: raw.agendas.regioes.cidades.nome,
    
    // Campos legados para compatibilidade
    data: raw.agendas.data_agenda,
    
    // Estrutura aninhada completa
    agenda: {
      id: raw.agendas.id,
      data_agenda: raw.agendas.data_agenda,
      vagas_disponiveis: raw.agendas.vagas_disponiveis,
      vagas_ocupadas: raw.agendas.vagas_ocupadas,
      permite_reserva: raw.agendas.permite_reserva,
      created_by: raw.agendas.created_by,
      turno: {
        id: raw.agendas.turnos.id,
        nome: raw.agendas.turnos.nome,
        hora_inicio: raw.agendas.turnos.hora_inicio,
        hora_fim: raw.agendas.turnos.hora_fim,
      },
      regiao: {
        id: raw.agendas.regioes.id,
        nome: raw.agendas.regioes.nome,
        cidade: {
          id: raw.agendas.regioes.cidades.id,
          nome: raw.agendas.regioes.cidades.nome,
        },
      },
    },
  };
}