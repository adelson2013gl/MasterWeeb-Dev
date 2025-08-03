
export interface Agenda {
  id: string;
  data_agenda: string;
  vagas_disponiveis: number;
  vagas_ocupadas: number;
  ativo: boolean;
  permite_reserva: boolean;  // ADICIONADO: nova coluna do banco
  created_by?: string;  // ADICIONADO: referência ao entregador que criou
  turno_id: string;
  regiao_id: string;
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
      id: string;
      nome: string;
    };
  };
  // Para compatibilidade com componentes que usam nomes diferentes
  turnos: {
    id: string;
    nome: string;
    hora_inicio: string;
    hora_fim: string;
  };
  regioes: {
    nome: string;
    cidades: {
      nome: string;
    };
  };
  agendamentos?: Array<{
    id: string;
    status: string;
    tipo: 'vaga' | 'reserva';
    entregador?: {
      id: string;
      nome: string;
      telefone: string;
      email: string;
    };
  }>;
}

export interface FormCriacaoAgenda {
  data_agenda: Date;
  turno_ids: string[];
  regiao_id: string;
  vagas_disponiveis: number;
  permite_reserva?: boolean;  // ADICIONADO: nova coluna
  created_by?: string;  // ADICIONADO: quem está criando
}

export interface FormEdicaoAgenda {
  vagas_disponiveis: number;
  permite_reserva?: boolean;  // ADICIONADO: nova coluna
  turno_id: string;
  regiao_id: string;
}
