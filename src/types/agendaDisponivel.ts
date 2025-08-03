
export interface AgendaDisponivel {
  id: string;
  data_agenda: string;
  vagas_disponiveis: number;
  vagas_ocupadas: number;
  vagas_ocupadas_real: number;
  permite_reserva: boolean;  // ADICIONADO: nova coluna do banco
  created_by?: string;  // ADICIONADO: referência ao criador
  turno: {
    id: string;
    nome: string;
    hora_inicio: string;
    hora_fim: string;
  };
  regiao: {
    id: string;
    nome: string;
    cidade: {
      nome: string;
    };
  };
  podeAgendar: boolean;
  motivoBloqueio?: string;
  jaAgendado: boolean;
  inconsistenciaDetectada: boolean;
  turnoIniciado: boolean;
  tipoAgendamentoExistente?: 'vaga' | 'entrega' | 'especial' | null;
}

export interface AgendaRaw {
  id: string;
  data_agenda: string;
  vagas_disponiveis: number;
  vagas_ocupadas: number;
  permite_reserva: boolean;  // ADICIONADO: nova coluna do banco
  created_by?: string;  // ADICIONADO: referência ao criador
  empresa_id: string;
  ativo: boolean;
  turnos: {
    id: string;
    nome: string;
    hora_inicio: string;
    hora_fim: string;
    ativo: boolean;
  };
  regioes: {
    id: string;
    nome: string;
    ativo: boolean;
    cidades: {
      nome: string;
    };
  };
}
