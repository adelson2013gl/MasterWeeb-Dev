import { useState, useEffect } from 'react';

interface OnlineStatusResult {
  isOnline: boolean;
  wasOffline: boolean; // Indica se o usuário esteve offline durante a sessão
  lastOnlineChange: Date | null;
}

/**
 * Hook para monitorar o status de conexão do usuário
 * @returns Objeto com status de conexão e informações relacionadas
 */
export function useOnlineStatus(): OnlineStatusResult {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastOnlineChange, setLastOnlineChange] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineChange(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setLastOnlineChange(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status inicial
    if (!navigator.onLine) {
      setWasOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline, lastOnlineChange };
}