// Componente para exibir limites e uso atual do plano
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  CreditCard
} from 'lucide-react';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { getPlanoConfig, type PlanoType } from '@/types/subscription';

interface PlanLimitsCardProps {
  empresaId: string;
  plano: PlanoType;
  onUpgradeClick?: () => void;
  showUpgradeButton?: boolean;
}

export function PlanLimitsCard({ 
  empresaId, 
  plano, 
  onUpgradeClick,
  showUpgradeButton = true 
}: PlanLimitsCardProps) {
  const { data, loading, error } = usePlanLimits({ empresaId, plano });
  const planoConfig = getPlanoConfig(plano);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || 'Não foi possível carregar os dados do plano'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (percentage >= 70) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const needsUpgrade = data.percentualUsoEntregadores >= 80 || data.percentualUsoAgendamentos >= 80;

  return (
    <Card className={needsUpgrade ? 'border-yellow-200 bg-yellow-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Plano {planoConfig.nome}
            </CardTitle>
            <CardDescription>
              Uso atual dos recursos do seu plano
            </CardDescription>
          </div>
          {!data.assinaturaAtiva && (
            <Badge variant="destructive">
              Inativa
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status da Assinatura */}
        {data.proximoVencimento && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Próximo pagamento</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {formatarData(data.proximoVencimento)}
              </div>
              {data.diasParaVencimento !== undefined && (
                <div className={`text-xs ${
                  data.diasParaVencimento <= 3 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {data.diasParaVencimento > 0 
                    ? `${data.diasParaVencimento} dias`
                    : data.diasParaVencimento === 0
                    ? 'Hoje'
                    : `${Math.abs(data.diasParaVencimento)} dias em atraso`
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* Uso de Entregadores */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Entregadores</span>
              {getStatusIcon(data.percentualUsoEntregadores)}
            </div>
            <span className="text-sm text-muted-foreground">
              {data.entregadoresAtuais} / {data.limites.max_entregadores}
            </span>
          </div>
          <Progress 
            value={data.percentualUsoEntregadores} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.percentualUsoEntregadores}% usado</span>
            <span>
              {data.limites.max_entregadores - data.entregadoresAtuais} disponíveis
            </span>
          </div>
        </div>

        {/* Uso de Agendamentos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Agendamentos (mês)</span>
              {getStatusIcon(data.percentualUsoAgendamentos)}
            </div>
            <span className="text-sm text-muted-foreground">
              {data.agendamentosNoMes} / {data.limites.max_agendas_mes}
            </span>
          </div>
          <Progress 
            value={data.percentualUsoAgendamentos} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.percentualUsoAgendamentos}% usado</span>
            <span>
              {data.limites.max_agendas_mes - data.agendamentosNoMes} disponíveis
            </span>
          </div>
        </div>

        {/* Alertas e Recomendações */}
        {needsUpgrade && showUpgradeButton && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Limite quase atingido
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Considere fazer upgrade do seu plano para evitar interrupções.
                </p>
              </div>
            </div>
            {onUpgradeClick && (
              <Button 
                size="sm" 
                className="mt-2 w-full"
                onClick={onUpgradeClick}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Fazer Upgrade
              </Button>
            )}
          </div>
        )}

        {/* Recursos do Plano */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recursos inclusos:</h4>
          <div className="grid grid-cols-1 gap-1">
            {data.limites.recursos_disponivel.slice(0, 3).map((recurso, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>{recurso}</span>
              </div>
            ))}
            {data.limites.recursos_disponivel.length > 3 && (
              <div className="text-xs text-muted-foreground ml-5">
                +{data.limites.recursos_disponivel.length - 3} outros recursos
              </div>
            )}
          </div>
        </div>

        {/* Botão de Upgrade (se não mostrado no alerta) */}
        {!needsUpgrade && showUpgradeButton && onUpgradeClick && plano !== 'enterprise' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onUpgradeClick}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Fazer Upgrade do Plano
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default PlanLimitsCard;