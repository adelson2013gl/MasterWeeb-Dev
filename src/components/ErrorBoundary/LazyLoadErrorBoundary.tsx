/**
 * Error Boundary específico para componentes lazy-loaded
 * Lida com falhas de carregamento dinâmico e imports
 */

import React, { Component, ReactNode, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertTriangle, Download } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  componentName?: string; // Nome do componente para melhor debugging
  fallback?: ReactNode; // Fallback customizado
  showRetryButton?: boolean;
  autoRetry?: boolean; // Retry automático após delay
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
  isRetrying: boolean;
}

export class LazyLoadErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0, 
      isRetrying: false 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0, isRetrying: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error });

    // Detectar se é erro de carregamento de chunk
    const isChunkError = error.message.includes('Loading chunk') || 
                        error.message.includes('Loading CSS chunk') ||
                        error.name === 'ChunkLoadError';

    // Log específico para lazy loading
    logger.error('LazyLoadErrorBoundary: Erro em componente lazy', {
      errorMessage: error.message,
      componentName: this.props.componentName || 'unknown-component',
      isChunkError,
      hasStack: !!error.stack,
      timestamp: new Date().toISOString(),
    });

    // Toast específico para lazy loading
    if (isChunkError) {
      toast.error('Erro de carregamento', {
        description: 'Falha ao carregar componente. Verificando conexão...'
      });

      // Auto-retry para chunk errors se habilitado
      if (this.props.autoRetry) {
        this.scheduleAutoRetry();
      }
    } else {
      toast.error('Erro no componente', {
        description: 'Falha ao inicializar componente.'
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  scheduleAutoRetry = () => {
    const delay = 2000; // 2 segundos
    
    this.setState({ isRetrying: true });
    
    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);

    toast.info('Tentando recarregar automaticamente...');
  };

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount > maxRetries) {
      this.setState({ isRetrying: false });
      toast.error('Componente indisponível', {
        description: 'Múltiplas tentativas falharam. Recarregue a página.'
      });
      return;
    }

    this.setState({ 
      hasError: false, 
      error: undefined, 
      retryCount: newRetryCount,
      isRetrying: false 
    });

    logger.info('LazyLoadErrorBoundary: Tentativa de recuperação', {
      retryCount: newRetryCount,
      componentName: this.props.componentName,
      maxRetries
    });
  };

  handleReload = () => {
    // Recarregar página para limpar cache de chunks
    logger.info('LazyLoadErrorBoundary: Recarregando página', {
      componentName: this.props.componentName,
      reason: 'chunk-error-recovery'
    });
    
    window.location.reload();
  };

  handleClearCache = () => {
    // Limpar cache do service worker se disponível
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      }).then(() => {
        toast.info('Cache limpo', {
          description: 'Recarregando aplicação...'
        });
        setTimeout(() => window.location.reload(), 1000);
      });
    } else {
      this.handleReload();
    }

    logger.info('LazyLoadErrorBoundary: Limpando cache', {
      componentName: this.props.componentName
    });
  };

  isChunkError = (): boolean => {
    if (!this.state.error) return false;
    
    return this.state.error.message.includes('Loading chunk') || 
           this.state.error.message.includes('Loading CSS chunk') ||
           this.state.error.name === 'ChunkLoadError';
  };

  render() {
    if (this.state.hasError) {
      // Se foi fornecido um fallback customizado, usar ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const componentName = this.props.componentName || 'Componente';
      const isChunkError = this.isChunkError();
      const maxRetries = this.props.maxRetries || 3;

      return (
        <Card className="max-w-lg mx-auto border-purple-200 bg-purple-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-purple-800">
              Erro ao Carregar {componentName}
            </CardTitle>
            <CardDescription className="text-purple-700">
              {isChunkError 
                ? 'Falha no download do componente. Pode ser um problema de conexão ou cache.'
                : 'O componente não pôde ser inicializado corretamente.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              {/* Botão de retry se habilitado */}
              {this.props.showRetryButton !== false && (
                <Button 
                  onClick={this.handleRetry} 
                  variant="default"
                  disabled={this.state.retryCount >= maxRetries || this.state.isRetrying}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying 
                    ? 'Carregando...' 
                    : `Tentar Novamente ${this.state.retryCount > 0 ? `(${this.state.retryCount}/${maxRetries})` : ''}`
                  }
                </Button>
              )}

              {/* Botão para recarregar página */}
              <Button 
                onClick={this.handleReload} 
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar Página
              </Button>

              {/* Botão para limpar cache apenas para chunk errors */}
              {isChunkError && (
                <Button 
                  onClick={this.handleClearCache} 
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
              )}
            </div>

            {/* Informações específicas para chunk errors */}
            {isChunkError && (
              <div className="text-xs text-purple-600 bg-purple-100 p-3 rounded">
                <strong>📦 Carregamento:</strong> Falha ao baixar recursos do componente. 
                Isso pode acontecer após atualizações da aplicação ou problemas de conexão.
              </div>
            )}

            {/* Informações sobre retry automático */}
            {this.props.autoRetry && this.state.isRetrying && (
              <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded">
                <strong>🔄 Auto-Retry:</strong> Tentando recarregar automaticamente...
              </div>
            )}

            {/* Detalhes de erro apenas em desenvolvimento */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-xs bg-purple-100 p-3 rounded">
                <summary className="cursor-pointer font-medium text-purple-800">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-purple-700">
                  Component: {this.props.componentName || 'unknown'}{'\n'}
                  Is Chunk Error: {isChunkError ? 'Yes' : 'No'}{'\n'}
                  Retry Count: {this.state.retryCount}/{maxRetries}{'\n'}
                  Auto Retry: {this.props.autoRetry ? 'Yes' : 'No'}{'\n'}
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

/**
 * Wrapper que combina Suspense com LazyLoadErrorBoundary
 * Para uso mais fácil com componentes lazy
 */
interface LazyWrapperProps {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  autoRetry?: boolean;
  maxRetries?: number;
}

export function LazyWrapper({ 
  children, 
  componentName,
  fallback,
  loadingComponent,
  autoRetry = true,
  maxRetries = 3
}: LazyWrapperProps) {
  const defaultLoading = (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      <span className="ml-2 text-purple-700">Carregando {componentName || 'componente'}...</span>
    </div>
  );

  return (
    <LazyLoadErrorBoundary
      componentName={componentName}
      fallback={fallback}
      autoRetry={autoRetry}
      maxRetries={maxRetries}
    >
      <Suspense fallback={loadingComponent || defaultLoading}>
        {children}
      </Suspense>
    </LazyLoadErrorBoundary>
  );
}