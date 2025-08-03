
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DetalhesEntregador {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  status: string;
  data_agendamento: string;
  observacoes?: string;
}

export function useAgendaDetalhes() {
  const [entregadores, setEntregadores] = useState<DetalhesEntregador[]>([]);
  const [loading, setLoading] = useState(false);

  const buscarEntregadoresAgenda = async (agendaId: string) => {
    try {
      setLoading(true);
      console.log('Buscando entregadores da agenda:', agendaId);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          status,
          data_agendamento,
          observacoes,
          entregadores!agendamentos_entregador_id_fkey (
            id,
            nome,
            telefone,
            email
          )
        `)
        .eq('agenda_id', agendaId)
        .order('data_agendamento', { ascending: true });

      if (error) {
        console.error('Erro ao buscar entregadores da agenda:', error);
        return;
      }

      const entregadoresFormatados = data?.map((agendamento: any) => ({
        id: agendamento.id,
        nome: agendamento.entregadores.nome,
        telefone: agendamento.entregadores.telefone,
        email: agendamento.entregadores.email,
        status: agendamento.status,
        data_agendamento: agendamento.data_agendamento,
        observacoes: agendamento.observacoes
      })) || [];

      setEntregadores(entregadoresFormatados);
      console.log('Entregadores da agenda carregados:', entregadoresFormatados);

    } catch (error) {
      console.error('Erro ao buscar entregadores da agenda:', error);
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
          status: 'cancelado',
          data_cancelamento: new Date().toISOString(),
          observacoes: 'Cancelado pelo administrador'
        })
        .eq('id', agendamentoId);

      if (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast.error('Erro ao cancelar agendamento');
        return false;
      }

      toast.success('Agendamento cancelado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro inesperado ao cancelar agendamento:', error);
      toast.error('Erro inesperado ao cancelar agendamento');
      return false;
    }
  };

  return { entregadores, loading, buscarEntregadoresAgenda, cancelarAgendamento };
}
