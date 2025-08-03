import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguracoesSistema } from "@/hooks/useConfiguracoesSistema";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { toast } from "sonner";
import { addItem, addToSyncQueue, STORES } from "@/lib/indexedDB";
import { safeStatus } from "@/lib/enumSafety";

export function useAgendamentoOffline() {
  const { user } = useAuth();
  const { configs } = useConfiguracoesSistema();
  const { isOnline } = useOnlineStatus();
  const [loading, setLoading] = useState(false);

  /**
   * Função para verificar se dois horários se sobrepõem
   */
  const horariosSesobrepoe = (inicio1: string, fim1: string, inicio2: string, fim2: string): boolean => {
    // Converter horários para minutos para facilitar comparação
    const converterParaMinutos = (hora: string) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const inicio1Min = converterParaMinutos(inicio1);
    const fim1Min = converterParaMinutos(fim1);
    const inicio2Min = converterParaMinutos(inicio2);
    const fim2Min = converterParaMinutos(fim2);

    // Verificar sobreposição
    return (inicio1Min < fim2Min && fim1Min > inicio2Min);
  };

  /**
   * Função para criar um novo agendamento
   */
  const criarAgendamento = async (agendaId: string, data: string, entregadorId: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }

    setLoading(true);

    try {
      // Verificar se o agendamento é permitido pelas configurações do sistema
      if (configs?.modoManutencao) {
        toast.error('Sistema em manutenção. Agendamentos temporariamente suspensos.');
        return { success: false, error: 'Sistema em manutenção' };
      }

      // Se estiver online, usar o Supabase normalmente
      if (isOnline) {
        // Verificar se a agenda existe e tem vagas
        const { data: agenda, error: agendaError } = await supabase
          .from('agendas')
          .select(`
            id, 
            vagas_disponiveis, 
            vagas_ocupadas, 
            data,
            turnos!agendas_turno_id_fkey (
              id, 
              hora_inicio, 
              hora_fim
            )
          `)
          .eq('id', agendaId)
          .single();

        if (agendaError || !agenda) {
          console.error('Erro ao buscar agenda:', agendaError);
          toast.error('Erro ao buscar informações da agenda');
          return { success: false, error: agendaError?.message };
        }

        if (agenda.vagas_ocupadas >= agenda.vagas_disponiveis) {
          toast.error('Não há mais vagas disponíveis para esta agenda');
          return { success: false, error: 'Sem vagas disponíveis' };
        }

        // Verificar se o entregador já tem agendamento para o mesmo dia/horário
        const { data: agendamentosExistentes, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select(`
            id,
            agendas!agendamentos_agenda_id_fkey (
              id,
              data,
              turnos!agendas_turno_id_fkey (
                id,
                hora_inicio,
                hora_fim
              )
            )
          `)
          .eq('entregador_id', entregadorId)
          .eq('status', safeStatus('agendado'))
          .neq('agendas.data_agenda', data);

        if (agendamentosError) {
          console.error('Erro ao verificar agendamentos existentes:', agendamentosError);
          toast.error('Erro ao verificar seus agendamentos existentes');
          return { success: false, error: agendamentosError?.message };
        }

        // Verificar sobreposição de horários
        for (const agendamento of agendamentosExistentes || []) {
          if (agendamento.agendas.data_agenda === data && 
              horariosSesobrepoe(
                agendamento.agendas.turnos.hora_inicio, 
                agendamento.agendas.turnos.hora_fim,
                agenda.turnos.hora_inicio,
                agenda.turnos.hora_fim
              )) {
            toast.error('Você já possui um agendamento para este horário');
            return { success: false, error: 'Conflito de horário' };
          }
        }

        // Criar o agendamento
        const { data: novoAgendamento, error: agendamentoError } = await supabase
          .from('agendamentos')
          .insert({
            agenda_id: agendaId,
            entregador_id: entregadorId,
            data_agendamento: data,
            status: 'agendado',
            tipo: 'vaga'
          })
          .select()
          .single();

        if (agendamentoError) {
          console.error('Erro ao criar agendamento:', agendamentoError);
          toast.error('Erro ao criar agendamento');
          return { success: false, error: agendamentoError?.message };
        }

        toast.success('Agendamento realizado com sucesso!');
        return { success: true, data: novoAgendamento };
      } 
      // Se estiver offline, salvar no IndexedDB para sincronização posterior
      else {
        const offlineAgendamento = {
          id: `offline_${Date.now()}`,
          agenda_id: agendaId,
          entregador_id: entregadorId,
          data_agendamento: data,
          status: 'agendado',
          tipo: 'vaga',
          created_at: new Date().toISOString(),
          offline: true
        };

        // Salvar no IndexedDB
        await addItem(STORES.AGENDAMENTOS, offlineAgendamento);
        
        // Adicionar à fila de sincronização
        await addToSyncQueue('agendamentos', 'create', offlineAgendamento);

        toast.success('Agendamento salvo offline. Será sincronizado quando houver conexão.');
        return { success: true, data: offlineAgendamento, offline: true };
      }
    } catch (error) {
      console.error('Erro ao processar agendamento:', error);
      toast.error('Erro ao processar seu agendamento');
      return { success: false, error: String(error) };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    criarAgendamento
  };
}
