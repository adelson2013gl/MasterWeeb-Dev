
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AgendaExportData {
  data: string;
  cidade: string;
  regiao: string;
  turno: string;
  cpf_entregador: string;
  nome_entregador: string;
}

/**
 * Hook para buscar dados completos das agendas para export
 * Inclui informações dos entregadores agendados
 */
export function useAgendasExport() {
  const [loading, setLoading] = useState(false);

  const buscarDadosParaExport = async (dataInicio?: string, dataFim?: string): Promise<AgendaExportData[]> => {
    try {
      setLoading(true);
      console.log('=== FETCH AGENDAS PARA EXPORT ===');
      console.log('Parâmetros:', { dataInicio, dataFim });

      // Query complexa para buscar todos os dados necessários
      let query = supabase
        .from('agendas')
        .select(`
          data,
          turnos!agendas_turno_id_fkey (
            nome
          ),
          regioes!agendas_regiao_id_fkey (
            nome,
            cidades!regioes_cidade_id_fkey (
              nome
            )
          ),
          agendamentos!agendamentos_agenda_id_fkey (
            status,
            entregadores!agendamentos_entregador_id_fkey (
              cpf,
              nome
            )
          )
        `)
        .eq('ativo', true)
        .order('data', { ascending: true });

      // Aplicar filtros de data se fornecidos
      if (dataInicio) {
        query = query.gte('data', dataInicio);
      }
      
      if (dataFim) {
        query = query.lte('data', dataFim);
      }

      const { data: agendasData, error } = await query;

      if (error) {
        console.error('Erro ao buscar dados para export:', error);
        throw error;
      }

      console.log(`Query retornou ${agendasData?.length || 0} agendas para export`);

      // Processar dados para o formato de export
      const dadosExport: AgendaExportData[] = [];

      agendasData?.forEach((agenda: any) => {
        const agendamentosAtivos = agenda.agendamentos?.filter((ag: any) => 
          ag.status === 'agendado'
        ) || [];

        if (agendamentosAtivos.length === 0) {
          // Agenda sem entregadores agendados - adicionar linha vazia
          dadosExport.push({
            data: agenda.data,
            cidade: agenda.regioes.cidades.nome,
            regiao: agenda.regioes.nome,
            turno: agenda.turnos.nome,
            cpf_entregador: '--- Sem agendamentos ---',
            nome_entregador: '--- Sem agendamentos ---'
          });
        } else {
          // Adicionar uma linha para cada entregador agendado
          agendamentosAtivos.forEach((agendamento: any) => {
            dadosExport.push({
              data: agenda.data,
              cidade: agenda.regioes.cidades.nome,
              regiao: agenda.regioes.nome,
              turno: agenda.turnos.nome,
              cpf_entregador: agendamento.entregadores.cpf,
              nome_entregador: agendamento.entregadores.nome
            });
          });
        }
      });

      console.log(`Processados ${dadosExport.length} registros para export`);
      return dadosExport;

    } catch (error) {
      console.error('Erro ao buscar dados para export:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    buscarDadosParaExport,
    loading
  };
}
