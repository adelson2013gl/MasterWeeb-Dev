
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";

interface DashboardStats {
  entregadoresPendentes: number;
  entregadoresAtivos: number;
  agendasHoje: number;
  ocupacaoMedia: number;
  cidadesAtivas: number;
  turnosAtivos: number;
  totalAgendamentos: number;
  agendamentosHoje: number;
}

export function useDashboardStats() {
  const { empresa } = useEmpresaUnificado();
  const [stats, setStats] = useState<DashboardStats>({
    entregadoresPendentes: 0,
    entregadoresAtivos: 0,
    agendasHoje: 0,
    ocupacaoMedia: 0,
    cidadesAtivas: 0,
    turnosAtivos: 0,
    totalAgendamentos: 0,
    agendamentosHoje: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!empresa?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Buscando estatísticas otimizadas para empresa:', empresa.nome);
      
      // Usar a nova função SQL otimizada que faz tudo em uma query
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        target_empresa_id: empresa.id
      });

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const statsData = data[0];
        const newStats: DashboardStats = {
          entregadoresPendentes: Number(statsData.entregadores_pendentes) || 0,
          entregadoresAtivos: Number(statsData.entregadores_ativos) || 0,
          agendasHoje: Number(statsData.agendas_hoje) || 0,
          ocupacaoMedia: Number(statsData.ocupacao_media) || 0,
          cidadesAtivas: Number(statsData.cidades_ativas) || 0,
          turnosAtivos: Number(statsData.turnos_ativos) || 0,
          totalAgendamentos: Number(statsData.total_agendamentos) || 0,
          agendamentosHoje: Number(statsData.agendamentos_hoje) || 0
        };

        setStats(newStats);
        console.log('✅ Estatísticas carregadas com nova função otimizada:', newStats);
      }

    } catch (error) {
      console.error('💥 Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [empresa?.id]);

  return { stats, loading, refetch: fetchStats };
}
