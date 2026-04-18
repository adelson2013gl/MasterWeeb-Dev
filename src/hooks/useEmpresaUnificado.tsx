/**
 * Hook central para coordenar empresa, tecnico e roles
 * Substitui a lógica complexa do EmpresaUnificadoContext
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaData } from '@/hooks/useEmpresaData';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useTecnicoContext } from '@/hooks/useTecnicoContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface EmpresaUnificadoState {
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

export function useEmpresaUnificado() {
  const { user, session, loading: authLoading } = useAuth();
  
  // Estados dos hooks modulares
  const empresaData = useEmpresaData();
  const userRoles = useUserRoles();
  const tecnicoContext = useTecnicoContext();
  
  // Estado do hook principal
  const [state, setState] = useState<EmpresaUnificadoState>({
    loading: true,
    initialized: false,
    error: null
  });

  // Inicialização principal
  const initializeUserData = useCallback(async (userId: string) => {
    if (!userId || !session) {
      logger.warn('Tentativa de inicialização sem usuário ou sessão válida');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('🚀 Iniciando inicialização do contexto unificado', { userId });

      // Passo 1: Buscar dados do tecnico
      const tecnico = await tecnicoContext.fetchTecnico(userId);
      
      // Passo 2: Determinar empresa ID (do tecnico ou padrão)
      const empresaId = tecnico?.empresa_id || import.meta.env.VITE_DEFAULT_COMPANY_ID;
      
      if (!empresaId) {
        throw new Error('ID da empresa não configurado');
      }

      // Passo 3: Buscar dados da empresa com fallback
      const empresa = await empresaData.fetchEmpresaWithFallback(
        empresaId,
        import.meta.env.VITE_DEFAULT_COMPANY_ID
      );

      // Passo 4: Inicializar roles e permissões
      const { userRole, permissions } = await userRoles.initializeRoles(
        userId, 
        empresa?.id || empresaId
      );

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        initialized: true,
        error: null
      }));

      logger.success('✅ Contexto unificado inicializado com sucesso', {
        userId,
        empresaId: empresa?.id,
        empresaNome: empresa?.nome,
        tecnicoNome: tecnico?.nome,
        userRole: userRole?.role,
        permissions
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('❌ Erro na inicialização do contexto unificado', { 
        error: errorMessage, 
        userId 
      });

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));

      toast.error('Erro ao carregar dados do usuário');
    }
  }, [session, tecnicoContext, empresaData, userRoles]);

  // Trocar empresa
  const trocarEmpresa = useCallback(async (novaEmpresaId: string) => {
    if (!user?.id) {
      logger.error('Tentativa de trocar empresa sem usuário autenticado');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      logger.info('🔄 Trocando contexto de empresa', { 
        userId: user.id, 
        novaEmpresaId 
      });

      // Buscar nova empresa
      const novaEmpresa = await empresaData.fetchEmpresa(novaEmpresaId);
      
      if (!novaEmpresa) {
        throw new Error('Empresa não encontrada');
      }

      // Atualizar contexto de roles para nova empresa
      const { userRole, permissions } = await userRoles.switchToEmpresa(
        user.id, 
        novaEmpresaId
      );

      setState(prev => ({ 
        ...prev, 
        loading: false 
      }));

      logger.success('✅ Contexto de empresa alterado com sucesso', {
        novaEmpresaId,
        empresaNome: novaEmpresa.nome,
        userRole: userRole?.role,
        permissions
      });

      toast.success(`Empresa alterada para: ${novaEmpresa.nome}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('❌ Erro ao trocar empresa', { 
        error: errorMessage, 
        novaEmpresaId 
      });

      setState(prev => ({ 
        ...prev, 
        loading: false 
      }));

      toast.error('Erro ao trocar empresa');
    }
  }, [user?.id, empresaData, userRoles]);

  // Recarregar dados
  const refetch = useCallback(async () => {
    if (user?.id) {
      await initializeUserData(user.id);
    }
  }, [user?.id, initializeUserData]);

  // Debug (apenas desenvolvimento)
  const debugAuth = useCallback(async () => {
    if (import.meta.env.PROD || !user?.id) return;
    
    await tecnicoContext.debugPermissions(user.id);
  }, [user?.id, tecnicoContext]);

  // Reset completo
  const reset = useCallback(() => {
    empresaData.reset();
    userRoles.reset();
    tecnicoContext.reset();
    setState({
      loading: false,
      initialized: false,
      error: null
    });
  }, [empresaData, userRoles, tecnicoContext]);

  // Efeito principal - inicializar quando usuário muda
  useEffect(() => {
    if (authLoading) return;

    if (!user?.id || !session) {
      logger.info('Usuário não autenticado, resetando contexto');
      reset();
      return;
    }

    if (!state.initialized) {
      initializeUserData(user.id);
    }
  }, [user?.id, session, authLoading, state.initialized, initializeUserData, reset]);

  // Calcular propriedades derivadas
  const isLoading = authLoading || state.loading || 
                   empresaData.loading || userRoles.loading || tecnicoContext.loading;

  const hasError = state.error || empresaData.error || 
                   userRoles.error || tecnicoContext.error;

  return {
    // Estados principais
    empresa: empresaData.empresa,
    tecnico: tecnicoContext.tecnico,
    userRole: userRoles.userRole,
    loading: isLoading,
    initialized: state.initialized,
    error: hasError,

    // Permissões
    isSuperAdmin: userRoles.permissions.isSuperAdmin,
    isAdminEmpresa: userRoles.permissions.isAdminEmpresa,
    isAdmin: userRoles.permissions.isAdmin,

    // Ações
    trocarEmpresa,
    criarEmpresa: empresaData.criarEmpresa,
    atualizarEmpresa: empresaData.atualizarEmpresa,
    refetch,
    debugAuth,

    // Para compatibilidade com código existente
    empresasDisponiveis: [], // TODO: Implementar se necessário
    empresasLoading: false,
  };
}