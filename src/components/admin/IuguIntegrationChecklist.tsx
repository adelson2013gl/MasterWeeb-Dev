import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, AlertCircle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIuguIntegration } from '@/hooks/useIuguIntegration';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  dependencies?: string[];
  automated?: boolean;
  component?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'database_setup',
    title: '🗄️ Configuração do Banco de Dados',
    description: 'Tabelas e tipos para integração Iugu',
    status: 'pending',
    automated: true
  },
  {
    id: 'types_interfaces',
    title: '🔧 Tipos e Interfaces TypeScript',
    description: 'Definição de tipos para Iugu API',
    status: 'pending',
    automated: true
  },
  {
    id: 'iugu_service',
    title: '⚡ Serviço de Integração Iugu',
    description: 'Classe principal para comunicação com API',
    status: 'pending',
    automated: true,
    dependencies: ['types_interfaces']
  },
  {
    id: 'config_screen',
    title: '🎛️ Tela de Configuração',
    description: 'Interface para configurar credenciais',
    status: 'pending',
    automated: true,
    dependencies: ['iugu_service']
  },
  {
    id: 'plans_management',
    title: '📋 Gerenciamento de Planos',
    description: 'CRUD de planos e sincronização',
    status: 'pending',
    automated: true,
    dependencies: ['config_screen']
  },
  {
    id: 'webhooks_setup',
    title: '🔗 Configuração de Webhooks',
    description: 'Endpoints e processamento de eventos',
    status: 'pending',
    automated: true,
    dependencies: ['iugu_service']
  },
  {
    id: 'subscription_flow',
    title: '💳 Fluxo de Assinaturas',
    description: 'Checkout e gestão de assinaturas',
    status: 'pending',
    automated: true,
    dependencies: ['plans_management', 'webhooks_setup']
  },
  {
    id: 'dashboard_metrics',
    title: '📊 Dashboard de Métricas',
    description: 'Visualização de dados e KPIs',
    status: 'pending',
    automated: true,
    dependencies: ['subscription_flow']
  },
  {
    id: 'testing_setup',
    title: '🧪 Configuração de Testes',
    description: 'Testes unitários e integração',
    status: 'pending',
    automated: true,
    dependencies: ['dashboard_metrics']
  },
  {
    id: 'production_ready',
    title: '🚀 Pronto para Produção',
    description: 'Validação final e deploy',
    status: 'pending',
    automated: false,
    dependencies: ['testing_setup']
  }
];

export function IuguIntegrationChecklist() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(CHECKLIST_ITEMS);
  const [isAutoProgress, setIsAutoProgress] = useState(false);

  // Hook para verificar status real dos componentes
  const { 
    isDatabaseReady, 
    isServiceReady, 
    isConfigReady,
    isPlansReady,
    isWebhooksReady,
    isSubscriptionReady,
    isDashboardReady,
    isTestingReady 
  } = useIuguIntegration();

  // Atualizar checklist baseado no status real
  useEffect(() => {
    const updateStatus = (id: string, status: ChecklistItem['status']) => {
      setChecklist(prev => prev.map(item => 
        item.id === id ? { ...item, status } : item
      ));
    };

    // Verificar cada item automaticamente
    if (isDatabaseReady) updateStatus('database_setup', 'completed');
    if (isServiceReady) updateStatus('iugu_service', 'completed');
    if (isConfigReady) updateStatus('config_screen', 'completed');
    if (isPlansReady) updateStatus('plans_management', 'completed');
    if (isWebhooksReady) updateStatus('webhooks_setup', 'completed');
    if (isSubscriptionReady) updateStatus('subscription_flow', 'completed');
    if (isDashboardReady) updateStatus('dashboard_metrics', 'completed');
    if (isTestingReady) updateStatus('testing_setup', 'completed');

  }, [isDatabaseReady, isServiceReady, isConfigReady, isPlansReady, 
      isWebhooksReady, isSubscriptionReady, isDashboardReady, isTestingReady]);

  const completedItems = checklist.filter(item => item.status === 'completed').length;
  const progressPercentage = Math.round((completedItems / checklist.length) * 100);

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ChecklistItem['status']) => {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      error: 'destructive',
      pending: 'outline'
    } as const;

    const labels = {
      completed: 'Concluído',
      in_progress: 'Em Progresso',
      error: 'Erro',
      pending: 'Pendente'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const canStart = (item: ChecklistItem) => {
    if (!item.dependencies) return true;
    return item.dependencies.every(depId => 
      checklist.find(dep => dep.id === depId)?.status === 'completed'
    );
  };

  const handleAutoProgress = async () => {
    setIsAutoProgress(true);
    
    // Simular execução automática dos itens
    for (const item of checklist) {
      if (item.automated && item.status === 'pending' && canStart(item)) {
        setChecklist(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'in_progress' } : i
        ));

        // Simular delay de execução
        await new Promise(resolve => setTimeout(resolve, 2000));

        setChecklist(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'completed' } : i
        ));
      }
    }
    
    setIsAutoProgress(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com Progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Integração Iugu - Progresso Automático
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso da implementação da integração com a Iugu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Progresso: {completedItems}/{checklist.length} itens
              </span>
              <span className="text-sm text-muted-foreground">
                {progressPercentage}% concluído
              </span>
            </div>
            
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAutoProgress}
                disabled={isAutoProgress || progressPercentage === 100}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isAutoProgress ? 'Executando...' : 'Executar Automaticamente'}
              </Button>
              
              {progressPercentage === 100 && (
                <Badge variant="default" className="bg-green-600">
                  🎉 Integração Completa!
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      <div className="grid gap-4">
        {checklist.map((item, index) => (
          <Card key={item.id} className={`transition-all duration-300 ${
            item.status === 'completed' ? 'bg-green-500/10 border-green-500/20' :
            item.status === 'in_progress' ? 'bg-yellow-500/10 border-yellow-500/20' :
            item.status === 'error' ? 'bg-red-500/10 border-red-500/20' :
            'bg-card border'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(item.status)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">
                      {index + 1}. {item.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {item.automated && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  
                  {item.dependencies && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Depende de:</strong> {
                        item.dependencies.map(depId => {
                          const dep = checklist.find(d => d.id === depId);
                          return dep ? dep.title.replace(/^.*?\s/, '') : depId;
                        }).join(', ')
                      }
                    </div>
                  )}
                  
                  {!canStart(item) && item.status === 'pending' && (
                    <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded">
                      ⏳ Aguardando dependências serem concluídas
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 