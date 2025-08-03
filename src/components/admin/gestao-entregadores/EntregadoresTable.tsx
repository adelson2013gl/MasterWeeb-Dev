import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Check, X, Star, Phone, Mail, MapPin, RotateCcw, Pencil } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Entregador } from "./types";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EntregadoresTableProps {
  entregadores: Entregador[];
  onStatusChange: (id: string, status: "aprovado" | "rejeitado") => void;
  onReativar: (id: string) => void;
  onEdit: (entregador: Entregador) => void;
}

export function EntregadoresTable({ 
  entregadores, 
  onStatusChange, 
  onReativar, 
  onEdit
}: EntregadoresTableProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: 'aprovar' | 'rejeitar' | 'reativar' | null;
    entregador: Entregador | null;
  }>({ type: null, entregador: null });

  const handleConfirmAction = () => {
    if (!confirmAction.entregador) return;
    
    switch (confirmAction.type) {
      case 'aprovar':
        onStatusChange(confirmAction.entregador.id, 'aprovado');
        break;
      case 'rejeitar':
        onStatusChange(confirmAction.entregador.id, 'rejeitado');
        break;
      case 'reativar':
        onReativar(confirmAction.entregador.id);
        break;
    }
    
    setConfirmAction({ type: null, entregador: null });
  };

  const getActionTitle = () => {
    switch (confirmAction.type) {
      case 'aprovar':
        return 'Aprovar Entregador';
      case 'rejeitar':
        return 'Rejeitar Entregador';
      case 'reativar':
        return 'Reativar Entregador';
      default:
        return '';
    }
  };

  const getActionDescription = () => {
    if (!confirmAction.entregador) return '';
    
    switch (confirmAction.type) {
      case 'aprovar':
        return `Tem certeza que deseja aprovar o entregador ${confirmAction.entregador.nome}?`;
      case 'rejeitar':
        return `Tem certeza que deseja rejeitar o entregador ${confirmAction.entregador.nome}?`;
      case 'reativar':
        return `Tem certeza que deseja reativar o entregador ${confirmAction.entregador.nome}?`;
      default:
        return '';
    }
  };

  const getEstrelasDisplay = (estrelas: number | null | undefined) => {
    // Validação adequada: retorna indicador visual para dados nulos
    if (estrelas === null || estrelas === undefined) {
      return [
        <Star key="null" className="h-3 w-3 text-gray-300" />,
        <span key="text" className="text-xs text-gray-500 ml-1">N/A</span>
      ];
    }
    
    const estrelasArray = [];
    for (let i = 1; i <= 5; i++) {
      estrelasArray.push(
        <Star 
          key={i} 
          className={`h-3 w-3 ${i <= estrelas ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    return estrelasArray;
  };

  if (entregadores.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-gray-600">Nenhum entregador encontrado</p>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={confirmAction.type !== null} onOpenChange={(open) => {
        if (!open) setConfirmAction({ type: null, entregador: null });
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getActionTitle()}</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Entregador</TableHead>
                <TableHead className="min-w-[150px] hidden md:table-cell">Contato</TableHead>
                <TableHead className="min-w-[120px] hidden lg:table-cell">Localização</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[100px] hidden sm:table-cell">Avaliação</TableHead>
                <TableHead className="min-w-[120px] hidden xl:table-cell">Data Cadastro</TableHead>
                <TableHead className="min-w-[150px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entregadores.map((entregador) => (
                <TableRow key={entregador.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold">{entregador.nome}</span>
                      <span className="text-sm text-gray-500 md:hidden">{entregador.email}</span>
                      <span className="text-sm text-gray-500 md:hidden">{entregador.telefone}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="h-3 w-3" />
                        <span>{entregador.telefone}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{entregador.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center space-x-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">
                        {entregador.cidade ? `${entregador.cidade.nome} - ${entregador.cidade.estado}` : 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <StatusBadge status={entregador.status} />
                  </TableCell>
                  
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center">
                        {getEstrelasDisplay(entregador.estrelas)}
                      </div>
                      <span className="text-sm font-medium">{entregador.estrelas || 'N/A'}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm hidden xl:table-cell">
                    {new Date(entregador.data_cadastro).toLocaleDateString('pt-BR')}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Editar clicado', entregador);
                            onEdit(entregador);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Aprovar clicado', entregador.id);
                            setConfirmAction({ type: 'aprovar', entregador });
                          }}
                          disabled={entregador.status === 'aprovado'}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Rejeitar clicado', entregador.id);
                            setConfirmAction({ type: 'rejeitar', entregador });
                          }}
                          disabled={entregador.status === 'rejeitado'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Reativar clicado', entregador.id);
                            setConfirmAction({ type: 'reativar', entregador });
                          }}
                          disabled={entregador.status !== 'rejeitado'}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      {entregador.status === "suspenso" && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            console.log('Reativar clicado', entregador.id);
                            setConfirmAction({ type: 'reativar', entregador });
                          }}
                          className="bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}