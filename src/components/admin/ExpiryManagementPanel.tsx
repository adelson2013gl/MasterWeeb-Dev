
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Search,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExpiryManagement } from './ExpiryManagement';
import { getRecentExecutionLogs } from '@/utils/verifyExpiryFunctions';
import { calcularDiasRestantes } from '@/utils/expiryUtils';

interface Empresa {
  id: string;
  nome: string;
  email: string;
  data_expiracao: string | null;
  ativa: boolean;
  plano_atual: string;
}

export function ExpiryManagementPanel() {
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'vencidas' | 'proximas' | 'ativas'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome, email, data_expiracao, ativa, plano_atual')
        .order('nome');

      if (error) throw error;

      setEmpresas(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar empresas', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarLogs = async () => {
    const result = await getRecentExecutionLogs();
    if (result.success) {
      setExecutionLogs(result.logs);
    }
  };

  useEffect(() => {
    carregarEmpresas();
    carregarLogs();
  }, []);

  const empresasFiltradas = empresas.filter(empresa => {
    // Filtro por termo de busca
    if (searchTerm && !empresa.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro por status
    if (filtroStatus === 'todos') return true;

    const hoje = new Date();
    const dataVencimento = empresa.data_expiracao ? new Date(empresa.data_expiracao) : null;

    switch (filtroStatus) {
      case 'vencidas':
        return dataVencimento && isBefore(dataVencimento, hoje);
      case 'proximas':
        const em30Dias = addDays(hoje, 30);
        return dataVencimento && isAfter(dataVencimento, hoje) && isBefore(dataVencimento, em30Dias);
      case 'ativas':
        return dataVencimento && isAfter(dataVencimento, hoje);
      default:
        return true;
    }
  });

  const getStatusBadge = (empresa: Empresa) => {
    if (!empresa.data_expiracao) {
      return <Badge variant="secondary">Sem Vencimento</Badge>;
    }

    const hoje = new Date();
    const dataVencimento = new Date(empresa.data_expiracao);

    if (isBefore(dataVencimento, hoje)) {
      return <Badge variant="destructive">Vencida</Badge>;
    }

    const em7Dias = addDays(hoje, 7);
    const em30Dias = addDays(hoje, 30);

    if (isBefore(dataVencimento, em7Dias)) {
      return <Badge variant="destructive">Vence em 7 dias</Badge>;
    }

    if (isBefore(dataVencimento, em30Dias)) {
      return <Badge variant="secondary">Vence em 30 dias</Badge>;
    }

    return <Badge variant="default">Ativa</Badge>;
  };

  const renderVencimentoComDias = (empresa: Empresa) => {
    if (!empresa.data_expiracao) {
      return <span className="text-sm text-muted-foreground">Sem vencimento definido</span>;
    }

    const diasInfo = calcularDiasRestantes(empresa.data_expiracao);
    const dataFormatada = format(new Date(empresa.data_expiracao), 'dd/MM/yyyy', { locale: ptBR });

    return (
      <div className="text-sm text-muted-foreground">
        <span>Vencimento: {dataFormatada}</span>
        {diasInfo && (
          <span className={`ml-2 font-medium ${diasInfo.colorClass}`}>
            {diasInfo.displayText}
          </span>
        )}
      </div>
    );
  };

  const resumoStatus = {
    total: empresas.length,
    vencidas: empresas.filter(e => e.data_expiracao && isBefore(new Date(e.data_expiracao), new Date())).length,
    proximas: empresas.filter(e => {
      if (!e.data_expiracao) return false;
      const hoje = new Date();
      const vencimento = new Date(e.data_expiracao);
      const em30Dias = addDays(hoje, 30);
      return isAfter(vencimento, hoje) && isBefore(vencimento, em30Dias);
    }).length,
    ativas: empresas.filter(e => e.data_expiracao && isAfter(new Date(e.data_expiracao), addDays(new Date(), 30))).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Vencimentos</h2>
          <p className="text-muted-foreground">Gerencie os vencimentos das empresas</p>
        </div>
        
        <Button onClick={carregarEmpresas} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Resumo de Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{resumoStatus.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold">{resumoStatus.vencidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Próximas (30 dias)</p>
                <p className="text-2xl font-bold">{resumoStatus.proximas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold">{resumoStatus.ativas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="empresas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="logs">Logs de Execução</TabsTrigger>
        </TabsList>

        <TabsContent value="empresas" className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="flex gap-2">
              {(['todos', 'vencidas', 'proximas', 'ativas'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filtroStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroStatus(status)}
                >
                  {status === 'todos' && 'Todas'}
                  {status === 'vencidas' && 'Vencidas'}
                  {status === 'proximas' && 'Próximas'}
                  {status === 'ativas' && 'Ativas'}
                </Button>
              ))}
            </div>
          </div>

          {/* Lista de Empresas */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Carregando empresas...</p>
              </div>
            ) : empresasFiltradas.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
                </CardContent>
              </Card>
            ) : (
              empresasFiltradas.map((empresa) => (
                <Card key={empresa.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{empresa.nome}</h3>
                          {getStatusBadge(empresa)}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Email: {empresa.email}</p>
                          <p className="text-sm text-muted-foreground">Plano: {empresa.plano_atual}</p>
                          <p className="text-sm text-muted-foreground">Status: {empresa.ativa ? 'Ativa' : 'Inativa'}</p>
                          {renderVencimentoComDias(empresa)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ExpiryManagement 
                          empresaId={empresa.id}
                          empresaNome={empresa.nome}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Execução Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {executionLogs.length === 0 ? (
                <p className="text-muted-foreground">Nenhum log encontrado</p>
              ) : (
                <div className="space-y-2">
                  {executionLogs.map((log, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.evento}</p>
                          {log.detalhes && (
                            <p className="text-sm text-muted-foreground">
                              {typeof log.detalhes === 'string' ? log.detalhes : JSON.stringify(log.detalhes)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
