
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Zap, Wifi } from 'lucide-react';
import { Button } from './ui/button';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { usePWABanner } from '../hooks/usePWABanner';

export const PWAInstallBanner = () => {
  const { handleInstall, isIOSDevice } = useInstallPrompt();
  const { showBanner, visitCount, dismissBanner } = usePWABanner();
  const [isAnimating, setIsAnimating] = useState(false);

  if (!showBanner) return null;

  const handleInstallClick = async () => {
    setIsAnimating(true);
    try {
      await handleInstall();
      dismissBanner('never'); // Se instalou, não mostrar mais
    } finally {
      setIsAnimating(false);
    }
  };

  const handleDismiss = (type: 'later' | 'never') => {
    dismissBanner(type);
  };

  // Diferentes mensagens baseadas no número de visitas
  const getMessage = () => {
    if (visitCount === 1) {
      return {
        title: "📱 Instale o DeliveryScale!",
        subtitle: "Acesso rápido direto da sua tela inicial"
      };
    } else if (visitCount === 3) {
      return {
        title: "⚡ Que tal instalar o app?",
        subtitle: "Você já nos visitou 3 vezes! Tenha acesso offline."
      };
    } else {
      return {
        title: "🚀 Instale para melhor experiência!",
        subtitle: "App rápido, offline e sempre à mão"
      };
    }
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="glass-card border-glass shadow-2xl rounded-xl overflow-hidden">
          {/* Header com close button */}
          <div className="flex items-center justify-between p-3 pb-2">
            <div className="flex items-center space-x-2">
              <motion.div 
                className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                {isIOSDevice ? (
                  <Smartphone className="h-4 w-4 text-white" />
                ) : (
                  <Download className="h-4 w-4 text-white" />
                )}
              </motion.div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {message.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {message.subtitle}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss('later')}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="px-3 pb-3">
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3 text-blue-500" />
                <span>Rápido</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wifi className="h-3 w-3 text-green-500" />
                <span>Offline</span>
              </div>
              <div className="flex items-center space-x-1">
                <Smartphone className="h-3 w-3 text-purple-500" />
                <span>Nativo</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={handleInstallClick}
                disabled={isAnimating}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm h-9"
              >
                {isAnimating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    {isIOSDevice ? (
                      <Smartphone className="h-4 w-4 mr-1" />
                    ) : (
                      <Download className="h-4 w-4 mr-1" />
                    )}
                    Instalar
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleDismiss('never')}
                className="text-xs px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Não mostrar
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
