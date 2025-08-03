
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarClock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Clock,
  Settings,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  verifyExpiryFunctions, 
  testExpiryFunctions, 
  getCronJobStatus 
} from '@/utils/verifyExpiryFunctions';
import { expirySchedulerService } from '@/services/expirySchedulerService';
import { ExpiryManagementPanel } from './ExpiryManagementPanel';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';

export function DatabaseExpiryStatus() {
  const { isSuperAdmin } = useEmpresaUnificado();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const verificarSistema = async () => {
    try {
      setLoading(true);
      
      // Verificar funções e CRON
      const verification = await verifyExpiryFunctions();
      setVerificationResult(verification);
      
      // Verificar status do sistema
      const status = await expirySchedulerService.getSystemStatus();
      setSystemStatus(status);
      
      toast.success('Verificação concluída');
    } catch (error: any) {
      console.error('Erro na verificação:', error);
      toast.error('Erro na verificação', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testarFuncoes = async () => {
    try {
      setTesting(true);
      const result = await testExpiryFunctions();
      setTestResult(result);
      
      if (result.getStatsWorking && result.checkExpiryWorking) {
        toast.success('Todas as funções estão funcionando!');
      } else {
        toast.error('Algumas funções apresentaram problemas');
      }
    } catch (error: any) {
      console.error('Erro no teste:', error);
      toast.error('Erro no teste', {
        description: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const executarManual = async () => {
    try {
      setExecuting(true);
      const result = await expirySchedulerService.executeManual();
      
      toast.success(`Execução concluída: ${result.companiesSuspended || 0} empresas suspensas`);
      
      // Recarregar verificação após execução
      await verificarSistema();
    } catch (error: any) {
      console.error('Erro na execução:', error);
      toast.error('Erro na execução manual', {
        description: error.message
      });
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    verificarSistema();
  }, []);

  // Verificar se o usuário tem permissão
  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Acesso Negado
            </h3>
            <p className="text-gray-600">
              Apenas Super Administradores podem acessar a Gestão de Vencimentos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Vencimentos</h1>
          <p className="text-muted-foreground">Monitoramento do sistema de vencimento</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={verificarSistema}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
          
          <Button
            variant="outline"
            onClick={testarFuncoes}
            disabled={testing}
            className="flex items-center gap-2"
          >
            <CalendarClock className="h-4 w-4" />
            {testing ? 'Testando...' : 'Testar Funções'}
          </Button>
          
          <Button
            onClick={executarManual}
            disabled={executing}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {executing ? 'Executando...' : 'Executar Manual'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Status do Sistema
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Gestão de Empresas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          {/* Status das Funções */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Funções do Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Funções de Vencimento:</span>
                    <Badge variant={verificationResult?.functionsExist ? 'default' : 'destructive'}>
                      {verificationResult?.functionsExist ? 'Ativas' : 'Inativas'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>CRON Job:</span>
                    <Badge variant={verificationResult?.cronJobExists ? 'default' : 'secondary'}>
                      {verificationResult?.cronJobExists ? 'Configurado' : 'Não Configurado'}
                    </Badge>
                  </div>
                  
                  {verificationResult?.functions && (
                    <div className="text-sm text-gray-600">
                      <p>Funções encontradas:</p>
                      <ul className="list-disc list-inside ml-4">
                        {verificationResult.functions.map((func: any) => (
                          <li key={func.routine_name}>{func.routine_name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {verificationResult?.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{verificationResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultado dos Testes */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Resultado dos Testes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>get_expiry_stats:</span>
                    <Badge variant={testResult.getStatsWorking ? 'default' : 'destructive'}>
                      {testResult.getStatsWorking ? 'Funcionando' : 'Com Erro'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>check_empresa_expiry:</span>
                    <Badge variant={testResult.checkExpiryWorking ? 'default' : 'destructive'}>
                      {testResult.checkExpiryWorking ? 'Funcionando' : 'Com Erro'}
                    </Badge>
                  </div>
                  
                  {testResult.statsData && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm font-medium">Estatísticas Atuais:</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>Vencidas: {testResult.statsData.expired}</div>
                        <div>Vencem em 7 dias: {testResult.statsData.expiring7Days}</div>
                        <div>Vencem em 30 dias: {testResult.statsData.expiring30Days}</div>
                        <div>Total ativas: {testResult.statsData.total}</div>
                      </div>
                    </div>
                  )}
                  
                  {testResult.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{testResult.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status do Sistema */}
          {systemStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>CRON Disponível:</span>
                    <Badge variant={systemStatus.cronAvailable ? 'default' : 'secondary'}>
                      {systemStatus.cronAvailable ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>CRON Ativo:</span>
                    <Badge variant={systemStatus.cronActive ? 'default' : 'secondary'}>
                      {systemStatus.cronActive ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Edge Function:</span>
                    <Badge variant={systemStatus.edgeFunctionAvailable ? 'default' : 'secondary'}>
                      {systemStatus.edgeFunctionAvailable ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Método Preferido:</span>
                    <Badge variant="outline">
                      {systemStatus.preferredMethod === 'cron' ? 'CRON Job' : 'Edge Function'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="management">
          <ExpiryManagementPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
