
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings,
  Building2,
  CreditCard,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';

interface AdminMobileBottomNavProps {
  activeMenu: string;
  onMenuClick: (menu: string) => void;
}

export function AdminMobileBottomNav({ activeMenu, onMenuClick }: AdminMobileBottomNavProps) {
  const { isSuperAdmin } = useEmpresaUnificado();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'entregadores', icon: Users, label: 'Entregadores' },
    { id: 'agendas-ativas', icon: Calendar, label: 'Agendas' },
    // RESTRIÇÃO: Dashboard Prioridades apenas para super admin, Empresas para super admin, Planos para admin comum
    ...(isSuperAdmin ? [
      { id: 'dashboard-prioridades', icon: Star, label: 'Prioridades' },
      { id: 'empresas', icon: Building2, label: 'Empresas' }
    ] : [
      { id: 'billing', icon: CreditCard, label: 'Planos' }
    ]),
    { id: 'configuracoes', icon: Settings, label: 'Config' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 z-40">
      <div className="grid grid-cols-5 py-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 px-1 ${
                isActive ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-400'
              }`}
              onClick={() => onMenuClick(item.id)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
