// Hook para verificar e gerenciar limites baseados nos planos
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getPlanoConfig, 
  podeAdicionarEntregador, 
  podeAdicionarAgendamento,
  type PlanoType,
  type LimitesPlano 
} from '@/types/subscription';

interface UsePlanLimitsProps {
  empresaId: string;
  plano: PlanoType;
}

interface PlanLimitsData {
  limites: LimitesPlano;
  entregadoresAtuais: number;
  agendamentosNoMes: number;
  podeAdicionarEntregador: boolean;
  podeAdicionarAgendamento: boolean;
  percentualUsoEntregadores: number;
  percentualUsoAgendamentos: number;
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
      const [entregadoresResult, agendamentosResult, assinaturaResult] = await Promise.all([
        // Contar entregadores ativos
        supabase
          .from('entregadores')
          .select('id', { count: 'exact' })
          .eq('empresa_id', empresaId)
          .eq('ativo', true),
        
        // Contar agendamentos do mês atual
        supabase
          .from('agendamentos')
          .select('id', { count: 'exact' })
          .eq('empresa_id', empresaId)
          .gte('data_agendamento', getInicioMesAtual())
          .lt('data_agendamento', getInicioProximoMes()),
        
        // Buscar assinatura ativa
        supabase
          .from('assinaturas')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('status', 'ativa')
          .single()
      ]);

      if (entregadoresResult.error) {
        console.error('Erro ao buscar entregadores:', entregadoresResult.error);
      }

      if (agendamentosResult.error) {
        console.error('Erro ao buscar agendamentos:', agendamentosResult.error);
      }

      const entregadoresAtuais = entregadoresResult.count || 0;
      const agendamentosNoMes = agendamentosResult.count || 0;
      const assinatura = assinaturaResult.data;

      // Verificar limites personalizados no metadata
      const metadata = (assinatura?.metadata as any) || {};
      const limiteEntregadores = metadata.limite_entregadores || planoConfig.max_entregadores;
      const limiteAgendamentos = metadata.limite_agendamentos_mes || planoConfig.max_agendas_mes;

      // Calcular percentuais de uso com limites personalizados
      const percentualUsoEntregadores = Math.round(
        (entregadoresAtuais / limiteEntregadores) * 100
      );
      const percentualUsoAgendamentos = Math.round(
        (agendamentosNoMes / limiteAgendamentos) * 100
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
          max_entregadores: limiteEntregadores,
          max_agendas_mes: limiteAgendamentos,
          recursos_disponivel: planoConfig.recursos
        },
        entregadoresAtuais,
        agendamentosNoMes,
        podeAdicionarEntregador: entregadoresAtuais < limiteEntregadores,
        podeAdicionarAgendamento: agendamentosNoMes < limiteAgendamentos,
        percentualUsoEntregadores,
        percentualUsoAgendamentos,
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
    // Alerta de limite de entregadores
    if (planData.percentualUsoEntregadores >= 90) {
      toast({
        title: 'Limite de entregadores quase atingido',
        description: `Você está usando ${planData.percentualUsoEntregadores}% do limite de entregadores.`,
        variant: 'destructive'
      });
    }

    // Alerta de limite de agendamentos
    if (planData.percentualUsoAgendamentos >= 90) {
      toast({
        title: 'Limite de agendamentos quase atingido',
        description: `Você está usando ${planData.percentualUsoAgendamentos}% do limite de agendamentos deste mês.`,
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

  const verificarLimiteEntregador = (): boolean => {
    if (!data) return false;
    
    if (!data.podeAdicionarEntregador) {
      toast({
        title: 'Limite atingido',
        description: `Você atingiu o limite de ${data.limites.max_entregadores} entregadores do seu plano. Faça upgrade para adicionar mais.`,
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  };

  const verificarLimiteAgendamento = (): boolean => {
    if (!data) return false;
    
    if (!data.podeAdicionarAgendamento) {
      toast({
        title: 'Limite atingido',
        description: `Você atingiu o limite de ${data.limites.max_agendas_mes} agendamentos deste mês. Faça upgrade para adicionar mais.`,
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
    verificarLimiteEntregador,
    verificarLimiteAgendamento,
    verificarAssinaturaAtiva
  };
}

export default usePlanLimits;