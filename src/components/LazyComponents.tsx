import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyWrapper } from "@/components/ErrorBoundary/index";

// Lazy loading dos componentes pesados
export const AdminDashboard = lazy(() => import('@/components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
export const EntregadorDashboard = lazy(() => import('@/components/EntregadorDashboard').then(module => ({ default: module.EntregadorDashboard })));
export const AuthenticatedApp = lazy(() => import('@/components/AuthenticatedApp').then(module => ({ default: module.AuthenticatedApp })));

// Lazy loading de páginas
export const AcessoEmpresa = lazy(() => import('@/pages/AcessoEmpresa'));
export const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
export const CadastroAdminEmpresa = lazy(() => import('@/pages/CadastroAdminEmpresa'));
export const CadastroAdminPublico = lazy(() => import('@/pages/CadastroAdminPublico'));

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

// Lazy loading dos componentes do entregador
export const LazyAgendamentoCalendar = lazy(() => 
  import("@/components/entregador/AgendamentoCalendar").then(module => ({ 
    default: module.AgendamentoCalendar 
  }))
);

export const LazyMeusAgendamentos = lazy(() => 
  import("@/components/entregador/MeusAgendamentos").then(module => ({ 
    default: module.MeusAgendamentos 
  }))
);

export const LazyStatusReservas = lazy(() => 
  import("@/components/entregador/StatusReservas").then(module => ({ 
    default: module.StatusReservas 
  }))
);

export const LazyNotificacoesReservas = lazy(() => 
  import("@/components/entregador/NotificacoesReservas").then(module => ({ 
    default: module.NotificacoesReservas 
  }))
);

export const LazyTimelineAgendamentos = lazy(() => 
  import("@/components/entregador/TimelineAgendamentos").then(module => ({ 
    default: module.TimelineAgendamentos 
  }))
);

// Componentes com LazyWrapper integrado (Suspense + ErrorBoundary)
export const AgendamentoCalendarWithSuspense = ({ fallback }: { fallback?: React.ReactNode }) => (
  <LazyWrapper 
    componentName="Calendário de Agendamento"
    loadingComponent={fallback || <ComponentSkeleton title="Carregando agendas..." />}
    autoRetry={true}
    maxRetries={3}
  >
    <LazyAgendamentoCalendar />
  </LazyWrapper>
);

export const MeusAgendamentosWithSuspense = ({ onNavigate, fallback }: { onNavigate?: (tab: string) => void; fallback?: React.ReactNode }) => (
  <LazyWrapper 
    componentName="Meus Agendamentos"
    loadingComponent={fallback || <ComponentSkeleton title="Carregando seus agendamentos..." />}
    autoRetry={true}
    maxRetries={3}
  >
    <LazyMeusAgendamentos onNavigate={onNavigate} />
  </LazyWrapper>
);

export const StatusReservasWithSuspense = ({ fallback }: { fallback?: React.ReactNode }) => (
  <LazyWrapper 
    componentName="Status das Reservas"
    loadingComponent={fallback || <ComponentSkeleton title="Carregando reservas..." />}
    autoRetry={true}
    maxRetries={3}
  >
    <LazyStatusReservas />
  </LazyWrapper>
);

export const NotificacoesReservasWithSuspense = ({ fallback }: { fallback?: React.ReactNode }) => (
  <LazyWrapper 
    componentName="Notificações de Reservas"
    loadingComponent={fallback || <ComponentSkeleton title="Carregando notificações..." />}
    autoRetry={true}
    maxRetries={3}
  >
    <LazyNotificacoesReservas />
  </LazyWrapper>
);

export const TimelineAgendamentosWithSuspense = ({ onViewAll, fallback }: { onViewAll?: () => void; fallback?: React.ReactNode }) => (
  <LazyWrapper 
    componentName="Timeline de Agendamentos"
    loadingComponent={fallback || <ComponentSkeleton title="Carregando timeline..." compact />}
    autoRetry={true}
    maxRetries={3}
  >
    <LazyTimelineAgendamentos onViewAll={onViewAll} />
  </LazyWrapper>
);

// Export dos loaders
export { ComponentSkeleton, SimpleLoader };
