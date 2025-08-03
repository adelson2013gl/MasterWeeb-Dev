import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguracoesSistema } from "@/hooks/useConfiguracoesSistema";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { TipoAgendamento, CriarAgendamentoPayload, StatusAgendamento } from "@/types/agendamento";
import { AgendamentoCompleto, transformAgendamentoFromAPI, isValidAgendamentoRaw } from "@/types/agendamento.types";
import { safeStatus, safeTipo } from '@/lib/enumSafety';
import { verificarDisponibilidade, verificarConflitosHorario } from "@/utils/agendamentoValidation";
import { 
  buscarEntregador, 
  buscarAgendamentosConflitantes, 
  buscarEmpresaAgenda, 
  inserirAgendamento 
} from "@/services/agendamentoService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Interface para filtros de agendamento
export interface FiltrosAgendamento {
  data?: string;
  status?: StatusAgendamento;
  tipo?: TipoAgendamento;
  turno?: string;
  regiao?: string;
}

export function useAgendamento() {
  const { user } = useAuth();
  const { configs, isAgendamentoPermitido } = useConfiguracoesSistema();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Buscar todos os agendamentos do usuário
  const { data: agendamentosRaw, isLoading: isLoadingAgendamentos, error: erroListagem } = useQuery({
    queryKey: ['agendamentos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: entregador } = await supabase
        .from('entregadores')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!entregador) return [];

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
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
        .eq('entregador_id', entregador.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erro ao buscar agendamentos', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Transformar e validar agendamentos
  const agendamentos = useMemo(() => {
    if (!agendamentosRaw) return [];
    
    return agendamentosRaw
      .filter(isValidAgendamentoRaw)
      .map(transformAgendamentoFromAPI);
  }, [agendamentosRaw]);

  // Função para filtrar agendamentos
  const filtrarAgendamentos = (filtros: FiltrosAgendamento): AgendamentoCompleto[] => {
    if (!agendamentos) return [];
    
    return agendamentos.filter((ag) => {
      const passaFiltroData = !filtros.data || ag.data_agenda === filtros.data;
      const passaFiltroStatus = !filtros.status || ag.status === filtros.status;
      const passaFiltroTipo = !filtros.tipo || ag.tipo === filtros.tipo;
      const passaFiltroTurno = !filtros.turno || ag.turno_nome === filtros.turno;
      const passaFiltroRegiao = !filtros.regiao || ag.regiao_nome === filtros.regiao;
      
      return passaFiltroData && passaFiltroStatus && passaFiltroTipo && passaFiltroTurno && passaFiltroRegiao;
    });
  };

  // Mutation para criar agendamento
  const criarAgendamentoMutation = useMutation({
    mutationFn: async ({ agendaId, tipo = 'vaga' }: { agendaId: string; tipo?: TipoAgendamento }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (configs?.modoManutencao) {
        throw new Error('Sistema em manutenção. Agendamentos temporariamente suspensos.');
      }

      const startTime = Date.now();

      try {
        logger.info('🚀 FASE 1: INICIANDO AGENDAMENTO com validação temporal', { 
          agendaId, 
          tipo, 
          userId: user.id
        });

        // 1. Buscar o entregador
        const entregadorData = await buscarEntregador(user.id);

        // 2. FASE 1: VERIFICAÇÃO COM VALIDAÇÃO TEMPORAL
        const agendaData = await verificarDisponibilidade(agendaId, entregadorData.id, tipo);

        // 3. Validações do sistema
        const validacao = isAgendamentoPermitido(agendaData.data_agenda, agendaData.turnos.hora_inicio);
        if (!validacao.permitido) {
          logger.warn('⚠️ Agendamento não permitido', { motivo: validacao.motivo });
          throw new Error(validacao.motivo);
        }

        // 4. Verificar conflitos de horário
        const agendamentosExistentes = await buscarAgendamentosConflitantes(entregadorData.id, agendaData.data_agenda);

        // 5. Verificar sobreposição de horários
        if (agendamentosExistentes && agendamentosExistentes.length > 0) {
          for (const agendamentoExistente of agendamentosExistentes) {
            const agendaExistente = agendamentoExistente.agendas;
            
            if (agendaExistente && verificarConflitosHorario(
              agendaData.turnos.hora_inicio, 
              agendaData.turnos.hora_fim, 
              agendaExistente.turnos.hora_inicio, 
              agendaExistente.turnos.hora_fim
            )) {
              throw new Error(
                `Conflito de horário! Você já está agendado no ${agendaExistente.turnos.nome} ` +
                `(${agendaExistente.turnos.hora_inicio}-${agendaExistente.turnos.hora_fim}) ` +
                `na região ${agendaExistente.regioes.nome}.`
              );
            }
          }
        }

        // 6. Buscar empresa_id
        const empresaId = await buscarEmpresaAgenda(agendaId);

        // 7. PREPARAR PAYLOAD FINAL
        const tipoValidado = safeTipo(tipo);
        const statusCalculado = 'pendente'; // Usar 'pendente' conforme constraint do banco
        const statusValidado = safeStatus(statusCalculado);
        
        const payloadFinal: CriarAgendamentoPayload = {
          agenda_id: agendaId,
          entregador_id: entregadorData.id,
          empresa_id: empresaId,
          tipo: tipoValidado,
          status: statusValidado,
          data_agendamento: new Date().toISOString(),
          observacoes: tipoValidado === 'entrega' ? 'Agendamento de entrega - processamento normal' : null,
          // Campos obrigatórios do SlotMaster com valores padrão
          cliente_nome: 'Agendamento Simples',
          cliente_telefone: '(00) 00000-0000',
          endereco_coleta: 'Não se aplica',
          endereco_entrega: 'Não se aplica'
        };

        logger.info('🎯 FASE 1: INSERÇÃO com validação temporal', { payloadFinal });

        // 8. INSERÇÃO FINAL (agora confiável com trigger corrigido)
        const novoAgendamento = await inserirAgendamento(payloadFinal);

        // 9. SUCESSO
        const duration = Date.now() - startTime;
        logger.performance('agendamento_criado_fase1', duration, {
          agendaId,
          entregadorId: entregadorData.id,
          tipo: tipoValidado,
          agendamentoId: novoAgendamento.id,
          validacaoTemporal: true
        });

        const mensagemSucesso = '✅ Agendamento confirmado! Você tem uma vaga garantida neste turno.';
        
        logger.info('🎉 FASE 1: AGENDAMENTO CRIADO COM SUCESSO', {
          agendamentoId: novoAgendamento.id,
          tipo: tipoValidado,
          duration: `${duration}ms`,
          validacaoTemporal: true
        });
        
        return { novoAgendamento, mensagem: mensagemSucesso };

      } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error('💥 ERRO NO AGENDAMENTO FASE 1', { 
          error: error.message, 
          agendaId, 
          tipo,
          duration: `${duration}ms`
        });
        
        throw error;
      }
    },
    onSuccess: ({ mensagem }) => {
      toast.success(mensagem);
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro inesperado ao criar agendamento');
    }
  });

  // Mutation para cancelar agendamento
  const cancelarAgendamentoMutation = useMutation({
    mutationFn: async (agendamentoId: string) => {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status: 'cancelado',
          data_cancelamento: new Date().toISOString()
        })
        .eq('id', agendamentoId);

      if (error) {
        logger.error('Erro ao cancelar agendamento', error);
        throw new Error('Erro ao cancelar agendamento');
      }
    },
    onSuccess: () => {
      toast.success('Agendamento cancelado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cancelar agendamento');
    }
  });

  // Função wrapper para manter compatibilidade
  const criarAgendamento = async (agendaId: string, tipo: TipoAgendamento = 'vaga') => {
    setLoading(true);
    try {
      await criarAgendamentoMutation.mutateAsync({ agendaId, tipo });
      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    // Dados
    agendamentos,
    isLoadingAgendamentos,
    
    // Funções
    criarAgendamento,
    filtrarAgendamentos,
    cancelarAgendamento: cancelarAgendamentoMutation.mutate,
    
    // Estados
    loading: loading || criarAgendamentoMutation.isPending || cancelarAgendamentoMutation.isPending,
    
    // Erros
    erros: {
      listagem: erroListagem,
      criacao: criarAgendamentoMutation.error,
      cancelamento: cancelarAgendamentoMutation.error
    }
  };
}
