
import { AgendaRaw } from "@/types/agendaDisponivel";
import { logger } from "@/lib/logger";

export const validateAgendaStructure = (agenda: AgendaRaw, entregadorEmpresaId: string): boolean => {
  // Verificar se turnos existe e está ativo
  if (!agenda.turnos || !agenda.turnos.ativo) {
    logger.debug('🚫 Agenda descartada: turno inválido', { 
      agendaId: agenda.id,
      turno: agenda.turnos,
      motivo: 'turno_invalido_ou_inativo'
    });
    return false;
  }

  // Verificar se região existe e está ativa
  if (!agenda.regioes || !agenda.regioes.ativo) {
    logger.debug('🚫 Agenda descartada: região inválida', { 
      agendaId: agenda.id,
      regiao: agenda.regioes,
      motivo: 'regiao_invalida_ou_inativa'
    });
    return false;
  }

  // Verificar se cidade existe
  if (!agenda.regioes.cidades || !agenda.regioes.cidades.nome) {
    logger.debug('🚫 Agenda descartada: cidade inválida', { 
      agendaId: agenda.id,
      cidade: agenda.regioes.cidades,
      motivo: 'cidade_invalida'
    });
    return false;
  }

  // Verificar consistência de empresa_id
  if (agenda.empresa_id !== entregadorEmpresaId) {
    logger.warn('⚠️ INCONSISTÊNCIA DE EMPRESA detectada', {
      agendaId: agenda.id,
      empresaAgenda: agenda.empresa_id,
      empresaEntregador: entregadorEmpresaId,
      motivo: 'empresa_id_inconsistente'
    });
    return false;
  }

  logger.debug('✅ Agenda estruturalmente válida', {
    agendaId: agenda.id,
    data: agenda.data,
    turno: agenda.turnos.nome,
    regiao: agenda.regioes.nome,
    cidade: agenda.regioes.cidades.nome
  });

  return true;
};
