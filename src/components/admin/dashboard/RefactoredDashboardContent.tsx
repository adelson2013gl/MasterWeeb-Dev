/**
 * DashboardContent refatorado - Versão modular e otimizada
 * Quebrado em componentes menores para melhor manutenibilidade
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { MapPin, Eye } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { CardsEstatisticas } from '@/components/admin/CardsEstatisticas';
import { CardReservasAtivas } from '@/components/admin/CardReservasAtivas';
import { useAgendasAtivasAdmin } from '@/hooks/useAgendasAtivasAdmin';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { DashboardFilters } from './DashboardFilters';
import { DashboardStats } from './DashboardStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente para filtros rápidos
const QuickFilters = React.memo(({ onQuick7Days, onQuick30Days, onReset }: {
  onQuick7Days: () => void;
  onQuick30Days: () => void;
  onReset: () => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Filtros Rápidos</CardTitle>
    </CardHeader>
    <CardContent className="flex gap-2 flex-wrap">
      <Button variant="outline" onClick={onQuick7Days} size="sm">
        Próximos 7 dias
      </Button>
      <Button variant="outline" onClick={onQuick30Days} size="sm">
        Próximos 30 dias
      </Button>
      <Button variant="outline" onClick={onReset} size="sm">
        Resetar Filtros
      </Button>
    </CardContent>
  </Card>
));

// Componente para a tabela de agendas
const AgendasTable = React.memo(({ agendas, loading }: {
  agendas: any[];
  loading: boolean;
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agendas por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (ativo: boolean) => (
    <Badge variant={ativo ? "default" : "secondary"}>
      {ativo ? "Ativa" : "Inativa"}
    </Badge>
  );

  const getOcupacaoBadge = (ocupada: number, disponivel: number) => {
    const percentual = disponivel > 0 ? (ocupada / disponivel) * 100 : 0;
    
    if (percentual >= 100) {
      return <Badge variant="destructive">Lotada</Badge>;
    } else if (percentual >= 80) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Crítica</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-700">Disponível</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendas por Período</CardTitle>
        <CardDescription>
          Lista detalhada das agendas filtradas ({agendas.length} resultados)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agenda</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Ocupação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma agenda encontrada para os filtros selecionados
                  </TableCell>
                </TableRow>
              ) : (
                agendas.map((agenda) => {
                  const ocupacaoPercentual = agenda.vagas_ocupadas && agenda.vagas_disponiveis
                    ? (agenda.vagas_ocupadas / agenda.vagas_disponiveis) * 100
                    : 0;

                  return (
                    <TableRow key={agenda.id}>
                      <TableCell className="font-medium">
                        {agenda.nome || `Agenda ${agenda.id.slice(0, 8)}`}
                      </TableCell>
                      <TableCell>
                        {format(new Date(agenda.data_agenda), 'dd/MM/yyyy', { locale: ptBR })}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(agenda.horario_inicio), 'HH:mm')} - {format(new Date(agenda.horario_fim), 'HH:mm')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(agenda.ativo)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{agenda.cidade?.nome || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress value={ocupacaoPercentual} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-12">
                              {ocupacaoPercentual.toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {agenda.vagas_ocupadas || 0}/{agenda.vagas_disponiveis}
                            </span>
                            {getOcupacaoBadge(agenda.vagas_ocupadas || 0, agenda.vagas_disponiveis)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});

// Componente principal refatorado
export function RefactoredDashboardContent() {
  const { stats, loading } = useDashboardStats();
  const { empresa } = useEmpresaUnificado();
  
  // Hook customizado para gerenciar filtros
  const {
    dataInicio,
    dataFim,
    filtroStatus,
    filtroOcupacao,
    dataInicioStr,
    dataFimStr,
    setDataInicio,
    setDataFim,
    setFiltroStatus,
    setFiltroOcupacao,
    resetFilters,
    filterAgendas,
    calculateStats
  } = useDashboardFilters();

  // Buscar agendas com as datas formatadas
  const { agendas, loading: agendasLoading } = useAgendasAtivasAdmin(dataInicioStr, dataFimStr);

  // Aplicar filtros
  const agendasFiltradas = filterAgendas(agendas);
  
  // Calcular estatísticas
  const estatisticasAgendas = calculateStats(agendas, agendasFiltradas);

  // Handlers para filtros rápidos
  const handleQuick7Days = () => {
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() + 7);
    setDataInicio(hoje);
    setDataFim(seteDias);
  };

  const handleQuick30Days = () => {
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);
    setDataInicio(hoje);
    setDataFim(trintaDias);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          📊 Visão geral do seu negócio - {empresa?.nome || 'Sistema'}
        </p>
      </div>

      {/* Estatísticas principais */}
      <DashboardStats stats={estatisticasAgendas} loading={agendasLoading} />

      {/* Cards existentes do sistema */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <CardsEstatisticas />
        <CardReservasAtivas />
      </div>

      {/* Filtros */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardFilters
            dataInicio={dataInicio}
            dataFim={dataFim}
            filtroStatus={filtroStatus}
            filtroOcupacao={filtroOcupacao}
            onDataInicioChange={setDataInicio}
            onDataFimChange={setDataFim}
            onFiltroStatusChange={setFiltroStatus}
            onFiltroOcupacaoChange={setFiltroOcupacao}
          />
        </div>
        <QuickFilters
          onQuick7Days={handleQuick7Days}
          onQuick30Days={handleQuick30Days}
          onReset={resetFilters}
        />
      </div>

      {/* Tabela de agendas */}
      <AgendasTable agendas={agendasFiltradas} loading={agendasLoading} />
    </div>
  );
}