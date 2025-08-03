
import { CadastroAdminPublico } from '@/components/admin/CadastroAdminPublico';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function CadastroAdminPublicoPage() {
  // Esta página é pública (não requer autenticação)
  // Mas mantemos o hook para logs de auditoria
  useProtectedRoute({ 
    redirectToLogin: false, 
    showToast: false 
  });

  useEffect(() => {
    // Log de auditoria para acesso à rota administrativa secreta
    logger.info('Acesso à rota administrativa privada', {
      route: '/adelson2013gl',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ip: 'client-side'
    }, 'ADMIN_ACCESS');
  }, []);

  return <CadastroAdminPublico />;
}
