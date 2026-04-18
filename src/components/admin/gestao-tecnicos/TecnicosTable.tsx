import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Check, X, Star, Phone, Mail, MapPin, RotateCcw, Pencil } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Tecnico } from "./types";
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

interface TecnicosTableProps {
  tecnicos: Tecnico[];
  onStatusChange: (id: string, status: "aprovado" | "rejeitado") => void;
  onReativar: (id: string) => void;
  onEdit: (tecnico: Tecnico) => void;
}

export function TecnicosTable({ 
  tecnicos, 
  onStatusChange, 
  onReativar, 
  onEdit
}: TecnicosTableProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: 'aprovar' | 'rejeitar' | 'reativar' | null;
    tecnico: Tecnico | null;
  }>({ type: null, tecnico: null });

  const handleConfirmAction = () => {
    if (!confirmAction.tecnico) return;
    
    switch (confirmAction.type) {
      case 'aprovar':
        onStatusChange(confirmAction.tecnico.id, 'aprovado');
        break;
      case 'rejeitar':
        onStatusChange(confirmAction.tecnico.id, 'rejeitado');
        break;
      case 'reativar':
        onReativar(confirmAction.tecnico.id);
        break;
    }
    
    setConfirmAction({ type: null, tecnico: null });
  };

  const getActionTitle = () => {
    switch (confirmAction.type) {
      case 'aprovar':
        return 'Aprovar Tecnico';
      case 'rejeitar':
        return 'Rejeitar Tecnico';
      case 'reativar':
        return 'Reativar Tecnico';
      default:
        return '';
    }
  };

  const getActionDescription = () => {
    if (!confirmAction.tecnico) return '';
    
    switch (confirmAction.type) {
      case 'aprovar':
        return `Tem certeza que deseja aprovar o tecnico ${confirmAction.tecnico.nome}?`;
      case 'rejeitar':
        return `Tem certeza que deseja rejeitar o tecnico ${confirmAction.tecnico.nome}?`;
      case 'reativar':
        return `Tem certeza que deseja reativar o tecnico ${confirmAction.tecnico.nome}?`;
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

  if (tecnicos.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-gray-600">Nenhum tecnico encontrado</p>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={confirmAction.type !== null} onOpenChange={(open) => {
        if (!open) setConfirmAction({ type: null, tecnico: null });
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
                <TableHead className="min-w-[200px]">Tecnico</TableHead>
                <TableHead className="min-w-[150px] hidden md:table-cell">Contato</TableHead>
                <TableHead className="min-w-[120px] hidden lg:table-cell">Localização</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[100px] hidden sm:table-cell">Avaliação</TableHead>
                <TableHead className="min-w-[120px] hidden xl:table-cell">Data Cadastro</TableHead>
                <TableHead className="min-w-[150px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tecnicos.map((tecnico) => (
                <TableRow key={tecnico.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold">{tecnico.nome}</span>
                      <span className="text-sm text-gray-500 md:hidden">{tecnico.email}</span>
                      <span className="text-sm text-gray-500 md:hidden">{tecnico.telefone}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="h-3 w-3" />
                        <span>{tecnico.telefone}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{tecnico.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center space-x-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">
                        {tecnico.cidade ? `${tecnico.cidade.nome} - ${tecnico.cidade.estado}` : 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <StatusBadge status={tecnico.status} />
                  </TableCell>
                  
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center">
                        {getEstrelasDisplay(tecnico.estrelas)}
                      </div>
                      <span className="text-sm font-medium">{tecnico.estrelas || 'N/A'}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm hidden xl:table-cell">
                    {new Date(tecnico.data_cadastro).toLocaleDateString('pt-BR')}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Editar clicado', tecnico);
                            onEdit(tecnico);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Aprovar clicado', tecnico.id);
                            setConfirmAction({ type: 'aprovar', tecnico });
                          }}
                          disabled={tecnico.status === 'aprovado'}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Rejeitar clicado', tecnico.id);
                            setConfirmAction({ type: 'rejeitar', tecnico });
                          }}
                          disabled={tecnico.status === 'rejeitado'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Reativar clicado', tecnico.id);
                            setConfirmAction({ type: 'reativar', tecnico });
                          }}
                          disabled={tecnico.status !== 'rejeitado'}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      {tecnico.status === "suspenso" && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            console.log('Reativar clicado', tecnico.id);
                            setConfirmAction({ type: 'reativar', tecnico });
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