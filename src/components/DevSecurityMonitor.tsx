
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { logger } from '@/lib/logger';

export function DevSecurityMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [securityReport, setSecurityReport] = useState<any>({});
  const [logCount, setLogCount] = useState(0);

  // Só mostrar em desenvolvimento
  if (import.meta.env.PROD || import.meta.env.VITE_NODE_ENV === 'production') {
    return null;
  }

  const updateSecurityReport = () => {
    const report = logger.getSecurityReport();
    setSecurityReport(report);
    
    // Contar logs no localStorage
    try {
      const logs = JSON.parse(localStorage.getItem('secure_error_logs') || '[]');
      setLogCount(logs.length);
    } catch {
      setLogCount(0);
    }
  };

  useEffect(() => {
    updateSecurityReport();
    const interval = setInterval(updateSecurityReport, 10000); // Atualizar a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-red-900/80 text-white border-red-600 hover:bg-red-900/90"
        >
          <Shield className="h-4 w-4 mr-2" />
          Segurança
        </Button>
      </div>
    );
  }

  const clearSecurityLogs = () => {
    localStorage.removeItem('secure_error_logs');
    logger.clearPerformanceMetrics();
    updateSecurityReport();
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 w-96 max-h-96 overflow-auto">
      <Card className="bg-red-900/90 text-white border-red-600">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Monitor de Segurança
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-red-800"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Status de Segurança */}
          <div>
            <h4 className="font-semibold mb-2 text-yellow-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Status de Segurança
            </h4>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span>Ambiente:</span>
                <Badge variant={securityReport.environment === 'development' ? 'secondary' : 'destructive'}>
                  {securityReport.environment}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Console Logs:</span>
                <Badge variant={securityReport.config?.enableConsoleLogs ? 'destructive' : 'default'}>
                  {securityReport.config?.enableConsoleLogs ? 'HABILITADO' : 'DESABILITADO'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Sanitização:</span>
                <Badge variant={securityReport.config?.sanitizeData ? 'default' : 'destructive'}>
                  {securityReport.config?.sanitizeData ? 'ATIVA' : 'INATIVA'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Campos Protegidos */}
          <div>
            <h4 className="font-semibold mb-1 text-green-400">Campos Protegidos</h4>
            <div className="text-gray-300 space-y-1">
              <div>Sensíveis: {securityReport.sensitiveFieldsCount || 0}</div>
              <div>PII: {securityReport.piiFieldsCount || 0}</div>
              <div>Padrões: {securityReport.securityPatterns?.length || 0}</div>
            </div>
          </div>

          {/* Logs de Erro Seguros */}
          <div>
            <h4 className="font-semibold mb-1 text-blue-400">Logs Seguros</h4>
            <div className="text-gray-300">
              <div>Erros armazenados: {logCount}</div>
              <div>Limite: {securityReport.config?.maxLogEntries || 0}</div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={clearSecurityLogs}
              size="sm"
              variant="outline"
              className="text-xs bg-transparent border-red-600 text-white hover:bg-red-800"
            >
              Limpar Logs
            </Button>
            
            <Button
              onClick={() => {
                console.log('🔒 Security Report:', securityReport);
              }}
              size="sm"
              variant="outline"
              className="text-xs bg-transparent border-red-600 text-white hover:bg-red-800"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver Relatório
            </Button>
          </div>

          {/* Alerta de Produção */}
          <div className="p-2 bg-yellow-900/50 border border-yellow-600 rounded text-yellow-200">
            <div className="flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-semibold">AVISO:</span>
            </div>
            <p className="text-xs mt-1">
              Em produção, todos os console.logs são automaticamente removidos e dados sensíveis são sanitizados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
