
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users, Edit, X, Eye } from 'lucide-react';
import { formatarDataSimples } from '@/lib/utils';
import { Agenda } from '@/types/agenda';

interface TabelaAgendasAtivasProps {
  agendas: Agenda[];
  onEditAgenda: (agenda: Agenda) => void;
  onCancelAgenda: (agendaId: string) => void;
  onViewDetalhes: (agenda: Agenda) => void;
}

/**
 * Componente responsável por exibir a tabela de agendas ativas
 * Mostra informações detalhadas sobre ocupação, turnos e permite ações de edição
 */
export function TabelaAgendasAtivas({
  agendas,
  onEditAgenda,
  onCancelAgenda,
  onViewDetalhes
}: TabelaAgendasAtivasProps) {
  
  /**
   * Calcula o percentual de ocupação das vagas
   */
  const getOcupacaoPercentual = (ocupadas: number, disponiveis: number) => {
    if (disponiveis === 0) return 0;
    return Math.round((ocupadas / disponiveis) * 100);
  };

  /**
   * Retorna a variante do badge baseada no percentual de ocupação
   */
  const getOcupacaoVariant = (percentual: number) => {
    if (percentual >= 100) return 'destructive';
    if (percentual >= 85) return 'secondary';
    if (percentual >= 60) return 'outline';
    return 'default';
  };

  /**
   * Retorna o status textual da ocupação
   */
  const getStatusOcupacao = (percentual: number, ocupadas: number, disponiveis: number) => {
    if (percentual >= 100) return 'Lotado';
    if (percentual >= 85) return 'Quase lotado';
    if (percentual === 0) return 'Disponível';
    return `${disponiveis - ocupadas} vagas`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Agendas Ativas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead className="min-w-[200px]">Ocupação de Vagas</TableHead>
                <TableHead>Reserva</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendas.map((agenda) => {
                const percentualOcupacao = getOcupacaoPercentual(agenda.vagas_ocupadas, agenda.vagas_disponiveis);
                const statusOcupacao = getStatusOcupacao(percentualOcupacao, agenda.vagas_ocupadas, agenda.vagas_disponiveis);
                
                return (
                  <TableRow key={agenda.id}>
                    <TableCell>
                      {formatarDataSimples(agenda.data_agenda)}
                    </TableCell>
                    <TableCell>{agenda.regiao.cidade.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {agenda.regiao.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {agenda.turno.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {/* Barra de progresso */}
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={percentualOcupacao} 
                            className="flex-1 h-2"
                          />
                          <span className="text-xs font-medium min-w-[35px]">
                            {percentualOcupacao}%
                          </span>
                        </div>
                        
                        {/* Detalhes textuais mais claros */}
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Ocupadas:</span>
                            <span className="font-medium text-blue-600">{agenda.vagas_ocupadas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Disponíveis:</span>
                            <span className="font-medium text-green-600">{agenda.vagas_disponiveis}</span>
                          </div>
                          <div className="flex justify-center">
                            <Badge variant={getOcupacaoVariant(percentualOcupacao)} className="text-xs">
                              {statusOcupacao}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        agenda.permite_reserva 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agenda.permite_reserva ? 'Sim' : 'Não'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetalhes(agenda)}
                          title="Ver detalhes dos entregadores"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditAgenda(agenda)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancelAgenda(agenda.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
