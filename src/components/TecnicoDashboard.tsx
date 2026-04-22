
import { useState, lazy, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Shield, AlertTriangle, Building2, Wrench } from "lucide-react";
import { MobileBottomNav } from "@/components/tecnico/MobileBottomNav";
import { SimpleLoader } from "@/components/LazyComponents";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTecnicoData } from "@/hooks/useTecnicoData";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { usePreloadComponents } from "@/hooks/usePreloadComponents";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { SyncStatus } from "@/components/ui/sync-status";
import { InstallButton } from "@/components/InstallButton";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

// Lazy loading para componentes
const PerfilTecnico = lazy(() => import("@/components/tecnico/PerfilTecnico").then(module => ({ default: module.PerfilTecnico })));

// Placeholder component for MinhasOrdensServico
function MinhasOrdensServico() {
  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Minhas Ordens de Serviço</CardTitle>
        <CardDescription>Em breve: visualização das suas ordens de serviço atribuídas</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
      </CardContent>
    </Card>
  );
}

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

export function TecnicoDashboard() {
  const shortcutTab = useShortcutNavigation();
  const [activeTab, setActiveTab] = useState(shortcutTab || "dashboard");
  const { signOut, user } = useAuth();
  const isMobile = useIsMobile();
  const { tecnico } = useTecnicoData();
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
            <PerfilTecnico onBack={() => handleTabChange('dashboard')} />
          </Suspense>
        );
      case "minhas-os":
        return (
          <Suspense fallback={<SimpleLoader text="Carregando ordens de serviço..." />}>
            <MinhasOrdensServico />
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
            {/* Status do Tecnico - Simplificado */}
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
                        Olá, {tecnico?.nome || 'tecnico'}!
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

            {/* Cards de Ação Rápida - OS */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('minhas-os')}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Wrench className="h-8 w-8 text-blue-500 mb-2" />
                    <h3 className="font-medium">Minhas OS</h3>
                    <p className="text-xs text-gray-500">Ver ordens de serviço</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('perfil')}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <User className="h-8 w-8 text-purple-500 mb-2" />
                    <h3 className="font-medium">Meu Perfil</h3>
                    <p className="text-xs text-gray-500">Ver dados pessoais</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Lembrete de Segurança - OS */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    ⚙️ Sistema de Ordem de Serviço
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Mantenha seus equipamentos em perfeito funcionamento
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
              Master Web
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
                <Wrench className="h-6 w-6 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Master Web
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema de Agendamento de Tecnicos
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
              { id: "minhas-os", label: "Minhas OS" },
              { id: "perfil", label: "Perfil" }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => handleTabChange(tab.id)}
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
