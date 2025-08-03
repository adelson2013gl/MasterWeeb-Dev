// Exemplo de integração dos componentes de monetização
// Este arquivo demonstra como usar os componentes criados

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, CreditCard, Users, Calendar, Settings } from 'lucide-react';

// Importar componentes de monetização
import {
  PlanoSelector,
  BillingDashboard,
  PlanLimitsCard,
  PlanLimitGuard,
  PlanLimitAlert,
  usePlanLimitCheck
} from '@/components/billing';

// Hook de autenticação (assumindo que existe)
import { useAuth } from '@/hooks/useAuth';

// Exemplo de página completa de monetização
export function ExampleBillingPage() {
  const { user } = useAuth();
  
  // Dados de exemplo (substitua pelos dados reais)
  const empresaId = user?.empresa_id || 'exemplo-empresa-id';
  const planoAtual = user?.empresa?.plano || 'basico';
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monetização</h1>
          <p className="text-muted-foreground">
            Gerencie seus planos e acompanhe o uso dos recursos
          </p>
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
          <TabsTrigger value="examples">Exemplos de Uso</TabsTrigger>
        </TabsList>

        {/* Aba: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card de Limites do Plano */}
            <PlanLimitsCard
              empresaId={empresaId}
              plano={planoAtual}
              onUpgradeClick={() => {
                console.log('Redirecionando para upgrade...');
                // Implementar navegação para página de planos
              }}
            />
            
            {/* Card de Informações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Como Funciona
                </CardTitle>
                <CardDescription>
                  Entenda o sistema de monetização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Planos Disponíveis:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Básico:</strong> 5 entregadores, 100 agendamentos/mês</li>
                    <li>• <strong>Profissional:</strong> 20 entregadores, 500 agendamentos/mês</li>
                    <li>• <strong>Enterprise:</strong> Ilimitado</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Recursos:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Controle automático de limites</li>
                    <li>• Alertas de uso</li>
                    <li>• Faturamento via Mercado Pago</li>
                    <li>• Upgrade/downgrade flexível</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Planos */}
        <TabsContent value="plans" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Selecione o plano que melhor atende às necessidades da sua empresa.
              Você pode fazer upgrade ou downgrade a qualquer momento.
            </AlertDescription>
          </Alert>
          
          <PlanoSelector />
        </TabsContent>

        {/* Aba: Faturamento */}
        <TabsContent value="billing" className="space-y-6">
          <BillingDashboard />
        </TabsContent>

        {/* Aba: Exemplos de Uso */}
        <TabsContent value="examples" className="space-y-6">
          <ExamplesSection empresaId={empresaId} plano={planoAtual} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Seção de exemplos de uso dos componentes
function ExamplesSection({ empresaId, plano }: { empresaId: string; plano: string }) {
  const { checkLimit } = usePlanLimitCheck(empresaId, plano as any);
  
  const handleAddEntregador = () => {
    const result = checkLimit('add_entregador');
    if (result.canProceed) {
      console.log('✅ Pode adicionar entregador');
      // Implementar lógica de adição
    } else {
      console.log('❌ Não pode adicionar:', result.reason);
    }
  };
  
  const handleAddAgendamento = () => {
    const result = checkLimit('add_agendamento');
    if (result.canProceed) {
      console.log('✅ Pode criar agendamento');
      // Implementar lógica de criação
    } else {
      console.log('❌ Não pode criar:', result.reason);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Exemplos de Uso</h2>
        <p className="text-muted-foreground mb-6">
          Veja como integrar os componentes de monetização em suas funcionalidades.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Exemplo 1: Proteção de Botão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Proteção de Botão
            </CardTitle>
            <CardDescription>
              Use PlanLimitGuard para proteger ações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanLimitGuard
              empresaId={empresaId}
              plano={plano as any}
              action="add_entregador"
              onUpgradeClick={() => console.log('Upgrade clicked!')}
            >
              <Button className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Adicionar Entregador
              </Button>
            </PlanLimitGuard>
            
            <div className="text-xs text-muted-foreground">
              Este botão será desabilitado se o limite for atingido
            </div>
          </CardContent>
        </Card>
        
        {/* Exemplo 2: Verificação Manual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Verificação Manual
            </CardTitle>
            <CardDescription>
              Use usePlanLimitCheck para verificações customizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={handleAddEntregador}
                variant="outline"
                className="w-full"
              >
                Testar Limite Entregadores
              </Button>
              
              <Button 
                onClick={handleAddAgendamento}
                variant="outline"
                className="w-full"
              >
                Testar Limite Agendamentos
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Abra o console para ver os resultados
            </div>
          </CardContent>
        </Card>
        
        {/* Exemplo 3: Alerta de Limite */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Alertas de Limite</CardTitle>
            <CardDescription>
              Use PlanLimitAlert para mostrar avisos quando próximo do limite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanLimitAlert
              empresaId={empresaId}
              plano={plano as any}
              action="add_entregador"
              threshold={70} // Mostrar alerta quando usar 70% do limite
              onUpgradeClick={() => console.log('Upgrade from alert!')}
            />
            
            <PlanLimitAlert
              empresaId={empresaId}
              plano={plano as any}
              action="add_agendamento"
              threshold={80} // Mostrar alerta quando usar 80% do limite
              onUpgradeClick={() => console.log('Upgrade from alert!')}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Código de Exemplo */}
      <Card>
        <CardHeader>
          <CardTitle>Código de Exemplo</CardTitle>
          <CardDescription>
            Como integrar em seus componentes existentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Exemplo de integração
import { PlanLimitGuard, usePlanLimitCheck } from '@/components/billing';

function MeuComponente() {
  const { user } = useAuth();
  const { checkLimit } = usePlanLimitCheck(
    user?.empresa_id, 
    user?.empresa?.plano
  );
  
  const handleAction = () => {
    const result = checkLimit('add_entregador');
    if (result.canProceed) {
      // Executar ação
    } else {
      // Mostrar erro ou modal de upgrade
    }
  };
  
  return (
    <PlanLimitGuard
      empresaId={user?.empresa_id}
      plano={user?.empresa?.plano}
      action="add_entregador"
      onUpgradeClick={() => navigate('/billing/plans')}
    >
      <Button onClick={handleAction}>
        Adicionar Entregador
      </Button>
    </PlanLimitGuard>
  );
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExampleBillingPage;