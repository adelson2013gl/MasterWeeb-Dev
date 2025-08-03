
import { useCallback } from "react";
import { ConfiguracoesSistema } from "@/types/configuracoes";
import { ConfiguracoesService } from "@/services/configuracoes.service";
import { logger } from '@/lib/logger';

interface UseConfiguracoesSaverProps {
  empresa: any;
  isAdminEmpresa: boolean;
  configs: ConfiguracoesSistema;
  setLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setHasUnsavedChanges: (changes: boolean) => void;
  loadConfiguracoes: () => Promise<void>;
}

export function useConfiguracoesSaver({
  empresa,
  isAdminEmpresa,
  configs,
  setLoading,
  setIsSaving,
  setHasUnsavedChanges,
  loadConfiguracoes
}: UseConfiguracoesSaverProps) {

  const saveAllConfiguracoes = useCallback(async () => {
    if (!empresa?.id || !isAdminEmpresa) {
      throw new Error('Sem permissão para salvar configurações');
    }

    try {
      setLoading(true);
      setIsSaving(true);

      logger.info('🔧 ✅ INICIANDO SALVAMENTO COM UPSERT - CORREÇÃO APLICADA', { 
        empresaId: empresa.id,
        configsAtuais: {
          permitirAgendamentoMesmoDia: configs.permitirAgendamentoMesmoDia,
          tipoPermitirAgendamento: typeof configs.permitirAgendamentoMesmoDia,
          habilitarPriorizacaoHorarios: configs.habilitarPriorizacaoHorarios,
          tipoHabilitarHorarios: typeof configs.habilitarPriorizacaoHorarios,
          horarios: {
            h5: configs.horarioLiberacao5Estrelas,
            h4: configs.horarioLiberacao4Estrelas,
            h3: configs.horarioLiberacao3Estrelas,
            h2: configs.horarioLiberacao2Estrelas,
            h1: configs.horarioLiberacao1Estrela
          }
        },
        metodo: 'UPSERT'
      }, 'SAVE_UPSERT');

      const upsertedData = await ConfiguracoesService.saveConfiguracoesToDB(empresa.id, configs);

      const configuracoesUpsertadas = upsertedData?.length || 0;
      logger.info('✅ UPSERT - CONFIGURAÇÕES SALVAS COM SUCESSO!', {
        totalProcessadas: configuracoesUpsertadas,
        empresaId: empresa.id,
        metodo: 'UPSERT',
        eficiencia: 'MÁXIMA'
      }, 'SAVE_UPSERT');

      setHasUnsavedChanges(false);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadConfiguracoes();

    } catch (error) {
      logger.error('💥 UPSERT - ERRO CRÍTICO AO SALVAR CONFIGURAÇÕES COM UPSERT', { 
        error,
        metodo: 'UPSERT'
      }, 'SAVE_UPSERT');
      throw error;
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  }, [empresa?.id, isAdminEmpresa, configs, setLoading, setIsSaving, setHasUnsavedChanges, loadConfiguracoes]);

  return { saveAllConfiguracoes };
}
