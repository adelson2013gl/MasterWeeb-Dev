
import { useState, lazy, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Shield, AlertTriangle, Building2, CalendarCheck } from "lucide-react";
import { MobileBottomNav } from "@/components/entregador/MobileBottomNav";
import { QuickActionCards } from "@/components/entregador/QuickActionCards";
import { TimelineAgendamentosWithSuspense, SimpleLoader } from "@/components/LazyComponents";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEntregadorData } from "@/hooks/useEntregadorData";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { usePreloadComponents } from "@/hooks/usePreloadComponents";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { SyncStatus } from "@/components/ui/sync-status";
import { InstallButton } from "@/components/InstallButton";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

// Lazy loading para componentes pesados com loading otimizado
const AgendamentoCalendar = lazy(() => import("@/components/entregador/AgendamentoCalendar").then(module => ({ default: module.AgendamentoCalendar })));
const MeusAgendamentos = lazy(() => import("@/components/entregador/MeusAgendamentos").then(module => ({ default: module.MeusAgendamentos })));
const StatusReservas = lazy(() => import("@/components/entregador/StatusReservas").then(module => ({ default: module.StatusReservas })));
const NotificacoesReservas = lazy(() => import("@/components/entregador/NotificacoesReservas").then(module => ({ default: module.NotificacoesReservas })));
const PerfilEntregador = lazy(() => import("@/components/entregador/PerfilEntregador").then(module => ({ default: module.PerfilEntregador })));

// Hook para detectar parâmetros URL dos shortcuts PWA
const useShortcutNavigation = () => {
  const [initialTab, setInitialTab] = useState<string | null>(null);

  useEffect(() => {
    // Detectar parâmetro 'tab' da URL (vindo dos shortcuts PWA)
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    // Mapear tabs válidos dos shortcuts
    const validTabs = ['agendar', 'meus-agendamentos'];
    
    if (tabParam && validTabs.includes(tabParam)) {
      setInitialTab(tabParam);
      console.log('🚀 PWA Shortcut detectado:', tabParam);
      
      // Limpar URL após processar o shortcut
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return initialTab;
};

export function EntregadorDashboard() {
  const shortcutTab = useShortcutNavigation();
  const [activeTab, setActiveTab] = useState(shortcutTab || "dashboard");
  const { signOut, user } = useAuth();
  const isMobile = useIsMobile();
  const { entregador } = useEntregadorData();
  const { empresa } = useEmpresaUnificado();
  const { preloadOnHover } = usePreloadComponents();

  // Atualizar activeTab quando shortcut for detectado
  useEffect(() => {
    if (shortcutTab) {
      setActiveTab(shortcutTab);
    }
  }, [shortcutTab]);

  // Wrapper function para corrigir tipo do onClick
  const handleSignOut = () => {
    signOut();
  };

  // Função para navegação com atualização de URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Atualizar URL para manter estado (útil para compartilhamento)
    if (tab !== 'dashboard') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
    } else {
      // Remover parâmetro tab quando voltar ao dashboard
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      window.history.pushState({}, '', url.toString());
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "perfil":
        return (
          <Suspense fallback={<SimpleLoader text="Carregando perfil..." />}>
            <PerfilEntregador onBack={() => handleTabChange('dashboard')} />
          </Suspense>
        );
      case "agendar":
        return (
          <Suspense fallback={<SimpleLoader text="Carregando agendas..." />}>
            <AgendamentoCalendar />
          </Suspense>
        );
      case "meus-agendamentos":
        return (
          <Suspense fallback={<SimpleLoader text="Carregando seus agendamentos..." />}>
            <MeusAgendamentos onNavigate={handleTabChange} />
          </Suspense>
        );
      case "reservas":
        return (
          <Suspense fallback={<SimpleLoader text="Carregando reservas..." />}>
            <StatusReservas />
          </Suspense>
        );
      case "notificacoes":
        return (
          <Suspense fallback={<SimpleLoader text="Carregando notificações..." />}>
            <NotificacoesReservas />
          </Suspense>
        );
      default:
        return (
          <motion.div 
            className={`space-y-4 ${isMobile ? 'pb-20' : ''}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Status do Entregador - Simplificado */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card border-glass">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleTabChange('perfil')}
                      className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3 hover:scale-105 transition-transform touch-target"
                    >
                      <User className="h-5 w-5 text-white" />
                    </button>
                    <div className="flex-1">
                      <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Olá, {entregador?.nome || 'Entregador'}!
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                          ✓ Ativo
                        </Badge>
                        {empresa && (
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {empresa.nome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cards de Ação Rápida */}
            <motion.div variants={itemVariants}>
              <QuickActionCards onNavigate={handleTabChange} />
            </motion.div>

            {/* Timeline de Agendamentos */}
            <motion.div variants={itemVariants}>
              <TimelineAgendamentosWithSuspense 
                onViewAll={() => handleTabChange('meus-agendamentos')}
                fallback={<SimpleLoader text="Carregando timeline..." />}
              />
            </motion.div>

            {/* Lembrete de Segurança - Minimalista */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-3 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="w-7 h-7 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    🚛 Dirija com segurança!
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-300">
                    Sua vida vale mais que qualquer entrega
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 safe-area">
      {/* Mobile Header - Compacto */}
      <motion.header 
        className="glass-nav sticky top-0 z-40 md:hidden px-4 py-2.5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleTabChange('perfil')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded-lg hover:scale-105 transition-transform touch-target"
            >
              <User className="h-4 w-4 text-white" />
            </button>
            <h1 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SlotMaster
            </h1>
          </div>
          <div className="flex items-center space-x-1">
            <ConnectionStatus />
            <SyncStatus />
            <InstallButton variant="ghost" size="icon" showText={false} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="touch-target glass-card hover:glass-card-hover p-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Desktop Navigation */}
        <motion.div 
          className="mb-6 hidden md:block"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => handleTabChange('perfil')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform touch-target"
              >
                <CalendarCheck className="h-6 w-6 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SlotMaster
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema de Agendamento de Entregadores
                </p>
              </div>
            </motion.div>
            <div className="flex items-center space-x-3">
              <ConnectionStatus />
              <SyncStatus />
              <InstallButton 
                variant="outline" 
                className="glass-card hover:glass-card-hover border-glass micro-bounce"
              />
              <Button 
                variant="outline" 
                onClick={handleSignOut} 
                className="glass-card hover:glass-card-hover border-glass micro-bounce"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>

          <div className="flex space-x-1 glass-card rounded-xl p-1 shadow-lg border-glass">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "agendar", label: "Agendar" },
              { id: "meus-agendamentos", label: "Agendamentos" },
              { id: "reservas", label: "Reservas" },
              { id: "notificacoes", label: "Notificações" }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => handleTabChange(tab.id)}
                onMouseEnter={() => preloadOnHover(tab.id === "meus-agendamentos" ? "agendamentos" : tab.id)}
                className={`flex-1 text-sm micro-bounce ${activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                    : 'hover:glass-card-hover'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {renderContent()}
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          notificationsCount={0}
        />
      )}

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}
