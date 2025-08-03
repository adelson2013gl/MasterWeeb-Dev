
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguracoesSistema } from "@/hooks/useConfiguracoesSistema";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { getDataAtualFormatada, turnoJaTerminou } from "@/lib/utils";
import { validateAgendaStructure } from "@/utils/agendaValidation";
import { processAgenda } from "@/utils/agendaProcessor";
import { 
  fetchEntregadorData, 
  fetchAgendasRaw, 
  fetchContagemAgendamentos, 
  fetchAgendamentosExistentes 
} from "@/services/agendasService";
import { AgendaDisponivel } from "@/types/agendaDisponivel";

export function useAgendasDisponiveis() {
  const { user } = useAuth();
  const { configs, podeVerAgendaPorHorario } = useConfiguracoesSistema();
  const [agendas, setAgendas] = useState<AgendaDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [entregadorId, setEntregadorId] = useState<string | null>(null);
  const [entregadorData, setEntregadorData] = useState<any>(null);

  const fetchAgendasDisponiveis = async () => {
    if (!user?.id) {
      logger.warn('❌ USER_ID ausente, cancelando busca de agendas', { userId: user?.id });
      return;
    }

    try {
      setLoading(true);
      logger.info('🔍 FASE 1: Iniciando busca de agendas com validação temporal', { userId: user.id });

      // Buscar dados do entregador
      const entregadorDataFetched = await fetchEntregadorData(user.id);
      setEntregadorId(entregadorDataFetched.id);
      setEntregadorData(entregadorDataFetched);
      
      // 🔥 LOG ESPECÍFICO PARA ADELSON NASCIMENTO
      if (entregadorDataFetched.nome?.toLowerCase().includes('adelson')) {
        logger.info('🔍 INVESTIGAÇÃO ADELSON - Dados do entregador carregados', {
          entregadorId: entregadorDataFetched.id,
          nome: entregadorDataFetched.nome,
          estrelas: entregadorDataFetched.estrelas,
          empresaId: entregadorDataFetched.empresa_id,
          status: entregadorDataFetched.status,
          userId: user.id,
          timestamp: new Date().toISOString()
        }, 'INVESTIGAÇÃO_ADELSON');
      }
      
      logger.info('✅ ENTREGADOR VALIDADO', { 
        entregadorId: entregadorDataFetched.id, 
        estrelas: entregadorDataFetched.estrelas,
        empresaId: entregadorDataFetched.empresa_id,
        nome: entregadorDataFetched.nome,
        status: entregadorDataFetched.status
      });

      // Buscar agendas brutas
      const dataAtual = getDataAtualFormatada();
      const agendasData = await fetchAgendasRaw(entregadorDataFetched.empresa_id);
      
      logger.info('📊 QUERY DE AGENDAS executada com sucesso', { 
        totalAgendas: agendasData.length,
        empresaId: entregadorDataFetched.empresa_id,
        primeiraAgenda: agendasData[0] ? {
          id: agendasData[0].id,
          data: agendasData[0].data_agenda,
          empresa_id: agendasData[0].empresa_id
        } : null
      });

      // Validar estrutura das agendas
      const agendasValidas = agendasData.filter(agenda => 
        validateAgendaStructure(agenda, entregadorDataFetched.empresa_id)
      );

      logger.info('🔍 VALIDAÇÃO ESTRUTURAL concluída', {
        totalOriginais: agendasData.length,
        totalValidas: agendasValidas.length,
        descartadas: agendasData.length - agendasValidas.length
      });

      // Buscar contagem real de agendamentos
      const agendasIds = agendasValidas.map(a => a.id);
      const contagemRealPorAgenda = await fetchContagemAgendamentos(agendasIds);

      logger.info('📊 CONTAGEM REAL DE AGENDAMENTOS obtida', {
        agendasComAgendamentos: Object.keys(contagemRealPorAgenda).length,
        totalAgendamentos: Object.values(contagemRealPorAgenda).reduce((a, b) => a + b, 0)
      });

      // Buscar agendamentos existentes
      const agendamentosExistentes = await fetchAgendamentosExistentes(entregadorDataFetched.id, dataAtual);
      
      logger.info('📋 Agendamentos existentes carregados', { 
        totalAgendamentos: agendamentosExistentes.length
      });

      // 🔥 LOG ESPECÍFICO PARA ADELSON NASCIMENTO - Configurações antes do processamento
      if (entregadorDataFetched.nome?.toLowerCase().includes('adelson')) {
        logger.info('🔍 INVESTIGAÇÃO ADELSON - Configurações antes do processamento', {
          configsDisponiveis: !!configs,
          habilitarPriorizacaoHorarios: configs?.habilitarPriorizacaoHorarios,
          permitirAgendamentoMesmoDia: configs?.permitirAgendamentoMesmoDia,
          podeVerFuncaoDisponivel: !!podeVerAgendaPorHorario,
          configsCompletas: {
            h5: configs?.horarioLiberacao5Estrelas,
            h4: configs?.horarioLiberacao4Estrelas,
            h3: configs?.horarioLiberacao3Estrelas,
            h2: configs?.horarioLiberacao2Estrelas,
            h1: configs?.horarioLiberacao1Estrela
          },
          agendasParaProcessar: agendasValidas.length,
          agendasHoje: agendasValidas.filter(a => a.data_agenda === dataAtual).length,
          timestamp: new Date().toISOString()
        }, 'INVESTIGAÇÃO_ADELSON');
      }

      // Processar agendas COM a função de validação de horário
      const agendasProcessadas = agendasValidas.map(agenda => 
        processAgenda({
          agenda,
          agendamentosExistentes,
          contagemRealPorAgenda,
          entregadorData: entregadorDataFetched,
          configs,
          podeVerAgendaPorHorario // 🔥 PASSANDO A FUNÇÃO DE VALIDAÇÃO
        })
      );

      // 🔥 LOG ESPECÍFICO PARA ADELSON NASCIMENTO - Resultado do processamento
      if (entregadorDataFetched.nome?.toLowerCase().includes('adelson')) {
        const agendasHoje = agendasProcessadas.filter(a => a.data_agenda === dataAtual);
        const agendasDisponiveis = agendasHoje.filter(a => a.podeAgendar);
        const agendasBloqueadas = agendasHoje.filter(a => !a.podeAgendar);
        
        logger.info('🔍 INVESTIGAÇÃO ADELSON - Resultado final do processamento', {
          totalAgendasProcessadas: agendasProcessadas.length,
          totalAgendasHoje: agendasHoje.length,
          agendasDisponiveisHoje: agendasDisponiveis.length,
          agendasBloqueadasHoje: agendasBloqueadas.length,
          detalhesAgendasHoje: agendasHoje.map(a => ({
            id: a.id,
            turno: a.turno.nome,
            horaInicio: a.turno.hora_inicio,
            podeAgendar: a.podeAgendar,
            motivoBloqueio: a.motivoBloqueio,
            turnoIniciado: a.turnoIniciado
          })),
          estrelas: entregadorDataFetched.estrelas,
          dataAtual,
          timestamp: new Date().toISOString()
        }, 'INVESTIGAÇÃO_ADELSON');
      }

      // Filtrar turnos que já terminaram
      const agendasAtivas = agendasProcessadas.filter(agenda => {
        const turnoTerminou = turnoJaTerminou(agenda.data, agenda.turno.hora_fim);
        
        logger.debug('🔍 Verificando se turno terminou', {
          agendaId: agenda.id,
          data: agenda.data,
          horaFim: agenda.turno.hora_fim,
          turnoTerminou,
          turnoNome: agenda.turno.nome
        });
        
        return !turnoTerminou;
      });

      logger.info('📋 FASE 1: AGENDAS PROCESSADAS com validação temporal', {
        totalAgendas: agendasValidas.length,
        agendasProcessadas: agendasProcessadas.length,
        agendasAtivas: agendasAtivas.length,
        agendasRemovidasPorTermino: agendasProcessadas.length - agendasAtivas.length,
        agendasDisponiveis: agendasAtivas.filter(a => a.podeAgendar).length,
        agendasBloqueadas: agendasAtivas.filter(a => !a.podeAgendar).length,
        agendasJaAgendadas: agendasAtivas.filter(a => a.jaAgendado).length,
        agendasTurnoIniciado: agendasAtivas.filter(a => a.turnoIniciado).length,
        inconsistenciasDetectadas: agendasAtivas.filter(a => a.inconsistenciaDetectada).length,
        estrelas: entregadorDataFetched.estrelas,
        permiteMesmoDia: configs?.permitirAgendamentoMesmoDia,
        habilitaPriorizacao: configs?.habilitarPriorizacaoHorarios
      });

      setAgendas(agendasAtivas);

    } catch (error: any) {
      logger.error('💥 ERRO INESPERADO na busca de agendas', { 
        error,
        userId: user.id,
        stack: error instanceof Error ? error.stack : 'N/A'
      });
      toast.error(error.message || 'Erro inesperado ao carregar agendas disponíveis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendasDisponiveis();
  }, [user?.id]);

  return {
    agendas,
    loading,
    entregadorId,
    entregadorData,
    refetch: fetchAgendasDisponiveis
  };
}
