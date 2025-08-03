/**
 * Hook customizado para gerenciar filtros do dashboard
 * Extraído do DashboardContent para melhorar separação de responsabilidades
 */

import { useState, useMemo } from 'react';
import { format } from 'date-fns';

export type StatusFilter = "todas" | "ativas" | "inativas";
export type OccupancyFilter = "todas" | "criticas" | "disponiveis" | "lotadas";

export interface DashboardFiltersState {
  dataInicio: Date;
  dataFim: Date;
  filtroStatus: StatusFilter;
  filtroOcupacao: OccupancyFilter;
}

export interface DashboardFiltersActions {
  setDataInicio: (date: Date | undefined) => void;
  setDataFim: (date: Date | undefined) => void;
  setFiltroStatus: (status: StatusFilter) => void;
  setFiltroOcupacao: (ocupacao: OccupancyFilter) => void;
  resetFilters: () => void;
}

export interface AgendaItem {
  id: string;
  ativo: boolean;
  vagas_disponiveis: number;
  vagas_ocupadas?: number;
  agendamentos?: Array<{ status: string }>;
  [key: string]: any;
}

const getDefaultDates = () => {
  const hoje = new Date();
  const seteDias = new Date();
  seteDias.setDate(seteDias.getDate() + 7);
  
  return {
    dataInicio: hoje,
    dataFim: seteDias
  };
};

export function useDashboardFilters() {
  // Estados dos filtros
  const [filters, setFilters] = useState<DashboardFiltersState>(() => ({
    ...getDefaultDates(),
    filtroStatus: "todas",
    filtroOcupacao: "todas"
  }));

  // Formatação das datas para uso em APIs
  const formattedDates = useMemo(() => ({
    dataInicioStr: format(filters.dataInicio, 'yyyy-MM-dd'),
    dataFimStr: format(filters.dataFim, 'yyyy-MM-dd')
  }), [filters.dataInicio, filters.dataFim]);

  // Ações para atualizar filtros
  const actions: DashboardFiltersActions = {
    setDataInicio: (date: Date | undefined) => {
      if (date) {
        setFilters(prev => ({ ...prev, dataInicio: date }));
      }
    },
    
    setDataFim: (date: Date | undefined) => {
      if (date) {
        setFilters(prev => ({ ...prev, dataFim: date }));
      }
    },
    
    setFiltroStatus: (status: StatusFilter) => {
      setFilters(prev => ({ ...prev, filtroStatus: status }));
    },
    
    setFiltroOcupacao: (ocupacao: OccupancyFilter) => {
      setFilters(prev => ({ ...prev, filtroOcupacao: ocupacao }));
    },
    
    resetFilters: () => {
      setFilters({
        ...getDefaultDates(),
        filtroStatus: "todas",
        filtroOcupacao: "todas"
      });
    }
  };

  // Função para filtrar agendas baseado nos filtros atuais
  const filterAgendas = useMemo(() => {
    return (agendas: AgendaItem[]) => {
      let filtered = agendas;
      
      // Filtro por status ativo/inativo
      if (filters.filtroStatus === "ativas") {
        filtered = filtered.filter(agenda => agenda.ativo === true);
      } else if (filters.filtroStatus === "inativas") {
        filtered = filtered.filter(agenda => agenda.ativo === false);
      }
      
      // Filtro por ocupação
      if (filters.filtroOcupacao !== "todas") {
        filtered = filtered.filter((agenda) => {
          const ocupacaoPercentual = agenda.vagas_ocupadas && agenda.vagas_disponiveis
            ? (agenda.vagas_ocupadas / agenda.vagas_disponiveis) * 100
            : 0;
          
          switch (filters.filtroOcupacao) {
            case "disponiveis":
              return ocupacaoPercentual < 80;
            case "criticas":
              return ocupacaoPercentual >= 80 && ocupacaoPercentual < 100;
            case "lotadas":
              return ocupacaoPercentual >= 100;
            default:
              return true;
          }
        });
      }

      return filtered;
    };
  }, [filters.filtroStatus, filters.filtroOcupacao]);

  // Função para calcular estatísticas das agendas
  const calculateStats = useMemo(() => {
    return (agendas: AgendaItem[], agendasFiltradas: AgendaItem[]) => {
      const totalAgendas = agendas.length;
      const agendasAtivas = agendas.filter(a => a.ativo).length;
      const agendasInativas = agendas.filter(a => !a.ativo).length;
      
      const totalVagas = agendasFiltradas.reduce((acc, agenda) => acc + agenda.vagas_disponiveis, 0);
      const vagasOcupadas = agendasFiltradas.reduce((acc, agenda) => {
        return acc + (agenda.vagas_ocupadas || 0);
      }, 0);
      const taxaOcupacao = totalVagas > 0 ? (vagasOcupadas / totalVagas) * 100 : 0;

      const totalReservas = agendasFiltradas.reduce((acc, agenda) => {
        const reservas = agenda.agendamentos?.filter(ag => ag.status === 'pendente').length || 0;
        return acc + reservas;
      }, 0);
      
      const agendasComReservas = agendasFiltradas.filter(agenda => 
        agenda.agendamentos?.some(ag => ag.status === 'pendente')
      ).length;

      return {
        totalAgendas,
        agendasAtivas,
        agendasInativas,
        totalVagas,
        vagasOcupadas,
        taxaOcupacao,
        totalReservas,
        agendasComReservas
      };
    };
  }, []);

  return {
    ...filters,
    ...formattedDates,
    ...actions,
    filterAgendas,
    calculateStats
  };
}