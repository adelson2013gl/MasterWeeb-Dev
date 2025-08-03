import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, CalendarCheck, LayoutDashboard, Bell } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationsCount?: number;
}

// Função para precarregar componentes
const preloadComponent = (tabId: string) => {
  switch (tabId) {
    case 'agendar':
      import("@/components/entregador/AgendamentoCalendar").catch(() => {});
      break;
    case 'meus-agendamentos':
      import("@/components/entregador/MeusAgendamentos").catch(() => {});
      break;
    case 'notificacoes':
      import("@/components/entregador/NotificacoesReservas").catch(() => {});
      break;
  }
};

export function MobileBottomNav({ activeTab, onTabChange, notificationsCount = 0 }: MobileBottomNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { id: "dashboard", label: "Início", icon: LayoutDashboard },
    { id: "agendar", label: "Agendar", icon: Calendar },
    { id: "meus-agendamentos", label: "Agendamentos", icon: CalendarCheck },
    { id: "notificacoes", label: "Alertas", icon: Bell, badge: notificationsCount }
  ];

  if (!mounted) return null;

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-gray-200 dark:border-gray-800 safe-area-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            className={`flex flex-col items-center justify-center relative touch-target ${
              activeTab === item.id 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => onTabChange(item.id)}
            onTouchStart={() => preloadComponent(item.id)}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <div className={`p-1 rounded-full transition-colors ${
              activeTab === item.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''
            }`}>
              <item.icon className={`h-5 w-5 transition-colors ${
                activeTab === item.id 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
            </div>
            <span className="text-xs mt-1">{item.label}</span>
            
            {item.badge && item.badge > 0 && (
              <span className="absolute top-0 right-1/4 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-medium">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
