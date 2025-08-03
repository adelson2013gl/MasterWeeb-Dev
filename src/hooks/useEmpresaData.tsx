/**
 * Hook para gerenciar dados da empresa
 * Extraído do EmpresaUnificadoContext para melhorar modularidade
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

type Empresa = Database['public']['Tables']['empresas']['Row'];

interface EmpresaDataState {
  empresa: Empresa | null;
  loading: boolean;
  error: string | null;
}

export function useEmpresaData() {
  const [state, setState] = useState<EmpresaDataState>({
    empresa: null,
    loading: false,
    error: null
  });

  // Buscar empresa por ID
  const fetchEmpresa = useCallback(async (empresaId: string): Promise<Empresa | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('Buscando dados da empresa', { empresaId });

      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (empresaError) {
        logger.error('Erro ao buscar empresa', { 
          error: empresaError.message, 
          empresaId 
        });
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: `Erro ao carregar empresa: ${empresaError.message}` 
        }));
        return null;
      }

      // Type safety para campos enum
      const empresaTyped: Empresa = {
        ...empresaData,
        plano: empresaData.plano as 'basico' | 'pro' | 'enterprise',
        status: empresaData.status as 'ativo' | 'suspenso' | 'cancelado'
      };

      setState(prev => ({ 
        ...prev, 
        empresa: empresaTyped, 
        loading: false 
      }));

      logger.success('Empresa carregada com sucesso', { 
        nome: empresaTyped.nome,
        empresaId 
      });

      return empresaTyped;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro inesperado ao buscar empresa', { error: errorMessage });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return null;
    }
  }, []);

  // Buscar empresa com fallback
  const fetchEmpresaWithFallback = useCallback(async (
    primaryEmpresaId: string, 
    fallbackEmpresaId: string
  ): Promise<Empresa | null> => {
    // Tentar empresa principal primeiro
    let empresa = await fetchEmpresa(primaryEmpresaId);

    // Se falhar, tentar fallback
    if (!empresa && primaryEmpresaId !== fallbackEmpresaId) {
      logger.warn('Empresa principal não encontrada, tentando fallback', {
        primaryEmpresaId,
        fallbackEmpresaId
      });
      
      empresa = await fetchEmpresa(fallbackEmpresaId);
      
      if (empresa) {
        logger.info('Empresa fallback carregada com sucesso');
      }
    }

    return empresa;
  }, [fetchEmpresa]);

  // Criar nova empresa
  const criarEmpresa = useCallback(async (dadosEmpresa: Partial<Empresa>): Promise<{ 
    success: boolean; 
    empresaId?: string; 
    error?: string 
  }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('Criando nova empresa', { nome: dadosEmpresa.nome });

      const { data, error } = await supabase
        .from('empresas')
        .insert([dadosEmpresa])
        .select()
        .single();

      if (error) {
        logger.error('Erro ao criar empresa', { error: error.message });
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return { success: false, error: error.message };
      }

      setState(prev => ({ 
        ...prev, 
        empresa: data, 
        loading: false 
      }));

      logger.success('Empresa criada com sucesso', { 
        empresaId: data.id, 
        nome: data.nome 
      });

      toast.success('Empresa criada com sucesso!');
      return { success: true, empresaId: data.id };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro inesperado ao criar empresa', { error: errorMessage });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      toast.error('Erro ao criar empresa');
      return { success: false, error: errorMessage };
    }
  }, []);

  // Atualizar empresa
  const atualizarEmpresa = useCallback(async (
    empresaId: string, 
    dados: Partial<Empresa>
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('Atualizando empresa', { empresaId, dados });

      const { error } = await supabase
        .from('empresas')
        .update(dados)
        .eq('id', empresaId);

      if (error) {
        logger.error('Erro ao atualizar empresa', { 
          error: error.message, 
          empresaId 
        });
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        
        toast.error('Erro ao atualizar empresa');
        return false;
      }

      // Atualizar estado local se esta empresa está carregada
      if (state.empresa?.id === empresaId) {
        setState(prev => ({ 
          ...prev, 
          empresa: prev.empresa ? { ...prev.empresa, ...dados } : null, 
          loading: false 
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }

      logger.success('Empresa atualizada com sucesso', { empresaId });
      toast.success('Empresa atualizada com sucesso!');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro inesperado ao atualizar empresa', { error: errorMessage });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      toast.error('Erro ao atualizar empresa');
      return false;
    }
  }, [state.empresa?.id]);

  // Resetar estado
  const reset = useCallback(() => {
    setState({
      empresa: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    empresa: state.empresa,
    loading: state.loading,
    error: state.error,
    fetchEmpresa,
    fetchEmpresaWithFallback,
    criarEmpresa,
    atualizarEmpresa,
    reset
  };
}