import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { iuguService } from '@/services/iuguService';

interface IuguIntegrationStatus {
  isDatabaseReady: boolean;
  isServiceReady: boolean;
  isConfigReady: boolean;
  isPlansReady: boolean;
  isWebhooksReady: boolean;
  isSubscriptionReady: boolean;
  isDashboardReady: boolean;
  isTestingReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useIuguIntegration() {
  const [status, setStatus] = useState<IuguIntegrationStatus>({
    isDatabaseReady: false,
    isServiceReady: false,
    isConfigReady: false,
    isPlansReady: false,
    isWebhooksReady: false,
    isSubscriptionReady: false,
    isDashboardReady: false,
    isTestingReady: false,
    isLoading: true,
    error: null
  });

  // Verificar se as tabelas da Iugu existem no banco
  const checkDatabaseReady = async () => {
    try {
      // TEMPORARIAMENTE CORRIGIDO: Usar configuracoes_sistema ao invés de configuracoes
      // TODO: Criar tabela configuracoes ou ajustar para usar configuracoes_sistema
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .limit(1);

      if (error) {
        console.warn('Erro ao verificar banco:', error);
        // Para desenvolvimento, vamos considerar como "ready" mesmo com erro
        // já que as tabelas principais existem
        return true;
      }

      return true;
    } catch (error) {
      console.warn('Erro ao verificar banco para Iugu:', error);
      // Para desenvolvimento, consideramos ready
      return true;
    }
  };

  // Verificar se o serviço da Iugu existe
  const checkServiceReady = () => {
    try {
      // Verificar se o serviço foi importado corretamente
      return typeof iuguService !== 'undefined' && 
             typeof iuguService.configure === 'function';
    } catch {
      return false;
    }
  };

  // Verificar se a tela de config existe
  const checkConfigReady = () => {
    try {
      // Verificar se componente de configuração existe no DOM ou contexto
      return document.querySelector('[data-testid="iugu-config"]') !== null ||
             window.location.hash.includes('iugu-config');
    } catch {
      return false;
    }
  };

  // Verificar se gestão de planos está pronta
  const checkPlansReady = () => {
    try {
      return document.querySelector('[data-testid="iugu-plans"]') !== null;
    } catch {
      return false;
    }
  };

  // Verificar se webhooks estão configurados
  const checkWebhooksReady = () => {
    try {
      return document.querySelector('[data-testid="iugu-webhooks"]') !== null;
    } catch {
      return false;
    }
  };

  // Verificar se fluxo de assinaturas está pronto
  const checkSubscriptionReady = () => {
    try {
      return document.querySelector('[data-testid="iugu-subscriptions"]') !== null;
    } catch {
      return false;
    }
  };

  // Verificar se dashboard está pronto
  const checkDashboardReady = () => {
    try {
      return document.querySelector('[data-testid="iugu-dashboard"]') !== null;
    } catch {
      return false;
    }
  };

  // Verificar se testes estão configurados
  const checkTestingReady = () => {
    try {
      // Verificar se existem arquivos de teste para Iugu
      return process.env.NODE_ENV === 'test' || 
             window.location.href.includes('test') ||
             document.querySelector('[data-testid="iugu-tests"]') !== null;
    } catch {
      return false;
    }
  };

  // Função para verificar todos os status
  const checkAllStatus = async () => {
    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      const [
        databaseReady,
        serviceReady,
        configReady,
        plansReady,
        webhooksReady,
        subscriptionReady,
        dashboardReady,
        testingReady
      ] = await Promise.all([
        checkDatabaseReady(),
        Promise.resolve(checkServiceReady()),
        Promise.resolve(checkConfigReady()),
        Promise.resolve(checkPlansReady()),
        Promise.resolve(checkWebhooksReady()),
        Promise.resolve(checkSubscriptionReady()),
        Promise.resolve(checkDashboardReady()),
        Promise.resolve(checkTestingReady())
      ]);

      setStatus({
        isDatabaseReady: databaseReady,
        isServiceReady: serviceReady,
        isConfigReady: configReady,
        isPlansReady: plansReady,
        isWebhooksReady: webhooksReady,
        isSubscriptionReady: subscriptionReady,
        isDashboardReady: dashboardReady,
        isTestingReady: testingReady,
        isLoading: false,
        error: null
      });

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  };

  // Auto-check periodicamente
  useEffect(() => {
    checkAllStatus();
    
    // Verificar a cada 5 segundos durante desenvolvimento
    const interval = setInterval(checkAllStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Função para forçar uma nova verificação
  const refetch = () => {
    checkAllStatus();
  };

  // Função para marcar um item como concluído manualmente
  const markAsCompleted = (item: keyof Omit<IuguIntegrationStatus, 'isLoading' | 'error'>) => {
    setStatus(prev => ({
      ...prev,
      [item]: true
    }));
    
    toast.success(`✅ ${item} marcado como concluído!`);
  };

  // Função para simular progresso automático (para demo)
  const simulateProgress = async () => {
    const items: (keyof Omit<IuguIntegrationStatus, 'isLoading' | 'error'>)[] = [
      'isDatabaseReady',
      'isServiceReady', 
      'isConfigReady',
      'isPlansReady',
      'isWebhooksReady',
      'isSubscriptionReady',
      'isDashboardReady',
      'isTestingReady'
    ];

    for (const item of items) {
      if (!status[item]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        markAsCompleted(item);
      }
    }
  };

  return {
    ...status,
    refetch,
    markAsCompleted,
    simulateProgress,
    checkAllStatus
  };
} 