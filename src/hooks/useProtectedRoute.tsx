
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UseProtectedRouteOptions {
  redirectToLogin?: boolean;
  showToast?: boolean;
  requiredRole?: 'admin' | 'entregador' | 'admin_empresa' | 'super_admin';
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { 
    redirectToLogin = false, 
    showToast = true,
    requiredRole 
  } = options;
  
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (showToast) {
        toast.error('Você precisa estar logado para acessar esta página');
      }
      
      if (redirectToLogin) {
        // Em uma implementação futura, redirecionar para login
        console.log('🔒 useProtectedRoute: Redirecionamento para login necessário');
      }
      
      return;
    }

    // Validação de role será implementada quando necessário
    if (requiredRole) {
      console.log(`🔒 useProtectedRoute: Verificação de role ${requiredRole} será implementada`);
    }

  }, [user, loading, redirectToLogin, showToast, requiredRole]);

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  };
}
