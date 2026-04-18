import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Tecnico } from '@/components/admin/gestao-tecnicos/types';
import { useAuth } from '@/hooks/useAuth';

// Função utilitária para gerar slug a partir do nome da empresa
export function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '')    // Remove caracteres especiais
    .replace(/\s+/g, '-')            // Espaços para hífens
    .replace(/-+/g, '-')              // Remove hífens duplos
    .trim();
}

type Empresa = Database['public']['Tables']['empresas']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

interface EmpresaComRole extends Empresa {
  role: string;
}

interface EmpresaUnificadoContextType {
  empresa: Empresa | null;
  tecnico: Tecnico | null;
  userRole: UserRole | null;
  isSuperAdmin: boolean;
  isAdminEmpresa: boolean;
  isAdmin: boolean;
  loading: boolean;
  empresasDisponiveis: EmpresaComRole[];
  empresasLoading: boolean;
  trocarEmpresa: (empresaId: string) => Promise<void>;
  criarEmpresa: (dadosEmpresa: Partial<Empresa>) => Promise<{ success: boolean; empresaId?: string }>;
  atualizarEmpresa: (empresaId: string, dados: Partial<Empresa>) => Promise<boolean>;
  refetch: () => Promise<void>;
  debugAuth: () => Promise<void>;
}

const EmpresaUnificadoContext = createContext<EmpresaUnificadoContextType | undefined>(undefined);

const EMPRESA_PADRAO_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

