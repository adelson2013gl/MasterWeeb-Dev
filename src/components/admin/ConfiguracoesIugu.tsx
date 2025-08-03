import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Settings, 
  Key, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Eye, 
  EyeOff,
  Shield,
  Zap,
  Link,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { iuguService } from '@/services/iuguService';
import { IuguEnvironment, IuguConnectionTest } from '@/types/iugu';
import { logger } from '@/lib/logger';
import { IntegrationErrorBoundary } from '@/components/ErrorBoundary/index';

interface IuguConfig {
  enabled: boolean;
  environment: IuguEnvironment;
  api_key: string;
  account_id: string;
  webhook_url: string;
  webhook_token: string;
  auto_create_customers: boolean;
  auto_suspend_overdue: boolean;
  overdue_days_limit: number;
  test_mode: boolean;
}

const defaultConfig: IuguConfig = {
  enabled: false,
  environment: 'sandbox',
  api_key: '',
  account_id: '',
  webhook_url: `${window.location.origin}/api/webhooks/iugu`,
  webhook_token: '',
  auto_create_customers: true,
  auto_suspend_overdue: false,
  overdue_days_limit: 7,
  test_mode: true
};

function ConfiguracoesIuguComponent() {
  const [config, setConfig] = useState<IuguConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionTest, setConnectionTest] = useState<IuguConnectionTest | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Carregar configurações salvas
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      
      // Em uma implementação real, isso viria do banco de dados
      const savedConfig = localStorage.getItem('iugu_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...defaultConfig, ...parsedConfig });
        
        // Se tiver API key, configurar o serviço
        if (parsedConfig.api_key) {
          iuguService.configure(parsedConfig.api_key, parsedConfig.environment);
        }
      }
    } catch (error) {
      logger.error('Erro ao carregar configurações Iugu', { error });
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      
      // Validações básicas
      if (config.enabled && !config.api_key) {
        toast.error('API Key é obrigatória quando a integração está habilitada');
        return;
      }

      // Em uma implementação real, isso seria salvo no banco
      localStorage.setItem('iugu_config', JSON.stringify(config));
      
      // Configurar o serviço
      if (config.api_key) {
        iuguService.configure(config.api_key, config.environment);
      }
      
      setHasUnsavedChanges(false);
      toast.success('Configurações salvas com sucesso!');
      
      logger.info('✅ Configurações Iugu salvas', config);
      
    } catch (error) {
      logger.error('Erro ao salvar configurações Iugu', { error });
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      
      if (!config.api_key) {
        toast.error('Informe a API Key para testar a conexão');
        return;
      }

      // Configurar temporariamente para teste
      iuguService.configure(config.api_key, config.environment);
      
      const result = await iuguService.testConnection();
      setConnectionTest(result);
      
      if (result.success) {
        toast.success('✅ Conexão estabelecida com sucesso!');
        setConfig(prev => ({ ...prev, account_id: result.account_id || prev.account_id }));
      } else {
        toast.error(`❌ Erro na conexão: ${result.error}`);
      }
      
    } catch (error) {
      logger.error('Erro ao testar conexão Iugu', { error });
      toast.error('Erro ao testar conexão');
      setConnectionTest({
        success: false,
        environment: config.environment,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (key: keyof IuguConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    
    // Limpar teste de conexão se mudou credenciais
    if (key === 'api_key' || key === 'environment') {
      setConnectionTest(null);
    }
  };

  const generateWebhookToken = () => {
    const token = crypto.randomUUID();
    updateConfig('webhook_token', token);
    toast.success('Token gerado com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="iugu-config">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Configurações Iugu
          </h1>
          <p className="text-muted-foreground">
            Configure a integração com a Iugu para pagamentos recorrentes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}
          
          <Button 
            onClick={saveConfig} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credenciais da API Iugu
          </CardTitle>
          <CardDescription>
            Configure suas credenciais para conectar com a API da Iugu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da Integração */}
          <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
            <div>
              <Label className="text-base font-medium">Integração Iugu</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar ou desabilitar a integração com Iugu
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(value) => updateConfig('enabled', value)}
            />
          </div>

          <Separator />

          {/* Ambiente */}
          <div className="space-y-2">
            <Label>Ambiente</Label>
            <div className="flex gap-2">
              <Button
                variant={config.environment === 'sandbox' ? 'default' : 'outline'}
                onClick={() => updateConfig('environment', 'sandbox')}
                size="sm"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Sandbox (Teste)
              </Button>
              <Button
                variant={config.environment === 'production' ? 'default' : 'outline'}
                onClick={() => updateConfig('environment', 'production')}
                size="sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Produção
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use Sandbox para testes e Produção para transações reais
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={config.api_key}
                  onChange={(e) => updateConfig('api_key', e.target.value)}
                  placeholder="Insira sua API Key da Iugu"
                  disabled={!config.enabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Encontre sua API Key no painel da Iugu em Configurações → API
            </p>
          </div>

          {/* Teste de Conexão */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={testConnection}
                disabled={testing || !config.api_key || !config.enabled}
                variant="outline"
                className="flex items-center gap-2"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                {testing ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>

            {connectionTest && (
              <Alert className={connectionTest.success ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}>
                <div className="flex items-center gap-2">
                  {connectionTest.success ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                  <AlertDescription>
                    {connectionTest.success ? (
                      <div>
                        <strong>✅ Conexão estabelecida com sucesso!</strong>
                        {connectionTest.account_name && (
                          <p>Conta: {connectionTest.account_name}</p>
                        )}
                        <p>Ambiente: {connectionTest.environment}</p>
                      </div>
                    ) : (
                      <div>
                        <strong>❌ Falha na conexão</strong>
                        <p>{connectionTest.error}</p>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper com error boundary específico para integração Iugu
export function ConfiguracoesIugu() {
  return (
    <IntegrationErrorBoundary 
      service="iugu"
      fallbackTitle="Erro nas Configurações Iugu"
      showStatusPage={true}
      onRetry={() => window.location.reload()}
    >
      <ConfiguracoesIuguComponent />
    </IntegrationErrorBoundary>
  );
} 