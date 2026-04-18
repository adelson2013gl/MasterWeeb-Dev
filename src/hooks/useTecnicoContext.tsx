/**
 * Hook para gerenciar dados do tecnico
 * Extraído do EmpresaUnificadoContext para melhorar modularidade
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { Tecnico } from '@/components/admin/gestao-tecnicos/types';

interface TecnicoState {
  tecnico: Tecnico | null;
  loading: boolean;
  error: string | null;
}

export function useTecnicoContext() {
  const [state, setState] = useState<TecnicoState>({
    tecnico: null,
    loading: false,
    error: null
  });

  // Buscar dados do tecnico por user_id
  const fetchTecnico = useCallback(async (userId: string): Promise<Tecnico | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('Buscando dados do tecnico', { userId });

      const { data: tecnicoData, error: tecnicoError } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (tecnicoError) {
        // Tratar especificamente erro de RLS (permissões)
        if (tecnicoError.code === '42501') {
          logger.warn('Erro de permissão RLS ao buscar tecnico', { 
            userId, 
            error: tecnicoError.message 
          });
          
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Permissões insuficientes para acessar dados do tecnico' 
          }));
          return null;
        }

        logger.error('Erro ao buscar tecnico', { 
          error: tecnicoError.message, 
          userId 
        });
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: tecnicoError.message 
        }));
        return null;
      }

      if (tecnicoData) {
        setState(prev => ({ 
          ...prev, 
          tecnico: tecnicoData, 
          loading: false 
        }));

        logger.success('Tecnico encontrado', { 
          tecnicoId: tecnicoData.id,
          nome: tecnicoData.nome,
          empresaId: tecnicoData.empresa_id
        });

        return tecnicoData;
      } else {
        logger.info('Nenhum tecnico encontrado para o usuário', { userId });
        
        setState(prev => ({ 
          ...prev, 
          tecnico: null, 
          loading: false 
        }));
        return null;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro inesperado ao buscar tecnico', { 
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

  // Verificar se o tecnico tem status aprovado
  const isTecnicoAprovado = useCallback((tecnico: Tecnico | null): boolean => {
    if (!tecnico) return false;
    return tecnico.status === 'aprovado';
  }, []);

  // Verificar se o tecnico é admin
  const isTecnicoAdmin = useCallback((tecnico: Tecnico | null): boolean => {
    if (!tecnico) return false;
    return tecnico.perfil === 'admin';
  }, []);

  // Obter empresa ID do tecnico
  const getEmpresaId = useCallback((tecnico: Tecnico | null): string | null => {
    return tecnico?.empresa_id || null;
  }, []);

  // Atualizar dados do tecnico (para uso futuro)
  const updateTecnico = useCallback(async (
    tecnicoId: string, 
    updates: Partial<Tecnico>
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('Atualizando dados do tecnico', { tecnicoId, updates });

      const { error } = await supabase
        .from('tecnicos')
        .update(updates)
        .eq('id', tecnicoId);

      if (error) {
        logger.error('Erro ao atualizar tecnico', { 
          error: error.message, 
          tecnicoId 
        });
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return false;
      }

      // Atualizar estado local se é o mesmo tecnico
      if (state.tecnico?.id === tecnicoId) {
        setState(prev => ({ 
          ...prev, 
          tecnico: prev.tecnico ? { ...prev.tecnico, ...updates } : null, 
          loading: false 
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }

      logger.success('Tecnico atualizado com sucesso', { tecnicoId });
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro inesperado ao atualizar tecnico', { 
        error: errorMessage, 
        tecnicoId 
      });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return false;
    }
  }, [state.tecnico?.id]);

  // Debug de permissões (apenas em desenvolvimento)
  const debugPermissions = useCallback(async (userId: string) => {
    if (import.meta.env.PROD) return;

    try {
      logger.info('🔍 DEBUG: Verificando permissões do tecnico');

      // Testar query simples
      const { data: testData, error: testError } = await supabase
        .from('tecnicos')
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
      tecnico: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    tecnico: state.tecnico,
    loading: state.loading,
    error: state.error,
    fetchTecnico,
    isTecnicoAprovado,
    isTecnicoAdmin,
    getEmpresaId,
    updateTecnico,
    debugPermissions,
    reset
  };
}