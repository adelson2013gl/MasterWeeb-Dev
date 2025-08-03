
import { useState, useEffect } from 'react';
import { useInstallPrompt } from './useInstallPrompt';

interface PWABannerState {
  showBanner: boolean;
  visitCount: number;
  lastDismissed: number | null;
  neverShow: boolean;
}

const STORAGE_KEY = 'pwa-banner-state';
const BANNER_COOLDOWN = 24 * 60 * 60 * 1000; // 24 horas

export const usePWABanner = () => {
  const { canInstall, isInstalled } = useInstallPrompt();
  const [bannerState, setBannerState] = useState<PWABannerState>({
    showBanner: false,
    visitCount: 0,
    lastDismissed: null,
    neverShow: false
  });

  // Verificar se é dispositivo mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  };

  // Carregar estado do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        setBannerState(state);
      }
    } catch (error) {
      console.log('Erro ao carregar estado do banner PWA:', error);
    }
  }, []);

  // Incrementar contador de visitas e decidir se mostra banner
  useEffect(() => {
    if (!isMobile() || isInstalled || !canInstall || bannerState.neverShow) {
      return;
    }

    const now = Date.now();
    
    // Verificar cooldown se foi dispensado recentemente
    if (bannerState.lastDismissed && now - bannerState.lastDismissed < BANNER_COOLDOWN) {
      return;
    }

    // Incrementar visitas
    const newVisitCount = bannerState.visitCount + 1;
    
    // Lógica de quando mostrar o banner baseado nas visitas
    let shouldShow = false;
    
    if (newVisitCount === 1) {
      // Primeira visita: mostrar após 10 segundos
      setTimeout(() => {
        setBannerState(prev => ({ ...prev, showBanner: true }));
      }, 10000);
    } else if (newVisitCount === 3) {
      // Terceira visita: mostrar imediatamente
      shouldShow = true;
    } else if (newVisitCount >= 5 && newVisitCount % 3 === 0) {
      // A partir da quinta visita: mostrar a cada 3 visitas
      shouldShow = true;
    }

    const newState = {
      ...bannerState,
      visitCount: newVisitCount,
      showBanner: shouldShow
    };

    setBannerState(newState);
    
    // Salvar no localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.log('Erro ao salvar estado do banner PWA:', error);
    }
  }, [canInstall, isInstalled, bannerState.neverShow, bannerState.lastDismissed]);

  const dismissBanner = (type: 'later' | 'never') => {
    const now = Date.now();
    const newState = {
      ...bannerState,
      showBanner: false,
      lastDismissed: type === 'later' ? now : null,
      neverShow: type === 'never'
    };
    
    setBannerState(newState);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.log('Erro ao salvar estado do banner PWA:', error);
    }
  };

  const resetBannerState = () => {
    setBannerState({
      showBanner: false,
      visitCount: 0,
      lastDismissed: null,
      neverShow: false
    });
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.log('Erro ao limpar estado do banner PWA:', error);
    }
  };

  return {
    showBanner: bannerState.showBanner && isMobile() && canInstall && !isInstalled,
    visitCount: bannerState.visitCount,
    dismissBanner,
    resetBannerState
  };
};
