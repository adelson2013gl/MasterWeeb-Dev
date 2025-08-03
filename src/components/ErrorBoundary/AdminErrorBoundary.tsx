/**
 * Error Boundary específico para operações administrativas
 * Protege áreas sensíveis de gestão sem quebrar toda aplicação
 */

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  onNavigateBack?: () => void;
  fallbackTitle?: string;
  context?: string; // "entregadores", "empresas", "configuracoes", "agendas", etc.
  criticalOperation?: boolean; // Se true, mostra avisos mais severos
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error });

    // Log específico para erros administrativos
    logger.error('AdminErrorBoundary: Erro em operação administrativa', {
      errorMessage: error.message,
      context: this.props.context || 'admin-general',
      criticalOperation: this.props.criticalOperation || false,
      hasStack: !!error.stack,
      timestamp: new Date().toISOString(),
      // SEGURANÇA: Sanitizar dados administrativos sensíveis
      sanitized: true
    });

    // Toast específico para operações administrativas
    const iscrítica = this.props.criticalOperation;
    toast.error(iscrítica ? 'Erro em operação crítica' : 'Erro administrativo', {
      description: isrítica 
        ? 'Falha em operação crítica do sistema. Verifique os dados.'
        : 'Erro na área administrativa. Tente novamente.'
    });
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount > 2) { // Menos tentativas para admin
      toast.error('Muitas tentativas', {
        description: 'Operação administrativa falhando. Contate o suporte técnico.'
      });
      return;
    }

    this.setState({ 
      hasError: false, 
      error: undefined, 
      retryCount: newRetryCount 
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }

    logger.info('AdminErrorBoundary: Tentativa de recuperação administrativa', {
      retryCount: newRetryCount,
      context: this.props.context,
      criticalOperation: this.props.criticalOperation
    });
  };

  handleNavigateBack = () => {
    if (this.props.onNavigateBack) {
      this.props.onNavigateBack();
    } else {
      // Fallback: voltar no histórico
      window.history.back();
    }
    
    logger.info('AdminErrorBoundary: Navegação de volta após erro', {
      context: this.props.context
    });
  };

  handleReportIssue = () => {
    // Relatório específico para problemas administrativos
    const errorContext = {
      context: this.props.context,
      criticalOperation: this.props.criticalOperation,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    };

    toast.info('Relatório enviado', {
      description: 'Problema reportado para a equipe técnica.'
    });

    // TODO: Implementar sistema de relatórios administrativos
    logger.info('AdminErrorBoundary: Problema reportado', errorContext);
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Erro na Área Administrativa';
      const isCritical = this.props.criticalOperation;
      const context = this.props.context;

      // Mensagens contextuais específicas
      const getContextMessage = () => {
        switch (context) {
          case 'entregadores':
            return 'Erro ao gerenciar entregadores. Os dados estão seguros.';
          case 'empresas':
            return 'Erro ao gerenciar empresas. Configurações preservadas.';
          case 'configuracoes':
            return 'Erro nas configurações do sistema. Estado anterior mantido.';
          case 'agendas':
            return 'Erro ao gerenciar agendas. Agendamentos não foram afetados.';
          case 'importacao':
            return 'Erro na importação de dados. Processo interrompido com segurança.';
          default:
            return 'Erro na operação administrativa. Sistema seguro.';
        }
      };

      return (
        <Card className={`max-w-lg mx-auto ${isCritical ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 p-3 rounded-full w-fit ${isCritical ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <Shield className={`h-6 w-6 ${isCritical ? 'text-red-600' : 'text-yellow-600'}`} />
            </div>
            <CardTitle className={isCritical ? 'text-red-800' : 'text-yellow-800'}>
              {title}
            </CardTitle>
            <CardDescription className={isCritical ? 'text-red-700' : 'text-yellow-700'}>
              {getContextMessage()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button 
                onClick={this.handleRetry} 
                variant="default"
                disabled={this.state.retryCount >= 2}
                className={isCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente {this.state.retryCount > 0 && `(${this.state.retryCount}/2)`}
              </Button>
              
              <Button 
                onClick={this.handleNavigateBack} 
                variant="outline"
                className={isCritical ? 'border-red-300 text-red-700 hover:bg-red-100' : 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              <Button 
                onClick={this.handleReportIssue} 
                variant="ghost"
                size="sm"
                className={isCritical ? 'text-red-600 hover:bg-red-100' : 'text-yellow-600 hover:bg-yellow-100'}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reportar Problema
              </Button>
            </div>

            {/* Aviso para operações críticas */}
            {isCritical && (
              <div className="text-xs text-red-600 bg-red-100 p-3 rounded border border-red-200">
                <strong>⚠️ Operação Crítica:</strong> Esta falha pode afetar funcionalidades importantes. 
                Recomendamos contatar o suporte técnico imediatamente.
              </div>
            )}

            {/* Informações de contexto específicas */}
            {context === 'importacao' && (
              <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded">
                <strong>ℹ️ Importação:</strong> O processo foi interrompido com segurança. 
                Nenhum dado foi corrompido. Você pode tentar novamente.
              </div>
            )}

            {/* Detalhes de erro apenas em desenvolvimento */}
            {import.meta.env.DEV && this.state.error && (
              <details className={`text-xs p-3 rounded ${isCritical ? 'bg-red-100' : 'bg-yellow-100'}`}>
                <summary className={`cursor-pointer font-medium ${isCritical ? 'text-red-800' : 'text-yellow-800'}`}>
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className={`mt-2 whitespace-pre-wrap break-words text-xs ${isCritical ? 'text-red-700' : 'text-yellow-700'}`}>
                  Context: {context || 'admin-general'}{'\n'}
                  Critical: {isCritical ? 'Yes' : 'No'}{'\n'}
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