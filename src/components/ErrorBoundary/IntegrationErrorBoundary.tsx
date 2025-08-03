/**
 * Error Boundary específico para integrações externas
 * Lida com falhas de APIs, webhooks e serviços de terceiros
 */

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  fallbackTitle?: string;
  service?: string; // "mercadopago", "iugu", "supabase", "webhook", etc.
  isOnline?: boolean; // Status de conectividade
  showStatusPage?: boolean; // Se deve mostrar link para página de status
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
  isRetrying: boolean;
}

export class IntegrationErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0, isRetrying: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error });

    // Log específico para erros de integração
    logger.error('IntegrationErrorBoundary: Erro em integração externa', {
      errorMessage: error.message,
      service: this.props.service || 'unknown-service',
      isOnline: this.props.isOnline ?? navigator.onLine,
      hasStack: !!error.stack,
      timestamp: new Date().toISOString(),
      // SEGURANÇA: Não logar dados de API keys ou tokens
      sanitized: true
    });

    // Toast específico para integração
    const serviceName = this.getServiceDisplayName(this.props.service);
    toast.error(`Erro na integração ${serviceName}`, {
      description: 'Falha na comunicação com serviço externo.'
    });
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  getServiceDisplayName = (service?: string): string => {
    switch (service) {
      case 'mercadopago': return 'Mercado Pago';
      case 'iugu': return 'Iugu';
      case 'supabase': return 'Supabase';
      case 'webhook': return 'Webhook';
      default: return 'externa';
    }
  };

  getServiceIcon = () => {
    const isOffline = this.props.isOnline === false || !navigator.onLine;
    return isOffline ? WifiOff : Wifi;
  };

  handleRetry = async () => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount > 3) {
      toast.error('Serviço indisponível', {
        description: 'Múltiplas tentativas falharam. Tente novamente mais tarde.'
      });
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: newRetryCount 
    });

    // Delay progressivo: 1s, 2s, 4s
    const delay = Math.pow(2, newRetryCount - 1) * 1000;
    
    this.retryTimeout = setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        isRetrying: false 
      });

      if (this.props.onRetry) {
        this.props.onRetry();
      }

      logger.info('IntegrationErrorBoundary: Tentativa de recuperação de integração', {
        retryCount: newRetryCount,
        service: this.props.service,
        delay
      });
    }, delay);

    toast.info(`Tentando reconectar em ${delay / 1000}s...`);
  };

  handleCheckStatus = () => {
    const service = this.props.service;
    let statusUrl = '';

    switch (service) {
      case 'mercadopago':
        statusUrl = 'https://status.mercadopago.com';
        break;
      case 'iugu':
        statusUrl = 'https://status.iugu.com';
        break;
      case 'supabase':
        statusUrl = 'https://status.supabase.com';
        break;
      default:
        // Página genérica de status do sistema
        statusUrl = '/status';
    }

    window.open(statusUrl, '_blank');
    
    logger.info('IntegrationErrorBoundary: Verificação de status do serviço', {
      service,
      statusUrl
    });
  };

  handleOfflineMode = () => {
    // Ativar modo offline se disponível
    toast.info('Modo offline ativado', {
      description: 'Funcionalidades limitadas disponíveis sem conexão.'
    });

    // TODO: Implementar lógica de modo offline específica
    logger.info('IntegrationErrorBoundary: Modo offline ativado', {
      service: this.props.service
    });
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Erro de Integração';
      const serviceName = this.getServiceDisplayName(this.props.service);
      const ServiceIcon = this.getServiceIcon();
      const isOffline = this.props.isOnline === false || !navigator.onLine;
      const isPaymentService = this.props.service === 'mercadopago' || this.props.service === 'iugu';

      return (
        <Card className="max-w-lg mx-auto border-blue-200 bg-blue-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <ServiceIcon className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-blue-800">{title}</CardTitle>
            <CardDescription className="text-blue-700">
              {isOffline 
                ? 'Sem conexão com a internet. Verifique sua conectividade.'
                : `Falha na comunicação com ${serviceName}. O serviço pode estar temporariamente indisponível.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button 
                onClick={this.handleRetry} 
                variant="default"
                disabled={this.state.retryCount >= 3 || this.state.isRetrying}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                {this.state.isRetrying 
                  ? 'Reconectando...' 
                  : `Tentar Novamente ${this.state.retryCount > 0 ? `(${this.state.retryCount}/3)` : ''}`
                }
              </Button>

              {/* Botão de status do serviço */}
              {this.props.showStatusPage && (
                <Button 
                  onClick={this.handleCheckStatus} 
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Status do {serviceName}
                </Button>
              )}

              {/* Modo offline para alguns serviços */}
              {isOffline && !isPaymentService && (
                <Button 
                  onClick={this.handleOfflineMode} 
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Continuar Offline
                </Button>
              )}
            </div>

            {/* Avisos específicos por tipo de serviço */}
            {isPaymentService && (
              <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded">
                <strong>💳 Pagamentos:</strong> Falha temporária no processamento de pagamentos. 
                Suas informações estão seguras. Tente novamente em alguns minutos.
              </div>
            )}

            {this.props.service === 'webhook' && (
              <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded">
                <strong>🔗 Webhooks:</strong> Falha na sincronização automática. 
                Os dados serão sincronizados assim que a conexão for restabelecida.
              </div>
            )}

            {isOffline && (
              <div className="text-xs text-orange-600 bg-orange-100 p-3 rounded">
                <strong>📡 Conectividade:</strong> Sem conexão com a internet. 
                Verifique sua rede WiFi ou dados móveis.
              </div>
            )}

            {/* Detalhes de erro apenas em desenvolvimento */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-xs bg-blue-100 p-3 rounded">
                <summary className="cursor-pointer font-medium text-blue-800">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-blue-700">
                  Service: {this.props.service || 'unknown'}{'\n'}
                  Online: {this.props.isOnline ?? navigator.onLine}{'\n'}
                  Retry Count: {this.state.retryCount}{'\n'}
                  Is Retrying: {this.state.isRetrying}{'\n'}
                  Error: {this.state.error.message}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}