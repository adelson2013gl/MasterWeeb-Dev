import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Users, Calendar, AlertCircle, TrendingUp } from "lucide-react";
import { useReservasAtivas } from "@/hooks/useReservasAtivas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CardReservasAtivas() {
  const { reservas, stats, loading } = useReservasAtivas();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Reservas Ativas
          </CardTitle>
          <CardDescription>
            Carregando dados de reservas...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card Principal de Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Reservas Ativas
          </CardTitle>
          <CardDescription>
            Entregadores aguardando liberação de vagas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {stats.totalReservas}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <Badge variant="secondary">
                  {stats.reservasPendentes}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hoje</span>
                <Badge variant={stats.reservasHoje > 0 ? "destructive" : "outline"}>
                  {stats.reservasHoje}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Próx. 7 dias</span>
                <Badge variant="outline">
                  {stats.reservasProximos7Dias}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta se houver muitas reservas */}
      {stats.reservasPendentes > 5 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Alta demanda detectada:</strong> {stats.reservasPendentes} entregadores em lista de reserva. 
            Considere criar mais agendas ou aumentar vagas existentes.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista das Últimas Reservas */}
      {reservas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Últimas Reservas
            </CardTitle>
            <CardDescription>
              {reservas.length > 5 ? 'Mostrando as 5 mais recentes' : `${reservas.length} reserva(s) ativa(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservas.slice(0, 5).map((reserva) => {
                const dataFormatada = format(
                  new Date(reserva.agenda.data_agenda + 'T00:00:00'), 
                  "dd/MM", 
                  { locale: ptBR }
                );
                
                return (
                  <div key={reserva.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{reserva.entregador.nome}</span>
                        <Badge variant={reserva.status === 'pendente' ? 'secondary' : 'default'} className="text-xs">
                          {reserva.status === 'pendente' ? 'Pendente' : 'Confirmada'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {dataFormatada} • {reserva.agenda.turno.nome} • {reserva.agenda.regiao.cidade.nome}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span 
                          key={i} 
                          className={`text-xs ${
                            i < reserva.entregador.estrelas ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {reservas.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Ver todas as {reservas.length} reservas
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {stats.totalReservas === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma reserva ativa no momento</p>
              <p className="text-xs mt-1">Entregadores aparecerão aqui quando entrarem em listas de reserva</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}