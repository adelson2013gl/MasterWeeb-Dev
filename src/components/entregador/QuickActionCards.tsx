import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarCheck, Clock, TrendingUp } from "lucide-react";
import { useMeusAgendamentos } from "@/hooks/useMeusAgendamentos";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuickActionCardsProps {
  onNavigate: (tab: string) => void;
}

export function QuickActionCards({ onNavigate }: QuickActionCardsProps) {
  const { agendamentosAtivos, agendamentosHistorico } = useMeusAgendamentos();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <Card className="h-20">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  const proximoAgendamento = agendamentosAtivos[0];
  const totalConcluidos = agendamentosHistorico.filter(a => a.status === 'concluido').length;

  const formatarDataSegura = (data: string) => {
    if (!data) return 'Data não informada';
    
    try {
      const dataObj = parseISO(data);
      if (!isValid(dataObj)) return 'Data inválida';
      return format(dataObj, 'dd/MM', { locale: ptBR });
    } catch (error) {
      return 'Erro na data';
    }
  };

  // Função para precarregar componentes
  const preloadComponent = (componentId: string) => {
    switch (componentId) {
      case 'agendar':
        import("@/components/entregador/AgendamentoCalendar").catch(() => {});
        break;
      case 'agendamentos':
        import("@/components/entregador/MeusAgendamentos").catch(() => {});
        break;
    }
  };

  // Cards essenciais - apenas 2 principais com textos adaptativos
  const mainCards = [
    {
      id: 'agendar',
      title: 'Novo Agendamento',
      titleCompact: 'Novo Agend.',
      titleMobile: 'Agendar',
      titleMini: 'Novo',
      subtitle: 'Agendar turno',
      subtitleCompact: 'Novo turno',
      subtitleMobile: 'Turno',
      icon: Plus,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      action: () => onNavigate('agendar'),
      primary: true
    },
    {
      id: 'agendamentos',
      title: 'Meus Agendamentos',
      titleCompact: 'Agendamentos',
      titleMobile: 'Agendas',
      titleMini: 'Meus',
      subtitle: `${agendamentosAtivos.length} ativo${agendamentosAtivos.length !== 1 ? 's' : ''}`,
      subtitleCompact: `${agendamentosAtivos.length} ativo${agendamentosAtivos.length !== 1 ? 's' : ''}`,
      subtitleMobile: `${agendamentosAtivos.length} ativo${agendamentosAtivos.length !== 1 ? 's' : ''}`,
      icon: CalendarCheck,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300',
      iconBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      action: () => onNavigate('meus-agendamentos'),
      badge: agendamentosAtivos.length > 0 ? agendamentosAtivos.length : undefined
    }
  ];

  // Card de informação compacto (apenas se houver dados relevantes)
  const infoCard = proximoAgendamento ? {
    id: 'proximo',
    title: 'Próximo Turno',
    subtitle: `${formatarDataSegura(proximoAgendamento.data_agenda)} • ${proximoAgendamento.turno_nome}`,
    icon: Clock,
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    action: () => onNavigate('meus-agendamentos'),
    compact: true
  } : null;

  return (
    <div className="space-y-3">
      {/* Cards principais - 2 botões de ação */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 quickaction-card-grid">
        {mainCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className={`glass-card hover:glass-card-hover border-glass cursor-pointer h-20 sm:h-20 ${card.bgColor} relative overflow-hidden w-full`}
                onClick={card.action}
                onMouseEnter={() => preloadComponent(card.id)}
                onTouchStart={() => preloadComponent(card.id)}
              >
                <CardContent className="p-2 sm:p-3 h-full flex items-center quickaction-card-content">
                  <div className="flex items-center w-full min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 ${card.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3 quickaction-card-icon`}>
                      <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 mr-1">
                      {/* Título responsivo - diferentes versões por tamanho de tela */}
                      <h3 className={`font-semibold ${card.textColor} leading-tight quickaction-card-title card-text-safe`}>
                        <span className="hidden lg:block text-sm">
                          {card.title}
                        </span>
                        <span className="hidden md:block lg:hidden text-sm">
                          {card.titleCompact}
                        </span>
                        <span className="hidden sm:block md:hidden text-xs">
                          {card.titleMobile}
                        </span>
                        <span className="block sm:hidden text-xs">
                          {card.titleMini}
                        </span>
                      </h3>
                      {/* Subtítulo responsivo */}
                      <p className={`${card.textColor} opacity-80 leading-tight quickaction-card-subtitle card-text-safe`}>
                        <span className="hidden md:block text-xs">
                          {card.subtitle}
                        </span>
                        <span className="hidden sm:block md:hidden text-xs">
                          {card.subtitleCompact}
                        </span>
                        <span className="block sm:hidden text-xs">
                          {card.subtitleMobile || card.subtitle}
                        </span>
                      </p>
                    </div>
                    {card.badge && (
                      <Badge 
                        variant="secondary" 
                        className="bg-white/80 text-gray-700 text-xs h-4 px-1 sm:px-1.5 flex-shrink-0 ml-1 max-w-[40px] overflow-hidden"
                      >
                        <span className="truncate">
                          {card.badge > 99 ? '99+' : card.badge}
                        </span>
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Card de informação compacto (apenas se houver próximo agendamento) */}
      {infoCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              className={`glass-card hover:glass-card-hover border-glass cursor-pointer h-14 sm:h-16 ${infoCard.bgColor} w-full overflow-hidden`}
              onClick={infoCard.action}
              onMouseEnter={() => preloadComponent('agendamentos')}
              onTouchStart={() => preloadComponent('agendamentos')}
            >
              <CardContent className="p-2 sm:p-3 h-full flex items-center quickaction-card-content">
                <div className="flex items-center w-full min-w-0">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 ${infoCard.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3 quickaction-card-icon`}>
                    <infoCard.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${infoCard.textColor} leading-tight quickaction-card-title card-text-safe`}>
                      <span className="hidden md:block text-xs">
                        {infoCard.title}
                      </span>
                      <span className="hidden sm:block md:hidden text-xs">
                        Próximo
                      </span>
                      <span className="block sm:hidden text-xs">
                        Prox.
                      </span>
                    </h3>
                    <p className={`${infoCard.textColor} opacity-80 text-xs leading-tight quickaction-card-subtitle card-text-safe`}>
                      {infoCard.subtitle}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Estatística compacta de performance (apenas se houver histórico) */}
      {totalConcluidos > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 min-w-0">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="truncate">
                <span className="hidden md:block">
                  {totalConcluidos} entrega{totalConcluidos !== 1 ? 's' : ''} concluída{totalConcluidos !== 1 ? 's' : ''}
                </span>
                <span className="hidden sm:block md:hidden">
                  {totalConcluidos} entrega{totalConcluidos !== 1 ? 's' : ''}
                </span>
                <span className="block sm:hidden">
                  {totalConcluidos} done
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}