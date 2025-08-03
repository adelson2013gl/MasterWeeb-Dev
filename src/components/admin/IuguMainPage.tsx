import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Settings, 
  DollarSign, 
  BarChart3, 
  CheckCircle2,
  Link,
  Activity,
  Shield
} from 'lucide-react';
import { ConfiguracoesIugu } from './ConfiguracoesIugu';
import { GerenciamentoPlanos } from './GerenciamentoPlanos';
import { IuguIntegrationChecklist } from './IuguIntegrationChecklist';
import { IuguDashboard } from './IuguDashboard';

export function IuguMainPage() {
  const [activeTab, setActiveTab] = useState('checklist');

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            Integração Iugu
          </h1>
          <p className="text-muted-foreground mt-1">
            Central de pagamentos recorrentes e gestão de assinaturas
          </p>
        </div>
        
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          <Activity className="w-3 h-3 mr-1" />
          Sistema Ativo
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurações</CardTitle>
            <Settings className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">API</div>
            <p className="text-xs text-muted-foreground">
              Credenciais e configurações
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Planos configurados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Link className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-muted-foreground">
              Configurado e ativo
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dashboard</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live</div>
            <p className="text-xs text-muted-foreground">
              Métricas em tempo real
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="planos" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        {/* Aba Checklist */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                Progresso da Integração
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso da implementação da integração com a Iugu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IuguIntegrationChecklist />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Configurações */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Configurações da API
              </CardTitle>
              <CardDescription>
                Configure credenciais, webhooks e automações da Iugu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConfiguracoesIugu />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Planos */}
        <TabsContent value="planos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                Gestão de Planos
              </CardTitle>
              <CardDescription>
                Crie, edite e sincronize planos de assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GerenciamentoPlanos />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Métricas e Performance
              </CardTitle>
              <CardDescription>
                Visualize dados de receita, assinaturas e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IuguDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rodapé com Informações */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-300">
                🚀 Sistema de Integração Iugu Implementado com Sucesso!
              </p>
              <p className="text-xs text-blue-400">
                Sua empresa agora pode aceitar pagamentos recorrentes de forma automatizada. 
                Configure suas credenciais na aba "Configurações" para começar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 