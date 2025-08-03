
import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/performance';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações diferenciadas por tipo de dados
      staleTime: 5 * 60 * 1000, // 5 minutos - padrão para dados dinâmicos
      gcTime: 30 * 60 * 1000, // 30 minutos - aumentado para melhor cache
      retry: (failureCount, error: any) => {
        // Não tentar novamente para erros de autenticação
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Não retry para erros 4xx (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Máximo 3 tentativas para erros de rede/servidor
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Máximo 10s
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: 'online',
      // Estrutura hierárquica para invalidação inteligente
      structuralSharing: true,
      // Background refetch para dados críticos
      refetchInterval: false,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Retry apenas para erros de rede, não para erros de validação
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
      networkMode: 'online',
      // Invalidar queries relacionadas automaticamente
      onSuccess: (data, variables, context) => {
        performanceMonitor.measureQueryPerformance('mutation_success', Date.now() - (context?.startTime || Date.now()));
      },
      onError: (error, variables, context) => {
        logger.error('Mutation failed', { error, variables }, 'QUERY');
      },
    },
  },
});

// Configurar listeners para debugging em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  // Query cache listeners
  queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === 'observerResultsUpdated') {
      const query = event.query;
      logger.debug('Query atualizada', {
        queryKey: query.queryKey,
        dataUpdatedAt: query.state.dataUpdatedAt,
        error: query.state.error,
      }, 'QUERY');
    }
  });

  // Mutation cache listeners para erros e sucessos
  queryClient.getMutationCache().subscribe((event) => {
    if (event?.type === 'updated') {
      const mutation = event.mutation;
      
      if (mutation.state.status === 'error') {
        logger.error('Erro na mutation', { 
          error: mutation.state.error,
          variables: mutation.state.variables 
        }, 'QUERY');
      }
      
      if (mutation.state.status === 'success') {
        logger.debug('Mutation executada com sucesso', { 
          variables: mutation.state.variables 
        }, 'QUERY');
      }
    }
  });
}

// Utility functions for optimized caching strategies
export const QueryKeys = {
  // Dados estáticos que mudam raramente
  static: {
    regioes: ['regioes'] as const,
    cidades: ['cidades'] as const,
    turnos: ['turnos'] as const,
    configuracoes: ['configuracoes'] as const,
  },
  // Dados dinâmicos que mudam frequentemente
  dynamic: {
    agendas: (filters?: Record<string, any>) => ['agendas', filters] as const,
    agendamentos: (params?: Record<string, any>) => ['agendamentos', params] as const,
    entregadores: (status?: string) => ['entregadores', status] as const,
    dashboard: ['dashboard'] as const,
    reservas: ['reservas'] as const,
  },
  // Dados específicos por usuário
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    permissions: (userId: string) => ['user', 'permissions', userId] as const,
    notifications: (userId: string) => ['user', 'notifications', userId] as const,
  },
  // Dados específicos por empresa
  empresa: {
    data: (empresaId: string) => ['empresa', empresaId] as const,
    stats: (empresaId: string) => ['empresa', 'stats', empresaId] as const,
    billing: (empresaId: string) => ['empresa', 'billing', empresaId] as const,
  },
} as const;

// Funções para invalidação inteligente
export const invalidateQueries = {
  // Invalidar após mudanças em agendas
  afterAgendaUpdate: () => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.dynamic.agendas() });
    queryClient.invalidateQueries({ queryKey: QueryKeys.dynamic.dashboard });
    queryClient.invalidateQueries({ queryKey: QueryKeys.dynamic.reservas });
  },
  
  // Invalidar após mudanças em agendamentos
  afterAgendamentoUpdate: () => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.dynamic.agendamentos() });
    queryClient.invalidateQueries({ queryKey: QueryKeys.dynamic.agendas() });
    queryClient.invalidateQueries({ queryKey: QueryKeys.dynamic.dashboard });
  },
  
  // Invalidar dados de usuário
  afterUserUpdate: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.user.profile(userId) });
    queryClient.invalidateQueries({ queryKey: QueryKeys.user.permissions(userId) });
  },
  
  // Invalidar dados estáticos (uso raro)
  staticData: () => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.static.regioes });
    queryClient.invalidateQueries({ queryKey: QueryKeys.static.cidades });
    queryClient.invalidateQueries({ queryKey: QueryKeys.static.turnos });
  },
};

// Prefetch strategies para melhor UX
export const prefetchStrategies = {
  // Prefetch dados estáticos no inicio
  initializeStaticData: async () => {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: QueryKeys.static.regioes,
        staleTime: 60 * 60 * 1000, // 1 hora para dados estáticos
        gcTime: 2 * 60 * 60 * 1000, // 2 horas
      }),
      queryClient.prefetchQuery({
        queryKey: QueryKeys.static.turnos,
        staleTime: 60 * 60 * 1000,
        gcTime: 2 * 60 * 60 * 1000,
      }),
    ]);
  },
  
  // Prefetch dados do dashboard
  prefetchDashboard: async () => {
    await queryClient.prefetchQuery({
      queryKey: QueryKeys.dynamic.dashboard,
      staleTime: 2 * 60 * 1000, // 2 minutos
    });
  },
};

// Cache warming para dados frequentemente acessados
export const warmCache = {
  // Aquecer cache para agendas do período atual
  currentPeriodAgendas: async () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    await queryClient.prefetchQuery({
      queryKey: QueryKeys.dynamic.agendas({ 
        dataInicio: today.toISOString().split('T')[0],
        dataFim: nextWeek.toISOString().split('T')[0]
      }),
      staleTime: 3 * 60 * 1000, // 3 minutos
    });
  },
};
