import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar, ChevronRight } from "lucide-react";
import { useMeusAgendamentos } from "@/hooks/useMeusAgendamentos";
import { format, isToday, isTomorrow, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimelineAgendamentosProps {
  onViewAll?: () => void;
}

export function TimelineAgendamentos({ onViewAll }: TimelineAgendamentosProps) {
  const { agendamentosAtivos, loading } = useMeusAgendamentos();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <Card className="glass-card border-glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-responsive-base flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Meus Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const proximosAgendamentos = agendamentosAtivos.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatarData = (data: string) => {
    if (!data) {
      console.warn('TimelineAgendamentos: Data vazia recebida');
      return 'Data não informada';
    }
    
    console.log('TimelineAgendamentos: Formatando data:', data);
    
    try {
      // Parse da data ISO string para garantir interpretação correta
      const dataAgendamento = parseISO(data);
      
      if (!isValid(dataAgendamento)) {
        console.warn('TimelineAgendamentos: Data inválida recebida:', data);
        return 'Data inválida';
      }
      
      let resultado;
      if (isToday(dataAgendamento)) {
        resultado = 'Hoje';
      } else if (isTomorrow(dataAgendamento)) {
        resultado = 'Amanhã';
      } else {
        resultado = format(dataAgendamento, 'dd/MM', { locale: ptBR });
      }
      
      console.log('TimelineAgendamentos: Data formatada:', resultado);
      return resultado;
    } catch (error) {
      console.error('TimelineAgendamentos: Erro ao formatar data:', error, data);
      return 'Erro na data';
    }
  };

  if (proximosAgendamentos.length === 0) {
    return (
      <Card className="glass-card border-glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-responsive-base flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Meus Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum agendamento próximo</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Que tal agendar um novo turno?
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-responsive-base flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Meus Agendamentos
          </CardTitle>
          {agendamentosAtivos.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="text-xs p-1 h-auto"
            >
              Ver todos
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {proximosAgendamentos.map((agendamento, index) => (
            <motion.div
              key={agendamento.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {/* Indicador de status */}
                <div className={`w-2 h-2 rounded-full mr-3 mt-2 flex-shrink-0 ${
                  agendamento.status === 'agendado' ? 'bg-green-500' :
                  agendamento.status === 'pendente' ? 'bg-yellow-500' :
                  agendamento.status === 'confirmada' ? 'bg-blue-500' : 'bg-gray-500'
                }`}></div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {agendamento.turno_nome}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(agendamento.status)}`}
                    >
                      {agendamento.status === 'agendado' ? 'Confirmado' :
                       agendamento.status === 'pendente' ? 'Pendente' :
                       agendamento.status === 'confirmada' ? 'Confirmada' : agendamento.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 space-x-3">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatarData(agendamento.data_agenda)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{agendamento.hora_inicio} - {agendamento.hora_fim}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{agendamento.regiao_nome} • {agendamento.cidade_nome}</span>
                  </div>
                </div>
              </div>
              
              {/* Linha conectora (exceto no último item) */}
              {index < proximosAgendamentos.length - 1 && (
                <div className="absolute left-4 top-12 w-0.5 h-3 bg-gray-200 dark:bg-gray-700"></div>
              )}
            </motion.div>
          ))}
        </div>
        
        {agendamentosAtivos.length > 3 && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onViewAll}
              className="w-full glass-card hover:glass-card-hover border-glass text-xs"
            >
              Ver todos os {agendamentosAtivos.length} agendamentos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}