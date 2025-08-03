
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Edit, Check, X, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { StatusBadge } from "./StatusBadge";
import { Database } from '@/types/database';
import { Entregador } from './types';

interface EntregadorCardProps {
  entregador: Entregador;
  onStatusChange: (id: string, status: "aprovado" | "rejeitado") => void;
  onReativar: (id: string) => void;
  onEdit: (entregador: Entregador) => void;
}

export function EntregadorCard({ 
  entregador, 
  onStatusChange, 
  onReativar, 
  onEdit 
}: EntregadorCardProps) {
  const isMobile = useIsMobile();

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

  const getCorEstrela = (estrelas: number | null | undefined) => {
    // Validação adequada: cor padrão para dados nulos
    if (estrelas === null || estrelas === undefined) {
      return 'bg-gray-100 text-gray-800';
    }
    
    const cores = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-green-100 text-green-800'
    };
    return cores[estrelas as keyof typeof cores] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card key={entregador.id} className="mb-4">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{entregador.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={entregador.status} />
                <Badge className={getCorEstrela(entregador.estrelas)}>
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {getEstrelasDisplay(entregador.estrelas)}
                </div>
                <span className="text-xs font-medium">{entregador.estrelas || 'N/A'}</span>
                  </div>
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-all">{entregador.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>{entregador.telefone}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>
                  {entregador.cidade ? `${entregador.cidade.nome} - ${entregador.cidade.estado}` : 'Cidade não encontrada'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Cadastrado em: {new Date(entregador.data_cadastro).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
            <Button 
              size={isMobile ? "sm" : "default"}
              variant="outline"
              onClick={() => onEdit(entregador)}
              className="w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            
            {entregador.status === "pendente" && (
              <>
                <Button 
                  size={isMobile ? "sm" : "default"}
                  onClick={() => onStatusChange(entregador.id, "aprovado")}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
                <Button 
                  size={isMobile ? "sm" : "default"}
                  variant="destructive"
                  onClick={() => onStatusChange(entregador.id, "rejeitado")}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </>
            )}

            {entregador.status === "suspenso" && (
              <Button 
                size={isMobile ? "sm" : "default"}
                onClick={() => onReativar(entregador.id)}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Check className="h-4 w-4 mr-1" />
                Reativar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
