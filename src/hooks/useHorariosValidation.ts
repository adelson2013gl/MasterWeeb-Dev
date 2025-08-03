
import { useCallback } from "react";
import { ConfiguracoesSistema } from "@/types/configuracoes";
import { logger } from '@/lib/logger';
import { getHoraAtualLocalBrasil, getDataAtualLocalBrasil, compararHorarios } from '@/lib/utils';

interface UseHorariosValidationProps {
  configs: ConfiguracoesSistema;
}

export function useHorariosValidation({ configs }: UseHorariosValidationProps) {

  const podeVerAgendaPorHorario = useCallback((estrelas: number, dataAgenda: string, horaInicioTurno: string) => {
    logger.info('🚨 ✅ VALIDAÇÃO HORÁRIOS - podeVerAgendaPorHorario CHAMADO', {
      estrelas,
      dataAgenda,
      horaInicioTurno,
      habilitarPriorizacaoHorarios: configs?.habilitarPriorizacaoHorarios,
      horariosDisponiveis: {
        h5: configs?.horarioLiberacao5Estrelas,
        h4: configs?.horarioLiberacao4Estrelas,
        h3: configs?.horarioLiberacao3Estrelas,
        h2: configs?.horarioLiberacao2Estrelas,
        h1: configs?.horarioLiberacao1Estrela
      }
    }, 'VALIDAÇÃO_HORÁRIOS');

    if (!configs?.habilitarPriorizacaoHorarios) {
      logger.info('🚨 ✅ VALIDAÇÃO HORÁRIOS - Sistema de horários específicos DESABILITADO', {
        habilitado: configs?.habilitarPriorizacaoHorarios,
        resultado: 'PERMITIDO'
      }, 'VALIDAÇÃO_HORÁRIOS');
      return { permitido: true, motivo: 'Sistema de horários específicos desabilitado' };
    }

    const dataAtualLocal = getDataAtualLocalBrasil();
    const horaAtualLocal = getHoraAtualLocalBrasil();
    
    logger.info('🚨 ✅ VALIDAÇÃO HORÁRIOS - Dados temporais', {
      dataAtualLocal,
      horaAtualLocal,
      dataAgenda,
      horaInicioTurno,
      estrelas,
      formatoHoraAtual: 'HH:MM:SS',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }, 'VALIDAÇÃO_HORÁRIOS');

    if (dataAgenda !== dataAtualLocal) {
      logger.info('🚨 ✅ VALIDAÇÃO HORÁRIOS - Agenda NÃO é para hoje, liberando', {
        dataAgenda,
        dataAtualLocal,
        diferencaDias: dataAgenda > dataAtualLocal ? 'FUTURO' : 'PASSADO',
        resultado: 'PERMITIDO'
      }, 'VALIDAÇÃO_HORÁRIOS');
      return { permitido: true, motivo: 'Agenda não é para hoje' };
    }

    const horariosLiberacao = {
      5: configs.horarioLiberacao5Estrelas || '08:00:00',
      4: configs.horarioLiberacao4Estrelas || '08:45:00', 
      3: configs.horarioLiberacao3Estrelas || '09:20:00',
      2: configs.horarioLiberacao2Estrelas || '10:00:00',
      1: configs.horarioLiberacao1Estrela || '10:30:00'
    };

    const horarioLiberacaoEstrela = horariosLiberacao[estrelas as keyof typeof horariosLiberacao] || '09:20:00';
    
    logger.info('🚨 ✅ VALIDAÇÃO HORÁRIOS - Verificando horário para HOJE', {
      estrelas,
      horarioLiberacaoEstrela,
      horaAtualLocal,
      horaInicioTurno,
      dataAgenda,
      configuracaoCompleta: horariosLiberacao
    }, 'VALIDAÇÃO_HORÁRIOS');

    const podeVer = compararHorarios(horaAtualLocal, horarioLiberacaoEstrela);
    
    logger.info(`🚨 ✅ VALIDAÇÃO HORÁRIOS - RESULTADO da verificação`, {
      horaAtualLocal,
      horarioLiberacaoEstrela,
      comparacao: `${horaAtualLocal} >= ${horarioLiberacaoEstrela}`,
      resultado: podeVer ? 'PERMITIDO' : 'BLOQUEADO',
      motivo: podeVer ? 
        `Horário atual (${horaAtualLocal}) >= liberação ${estrelas}★ (${horarioLiberacaoEstrela})` :
        `Aguardar até ${horarioLiberacaoEstrela} para ${estrelas}★ (atual: ${horaAtualLocal})`,
      metodologia: 'compararHorarios_normalizada'
    }, 'VALIDAÇÃO_HORÁRIOS');

    return {
      permitido: podeVer,
      motivo: podeVer ? 
        `Liberado para ${estrelas} estrelas às ${horarioLiberacaoEstrela}` :
        `Aguardar até ${horarioLiberacaoEstrela} para ${estrelas} estrelas`
    };
  }, [configs]);

  const isAgendamentoPermitido = useCallback((dataAgenda: string, horaInicioTurno: string) => {
    return { permitido: true, motivo: '' };
  }, []);

  return {
    podeVerAgendaPorHorario,
    isAgendamentoPermitido
  };
}
