
import { useState, useRef } from "react";
import { ConfiguracoesSistema, configuracoesPadrao } from "@/types/configuracoes";

export function useConfiguracoesCore() {
  const [configs, setConfigs] = useState<ConfiguracoesSistema>(configuracoesPadrao);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const hasInitializedRef = useRef(false);
  const isLoadingRef = useRef(false);

  return {
    configs,
    setConfigs,
    loading,
    setLoading,
    hasError,
    setHasError,
    isLoadingData,
    setIsLoadingData,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSaving,
    setIsSaving,
    hasInitializedRef,
    isLoadingRef
  };
}
