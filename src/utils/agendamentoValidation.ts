import { supabase } from "@/integrations/supabase/client";
import { safeStatus } from '@/lib/enumSafety';
import { turnoJaIniciou } from "@/lib/utils";
import { logger } from "@/lib/logger";

export const verificarDisponibilidade = async (agendaId: string, entregadorId: string, tipo: 'vaga' | 'reserva') => {
  logger.info('🔍 FASE 1: Verificação de disponibilidade com validação temporal', { agendaId, entregadorId, tipo });

  // 1. BUSCAR DADOS COMPLETOS DA AGENDA
  const { data: agendaData, error: agendaError } = await supabase
    .from('agendas')
    .select(`
      *,
      turnos!agendas_turno_id_fkey(hora_inicio, hora_fim, nome),
      regioes!agendas_regiao_id_fkey(nome, cidades!regioes_cidade_id_fkey(nome))
    `)
    .eq('id', agendaId)
    .eq('ativo', true)
    .single();

  if (agendaError || !agendaData) {
    throw new Error('Agenda não encontrada ou inativa');
  }

  // 🔥 FASE 1: Verificar se turno já iniciou PRIMEIRO
  const turnoIniciado = turnoJaIniciou(agendaData.data_agenda, agendaData.turnos.hora_inicio);
  if (turnoIniciado) {
    logger.warn('🕐 FASE 1: Tentativa de agendamento em turno iniciado', {
      agendaId,
      data: agendaData.data_agenda,
      horaInicio: agendaData.turnos.hora_inicio,
      turno: agendaData.turnos.nome
    });
    throw new Error('Este turno já iniciou e não aceita mais agendamentos');
  }

  // 2. VERIFICAR VAGAS DISPONÍVEIS (agora confiável após correção)
  const vagasLivres = agendaData.vagas_disponiveis - agendaData.vagas_ocupadas;
  
  logger.info('📊 Verificação de vagas (pós-correção)', {
    agendaId,
    vagas_disponiveis: agendaData.vagas_disponiveis,
    vagas_ocupadas: agendaData.vagas_ocupadas,
    vagas_livres: vagasLivres,
    turnoIniciado: false // Já verificado acima
  });

  if (vagasLivres <= 0 && tipo === 'vaga') {
    if (agendaData.permite_reserva) {
      throw new Error('Agenda lotada. Você pode entrar na lista de reserva.');
    } else {
      throw new Error('Agenda lotada e não permite reserva');
    }
  }

  // 3. VERIFICAR AGENDAMENTO EXISTENTE
  const { data: agendamentoExistente, error: checkError } = await supabase
    .from('agendamentos')
    .select('id, tipo, status')
    .eq('agenda_id', agendaId)
    .eq('entregador_id', entregadorId)
    .in('status', [safeStatus('agendado'), safeStatus('pendente')])
    .maybeSingle();

  if (checkError) {
    throw new Error('Erro ao verificar agendamento existente');
  }

  if (agendamentoExistente) {
    const tipoExistente = agendamentoExistente.tipo === 'vaga' ? 'agendamento' : 'entrega';
    throw new Error(`Você já possui um ${tipoExistente} para esta agenda`);
  }

  return agendaData;
};

export const verificarConflitosHorario = (
  inicio1: string, 
  fim1: string, 
  inicio2: string, 
  fim2: string
): boolean => {
  const converterParaMinutos = (hora: string) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const inicio1Min = converterParaMinutos(inicio1);
  const fim1Min = converterParaMinutos(fim1);
  const inicio2Min = converterParaMinutos(inicio2);
  const fim2Min = converterParaMinutos(fim2);

  return !(fim1Min <= inicio2Min || fim2Min <= inicio1Min);
};
