
import { AgendaRaw, AgendaDisponivel } from "@/types/agendaDisponivel";
import { turnoJaIniciou, getDataAtualFormatada } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface ProcessAgendaParams {
  agenda: AgendaRaw;
  agendamentosExistentes: any[];
  contagemRealPorAgenda: { [key: string]: number };
  entregadorData: any;
  configs: any;
  podeVerAgendaPorHorario?: (estrelas: number, dataAgenda: string, horaInicioTurno: string) => { permitido: boolean; motivo: string };
}

export const processAgenda = ({
  agenda,
  agendamentosExistentes,
  contagemRealPorAgenda,
  entregadorData,
  configs,
  podeVerAgendaPorHorario
}: ProcessAgendaParams): AgendaDisponivel => {
  const agendamentoExistente = agendamentosExistentes?.find(ag => ag.agenda_id === agenda.id);
  const jaAgendado = !!agendamentoExistente;
  const tipoAgendamentoExistente = agendamentoExistente?.tipo || null;
  const vagasOcupadasReal = contagemRealPorAgenda[agenda.id] || 0;
  const inconsistenciaDetectada = agenda.vagas_ocupadas !== vagasOcupadasReal;
  
  // USAR SEMPRE O VALOR MAIS RESTRITIVO (maior ocupação)
  const vagasOcupadasSegura = Math.max(agenda.vagas_ocupadas, vagasOcupadasReal);
  const vagasLivres = Math.max(0, agenda.vagas_disponiveis - vagasOcupadasSegura);
  
  // Validação temporal
  const turnoIniciado = turnoJaIniciou(agenda.data_agenda, agenda.turnos.hora_inicio);
  

  if (inconsistenciaDetectada) {
    logger.warn('⚠️ INCONSISTÊNCIA DE VAGAS DETECTADA', {
      agendaId: agenda.id,
      vagasOcupadasSistema: agenda.vagas_ocupadas,
      vagasOcupadasReal: vagasOcupadasReal,
      vagasDisponiveis: agenda.vagas_disponiveis,
      usandoValorSeguro: vagasOcupadasSegura
    });
  }

  
  let podeAgendar = !jaAgendado;
  let motivoBloqueio: string | undefined = undefined;

  // Verificar se turno já iniciou PRIMEIRO
  if (turnoIniciado) {
    podeAgendar = false;
    motivoBloqueio = 'Este turno já iniciou e não aceita mais agendamentos';
  }
  // Verificar horário específico por estrelas ANTES de verificar vagas
  else if (podeVerAgendaPorHorario && configs?.habilitarPriorizacaoHorarios) {
    // Validação adequada: verificar se estrelas é válido antes de processar
    if (entregadorData.estrelas === null || entregadorData.estrelas === undefined) {
      podeAgendar = false;
      motivoBloqueio = 'Dados de estrelas do entregador não disponíveis';
      
      logger.warn('⚠️ BLOQUEIO: Estrelas não definidas', {
        agendaId: agenda.id,
        entregadorId: entregadorData.id,
        entregadorNome: entregadorData.nome
      });
    } else {
      const validacaoHorario = podeVerAgendaPorHorario(entregadorData.estrelas, agenda.data_agenda, agenda.turnos.hora_inicio);
    
      if (!validacaoHorario.permitido) {
        podeAgendar = false;
        motivoBloqueio = validacaoHorario.motivo;
      }
    }
  }
  // Verificar vagas disponíveis usando valor seguro
  else if (vagasLivres <= 0) {
    podeAgendar = false;
    motivoBloqueio = agenda.permite_reserva
      ? 'Agenda lotada. Você pode entrar na lista de reserva.'
      : 'Agenda lotada e não permite reservas';
  }

  // Validação de mesmo dia se não permitido
  if (podeAgendar && !configs?.permitirAgendamentoMesmoDia) {
    const hoje = getDataAtualFormatada();
    if (agenda.data_agenda === hoje) {
      podeAgendar = false;
      motivoBloqueio = 'Agendamentos no mesmo dia não são permitidos';
    }
  }

  return {
    id: agenda.id,
    data: agenda.data_agenda,
    vagas_disponiveis: agenda.vagas_disponiveis,
    vagas_ocupadas: vagasOcupadasSegura,
    vagas_ocupadas_real: vagasOcupadasReal,
    permite_reserva: agenda.permite_reserva,
    inconsistenciaDetectada,
    turnoIniciado,
    turno: {
      id: agenda.turnos.id,
      nome: agenda.turnos.nome,
      hora_inicio: agenda.turnos.hora_inicio,
      hora_fim: agenda.turnos.hora_fim
    },
    regiao: {
      id: agenda.regioes.id,
      nome: agenda.regioes.nome,
      cidade: {
        nome: agenda.regioes.cidades.nome
      }
    },
    podeAgendar,
    motivoBloqueio,
    jaAgendado,
    tipoAgendamentoExistente
  };
};
