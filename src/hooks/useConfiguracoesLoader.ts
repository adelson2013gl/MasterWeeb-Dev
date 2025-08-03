
import { useCallback } from "react";
import { ConfiguracoesSistema, configuracoesPadrao } from "@/types/configuracoes";
import { ConfiguracoesService } from "@/services/configuracoes.service";
import { logger } from '@/lib/logger';
import { normalizarHorario } from '@/lib/utils';

interface UseConfiguracoesLoaderProps {
  empresa: any;
  setLoading: (loading: boolean) => void;
  setIsLoadingData: (loading: boolean) => void;
  setConfigs: (configs: ConfiguracoesSistema) => void;
  setHasError: (error: boolean) => void;
  hasUnsavedChanges: boolean;
  isLoadingRef: React.MutableRefObject<boolean>;
}

export function useConfiguracoesLoader({
  empresa,
  setLoading,
  setIsLoadingData,
  setConfigs,
  setHasError,
  hasUnsavedChanges,
  isLoadingRef
}: UseConfiguracoesLoaderProps) {

  const loadConfiguracoes = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    
    if (hasUnsavedChanges) {
      logger.warn('Bloqueando reload: há mudanças não salvas', {
        hasUnsavedChanges
      });
      return;
    }

    if (isLoadingRef.current) {
      logger.info('Carregamento já em andamento, ignorando');
      return;
    }

    logger.debug('loadConfiguracoes iniciado', {
      empresaId: empresa?.id,
      retryCount,
      maxRetries
    });

    if (!empresa?.id) {
      logger.error('Empresa não definida, usando configurações padrão', { 
        empresaId: empresa?.id,
        empresaDisponivel: !!empresa
      });
      setConfigs(configuracoesPadrao);
      setLoading(false);
      setHasError(false);
      return;
    }

    const authReady = await ConfiguracoesService.isAuthReady();
    if (!authReady) {
      logger.warn('Autenticação não pronta', { retryCount, maxRetries });
      
      if (retryCount < maxRetries) {
        logger.info('Tentando novamente em 1 segundo...', { retryCount });
        setTimeout(() => {
          loadConfiguracoes(retryCount + 1);
        }, 1000);
        return;
      } else {
        logger.error('Máximo de tentativas atingido, usando configurações padrão');
        setConfigs(configuracoesPadrao);
        setLoading(false);
        setHasError(false);
        return;
      }
    }

    try {
      isLoadingRef.current = true;
      setIsLoadingData(true);

      const rawData = await ConfiguracoesService.loadConfiguracoesFromDB(empresa.id);

      if (!rawData || rawData.length === 0) {
        logger.warn('Nenhuma configuração encontrada, usando padrão', { 
          empresaId: empresa.id,
          dataIsNull: rawData === null,
          dataIsEmpty: rawData?.length === 0,
          retryCount
        });
        setConfigs(configuracoesPadrao);
        setLoading(false);
        setHasError(false);
        return;
      }

      logger.info(`Configurações carregadas com sucesso. Total: ${rawData.length}`, { 
        empresaId: empresa.id,
        totalConfigs: rawData.length,
        chavesEncontradas: rawData.map(d => d.chave),
        retryCount
      });

      // Mapear configurações
      const registroHorarios = rawData.find(config => config.chave === 'horarios_configurados');
      
      const mappedConfigs: ConfiguracoesSistema = {
        ...configuracoesPadrao
      };

      if (registroHorarios) {
        mappedConfigs.horarioLiberacao5Estrelas = normalizarHorario(registroHorarios.horario_liberacao_5_estrelas || configuracoesPadrao.horarioLiberacao5Estrelas);
        mappedConfigs.horarioLiberacao4Estrelas = normalizarHorario(registroHorarios.horario_liberacao_4_estrelas || configuracoesPadrao.horarioLiberacao4Estrelas);
        mappedConfigs.horarioLiberacao3Estrelas = normalizarHorario(registroHorarios.horario_liberacao_3_estrelas || configuracoesPadrao.horarioLiberacao3Estrelas);
        mappedConfigs.horarioLiberacao2Estrelas = normalizarHorario(registroHorarios.horario_liberacao_2_estrelas || configuracoesPadrao.horarioLiberacao2Estrelas);
        mappedConfigs.horarioLiberacao1Estrela = normalizarHorario(registroHorarios.horario_liberacao_1_estrela || configuracoesPadrao.horarioLiberacao1Estrela);
      }

      // Mapear outras configurações
      rawData.forEach(config => {
        const chave = config.chave;
        let valor: any = config.valor;
        
        if (config.tipo === 'boolean') {
          if (typeof valor === 'string') {
            valor = valor === 'true';
          } else if (typeof valor === 'boolean') {
            valor = valor;
          } else {
            valor = false;
          }
        } else if (config.tipo === 'integer') {
          valor = parseInt(valor, 10);
        }
        
        switch (chave) {
          case 'permitirAgendamentoMesmoDia':
            mappedConfigs.permitirAgendamentoMesmoDia = valor;
            break;
          case 'habilitarPriorizacao':
            mappedConfigs.habilitarPriorizacaoHorarios = valor;
            break;
          case 'habilitarPriorizacaoHorarios':
            mappedConfigs.habilitarPriorizacaoHorarios = valor;
            break;
          case 'limiteAgendamentosDia':
            mappedConfigs.limiteAgendamentosDia = valor;
            break;
          case 'permiteCancel':
            mappedConfigs.permiteCancel = valor;
            break;
          case 'permiteMultiplosTurnos':
            mappedConfigs.permiteMultiplosTurnos = valor;
            break;
          case 'prazoLimiteCancelamento':
            mappedConfigs.prazoLimiteCancelamento = valor;
            break;
          case 'prazoMinimoAgendamento':
            mappedConfigs.prazoMinimoAgendamento = valor;
            break;
          case 'permiteReagendamento':
            mappedConfigs.permiteReagendamento = valor;
            break;
        }
      });

      logger.info('Configurações processadas com sucesso', { 
        configs: {
          habilitarPriorizacaoHorarios: mappedConfigs.habilitarPriorizacaoHorarios,
          permitirAgendamentoMesmoDia: mappedConfigs.permitirAgendamentoMesmoDia
        },
        totalConfiguracoes: rawData.length,
        empresaId: empresa.id,
        retryCount
      });
      
      setConfigs(mappedConfigs);
      setHasError(false);

    } catch (err) {
      logger.error('Erro ao carregar configurações', { 
        error: err, 
        empresaId: empresa.id,
        errorMessage: err instanceof Error ? err.message : 'Erro desconhecido',
        retryCount,
        maxRetries
      });
      
      if (retryCount < maxRetries) {
        logger.info('Tentando novamente após erro...', { retryCount });
        setTimeout(() => {
          loadConfiguracoes(retryCount + 1);
        }, 1000);
        return;
      }
      
      setConfigs(configuracoesPadrao);
      setHasError(true);
    } finally {
      setLoading(false);
      setIsLoadingData(false);
      isLoadingRef.current = false;
    }
  }, [empresa?.id, hasUnsavedChanges, isLoadingRef, setConfigs, setHasError, setIsLoadingData, setLoading]);

  return { loadConfiguracoes };
}
