import { useState, useEffect } from 'react';
import { useUserPermissions } from './useUserPermissions';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { EMPRESA_STATUS, type Empresa } from '@/types/empresa';
import { empresaCacheService } from '@/services/empresaCache';
import { adminMetrics } from '@/lib/adminMetrics';

export interface AdminPermissions {
  canViewAdmins: boolean;
  canCreateAdmins: boolean;
  canEditAdmins: boolean;
  canDeleteAdmins: boolean;
  allowedEmpresaIds: string[];
  isSuperAdmin: boolean;
  isAdminEmpresa: boolean;
}

export const useAdminPermissions = () => {
  const { permissions: userPermissions, loading: permissionsLoading } = useUserPermissions();
  const userRole = userPermissions.roleType;
  const empresaId = userPermissions.empresaId;
  const [permissions, setPermissions] = useState<AdminPermissions>({
    canViewAdmins: false,
    canCreateAdmins: false,
    canEditAdmins: false,
    canDeleteAdmins: false,
    allowedEmpresaIds: [],
    isSuperAdmin: false,
    isAdminEmpresa: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculatePermissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await adminMetrics.measureOperation('permissions.calculate', async () => {

        if (permissionsLoading || !userRole) {
          return;
        }

        const isSuperAdmin = userRole === 'super_admin';
        const isAdminEmpresa = userRole === 'admin_empresa';

        // Verificar se o usuário tem permissões de administrador
        if (!isSuperAdmin && !isAdminEmpresa) {
          logger.warn('Usuário sem permissões de administrador tentou acessar gestão de admins', {
            userRole,
            empresaId
          });
          setPermissions({
            canViewAdmins: false,
            canCreateAdmins: false,
            canEditAdmins: false,
            canDeleteAdmins: false,
            allowedEmpresaIds: [],
            isSuperAdmin: false,
            isAdminEmpresa: false
          });
          return;
        }

        let allowedEmpresaIds: string[] = [];

        if (isSuperAdmin) {
          // Super admin pode gerenciar administradores de todas as empresas
          const empresas = await empresaCacheService.getEmpresasAtivas();
          allowedEmpresaIds = empresas.map(e => e.id);
        } else if (isAdminEmpresa && empresaId) {
          // Admin empresa pode gerenciar apenas administradores da própria empresa
          allowedEmpresaIds = [empresaId];
        }

          const finalPermissions = {
            canViewAdmins: true,
            canCreateAdmins: true,
            canEditAdmins: true,
            canDeleteAdmins: isSuperAdmin, // Apenas super admin pode deletar
            allowedEmpresaIds,
            isSuperAdmin,
            isAdminEmpresa
          };

          logger.info('Permissões de administrador calculadas', {
            userRole,
            empresaId,
            allowedEmpresaIds: allowedEmpresaIds.length,
            permissions: {
              canViewAdmins: true,
              canCreateAdmins: true,
              canEditAdmins: true,
              canDeleteAdmins: isSuperAdmin
            }
          });

          return finalPermissions;
        }, { userRole, empresaId });
        
        setPermissions(result);
      } catch (error) {
        logger.error('Erro ao calcular permissões de administrador', {
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        
        setError('Erro ao carregar permissões');
        setPermissions({
          canViewAdmins: false,
          canCreateAdmins: false,
          canEditAdmins: false,
          canDeleteAdmins: false,
          allowedEmpresaIds: [],
          isSuperAdmin: false,
          isAdminEmpresa: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculatePermissions();
  }, [userRole, empresaId, permissionsLoading]);

  const hasPermissionForEmpresa = (targetEmpresaId: string): boolean => {
    return permissions.allowedEmpresaIds.includes(targetEmpresaId);
  };

  const canManageAdmin = (adminEmpresaId: string): boolean => {
    if (permissions.isSuperAdmin) {
      return true;
    }
    
    if (permissions.isAdminEmpresa) {
      return hasPermissionForEmpresa(adminEmpresaId);
    }
    
    return false;
  };

  return {
    permissions,
    isLoading,
    error,
    hasPermissionForEmpresa,
    canManageAdmin
  };
};