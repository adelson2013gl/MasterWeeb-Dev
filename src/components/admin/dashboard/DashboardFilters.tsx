/**
 * Componente de filtros para o dashboard
 * Extraído do DashboardContent para melhorar modularidade
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Filter } from 'lucide-react';

export interface DashboardFiltersProps {
  dataInicio: Date;
  dataFim: Date;
  filtroStatus: "todas" | "ativas" | "inativas";
  filtroOcupacao: "todas" | "criticas" | "disponiveis" | "lotadas";
  onDataInicioChange: (date: Date | undefined) => void;
  onDataFimChange: (date: Date | undefined) => void;
  onFiltroStatusChange: (status: "todas" | "ativas" | "inativas") => void;
  onFiltroOcupacaoChange: (ocupacao: "todas" | "criticas" | "disponiveis" | "lotadas") => void;
}

export function DashboardFilters({
  dataInicio,
  dataFim,
  filtroStatus,
  filtroOcupacao,
  onDataInicioChange,
  onDataFimChange,
  onFiltroStatusChange,
  onFiltroOcupacaoChange
}: DashboardFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Período e Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data-inicio">Data de Início</Label>
            <DatePicker
              date={dataInicio}
              onSelect={onDataInicioChange}
              placeholder="Selecione a data inicial"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="data-fim">Data de Fim</Label>
            <DatePicker
              date={dataFim}
              onSelect={onDataFimChange}
              placeholder="Selecione a data final"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="filtro-status">Status das Agendas</Label>
            <Select 
              value={filtroStatus} 
              onValueChange={onFiltroStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Agendas</SelectItem>
                <SelectItem value="ativas">Apenas Ativas</SelectItem>
                <SelectItem value="inativas">Apenas Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filtro-ocupacao">Nível de Ocupação</Label>
            <Select 
              value={filtroOcupacao} 
              onValueChange={onFiltroOcupacaoChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por ocupação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os Níveis</SelectItem>
                <SelectItem value="disponiveis">Disponíveis (&lt; 80%)</SelectItem>
                <SelectItem value="criticas">Críticas (80-99%)</SelectItem>
                <SelectItem value="lotadas">Lotadas (100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}