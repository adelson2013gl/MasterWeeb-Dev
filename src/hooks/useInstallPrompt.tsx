
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      // PWA instalado se estiver em modo standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Ou se for um WebAPK no Android
      const isWebAPK = 'standalone' in navigator || (navigator as any).standalone;
      setIsInstalled(isStandalone || isWebAPK);
    };

    checkIfInstalled();

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne o prompt automático do browser
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
      console.log('PWA pode ser instalado');
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      console.log('PWA foi instalado');
      setShowInstallButton(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      
      // Toast de boas-vindas
      setTimeout(() => {
        toast.success('🎉 App instalado com sucesso!', {
          description: 'Agora você pode usar o DeliveryScale offline e ter acesso rápido pela tela inicial.',
          duration: 5000,
        });
      }, 1000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Fallback: Se o evento beforeinstallprompt não disparar em 3 segundos
    // e não estiver instalado, mostrar o botão mesmo assim (principalmente para iOS)
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        // Verificar se é um dispositivo que suporta PWA
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSupportedBrowser = 'serviceWorker' in navigator;
        
        if (isIOSDevice || isSupportedBrowser) {
          setShowInstallButton(true);
          console.log('Fallback: Mostrando botão de instalação');
        }
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback para iOS - sempre mostrar instruções
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        toast.info('📱 Para instalar no iOS:', {
          description: '1. Toque em ⬆️ Compartilhar\n2. Selecione "Adicionar à Tela Inicial"\n3. Toque em "Adicionar"',
          duration: 8000,
        });
        return;
      }
      
      // Fallback para outros browsers - mostrar instruções genéricas
      toast.info('💡 Como instalar o app:', {
        description: 'Use o menu do seu navegador e procure por "Instalar app" ou "Adicionar à tela inicial"',
        duration: 6000,
      });
      return;
    }

    try {
      // Mostrar o prompt de instalação
      await deferredPrompt.prompt();
      
      // Aguardar a escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`Usuário ${outcome} a instalação`);
      
      if (outcome === 'accepted') {
        setShowInstallButton(false);
        setIsInstalled(true);
        
        // Toast de instalação aceita
        toast.success('🚀 Instalando app...', {
          description: 'Em alguns segundos você verá o DeliveryScale na sua tela inicial!',
          duration: 3000,
        });
      } else {
        // Toast quando usuário recusa
        toast.info('📱 Instalação cancelada', {
          description: 'Você pode instalar o app a qualquer momento clicando no botão de instalação.',
          duration: 3000,
        });
      }
      
      // Limpar o prompt (só pode ser usado uma vez)
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Erro ao mostrar prompt de instalação:', error);
      
      // Toast de erro
      toast.error('❌ Erro na instalação', {
        description: 'Houve um problema ao instalar o app. Tente novamente.',
        duration: 4000,
      });
    }
  };

  const isIOSDevice = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const canInstall = () => {
    // Sempre mostrar no iOS se não estiver instalado
    if (isIOSDevice() && !isInstalled) {
      return true;
    }
    
    // Mostrar se tiver o prompt ou se o fallback foi ativado
    return !isInstalled && (showInstallButton || Boolean(deferredPrompt));
  };

  return {
    canInstall: canInstall(),
    isInstalled,
    isIOSDevice: isIOSDevice(),
    showInstallButton: showInstallButton || (isIOSDevice() && !isInstalled),
    handleInstall
  };
};

export default useInstallPrompt;
