
// Arquivo separado para garantir conversão segura de enums

export type StatusAgendamento = 'agendado' | 'pendente' | 'em_andamento' | 'concluido' | 'cancelado' | 'nao_compareceu';
export type TipoAgendamento = 'vaga' | 'entrega' | 'reserva' | 'especial'; // Tipos confirmados no banco

/**
 * CORREÇÃO CRÍTICA: Conversão segura para enum de status
 * Resolve o erro "operator does not exist: status_agendamento = text"
 */
export const safeStatus = (status: any): StatusAgendamento => {
  const statusesValidos: StatusAgendamento[] = ['agendado', 'pendente', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu'];
  
  if (!status || typeof status !== 'string') {
    console.warn('⚠️ ENUM SAFETY: Status inválido, usando padrão:', status);
    return 'pendente';
  }

  const statusLimpo = status.trim().toLowerCase() as StatusAgendamento;
  
  if (statusesValidos.includes(statusLimpo)) {
    return statusLimpo;
  }

  console.warn('⚠️ ENUM SAFETY: Status não encontrado, usando padrão:', status);
  return 'pendente';
};

/**
 * CORREÇÃO CRÍTICA: Conversão segura para enum de tipo
 */
export const safeTipo = (tipo: any): TipoAgendamento => {
  const tiposValidos: TipoAgendamento[] = ['vaga', 'entrega', 'reserva', 'especial'];
  
  if (!tipo || typeof tipo !== 'string') {
    console.warn('⚠️ ENUM SAFETY: Tipo inválido, usando padrão:', tipo);
    return 'entrega';
  }

  const tipoLimpo = tipo.trim().toLowerCase() as TipoAgendamento;
  
  if (tiposValidos.includes(tipoLimpo)) {
    return tipoLimpo;
  }

  console.warn('⚠️ ENUM SAFETY: Tipo não encontrado, usando padrão:', tipo);
  return 'entrega';
};
