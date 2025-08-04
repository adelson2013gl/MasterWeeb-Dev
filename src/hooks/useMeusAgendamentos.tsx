import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { safeStatus } from "@/lib/enumSafety";
import { turnoJaTerminou } from "@/lib/utils";
import { 
  AgendamentoCompleto, 
  AgendamentoRawFromAPI, 
  transformAgendamentoFromAPI,
  isValidAgendamentoRaw 
} from '@/types/agendamento.types';

// Usando a interface mais rigorosa do arquivo de tipos
export type AgendamentoReal = AgendamentoCompleto;

export function useMeusAgendamentos() {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoReal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgendamentos = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      console.log('Buscando todos os agendamentos do entregador...');
      // CORRIGIDO: status do entregador precisa ser 'aprovado' literal, não enum agendamento
      const { data: entregadorData, error: entregadorError } = await supabase
        .from('entregadores')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'aprovado')
        .single();

      if (entregadorError || !entregadorData) {
        console.error('Erro ao buscar entregador:', entregadorError);
        setLoading(false);
        return;
      }

      // BUSCA AGENDAMENTOS COM JOIN - ESTRUTURA SLOTMASTER RESTAURADA
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          agenda_id,
          entregador_id,
          status,
          tipo,
          data_agendamento,
          data_cancelamento,
          observacoes,
          valor,
          created_at,
          updated_at,
          cliente_nome,
          cliente_telefone,
          endereco_coleta,
          endereco_entrega,
          agendas!inner(
            id,
            data_agenda,
            vagas_disponiveis,
            vagas_ocupadas,
            permite_reserva,
            turnos!inner(
              id,
              nome,
              hora_inicio,
              hora_fim
            ),
            regioes!inner(
              id,
              nome,
              cidades!inner(
                id,
                nome
              )
            )
          )
        `)
        .eq('entregador_id', entregadorData.id)
        .order('data_agendamento', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast.error('Erro ao carregar agendamentos');
        return;
      }

      console.log('Agendamentos encontrados com estrutura Master Web:', data);

      // Transformar os dados usando a função de transformação com validação
      const agendamentosFormatted = data?.filter(agendamento => {
        if (!agendamento.agendas) {
          console.warn('Agendamento sem agenda associada (JOIN falhou):', agendamento.id);
          return false;
        }
        
        // Campos obrigatórios básicos - não exigir dados de cliente para agendamentos simples
        if (!agendamento.id || !agendamento.agenda_id) {
          console.warn('Agendamento sem ID ou agenda_id:', agendamento.id);
          return false;
        }
        
        // Validação mais flexível - não usar isValidAgendamentoRaw para agendamentos simples
        return true;
      })
        .map(agendamento => {
          try {
            return transformAgendamentoFromAPI(agendamento as AgendamentoRawFromAPI);
          } catch (error) {
            console.error('Erro ao transformar agendamento Master Web:', error);
            return null;
          }
        })
        .filter((agendamento): agendamento is AgendamentoCompleto => agendamento !== null) || [];

      console.log('Agendamentos Master Web formatados:', agendamentosFormatted);
      
      // Log específico para estrutura Master Web
      agendamentosFormatted.forEach(agendamento => {
        console.log(`Master Web Agendamento ${agendamento.id}:`, {
          agenda_id: agendamento.agenda_id,
          cliente_nome: agendamento.cliente_nome,
          data_agenda: agendamento.data_agenda,
          turno_nome: agendamento.turno_nome,
          status: agendamento.status,
          endereco_coleta: agendamento.endereco_coleta,
          endereco_entrega: agendamento.endereco_entrega
        });
      });
      
      setAgendamentos(agendamentosFormatted);
    } catch (error) {
      console.error('Erro inesperado ao buscar agendamentos:', error);
      toast.error('Erro inesperado ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const cancelarAgendamento = async (agendamentoId: string) => {
    try {
      console.log('Cancelando agendamento:', agendamentoId);
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status: safeStatus('cancelado'),
          data_cancelamento: new Date().toISOString(),
          observacoes: 'Cancelado pelo entregador'
        })
        .eq('id', agendamentoId);
      if (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast.error('Erro ao cancelar agendamento');
        return false;
      }

      toast.success('Agendamento cancelado com sucesso!');
      await fetchAgendamentos(); // Recarregar dados
      return true;
    } catch (error) {
      console.error('Erro inesperado ao cancelar agendamento:', error);
      toast.error('Erro inesperado ao cancelar agendamento');
      return false;
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [user?.id]);

  // Função para verificar se um agendamento é futuro
  const isAgendamentoFuturo = (agendamento: AgendamentoReal): boolean => {
    const agora = new Date();
    const dataHoraAgendamento = new Date(`${agendamento.data}T${agendamento.agenda.turno.hora_fim}`);
    return dataHoraAgendamento > agora;
  };

  // Função para verificar se um turno ainda está ativo (não terminou)
  const isTurnoAtivo = (agendamento: AgendamentoReal): boolean => {
    // Usar a função turnoJaTerminou que já existe no sistema
    const jaTerminou = turnoJaTerminou(
      agendamento.data_agenda, 
      agendamento.hora_fim
    );
    
    console.log(`Verificando turno ${agendamento.turno_nome} em ${agendamento.data_agenda}:`, {
      horaFim: agendamento.hora_fim,
      jaTerminou,
      status: agendamento.status
    });
    
    return !jaTerminou;
  };

  // Separar agendamentos considerando data/hora atual E se o turno terminou
  const agendamentosAtivos = agendamentos.filter(a => 
    (a.status === 'agendado' || a.status === 'pendente') && 
    isAgendamentoFuturo(a) && 
    isTurnoAtivo(a)  // Nova verificação: só mostra se o turno ainda não terminou
  );

  const agendamentosHistorico = agendamentos.filter(a => 
    a.status === 'cancelado' || 
    a.status === 'concluido' || 
    ((a.status === 'agendado' || a.status === 'pendente') && (!isAgendamentoFuturo(a) || !isTurnoAtivo(a)))
  );

  return {
    agendamentos,
    agendamentosAtivos,
    agendamentosHistorico,
    loading,
    cancelarAgendamento,
    refetch: fetchAgendamentos,
  };
}
