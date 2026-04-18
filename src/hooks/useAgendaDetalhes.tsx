
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DetalhesTecnico {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  status: string;
  data_agendamento: string;
  observacoes?: string;
}

export function useAgendaDetalhes() {
  const [tecnicos, setTecnicos] = useState<DetalhesTecnico[]>([]);
  const [loading, setLoading] = useState(false);

  const buscarTecnicosAgenda = async (agendaId: string) => {
    try {
      setLoading(true);
      console.log('Buscando tecnicos da agenda:', agendaId);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          status,
          data_agendamento,
          observacoes,
          tecnicos!agendamentos_tecnico_id_fkey (
            id,
            nome,
            telefone,
            email
          )
        `)
        .eq('agenda_id', agendaId)
        .order('data_agendamento', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tecnicos da agenda:', error);
        return;
      }

      const tecnicosFormatados = data?.map((agendamento: any) => ({
        id: agendamento.id,
        nome: agendamento.tecnicos.nome,
        telefone: agendamento.tecnicos.telefone,
        email: agendamento.tecnicos.email,
        status: agendamento.status,
        data_agendamento: agendamento.data_agendamento,
        observacoes: agendamento.observacoes
      })) || [];

      setTecnicos(tecnicosFormatados);
      console.log('Tecnicos da agenda carregados:', tecnicosFormatados);

    } catch (error) {
      console.error('Erro ao buscar tecnicos da agenda:', error);
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

  return { tecnicos, loading, buscarTecnicosAgenda, cancelarAgendamento };
}
