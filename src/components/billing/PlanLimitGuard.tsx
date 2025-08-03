// Componente para verificar limites antes de permitir ações
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, TrendingUp, Users, Calendar } from 'lucide-react';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { type PlanoType } from '@/types/subscription';

interface PlanLimitGuardProps {
  empresaId: string;
  plano: PlanoType;
  action: 'add_entregador' | 'add_agendamento';
  children: React.ReactNode;
  onUpgradeClick?: () => void;
  showUpgradeOption?: boolean;
}

export function PlanLimitGuard({ 
  empresaId, 
  plano, 
  action, 
  children, 
  onUpgradeClick,
  showUpgradeOption = true 
}: PlanLimitGuardProps) {
  const { data, loading } = usePlanLimits({ empresaId, plano });
  const [showLimitDialog, setShowLimitDialog] = React.useState(false);

  if (loading || !data) {
    return <>{children}</>;
  }

  const canPerformAction = () => {
    if (!data.assinaturaAtiva) return false;
    
    switch (action) {
      case 'add_entregador':
        return data.entregadoresAtuais < data.limites.max_entregadores;
      case 'add_agendamento':
        return data.agendamentosNoMes < data.limites.max_agendas_mes;
      default:
        return true;
    }
  };

  const getLimitMessage = () => {
    if (!data.assinaturaAtiva) {
      return {
        title: 'Assinatura Inativa',
        description: 'Sua assinatura está inativa. Reative para continuar usando os recursos.',
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />
      };
    }

    switch (action) {
      case 'add_entregador':
        return {
          title: 'Limite de Entregadores Atingido',
          description: `Você atingiu o limite de ${data.limites.max_entregadores} entregadores do plano ${data.limites.nome}. Para adicionar mais entregadores, faça upgrade do seu plano.`,
          icon: <Users className="w-5 h-5 text-orange-500" />
        };
      case 'add_agendamento':
        return {
          title: 'Limite de Agendamentos Atingido',
          description: `Você atingiu o limite de ${data.limites.max_agendas_mes} agendamentos mensais do plano ${data.limites.nome}. Para criar mais agendamentos, faça upgrade do seu plano.`,
          icon: <Calendar className="w-5 h-5 text-orange-500" />
        };
      default:
        return {
          title: 'Limite Atingido',
          description: 'Você atingiu o limite do seu plano atual.',
          icon: <AlertTriangle className="w-5 h-5 text-orange-500" />
        };
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    if (!canPerformAction()) {
      event.preventDefault();
      event.stopPropagation();
      setShowLimitDialog(true);
    }
  };

  const limitMessage = getLimitMessage();

  return (
    <>
      <div onClick={handleClick} className={!canPerformAction() ? 'cursor-not-allowed' : ''}>
        <div className={!canPerformAction() ? 'opacity-50 pointer-events-none' : ''}>
          {children}
        </div>
      </div>

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {limitMessage.icon}
              {limitMessage.title}
            </DialogTitle>
            <DialogDescription className="text-left">
              {limitMessage.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informações do uso atual */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <h4 className="text-sm font-medium">Uso atual:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Entregadores:</span>
                  <div className="font-medium">
                    {data.entregadoresAtuais} / {data.limites.max_entregadores}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Agendamentos:</span>
                  <div className="font-medium">
                    {data.agendamentosNoMes} / {data.limites.max_agendas_mes}
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowLimitDialog(false)}
                className="flex-1"
              >
                Entendi
              </Button>
              
              {showUpgradeOption && onUpgradeClick && plano !== 'enterprise' && (
                <Button 
                  onClick={() => {
                    setShowLimitDialog(false);
                    onUpgradeClick();
                  }}
                  className="flex-1"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Fazer Upgrade
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook para usar em formulários
export function usePlanLimitCheck(empresaId: string, plano: PlanoType) {
  const { data, loading } = usePlanLimits({ empresaId, plano });

  const checkLimit = React.useCallback((action: 'add_entregador' | 'add_agendamento') => {
    if (loading || !data) return { canProceed: true, reason: null };
    
    if (!data.assinaturaAtiva) {
      return { 
        canProceed: false, 
        reason: 'Assinatura inativa. Reative sua assinatura para continuar.' 
      };
    }

    switch (action) {
      case 'add_entregador':
        if (data.entregadoresAtuais >= data.limites.max_entregadores) {
          return { 
            canProceed: false, 
            reason: `Limite de ${data.limites.max_entregadores} entregadores atingido. Faça upgrade do plano.` 
          };
        }
        break;
      case 'add_agendamento':
        if (data.agendamentosNoMes >= data.limites.max_agendas_mes) {
          return { 
            canProceed: false, 
            reason: `Limite de ${data.limites.max_agendas_mes} agendamentos mensais atingido. Faça upgrade do plano.` 
          };
        }
        break;
    }

    return { canProceed: true, reason: null };
  }, [data, loading]);

  return {
    checkLimit,
    data,
    loading
  };
}

// Componente de alerta inline para mostrar quando próximo do limite
export function PlanLimitAlert({ 
  empresaId, 
  plano, 
  action, 
  threshold = 80,
  onUpgradeClick 
}: {
  empresaId: string;
  plano: PlanoType;
  action: 'add_entregador' | 'add_agendamento';
  threshold?: number;
  onUpgradeClick?: () => void;
}) {
  const { data, loading } = usePlanLimits({ empresaId, plano });

  if (loading || !data) return null;

  const getUsagePercentage = () => {
    switch (action) {
      case 'add_entregador':
        return data.percentualUsoEntregadores;
      case 'add_agendamento':
        return data.percentualUsoAgendamentos;
      default:
        return 0;
    }
  };

  const usagePercentage = getUsagePercentage();

  if (usagePercentage < threshold) return null;

  const getMessage = () => {
    switch (action) {
      case 'add_entregador':
        return `Você está usando ${usagePercentage}% do limite de entregadores (${data.entregadoresAtuais}/${data.limites.max_entregadores}).`;
      case 'add_agendamento':
        return `Você está usando ${usagePercentage}% do limite de agendamentos mensais (${data.agendamentosNoMes}/${data.limites.max_agendas_mes}).`;
      default:
        return 'Você está próximo do limite do seu plano.';
    }
  };

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between">
          <span className="text-sm">{getMessage()}</span>
          {onUpgradeClick && plano !== 'enterprise' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onUpgradeClick}
              className="ml-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default PlanLimitGuard;