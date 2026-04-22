
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

interface CreateTecnicoData {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  setor_id: string;
  empresa_id: string;
  senha: string;
}

class AdminManagementService {
  // Método existente para criar tecnicos
  async createTecnico(data: CreateTecnicoData, allowedEmpresaIds: string[]) {
    try {
      logger.info('🚀 ADMIN_SERVICE: Iniciando criação de tecnico', {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        cpf: data.cpf,
        setor_id: data.setor_id,
        empresa_id: data.empresa_id,
        allowedEmpresaIds: allowedEmpresaIds.length
      });

      // Validar permissões
      if (!allowedEmpresaIds.includes(data.empresa_id)) {
        throw new Error('Sem permissão para criar tecnico nesta empresa');
      }

      logger.info('✅ ADMIN_SERVICE: Permissões validadas');

      // Preparar dados para Edge Function
      const requestData = {
        nome: data.nome.trim(),
        email: data.email.toLowerCase().trim(),
        telefone: data.telefone.trim(),
        cpf: data.cpf.replace(/\D/g, ''),
        setor_id: data.setor_id,
        empresa_id: data.empresa_id,
        senha: data.senha
      };

      logger.info('📤 ADMIN_SERVICE: Enviando dados para Edge Function', {
        dados: {
          nome: requestData.nome,
          email: requestData.email,
          telefone: requestData.telefone,
          cpf: `${requestData.cpf.substring(0, 3)}***`,
          setor_id: requestData.setor_id,
          empresa_id: requestData.empresa_id,
          temSenha: !!requestData.senha
        }
      });

      // Usar método direto (bypass Edge Function devido a CORS)
      logger.info('🚀 ADMIN_SERVICE: Usando método direto para criar técnico');
      
      const result = await this.createTecnicoDirect(requestData);
      
      logger.info('✅ ADMIN_SERVICE: Tecnico criado com sucesso', {
        tecnico_id: result.data?.tecnico_id,
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
        .from('tecnicos')
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

      // Inserir administrador na tabela tecnicos
      const { data: adminData, error: adminError } = await supabase
        .from('tecnicos')
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
        .from('tecnicos')
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
        .from('tecnicos')
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
        .from('tecnicos')
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
        .from('tecnicos')
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

      // Excluir da tabela tecnicos
      const { error: deleteError } = await supabase
        .from('tecnicos')
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

  // Método para criar tecnico diretamente (fallback quando Edge Function falha)
  private async createTecnicoDirect(data: any) {
    try {
      logger.info('🔄 ADMIN_SERVICE: Criando tecnico via método direto', {
        nome: data.nome,
        email: data.email
      });

      // 1. Criar usuário na Auth usando RPC (roda com privilégios de service role)
      const { data: rpcData, error: rpcError } = await (supabase as any)
        .rpc('admin_create_user', {
          p_email: data.email,
          p_password: data.senha,
          p_user_metadata: {
            nome: data.nome,
            perfil: 'tecnico'
          }
        });

      if (rpcError) {
        logger.error('❌ ADMIN_SERVICE: Erro ao criar usuário Auth via RPC', rpcError);
        throw new Error(`Erro ao criar usuário: ${rpcError.message}`);
      }

      const userId = rpcData[0]?.user_id;
      
      if (!userId) {
        throw new Error('Erro ao criar usuário: ID não retornado');
      }

      logger.info('✅ ADMIN_SERVICE: Usuário Auth criado via RPC', { 
        user_id: userId,
        email: data.email 
      });

      // 2. Criar tecnico na tabela
      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .insert({
          user_id: userId,
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          cpf: data.cpf,
          setor_id: data.setor_id,
          empresa_id: data.empresa_id,
          perfil: 'tecnico',
          status: 'pendente',
          estrelas: 5 // Padrão para novos tecnicos
        })
        .select()
        .single();

      if (tecnicoError) {
        logger.error('❌ ADMIN_SERVICE: Erro ao criar tecnico', tecnicoError);
        throw new Error(`Erro ao criar tecnico: ${tecnicoError.message}`);
      }

      // 3. Criar role de tecnico
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          empresa_id: data.empresa_id,
          role: 'tecnico'
        });

      if (roleError) {
        logger.warn('⚠️ ADMIN_SERVICE: Erro ao criar role (não crítico)', roleError);
      }

      logger.info('✅ ADMIN_SERVICE: Tecnico criado com sucesso via método direto', {
        tecnico_id: tecnicoData.id,
        user_id: userId,
        nome: tecnicoData.nome,
        empresa_id: tecnicoData.empresa_id
      });

      return {
        success: true,
        message: 'Tecnico criado com sucesso',
        data: {
          tecnico_id: tecnicoData.id,
          user_id: userId,
          nome: tecnicoData.nome,
          email: tecnicoData.email
        }
      };

    } catch (error) {
      logger.error('❌ ADMIN_SERVICE: Erro no método direto', error);
      throw error;
    }
  }
}

export const adminManagementService = new AdminManagementService();
