import { useEffect } from 'react';

// Hook para precarregar componentes baseado no comportamento do usuário
export function usePreloadComponents() {
  useEffect(() => {
    // Precarregar componentes mais usados após 2 segundos
    const preloadTimer = setTimeout(() => {
      // Precarregar PerfilTecnico
      import("@/components/tecnico/PerfilTecnico").catch(() => {
        // Falha silenciosa - não queremos quebrar a app
      });
    }, 2000);

    return () => clearTimeout(preloadTimer);
  }, []);

  // Hook para precarregar quando usuário mostra intenção de navegar
  const preloadOnHover = (componentName: string) => {
    switch (componentName) {
      case 'perfil':
        import("@/components/tecnico/PerfilTecnico").catch(() => {});
        break;
    }
  };

  return { preloadOnHover };
} 