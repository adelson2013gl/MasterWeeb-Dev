import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarDays, Clock, MapPin, Package, Users, Bell, X, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { safeStatus, safeTipo } from "@/lib/enumSafety";

interface Reserva {
  id: string;
  agenda_id: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  created_at: string;
  agenda: {
    data_agenda: string;
    vagas_disponiveis: number;
    vagas_ocupadas: number;
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

export function StatusReservas() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState<string | null>(null);

  const fetchReservas = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // CORRIGIDO: status do entregador precisa ser 'aprovado' literal
      const { data: entregadorData, error: entregadorError } = await supabase
        .from('entregadores')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'aprovado')
        .single();

      if (entregadorError || !entregadorData) {
        logger.error('Erro ao buscar entregador', { error: entregadorError }, 'STATUS_RESERVAS');
        setLoading(false);
        return;
      }

      // CORRIGIDO: usar apenas status válidos do banco (sem 'agendado')
      const statusReservasValidos = ['pendente'];

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          agenda_id,
          status,
          created_at,
          agendas!agenda_id (
            data_agenda,
            vagas_disponiveis,
            vagas_ocupadas,
            turnos!turno_id (
              nome,
              hora_inicio,
              hora_fim
            ),
            regioes!regiao_id (
              nome,
              cidades!cidade_id (
                nome
              )
            )
          )
        `)
        .eq('entregador_id', entregadorData.id)
        .eq('tipo', safeTipo('entrega'))
        .in('status', statusReservasValidos)
        .gte('agendas.data_agenda', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erro ao buscar reservas', { error }, 'STATUS_RESERVAS');
        toast.error('Erro ao carregar reservas');
        return;
      }

      const reservasFormatadas = data?.map(item => ({
        id: item.id,
        agenda_id: item.agenda_id,
        status: item.status as 'pendente' | 'em_andamento' | 'concluido' | 'cancelado',
        created_at: item.created_at,
        agenda: {
          data_agenda: item.agendas.data_agenda,
          vagas_disponiveis: item.agendas.vagas_disponiveis,
          vagas_ocupadas: item.agendas.vagas_ocupadas,
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
      })) || [];

      setReservas(reservasFormatadas);
      
      logger.info('Reservas carregadas', {
        total: reservasFormatadas.length,
        pendentes: reservasFormatadas.filter(r => r.status === 'pendente').length,
        confirmadas: reservasFormatadas.filter(r => r.status === 'agendado').length
      }, 'STATUS_RESERVAS');
      
    } catch (error) {
      logger.error('Erro inesperado ao buscar reservas', { error }, 'STATUS_RESERVAS');
      toast.error('Erro inesperado ao carregar reservas');
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (reservaId: string) => {
    try {
      setCancelando(reservaId);
      
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: safeStatus('cancelado') })
        .eq('id', reservaId);

      if (error) {
        logger.error('Erro ao cancelar reserva', { error, reservaId }, 'STATUS_RESERVAS');
        toast.error('Erro ao cancelar reserva');
        return;
      }

      toast.success('Reserva cancelada com sucesso');
      fetchReservas(); // Recarregar lista
      
      logger.info('Reserva cancelada', { reservaId }, 'STATUS_RESERVAS');
      
    } catch (error) {
      logger.error('Erro inesperado ao cancelar reserva', { error, reservaId }, 'STATUS_RESERVAS');
      toast.error('Erro inesperado ao cancelar reserva');
    } finally {
      setCancelando(null);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando
          </Badge>
        );
      case 'agendado':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmada
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = (reserva: Reserva) => {
    const vagasLivres = reserva.agenda.vagas_disponiveis - reserva.agenda.vagas_ocupadas;
    
    if (reserva.status === 'agendado') {
      return {
        type: 'success' as const,
        message: 'Sua reserva foi confirmada! Você tem uma vaga garantida neste turno.'
      };
    }
    
    if (vagasLivres > 0) {
      return {
        type: 'info' as const,
        message: `Boa notícia! ${vagasLivres} vaga(s) disponível(is). Você pode agendar diretamente agora.`
      };
    }
    
    return {
      type: 'warning' as const,
      message: 'Aguardando liberação de vaga. Você será notificado se alguém cancelar.'
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Minhas Reservas
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

  if (reservas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Minhas Reservas
          </CardTitle>
          <CardDescription>
            Acompanhe o status das suas reservas de turno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Você não possui reservas ativas</p>
            <p className="text-sm text-gray-400 mt-1">
              Faça uma reserva quando os turnos estiverem lotados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Minhas Reservas
        </CardTitle>
        <CardDescription>
          {reservas.length} reserva(s) ativa(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reservas.map(reserva => {
            const statusInfo = getStatusMessage(reserva);
            const dataFormatada = new Date(reserva.agenda.data_agenda + 'T00:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              weekday: 'long'
            });

            return (
              <div key={reserva.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{reserva.agenda.turno.nome}</h3>
                    <p className="text-sm text-gray-600">
                      {reserva.agenda.turno.hora_inicio} às {reserva.agenda.turno.hora_fim}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dataFormatada}
                    </p>
                    <p className="text-sm text-gray-500">
                      {reserva.agenda.regiao.nome} - {reserva.agenda.regiao.cidade.nome}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(reserva.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelarReserva(reserva.id)}
                      disabled={cancelando === reserva.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {cancelando === reserva.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Alert className={`${
                  statusInfo.type === 'success' ? 'border-green-200 bg-green-50' :
                  statusInfo.type === 'info' ? 'border-blue-200 bg-blue-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}>
                  <AlertCircle className={`h-4 w-4 ${
                    statusInfo.type === 'success' ? 'text-green-600' :
                    statusInfo.type === 'info' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`} />
                  <AlertDescription className={`${
                    statusInfo.type === 'success' ? 'text-green-800' :
                    statusInfo.type === 'info' ? 'text-blue-800' :
                    'text-yellow-800'
                  }`}>
                    {statusInfo.message}
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Vagas: {reserva.agenda.vagas_ocupadas}/{reserva.agenda.vagas_disponiveis}
                  </span>
                  <span>
                    Reserva feita em {new Date(reserva.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
