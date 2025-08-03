
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id: string;
  user_email?: string;
  empresa_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export type AuditAction = 
  | 'admin_created'
  | 'admin_updated'
  | 'admin_approved'
  | 'admin_disapproved'
  | 'admin_deleted'
  | 'admin_login_attempt'
  | 'admin_permission_changed'
  | 'admin_password_reset'
  | 'admin_viewed_list'
  | 'admin_viewed_details';

class AuditLogger {
  private async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return null;
      }
      return user;
    } catch (error) {
      logger.error('Erro ao obter usuário atual para auditoria', { error }, 'AUDIT');
      return null;
    }
  }

  private async getUserDetails(userId: string) {
    try {
      const { data, error } = await supabase
        .from('entregadores')
        .select('email, empresa_id')
        .eq('user_id', userId) // Corrigido: usar user_id em vez de id
        .single();
      
      if (error) {
        logger.warn('Erro ao buscar detalhes do usuário para auditoria', { 
          error: error.message, 
          userId 
        }, 'AUDIT');
        return { email: undefined, empresa_id: undefined };
      }
      
      return { email: data?.email, empresa_id: data?.empresa_id };
    } catch (error) {
      logger.error('Erro ao buscar detalhes do usuário para auditoria', { 
        error, 
        userId 
      }, 'AUDIT');
      return { email: undefined, empresa_id: undefined };
    }
  }

  private getBrowserInfo() {
    if (typeof window === 'undefined') {
      return { ip_address: undefined, user_agent: undefined };
    }
    
    return {
      ip_address: undefined, // IP será obtido no backend se necessário
      user_agent: navigator.userAgent
    };
  }

  /**
   * Registra uma ação de auditoria
   */
  async log(
    action: AuditAction,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        logger.warn('Tentativa de log de auditoria sem usuário autenticado', {
          action,
          resourceType,
          resourceId
        }, 'AUDIT');
        return;
      }

      const userDetails = await this.getUserDetails(user.id);
      const browserInfo = this.getBrowserInfo();

      const auditEntry: AuditLogEntry = {
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        user_id: user.id,
        user_email: userDetails.email,
        empresa_id: userDetails.empresa_id,
        details: details ? this.sanitizeDetails(details) : undefined,
        ...browserInfo
      };

      // Log estruturado para auditoria
      logger.info('Ação de auditoria registrada', {
        action,
        resourceType,
        resourceId,
        userId: user.id,
        userEmail: userDetails.email,
        empresaId: userDetails.empresa_id
      }, 'AUDIT');

      // TODO: Implementar persistência em tabela de auditoria quando necessário

    } catch (error) {
      logger.error('Erro ao registrar ação de auditoria', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        action,
        resourceType,
        resourceId
      }, 'AUDIT');
    }
  }

  /**
   * Remove informações sensíveis dos detalhes antes de logar
   */
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remover campos sensíveis
    const sensitiveFields = ['senha', 'password', 'token', 'secret', 'key'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Limitar tamanho dos valores para evitar logs muito grandes
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
        sanitized[key] = sanitized[key].substring(0, 500) + '...[TRUNCATED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Métodos de conveniência para ações específicas
   */
  async logAdminCreated(adminId: string, adminData: { nome: string; email: string; empresa_id: string }) {
    logger.info('Admin criado', {
      adminId,
      adminNome: adminData.nome,
      adminEmail: adminData.email,
      empresaId: adminData.empresa_id
    }, 'AUDIT');
    
    await this.log('admin_created', 'administrator', adminId, {
      admin_nome: adminData.nome,
      admin_email: adminData.email,
      admin_empresa_id: adminData.empresa_id
    });
  }

  async logAdminUpdated(adminId: string, changes: Record<string, any>) {
    logger.info('Admin atualizado', {
      adminId,
      changesCount: Object.keys(changes).length
    }, 'AUDIT');
    
    await this.log('admin_updated', 'administrator', adminId, {
      changes: changes
    });
  }

  async logAdminDeleted(adminId: string, adminData: { nome: string; email: string; empresa_id: string }) {
    logger.warn('Admin excluído', {
      adminId,
      adminNome: adminData.nome,
      adminEmail: adminData.email,
      empresaId: adminData.empresa_id
    }, 'AUDIT');
    
    await this.log('admin_deleted', 'administrator', adminId, {
      admin_nome: adminData.nome,
      admin_email: adminData.email,
      admin_empresa_id: adminData.empresa_id,
      details: `Admin ${adminData.nome} (${adminData.email}) foi excluído`
    });
  }

  async logAdminStatusChanged(adminId: string, status: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso', adminEmail: string) {
    logger.info('Status do admin alterado', {
      adminId,
      adminEmail,
      newStatus: status
    }, 'AUDIT');
    
    await this.log(
      status === 'aprovado' ? 'admin_approved' :
      status === 'rejeitado' ? 'admin_disapproved' : 
      'admin_updated' as AuditAction,
      'administrator',
      adminId,
      {
        admin_email: adminEmail,
        new_status: status,
        details: `Admin ${adminEmail} teve status alterado para ${status}`
      }
    );
  }

  async logAdminListViewed(filters?: Record<string, any>) {
    logger.debug('Lista de admins visualizada', {
      hasFilters: !!filters,
      filtersCount: filters ? Object.keys(filters).length : 0
    }, 'AUDIT');
    
    await this.log('admin_viewed_list', 'administrator', undefined, {
      filters: filters
    });
  }

  async logAdminDetailsViewed(adminId: string) {
    logger.debug('Detalhes do admin visualizados', { adminId }, 'AUDIT');
    await this.log('admin_viewed_details', 'administrator', adminId);
  }

  async logPermissionChanged(targetUserId: string, oldPermissions: any, newPermissions: any) {
    logger.info('Permissões alteradas', {
      targetUserId,
      hasOldPermissions: !!oldPermissions,
      hasNewPermissions: !!newPermissions
    }, 'AUDIT');
    
    await this.log('admin_permission_changed', 'administrator', targetUserId, {
      old_permissions: oldPermissions,
      new_permissions: newPermissions
    });
  }
}

// Instância singleton
export const auditLogger = new AuditLogger();
export default auditLogger;

// Função auxiliar para uso direto
export const logAuditAction = (
  action: AuditAction,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
) => {
  return auditLogger.log(action, resourceType, resourceId, details);
};