export function EmpresaUnificadoProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useAuth();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [tecnico, setTecnico] = useState<Tecnico | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<EmpresaComRole[]>([]);
  const [empresasLoading, setEmpresasLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  // Debug da autenticação
  const debugAuth = async () => {
    try {
      console.log('🔍 DEBUG: Verificando contexto de autenticação...');
      console.log('User:', user?.id);
      console.log('Session:', !!session);
      console.log('Auth UID:', session?.user?.id);
      
      if (!user?.id || !session) {
        console.error('❌ Usuário não autenticado!');
        return;
      }

      // Debug roles específico
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      console.log('🏷️ Roles encontradas:', rolesData);
      if (rolesError) console.error('❌ Erro ao buscar roles:', rolesError);

      // Testar query simples
      const { data: testData, error: testError } = await supabase
        .from('tecnicos')
        .select('id, nome, empresa_id')
        .eq('user_id', user.id)
        .limit(1);

      if (testError) {
        console.error('❌ Erro em query de teste:', testError);
      } else {
        console.log('✅ Query de teste bem-sucedida:', testData);
      }

    } catch (error) {
      console.error('💥 Erro no debug:', error);
    }
  };

  const initializeUserData = async (userId: string) => {
    if (isInitializing) {
      console.log('⏭️ EmpresaUnificado: Já está inicializando, pulando...');
      return;
    }

    setIsInitializing(true);
    setLoading(true);

    try {
      console.log('🔄 EmpresaUnificado: Inicializando dados para user:', userId);

      // Verificar se a sessão é válida
      if (!session || !session.user) {
        console.error('❌ Sessão inválida, não é possível prosseguir');
        setLoading(false);
        setIsInitializing(false);
        return;
      }

      // 1. Buscar tecnico
      console.log('👤 Buscando tecnico...');
      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (tecnicoError) {
        console.error('❌ Erro ao buscar tecnico:', tecnicoError);
        if (tecnicoError.code === '42501') {
          console.log('🔍 Erro RLS detectado, executando debug...');
          await debugAuth();
        }
      }

      if (tecnicoData) {
        console.log('✅ Tecnico encontrado:', tecnicoData.nome);
        setTecnico(tecnicoData);
      } else {
        console.log('⚠️ EmpresaUnificado: Nenhum tecnico encontrado');
        setTecnico(null);
      }

      // 2. Buscar empresa
      const empresaId = tecnicoData?.empresa_id || EMPRESA_PADRAO_ID;
      console.log('🎯 Usando empresa ID:', empresaId);

      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (empresaError) {
        console.error('❌ Erro ao buscar empresa:', empresaError);
        // Fallback para empresa padrão
        if (empresaId !== EMPRESA_PADRAO_ID) {
          console.log('🔄 Tentando empresa padrão como fallback');
          const { data: empresaPadrao } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', EMPRESA_PADRAO_ID)
            .single();
            
          if (empresaPadrao) {
            const empresaTyped: Empresa = {
              ...empresaPadrao
            };
            setEmpresa(empresaTyped);
            console.log('✅ Empresa padrão carregada como fallback');
          }
        }
      } else {
        const empresaTyped: Empresa = {
          ...empresaData
        };
        setEmpresa(empresaTyped);
        console.log('✅ Empresa carregada:', empresaData.nome);
      }

      // 3. CORREÇÃO PRINCIPAL: Buscar role corretamente
      const finalEmpresaId = empresaData?.id || EMPRESA_PADRAO_ID;
      console.log('👑 Buscando role para user:', userId);

      // Buscar TODAS as roles do usuário, não apenas da empresa atual
      const { data: allRolesData, error: allRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      console.log('🏷️ TODAS as roles encontradas:', allRolesData);

      if (allRolesError) {
        console.error('❌ Erro ao buscar roles:', allRolesError);
      }

      // Verificar se é super admin (pode ter role em qualquer empresa)
      const superAdminRole = allRolesData?.find(role => role.role === 'super_admin');
      
      if (superAdminRole) {
        console.log('👑 SUPER ADMIN encontrado!');
        const roleTyped: UserRole = {
          ...superAdminRole,
          role: 'super_admin' as const
        };
        setUserRole(roleTyped);
      } else {
        // Buscar role específica da empresa atual
        const empresaRole = allRolesData?.find(role => role.empresa_id === finalEmpresaId);
        
        if (empresaRole) {
          console.log('✅ Role encontrada para empresa atual:', empresaRole.role);
          const roleTyped: UserRole = {
            ...empresaRole,
            role: empresaRole.role as 'super_admin' | 'admin_empresa' | 'tecnico'
          };
          setUserRole(roleTyped);
        } else {
          console.log('⚠️ Role não encontrada, definindo baseado no perfil do tecnico');
          // CORREÇÃO DE SEGURANÇA: Não assumir admin automaticamente
          let roleType: 'super_admin' | 'admin_empresa' | 'tecnico' = 'tecnico';
          
          // Apenas definir como admin_empresa se explicitamente configurado no banco
          // E nunca assumir super_admin automaticamente
          if (tecnicoData.perfil === 'admin') {
            roleType = 'admin_empresa';
            console.log('👨‍💼 Tecnico é admin, definindo role como admin_empresa');
            console.log('🔒 SEGURANÇA: Role definida pelo perfil do tecnico, não por fallback');
          }
          
          const defaultRole: UserRole = {
            id: '',
            user_id: userId,
            empresa_id: finalEmpresaId,
            role: roleType,
            created_at: new Date().toISOString()
          };
          setUserRole(defaultRole);
        }
      }

      // 4. CORREÇÃO: Buscar empresas disponíveis corretamente para super admin
      console.log('🏢 Buscando empresas disponíveis...');
      const { data: empresasData, error: empresasError } = await supabase
        .rpc('get_user_empresas');

      if (empresasError) {
        console.error('❌ Erro ao buscar empresas:', empresasError);
        
        // Fallback: Se é super admin, buscar TODAS as empresas
        if (superAdminRole) {
          console.log('🔄 Super admin: buscando todas as empresas como fallback');
          const { data: todasEmpresas } = await supabase
            .from('empresas')
            .select('*')
            .eq('ativa', true)
            .order('nome');
            
          if (todasEmpresas) {
            const empresasComRole: EmpresaComRole[] = todasEmpresas.map(emp => ({
              ...emp,
              role: 'super_admin'
            }));
            setEmpresasDisponiveis(empresasComRole);
            console.log('✅ Empresas carregadas para super admin:', empresasComRole.length);
          }
        }
      } else {
        const empresasComRole: EmpresaComRole[] = empresasData?.map(item => ({
          id: item.id,
          nome: item.nome,
          cnpj: null,
          dominio: null,
          logo: null,
          slug: null,
          data_expiracao: null,
          max_entregadores: null,
          max_agendas_mes: null,
          created_at: null,
          updated_at: null,
          role: item.role
        })) || [];
        
        setEmpresasDisponiveis(empresasComRole);
        console.log('✅ Empresas disponíveis:', empresasComRole.length);
      }

      setEmpresasLoading(false);
      console.log('✅ Inicialização concluída com sucesso');

    } catch (error) {
      console.error('💥 Erro na inicialização:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (authLoading) {
        console.log('⏭️ EmpresaUnificado: Aguardando auth...');
        return;
      }

      if (user && session && isMounted) {
        console.log('🚀 Iniciando com usuário autenticado:', user.id);
        await initializeUserData(user.id);
      } else if (isMounted) {
        console.log('👤 EmpresaUnificado: Sem usuário autenticado, finalizando loading');
        setLoading(false);
        setIsInitializing(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('⏰ EmpresaUnificado: Timeout de segurança ativado (5s)');
        setLoading(false);
        setIsInitializing(false);
      }
    }, 5000);

    initialize();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [user, session, authLoading]);

  const trocarEmpresa = async (empresaId: string) => {
    try {
      setLoading(true);
      console.log('🔄 EmpresaUnificado: Trocando para empresa:', empresaId);
      
      // CORREÇÃO: Super admin pode acessar qualquer empresa
      if (!isSuperAdmin) {
        const { data: canAccess, error } = await supabase.rpc('user_can_access_empresa', {
          target_empresa_id: empresaId
        });

        if (error || !canAccess) {
          throw new Error('Você não tem permissão para acessar esta empresa');
        }
      } else {
        console.log('👑 Super admin: acesso liberado para qualquer empresa');
      }

      // Buscar a nova empresa e atualizar o contexto
      const { data: novaEmpresa, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (empresaError) {
        throw empresaError;
      }

      const empresaTyped: Empresa = {
        ...novaEmpresa
      };
      
      setEmpresa(empresaTyped);
      console.log('✅ Empresa trocada para:', novaEmpresa.nome);
      
      toast.success('Empresa alterada com sucesso');
      
    } catch (error) {
      console.error('❌ EmpresaUnificado: Erro ao trocar empresa:', error);
      toast.error('Erro ao trocar empresa');
    } finally {
      setLoading(false);
    }
  };

  const criarEmpresa = async (dadosEmpresa: Partial<Empresa>) => {
    try {
      // CORREÇÃO: Verificar se é super admin
      if (!isSuperAdmin) {
        console.error('🚨 SEGURANÇA: Tentativa de criar empresa sem permissão super_admin');
        toast.error('Acesso negado: Apenas Super Administradores podem criar empresas');
        return { success: false };
      }

      console.log('➕ EmpresaUnificado: Criando nova empresa:', dadosEmpresa.nome);
      console.log('🔒 SEGURANÇA: Usuário autorizado como super_admin');
      
      const slug = generateSlug(dadosEmpresa.nome!);
      const { data, error } = await supabase
        .from('empresas')
        .insert({
          nome: dadosEmpresa.nome!,
          slug,
          cnpj: dadosEmpresa.cnpj,
          dominio: dadosEmpresa.dominio,
          plano: dadosEmpresa.plano || 'basico',
          status: 'ativo',
          max_entregadores: dadosEmpresa.max_entregadores || 50,
          max_agendas_mes: dadosEmpresa.max_agendas_mes || 1000
        })
        .select()
        .single();

      if (error) throw error;

      if (user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            empresa_id: data.id,
            role: 'admin_empresa'
          });

        if (roleError) {
          console.error('⚠️ EmpresaUnificado: Erro ao criar role admin:', roleError);
        }
      }

      if (user?.id) {
        await initializeUserData(user.id);
      }
      
      toast.success(`Empresa "${data.nome}" criada com sucesso`);
      return { success: true, empresaId: data.id };
      
    } catch (error) {
      console.error('💥 EmpresaUnificado: Erro ao criar empresa:', error);
      toast.error('Erro ao criar empresa');
      return { success: false };
    }
  };

  const atualizarEmpresa = async (empresaId: string, dados: Partial<Empresa>) => {
    try {
      console.log('🔄 EmpresaUnificado: Atualizando empresa:', empresaId);
      
      const { error } = await supabase
        .from('empresas')
        .update(dados)
        .eq('id', empresaId);

      if (error) throw error;

      if (empresa?.id === empresaId && user?.id) {
        await initializeUserData(user.id);
      }
      
      toast.success('Empresa atualizada com sucesso');
      return true;
      
    } catch (error) {
      console.error('💥 EmpresaUnificado: Erro ao atualizar empresa:', error);
      toast.error('Erro ao atualizar empresa');
      return false;
    }
  };

  const refetch = async () => {
    if (user?.id && session) {
      await initializeUserData(user.id);
    }
  };

  const isSuperAdmin = userRole?.role === 'super_admin';
  const isAdminEmpresa = userRole?.role === 'admin_empresa' || isSuperAdmin;
  const isAdmin = tecnico?.perfil === 'admin';

  // DEBUG: Log das permissões calculadas
  console.log('🔍 DEBUG Permissões Calculadas:', {
    userRole: userRole?.role,
    isSuperAdmin,
    isAdminEmpresa,
    isAdmin
  });

  const value = {
    empresa,
    tecnico,
    userRole,
    isSuperAdmin,
    isAdminEmpresa,
    isAdmin,
    loading,
    empresasDisponiveis,
    empresasLoading,
    trocarEmpresa,
    criarEmpresa,
    atualizarEmpresa,
    refetch,
    debugAuth,
  };

  return <EmpresaUnificadoContext.Provider value={value}>{children}</EmpresaUnificadoContext.Provider>;
}

export function useEmpresaUnificado() {
  const context = useContext(EmpresaUnificadoContext);
  if (context === undefined) {
    throw new Error('useEmpresaUnificado must be used within an EmpresaUnificadoProvider');
  }
  return context;
}
