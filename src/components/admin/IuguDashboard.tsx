import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Calendar,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { iuguService } from '@/services/iuguService';
import { 
  IuguMetrics, 
  IuguSubscription, 
  IuguInvoice, 
  formatIuguCurrency,
  getIuguStatusColor,
  getIuguStatusLabel 
} from '@/types/iugu';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface DashboardData {
  metrics: IuguMetrics;
  recentSubscriptions: IuguSubscription[];
  recentInvoices: IuguInvoice[];
  loading: boolean;
  error: string | null;
}

const mockMetrics: IuguMetrics = {
  total_customers: 156,
  active_subscriptions: 89,
  suspended_subscriptions: 12,
  canceled_subscriptions: 8,
  monthly_recurring_revenue: 44750,
  annual_recurring_revenue: 537000,
  churn_rate: 3.2,
  conversion_rate: 87.5,
  pending_invoices: 23,
  paid_invoices: 156,
  overdue_invoices: 7
};

export function IuguDashboard() {
  const [data, setData] = useState<DashboardData>({
    metrics: mockMetrics,
    recentSubscriptions: [],
    recentInvoices: [],
    loading: false,
    error: null
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // Em produção, estas chamadas seriam para a API real da Iugu
      const metrics = await iuguService.getMetrics();
      
      setData(prev => ({
        ...prev,
        metrics,
        loading: false
      }));
      
      setLastUpdated(new Date());
      logger.info('✅ Dashboard Iugu carregado', { metrics });
      
    } catch (error) {
      logger.error('❌ Erro ao carregar dashboard Iugu', { error });
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      toast.error('Erro ao carregar dados do dashboard');
    }
  };

  const getHealthColor = (value: number, type: 'good' | 'bad' | 'neutral' = 'good'): string => {
    if (type === 'bad') {
      return value > 10 ? 'text-red-400' : value > 5 ? 'text-yellow-400' : 'text-green-400';
    }
    return value > 80 ? 'text-green-400' : value > 60 ? 'text-yellow-400' : 'text-red-400';
  };

  const getHealthIcon = (value: number, type: 'good' | 'bad' | 'neutral' = 'good') => {
    const color = getHealthColor(value, type);
    if (color.includes('green')) return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (color.includes('yellow')) return <Activity className="h-4 w-4 text-yellow-400" />;
    return <TrendingDown className="h-4 w-4 text-red-400" />;
  };

  const { metrics, loading, error } = data;

  return (
    <div className="space-y-6" data-testid="iugu-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Dashboard Iugu
          </h2>
          <p className="text-muted-foreground">
            Acompanhe métricas e performance dos pagamentos
          </p>
          <p className="text-xs text-muted-foreground">
            Última atualização: {lastUpdated.toLocaleString()}
          </p>
        </div>
        
        <Button
          onClick={loadDashboardData}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">
            <strong>Erro:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Receita Mensal)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatIuguCurrency(metrics.monthly_recurring_revenue * 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              ARR: {formatIuguCurrency(metrics.annual_recurring_revenue * 100)}
            </p>
          </CardContent>
        </Card>

        {/* Total de Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_customers}</div>
            <p className="text-xs text-muted-foreground">
              Assinaturas ativas: {metrics.active_subscriptions}
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            {getHealthIcon(metrics.conversion_rate)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(metrics.conversion_rate)}`}>
              {metrics.conversion_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: 85%
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Churn */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            {getHealthIcon(metrics.churn_rate, 'bad')}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(metrics.churn_rate, 'bad')}`}>
              {metrics.churn_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: &lt; 5%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes das Assinaturas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Assinaturas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Status das Assinaturas
            </CardTitle>
            <CardDescription>
              Distribuição por status atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm">Ativas</span>
                </div>
                <Badge variant="default" className="bg-green-500 text-green-50">
                  {metrics.active_subscriptions}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm">Suspensas</span>
                </div>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  {metrics.suspended_subscriptions}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-sm">Canceladas</span>
                </div>
                <Badge variant="outline" className="text-red-400 border-red-400">
                  {metrics.canceled_subscriptions}
                </Badge>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taxa de Ativação</span>
                  <span className="font-medium">
                    {((metrics.active_subscriptions / (metrics.active_subscriptions + metrics.suspended_subscriptions + metrics.canceled_subscriptions)) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(metrics.active_subscriptions / (metrics.active_subscriptions + metrics.suspended_subscriptions + metrics.canceled_subscriptions)) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status das Faturas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Status das Faturas
            </CardTitle>
            <CardDescription>
              Situação dos pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Pagas</span>
                </div>
                <Badge variant="default" className="bg-green-500 text-green-50">
                  {metrics.paid_invoices}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  {metrics.pending_invoices}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm">Em Atraso</span>
                </div>
                <Badge variant="outline" className="text-red-400 border-red-400">
                  {metrics.overdue_invoices}
                </Badge>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taxa de Pagamento</span>
                  <span className="font-medium">
                    {((metrics.paid_invoices / (metrics.paid_invoices + metrics.pending_invoices + metrics.overdue_invoices)) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(metrics.paid_invoices / (metrics.paid_invoices + metrics.pending_invoices + metrics.overdue_invoices)) * 100} 
                  className="h-2"
                />
              </div>
            </div>
            
            {metrics.overdue_invoices > 0 && (
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  <strong>{metrics.overdue_invoices} faturas em atraso</strong> requerem atenção
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resumo de Performance
          </CardTitle>
          <CardDescription>
            Indicadores principais de saúde do negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  metrics.conversion_rate > 85 ? 'bg-green-400' : 
                  metrics.conversion_rate > 70 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm font-medium">Conversão</span>
              </div>
              <p className="text-2xl font-bold">{metrics.conversion_rate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                {metrics.conversion_rate > 85 ? 'Excelente' : 
                 metrics.conversion_rate > 70 ? 'Bom' : 'Precisa melhorar'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  metrics.churn_rate < 5 ? 'bg-green-400' : 
                  metrics.churn_rate < 10 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm font-medium">Retenção</span>
              </div>
              <p className="text-2xl font-bold">{(100 - metrics.churn_rate).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                Churn: {metrics.churn_rate.toFixed(1)}%
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  (metrics.paid_invoices / (metrics.paid_invoices + metrics.pending_invoices + metrics.overdue_invoices)) * 100 > 90 ? 'bg-green-400' : 
                  (metrics.paid_invoices / (metrics.paid_invoices + metrics.pending_invoices + metrics.overdue_invoices)) * 100 > 80 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm font-medium">Pagamentos</span>
              </div>
              <p className="text-2xl font-bold">
                {((metrics.paid_invoices / (metrics.paid_invoices + metrics.pending_invoices + metrics.overdue_invoices)) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics.overdue_invoices} em atraso
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 