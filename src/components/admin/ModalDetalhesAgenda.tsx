
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Users, Phone, Mail, Calendar, MessageSquare, X } from "lucide-react";
import { useAgendaDetalhes } from "@/hooks/useAgendaDetalhes";
import { parseLocalDate, formatarTimestamp } from "@/lib/utils";

interface Agenda {
  id: string;
  data_agenda: string;
  turnos: {
    nome: string;
    hora_inicio: string;
    hora_fim: string;
  };
  regioes: {
    nome: string;
    cidades: {
      nome: string;
    };
  };
  vagas_disponiveis: number;
  vagas_ocupadas: number;
}

interface ModalDetalhesAgendaProps {
  agenda: Agenda | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModalDetalhesAgenda({ agenda, isOpen, onClose }: ModalDetalhesAgendaProps) {
  const { entregadores, loading, buscarEntregadoresAgenda, cancelarAgendamento } = useAgendaDetalhes();

  React.useEffect(() => {
    if (isOpen && agenda) {
      buscarEntregadoresAgenda(agenda.id);
    }
  }, [isOpen, agenda?.id]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'default';
      case 'cancelado':
        return 'destructive';
      case 'concluido':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleCancelarAgendamento = async (agendamentoId: string, agendaId: string) => {
    const sucesso = await cancelarAgendamento(agendamentoId);
    if (sucesso) {
      // Recarregar a lista de entregadores
      await buscarEntregadoresAgenda(agendaId);
    }
  };

  if (!agenda) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Detalhes da Agenda - {agenda.regioes.cidades.nome}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações da Agenda */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Data e Turno</h4>
                <p className="text-sm text-gray-600">
                  {parseLocalDate(agenda.data_agenda).toLocaleDateString('pt-BR')} - {agenda.turnos.nome}
                </p>
                <p className="text-xs text-gray-500">
                  {agenda.turnos.hora_inicio} às {agenda.turnos.hora_fim}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Região</h4>
                <p className="text-sm text-gray-600">
                  {agenda.regioes.nome} - {agenda.regioes.cidades.nome}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Ocupação</h4>
                <p className="text-sm text-gray-600">
                  {agenda.vagas_ocupadas}/{agenda.vagas_disponiveis} vagas
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Entregadores */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Entregadores Agendados ({entregadores.length})
            </h4>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Carregando entregadores...</span>
              </div>
            ) : entregadores.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entregador</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Agendado em</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entregadores.map((entregador) => (
                    <TableRow key={entregador.id}>
                      <TableCell className="font-medium">
                        {entregador.nome}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {entregador.telefone}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            {entregador.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(entregador.status)}>
                          {entregador.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatarTimestamp(entregador.data_agendamento)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entregador.observacoes ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MessageSquare className="h-3 w-3" />
                            <span className="max-w-xs truncate" title={entregador.observacoes}>
                              {entregador.observacoes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entregador.status === 'agendado' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <X className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja cancelar o agendamento de {entregador.nome}? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancelarAgendamento(entregador.id, agenda.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Sim, cancelar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum entregador agendado</p>
                <p className="text-sm text-gray-500">Esta agenda ainda não possui agendamentos</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
