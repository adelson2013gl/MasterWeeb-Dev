import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Agenda } from "@/types/agenda";
import { toast } from "sonner";
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { safeStatus } from "@/lib/enumSafety";

/**
 * Hook para buscar e gerenciar agendas ativas com filtros de data
 * ATUALIZADO: Agora inclui sistema híbrido - busca todas as agendas (ativas/inativas)
 * e permite controle manual pelo admin, mantendo validação por horário/estrelas
 */
export function useAgendasAtivasAdmin(dataInicio?: string, dataFim?: string) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const { empresa } = useEmpresaUnificado();

  const fetchAgendasAtivas = async () => {
    if (!empresa?.id) {
      console.error('Empresa não encontrada');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('=== BUSCANDO TODAS AS AGENDAS (ATIVAS + INATIVAS) ===');
      console.log('Filtros de data:', { dataInicio, dataFim });
      
      // Se não receber parâmetros de data, usar período padrão de 30 dias
      const dataAtual = format(new Date(), 'yyyy-MM-dd');
      let dataInicioFiltro: string;
      let dataFimFiltro: string;
      
      if (!dataInicio && !dataFim) {
        // Período padrão: 30 dias a partir de hoje
        dataInicioFiltro = dataAtual;
        const dataFim30Dias = new Date();
        dataFim30Dias.setDate(dataFim30Dias.getDate() + 30);
        dataFimFiltro = format(dataFim30Dias, 'yyyy-MM-dd');
        console.log('Usando período padrão de 30 dias:', { dataInicioFiltro, dataFimFiltro });
      } else {
        // Usar parâmetros fornecidos ou fallback para data atual
        dataInicioFiltro = dataInicio || dataAtual;
        dataFimFiltro = dataFim || dataInicio || dataAtual;
      }
      
      console.log('Datas de filtro aplicadas:', { 
        dataInicioFiltro, 
        dataFimFiltro,
        sameDay: dataInicioFiltro === dataFimFiltro
      });
      
      // MUDANÇA CRÍTICA: Remover filtro .eq('ativo', true) para buscar TODAS as agendas
      let query = supabase
        .from('agendas')
        .select(`
          id,
          data_agenda,
          vagas_disponiveis,
          vagas_ocupadas,
          ativo,
          permite_reserva,
          turno_id,
          regiao_id,
          turnos!agendas_turno_id_fkey (
            id,
            nome,
            hora_inicio,
            hora_fim
          ),
          regioes!agendas_regiao_id_fkey (
            id,
            nome,
            cidades!regioes_cidade_id_fkey (
              id,
              nome
            )
          ),
          agendamentos (
            id,
            status,
            tipo,
            entregadores (
              id,
              nome,
              telefone,
              email
            )
          )
        `)
        .eq('empresa_id', empresa.id)
        .order('data_agenda', { ascending: true });

      // Adicionar cache bust
      const cacheBust = Date.now();
      query = query.limit(1000);
      
      // Aplicar filtros de data
      if (dataInicioFiltro) {
        console.log('Aplicando filtro data início >=', dataInicioFiltro);
        query = query.gte('data_agenda', dataInicioFiltro);
      }
      
      if (dataFimFiltro) {
        console.log('Aplicando filtro data fim <=', dataFimFiltro);
        query = query.lte('data_agenda', dataFimFiltro);
      }

      const { data: agendasData, error } = await query;

      if (error) {
        console.error('Erro ao buscar agendas:', error);
        return;
      }

      console.log(`Query retornou ${agendasData?.length || 0} agendas (ativas + inativas):`, agendasData?.map(a => ({
        id: a.id,
        data_agenda: a.data_agenda,
        ativo: a.ativo,
        agendamentos: a.agendamentos?.length || 0
      })));

      // Calcular vagas ocupadas dinamicamente
      const agendasFormatadas = agendasData?.map((agenda: any) => {
        // ✅ CORRIGIR: Incluir agendamentos 'agendado' E 'pendente' (reservas)
        const agendamentosAtivos = agenda.agendamentos?.filter((ag: any) => 
          ag.status === safeStatus('agendado') || ag.status === safeStatus('pendente')
        ) || [];
        
        // ✅ SEPARAR vagas confirmadas de reservas pendentes
        const vagasConfirmadas = agendamentosAtivos.filter((ag: any) => ag.status === safeStatus('agendado'));
        const reservasPendentes = agendamentosAtivos.filter((ag: any) => ag.status === safeStatus('pendente'));
        
        const vagasOcupadasReais = vagasConfirmadas.length; // Apenas vagas confirmadas contam para ocupação
        

        return {
          id: agenda.id,
          data_agenda: agenda.data_agenda,
          vagas_disponiveis: agenda.vagas_disponiveis,
          vagas_ocupadas: vagasOcupadasReais,
          ativo: agenda.ativo, // IMPORTANTE: Preservar status ativo/inativo
          permite_reserva: agenda.permite_reserva,
          turno_id: agenda.turno_id,
          regiao_id: agenda.regiao_id,
          turno: {
            id: agenda.turnos.id,
            nome: agenda.turnos.nome,
            hora_inicio: agenda.turnos.hora_inicio,
            hora_fim: agenda.turnos.hora_fim
          },
          regiao: {
            id: agenda.regioes.id,
            nome: agenda.regioes.nome,
            cidade: {
              id: agenda.regioes.cidades.id,
              nome: agenda.regioes.cidades.nome
            }
          },
          // Para compatibilidade com componentes que usam nomes diferentes
          turnos: {
            id: agenda.turnos.id,
            nome: agenda.turnos.nome,
            hora_inicio: agenda.turnos.hora_inicio,
            hora_fim: agenda.turnos.hora_fim
          },
          regioes: {
            nome: agenda.regioes.nome,
            cidades: {
              nome: agenda.regioes.cidades.nome
            }
          },
          agendamentos: agendamentosAtivos.map((ag: any) => ({
            id: ag.id,
            status: ag.status,
            tipo: ag.tipo,
            entregador: ag.entregadores ? {
              id: ag.entregadores.id,
              nome: ag.entregadores.nome,
              telefone: ag.entregadores.telefone,
              email: ag.entregadores.email
            } : undefined
          }))
        } as Agenda;
      }) || [];

      console.log(`Processadas ${agendasFormatadas.length} agendas formatadas (incluindo inativas)`);
      setAgendas(agendasFormatadas);

    } catch (error) {
      console.error('Erro ao buscar agendas:', error);
    } finally {
      setLoading(false);
    }
  };

  // NOVA FUNÇÃO: Toggle ativar/desativar agenda
  const toggleAtivarAgenda = async (agendaId: string, novoStatus: boolean) => {
    try {
      console.log(`=== TOGGLE AGENDA ${agendaId} ===`);
      console.log('Alterando status para:', novoStatus ? 'ATIVADA' : 'DESATIVADA');
      
      setLoading(true);
      const { error } = await supabase
        .from('agendas')
        .update({ 
          ativo: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', agendaId);

      if (error) throw error;

      // Atualizar estado local
      setAgendas(prev => prev.map(agenda => 
        agenda.id === agendaId 
          ? { ...agenda, ativo: novoStatus }
          : agenda
      ));

      const statusTexto = novoStatus ? 'ativada' : 'desativada';
      toast.success(`Agenda ${statusTexto} com sucesso!`);
      
      console.log(`✅ Agenda ${agendaId} ${statusTexto} com sucesso`);
    } catch (error) {
      console.error('Erro ao alterar status da agenda:', error);
      toast.error('Erro ao alterar status da agenda');
    } finally {
      setLoading(false);
    }
  };

  // Função para editar uma agenda
  const editarAgenda = async (agenda: Agenda) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('agendas')
        .update({
          vagas_disponiveis: agenda.vagas_disponiveis,
          permite_reserva: agenda.permite_reserva,
          regiao_id: agenda.regiao_id
        })
        .eq('id', agenda.id);

      if (error) throw error;

      toast.success('Agenda atualizada com sucesso!');
      await fetchAgendasAtivas();
    } catch (error) {
      console.error('Erro ao editar agenda:', error);
      toast.error('Erro ao editar agenda');
    } finally {
      setLoading(false);
    }
  };

  // Função para cancelar uma agenda
  const cancelarAgenda = async (agendaId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('agendas')
        .update({ ativo: false })
        .eq('id', agendaId);

      if (error) throw error;

      toast.success('Agenda cancelada com sucesso!');
      await fetchAgendasAtivas();
    } catch (error) {
      console.error('Erro ao cancelar agenda:', error);
      toast.error('Erro ao cancelar agenda');
    } finally {
      setLoading(false);
    }
  };

  // Função para concluir uma agenda
  const concluirAgenda = async (agendaId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agendas')
        .update({ 
          ativo: false
        })
        .eq('id', agendaId)
        .select(); // Adicionar esta linha
    
      if (error) throw error;
    
      console.log('Agenda atualizada:', data); // Log para verificar
      toast.success('Agenda concluída com sucesso!');
      await fetchAgendasAtivas();
    } catch (error) {
      console.error('Erro ao concluir agenda:', error);
      toast.error('Erro ao concluir agenda');
    } finally {
      setLoading(false);
    }
  };

  // Função para ver detalhes de uma agenda
  const verDetalhes = async (agenda: Agenda) => {
    try {
      setLoading(true);
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          status,
          tipo,
          entregadores!agendamentos_entregador_id_fkey (
            id,
            nome,
            telefone,
            email
          )
        `)
        .eq('agenda_id', agenda.id)
        .in('status', [safeStatus('agendado'), safeStatus('pendente')]);
      if (error) throw error;

      // Aqui você pode implementar a lógica para mostrar os detalhes
      // Por exemplo, abrir um modal com os dados dos agendamentos
      console.log('Agendamentos da agenda:', agendamentos);

    } catch (error) {
      console.error('Erro ao buscar detalhes da agenda:', error);
      toast.error('Erro ao buscar detalhes da agenda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== HOOK USE EFFECT AGENDAS ADMIN (HÍBRIDO) ===');
    console.log('Dependências mudaram:', { dataInicio, dataFim });
    fetchAgendasAtivas();
  }, [dataInicio, dataFim]);

  return { 
    agendas, 
    loading, 
    refetch: fetchAgendasAtivas,
    toggleAtivarAgenda, // NOVA FUNÇÃO EXPORTADA
    editarAgenda,
    cancelarAgenda,
    concluirAgenda,
    verDetalhes
  };
}
