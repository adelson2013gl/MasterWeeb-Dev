/**
 * Error Boundary específico para operações de billing e pagamento
 * Permite recuperação localizada sem afetar resto da aplicação
 */

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, RefreshCw, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  fallbackTitle?: string;
  context?: string; // "subscription", "payment", "plan-selection", etc.
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class BillingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error });

    // Log específico para erros de billing com contexto
    logger.error('BillingErrorBoundary: Erro em operação financeira', {
      errorMessage: error.message,
      context: this.props.context || 'billing-general',
      hasStack: !!error.stack,
      timestamp: new Date().toISOString(),
      // SEGURANÇA: Não logar dados sensíveis de pagamento
      sanitized: true
    });

    // Toast de erro específico para billing
    toast.error('Erro no sistema de pagamento', {
      description: 'Ocorreu um erro ao processar informações de pagamento.'
    });
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount > 3) {
      toast.error('Muitas tentativas', {
        description: 'Por favor, recarregue a página e tente novamente.'
      });
      return;
    }

    this.setState({ 
      hasError: false, 
      error: undefined, 
      retryCount: newRetryCount 
    });

    // Executar callback de retry personalizado se fornecido
    if (this.props.onRetry) {
      this.props.onRetry();
    }

    logger.info('BillingErrorBoundary: Tentativa de recuperação', {
      retryCount: newRetryCount,
      context: this.props.context
    });
  };

  handleContactSupport = () => {
    // Abrir canal de suporte ou modal de ajuda
    toast.info('Contato com suporte', {
      description: 'Redirecionando para o suporte técnico...'
    });
    
    // TODO: Implementar integração com sistema de suporte
    window.open('mailto:suporte@slotemaster.com?subject=Erro no Sistema de Pagamento', '_blank');
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Erro no Sistema de Pagamento';
      const isPaymentContext = this.props.context?.includes('payment');
      const isSubscriptionContext = this.props.context?.includes('subscription');

      return (
        <Card className="max-w-lg mx-auto border-orange-200 bg-orange-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-orange-800">{title}</CardTitle>
            <CardDescription className="text-orange-700">
              {isPaymentContext && 'Erro ao processar pagamento. Seus dados estão seguros.'}
              {isSubscriptionContext && 'Erro ao gerenciar assinatura. Tente novamente.'}
              {!isPaymentContext && !isSubscriptionContext && 'Erro no sistema financeiro. Tente novamente.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button 
                onClick={this.handleRetry} 
                variant="default"
                disabled={this.state.retryCount >= 3}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente {this.state.retryCount > 0 && `(${this.state.retryCount}/3)`}
              </Button>
              
              <Button 
                onClick={this.handleContactSupport} 
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Contatar Suporte
              </Button>
            </div>

            {/* Informações de segurança para contexto de pagamento */}
            {isPaymentContext && (
              <div className="text-xs text-orange-600 bg-orange-100 p-3 rounded">
                <strong>Segurança:</strong> Nenhum dado de pagamento foi comprometido. 
                Todas as informações são processadas de forma segura.
              </div>
            )}

            {/* Detalhes de erro apenas em desenvolvimento */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-xs bg-orange-100 p-3 rounded">
                <summary className="cursor-pointer font-medium text-orange-800">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-orange-700">
                  Context: {this.props.context || 'billing-general'}{'\n'}
                  Retry Count: {this.state.retryCount}{'\n'}
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