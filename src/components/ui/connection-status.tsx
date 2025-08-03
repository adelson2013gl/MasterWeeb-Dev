import * as React from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ConnectionStatusProps {
  className?: string;
  showToasts?: boolean;
}

export function ConnectionStatus({
  className,
  showToasts = true,
}: ConnectionStatusProps) {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { toast } = useToast();
  const [showIndicator, setShowIndicator] = React.useState(false);

  // Mostrar o indicador quando o status mudar ou quando wasOffline for true
  React.useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
      if (showToasts) {
        toast({
          title: "Você está offline",
          description: "Algumas funcionalidades podem estar indisponíveis",
          variant: "destructive",
          duration: 5000,
        });
      }
    } else if (wasOffline) {
      setShowIndicator(true);
      if (showToasts) {
        toast({
          title: "Conexão restabelecida",
          description: "Seus dados serão sincronizados automaticamente",
          variant: "default",
          duration: 3000,
        });
      }

      // Esconder o indicador após 5 segundos quando estiver online novamente
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, showToasts, toast]);

  if (!showIndicator) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-lg",
          isOnline
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          className
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Offline</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}