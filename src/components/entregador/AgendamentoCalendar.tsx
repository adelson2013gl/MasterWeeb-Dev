import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarDays, Clock, MapPin, Users, AlertTriangle, CheckCircle, XCircle, RefreshCw, Zap, PlayCircle, Eye, EyeOff } from "lucide-react";
import { useAgendasDisponiveis } from "@/hooks/useAgendasDisponiveis";
import { useAgendamento } from "@/hooks/useAgendamento";
import { useConfiguracoesSistema } from "@/hooks/useConfiguracoesSistema";
import { useAuth } from "@/hooks/useAuth";
import { formatarData, formatarHorario, getDataAtualFormatada } from "@/lib/utils";
import { logger } from "@/lib/logger";

export function AgendamentoCalendar() {
  const { user } = useAuth();
  const { agendas, loading, entregadorData, refetch } = useAgendasDisponiveis();
  const { criarAgendamento, loading: agendandoLoading } = useAgendamento();
  const { configs, podeVerAgendaPorHorario } = useConfiguracoesSistema();

  // 🔥 FILTRO ADICIONAL NO FRONTEND PARA GARANTIR VALIDAÇÃO
  const agendasFiltradas = React.useMemo(() => {
    if (!configs?.habilitarPriorizacaoHorarios || !podeVerAgendaPorHorario) {
      return agendas;
    }

    const dataHoje = getDataAtualFormatada();
    
    return agendas.filter(agenda => {
      // Se não é agenda de hoje, sempre mostrar
      if (agenda.data !== dataHoje) {
        return true;
      }

      // Para agendas de hoje, aplicar validação de horário por estrelas
      // Validação adequada: só processa se entregadorData estiver disponível
      if (!entregadorData?.estrelas) {
        return false; // Bloqueia se não há dados válidos do entregador
      }
      const validacao = podeVerAgendaPorHorario(entregadorData.estrelas, agenda.data, agenda.turno.hora_inicio);
      
      // 🔥 LOG ESPECÍFICO PARA INVESTIGAÇÃO
      if (user?.email?.toLowerCase().includes('adelson') || agenda.data === dataHoje) {
        logger.info('🔍 FILTRO FRONTEND - Validação de agenda', {
          userEmail: user?.email,
          agendaId: agenda.id,
          dataAgenda: agenda.data,
          dataHoje,
          turnoNome: agenda.turno.nome,
          horaInicio: agenda.turno.hora_inicio,
          validacaoPermitida: validacao.permitido,
          validacaoMotivo: validacao.motivo,
          configHabilitada: configs.habilitarPriorizacaoHorarios,
          timestamp: new Date().toISOString()
        }, 'FILTRO_FRONTEND');
      }

      return validacao.permitido;
    });
  }, [agendas, configs?.habilitarPriorizacaoHorarios, podeVerAgendaPorHorario, user?.email, entregadorData?.estrelas]);

  const handleAgendar = async (agendaId: string, permiteReserva: boolean) => {
    // Sempre usar 'entrega' como tipo (conforme enum do banco)
    const tipo = 'entrega';
    const sucesso = await criarAgendamento(agendaId, tipo);
    if (sucesso) {
      // Atualização mais rápida após correção
      setTimeout(() => {
        refetch();
      }, 200);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const getStatusIcon = (agenda: any) => {
    if (agenda.turnoIniciado) {
      return <PlayCircle className="h-4 w-4 text-orange-600" />;
    }
    if (agenda.inconsistenciaDetectada) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    if (agenda.jaAgendado) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (!agenda.podeAgendar) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    return <Users className="h-4 w-4 text-blue-600" />;
  };

  const getVagasDisplay = (agenda: any) => {
    const vagasLivres = agenda.vagas_disponiveis - agenda.vagas_ocupadas;
    
    return (
      <div className="flex items-center gap-1">
        <span className={`font-medium ${
          vagasLivres <= 0 ? 'text-red-600' : 
          vagasLivres <= 2 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {vagasLivres}/{agenda.vagas_disponiveis}
        </span>
        {agenda.inconsistenciaDetectada && (
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
        )}
      </div>
    );
  };

  // 🔥 LOG PARA INVESTIGAÇÃO - Comparação entre agendas originais e filtradas
  React.useEffect(() => {
    if (user?.email?.toLowerCase().includes('adelson') && agendas.length > 0) {
      const dataHoje = getDataAtualFormatada();
      const agendasHojeOriginais = agendas.filter(a => a.data_agenda === dataHoje);
      const agendasHojeFiltradas = agendasFiltradas.filter(a => a.data_agenda === dataHoje);
      
      logger.info('🔍 INVESTIGAÇÃO ADELSON - Comparação filtros frontend', {
        userEmail: user.email,
        totalAgendasOriginais: agendas.length,
        totalAgendasFiltradas: agendasFiltradas.length,
        agendasHojeOriginais: agendasHojeOriginais.length,
        agendasHojeFiltradas: agendasHojeFiltradas.length,
        agendasRemovidasPeloFiltro: agendasHojeOriginais.length - agendasHojeFiltradas.length,
        configHabilitada: configs?.habilitarPriorizacaoHorarios,
        funcaoDisponivelFrontend: !!podeVerAgendaPorHorario,
        detalhesAgendasHoje: agendasHojeOriginais.map(a => ({
          id: a.id,
          turno: a.turno.nome,
          horaInicio: a.turno.hora_inicio,
          podeAgendar: a.podeAgendar,
          motivoBloqueio: a.motivoBloqueio
        })),
        timestamp: new Date().toISOString()
      }, 'INVESTIGAÇÃO_ADELSON');
    }
  }, [agendas, agendasFiltradas, user?.email, configs?.habilitarPriorizacaoHorarios, podeVerAgendaPorHorario]);

  if (loading) {
    return (
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            Agendas Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (agendasFiltradas.length === 0) {
    return (
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2" />
              Agendas Disponíveis
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            {configs?.habilitarPriorizacaoHorarios ? 
              'Aguarde a liberação das próximas agendas disponíveis' :
              'Nenhuma agenda disponível no momento'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {configs?.habilitarPriorizacaoHorarios ? (
              <>
                <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Agendas em preparação</p>
                <p className="text-sm text-gray-400 mt-1">
                  Novas oportunidades serão liberadas em breve
                </p>
              </>
            ) : (
              <>
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma agenda disponível</p>
                <p className="text-sm text-gray-400 mt-1">
                  Novas agendas aparecerão aqui quando estiverem disponíveis
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            Agendas Disponíveis
            <div className="ml-2" title="Sistema com validação temporal">
              <Zap className="h-4 w-4 text-green-500" />
            </div>
            {configs?.habilitarPriorizacaoHorarios && (
              <div className="ml-2" title="Horários específicos por estrelas ativo">
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          {agendasFiltradas.length} agenda(s) encontrada(s) • Validação temporal ativa
          {configs?.habilitarPriorizacaoHorarios && ' • Horários específicos por estrelas'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4 overflow-hidden">
          {agendasFiltradas.map(agenda => {
            const vagasLivres = agenda.vagas_disponiveis - agenda.vagas_ocupadas;
            
            return (
              <div key={agenda.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                {/* Layout responsivo: empilha em telas pequenas */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusIcon(agenda)}
                      <h3 className="font-medium text-sm sm:text-base">{agenda.turno.nome}</h3>
                      {agenda.jaAgendado && (
                          <Badge 
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-800 border-green-200"
                          >
                            Agendado
                          </Badge>
                        )}
                      {agenda.turnoIniciado && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                          Turno Iniciado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">{formatarData(agenda.data)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">{formatarHorario(agenda.turno.hora_inicio)} - {formatarHorario(agenda.turno.hora_fim)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">{agenda.regiao.nome} - {agenda.regiao.cidade.nome}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Container dos botões - responsivo */}
                  <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      {getVagasDisplay(agenda)}
                    </div>
                    
                    <div className="flex gap-1 sm:gap-2 max-w-full overflow-hidden">
                      {agenda.podeAgendar && !agenda.jaAgendado && (
                        <Button
                          size="sm"
                          onClick={() => handleAgendar(agenda.id, false)}
                          disabled={agendandoLoading}
                          className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap min-w-[65px] max-w-[80px] text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                        >
                          <span className="hidden sm:inline">
                            {agendandoLoading ? 'Agendando...' : 'Agendar'}
                          </span>
                          <span className="sm:hidden">
                            {agendandoLoading ? '...' : 'Agendar'}
                          </span>
                        </Button>
                      )}
                      
                      {!agenda.podeAgendar && !agenda.jaAgendado && vagasLivres <= 0 && agenda.permite_reserva && !agenda.turnoIniciado && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAgendar(agenda.id, true)}
                          disabled={agendandoLoading}
                          className="whitespace-nowrap min-w-[90px] max-w-[140px] text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                        >
                          <span className="hidden sm:inline">
                            {agendandoLoading ? 'Reservando...' : 'Entrar na Reserva'}
                          </span>
                          <span className="sm:hidden">
                            {agendandoLoading ? '...' : 'Reserva'}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {agenda.turnoIniciado && (
                  <Alert className="border-blue-800 bg-blue-900">
                  <PlayCircle className="h-4 w-4 text-blue-300" />
                  <AlertDescription className="text-blue-100">
                    Turno em andamento - novos agendamentos não são permitidos após o início do turno.
                  </AlertDescription>
                </Alert>
                )}

                {agenda.inconsistenciaDetectada && (
                  <Alert className="border-blue-800 bg-blue-900">
                    <AlertTriangle className="h-4 w-4 text-blue-300" />
                    <AlertDescription className="text-blue-100">
                      Dados atualizados automaticamente para garantir precisão das vagas disponíveis.
                    </AlertDescription>
                  </Alert>
                )}

                {agenda.motivoBloqueio && !agenda.jaAgendado && !agenda.turnoIniciado && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {agenda.motivoBloqueio}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
