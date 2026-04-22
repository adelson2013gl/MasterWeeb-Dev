import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Wrench, ClipboardList, TrendingUp } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

const DashboardContent = memo(() => {
  const { stats, loading } = useDashboardStats();
  const { empresasDisponiveis, empresa, isSuperAdmin } = useEmpresaUnificado();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          📊 Visão geral do sistema - {empresa?.nome || 'Sistema'}
        </p>
      </div>

      {/* Cards Principais - Sistema OS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Empresas Cadastradas
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{empresasDisponiveis.length}</div>
              <p className="text-xs text-muted-foreground">
                Total no sistema
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Técnicos Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tecnicosAtivos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tecnicosPendentes} aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Setores
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.setores}</div>
            <p className="text-xs text-muted-foreground">
              Áreas industriais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ordens de Serviço
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordensServico}</div>
            <p className="text-xs text-muted-foreground">
              Total no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Técnicos
            </CardTitle>
            <CardDescription>
              Status da equipe técnica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Ativos</span>
                <Badge variant="default">{stats.tecnicosAtivos}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Pendentes</span>
                <Badge variant="secondary">{stats.tecnicosPendentes}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Setores Industriais
            </CardTitle>
            <CardDescription>
              Áreas de atuação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total de Setores</span>
                <Badge variant="default">{stats.setores}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Ordens de Serviço</span>
                <Badge variant="default">{stats.ordensServico}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Multi-Empresa
              </CardTitle>
              <CardDescription>
                Gestão centralizada de empresas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Empresa Atual</span>
                  <Badge variant="outline">{empresa?.nome}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Plano</span>
                  <Badge variant={empresa?.plano === 'enterprise' ? 'default' : 'secondary'}>
                    {empresa?.plano}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alertas e Ações Rápidas */}
      {stats.tecnicosPendentes > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Ação Necessária</CardTitle>
            <CardDescription className="text-yellow-700">
              Você tem {stats.tecnicosPendentes} técnicos aguardando aprovação
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
});

DashboardContent.displayName = 'DashboardContent';

export { DashboardContent };
