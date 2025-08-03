
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Interfaces TypeScript para administradores
export interface AdminData {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin';
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';
  empresa_id: string;
  empresa_nome?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminRequest {
  nome: string;
  email: string;
  senha: string;
  empresa_id: string;
  codigo_acesso?: string;
}

export interface UpdateAdminRequest {
  nome?: string;
  status?: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';
}

export interface AdminFilters {
  search?: string;
  empresa_id?: string;
  status?: string;
}

interface CreateEntregadorData {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cidade_id: string;
  empresa_id: string;
  senha: string;
}

class AdminManagementService {
  // Método existente para criar entregadores
  async createEntregador(data: CreateEntregadorData, allowedEmpresaIds: string[]) {
    try {
      logger.info('🚀 ADMIN_SERVICE: Iniciando criação de entregador', {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        cpf: data.cpf,
        cidade_id: data.cidade_id,
        empresa_id: data.empresa_id,
        allowedEmpresaIds: allowedEmpresaIds.length
      });

      // Validar permissões
      if (!allowedEmpresaIds.includes(data.empresa_id)) {
        throw new Error('Sem permissão para criar entregador nesta empresa');
      }

      logger.info('✅ ADMIN_SERVICE: Permissões validadas');

      // Preparar dados para Edge Function
      const requestData = {
        nome: data.nome.trim(),
        email: data.email.toLowerCase().trim(),
        telefone: data.telefone.trim(),
        cpf: data.cpf.replace(/\D/g, ''),
        cidade_id: data.cidade_id,
        empresa_id: data.empresa_id,
        senha: data.senha
      };

      logger.info('📤 ADMIN_SERVICE: Enviando dados para Edge Function', {
        dados: {
          nome: requestData.nome,
          email: requestData.email,
          telefone: requestData.telefone,
          cpf: `${requestData.cpf.substring(0, 3)}***`,
          cidade_id: requestData.cidade_id,
          empresa_id: requestData.empresa_id,
          temSenha: !!requestData.senha
        }
      });

      // Tentar Edge Function primeiro, se falhar usar método direto
      let result, error;
      
      try {
        const edgeResponse = await supabase.functions.invoke('create-entregador', {
          body: requestData
        });
        result = edgeResponse.data;
        error = edgeResponse.error;
      } catch (edgeError) {
        logger.warn('⚠️ ADMIN_SERVICE: Edge Function falhou, usando método direto', {
          edgeError: edgeError.message
        });
        
        // FALLBACK: Criar entregador diretamente
        return await this.createEntregadorDirect(requestData);
      }

      if (error) {
        logger.error('❌ ADMIN_SERVICE: Erro na Edge Function', {
          error: error.message,
          details: error
        });
        throw error;
      }

      if (!result?.success) {
        logger.error('❌ ADMIN_SERVICE: Edge Function retornou erro', {
          result,
          message: result?.error || result?.message
        });
        throw new Error(result?.error || result?.message || 'Erro desconhecido');
      }

      logger.info('✅ ADMIN_SERVICE: Entregador criado com sucesso', {
        entregador_id: result.data?.entregador_id,
        user_id: result.data?.user_id,
        nome: result.data?.nome,
        email: result.data?.email
      });

      return result;

    } catch (error) {
      logger.error('❌ ADMIN_SERVICE: Erro geral na criação', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        dados: {
          nome: data.nome,
          email: data.email,
          empresa_id: data.empresa_id
        }
      });
      throw error;
    }
  }

