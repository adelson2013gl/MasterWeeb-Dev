
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/lib/logger';

export class ConfiguracoesService {
  static async isAuthReady(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        logger.error('Erro ao verificar sessão', { error });
        return false;
      }
      
      const authUid = session?.user?.id;
      logger.debug('Verificação de autenticação', {
        hasSession: !!session,
        authUid
      });
      
      return !!authUid;
    } catch (error) {
      logger.error('Erro na verificação de auth', { error });
      return false;
    }
  }

  static async loadConfiguracoesFromDB(empresaId: string) {
    logger.debug('Buscando configurações do banco', { empresaId });

    const { data: rawData, error: queryError, count } = await supabase
      .from('configuracoes_empresa')
      .select('*', { count: 'exact' })
      .eq('empresa_id', empresaId);

    logger.debug('Query executada', {
      empresaId,
      error: queryError,
      dataLength: rawData?.length || 0,
      count,
      hasData: !!rawData
    });

    if (queryError) {
      logger.error('Erro na query de configurações', { 
        error: queryError, 
        empresaId,
        errorMessage: queryError.message
      });
      throw queryError;
    }

    return rawData || [];
  }

  static async saveConfiguracoesToDB(empresaId: string, configs: any) {
    const registrosParaUpsert = [
      {
        empresa_id: empresaId,
        chave: 'horarios_configurados',
        valor: 'true',
        tipo: 'boolean' as const,
        categoria: 'horarios',
        descricao: 'Configuração de horários específicos por estrelas',
        horario_liberacao_5_estrelas: configs.horarioLiberacao5Estrelas,
        horario_liberacao_4_estrelas: configs.horarioLiberacao4Estrelas,
        horario_liberacao_3_estrelas: configs.horarioLiberacao3Estrelas,
        horario_liberacao_2_estrelas: configs.horarioLiberacao2Estrelas,
        horario_liberacao_1_estrela: configs.horarioLiberacao1Estrela
      },
      
      { 
        empresa_id: empresaId, 
        chave: 'permitirAgendamentoMesmoDia', 
        valor: String(configs.permitirAgendamentoMesmoDia),
        tipo: 'boolean' as const, 
        categoria: 'agendamento',
        descricao: 'Permite agendamento para o mesmo dia'
      },
      
      { 
        empresa_id: empresaId, 
        chave: 'habilitarPriorizacao', 
        valor: String(configs.habilitarPriorizacaoHorarios),
        tipo: 'boolean' as const, 
        categoria: 'priorizacao',
        descricao: 'Habilitar sistema de horários específicos por estrelas'
      },

      { 
        empresa_id: empresaId, 
        chave: 'limiteAgendamentosDia', 
        valor: String(configs.limiteAgendamentosDia),
        tipo: 'integer' as const, 
        categoria: 'agendamento',
        descricao: 'Limite de agendamentos por dia'
      },
      
      { 
        empresa_id: empresaId, 
        chave: 'permiteCancel', 
        valor: String(configs.permiteCancel),
        tipo: 'boolean' as const, 
        categoria: 'agendamento',
        descricao: 'Permite cancelamento de agendamentos'
      },
      
      { 
        empresa_id: empresaId, 
        chave: 'permiteMultiplosTurnos', 
        valor: String(configs.permiteMultiplosTurnos),
        tipo: 'boolean' as const, 
        categoria: 'agendamento',
        descricao: 'Permite múltiplos turnos no mesmo dia'
      },
      
      { 
        empresa_id: empresaId, 
        chave: 'permiteReagendamento', 
        valor: String(configs.permiteReagendamento),
        tipo: 'boolean' as const, 
        categoria: 'agendamento',
        descricao: 'Permite reagendamento'
      },
      
      { 
        empresa_id: empresaId, 
        chave: 'prazoLimiteCancelamento', 
        valor: String(configs.prazoLimiteCancelamento),
        tipo: 'integer' as const, 
        categoria: 'agendamento',
        descricao: 'Prazo limite para cancelamento em horas'
      },
      
      { 
        empresa_id: empresaId, 
        chave: 'prazoMinimoAgendamento', 
        valor: String(configs.prazoMinimoAgendamento),
        tipo: 'integer' as const, 
        categoria: 'agendamento',
        descricao: 'Prazo mínimo para agendamento em horas'
      }
    ];

    logger.debug(`Preparando ${registrosParaUpsert.length} registros para upsert`, {
      empresaId,
      chaves: registrosParaUpsert.map(r => r.chave)
    });

    const { data: upsertedData, error: upsertError } = await supabase
      .from('configuracoes_empresa')
      .upsert(registrosParaUpsert, {
        onConflict: 'empresa_id,chave',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) {
      logger.error('Erro ao fazer upsert das configurações', { 
        error: upsertError,
        errorMessage: upsertError.message
      });
      throw upsertError;
    }

    return upsertedData;
  }
}
