
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, userData: Record<string, unknown>) => Promise<{ error: unknown }>;
  signOut: (forceLocal?: boolean) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: unknown }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SEGURANÇA: Obter empresa padrão das variáveis de ambiente
const EMPRESA_PADRAO_ID = import.meta.env.VITE_DEFAULT_COMPANY_ID;

// Validação crítica da empresa padrão
if (!EMPRESA_PADRAO_ID) {
  throw new Error('❌ ERRO CRÍTICO: VITE_DEFAULT_COMPANY_ID não configurado no arquivo .env');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logger.auth('info', 'Inicializando AuthProvider');

    let isMounted = true;

    // Configurar listener primeiro
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        logger.auth('debug', `Auth event: ${event}`, { hasUser: !!session?.user });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Buscar sessão inicial
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.authError('getSession', error);
          throw error;
        }

        if (isMounted) {
          logger.auth('info', 'Sessão inicial carregada', { 
            hasUser: !!session?.user,
            emailDomain: session?.user?.email?.split('@')[1] // Apenas domínio do email
          });
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        logger.authError('initializeAuth', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        logger.auth('warn', 'Timeout de segurança ativado');
        setLoading(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      logger.auth('debug', 'AuthProvider cleanup executado');
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    logger.auth('info', 'Tentativa de login', { emailDomain: email.split('@')[1] });
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.authError('signIn', error, { emailDomain: email.split('@')[1] });
      } else {
        logger.auth('info', 'Login realizado com sucesso', { emailDomain: email.split('@')[1] });
      }
      
      return { error };
    } catch (error: unknown) {
      logger.authError('signIn', error, { emailDomain: email.split('@')[1] });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: Record<string, unknown>) => {
    logger.auth('info', 'Tentativa de cadastro', { emailDomain: email.split('@')[1] });
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        logger.authError('signUp', authError, { emailDomain: email.split('@')[1] });
        return { error: authError };
      }

      if (!authData.user) {
        const error = new Error('Usuário não foi criado');
        logger.authError('signUp', error, { emailDomain: email.split('@')[1] });
        return { error };
      }

      logger.auth('info', 'Usuário criado na auth', { 
        hasUserId: !!authData.user.id,
        emailDomain: email.split('@')[1]
      });
      
      // CORREÇÃO CRÍTICA: Usar empresa_id dos userData ou fallback para empresa padrão
      const empresaId = userData.empresa_id || EMPRESA_PADRAO_ID;
      
      logger.auth('info', 'Cadastrando entregador', { 
        hasUserId: !!authData.user.id,
        emailDomain: email.split('@')[1],
        hasEmpresaId: !!empresaId,
        usandoFallback: !userData.empresa_id
      });
      
      const entregadorData = {
        user_id: authData.user.id,
        nome: userData.nome,
        email: email,
        telefone: userData.telefone,
        cpf: userData.cpf,
        cidade_id: userData.cidade_id,
        empresa_id: empresaId, // Usar o empresa_id correto
        perfil: 'entregador' as const,
        status: 'pendente' as const,
      };

      const { error: entregadorError, data: entregadorCreated } = await supabase
        .from('entregadores')
        .insert(entregadorData)
        .select()
        .single();

      if (entregadorError) {
        logger.authError('signUp', entregadorError, { emailDomain: email.split('@')[1] });
        // Tentar limpar o usuário criado na auth
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          logger.authError('cleanup', cleanupError);
        }
        return { error: entregadorError };
      }
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          empresa_id: empresaId, // Usar o empresa_id correto aqui também
          role: 'entregador'
        });

      if (roleError) {
        logger.authError('createRole', roleError);
      }
      
      logger.auth('info', 'Entregador criado com sucesso', { 
        hasEntregador: !!entregadorCreated,
        hasEmpresaId: !!empresaId 
      });
      return { error: null };

    } catch (error) {
      logger.authError('signUp', error, { emailDomain: email.split('@')[1] });
      return { error };
    }
  };

  const signOut = async (forceLocal = false) => {
    logger.auth('info', 'Tentativa de logout', { forceLocal });
    try {
      // Tentar logout global primeiro, depois local como fallback
      if (!forceLocal) {
        await supabase.auth.signOut({ scope: 'global' });
      } else {
        await supabase.auth.signOut({ scope: 'local' });
      }
      logger.auth('info', 'Logout realizado com sucesso');
    } catch (error: unknown) {
      const authError = error as { status?: number; message?: string };
      // Tratar erro 403 específico do logout
      if (authError?.status === 403 || authError?.message?.includes('Session from session_id claim in JWT does not exist')) {
        if (!forceLocal) {
          logger.auth('warn', 'Erro 403 no logout global, tentando logout local');
          // Tentar logout local como fallback
          return signOut(true);
        }
        
        logger.auth('warn', 'Sessão já invalidada, aplicando limpeza manual');
        
        // **SEGURANÇA**: Limpeza manual sanitizada
        try {
          // 1. Limpar localStorage
          localStorage.clear();
          
          // 2. Limpar sessionStorage  
          sessionStorage.clear();
          
          logger.auth('info', 'Dados locais limpos com sucesso');
          
          // 3. Recarregar a página para forçar nova autenticação
          window.location.reload();
          
        } catch (cleanupError: unknown) {
          logger.authError('cleanup', cleanupError);
          // Fallback: apenas recarregar a página
          window.location.reload();
        }
        
        return;
      }
      
      // Para outros erros, tentar limpeza manual também
      logger.auth('warn', 'Erro no logout, aplicando limpeza manual');
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const updatePassword = async (newPassword: string) => {
    logger.auth('info', 'Tentativa de atualização de senha');
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        logger.authError('updatePassword', error);
      } else {
        logger.auth('info', 'Senha atualizada com sucesso');
      }
      
      return { error };
    } catch (error: unknown) {
      logger.authError('updatePassword', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updatePassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