  // Novo método para criar administradores
  async createAdmin(data: CreateAdminRequest, allowedEmpresaIds: string[]) {
    try {
      logger.info('🚀 ADMIN_SERVICE: Iniciando criação de administrador', {
        nome: data.nome,
        email: data.email,
        empresa_id: data.empresa_id,
        allowedEmpresaIds: allowedEmpresaIds.length
      });

      // Validar permissões
      if (!allowedEmpresaIds.includes(data.empresa_id)) {
        throw new Error('Sem permissão para criar administrador nesta empresa');
      }

      // Verificar se o email já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('entregadores')
        .select('email')
        .eq('email', data.email.toLowerCase().trim())
        .single();

      if (existingUser) {
        throw new Error('Email já cadastrado no sistema');
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: data.nome
          }
        }
      });

      if (authError) {
        logger.error('❌ ADMIN_SERVICE: Erro ao criar usuário Auth', {
          error: authError.message
        });
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado no sistema de autenticação');
      }

      // Inserir administrador na tabela entregadores
      const { data: adminData, error: adminError } = await supabase
        .from('entregadores')
        .insert({
          user_id: authData.user.id,
          nome: data.nome.trim(),
          email: data.email.toLowerCase().trim(),
          telefone: '', // Campo obrigatório, vazio para admin
          cpf: '', // Campo obrigatório, vazio para admin
          cidade_id: null, // Não obrigatório para admin
          empresa_id: data.empresa_id,
          perfil: 'admin',
          status: 'pendente' // Administradores precisam ser aprovados manualmente
        })
        .select()
        .single();

      if (adminError) {
        logger.error('❌ ADMIN_SERVICE: Erro ao inserir administrador', {
          error: adminError.message
        });
        
        // Tentar limpar o usuário criado na auth
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          logger.error('❌ ADMIN_SERVICE: Erro ao limpar usuário Auth', cleanupError);
        }
        
        throw new Error(`Erro ao criar administrador: ${adminError.message}`);
      }

      // Criar role de administrador
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          empresa_id: data.empresa_id,
          role: 'admin_empresa'
        });

      if (roleError) {
        logger.error('❌ ADMIN_SERVICE: Erro ao criar role', {
          error: roleError.message
        });
        // Não falha por causa da role, mas loga o erro
      }

      logger.info('✅ ADMIN_SERVICE: Administrador criado com sucesso', {
        admin_id: adminData.id,
        user_id: authData.user.id,
        nome: adminData.nome,
        email: adminData.email
      });

      return {
        success: true,
        message: 'Administrador criado com sucesso!',
        admin_id: adminData.id,
        user_id: authData.user.id
      };

    } catch (error) {
      logger.error('❌ ADMIN_SERVICE: Erro geral na criação de admin', {
        error: error instanceof Error ? error.message : error,
        dados: {
          nome: data.nome,
          email: data.email,
          empresa_id: data.empresa_id
        }
      });
      throw error;
    }
  }

  // Listar administradores
  async listAdmins(allowedEmpresaIds: string[], filters?: AdminFilters): Promise<AdminData[]> {
    try {
      logger.info('📋 ADMIN_SERVICE: Listando administradores', {
        allowedEmpresaIds: allowedEmpresaIds.length,
        filters
      });

      let query = supabase
        .from('entregadores')
        .select(`
          *,
          empresas!inner(nome)
        `)
        .eq('perfil', 'admin')
        .in('empresa_id', allowedEmpresaIds)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.empresa_id) {
        query = query.eq('empresa_id', filters.empresa_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ ADMIN_SERVICE: Erro ao listar administradores', {
          error: error.message
        });
        throw new Error(`Erro ao carregar administradores: ${error.message}`);
      }

      // Transformar dados para o formato esperado
      const admins: AdminData[] = (data || []).map(admin => ({
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        perfil: 'admin' as const,
        status: admin.status,
        empresa_id: admin.empresa_id,
        empresa_nome: admin.empresas?.nome || 'Empresa não encontrada',
        user_id: admin.user_id,
        created_at: admin.created_at,
        updated_at: admin.updated_at
      }));

      logger.info('✅ ADMIN_SERVICE: Administradores listados com sucesso', {
        count: admins.length
      });

      return admins;

    } catch (error) {
      logger.error('❌ ADMIN_SERVICE: Erro geral ao listar admins', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  // Buscar empresas disponíveis
  async getAvailableEmpresas(allowedEmpresaIds: string[]): Promise<Array<{ id: string; nome: string }>> {
    try {
      logger.info('🏢 ADMIN_SERVICE: Buscando empresas disponíveis', {
        allowedEmpresaIds: allowedEmpresaIds.length
      });

      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .in('id', allowedEmpresaIds)
        .eq('ativa', true)
        .order('nome');

      if (error) {
        logger.error('❌ ADMIN_SERVICE: Erro ao buscar empresas', {
          error: error.message
        });
        throw new Error(`Erro ao carregar empresas: ${error.message}`);
      }

      logger.info('✅ ADMIN_SERVICE: Empresas carregadas com sucesso', {
        count: data?.length || 0
      });

      return data || [];

    } catch (error) {
      logger.error('❌ ADMIN_SERVICE: Erro geral ao buscar empresas', {
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  // Atualizar administrador
  async updateAdmin(adminId: string, updateData: UpdateAdminRequest, allowedEmpresaIds: string[]) {
    try {
      logger.info('✏️ ADMIN_SERVICE: Atualizando administrador', {
        adminId,
        updateData
      });

      // Verificar se o administrador existe e pertence a uma empresa permitida
      const { data: existingAdmin, error: checkError } = await supabase
        .from('entregadores')
        .select('empresa_id, perfil')
        .eq('id', adminId)
        .eq('perfil', 'admin')
        .single();

      if (checkError || !existingAdmin) {
        throw new Error('Administrador não encontrado');
      }

      if (!allowedEmpresaIds.includes(existingAdmin.empresa_id)) {
        throw new Error('Sem permissão para editar este administrador');
      }

      // Atualizar dados
      const { data, error } = await supabase
        .from('entregadores')
        .update(updateData)
        .eq('id', adminId)
        .select()
        .single();

      if (error) {
        logger.error('❌ ADMIN_SERVICE: Erro ao atualizar administrador', {
          error: error.message
        });
        throw new Error(`Erro ao atualizar administrador: ${error.message}`);
      }

      logger.info('✅ ADMIN_SERVICE: Administrador atualizado com sucesso', {
        adminId,
        updatedFields: Object.keys(updateData)
      });

      return data;

    } catch (error) {
      logger.error('❌ ADMIN_SERVICE: Erro geral ao atualizar admin', {
        error: error instanceof Error ? error.message : error,
        adminId
      });
      throw error;
    }
  }

  // Excluir administrador
  async deleteAdmin(adminId: string, allowedEmpresaIds: string[]) {
    try {
      logger.info('🗑️ ADMIN_SERVICE: Excluindo administrador', {
        adminId
      });

      // Verificar se o administrador existe e pertence a uma empresa permitida
      const { data: existingAdmin, error: checkError } = await supabase
        .from('entregadores')
        .select('empresa_id, perfil, user_id')
        .eq('id', adminId)
        .eq('perfil', 'admin')
        .single();

      if (checkError || !existingAdmin) {
        throw new Error('Administrador não encontrado');
      }

      if (!allowedEmpresaIds.includes(existingAdmin.empresa_id)) {
        throw new Error('Sem permissão para excluir este administrador');
      }

      // Excluir da tabela entregadores
      const { error: deleteError } = await supabase
        .from('entregadores')
        .delete()
        .eq('id', adminId);

      if (deleteError) {
        logger.error('❌ ADMIN_SERVICE: Erro ao excluir administrador', {
          error: deleteError.message
        });
        throw new Error(`Erro ao excluir administrador: ${deleteError.message}`);
      }

      // Tentar excluir o usuário do Auth (opcional, pode falhar)
      try {
        await supabase.auth.admin.deleteUser(existingAdmin.user_id);
      } catch (authError) {
        logger.warn('⚠️ ADMIN_SERVICE: Não foi possível excluir usuário Auth', {
          error: authError
        });
        // Não falha por causa disso
      }

      logger.info('✅ ADMIN_SERVICE: Administrador excluído com sucesso', {
        adminId
      });

      return { success: true };

    } catch (error) {
      logger.error('❌ ADMIN_SERVICE: Erro geral ao excluir admin', {
        error: error instanceof Error ? error.message : error,
        adminId
      });
      throw error;
    }
  }

  // Método para criar entregador diretamente (fallback quando Edge Function falha)
  private async createEntregadorDirect(data: any) {
    try {
      logger.info('🔄 ADMIN_SERVICE: Criando entregador via método direto', {
        nome: data.nome,
        email: data.email
      });

      // 1. Criar usuário na Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.senha,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          nome: data.nome,
          perfil: 'entregador'
        }
      });

      if (authError) {
        logger.error('❌ ADMIN_SERVICE: Erro ao criar usuário Auth', authError);
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      logger.info('✅ ADMIN_SERVICE: Usuário Auth criado', { 
        user_id: authData.user.id,
        email: authData.user.email 
      });

      // 2. Criar entregador na tabela
      const { data: entregadorData, error: entregadorError } = await supabase
        .from('entregadores')
        .insert({
          user_id: authData.user.id,
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          cpf: data.cpf,
          cidade_id: data.cidade_id,
          empresa_id: data.empresa_id,
          perfil: 'entregador',
          status: 'pendente',
          estrelas: 5 // Padrão para novos entregadores
        })
        .select()
        .single();

      if (entregadorError) {
        logger.error('❌ ADMIN_SERVICE: Erro ao criar entregador', entregadorError);
        
        // Limpar usuário Auth criado
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          logger.error('❌ ADMIN_SERVICE: Erro ao limpar usuário Auth', cleanupError);
        }
        
        throw new Error(`Erro ao criar entregador: ${entregadorError.message}`);
      }

      // 3. Criar role de entregador
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          empresa_id: data.empresa_id,
          role: 'entregador'
        });

      if (roleError) {
        logger.warn('⚠️ ADMIN_SERVICE: Erro ao criar role (não crítico)', roleError);
      }

      logger.info('✅ ADMIN_SERVICE: Entregador criado com sucesso via método direto', {
        entregador_id: entregadorData.id,
        user_id: authData.user.id,
        nome: entregadorData.nome,
        empresa_id: entregadorData.empresa_id
      });

      return {
        success: true,
        message: 'Entregador criado com sucesso',
        data: {
          entregador_id: entregadorData.id,
          user_id: authData.user.id,
          nome: entregadorData.nome,
          email: entregadorData.email
        }
      };

    } catch (error) {
      logger.error('❌ ADMIN_SERVICE: Erro no método direto', error);
      throw error;
    }
  }
}

export const adminManagementService = new AdminManagementService();
