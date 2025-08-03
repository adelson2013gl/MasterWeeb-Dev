
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, User, UserX } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EntregadoresTable } from "./EntregadoresTable";
import { Database } from '@/types/database';
import { Entregador } from './types';

interface EntregadorTabsProps {
  entregadoresPorStatus: {
    pendente: Entregador[];
    aprovado: Entregador[];
    rejeitado: Entregador[];
    suspenso: Entregador[];
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
  onStatusChange: (id: string, status: "aprovado" | "rejeitado") => void;
  onReativar: (id: string) => void;
  onEdit: (entregador: Entregador) => void;
}

export function EntregadorTabs({ 
  entregadoresPorStatus, 
  activeTab,
  onTabChange,
  onStatusChange, 
  onReativar, 
  onEdit 
}: EntregadorTabsProps) {
  const isMobile = useIsMobile();

  const renderTabContent = (
    entregadores: Entregador[],
    title: string,
    description: string,
    icon: React.ReactNode
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base sm:text-lg">
          {icon}
          {title} ({entregadores.length})
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <EntregadoresTable
          entregadores={entregadores}
          onStatusChange={onStatusChange}
          onReativar={onReativar}
          onEdit={onEdit}
        />
      </CardContent>
    </Card>
  );

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className={`grid w-full grid-cols-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>
        <TabsTrigger value="pendente" className="relative">
          <span className={isMobile ? "text-xs" : "text-sm"}>Pendentes</span>
          {entregadoresPorStatus.pendente.length > 0 && (
            <Badge variant="destructive" className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-xs">
              {entregadoresPorStatus.pendente.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="aprovado" className={isMobile ? "text-xs" : "text-sm"}>
          Aprovados ({entregadoresPorStatus.aprovado.length})
        </TabsTrigger>
        <TabsTrigger value="rejeitado" className={isMobile ? "text-xs" : "text-sm"}>
          Rejeitados ({entregadoresPorStatus.rejeitado.length})
        </TabsTrigger>
        <TabsTrigger value="suspenso" className={isMobile ? "text-xs" : "text-sm"}>
          Suspensos ({entregadoresPorStatus.suspenso.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pendente" className="space-y-4">
        {renderTabContent(
          entregadoresPorStatus.pendente,
          "Entregadores Pendentes",
          "Novos cadastros aguardando aprovação",
          <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
        )}
      </TabsContent>

      <TabsContent value="aprovado" className="space-y-4">
        {renderTabContent(
          entregadoresPorStatus.aprovado,
          "Entregadores Aprovados",
          "Entregadores ativos no sistema",
          <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
        )}
      </TabsContent>

      <TabsContent value="rejeitado" className="space-y-4">
        {renderTabContent(
          entregadoresPorStatus.rejeitado,
          "Entregadores Rejeitados",
          "Cadastros que foram rejeitados",
          <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600" />
        )}
      </TabsContent>

      <TabsContent value="suspenso" className="space-y-4">
        {renderTabContent(
          entregadoresPorStatus.suspenso,
          "Entregadores Suspensos",
          "Entregadores temporariamente suspensos",
          <UserX className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600" />
        )}
      </TabsContent>
    </Tabs>
  );
}
