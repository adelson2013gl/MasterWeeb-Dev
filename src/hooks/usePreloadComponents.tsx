import { useEffect } from 'react';

// Hook para precarregar componentes baseado no comportamento do usuário
export function usePreloadComponents() {
  useEffect(() => {
    // Precarregar componentes mais usados após 2 segundos
    const preloadTimer = setTimeout(() => {
      // Precarregar AgendamentoCalendar (mais usado pelos tecnicos)
      import("@/components/tecnico/AgendamentoCalendar").catch(() => {
        // Falha silenciosa - não queremos quebrar a app
      });

      // Precarregar MeusAgendamentos (segundo mais usado)
      setTimeout(() => {
        import("@/components/tecnico/MeusAgendamentos").catch(() => {});
      }, 500);

    }, 2000);

    return () => clearTimeout(preloadTimer);
  }, []);

  // Hook para precarregar quando usuário mostra intenção de navegar
  const preloadOnHover = (componentName: string) => {
    switch (componentName) {
      case 'agendar':
        import("@/components/tecnico/AgendamentoCalendar").catch(() => {});
        break;
      case 'agendamentos':
        import("@/components/tecnico/MeusAgendamentos").catch(() => {});
        break;
      case 'reservas':
        import("@/components/tecnico/StatusReservas").catch(() => {});
        break;
      case 'notificacoes':
        import("@/components/tecnico/NotificacoesReservas").catch(() => {});
        break;
    }
  };

  return { preloadOnHover };
} 