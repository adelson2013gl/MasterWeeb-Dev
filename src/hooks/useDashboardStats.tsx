
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";

interface DashboardStats {
  tecnicosPendentes: number;
  tecnicosAtivos: number;
  setores: number;
  ordensServico: number;
}

export function useDashboardStats() {
  const { empresa } = useEmpresaUnificado();
  const [stats, setStats] = useState<DashboardStats>({
    tecnicosPendentes: 0,
    tecnicosAtivos: 0,
    setores: 0,
    ordensServico: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!empresa?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Buscando estatísticas para empresa:', empresa.nome);
      
      // Buscar estatísticas manualmente
      const [tecnicosPendentes, tecnicosAtivos, setores, ordensServico] = await Promise.all([
        // Técnicos pendentes
        (supabase as any)
          .from('tecnicos')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresa.id)
          .eq('status_cadastro', 'pendente'),
        // Técnicos ativos
        (supabase as any)
          .from('tecnicos')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresa.id)
          .eq('status_cadastro', 'ativo'),
        // Setores
        (supabase as any)
          .from('setores')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresa.id),
        // Ordens de serviço
        (supabase as any)
          .from('ordens_servico')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresa.id)
      ]);

      const newStats: DashboardStats = {
        tecnicosPendentes: tecnicosPendentes.count || 0,
        tecnicosAtivos: tecnicosAtivos.count || 0,
        setores: setores.count || 0,
        ordensServico: ordensServico.count || 0
      };

      setStats(newStats);
      console.log('✅ Estatísticas carregadas:', newStats);

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
