// Dashboard de faturamento e gerenciamento de assinaturas
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  Loader2,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPlanoConfig, type PlanoType } from '@/config/planos';
import PlanoSelector from './PlanoSelector';
import CustomLimitsEditor from './CustomLimitsEditor';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { BillingErrorBoundary } from '@/components/ErrorBoundary/index';
import { abacatePayService } from '@/services/abacatePayService';
import type { BillingResponse } from '@/types/abacatepay';

interface BillingDashboardProps {
  empresaId: string;
  empresaNome: string;
  empresaEmail: string;
}

function BillingDashboardComponent({ empresaId, empresaNome, empresaEmail }: BillingDashboardProps) {
  const { isSuperAdmin } = useEmpresaUnificado();
  const [assinaturas, setAssinaturas] = useState<BillingResponse[]>([]);
  const [transacoes, setTransacoes] = useState<BillingResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const { toast } = useToast();

  const assinaturaAtiva = assinaturas.find(a => a.status === 'PAID');
  const planoAtual = 'basico' as PlanoType; // TODO: Extrair do metadata

  useEffect(() => {
    carregarDados();
  }, [empresaId]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      
      if (!abacatePayService.isConfigured()) {
        console.warn('AbacatePay não configurado - usando dados mock');
        setAssinaturas([]);
        setTransacoes([]);
        return;
      }
      
      // Carregar cobranças do AbacatePay
      const response = await abacatePayService.listBillings();
      
      if (response.error) {
        console.warn('Erro AbacatePay (normal em desenvolvimento):', response.error.message);
        setAssinaturas([]);
        setTransacoes([]);
        return;
      }
      
      const billings = response.data || [];
      
      // Separar por status - assinaturas ativas e transações histórico
      const ativas = billings.filter(b => b.status === 'PENDING' || b.status === 'PAID');
      const historico = billings.filter(b => b.status === 'PAID' || b.status === 'CANCELLED' || b.status === 'EXPIRED');
      
      setAssinaturas(ativas);
      setTransacoes(historico);
      
      console.log('Dados carregados:', { ativas: ativas.length, historico: historico.length });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações de cobrança.",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleCancelarAssinatura = async (billing: BillingResponse) => {
    setProcessando(billing.id);
    try {
      // AbacatePay não tem endpoint de cancelamento direto
      // Implementar lógica de cancelamento via backend se necessário
      toast({
        title: 'Cancelamento solicitado',
        description: 'Entre em contato com o suporte para cancelar.',
        variant: 'default'
      });
      await carregarDados();
    } catch (error) {
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível processar a solicitação.',
        variant: 'destructive'
      });
    } finally {
      setProcessando(null);
    }
  };

  const handleConsultarStatus = async (billing: BillingResponse) => {
    setProcessando(billing.id);
    try {
      const response = await abacatePayService.getBilling({ billId: billing.id });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      toast({
        title: 'Status atualizado',
        description: `Status atual: ${response.data?.status}`,
        variant: 'default'
      });
      
      await carregarDados();
    } catch (error) {
      toast({
        title: 'Erro ao consultar',
        description: 'Não foi possível consultar o status.',
        variant: 'destructive'
      });
    } finally {
      setProcessando(null);
    }
  };

  const handleAbrirPagamento = (billing: BillingResponse) => {
    if (billing.url && billing.status === 'PENDING') {
      window.open(billing.url, '_blank');
      toast({
        title: 'Redirecionando',
        description: 'Abrindo página de pagamento.',
        variant: 'default'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados de cobrança...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard de Faturamento</h2>
        <Button onClick={carregarDados} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscriptions">Cobranças</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cobranças Ativas
              </CardTitle>
              <CardDescription>
                Gerencie suas cobranças e pagamentos PIX
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assinaturas.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhuma cobrança ativa encontrada</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Configure um plano para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assinaturas.map((billing) => (
                    <div key={billing.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{billing.description}</h3>
                          {getStatusBadge(billing.status)}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatarValor(abacatePayService.convertToReais(billing.amount))}</p>
                          <p className="text-sm text-gray-500">PIX</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">ID da Cobrança:</span>
                          <p className="font-mono text-xs">{billing.id}</p>
                        </div>
                        <div>
                          <span className="font-medium">Criado em:</span>
                          <p>{formatarData(billing.createdAt)}</p>
                        </div>
                        {billing.paidAt && (
                          <div>
                            <span className="font-medium">Pago em:</span>
                            <p>{formatarData(billing.paidAt)}</p>
                          </div>
                        )}
                        {billing.expiresAt && (
                          <div>
                            <span className="font-medium">Expira em:</span>
                            <p>{formatarData(billing.expiresAt)}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {billing.status === 'PENDING' && (
                          <Button
                            onClick={() => handleAbrirPagamento(billing)}
                            variant="default"
                            size="sm"
                            disabled={processando === billing.id}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pagar Agora
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleConsultarStatus(billing)}
                          variant="outline"
                          size="sm"
                          disabled={processando === billing.id}
                        >
                          {processando === billing.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Atualizar Status
                        </Button>
                        
                        {(billing.status === 'PENDING' || billing.status === 'PAID') && (
                          <Button
                            onClick={() => handleCancelarAssinatura(billing)}
                            variant="destructive"
                            size="sm"
                            disabled={processando === billing.id}
                          >
                            {processando === billing.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Solicitar Cancelamento
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <PlanoSelector
            empresaId={empresaId}
            empresaNome={empresaNome}
            empresaEmail={empresaEmail}
            planoAtual={planoAtual}
            onPlanoSelecionado={carregarDados}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Cobranças</CardTitle>
              <CardDescription>
                Todas as cobranças relacionadas às suas assinaturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transacoes.length > 0 ? (
                <div className="space-y-4">
                  {transacoes.map((transacao) => (
                    <div key={transacao.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Cobrança PIX</span>
                          {getStatusBadge(transacao.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transacao.description} • 
                          {formatarData(transacao.createdAt)}
                        </div>
                        {transacao.externalId && (
                          <div className="text-xs text-muted-foreground font-mono">
                            Ref: {transacao.externalId}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium">
                          {formatarValor(abacatePayService.convertToReais(transacao.amount))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          PIX
                        </div>
                        {transacao.paidAt && (
                          <div className="text-xs text-green-600">
                            Pago: {formatarData(transacao.paidAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhuma cobrança encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Wrapper com error boundary específico para billing
export function BillingDashboard(props: BillingDashboardProps) {
  return (
    <BillingErrorBoundary 
      context="billing-dashboard"
      fallbackTitle="Erro no Dashboard de Faturamento"
      onRetry={() => window.location.reload()}
    >
      <BillingDashboardComponent {...props} />
    </BillingErrorBoundary>
  );
}

export default BillingDashboard;