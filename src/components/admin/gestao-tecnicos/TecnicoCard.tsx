
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Edit, Check, X, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { StatusBadge } from "./StatusBadge";
import { Database } from '@/types/database';
import { Tecnico } from './types';

interface TecnicoCardProps {
  tecnico: Tecnico;
  onStatusChange: (id: string, status: "aprovado" | "rejeitado") => void;
  onReativar: (id: string) => void;
  onEdit: (tecnico: Tecnico) => void;
}

export function TecnicoCard({ 
  tecnico, 
  onStatusChange, 
  onReativar, 
  onEdit 
}: TecnicoCardProps) {
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
    <Card key={tecnico.id} className="mb-4">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{tecnico.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={tecnico.status} />
                <Badge className={getCorEstrela(tecnico.estrelas)}>
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {getEstrelasDisplay(tecnico.estrelas)}
                </div>
                <span className="text-xs font-medium">{tecnico.estrelas || 'N/A'}</span>
                  </div>
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-all">{tecnico.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>{tecnico.telefone}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>
                  {tecnico.cidade ? `${tecnico.cidade.nome} - ${tecnico.cidade.estado}` : 'Cidade não encontrada'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Cadastrado em: {new Date(tecnico.data_cadastro).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
            <Button 
              size={isMobile ? "sm" : "default"}
              variant="outline"
              onClick={() => onEdit(tecnico)}
              className="w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            
            {tecnico.status === "pendente" && (
              <>
                <Button 
                  size={isMobile ? "sm" : "default"}
                  onClick={() => onStatusChange(tecnico.id, "aprovado")}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
                <Button 
                  size={isMobile ? "sm" : "default"}
                  variant="destructive"
                  onClick={() => onStatusChange(tecnico.id, "rejeitado")}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </>
            )}

            {tecnico.status === "suspenso" && (
              <Button 
                size={isMobile ? "sm" : "default"}
                onClick={() => onReativar(tecnico.id)}
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
