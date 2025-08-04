
export interface Agendamento {
  id: number;
  data: string;
  turno: string;
  horario: string;
  regiao: string;
  tipo: "vaga" | "reserva";
  status: "agendado" | "cancelado" | "concluido" | "pendente" | "confirmada";
  dataAgendamento: string;
  dataCancelamento?: string;
  observacoes: string;
}

// Tipos específicos para garantir valores válidos
export type StatusAgendamento = "agendado" | "cancelado" | "concluido" | "pendente" | "confirmada";
export type TipoAgendamento = "vaga" | "entrega" | "reserva" | "especial";

// Interface para criação de agendamento
export interface CriarAgendamentoPayload {
  agenda_id: string;
  entregador_id: string;
  empresa_id: string;
  tipo: TipoAgendamento;
  status: StatusAgendamento;
  data_agendamento: string;
  observacoes?: string | null;
  // Campos obrigatórios do Master Web (NOT NULL no banco)
  cliente_nome?: string;
  cliente_telefone?: string;
  endereco_coleta?: string;
  endereco_entrega?: string;
}
