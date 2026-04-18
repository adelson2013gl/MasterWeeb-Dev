
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";

interface UserPermissions {
  hasValidRole: boolean;
  isAdminEmpresa: boolean;
  empresaId: string | null;
  roleType: string | null;
  canAccessSystem: boolean;
}

export function useUserPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    hasValidRole: false,
    isAdminEmpresa: false,
    empresaId: null,
    roleType: null,
    canAccessSystem: false
  });
  const [loading, setLoading] = useState(true);

  const fetchUserPermissions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      logger.info('🔐 Verificando permissões estruturais do usuário', { userId: user.id });

      // Primeiro, verificar se existe role em user_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (rolesError) {
        logger.error('❌ Erro ao buscar user_roles', { error: rolesError });
      } else {
        logger.info('📋 Roles encontradas', { 
          totalRoles: userRoles?.length || 0,
          roles: userRoles?.map(r => ({ role: r.role, empresaId: r.empresa_id })) || []
        });
      }

      // Verificar dados do entregador para fallback
      const { data: entregadorData, error: entregadorError } = await supabase
        .from('tecnicos')
        .select('id, empresa_id, perfil, status')
        .eq('user_id', user.id)
        .single();

      if (entregadorError) {
        logger.error('❌ Erro ao buscar dados do entregador para permissões', { error: entregadorError });
      } else {
        logger.info('👤 Dados do entregador para permissões', { 
          entregadorId: entregadorData.id,
          empresaId: entregadorData.empresa_id,
          perfil: entregadorData.perfil,
          status: entregadorData.status
        });
      }

      // Determinar permissões baseadas nos dados disponíveis
      let finalPermissions: UserPermissions = {
        hasValidRole: false,
        isAdminEmpresa: false,
        empresaId: null,
        roleType: null,
        canAccessSystem: false
      };

      // Se tem roles válidas em user_roles
      if (userRoles && userRoles.length > 0) {
        const adminRole = userRoles.find(r => r.role === 'admin_empresa');
        const superAdminRole = userRoles.find(r => r.role === 'super_admin');
        const entregadorRole = userRoles.find(r => r.role === 'tecnico');

        if (superAdminRole) {
          finalPermissions = {
            hasValidRole: true,
            isAdminEmpresa: true,
            empresaId: superAdminRole.empresa_id,
            roleType: 'super_admin',
            canAccessSystem: true
          };
        } else if (adminRole) {
          finalPermissions = {
            hasValidRole: true,
            isAdminEmpresa: true,
            empresaId: adminRole.empresa_id,
            roleType: 'admin_empresa',
            canAccessSystem: true
          };
        } else if (entregadorRole) {
          finalPermissions = {
            hasValidRole: true,
            isAdminEmpresa: false,
            empresaId: entregadorRole.empresa_id,
            roleType: 'tecnico',
            canAccessSystem: true
          };
        }
      }
      
      // Fallback para entregador aprovado sem role em user_roles
      if (!finalPermissions.hasValidRole && entregadorData && entregadorData.status === 'aprovado') {
        logger.warn('⚠️ Usando fallback para entregador sem role em user_roles', {
          entregadorId: entregadorData.id,
          empresaId: entregadorData.empresa_id
        });
        
        finalPermissions = {
          hasValidRole: true,
          isAdminEmpresa: entregadorData.perfil === 'admin',
          empresaId: entregadorData.empresa_id,
          roleType: entregadorData.perfil === 'admin' ? 'admin_empresa' : 'tecnico',
          canAccessSystem: true
        };
      }

      logger.info('🔒 Permissões finais determinadas', { 
        permissions: finalPermissions,
        hasUserRoles: (userRoles?.length || 0) > 0,
        hasEntregadorData: !!entregadorData,
        usedFallback: !finalPermissions.hasValidRole && !!entregadorData
      });

      setPermissions(finalPermissions);

    } catch (error) {
      logger.error('💥 Erro inesperado ao verificar permissões', { error });
      setPermissions({
        hasValidRole: false,
        isAdminEmpresa: false,
        empresaId: null,
        roleType: null,
        canAccessSystem: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [user?.id]);

  return { permissions, loading, refetch: fetchUserPermissions };
}
