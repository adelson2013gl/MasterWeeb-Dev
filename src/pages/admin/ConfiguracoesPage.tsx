import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfiguracoesSistema } from '@/components/admin/ConfiguracoesSistema';
import { WebhookMonitorDashboard } from '@/components/admin/WebhookMonitorDashboard';
import { IuguMainPage } from '@/components/admin/IuguMainPage';
import { Settings, CreditCard, Globe, Shield, Activity, Zap } from 'lucide-react';

export function ConfiguracoesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>
      
      <p className="text-muted-foreground">
        Gerencie as configurações gerais do sistema e integrações com serviços externos.
      </p>

      <Tabs defaultValue="iugu" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="iugu" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Iugu
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="integracao" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="iugu">
          <IuguMainPage />
        </TabsContent>


        <TabsContent value="webhooks">
          <WebhookMonitorDashboard />
        </TabsContent>

        <TabsContent value="sistema">
          <ConfiguracoesSistema />
        </TabsContent>

        <TabsContent value="integracao">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Integrações Disponíveis
                </CardTitle>
                <CardDescription>
                  Gerencie todas as integrações externas do Master Web
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Iugu - Implementada */}
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="h-8 w-8 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">Iugu</h3>
                            <p className="text-sm text-muted-foreground">Pagamentos recorrentes</p>
                          </div>
                        </div>
                        <div className="text-green-600 text-sm font-medium">✅ Implementado</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Nova Plataforma de Pagamento */}
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-8 w-8 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">Gateway de Pagamento</h3>
                            <p className="text-sm text-muted-foreground">Plataforma de pagamentos</p>
                          </div>
                        </div>
                        <div className="text-yellow-600 text-sm font-medium">🔧 Em configuração</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Integrações Futuras */}
                  <Card className="border-gray-200 bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="h-8 w-8 text-gray-600" />
                          <div>
                            <h3 className="font-semibold text-gray-700">WhatsApp Business</h3>
                            <p className="text-sm text-gray-500">Notificações automáticas</p>
                          </div>
                        </div>
                        <div className="text-gray-500 text-sm">Em breve</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="h-8 w-8 text-gray-600" />
                          <div>
                            <h3 className="font-semibold text-gray-700">SendGrid</h3>
                            <p className="text-sm text-gray-500">Email marketing</p>
                          </div>
                        </div>
                        <div className="text-gray-500 text-sm">Em breve</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Gerencie políticas de segurança, autenticação e autorização.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta seção será implementada em futuras versões.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}