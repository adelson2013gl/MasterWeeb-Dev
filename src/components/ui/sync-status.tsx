import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { syncService } from "@/lib/syncService";
import { Button } from "@/components/ui/button";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SyncStatus() {
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Verificar dados pendentes de sincronização
  const checkPendingData = async () => {
    const count = await syncService.getPendingSyncCount();
    setPendingCount(count);
  };

  // Sincronizar dados manualmente
  const handleSync = async () => {
    if (!isOnline) {
      toast.error("Você está offline. Conecte-se à internet para sincronizar.");
      return;
    }

    setIsSyncing(true);
    try {
      const success = await syncService.syncData();
      if (success) {
        toast.success("Sincronização concluída com sucesso!");
        await checkPendingData();
      } else {
        toast.error("Erro ao sincronizar dados. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro durante sincronização:", error);
      toast.error("Erro ao sincronizar dados. Tente novamente.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Verificar dados pendentes ao montar o componente e quando o status online mudar
  useEffect(() => {
    checkPendingData();

    // Verificar periodicamente
    const interval = setInterval(checkPendingData, 30000);

    // Verificar quando o usuário ficar online
    if (isOnline) {
      checkPendingData();
    }

    return () => clearInterval(interval);
  }, [isOnline]);

  // Se não houver dados pendentes, não mostrar nada
  if (pendingCount === 0 && isOnline) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Cloud className="h-4 w-4 text-green-500" />
              ) : (
                <CloudOff className="h-4 w-4 text-amber-500" />
              )}
              
              {pendingCount > 0 && (
                <Badge variant="outline" className="px-2 py-0 h-5">
                  {pendingCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline 
              ? `${pendingCount} item(s) aguardando sincronização` 
              : "Você está offline. Os dados serão sincronizados quando a conexão for restabelecida."}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {pendingCount > 0 && isOnline && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}