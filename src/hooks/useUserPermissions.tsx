
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

      // Verificar dados do tecnico para fallback
      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('id, empresa_id, perfil, status')
        .eq('user_id', user.id)
        .single();

      if (tecnicoError) {
        logger.error('❌ Erro ao buscar dados do tecnico para permissões', { error: tecnicoError });
      } else {
        logger.info('👤 Dados do tecnico para permissões', { 
          tecnicoId: tecnicoData.id,
          empresaId: tecnicoData.empresa_id,
          perfil: tecnicoData.perfil,
          status: tecnicoData.status
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
        const tecnicoRole = userRoles.find(r => r.role === 'tecnico');

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
        } else if (tecnicoRole) {
          finalPermissions = {
            hasValidRole: true,
            isAdminEmpresa: false,
            empresaId: tecnicoRole.empresa_id,
            roleType: 'tecnico',
            canAccessSystem: true
          };
        }
      }
      
      // Fallback para tecnico aprovado sem role em user_roles
      if (!finalPermissions.hasValidRole && tecnicoData && tecnicoData.status === 'aprovado') {
        logger.warn('⚠️ Usando fallback para tecnico sem role em user_roles', {
          tecnicoId: tecnicoData.id,
          empresaId: tecnicoData.empresa_id
        });
        
        finalPermissions = {
          hasValidRole: true,
          isAdminEmpresa: tecnicoData.perfil === 'admin',
          empresaId: tecnicoData.empresa_id,
          roleType: tecnicoData.perfil === 'admin' ? 'admin_empresa' : 'tecnico',
          canAccessSystem: true
        };
      }

      logger.info('🔒 Permissões finais determinadas', { 
        permissions: finalPermissions,
        hasUserRoles: (userRoles?.length || 0) > 0,
        hasTecnicoData: !!tecnicoData,
        usedFallback: !finalPermissions.hasValidRole && !!tecnicoData
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
