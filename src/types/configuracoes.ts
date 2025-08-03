
export interface Cidade {
  id: string;
  nome: string;
}

export interface Regiao {
  id: string;
  nome: string;
  cidade_id: string;
  cidades?: Cidade;
}

export interface Turno {
  id: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
}

export interface Agenda {
  id: string;
  data: string;
  vagas_disponiveis: number;
  vagas_ocupadas: number;
  permite_reserva: boolean;
  turno_id: string;
  regiao_id: string;
  turnos?: Turno;
  regioes?: Regiao;
}

export interface Empresa {
  id: string;
  nome: string;
}

export interface ConfiguracoesEmpresa {
  id: string;
  empresa_id: string;
  habilitar_priorizacao: boolean;
  prioridade_estrelas_5h: number;
  prioridade_estrelas_4h: number;
  prioridade_estrelas_3h: number;
  prioridade_estrelas_2h: number;
  prioridade_estrelas_1h: number;
  permitir_agendamento_mesmo_dia: boolean;
  modo_manutencao: boolean;
  mensagem_manutencao: string;
  limite_dias_antecedencia: number;
  empresa?: Empresa;
}

export interface ConfiguracoesSistema {
  // Sistema antigo por horas de antecedência (fallback)
  habilitarPriorizacao: boolean;
  prioridadeEstrelas5h: number;
  prioridadeEstrelas4h: number;
  prioridadeEstrelas3h: number;
  prioridadeEstrelas2h: number;
  prioridadeEstrelas1h: number;
  
  // NOVO Sistema por horários específicos
  habilitarPriorizacaoHorarios: boolean;
  horarioLiberacao5Estrelas: string;
  horarioLiberacao4Estrelas: string;
  horarioLiberacao3Estrelas: string;
  horarioLiberacao2Estrelas: string;
  horarioLiberacao1Estrela: string;
  
  // Agendamento
  permitirAgendamentoMesmoDia: boolean;
  prazoMinimoAgendamento: number;
  prazoLimiteCancelamento: number;
  limiteAgendamentosDia: number;
  permiteCancel: boolean;
  permiteMultiplosTurnos: boolean;
  permiteReagendamento: boolean;
  
  // Notificações
  emailConfirmacao: boolean;
  emailAprovacao: boolean;
  emailAgendamento: boolean;
  emailCancelamento: boolean;
  emailLembrete: boolean;
  antecedenciaLembrete: number;
  ativarSms: boolean;
  
  // Validação
  validarCpf: boolean;
  confirmarTelefone: boolean;
  aprovacaoAutomatica: boolean;
  multiplosComTelefone: boolean;
  
  // Sistema
  modoManutencao: boolean;
  mensagemManutencao: string;
  limiteDiasAntecedencia: number;
  tempoSessao: number;
  logsDetalhados: boolean;
  backupAutomatico: boolean;
}

export const configuracoesPadrao: ConfiguracoesSistema = {
  // Sistema antigo (fallback)
  habilitarPriorizacao: false,
  prioridadeEstrelas5h: 0,
  prioridadeEstrelas4h: 2,
  prioridadeEstrelas3h: 4,
  prioridadeEstrelas2h: 8,
  prioridadeEstrelas1h: 12,
  
  // NOVO Sistema por horários específicos
  habilitarPriorizacaoHorarios: false,  // PADRÃO: Deve vir do banco configuracoes_empresa
  horarioLiberacao5Estrelas: '08:00',
  horarioLiberacao4Estrelas: '08:45',
  horarioLiberacao3Estrelas: '09:20',
  horarioLiberacao2Estrelas: '10:00',
  horarioLiberacao1Estrela: '10:30',
  
  // Agendamento
  permitirAgendamentoMesmoDia: true,
  prazoMinimoAgendamento: 2,
  prazoLimiteCancelamento: 12,
  limiteAgendamentosDia: 3,
  permiteCancel: true,
  permiteMultiplosTurnos: false,
  permiteReagendamento: true,
  
  // Notificações
  emailConfirmacao: true,
  emailAprovacao: true,
  emailAgendamento: true,
  emailCancelamento: true,
  emailLembrete: true,
  antecedenciaLembrete: 24,
  ativarSms: false,
  
  // Validação
  validarCpf: true,
  confirmarTelefone: false,
  aprovacaoAutomatica: false,
  multiplosComTelefone: false,
  
  // Sistema
  modoManutencao: false,
  mensagemManutencao: 'Sistema em manutenção. Tente novamente mais tarde.',
  limiteDiasAntecedencia: 30,
  tempoSessao: 480,
  logsDetalhados: true,
  backupAutomatico: false,
};
