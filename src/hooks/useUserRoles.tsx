/**
 * Hook para gerenciar roles e permissões do usuário
 * Extraído do EmpresaUnificadoContext para melhorar modularidade
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type UserRole = Database['public']['Tables']['user_roles']['Row'];

interface UserRolesState {
  userRole: UserRole | null;
  allRoles: UserRole[];
  loading: boolean;
  error: string | null;
}

interface RolePermissions {
  isSuperAdmin: boolean;
  isAdminEmpresa: boolean;
  isAdmin: boolean;
  canAccessEmpresa: (empresaId: string) => boolean;
}

export function useUserRoles() {
  const [state, setState] = useState<UserRolesState>({
    userRole: null,
    allRoles: [],
    loading: false,
    error: null
  });

  // Buscar todas as roles do usuário
  const fetchUserRoles = useCallback(async (userId: string): Promise<UserRole[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('Buscando roles do usuário', { userId });

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (rolesError) {
        logger.error('Erro ao buscar roles', { 
          error: rolesError.message, 
          userId 
        });
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: rolesError.message 
        }));
        return [];
      }

      setState(prev => ({ 
        ...prev, 
        allRoles: rolesData || [], 
        loading: false 
      }));

      logger.info('Roles encontradas', { 
        userId, 
        totalRoles: rolesData?.length || 0,
        roles: rolesData?.map(r => ({ role: r.role, empresaId: r.empresa_id })) || []
      });

      return rolesData || [];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro inesperado ao buscar roles', { error: errorMessage });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return [];
    }
  }, []);

  // Determinar role principal para uma empresa específica
  const determineUserRole = useCallback((
    allRoles: UserRole[], 
    empresaId: string
  ): UserRole | null => {
    if (!allRoles || allRoles.length === 0) {
      logger.warn('Nenhuma role encontrada para o usuário');
      return null;
    }

    // Prioridade: super_admin > admin_empresa > entregador
    const rolesPriority = ['super_admin', 'admin_empresa', 'entregador'];

    // Primeiro, verificar se existe super_admin (independente da empresa)
    const superAdminRole = allRoles.find(role => role.role === 'super_admin');
    if (superAdminRole) {
      logger.info('Usuário identificado como super_admin');
      return superAdminRole;
    }

    // Depois, buscar roles específicas da empresa
    const empresaRoles = allRoles.filter(role => role.empresa_id === empresaId);
    
    if (empresaRoles.length === 0) {
      logger.warn('Nenhuma role específica encontrada para a empresa', { empresaId });
      // Fallback: usar qualquer role disponível
      const fallbackRole = allRoles[0];
      logger.warn('Usando fallback role', { 
        role: fallbackRole.role, 
        empresaId: fallbackRole.empresa_id 
      });
      return fallbackRole;
    }

    // Encontrar a role de maior prioridade para a empresa
    for (const priority of rolesPriority) {
      const role = empresaRoles.find(r => r.role === priority);
      if (role) {
        logger.info('Role determinada', { 
          role: role.role, 
          empresaId: role.empresa_id 
        });
        return role;
      }
    }

    // Fallback: primeira role encontrada para a empresa
    const fallbackRole = empresaRoles[0];
    logger.warn('Usando fallback role para empresa', { 
      role: fallbackRole.role, 
      empresaId: fallbackRole.empresa_id 
    });
    return fallbackRole;
  }, []);

  // Calcular permissões baseadas nas roles
  const calculatePermissions = useCallback((
    userRole: UserRole | null, 
    allRoles: UserRole[]
  ): RolePermissions => {
    if (!userRole) {
      return {
        isSuperAdmin: false,
        isAdminEmpresa: false,
        isAdmin: false,
        canAccessEmpresa: () => false
      };
    }

    const isSuperAdmin = userRole.role === 'super_admin' || 
                        allRoles.some(r => r.role === 'super_admin');
    const isAdminEmpresa = userRole.role === 'admin_empresa' || isSuperAdmin;
    const isAdmin = isAdminEmpresa || isSuperAdmin;

    const canAccessEmpresa = (empresaId: string): boolean => {
      if (isSuperAdmin) return true;
      return allRoles.some(role => role.empresa_id === empresaId);
    };

    return {
      isSuperAdmin,
      isAdminEmpresa,
      isAdmin,
      canAccessEmpresa
    };
  }, []);

  // Trocar contexto para uma empresa específica
  const switchToEmpresa = useCallback(async (
    userId: string, 
    empresaId: string
  ): Promise<{ userRole: UserRole | null; permissions: RolePermissions }> => {
    try {
      logger.info('Trocando contexto para empresa', { userId, empresaId });

      // Buscar ou usar roles já carregadas
      let allRoles = state.allRoles;
      if (allRoles.length === 0) {
        allRoles = await fetchUserRoles(userId);
      }

      // Determinar role para a nova empresa
      const newUserRole = determineUserRole(allRoles, empresaId);
      const permissions = calculatePermissions(newUserRole, allRoles);

      setState(prev => ({ 
        ...prev, 
        userRole: newUserRole 
      }));

      logger.info('Contexto alterado com sucesso', { 
        empresaId, 
        role: newUserRole?.role,
        permissions
      });

      return { userRole: newUserRole, permissions };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao trocar contexto de empresa', { error: errorMessage });
      
      return { 
        userRole: null, 
        permissions: calculatePermissions(null, []) 
      };
    }
  }, [state.allRoles, fetchUserRoles, determineUserRole, calculatePermissions]);

  // Inicializar roles para usuário e empresa
  const initializeRoles = useCallback(async (
    userId: string, 
    empresaId: string
  ): Promise<{ userRole: UserRole | null; permissions: RolePermissions }> => {
    const allRoles = await fetchUserRoles(userId);
    const userRole = determineUserRole(allRoles, empresaId);
    const permissions = calculatePermissions(userRole, allRoles);

    setState(prev => ({ 
      ...prev, 
      userRole 
    }));

    return { userRole, permissions };
  }, [fetchUserRoles, determineUserRole, calculatePermissions]);

  // Resetar estado
  const reset = useCallback(() => {
    setState({
      userRole: null,
      allRoles: [],
      loading: false,
      error: null
    });
  }, []);

  // Calcular permissões atuais
  const currentPermissions = calculatePermissions(state.userRole, state.allRoles);

  return {
    userRole: state.userRole,
    allRoles: state.allRoles,
    loading: state.loading,
    error: state.error,
    permissions: currentPermissions,
    fetchUserRoles,
    determineUserRole,
    switchToEmpresa,
    initializeRoles,
    reset
  };
}