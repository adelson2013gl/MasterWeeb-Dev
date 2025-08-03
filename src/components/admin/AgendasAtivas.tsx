import React, { useState, useMemo, memo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Filter, TrendingUp, Users, MapPin, Clock, Loader2, CalendarDays, Eye, Edit, X, Check, ToggleLeft, ToggleRight, Power, CheckCircle, Copy, Search } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { ExportAgendasButton } from "@/components/admin/ExportAgendasButton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";
import { useAgendasAtivasAdmin } from "@/hooks/useAgendasAtivasAdmin";
import { useRegioes } from "@/hooks/useRegioes";
import { useDuplicarAgenda } from "@/hooks/useDuplicarAgenda";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Agenda } from "@/types/agenda";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StatCardRowSkeleton } from "@/components/skeletons/StatCardSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

const AgendasAtivas = memo(() => {
  const [filtroAtivo, setFiltroAtivo] = useState<"todas" | "criticas" | "disponiveis" | "lotadas">("todas");
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFim, setDataFim] = useState<Date>(() => {
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() + 7);
    return seteDias;
  });
  
  const [agendaSelecionada, setAgendaSelecionada] = useState<Agenda | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [alertaCancelarAberto, setAlertaCancelarAberto] = useState(false);
  const [alertaConcluirAberto, setAlertaConcluirAberto] = useState(false);
  const [agendaParaAcao, setAgendaParaAcao] = useState<Agenda | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState({
    vagas_disponiveis: 0,
    permite_reserva: false,
    regiao_id: ""
  });
  
  // NOVOS ESTADOS PARA CONTROLE HÍBRIDO
  const [filtrarOcupacao, setFiltrarOcupacao] = useState(false);
  const [mostrarApenas, setMostrarApenas] = useState<"todas" | "ativas" | "inativas">("todas");
  
  // ESTADO PARA BUSCA
  const [searchQuery, setSearchQuery] = useState("");
  
  // ✅ NOVOS ESTADOS PARA DUPLICAÇÃO DE AGENDA
  const [modalDuplicarAberto, setModalDuplicarAberto] = useState(false);
  const [agendaParaDuplicar, setAgendaParaDuplicar] = useState<Agenda | null>(null);
  const [novaDataDuplicacao, setNovaDataDuplicacao] = useState<Date | null>(null);

  const { regioes } = useRegioes();
  
  // Converter datas para string no formato correto
  const dataInicioStr = dataInicio ? format(dataInicio, "yyyy-MM-dd") : undefined;
  const dataFimStr = dataFim ? format(dataFim, "yyyy-MM-dd") : undefined;
  
  const { agendas, loading, editarAgenda, cancelarAgenda, verDetalhes, concluirAgenda, toggleAtivarAgenda } = useAgendasAtivasAdmin(dataInicioStr, dataFimStr);
  
  // ✅ HOOK PARA DUPLICAÇÃO
  const { duplicarAgenda, loading: loadingDuplicacao } = useDuplicarAgenda();

  // LÓGICA DE FILTROS ATUALIZADA COM BUSCA
  const agendasFiltradas = useMemo(() => {
    let filtered = agendas;

    // Filtro por status ativo/inativo
    if (mostrarApenas === "ativas") {
      filtered = filtered.filter(agenda => agenda.ativo === true);
    } else if (mostrarApenas === "inativas") {
      filtered = filtered.filter(agenda => agenda.ativo === false);
    }

    // Filtro por ocupação (se habilitado)
    if (filtrarOcupacao) {
      filtered = filtered.filter(agenda => agenda.vagas_ocupadas > 0);
    }

    // Filtro por busca textual
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(agenda => {
        const searchableFields = [
          agenda.regioes?.cidades?.nome || '',
          agenda.regioes?.nome || '',
          agenda.turnos?.nome || '',
          agenda.data_agenda || '',
          // Buscar também nos agendamentos
          ...(agenda.agendamentos?.map(ag => ag.entregador?.nome || ag.cliente_nome || '') || [])
        ];
        
        return searchableFields.some(field => 
          field.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [agendas, mostrarApenas, filtrarOcupacao, searchQuery]);

  // Adicionar cálculos de estatísticas
  const estatisticas = useMemo(() => {
    const totalAgendas = agendasFiltradas.length;
    const agendasAtivas = agendasFiltradas.filter(a => a.ativo).length;
    const agendasInativas = agendasFiltradas.filter(a => !a.ativo).length;
    const totalVagas = agendasFiltradas.reduce((acc, agenda) => acc + agenda.vagas_disponiveis, 0);
    const vagasOcupadas = agendasFiltradas.reduce((acc, agenda) => acc + agenda.vagas_ocupadas, 0);
    const taxaOcupacao = totalVagas > 0 ? (vagasOcupadas / totalVagas) * 100 : 0;
    
    // ✅ NOVOS CÁLCULOS PARA RESERVAS - CORRIGIDO
    const totalReservas = agendasFiltradas.reduce((acc, agenda) => {
      const reservas = agenda.agendamentos?.filter(ag => ag.status === 'pendente').length || 0;
      return acc + reservas;
    }, 0);
    
    const agendasComReservas = agendasFiltradas.filter(agenda => 
      agenda.agendamentos?.some(ag => ag.status === 'pendente')
    ).length;
    
    const agendasComReservaPermitida = agendasFiltradas.filter(a => a.permite_reserva).length;
    
    return { 
      totalAgendas, 
      agendasAtivas, 
      agendasInativas, 
      totalVagas, 
      vagasOcupadas, 
      taxaOcupacao,
      totalReservas,
      agendasComReservas,
      agendasComReservaPermitida
    };
  }, [agendasFiltradas]);

  // NOVA FUNÇÃO: Handle toggle ativar/desativar
  const handleToggleAtivo = useCallback(async (agenda: Agenda) => {
    const novoStatus = !agenda.ativo;
    const acao = novoStatus ? "ativar" : "desativar";
    
    if (confirm(`Tem certeza que deseja ${acao} esta agenda?`)) {
      await toggleAtivarAgenda(agenda.id, novoStatus);
    }
  }, [toggleAtivarAgenda]);

  const handleVerDetalhes = useCallback(async (agenda: Agenda) => {
    setAgendaSelecionada(agenda);
    await verDetalhes(agenda);
    setModalDetalhesAberto(true);
  }, [verDetalhes]);

  const handleEditarClick = useCallback((agenda: Agenda) => {
    setAgendaParaAcao(agenda);
    setDadosEdicao({
      vagas_disponiveis: agenda.vagas_disponiveis,
      permite_reserva: agenda.permite_reserva ?? false, // Garantir que nunca seja undefined
      regiao_id: agenda.regiao_id
    });
    setModalEditarAberto(true);
  }, []);

  const handleCancelarClick = (agenda: Agenda) => {
    setAgendaParaAcao(agenda);
    setAlertaCancelarAberto(true);
  };

  const handleConcluirClick = (agenda: Agenda) => {
    setAgendaParaAcao(agenda);
    setAlertaConcluirAberto(true);
  };

  const handleSalvarEdicao = async () => {
    if (agendaParaAcao) {
      await editarAgenda({
        ...agendaParaAcao,
        ...dadosEdicao
      });
      setModalEditarAberto(false);
    }
  };

  const handleConfirmarCancelamento = async () => {
    if (agendaParaAcao) {
      await cancelarAgenda(agendaParaAcao.id);
      setAlertaCancelarAberto(false);
    }
  };

  const handleConfirmarConclusao = async () => {
    if (agendaParaAcao) {
      await concluirAgenda(agendaParaAcao.id);
      setAlertaConcluirAberto(false);
    }
  };

  // ✅ FUNÇÕES PARA DUPLICAÇÃO DE AGENDA
  const handleDuplicarClick = (agenda: Agenda) => {
    setAgendaParaDuplicar(agenda);
    setNovaDataDuplicacao(null);
    setModalDuplicarAberto(true);
  };

  const handleConfirmarDuplicacao = async () => {
    if (!agendaParaDuplicar || !novaDataDuplicacao) {
      return;
    }
    
    try {
      const resultado = await duplicarAgenda(agendaParaDuplicar, [novaDataDuplicacao]);
      
      if (resultado.sucesso > 0) {
        setModalDuplicarAberto(false);
        setAgendaParaDuplicar(null);
        setNovaDataDuplicacao(null);
      }
    } catch (error) {
      console.error('Erro na duplicação:', error);
    }
  };

  // FUNÇÕES PARA FILTROS RÁPIDOS
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
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Agendas</h2>
        </div>
        <StatCardRowSkeleton count={6} />
        <TableSkeleton columns={8} rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Agendas</h2>
      </div>

      {/* CARDS DE ESTATÍSTICAS ATUALIZADOS */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalAgendas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendas Ativas</CardTitle>
            <Power className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.agendasAtivas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.taxaOcupacao.toFixed(0)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{estatisticas.totalReservas}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.agendasComReservas} agendas com reservas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Permitidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estatisticas.agendasComReservaPermitida}</div>
            <p className="text-xs text-muted-foreground">
              agendas permitem reserva
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendas Inativas</CardTitle>
            <Power className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estatisticas.agendasInativas}</div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS ATUALIZADOS COM BUSCA */}
      <div className="space-y-4">
        {/* Linha de busca */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cidade, região, turno, data ou entregador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground"
            >
              Limpar busca
            </Button>
          )}
        </div>

        {/* Linha de filtros */}
        <div className="flex items-end gap-4 flex-wrap">
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

        {/* NOVO FILTRO: Mostrar por status */}
        <div className="grid gap-2">
          <Label htmlFor="mostrarApenas">Filtrar por Status</Label>
          <Select value={mostrarApenas} onValueChange={(value: "todas" | "ativas" | "inativas") => setMostrarApenas(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativas">Apenas Ativas</SelectItem>
              <SelectItem value="inativas">Apenas Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>

          <div className="flex items-center gap-2">
            <Switch
              id="filtrarOcupacao"
              checked={filtrarOcupacao || false}
              onCheckedChange={setFiltrarOcupacao}
            />
            <Label htmlFor="filtrarOcupacao">Mostrar apenas agendas com ocupação</Label>
          </div>
        </div>
        
        {/* Indicador de resultados de busca */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>
              {agendasFiltradas.length} agenda{agendasFiltradas.length !== 1 ? 's' : ''} encontrada{agendasFiltradas.length !== 1 ? 's' : ''} 
              para "{searchQuery}"
            </span>
          </div>
        )}
      </div>

      {/* TABELA ATUALIZADA COM CONTROLE DE ATIVAÇÃO */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Ocupação de Vagas</TableHead>
              <TableHead>Reserva</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Carregando agendas...
                </TableCell>
              </TableRow>
            ) : agendasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Nenhuma agenda encontrada
                </TableCell>
              </TableRow>
            ) : (
              agendasFiltradas.map((agenda) => {
                const ocupacaoPercentual = agenda.vagas_disponiveis > 0 ? (agenda.vagas_ocupadas / agenda.vagas_disponiveis) * 100 : 0;
                
                // ✅ CALCULAR VAGAS E RESERVAS SEPARADAMENTE - CORRIGIDO
                const vagasConfirmadas = agenda.agendamentos?.filter(ag => ag.status === 'agendado').length || 0;
                const reservasPendentes = agenda.agendamentos?.filter(ag => ag.status === 'pendente').length || 0;

                return (
                  <TableRow 
                    key={agenda.id} 
                    className={agenda.ativo ? "" : "opacity-60 bg-gray-50"}
                  >
                    {/* NOVA COLUNA: Status with toggle */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAtivo(agenda)}
                          className={`p-1 ${agenda.ativo ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
                        >
                          {agenda.ativo ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </Button>
                        <Badge variant={agenda.ativo ? "default" : "secondary"}>
                          {agenda.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {agenda.data_agenda ? format(new Date(agenda.data_agenda + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR }) : 'Data inválida'}
                    </TableCell>
                    <TableCell>{agenda.regioes.cidades.nome}</TableCell>
                    <TableCell>{agenda.regioes.nome}</TableCell>
                    <TableCell>{agenda.turnos.nome}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {/* ✅ VISUALIZAÇÃO CLARA DA OCUPAÇÃO */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Progress value={ocupacaoPercentual} className="w-[70px]" />
                            <span className="text-sm font-medium">
                              {Math.round(ocupacaoPercentual)}%
                            </span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Ocupadas:</span>
                              <span className="font-medium text-blue-600">{agenda.vagas_ocupadas}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Disponíveis:</span>
                              <span className="font-medium text-green-600">{agenda.vagas_disponiveis}</span>
                            </div>
                            {reservasPendentes > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Em reserva:</span>
                                <span className="font-medium text-orange-600">{reservasPendentes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agenda.permite_reserva ? "default" : "secondary"}>
                        {agenda.permite_reserva ? "Permitida" : "Bloqueada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVerDetalhes(agenda)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarClick(agenda)}
                          title="Editar agenda"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicarClick(agenda)}
                          title="Duplicar agenda para outra data"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelarClick(agenda)}
                          title="Cancelar agenda"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConcluirClick(agenda)}
                          title="Concluir agenda"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Edição */}
      <Dialog open={modalEditarAberto} onOpenChange={setModalEditarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Agenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="vagas">Vagas Disponíveis</Label>
              <Input
                id="vagas"
                type="number"
                min={0}
                value={dadosEdicao.vagas_disponiveis}
                onChange={(e) => setDadosEdicao(prev => ({ ...prev, vagas_disponiveis: parseInt(e.target.value) || 0 }))}
              />
              <span className="text-xs text-muted-foreground">
                Mínimo: {agendaParaAcao?.vagas_ocupadas || 0} (vagas já ocupadas)
              </span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="regiao">Região</Label>
              <Select
                value={dadosEdicao.regiao_id}
                onValueChange={(value) => setDadosEdicao(prev => ({ ...prev, regiao_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma região" />
                </SelectTrigger>
                <SelectContent>
                  {regioes.map((regiao) => (
                    <SelectItem key={regiao.id} value={regiao.id}>
                      {regiao.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="permite_reserva"
                checked={dadosEdicao.permite_reserva || false}
                onCheckedChange={(checked) => setDadosEdicao(prev => ({ ...prev, permite_reserva: checked }))}
              />
              <Label htmlFor="permite_reserva">Permitir Reservas</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditarAberto(false)}>Cancelar</Button>
            <Button onClick={handleSalvarEdicao}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de Confirmação de Cancelamento */}
      <AlertDialog open={alertaCancelarAberto} onOpenChange={setAlertaCancelarAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agenda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta agenda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter agenda</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarCancelamento}>Sim, cancelar agenda</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alerta de Confirmação de Conclusão */}
      <AlertDialog open={alertaConcluirAberto} onOpenChange={setAlertaConcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Agenda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja concluir esta agenda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter agenda</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarConclusao}>Sim, concluir agenda</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Detalhes */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Agenda - {agendaSelecionada?.data_agenda && format(new Date(agendaSelecionada.data_agenda + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {agendaSelecionada && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Informações da Agenda</h4>
                  <p>Cidade: {agendaSelecionada.regioes.cidades.nome}</p>
                  <p>Região: {agendaSelecionada.regioes.nome}</p>
                  <p>Turno: {agendaSelecionada.turnos.nome}</p>
                  <p>Vagas: {agendaSelecionada.vagas_ocupadas} de {agendaSelecionada.vagas_disponiveis}</p>
                </div>
                
                {/* ✅ SEPARAR VISUALMENTE VAGAS DE RESERVAS */}
                <div>
                  <h4 className="font-semibold mb-2">Agendamentos</h4>
                  
                  {(() => {
                    const vagas = agendaSelecionada.agendamentos?.filter(ag => ag.status === 'agendado') || [];
                    const reservas = agendaSelecionada.agendamentos?.filter(ag => ag.status === 'pendente') || [];
                    
                    return (
                      <div className="space-y-6">
                        {/* Vagas Confirmadas */}
                        {vagas.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <h5 className="font-medium text-green-700">Vagas Confirmadas ({vagas.length})</h5>
                            </div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Entregador</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Email</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {vagas.map((agendamento) => (
                                    <TableRow key={agendamento.id}>
                                      <TableCell>{agendamento.entregador?.nome}</TableCell>
                                      <TableCell>{agendamento.entregador?.telefone}</TableCell>
                                      <TableCell>{agendamento.entregador?.email}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                        
                        {/* Reservas Pendentes */}
                        {reservas.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <h5 className="font-medium text-orange-700">Reservas Pendentes ({reservas.length})</h5>
                            </div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Entregador</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Email</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {reservas.map((agendamento) => (
                                    <TableRow key={agendamento.id} className="bg-orange-50">
                                      <TableCell>{agendamento.entregador?.nome}</TableCell>
                                      <TableCell>{agendamento.entregador?.telefone}</TableCell>
                                      <TableCell>{agendamento.entregador?.email}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                        
                        {/* Caso não tenha agendamentos */}
                        {vagas.length === 0 && reservas.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum agendamento encontrado para esta agenda</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL DE DUPLICAÇÃO DE AGENDA */}
      <Dialog open={modalDuplicarAberto} onOpenChange={setModalDuplicarAberto}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-lg font-bold">📋 Duplicar Agenda</DialogTitle>
            <DialogDescription className="text-gray-800 font-medium mt-2">
              Criar nova agenda com as mesmas configurações da agenda selecionada
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Dados da agenda original (readonly) */}
            {agendaParaDuplicar && (
              <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg shadow-sm">
                <h4 className="font-bold mb-3 text-blue-900 text-base">📅 Agenda Original:</h4>
                <div className="space-y-3 text-sm">
                  <div className="text-gray-900">
                    <span className="font-semibold text-gray-800">Data:</span>{" "}
                    <span className="font-medium text-black">{agendaParaDuplicar?.data_agenda ? format(new Date(agendaParaDuplicar.data_agenda + 'T00:00:00'), 'dd/MM/yyyy') : 'Data inválida'}</span>
                  </div>
                  <div className="text-gray-900">
                    <span className="font-semibold text-gray-800">Turno:</span>{" "}
                    <span className="font-medium text-black">{agendaParaDuplicar.turnos.nome}</span>
                  </div>
                  <div className="text-gray-900">
                    <span className="font-semibold text-gray-800">Cidade:</span>{" "}
                    <span className="font-medium text-black">{agendaParaDuplicar.regioes.cidades.nome}</span>
                  </div>
                  <div className="text-gray-900">
                    <span className="font-semibold text-gray-800">Região:</span>{" "}
                    <span className="font-medium text-black">{agendaParaDuplicar.regioes.nome}</span>
                  </div>
                  <div className="text-gray-900">
                    <span className="font-semibold text-gray-800">Vagas:</span>{" "}
                    <span className="font-medium text-black">{agendaParaDuplicar.vagas_disponiveis}</span>
                  </div>
                  <div className="text-gray-900">
                    <span className="font-semibold text-gray-800">Permite Reserva:</span>{" "}
                    <span className={`font-bold ${agendaParaDuplicar.permite_reserva ? 'text-green-800' : 'text-red-800'}`}>
                      {agendaParaDuplicar.permite_reserva ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Seleção de nova data */}
            <div className="space-y-3">
              <Label className="text-gray-900 font-semibold text-sm">🗓️ Nova Data:</Label>
              <DatePicker
                date={novaDataDuplicacao}
                onDateChange={setNovaDataDuplicacao}
                minDate={new Date()} // Não permitir datas passadas
                placeholder="Selecione a nova data"
              />
            </div>
            
            {/* Preview da agenda que será criada */}
            {novaDataDuplicacao && (
              <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg shadow-sm">
                <h5 className="font-bold text-green-900 mb-1 text-sm">
                  ✨ Será criada nova agenda para:
                </h5>
                <div className="text-sm text-green-900 font-bold">
                  📅 {format(novaDataDuplicacao, 'dd/MM/yyyy')} - {agendaParaDuplicar?.turnos.nome}
                </div>
                <div className="text-xs text-green-800 mt-1 font-medium">
                  📍 {agendaParaDuplicar?.regioes.cidades.nome} - {agendaParaDuplicar?.regioes.nome} • {agendaParaDuplicar?.vagas_disponiveis} vagas
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-3 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setModalDuplicarAberto(false)}
              className="border-gray-400 text-gray-900 bg-white hover:bg-gray-100 hover:border-gray-500 hover:text-black font-medium"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarDuplicacao} 
              disabled={!novaDataDuplicacao || loadingDuplicacao}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingDuplicacao ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Duplicando...
                </>
              ) : (
                <>
                  📋 Duplicar Agenda
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

AgendasAtivas.displayName = 'AgendasAtivas';

export { AgendasAtivas };
