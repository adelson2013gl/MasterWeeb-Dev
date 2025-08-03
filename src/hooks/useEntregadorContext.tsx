/**
 * Hook para gerenciar dados do entregador
 * Extraído do EmpresaUnificadoContext para melhorar modularidade
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { Entregador } from '@/components/admin/gestao-entregadores/types';

interface EntregadorState {
  entregador: Entregador | null;
  loading: boolean;
  error: string | null;
}

export function useEntregadorContext() {
  const [state, setState] = useState<EntregadorState>({
    entregador: null,
    loading: false,
    error: null
  });

  // Buscar dados do entregador por user_id
  const fetchEntregador = useCallback(async (userId: string): Promise<Entregador | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('Buscando dados do entregador', { userId });

      const { data: entregadorData, error: entregadorError } = await supabase
        .from('entregadores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (entregadorError) {
        // Tratar especificamente erro de RLS (permissões)
        if (entregadorError.code === '42501') {
          logger.warn('Erro de permissão RLS ao buscar entregador', { 
            userId, 
            error: entregadorError.message 
          });
          
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Permissões insuficientes para acessar dados do entregador' 
          }));
          return null;
        }

        logger.error('Erro ao buscar entregador', { 
          error: entregadorError.message, 
          userId 
        });
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: entregadorError.message 
        }));
        return null;
      }

      if (entregadorData) {
        setState(prev => ({ 
          ...prev, 
          entregador: entregadorData, 
          loading: false 
        }));

        logger.success('Entregador encontrado', { 
          entregadorId: entregadorData.id,
          nome: entregadorData.nome,
          empresaId: entregadorData.empresa_id
        });

        return entregadorData;
      } else {
        logger.info('Nenhum entregador encontrado para o usuário', { userId });
        
        setState(prev => ({ 
          ...prev, 
          entregador: null, 
          loading: false 
        }));
        return null;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro inesperado ao buscar entregador', { 
        error: errorMessage, 
        userId 
      });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return null;
    }
  }, []);

  // Verificar se o entregador tem status aprovado
  const isEntregadorAprovado = useCallback((entregador: Entregador | null): boolean => {
    if (!entregador) return false;
    return entregador.status === 'aprovado';
  }, []);

  // Verificar se o entregador é admin
  const isEntregadorAdmin = useCallback((entregador: Entregador | null): boolean => {
    if (!entregador) return false;
    return entregador.perfil === 'admin';
  }, []);

  // Obter empresa ID do entregador
  const getEmpresaId = useCallback((entregador: Entregador | null): string | null => {
    return entregador?.empresa_id || null;
  }, []);

  // Atualizar dados do entregador (para uso futuro)
  const updateEntregador = useCallback(async (
    entregadorId: string, 
    updates: Partial<Entregador>
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('Atualizando dados do entregador', { entregadorId, updates });

      const { error } = await supabase
        .from('entregadores')
        .update(updates)
        .eq('id', entregadorId);

      if (error) {
        logger.error('Erro ao atualizar entregador', { 
          error: error.message, 
          entregadorId 
        });
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return false;
      }

      // Atualizar estado local se é o mesmo entregador
      if (state.entregador?.id === entregadorId) {
        setState(prev => ({ 
          ...prev, 
          entregador: prev.entregador ? { ...prev.entregador, ...updates } : null, 
          loading: false 
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }

      logger.success('Entregador atualizado com sucesso', { entregadorId });
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro inesperado ao atualizar entregador', { 
        error: errorMessage, 
        entregadorId 
      });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return false;
    }
  }, [state.entregador?.id]);

  // Debug de permissões (apenas em desenvolvimento)
  const debugPermissions = useCallback(async (userId: string) => {
    if (import.meta.env.PROD) return;

    try {
      logger.info('🔍 DEBUG: Verificando permissões do entregador');

      // Testar query simples
      const { data: testData, error: testError } = await supabase
        .from('entregadores')
        .select('id, nome, empresa_id, status, perfil')
        .eq('user_id', userId)
        .limit(1);

      if (testError) {
        logger.error('❌ Erro em query de teste', { 
          error: testError.message,
          code: testError.code
        });
      } else {
        logger.success('✅ Query de teste bem-sucedida', { 
          data: testData,
          count: testData?.length || 0
        });
      }

      // Verificar sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      logger.info('📋 Sessão atual', { 
        hasSession: !!session,
        userId: session?.user?.id,
        isMatchingUser: session?.user?.id === userId
      });

    } catch (error) {
      logger.error('💥 Erro no debug de permissões', { error });
    }
  }, []);

  // Resetar estado
  const reset = useCallback(() => {
    setState({
      entregador: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    entregador: state.entregador,
    loading: state.loading,
    error: state.error,
    fetchEntregador,
    isEntregadorAprovado,
    isEntregadorAdmin,
    getEmpresaId,
    updateEntregador,
    debugPermissions,
    reset
  };
}