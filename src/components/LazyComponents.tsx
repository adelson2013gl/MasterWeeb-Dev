import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyWrapper } from "@/components/ErrorBoundary/index";

// Lazy loading dos componentes pesados
export const AdminDashboard = lazy(() => import('@/components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
export const TecnicoDashboard = lazy(() => import('@/components/TecnicoDashboard').then(module => ({ default: module.TecnicoDashboard })));
export const AuthenticatedApp = lazy(() => import('@/components/AuthenticatedApp').then(module => ({ default: module.AuthenticatedApp })));

// Lazy loading de páginas
export const AcessoEmpresa = lazy(() => import('@/pages/AcessoEmpresa'));
export const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
export const CadastroAdminEmpresa = lazy(() => import('@/pages/CadastroAdminEmpresa'));
export const CadastroAdminPublico = lazy(() => import('@/pages/CadastroAdminPublico'));

// Lazy loading dos componentes do tecnico
const LazyPerfilTecnico = lazy(() => 
  import("@/components/tecnico/PerfilTecnico").then(module => ({ 
    default: module.PerfilTecnico 
  }))
);

// Fallback de loading otimizado para componentes
const ComponentSkeleton = ({ title = "Carregando...", compact = false }: { title?: string; compact?: boolean }) => (
  <Card className="glass-card border-glass">
    {!compact && (
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          <Skeleton className="h-5 w-5 rounded-full mr-2" />
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
    )}
    <CardContent className={compact ? "p-4" : "p-6"}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        {!compact && (
          <>
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </>
        )}
      </div>
    </CardContent>
  </Card>
);

// Loading spinner simples para troca rápida de tabs
const SimpleLoader = ({ text = "Carregando..." }: { text?: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="flex flex-col items-center space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  </div>
);

// Componentes com LazyWrapper integrado (Suspense + ErrorBoundary)
export const PerfilTecnicoWithSuspense = ({ onBack, fallback }: { onBack?: () => void; fallback?: React.ReactNode }) => (
  <LazyWrapper 
    componentName="Perfil do Técnico"
    loadingComponent={fallback || <ComponentSkeleton title="Carregando perfil..." />}
    autoRetry={true}
    maxRetries={3}
  >
    <LazyPerfilTecnico onBack={onBack} />
  </LazyWrapper>
);

// Export dos loaders
export { ComponentSkeleton, SimpleLoader };
