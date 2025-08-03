
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { useConfiguracoesCore } from './useConfiguracoesCore';
import { useConfiguracoesLoader } from './useConfiguracoesLoader';
import { useConfiguracoesSaver } from './useConfiguracoesSaver';
import { useHorariosValidation } from './useHorariosValidation';
import { logger } from '@/lib/logger';

export function useConfiguracoesSistema() {
  const { user } = useAuth();
  const { empresa, isAdminEmpresa } = useEmpresaUnificado();
  
  // Core state management
  const {
    configs,
    setConfigs,
    loading,
    setLoading,
    hasError,
    setHasError,
    isLoadingData,
    setIsLoadingData,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSaving,
    setIsSaving,
    hasInitializedRef,
    isLoadingRef
  } = useConfiguracoesCore();

  // Loading functionality
  const { loadConfiguracoes } = useConfiguracoesLoader({
    empresa,
    setLoading,
    setIsLoadingData,
    setConfigs,
    setHasError,
    hasUnsavedChanges,
    isLoadingRef
  });

  // Saving functionality
  const { saveAllConfiguracoes } = useConfiguracoesSaver({
    empresa,
    isAdminEmpresa,
    configs,
    setLoading,
    setIsSaving,
    setHasUnsavedChanges,
    loadConfiguracoes
  });

  // Validation functionality
  const { podeVerAgendaPorHorario, isAgendamentoPermitido } = useHorariosValidation({
    configs
  });

  // CORREÇÃO CRÍTICA: Carregar configurações automaticamente
  useEffect(() => {
    logger.info('🚀 CORREÇÃO - useEffect para carregar configurações automaticamente', {
      empresaId: empresa?.id,
      empresaNome: empresa?.nome,
      hasInitialized: hasInitializedRef.current,
      isCurrentlyLoading: isLoadingRef.current
    }, 'AUTO_LOAD_CONFIGS');

    if (empresa?.id && !hasInitializedRef.current && !isLoadingRef.current) {
      logger.info('✅ CORREÇÃO - Iniciando carregamento automático das configurações', {
        empresaId: empresa.id,
        trigger: 'useEffect'
      }, 'AUTO_LOAD_CONFIGS');
      
      hasInitializedRef.current = true;
      loadConfiguracoes();
    } else if (!empresa?.id) {
      logger.warn('⚠️ CORREÇÃO - Empresa não definida, aguardando...', {
        empresa: !!empresa,
        empresaId: empresa?.id
      }, 'AUTO_LOAD_CONFIGS');
    }
  }, [empresa?.id, loadConfiguracoes, hasInitializedRef, isLoadingRef]);

  // Update config function
  const updateConfig = (key: keyof typeof configs, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  return {
    configs,
    loading,
    hasError,
    updateConfig,
    podeVerAgendaPorHorario,
    isAgendamentoPermitido,
    saveAllConfiguracoes,
    refetch: loadConfiguracoes,
    hasUnsavedChanges,
    isSaving,
  };
}
