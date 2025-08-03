import React, { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Building2, Users, Calendar, TrendingUp, MapPin, Filter } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { CardsEstatisticas } from '@/components/admin/CardsEstatisticas';
import { CardReservasAtivas } from '@/components/admin/CardReservasAtivas';
import { useAgendasAtivasAdmin } from '@/hooks/useAgendasAtivasAdmin';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

const DashboardContent = memo(() => {
  const { stats, loading } = useDashboardStats();
  const { empresasDisponiveis, empresa, isSuperAdmin } = useEmpresaUnificado();
  
  // Estados para filtros de data
  const [dataInicio, setDataInicio] = useState<Date>(() => {
    const hoje = new Date();
    return hoje;
  });
  const [dataFim, setDataFim] = useState<Date>(() => {
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() + 7);
    return seteDias;
  });
  
  // ESTADOS PARA FILTROS DE STATUS
  const [filtroStatus, setFiltroStatus] = useState<"todas" | "ativas" | "inativas">("todas");
  const [filtroOcupacao, setFiltroOcupacao] = useState<"todas" | "criticas" | "disponiveis" | "lotadas">("todas");
  
  // Formatação das datas para o hook
  const dataInicioStr = format(dataInicio, 'yyyy-MM-dd');
  const dataFimStr = format(dataFim, 'yyyy-MM-dd');
  
  const { agendas, loading: agendasLoading } = useAgendasAtivasAdmin(dataInicioStr, dataFimStr);
  
  // FILTRAR AGENDAS POR STATUS E OCUPAÇÃO
  const agendasFiltradas = useMemo(() => {
    let filtered = agendas;
    
    // Filtro por status ativo/inativo
    if (filtroStatus === "ativas") {
      filtered = filtered.filter(agenda => agenda.ativo === true);
    } else if (filtroStatus === "inativas") {
      filtered = filtered.filter(agenda => agenda.ativo === false);
    }
    
    // Filtro por ocupação
    if (filtroOcupacao !== "todas") {
      filtered = filtered.filter((agenda) => {
        const ocupacaoPercentual = agenda.vagas_ocupadas && agenda.vagas_disponiveis
          ? (agenda.vagas_ocupadas / agenda.vagas_disponiveis) * 100
          : 0;
        
        switch (filtroOcupacao) {
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
  }, [agendas, filtroStatus, filtroOcupacao]);

  // CALCULAR ESTATÍSTICAS DAS AGENDAS
  const estatisticasAgendas = useMemo(() => {
    const totalAgendas = agendas.length;
    const agendasAtivas = agendas.filter(a => a.ativo).length;
    const agendasInativas = agendas.filter(a => !a.ativo).length;
    
    const totalVagas = agendasFiltradas.reduce((acc, agenda) => acc + agenda.vagas_disponiveis, 0);
    const vagasOcupadas = agendasFiltradas.reduce((acc, agenda) => {
      return acc + (agenda.vagas_ocupadas || 0);
    }, 0);
    const taxaOcupacao = totalVagas > 0 ? (vagasOcupadas / totalVagas) * 100 : 0;

    // ✅ ADICIONAR CÁLCULOS DE RESERVAS
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
      totalFiltradas: agendasFiltradas.length,
      totalReservas,
      agendasComReservas
    };
  }, [agendas, agendasFiltradas]);
  
  // Funções para filtros rápidos
  const handleProximos7Dias = () => {
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() + 7);
    setDataInicio(hoje);
    setDataFim(seteDias);
  };
  
  const handleProximos30Dias = () => {
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);
    setDataInicio(hoje);
    setDataFim(trintaDias);
  };
  
  const handleResetarFiltros = () => {
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() + 7);
    setDataInicio(hoje);
    setDataFim(seteDias);
    setFiltroStatus("todas");
    setFiltroOcupacao("todas");
  };

  if (loading || agendasLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          📊 Visão geral do seu negócio - {empresa?.nome || 'Sistema'} (Somente Visualização)
        </p>
      </div>

      {/* ✅ CARDS EXPANDIDOS - INCLUIR RESERVAS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticasAgendas.totalAgendas}</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticasAgendas.agendasAtivas}</div>
            <p className="text-xs text-muted-foreground">
              Visíveis para entregadores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendas Inativas</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estatisticasAgendas.agendasInativas}</div>
            <p className="text-xs text-muted-foreground">
              Ocultas dos entregadores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <span className="text-orange-600">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{estatisticasAgendas.totalReservas}</div>
            <p className="text-xs text-muted-foreground">
              Em {estatisticasAgendas.agendasComReservas} agendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticasAgendas.taxaOcupacao.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Agendas filtradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exibindo</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticasAgendas.totalFiltradas}</div>
            <p className="text-xs text-muted-foreground">
              Com filtros aplicados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Agendas com Filtros */}
      <div className="space-y-4">
        {/* Cabeçalho com Período */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              📋 Visão Geral das Agendas - {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })} até {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
            </h2>
            <p className="text-muted-foreground">
              📊 Visualização completa das agendas (sem ações de gerenciamento)
            </p>
            <p className="text-sm text-blue-600">
              Exibindo {estatisticasAgendas.totalFiltradas} de {estatisticasAgendas.totalAgendas} agendas
            </p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="flex items-end gap-4">
          <div className="grid gap-2">
            <Label htmlFor="dataInicio">Data Início</Label>
            <DatePicker
              date={dataInicio}
              onDateChange={setDataInicio}
              placeholder="Data início"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dataFim">Data Fim</Label>
            <DatePicker
              date={dataFim}
              onDateChange={setDataFim}
              placeholder="Data fim"
              minDate={dataInicio}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="filtroStatus">Status</Label>
            <Select value={filtroStatus} onValueChange={(value: "todas" | "ativas" | "inativas") => setFiltroStatus(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="ativas">Apenas Ativas</SelectItem>
                <SelectItem value="inativas">Apenas Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="filtroOcupacao">Ocupação</Label>
            <Select value={filtroOcupacao} onValueChange={(value: "todas" | "criticas" | "disponiveis" | "lotadas") => setFiltroOcupacao(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="disponiveis">Disponíveis</SelectItem>
                <SelectItem value="criticas">Críticas</SelectItem>
                <SelectItem value="lotadas">Lotadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={handleProximos7Dias}>
            Próximos 7 dias
          </Button>
          <Button variant="outline" onClick={handleProximos30Dias}>
            Próximos 30 dias
          </Button>
          <Button variant="outline" onClick={handleResetarFiltros}>
            Resetar Filtros
          </Button>
        </div>

        {/* ✅ TABELA READONLY - SEM AÇÕES */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Ocupação</TableHead>
                <TableHead>Reserva</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendasLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Carregando agendas...
                  </TableCell>
                </TableRow>
              ) : agendasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {filtroStatus === "todas" 
                      ? "Nenhuma agenda encontrada no período selecionado"
                      : `Nenhuma agenda ${filtroStatus} encontrada no período selecionado`
                    }
                  </TableCell>
                </TableRow>
              ) : (
                agendasFiltradas.map((agenda) => {
                  const ocupacaoPercentual = agenda.vagas_ocupadas && agenda.vagas_disponiveis 
                    ? (agenda.vagas_ocupadas / agenda.vagas_disponiveis) * 100 
                    : 0;

                  // ✅ CALCULAR VAGAS E RESERVAS SEPARADAMENTE
                  const vagasConfirmadas = agenda.agendamentos?.filter(ag => ag.status === 'agendado').length || 0;
                  const reservasPendentes = agenda.agendamentos?.filter(ag => ag.status === 'pendente').length || 0;

                  // ✅ NOVAS FUNÇÕES PARA INDICADORES VISUAIS INTELIGENTES
                  const vagasRestantes = agenda.vagas_disponiveis - (agenda.vagas_ocupadas || 0);
                  const isUrgente = vagasRestantes <= 2 && vagasRestantes > 0;
                  const isLotado = vagasRestantes <= 0;

                  // Função para status inteligente
                  const getStatusVisual = () => {
                    if (!agenda.ativo) return { 
                      variant: "secondary" as const, 
                      className: "bg-gray-100 text-gray-600", 
                      text: "❌ Inativa" 
                    };
                    
                    if (ocupacaoPercentual >= 100) return { 
                      variant: "destructive" as const, 
                      className: "bg-red-100 text-red-700 border-red-300 animate-pulse", 
                      text: "🔴 LOTADO" 
                    };
                    
                    if (ocupacaoPercentual >= 80) return { 
                      variant: "outline" as const, 
                      className: "bg-orange-100 text-orange-700 border-orange-300", 
                      text: "🟡 CRÍTICO" 
                    };
                    
                    if (isUrgente) return { 
                      variant: "outline" as const, 
                      className: "bg-yellow-100 text-yellow-700 border-yellow-300", 
                      text: "⚠️ URGENTE" 
                    };
                    
                    return { 
                      variant: "default" as const, 
                      className: "bg-green-100 text-green-700 border-green-300", 
                      text: "🟢 DISPONÍVEL" 
                    };
                  };

                  // Função para ícone do turno
                  const getTurnoIcon = () => {
                    const turnoNome = agenda.turnos?.nome?.toLowerCase() || '';
                    const horaInicio = agenda.turnos?.hora_inicio || '';
                    const hora = parseInt(horaInicio.split(':')[0] || '12');
                    
                    if (turnoNome.includes('manhã') || hora < 12) {
                      return { icon: "☀️", color: "text-yellow-600", bg: "bg-yellow-50" };
                    }
                    
                    if (turnoNome.includes('tarde') || (hora >= 12 && hora < 18)) {
                      return { icon: "🌅", color: "text-orange-600", bg: "bg-orange-50" };
                    }
                    
                    return { icon: "🌙", color: "text-blue-600", bg: "bg-blue-50" };
                  };

                  const statusVisual = getStatusVisual();
                  const turnoIcon = getTurnoIcon();

                  return (
                    <TableRow 
                      key={agenda.id}
                      className={agenda.ativo ? "" : "opacity-60 bg-gray-50"}
                    >
                      {/* ✅ STATUS VISUAL INTELIGENTE COM CORES E INDICADORES */}
                      <TableCell>
                        <Badge variant={statusVisual.variant} className={statusVisual.className}>
                          {statusVisual.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {agenda.data_agenda ? format(new Date(agenda.data_agenda + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'Data inválida'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agenda.regioes?.cidades?.nome || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{agenda.regioes?.nome || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{turnoIcon.icon}</span>
                          <div className={`px-2 py-1 rounded-md ${turnoIcon.bg}`}>
                            <span className={`font-medium ${turnoIcon.color}`}>
                              {agenda.turnos?.nome || 'N/A'}
                            </span>
                            {agenda.turnos?.hora_inicio && agenda.turnos?.hora_fim && (
                              <div className="text-xs text-muted-foreground">
                                {agenda.turnos.hora_inicio} - {agenda.turnos.hora_fim}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {/* Progress bar com cores dinâmicas */}
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={ocupacaoPercentual} 
                              className={`w-[80px] ${
                                ocupacaoPercentual >= 100 ? 'text-red-600' : 
                                ocupacaoPercentual >= 80 ? 'text-orange-600' : 
                                'text-green-600'
                              }`} 
                            />
                            <span className={`text-sm font-medium ${
                              ocupacaoPercentual >= 100 ? 'text-red-600' : 
                              ocupacaoPercentual >= 80 ? 'text-orange-600' : 
                              'text-green-600'
                            }`}>
                              {ocupacaoPercentual >= 100 
                                ? 'Lotado' 
                                : `${agenda.vagas_disponiveis - (agenda.vagas_ocupadas || 0)} vaga${agenda.vagas_disponiveis - (agenda.vagas_ocupadas || 0) === 1 ? '' : 's'} disponível${agenda.vagas_disponiveis - (agenda.vagas_ocupadas || 0) === 1 ? '' : 'eis'}`
                              }
                            </span>
                          </div>
                          
                          {/* Badges inteligentes com contadores */}
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-green-600 bg-green-50">
                              ✅ {vagasConfirmadas} Confirmadas
                            </Badge>
                            
                            {reservasPendentes > 0 && (
                              <Badge variant="outline" className="text-orange-600 bg-orange-50">
                                ⏳ {reservasPendentes} Reservas
                              </Badge>
                            )}
                            
                            {/* Badge URGENTE para poucas vagas */}
                            {isUrgente && (
                              <Badge variant="destructive" className="animate-pulse bg-red-100 text-red-700">
                                🚨 {vagasRestantes} RESTANTES!
                              </Badge>
                            )}
                            
                            {/* Badge LOTADO */}
                            {isLotado && (
                              <Badge variant="destructive" className="bg-red-100 text-red-700">
                                🔴 ESGOTADO
                              </Badge>
                            )}
                            
                            {/* Contador positivo para agendas com muitas vagas */}
                            {!isUrgente && !isLotado && vagasRestantes > 0 && (
                              <Badge variant="outline" className="text-blue-600 bg-blue-50">
                                💎 {vagasRestantes} Disponíveis
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agenda.permite_reserva ? "default" : "secondary"}>
                          {agenda.permite_reserva ? "✅ Permitida" : "❌ Bloqueada"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Empresas Cadastradas
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{empresasDisponiveis.length}</div>
              <p className="text-xs text-muted-foreground">
                Total no sistema
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entregadores Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.entregadoresAtivos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.entregadoresPendentes} aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agendas Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agendasHoje}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ocupacaoMedia}% de ocupação média
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Ocupação
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ocupacaoMedia}%</div>
            <p className="text-xs text-muted-foreground">
              Eficiência operacional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Entregadores
            </CardTitle>
            <CardDescription>
              Status da equipe de entregadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Ativos</span>
                <Badge variant="default">{stats.entregadoresAtivos}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Pendentes</span>
                <Badge variant="secondary">{stats.entregadoresPendentes}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Operações Regionais
            </CardTitle>
            <CardDescription>
              Cobertura geográfica ativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Cidades Ativas</span>
                <Badge variant="default">{stats.cidadesAtivas}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Turnos Ativos</span>
                <Badge variant="default">{stats.turnosAtivos}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Multi-Empresa
              </CardTitle>
              <CardDescription>
                Gestão centralizada de empresas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Empresa Atual</span>
                  <Badge variant="outline">{empresa?.nome}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Plano</span>
                  <Badge variant={empresa?.plano === 'enterprise' ? 'default' : 'secondary'}>
                    {empresa?.plano}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Seção de Reservas Ativas */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reservas Ativas</h3>
          <p className="text-sm text-gray-600">Entregadores aguardando liberação de vagas</p>
        </div>
        <CardReservasAtivas />
      </div>

      {/* Alertas e Ações Rápidas */}
      {stats.entregadoresPendentes > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Ação Necessária</CardTitle>
            <CardDescription className="text-yellow-700">
              Você tem {stats.entregadoresPendentes} entregadores aguardando aprovação
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
});

DashboardContent.displayName = 'DashboardContent';

export { DashboardContent };
