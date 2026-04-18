
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getDataAtualFormatada } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { safeStatus } from "@/lib/enumSafety";

export function useEntregadorData() {
  const { user } = useAuth();
  const [entregador, setEntregador] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntregadorData = async () => {
    if (!user?.id) return;

    try {
      logger.info('🔍 Buscando dados do entregador com validação estrutural', { userId: user.id });

      // Buscar dados do entregador INCLUINDO ESTRELAS
      const { data: entregadorData, error: entregadorError } = await supabase
        .from('tecnicos')
        .select(`
          *,
          cidades (
            nome, 
            estado
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (entregadorError) {
        logger.error('❌ Erro ao buscar entregador', { error: entregadorError });
      } else {
        logger.info('✅ Dados do entregador carregados', { 
          entregadorId: entregadorData.id,
          estrelas: entregadorData.estrelas,
          status: entregadorData.status,
          empresaId: entregadorData.empresa_id
        });
        
        // Validação adequada: verificar se estrelas é um número válido
        if (entregadorData.estrelas === null || entregadorData.estrelas === undefined) {
          logger.warn('⚠️ Entregador sem estrelas definidas', {
            entregadorId: entregadorData.id,
            nome: entregadorData.nome
          });
        }
        
        setEntregador({
          ...entregadorData,
          cidade: entregadorData.cidades,
          estrelas: entregadorData.estrelas
        });
      }

      if (!entregadorData?.id) {
        logger.warn('⚠️ Entregador não encontrado, não buscando agendamentos');
        setLoading(false);
        return;
      }

      // Buscar agendamentos ATIVOS com validação aprimorada
      const dataAtual = getDataAtualFormatada();
      logger.info('📅 Buscando agendamentos com validação estrutural', { 
        entregadorId: entregadorData.id,
        dataAtual 
      });
      
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          *,
          agendas!inner (
            id,
            data_agenda,
            ativo,
            vagas_disponiveis,
            vagas_ocupadas,
            turnos!inner (
              nome, 
              hora_inicio, 
              hora_fim,
              ativo
            ),
            regioes!inner (
              nome,
              ativo,
              cidades!inner (
                nome
              )
            )
          )
        `)
        .eq('tecnico_id', entregadorData.id)
        .eq('status', safeStatus('agendado'))
        .eq('agendas.ativo', true)
        .eq('agendas.turnos.ativo', true)
        .eq('agendas.regioes.ativo', true)
        .gte('agendas.data_agenda', dataAtual)
        .order('created_at', { ascending: false });

      if (agendamentosError) {
        logger.error('❌ Erro ao buscar agendamentos', { error: agendamentosError });
        setAgendamentos([]);
      } else {
        logger.info('✅ Query estrutural de agendamentos executada', { 
          totalEncontrados: agendamentosData?.length || 0 
        });
        
        // Processar agendamentos com validação estrutural
        const agendamentosValidados = agendamentosData?.filter(ag => {
          if (!ag.agendas) {
            logger.debug('🚫 Agendamento descartado: sem agenda associada', { 
              agendamentoId: ag.id,
              motivo: 'agenda_nula'
            });
            return false;
          }
          
          if (!ag.agendas.ativo) {
            logger.debug('🚫 Agendamento descartado: agenda inativa', { 
              agendamentoId: ag.id,
              agendaId: ag.agendas.id,
              motivo: 'agenda_inativa'
            });
            return false;
          }

          if (!ag.agendas.turnos || !ag.agendas.turnos.ativo) {
            logger.debug('🚫 Agendamento descartado: turno inativo', { 
              agendamentoId: ag.id,
              motivo: 'turno_inativo'
            });
            return false;
          }

          if (!ag.agendas.regioes || !ag.agendas.regioes.ativo) {
            logger.debug('🚫 Agendamento descartado: região inativa', { 
              agendamentoId: ag.id,
              motivo: 'regiao_inativa'
            });
            return false;
          }
          
          const dataAgenda = ag.agendas.data_agenda;
          const isDataFutura = dataAgenda >= dataAtual;
          
          if (!isDataFutura) {
            logger.debug('🚫 Agendamento descartado: data passada', {
              agendamentoId: ag.id,
              dataAgenda,
              dataAtual,
              motivo: 'data_passada'
            });
            return false;
          }
          
          logger.debug('✅ Agendamento validado', {
            agendamentoId: ag.id,
            dataAgenda,
            turno: ag.agendas.turnos.nome,
            regiao: ag.agendas.regioes.nome
          });
          
          return true;
        }) || [];
        
        // Ordenar por data da agenda
        agendamentosValidados.sort((a, b) => {
          const dataA = new Date(a.agendas.data_agenda);
          const dataB = new Date(b.agendas.data_agenda);
          return dataA.getTime() - dataB.getTime();
        });
        
        // Limitar aos próximos 5 agendamentos
        const proximosAgendamentos = agendamentosValidados.slice(0, 5);
        
        logger.info('📋 Agendamentos processados com validação estrutural', {
          totalOriginais: agendamentosData?.length || 0,
          totalValidados: agendamentosValidados.length,
          proximosLimitados: proximosAgendamentos.length,
          estrelas: entregadorData.estrelas,
          descartados: {
            agendaNula: agendamentosData?.filter(ag => !ag.agendas).length || 0,
            agendaInativa: agendamentosData?.filter(ag => ag.agendas && !ag.agendas.ativo).length || 0,
            turnoInativo: agendamentosData?.filter(ag => ag.agendas && ag.agendas.ativo && (!ag.agendas.turnos || !ag.agendas.turnos.ativo)).length || 0,
            regiaoInativa: agendamentosData?.filter(ag => ag.agendas && ag.agendas.ativo && ag.agendas.turnos && ag.agendas.turnos.ativo && (!ag.agendas.regioes || !ag.agendas.regioes.ativo)).length || 0
          }
        });
        
        setAgendamentos(proximosAgendamentos);
      }

    } catch (error) {
      logger.error('💥 Erro inesperado na validação estrutural do entregador', { error });
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntregadorData();
  }, [user?.id]);

  return { entregador, agendamentos, loading, refetch: fetchEntregadorData };
}
