import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Calendar,
  MapPin,
  Clock,
  Building2,
  Settings,
  Star,
  UserPlus,
  CreditCard,
  CalendarClock,
  UserCog,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { ExpiryAlert } from "./admin/ExpiryAlert";

interface AdminSidebarProps {
  onMenuClick: (menu: string) => void;
  activeMenu: string;
}

export function AdminSidebar({ onMenuClick, activeMenu }: AdminSidebarProps) {
  const { isSuperAdmin, isAdminEmpresa } = useEmpresaUnificado();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    // RESTRIÇÃO: Dashboard Prioridades apenas para super admin
    ...(isSuperAdmin ? [
      { id: 'dashboard-prioridades', icon: Star, label: 'Prioridades', badge: null }
    ] : []),
    ...(isSuperAdmin || isAdminEmpresa ? [
      { id: 'cadastro-entregadores', icon: UserPlus, label: 'Cadastrar Entregador', badge: null }
    ] : []),
    { id: 'entregadores', icon: Users, label: 'Entregadores', badge: null },
    ...(isSuperAdmin ? [
      { id: 'administradores', icon: UserCog, label: 'Administradores', badge: null }
    ] : []),
    { id: 'agendas-ativas', icon: Calendar, label: 'Agendas Ativas', badge: null },
    { id: 'criar-agendas', icon: Calendar, label: 'Criar Agendas', badge: null },
    { id: 'cidades', icon: MapPin, label: 'Cidades & Regiões', badge: null },
    { id: 'turnos', icon: Clock, label: 'Turnos', badge: null },
    ...(isSuperAdmin ? [
      { id: 'empresas', icon: Building2, label: 'Empresas', badge: null }
    ] : []),
    { id: 'billing', icon: CreditCard, label: 'Planos', badge: null },
    // RESTRIÇÃO: Gestão Vencimentos apenas para super admin
    ...(isSuperAdmin ? [
      { id: 'database-expiry', icon: CalendarClock, label: 'Gestão Vencimentos', badge: null }
    ] : []),
    { id: 'configuracoes', icon: Settings, label: 'Configurações', badge: null },
  ];

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">SlotMaster</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <ExpiryAlert />
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start mb-1 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                onClick={() => onMenuClick(item.id)}
              >
                <Icon className="mr-3 h-5 w-5" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </div>
      
      <Separator />
      
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Shield className="h-4 w-4" />
          <span>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
        </div>
      </div>
    </div>
  );
}
