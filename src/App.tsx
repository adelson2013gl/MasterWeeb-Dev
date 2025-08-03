
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/useAuth";
import { EmpresaUnificadoProvider } from "@/contexts/EmpresaUnificadoContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoadingFallback } from "@/components/LoadingFallback";
import { DevMetrics } from "@/components/DevMetrics";
import { AcessoEmpresa, ResetPassword, CadastroAdminEmpresa, CadastroAdminPublico } from "@/components/LazyComponents";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { logger } from "@/lib/logger";
import { performanceMonitor } from "@/lib/performance";
import { analytics } from "@/lib/analytics";
import "./App.css";

function App() {
  useEffect(() => {
    logger.info('Aplicação iniciada', { timestamp: new Date() }, 'APP');
    
    // Inicializar monitoramento de performance
    performanceMonitor.measureWebVitals();
    
    // Rastrear carregamento inicial
    analytics.trackPageView(window.location.pathname, 'Aplicação Iniciada');
    
    // Monitorar uso de memória periodicamente
    const memoryInterval = setInterval(() => {
      performanceMonitor.measureMemoryUsage();
    }, 30000); // A cada 30 segundos
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <EmpresaUnificadoProvider>
            <Router>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/acesso/:empresaSlug" element={<AcessoEmpresa />} />
                  <Route path="/admin/cadastro-empresa" element={<CadastroAdminEmpresa />} />
                  <Route path="/adelson2013gl" element={<CadastroAdminPublico />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Router>
            <Toaster />
            <SonnerToaster />
            <DevMetrics />
          </EmpresaUnificadoProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
