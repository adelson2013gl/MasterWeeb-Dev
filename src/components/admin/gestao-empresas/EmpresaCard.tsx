
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { CredenciaisAdminModal } from "./CredenciaisAdminModal";
import { Empresa } from "./types";

interface EmpresaCardProps {
  empresa: Empresa;
  onEdit: (empresa: Empresa) => void;
  onAlterarStatus: (id: string, ativa: boolean) => void;
}

export function EmpresaCard({ empresa, onEdit, onAlterarStatus }: EmpresaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{empresa.nome}</span>
          <Badge variant={empresa.ativa ? 'default' : 'secondary'}>
            {empresa.ativa ? 'Ativa' : 'Inativa'}
          </Badge>
        </CardTitle>
        <CardDescription>
          {empresa.cnpj && `CNPJ: ${empresa.cnpj}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Plano:</span>
            <span className="capitalize">{empresa.plano_atual || 'Não definido'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Max. Entregadores:</span>
            <span>{empresa.max_entregadores}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Max. Agendas/Mês:</span>
            <span>{empresa.max_agendas_mes}</span>
          </div>
          {empresa.data_expiracao && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Expiração:</span>
              <span>{new Date(empresa.data_expiracao).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-4 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(empresa)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <CredenciaisAdminModal 
            empresa={empresa}
          />
          <Button
            variant={empresa.ativa ? 'destructive' : 'default'}
            size="sm"
            onClick={() => onAlterarStatus(empresa.id, !empresa.ativa)}
          >
            {empresa.ativa ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
