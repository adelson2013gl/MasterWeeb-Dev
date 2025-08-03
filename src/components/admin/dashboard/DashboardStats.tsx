/**
 * Componente de estatísticas do dashboard
 * Extraído do DashboardContent para melhorar modularidade
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, Calendar, TrendingUp } from 'lucide-react';

export interface AgendasStats {
  totalAgendas: number;
  agendasAtivas: number;
  agendasInativas: number;
  totalVagas: number;
  vagasOcupadas: number;
  taxaOcupacao: number;
  totalReservas: number;
  agendasComReservas: number;
}

export interface DashboardStatsProps {
  stats: AgendasStats;
  loading?: boolean;
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <div className="animate-pulse h-2 bg-gray-200 rounded mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getOccupancyStatus = (percentage: number) => {
    if (percentage >= 90) return 'Crítica';
    if (percentage >= 70) return 'Moderada';
    return 'Baixa';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de Agendas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Agendas</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAgendas}</div>
          <p className="text-xs text-muted-foreground">
            {stats.agendasAtivas} ativas, {stats.agendasInativas} inativas
          </p>
        </CardContent>
      </Card>

      {/* Taxa de Ocupação */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.taxaOcupacao.toFixed(1)}%</div>
          <div className="mt-2 space-y-1">
            <Progress 
              value={stats.taxaOcupacao} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {getOccupancyStatus(stats.taxaOcupacao)} - {stats.vagasOcupadas}/{stats.totalVagas} vagas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total de Vagas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vagas Disponíveis</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVagas}</div>
          <p className="text-xs text-muted-foreground">
            {stats.vagasOcupadas} ocupadas
          </p>
        </CardContent>
      </Card>

      {/* Reservas Pendentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reservas Pendentes</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalReservas}</div>
          <p className="text-xs text-muted-foreground">
            Em {stats.agendasComReservas} agendas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}