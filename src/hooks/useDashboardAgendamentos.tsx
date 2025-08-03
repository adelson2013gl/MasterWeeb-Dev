
import { useAgendasAtivasAdmin } from "./useAgendasAtivasAdmin";

/**
 * Hook simplificado para o dashboard de agendamentos
 * Agora apenas usa o hook de agendas ativas
 * 
 * @deprecated Considere usar useAgendasAtivasAdmin diretamente
 */
export function useDashboardAgendamentos(dataInicio?: string, dataFim?: string) {
  // Hook para agendas ativas com filtros
  const { 
    agendas, 
    loading, 
    refetch 
  } = useAgendasAtivasAdmin(dataInicio, dataFim);

  return { 
    agendamentos: agendas, 
    loading, 
    refetch 
  };
}
