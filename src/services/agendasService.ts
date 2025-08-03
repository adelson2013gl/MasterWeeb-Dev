
import { supabase } from "@/integrations/supabase/client";
import { getDataAtualFormatada } from "@/lib/utils";
import { safeStatus } from "@/lib/enumSafety";
import { AgendaRaw } from "@/types/agendaDisponivel";
import { logger } from '@/lib/logger';

export const fetchEntregadorData = async (userId: string) => {
  try {
    logger.debug('Buscando dados do entregador para agendas', { userId }, 'AGENDAS');
    
    const { data: entregadorData, error: entregadorError } = await supabase
      .from('entregadores')
      .select('id, estrelas, empresa_id, status, nome')
      .eq('user_id', userId)
      .eq('status', 'aprovado')
      .single();

    if (entregadorError || !entregadorData) {
      logger.warn('Entregador não encontrado ou não aprovado para agendamentos', { 
        userId, 
        error: entregadorError?.message 
      }, 'AGENDAS');
      throw new Error('Entregador não encontrado ou não aprovado para agendamentos');
    }

    logger.info('Dados do entregador carregados', { 
      entregadorId: entregadorData.id,
      nome: entregadorData.nome,
      estrelas: entregadorData.estrelas,
      empresaId: entregadorData.empresa_id 
    }, 'AGENDAS');

    return entregadorData;
  } catch (error) {
    logger.error('Erro ao buscar dados do entregador', { userId, error }, 'AGENDAS');
    throw error;
  }
};

export const fetchAgendasRaw = async (empresaId: string): Promise<AgendaRaw[]> => {
  const startTime = Date.now();
  
  try {
    const dataAtual = getDataAtualFormatada();
    
    logger.debug('Buscando agendas disponíveis', { 
      empresaId, 
      dataAtual 
    }, 'AGENDAS');
    
    const { data: agendasData, error: agendasError } = await supabase
      .from('agendas')
      .select(`
        id,
        data_agenda,
        vagas_disponiveis,
        vagas_ocupadas,
        empresa_id,
        ativo,
        permite_reserva,
        created_by,
        turnos (
          id,
          nome,
          hora_inicio,
          hora_fim,
          ativo
        ),
        regioes (
          id,
          nome,
          ativo,
          cidades (
            nome
          )
        )
      `)
      .eq('ativo', true)
      .eq('empresa_id', empresaId)
      .gte('data_agenda', dataAtual)
      .order('data_agenda', { ascending: true });

    if (agendasError) {
      logger.error('Erro ao carregar agendas disponíveis', { 
        empresaId, 
        dataAtual, 
        error: agendasError.message 
      }, 'AGENDAS');
      throw new Error('Erro ao carregar agendas disponíveis');
    }

    const agendas = agendasData || [];
    const duration = Date.now() - startTime;
    
    logger.performance('agendas_fetch', duration, {
      empresaId,
      totalAgendas: agendas.length,
      dataAtual
    });

    logger.info('Agendas carregadas com sucesso', { 
      empresaId, 
      totalAgendas: agendas.length,
      dataInicio: dataAtual 
    }, 'AGENDAS');

    return agendas;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.performance('agendas_fetch_failed', duration, { 
      empresaId, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
    
    throw error;
  }
};

export const fetchContagemAgendamentos = async (agendasIds: string[]) => {
  if (agendasIds.length === 0) return {};

  try {
    logger.debug('Contando agendamentos reais', { 
      totalAgendas: agendasIds.length 
    }, 'AGENDAS');

    const { data: contagemReal, error: contagemError } = await supabase
      .from('agendamentos')
      .select('agenda_id')
      .in('agenda_id', agendasIds)
      .eq('status', safeStatus('agendado'));

    if (contagemError) {
      logger.error('Erro ao contar agendamentos reais', { 
        agendasIds: agendasIds.slice(0, 5), // Apenas os primeiros 5 para evitar logs grandes
        error: contagemError.message 
      }, 'AGENDAS');
      throw new Error('Erro ao contar agendamentos reais');
    }

    const contagem = (contagemReal || []).reduce((acc, item) => {
      acc[item.agenda_id] = (acc[item.agenda_id] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    logger.debug('Contagem de agendamentos concluída', { 
      totalContados: Object.keys(contagem).length,
      totalAgendamentos: Object.values(contagem).reduce((a, b) => a + b, 0)
    }, 'AGENDAS');

    return contagem;
  } catch (error) {
    logger.error('Erro ao buscar contagem de agendamentos', { agendasIds: agendasIds.length, error }, 'AGENDAS');
    throw error;
  }
};

export const fetchAgendamentosExistentes = async (entregadorId: string, dataAtual: string) => {
  try {
    logger.debug('Buscando agendamentos existentes do entregador', { 
      entregadorId, 
      dataAtual 
    }, 'AGENDAS');

    const { data: agendamentosExistentes, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('agenda_id, status, tipo')
      .eq('entregador_id', entregadorId)
      .in('status', [safeStatus('agendado'), safeStatus('pendente'), safeStatus('em_andamento')])
      .gte('data_agendamento', dataAtual);

    if (agendamentosError) {
      logger.error('Erro ao buscar agendamentos existentes', { 
        entregadorId, 
        dataAtual, 
        error: agendamentosError.message 
      }, 'AGENDAS');
      throw new Error('Erro ao buscar agendamentos existentes');
    }

    const agendamentos = agendamentosExistentes || [];
    
    logger.info('Agendamentos existentes carregados', { 
      entregadorId, 
      totalAgendamentos: agendamentos.length 
    }, 'AGENDAS');

    return agendamentos;
  } catch (error) {
    logger.error('Erro ao buscar agendamentos existentes', { entregadorId, dataAtual, error }, 'AGENDAS');
    throw error;
  }
};
