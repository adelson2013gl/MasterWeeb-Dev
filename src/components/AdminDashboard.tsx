
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/AdminSidebar";
import { DashboardContent } from "@/components/DashboardContent";
import { GestaoEntregadores } from "@/components/admin/GestaoEntregadores";
import { AgendasAtivas } from "@/components/admin/AgendasAtivas";
import CriacaoAgendas from "@/components/admin/CriacaoAgendas";
import { GestaoCidades } from "@/components/admin/GestaoCidades";
import { GestaoTurnos } from "@/components/admin/GestaoTurnos";
import { ConfiguracoesSistema } from "@/components/admin/ConfiguracoesSistema";
import { ConfiguracoesPage } from "@/pages/admin/ConfiguracoesPage";
import { GestaoEmpresas } from "./admin/GestaoEmpresas";
import { CadastroEntregadorAdmin } from "./admin/CadastroEntregadorAdmin";
import { DashboardPrioridades } from "./admin/DashboardPrioridades";
import GestaoAdministradores from "./admin/GestaoAdministradores";
import { ExportAgendasButton } from "./admin/ExportAgendasButton";
import { BillingDashboard } from "./billing/BillingDashboard";
import { AdminMobileBottomNav } from "./admin/AdminMobileBottomNav";
import { EmpresaSelector } from "./EmpresaSelector";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { SyncStatus } from "@/components/ui/sync-status";
import { InstallButton } from "@/components/InstallButton";
import { DatabaseExpiryStatus } from "./admin/DatabaseExpiryStatus";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

function AdminDashboardContent() {
  const { signOut } = useAuth();
  const { isSuperAdmin, isAdminEmpresa, empresa } = useEmpresaUnificado();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Wrapper function para corrigir tipo do onClick
  const handleSignOut = () => {
    signOut();
  };

  const handleMenuClick = (menu: string) => {
    // RESTRIÇÃO: Verificar se admin comum está tentando acessar Status do Banco
    if (menu === 'database-expiry' && !isSuperAdmin) {
      toast.error('Acesso negado', {
        description: 'Apenas Super Administradores podem acessar o Status do Banco'
      });
      return;
    }
    
    // RESTRIÇÃO: Verificar se admin comum está tentando acessar Dashboard Prioridades
    if (menu === 'dashboard-prioridades' && !isSuperAdmin) {
      toast.error('Acesso negado', {
        description: 'Apenas Super Administradores podem acessar o Dashboard de Prioridades'
      });
      return;
    }
    
    setActiveMenu(menu);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardContent />;
      case 'cadastro-entregadores':
        return <CadastroEntregadorAdmin />;
      case 'entregadores':
        return <GestaoEntregadores />;
      case 'administradores':
        return <GestaoAdministradores />;
      case 'agendas-ativas':
        return <AgendasAtivas />;
      case 'criar-agendas':
        return <CriacaoAgendas />;
      case 'cidades':
        return <GestaoCidades />;
      case 'turnos':
        return <GestaoTurnos />;
      case 'empresas':
        return <GestaoEmpresas />;
      case 'configuracoes':
        // CORREÇÃO: Apenas super admins podem acessar configurações completas (incluindo Mercado Pago)
        return isSuperAdmin ? <ConfiguracoesPage /> : <ConfiguracoesSistema />;
      case 'dashboard-prioridades':
        // RESTRIÇÃO: Verificar permissão para acessar Dashboard Prioridades
        if (!isSuperAdmin) {
          toast.error('Acesso negado', {
            description: 'Apenas Super Administradores podem acessar o Dashboard de Prioridades'
          });
          setActiveMenu('dashboard');
          return <DashboardContent />;
        }
        return <DashboardPrioridades />;
      case 'database-expiry':
        // RESTRIÇÃO: Verificar permissão para acessar Status do Banco
        if (!isSuperAdmin) {
          toast.error('Acesso negado', {
            description: 'Apenas Super Administradores podem acessar o Status do Banco'
          });
          setActiveMenu('dashboard');
          return <DashboardContent />;
        }
        return <DatabaseExpiryStatus />;
      case 'billing':
        return (
          <BillingDashboard 
            empresaId={empresa?.id || ''}
            empresaNome={empresa?.nome || ''}
            empresaEmail={empresa?.email || ''}
          />
        );
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <AdminSidebar onMenuClick={handleMenuClick} activeMenu={activeMenu} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-lg dark:bg-gray-800">
            <AdminSidebar onMenuClick={handleMenuClick} activeMenu={activeMenu} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                  Painel Administrativo
                </h1>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
                {/* Ocultar em telas muito pequenas */}
                <div className="hidden sm:flex items-center gap-2">
                  <ConnectionStatus />
                  <SyncStatus />
                  <InstallButton variant="ghost" size="sm" />
                </div>
                
                {/* Mostrar apenas em telas médias e grandes */}
                <div className="hidden md:flex items-center gap-2">
                  {/* CORREÇÃO DE SEGURANÇA: Mostrar ExportAgendasButton apenas para admins */}
                  {(isSuperAdmin || isAdminEmpresa) && <ExportAgendasButton />}
                  <EmpresaSelector />
                </div>
                
                {/* Botão de instalação para mobile */}
                <div className="sm:hidden">
                  <InstallButton variant="ghost" size="icon" showText={false} />
                </div>
                
                {/* Botão de logout sempre visível */}
                <Button onClick={handleSignOut} variant="outline" size="sm" className="flex-shrink-0">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={`flex-1 overflow-auto w-full ${isMobile ? 'pb-20' : ''}`}>
          <div className="p-6 w-full max-w-none">
            {renderContent()}
          </div>
        </main>
        
        {isMobile && (
          <AdminMobileBottomNav 
            activeMenu={activeMenu} 
            onMenuClick={handleMenuClick} 
          />
        )}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  return <AdminDashboardContent />;
}
