
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, MapPin, X, CheckCircle, AlertCircle, History, Loader2, XCircle, CalendarCheck } from "lucide-react";
import { useMeusAgendamentos, AgendamentoReal } from "@/hooks/useMeusAgendamentos";
import { useConfiguracoesSistema } from "@/hooks/useConfiguracoesSistema";
import { formatarDataCorreta } from "@/lib/utils";

interface MeusAgendamentosProps {
  onNavigate?: (tab: string) => void;
}

export function MeusAgendamentos({ onNavigate }: MeusAgendamentosProps) {
  const {
    agendamentosAtivos,
    agendamentosHistorico,
    loading,
    cancelarAgendamento,
  } = useMeusAgendamentos();

  // Integrar verificação de configurações do sistema
  const { configs, loading: configLoading } = useConfiguracoesSistema();

  const getStatusBadge = (status: string, tipo: string) => {
    switch (status) {
      case "agendado":
        if (tipo === "reserva") {
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Em Reserva</Badge>;
        }
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Agendado</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "concluido":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === "reserva" ? AlertCircle : CheckCircle;
  };

  const podeCancel = (agendamento: AgendamentoReal) => {
    // 1. Verificar se o cancelamento está habilitado no sistema
    if (!configs.permiteCancel) {
      console.log('❌ Cancelamento bloqueado: Configuração do sistema desabilitada');
      return false;
    }

    // 2. Verificar se o agendamento está no status correto
    if (agendamento.status !== "agendado") {
      console.log('❌ Cancelamento bloqueado: Status não é "agendado":', agendamento.status);
      return false;
    }

    // 3. Verificar prazo limite para cancelamento
    const dataAgendamento = new Date(agendamento.data + 'T' + agendamento.agenda.turno.hora_inicio);
    const agora = new Date();
    const diffHoras = (dataAgendamento.getTime() - agora.getTime()) / (1000 * 60 * 60);
    
    console.log(`Verificando cancelamento: prazo limite ${configs.prazoLimiteCancelamento}h, diferença atual: ${diffHoras.toFixed(2)}h`);

    if (diffHoras < configs.prazoLimiteCancelamento) {
      console.log('❌ Cancelamento bloqueado: Prazo limite não atendido');
      return false;
    }

    console.log('✅ Cancelamento permitido');
    return true;
  };

  const handleCancelar = async (id: string) => {
    await cancelarAgendamento(id);
  };

  // Função para determinar o status visual de um agendamento no histórico
  const getStatusHistorico = (agendamento: AgendamentoReal) => {
    if (agendamento.status === 'cancelado') {
      return 'cancelado';
    }
    
    // Se o status é 'agendado' mas já passou, considerar como 'concluído'
    const agora = new Date();
    const dataHoraFim = new Date(`${agendamento.data}T${agendamento.agenda.turno.hora_fim}`);
    
    if (agendamento.status === 'agendado' && dataHoraFim <= agora) {
      return 'concluido';
    }
    
    return agendamento.status;
  };

  // Função para criar badges melhorados com ícones e cores
  const getEnhancedStatusBadge = (status: string, tipo: string) => {
    const badgeConfig = {
      'agendado': { 
        className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
        icon: CheckCircle,
        text: 'Confirmado'
      },
      'cancelado': { 
        className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
        icon: XCircle,
        text: 'Cancelado'
      },
      'concluido': { 
        className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
        icon: CalendarCheck,
        text: 'Concluído'
      }
    };
    
    const config = badgeConfig[status] || badgeConfig['agendado'];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
        {tipo === 'entrega' && ' (Entrega)'}
      </Badge>
    );
  };

  // Função para renderizar alerts visuais baseados no status
  const renderStatusAlert = (agendamento: AgendamentoReal, isHistorico: boolean) => {
    if (agendamento.status === 'cancelado') {
      return (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-300">
            Agendamento cancelado
            {agendamento.data_cancelamento && (
              ` em ${new Date(agendamento.data_cancelamento).toLocaleDateString('pt-BR')}`
            )}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (getStatusHistorico(agendamento) === 'concluido') {
      return (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CalendarCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            Turno concluído com sucesso
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  const renderAgendamentoCard = (agendamento: AgendamentoReal, isHistorico = false) => {
    const TipoIcon = getTipoIcon(agendamento.tipo);
    const dataFormatada = formatarDataCorreta(agendamento.data);
    const podeCancelar = podeCancel(agendamento);
    
    // Para histórico, usar status visual correto
    const statusParaExibir = isHistorico ? getStatusHistorico(agendamento) : agendamento.status;

    return (
      <div key={agendamento.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900/70 dark:border-gray-700 dark:shadow-black/30 dark:hover:shadow-black/40">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
                <TipoIcon className={`h-5 w-5 ${
                  agendamento.tipo === 'entrega' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                }`} />
                <h3 className="font-medium text-lg dark:text-gray-100">{dataFormatada}</h3>
                {getEnhancedStatusBadge(statusParaExibir, agendamento.tipo)}
              </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {agendamento.agenda.turno.nome} ({agendamento.agenda.turno.hora_inicio} - {agendamento.agenda.turno.hora_fim})
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {agendamento.agenda.regiao.nome} - {agendamento.agenda.regiao.cidade.nome}
              </div>
            </div>

            {agendamento.observacoes && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded dark:bg-blue-900/20 dark:border-blue-500">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Observações:</strong> {agendamento.observacoes}
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded dark:bg-gray-800/50 dark:text-gray-400">
              <div>📅 Agendado em: {new Date(agendamento.data_agendamento).toLocaleString('pt-BR')}</div>
              {agendamento.data_cancelamento && (
                <div className="mt-1">
                  ❌ Cancelado em: {new Date(agendamento.data_cancelamento).toLocaleString('pt-BR')}
                </div>
              )}
            </div>

            {/* Mensagem explicativa quando cancelamento não é permitido */}
            {agendamento.status === "agendado" && !isHistorico && !podeCancelar && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                  {!configs.permiteCancel ? (
                    "⚠️ Este agendamento não permite cancelamento"
                  ) : (
                    `⏰ Cancelamento disponível até ${configs.prazoLimiteCancelamento}h antes do turno`
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {agendamento.status === "agendado" && !isHistorico && podeCancelar && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleCancelar(agendamento.id)}
              className="ml-4"
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
        
        {/* Status Alerts */}
        {renderStatusAlert(agendamento, isHistorico)}
      </div>
    );
  };

  if (loading || configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando agendamentos...</span>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meus Agendamentos</h2>
          <p className="text-gray-600 dark:text-gray-300">Visualize e gerencie seus agendamentos de trabalho</p>
        </div>

      <Tabs defaultValue="ativos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ativos" className="relative">
            Agendamentos Ativos
            {agendamentosAtivos.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {agendamentosAtivos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico">
            Histórico
            {agendamentosHistorico.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {agendamentosHistorico.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="space-y-4">
          <Card className="shadow-sm dark:shadow-lg dark:shadow-black/20">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 dark:border-b dark:border-border">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                Meus Agendamentos ({agendamentosAtivos.length})
              </CardTitle>
              <CardDescription className="dark:text-muted-foreground">
                Seus turnos confirmados e lista de reserva (apenas futuros)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {agendamentosAtivos.length > 0 ? (
                <div>
                  <div className="space-y-4">
                    {agendamentosAtivos.map(agendamento => renderAgendamentoCard(agendamento, false))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      💡 Dicas Importantes:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Seus agendamentos passam por análise criteriosa da nossa equipe</li>
                      <li>• Chegue 15 minutos antes do horário do seu turno</li>
                      <li>• Mantenha seus dados sempre atualizados</li>
                      {configs.permiteCancel && (
                        <li>• Cancelamentos são permitidos até {configs.prazoLimiteCancelamento}h antes do turno</li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border dark:border-gray-700">
                    <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">Nenhum agendamento ativo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Que tal se agendar para um próximo turno?</p>
                  <Button onClick={() => onNavigate?.('agendar')} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                    Fazer Novo Agendamento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card className="shadow-sm dark:shadow-lg dark:shadow-black/20">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 dark:border-b dark:border-border">
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                Histórico de Agendamentos ({agendamentosHistorico.length})
              </CardTitle>
              <CardDescription className="dark:text-muted-foreground">
                Agendamentos passados, cancelados e concluídos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {agendamentosHistorico.length > 0 ? (
                <div className="space-y-4">
                  {agendamentosHistorico.map(agendamento => renderAgendamentoCard(agendamento, true))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border dark:border-gray-700">
                    <History className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Nenhum histórico encontrado</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Seus agendamentos passados aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
