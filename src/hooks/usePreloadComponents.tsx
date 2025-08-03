import { useEffect } from 'react';

// Hook para precarregar componentes baseado no comportamento do usuário
export function usePreloadComponents() {
  useEffect(() => {
    // Precarregar componentes mais usados após 2 segundos
    const preloadTimer = setTimeout(() => {
      // Precarregar AgendamentoCalendar (mais usado pelos entregadores)
      import("@/components/entregador/AgendamentoCalendar").catch(() => {
        // Falha silenciosa - não queremos quebrar a app
      });

      // Precarregar MeusAgendamentos (segundo mais usado)
      setTimeout(() => {
        import("@/components/entregador/MeusAgendamentos").catch(() => {});
      }, 500);

    }, 2000);

    return () => clearTimeout(preloadTimer);
  }, []);

  // Hook para precarregar quando usuário mostra intenção de navegar
  const preloadOnHover = (componentName: string) => {
    switch (componentName) {
      case 'agendar':
        import("@/components/entregador/AgendamentoCalendar").catch(() => {});
        break;
      case 'agendamentos':
        import("@/components/entregador/MeusAgendamentos").catch(() => {});
        break;
      case 'reservas':
        import("@/components/entregador/StatusReservas").catch(() => {});
        break;
      case 'notificacoes':
        import("@/components/entregador/NotificacoesReservas").catch(() => {});
        break;
    }
  };

  return { preloadOnHover };
} 