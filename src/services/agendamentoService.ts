
import { supabase } from "@/integrations/supabase/client";
import { safeStatus } from '@/lib/enumSafety';
import { logger } from '@/lib/logger';

export const buscarTecnico = async (userId: string) => {
  try {
    logger.debug('Buscando dados do tecnico', { userId }, 'AGENDAMENTO');
    
    const { data: tecnicoData, error: tecnicoError } = await supabase
      .from('tecnicos')
      .select('id, estrelas')
      .eq('user_id', userId)
      .eq('status', 'aprovado')
      .single();

    if (tecnicoError || !tecnicoData) {
      logger.warn('Tecnico não encontrado ou não aprovado', { 
        userId, 
        error: tecnicoError?.message 
      }, 'AGENDAMENTO');
      throw new Error('Tecnico não encontrado ou não aprovado');
    }

    logger.info('Tecnico encontrado com sucesso', { 
      tecnicoId: tecnicoData.id,
      estrelas: tecnicoData.estrelas 
    }, 'AGENDAMENTO');
    
    return tecnicoData;
  } catch (error) {
    logger.error('Erro ao buscar tecnico', { userId, error }, 'AGENDAMENTO');
    throw error;
  }
};

export const buscarAgendamentosConflitantes = async (tecnicoId: string, data: string) => {
  try {
    logger.debug('Verificando conflitos de horário - Master Web', { tecnicoId, data }, 'AGENDAMENTO');
    
    const { data: agendamentosExistentes, error: conflitosError } = await supabase
      .from('agendamentos')
      .select(`
        id,
        agenda_id,
        cliente_nome,
        status,
        agendas!inner (
          id,
          data_agenda,
          turnos!inner (
            id,
            nome,
            hora_inicio,
            hora_fim
          ),
          regioes!inner (
            id,
            nome,
            cidades!inner (
              id,
              nome
            )
          )
        )
      `)
      .eq('tecnico_id', tecnicoId)
      .eq('status', safeStatus('agendado'))
      .eq('agendas.data_agenda', data);

    if (conflitosError) {
      logger.error('Erro ao verificar conflitos de horário Master Web', { 
        tecnicoId, 
        data, 
        error: conflitosError.message 
      }, 'AGENDAMENTO');
      throw new Error('Erro ao verificar conflitos de horário');
    }

    const conflitos = agendamentosExistentes || [];
    if (conflitos.length > 0) {
      logger.warn('Conflitos Master Web encontrados', { 
        tecnicoId, 
        data, 
        quantidadeConflitos: conflitos.length,
        conflitos: conflitos.map(c => ({
          id: c.id,
          agenda_id: c.agenda_id,
          cliente: c.cliente_nome,
          turno: c.agendas?.turnos?.nome
        }))
      }, 'AGENDAMENTO');
    }

    return conflitos;
  } catch (error) {
    logger.error('Erro ao buscar agendamentos conflitantes Master Web', { tecnicoId, data, error }, 'AGENDAMENTO');
    throw error;
  }
};

export const buscarEmpresaAgenda = async (agendaId: string) => {
  try {
    logger.debug('Buscando empresa da agenda', { agendaId }, 'AGENDAMENTO');
    
    const { data: empresaData, error: empresaError } = await supabase
      .from('agendas')
      .select('empresa_id')
      .eq('id', agendaId)
      .single();

    if (empresaError || !empresaData?.empresa_id) {
      logger.error('Erro ao buscar dados da empresa', { 
        agendaId, 
        error: empresaError?.message 
      }, 'AGENDAMENTO');
      throw new Error('Erro ao buscar dados da empresa');
    }

    return empresaData.empresa_id;
  } catch (error) {
    logger.error('Erro ao buscar empresa da agenda', { agendaId, error }, 'AGENDAMENTO');
    throw error;
  }
};

export const inserirAgendamento = async (payload: any) => {
  const startTime = Date.now();
  
  try {
    logger.info('Iniciando criação de agendamento', { 
      agendaId: payload.agenda_id,
      tecnicoId: payload.tecnico_id 
    }, 'AGENDAMENTO');
    
    const { data: novoAgendamento, error: insertError } = await supabase
      .from('agendamentos')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      logger.error('Erro ao inserir agendamento', { 
        payload: { ...payload, senha: '[REDACTED]' },
        error: insertError.message 
      }, 'AGENDAMENTO');
      
      // Tratamento específico para diferentes tipos de erro
      if (insertError.message?.includes('AGENDA LOTADA')) {
        throw new Error('🚫 Agenda foi ocupada por outro tecnico. Tente entrar na lista de reserva.');
      } else if (insertError.message?.includes('duplicate key')) {
        throw new Error('❌ Você já possui um agendamento para esta agenda.');
      } else {
        throw new Error('Erro ao criar agendamento: ' + insertError.message);
      }
    }

    const duration = Date.now() - startTime;
    logger.performance('agendamento_criado', duration, {
      agendamentoId: novoAgendamento.id,
      agendaId: payload.agenda_id,
      tecnicoId: payload.tecnico_id
    });

    logger.info('Agendamento criado com sucesso', { 
      agendamentoId: novoAgendamento.id 
    }, 'AGENDAMENTO');

    return novoAgendamento;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.performance('agendamento_failed', duration, {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    
    throw error;
  }
};
