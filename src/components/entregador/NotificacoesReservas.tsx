import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, CheckCircle, X, Clock, Users, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { safeTipo } from "@/lib/enumSafety";

interface Notificacao {
  id: string;
  tipo: 'vaga_liberada' | 'reserva_confirmada' | 'reserva_cancelada' | 'lembrete';
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  agenda_id?: string;
  agenda?: {
    data: string;
    turno: {
      nome: string;
      hora_inicio: string;
      hora_fim: string;
    };
    regiao: {
      nome: string;
      cidade: {
        nome: string;
      };
    };
  };
}

export function NotificacoesReservas() {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcandoLida, setMarcandoLida] = useState<string | null>(null);

  const fetchNotificacoes = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Buscar entregador
      const { data: entregadorData, error: entregadorError } = await supabase
        .from('entregadores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (entregadorError || !entregadorData) {
        logger.error('Erro ao buscar entregador', { error: entregadorError }, 'NOTIFICACOES_RESERVAS');
        return;
      }

      // Buscar notificações (simulando uma tabela de notificações)
      // Por enquanto, vamos buscar agendamentos recentes como notificações
      // CORREÇÃO CRÍTICA: Usar safeTipo() para tipo_agendamento enum
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          tipo,
          status,
          created_at,
          updated_at,
          agenda_id,
          agendas!inner (
            data_agenda,
            turnos!inner (
              nome,
              hora_inicio,
              hora_fim
            ),
            regioes!inner (
              nome,
              cidades!inner (
                nome
              )
            )
          )
        `)
        .eq('entregador_id', entregadorData.id)
        .eq('tipo', safeTipo('entrega'))
        .gte('created_at', new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()) // Últimas 8 horas
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Erro ao buscar notificações', { error }, 'NOTIFICACOES_RESERVAS');
        toast.error('Erro ao carregar notificações');
        return;
      }

      // Converter agendamentos em notificações
      const notificacoesFormatadas: Notificacao[] = data?.map(item => {
        let tipo: Notificacao['tipo'] = 'lembrete';
        let titulo = '';
        let mensagem = '';

        switch (item.status) {
          case 'pendente':
            tipo = 'reserva_confirmada';
            titulo = 'Você Está na Lista de Reserva';
            mensagem = `Sua reserva para ${item.agendas.turnos.nome} foi confirmada e está na lista de espera.`;
            break;
          case 'confirmada':
            tipo = 'vaga_liberada';
            titulo = 'Vaga Liberada!';
            mensagem = `Uma vaga foi liberada para ${item.agendas.turnos.nome}. Você pode agendar agora!`;
            break;
          case 'cancelado':
            tipo = 'reserva_cancelada';
            titulo = 'Reserva Cancelada';
            mensagem = `Sua reserva para ${item.agendas.turnos.nome} foi cancelada.`;
            break;
          default:
            tipo = 'lembrete';
            titulo = 'Lembrete de Reserva';
            mensagem = `Você tem uma reserva ativa para ${item.agendas.turnos.nome}.`;
        }

        return {
          id: item.id,
          tipo,
          titulo,
          mensagem,
          lida: false, // Por enquanto, todas não lidas
          created_at: item.updated_at || item.created_at,
          agenda_id: item.agenda_id,
          agenda: {
            data: item.agendas.data_agenda,
            turno: {
              nome: item.agendas.turnos.nome,
              hora_inicio: item.agendas.turnos.hora_inicio,
              hora_fim: item.agendas.turnos.hora_fim,
            },
            regiao: {
              nome: item.agendas.regioes.nome,
              cidade: {
                nome: item.agendas.regioes.cidades.nome,
              },
            },
          },
        };
      }) || [];

      setNotificacoes(notificacoesFormatadas);
      
      logger.info('Notificações carregadas', {
        total: notificacoesFormatadas.length,
        naoLidas: notificacoesFormatadas.filter(n => !n.lida).length
      }, 'NOTIFICACOES_RESERVAS');
      
    } catch (error) {
      logger.error('Erro inesperado ao buscar notificações', { error }, 'NOTIFICACOES_RESERVAS');
      toast.error('Erro inesperado ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (notificacaoId: string) => {
    try {
      setMarcandoLida(notificacaoId);
      
      // Atualizar localmente
      setNotificacoes(prev => 
        prev.map(n => 
          n.id === notificacaoId ? { ...n, lida: true } : n
        )
      );
      
      logger.info('Notificação marcada como lida', { notificacaoId }, 'NOTIFICACOES_RESERVAS');
      
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida', { error, notificacaoId }, 'NOTIFICACOES_RESERVAS');
    } finally {
      setMarcandoLida(null);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      toast.success('Todas as notificações foram marcadas como lidas');
      
      logger.info('Todas as notificações marcadas como lidas', {}, 'NOTIFICACOES_RESERVAS');
      
    } catch (error) {
      logger.error('Erro ao marcar todas como lidas', { error }, 'NOTIFICACOES_RESERVAS');
    }
  };

  useEffect(() => {
    fetchNotificacoes();
  }, [user?.id]);

  const getIconeNotificacao = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'vaga_liberada':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'reserva_confirmada':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'reserva_cancelada':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getCorNotificacao = (tipo: Notificacao['tipo'], lida: boolean = false) => {
    if (lida) {
      switch (tipo) {
        case 'vaga_liberada':
          return 'border-green-600/30 bg-green-900/20 opacity-60 text-green-200';
        case 'reserva_confirmada':
          return 'border-blue-600/30 bg-blue-900/20 opacity-60 text-blue-200';
        case 'reserva_cancelada':
          return 'border-red-600/30 bg-red-900/20 opacity-60 text-red-200';
        default:
          return 'border-yellow-600/30 bg-yellow-900/20 opacity-60 text-yellow-200';
      }
    } else {
      switch (tipo) {
        case 'vaga_liberada':
          return 'border-green-500/50 bg-green-800/30 shadow-lg text-green-100 backdrop-blur-sm';
        case 'reserva_confirmada':
          return 'border-blue-500/50 bg-blue-800/30 shadow-lg text-blue-100 backdrop-blur-sm';
        case 'reserva_cancelada':
          return 'border-red-500/50 bg-red-800/30 shadow-lg text-red-100 backdrop-blur-sm';
        default:
          return 'border-yellow-500/50 bg-yellow-800/30 shadow-lg text-yellow-100 backdrop-blur-sm';
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notificações
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

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);

  if (notificacoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notificações
          </CardTitle>
          <CardDescription>
            Acompanhe atualizações sobre suas reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma notificação encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              Você será notificado sobre mudanças nas suas reservas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-white">
              <Bell className="h-5 w-5 mr-2 text-blue-300" />
              Notificações
              {notificacoesNaoLidas.length > 0 && (
                <Badge className="ml-2 bg-red-600 text-white border-red-500">
                  {notificacoesNaoLidas.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {notificacoes.length} notificação(ões) • {notificacoesNaoLidas.length} não lida(s)
            </CardDescription>
          </div>

        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notificacoes.map(notificacao => {
            const dataFormatada = new Date(notificacao.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <Alert 
                key={notificacao.id} 
                className={`${getCorNotificacao(notificacao.tipo, notificacao.lida)} transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getIconeNotificacao(notificacao.tipo)}
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-sm text-white">{notificacao.titulo}</h4>
                          {!notificacao.lida && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <AlertDescription className="text-sm mb-2 text-slate-200 font-medium">
                          {notificacao.mensagem}
                        </AlertDescription>
                        {notificacao.agenda && (
                          <div className="text-sm text-slate-300 space-y-1 font-medium">
                            <p>
                              📅 {new Date(notificacao.agenda.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                weekday: 'short'
                              })}
                            </p>
                            <p>
                              🕐 {notificacao.agenda.turno.hora_inicio} às {notificacao.agenda.turno.hora_fim}
                            </p>
                            <p>
                              📍 {notificacao.agenda.regiao.nome} - {notificacao.agenda.regiao.cidade.nome}
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-slate-400 mt-2 font-medium">{dataFormatada}</p>
                      </div>
                  </div>
                  {!notificacao.lida && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => marcarComoLida(notificacao.id)}
                      disabled={marcandoLida === notificacao.id}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-1 h-auto"
                    >
                      {marcandoLida === notificacao.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </Alert>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
