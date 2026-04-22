// Hook para verificar e gerenciar limites baseados nos planos
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getPlanoConfig, 
  podeAdicionarTecnico, 
  type PlanoType,
  type LimitesPlano 
} from '@/types/subscription';

interface UsePlanLimitsProps {
  empresaId: string;
  plano: PlanoType;
}

interface PlanLimitsData {
  limites: LimitesPlano;
  tecnicosAtuais: number;
  ordensServicoNoMes: number;
  podeAdicionarTecnico: boolean;
  podeAdicionarOrdemServico: boolean;
  percentualUsoTecnicos: number;
  percentualUsoOrdensServico: number;
  proximoVencimento?: string;
  diasParaVencimento?: number;
  assinaturaAtiva: boolean;
}

export function usePlanLimits({ empresaId, plano }: UsePlanLimitsProps) {
  const [data, setData] = useState<PlanLimitsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (empresaId && plano) {
      carregarDadosLimites();
    }
  }, [empresaId, plano]);

  const carregarDadosLimites = async () => {
    try {
      setLoading(true);
      setError(null);

      const planoConfig = getPlanoConfig(plano);
      
      // Buscar dados atuais da empresa
      const [tecnicosResult, ordensResult, assinaturaResult] = await Promise.all([
        // Contar tecnicos ativos
        (supabase as any)
          .from('tecnicos')
          .select('id', { count: 'exact' })
          .eq('empresa_id', empresaId)
          .eq('status_cadastro', 'ativo'),
        
        // Contar ordens de serviço do mês atual
        (supabase as any)
          .from('ordens_servico')
          .select('id', { count: 'exact' })
          .eq('empresa_id', empresaId)
          .gte('data_abertura', getInicioMesAtual())
          .lt('data_abertura', getInicioProximoMes()),
        
        // Buscar assinatura ativa
        (supabase as any)
          .from('assinaturas')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('status', 'ativa')
          .single()
      ]);

      if (tecnicosResult.error) {
        console.error('Erro ao buscar tecnicos:', tecnicosResult.error);
      }

      if (ordensResult.error) {
        console.error('Erro ao buscar ordens de serviço:', ordensResult.error);
      }

      const tecnicosAtuais = tecnicosResult.count || 0;
      const ordensServicoNoMes = ordensResult.count || 0;
      const assinatura = assinaturaResult.data;

      // Verificar limites personalizados no metadata
      const metadata = (assinatura?.metadata as any) || {};
      const limiteTecnicos = metadata.limite_tecnicos || planoConfig.max_entregadores || 10;
      const limiteOrdens = metadata.limite_ordens_mes || planoConfig.max_agendas_mes || 100;

      // Calcular percentuais de uso com limites personalizados
      const percentualUsoTecnicos = Math.round(
        (tecnicosAtuais / limiteTecnicos) * 100
      );
      const percentualUsoOrdensServico = Math.round(
        (ordensServicoNoMes / limiteOrdens) * 100
      );

      // Calcular dias para vencimento
      let diasParaVencimento: number | undefined;
      if (assinatura?.data_proximo_pagamento) {
        const vencimento = new Date(assinatura.data_proximo_pagamento);
        const hoje = new Date();
        diasParaVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      }

      const planLimitsData: PlanLimitsData = {
        limites: {
          max_entregadores: limiteTecnicos,
          max_agendas_mes: limiteOrdens,
          recursos_disponivel: planoConfig.recursos
        },
        tecnicosAtuais,
        ordensServicoNoMes,
        podeAdicionarTecnico: tecnicosAtuais < limiteTecnicos,
        podeAdicionarOrdemServico: ordensServicoNoMes < limiteOrdens,
        percentualUsoTecnicos,
        percentualUsoOrdensServico,
        proximoVencimento: assinatura?.data_proximo_pagamento,
        diasParaVencimento,
        assinaturaAtiva: !!assinatura
      };

      setData(planLimitsData);

      // Alertas automáticos
      verificarAlertas(planLimitsData);

    } catch (err) {
      console.error('Erro ao carregar limites do plano:', err);
      setError('Erro ao carregar informações do plano');
    } finally {
      setLoading(false);
    }
  };

  const verificarAlertas = (planData: PlanLimitsData) => {
    // Alerta de limite de tecnicos
    if (planData.percentualUsoTecnicos >= 90) {
      toast({
        title: 'Limite de técnicos quase atingido',
        description: `Você está usando ${planData.percentualUsoTecnicos}% do limite de técnicos.`,
        variant: 'destructive'
      });
    }

    // Alerta de limite de ordens de serviço
    if (planData.percentualUsoOrdensServico >= 90) {
      toast({
        title: 'Limite de ordens quase atingido',
        description: `Você está usando ${planData.percentualUsoOrdensServico}% do limite de ordens deste mês.`,
        variant: 'destructive'
      });
    }

    // Alerta de vencimento próximo
    if (planData.diasParaVencimento && planData.diasParaVencimento <= 3 && planData.diasParaVencimento > 0) {
      toast({
        title: 'Pagamento próximo do vencimento',
        description: `Seu próximo pagamento vence em ${planData.diasParaVencimento} dias.`,
        variant: 'default'
      });
    }

    // Alerta de assinatura vencida
    if (planData.diasParaVencimento && planData.diasParaVencimento < 0) {
      toast({
        title: 'Assinatura vencida',
        description: 'Sua assinatura está vencida. Regularize o pagamento para continuar usando o sistema.',
        variant: 'destructive'
      });
    }
  };

  const verificarLimiteTecnico = (): boolean => {
    if (!data) return false;
    
    if (!data.podeAdicionarTecnico) {
      toast({
        title: 'Limite atingido',
        description: `Você atingiu o limite de ${data.limites.max_entregadores} técnicos do seu plano. Faça upgrade para adicionar mais.`,
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  };

  const verificarLimiteOrdemServico = (): boolean => {
    if (!data) return false;
    
    if (!data.podeAdicionarOrdemServico) {
      toast({
        title: 'Limite atingido',
        description: `Você atingiu o limite de ${data.limites.max_agendas_mes} ordens deste mês. Faça upgrade para adicionar mais.`,
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  };

  const verificarAssinaturaAtiva = (): boolean => {
    if (!data) return false;
    
    if (!data.assinaturaAtiva) {
      toast({
        title: 'Assinatura inativa',
        description: 'Você precisa de uma assinatura ativa para usar esta funcionalidade.',
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  };

  const getInicioMesAtual = (): string => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
  };

  const getInicioProximoMes = (): string => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString();
  };

  const refetch = () => {
    carregarDadosLimites();
  };

  return {
    data,
    loading,
    error,
    refetch,
    verificarLimiteTecnico,
    verificarLimiteOrdemServico,
    verificarAssinaturaAtiva
  };
}

export default usePlanLimits;
