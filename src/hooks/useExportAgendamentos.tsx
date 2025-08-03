import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { safeStatus, safeTipo } from "@/lib/enumSafety";
import { EXPORT_CONFIG, type ExportData, type ValidationResult } from '@/lib/exportConfig';
import { validarCPF } from '@/lib/cpfUtils';

// Função auxiliar para formatação segura de datas
const formatSafeDate = (dateValue: string | null | undefined, formatString: string = EXPORT_CONFIG.FORMATS.DATE): string => {
  if (!dateValue || dateValue.trim() === '') {
    logger.warn('Data vazia ou nula encontrada durante formatação', { dateValue });
    return EXPORT_CONFIG.LABELS.NOT_AVAILABLE;
  }
  
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) {
      logger.warn('Data inválida encontrada durante formatação', { dateValue });
      return EXPORT_CONFIG.LABELS.NOT_AVAILABLE;
    }
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    logger.error('Erro ao formatar data', { dateValue, error });
    return EXPORT_CONFIG.LABELS.NOT_AVAILABLE;
  }
};

// Funções de cache
const getCachedData = (key: string) => {
  try {
    const cached = localStorage.getItem(`${EXPORT_CONFIG.CACHE.KEY_PREFIX}_${key}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < EXPORT_CONFIG.CACHE.DURATION) {
        return data;
      }
    }
  } catch (error) {
    logger.warn('Erro ao recuperar cache', { key, error });
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  try {
    localStorage.setItem(`${EXPORT_CONFIG.CACHE.KEY_PREFIX}_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    logger.warn('Erro ao salvar cache', { key, error });
  }
};

// Função de validação de dados
const validarDadosExportacao = (dados: any[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  dados.forEach((item, index) => {
    // Validar campos obrigatórios
    if (!item.data || item.data === EXPORT_CONFIG.LABELS.NOT_AVAILABLE) {
      errors.push(`Linha ${index + 1}: Data inválida`);
    }
    
    // Validar CPF se presente e não for placeholder
    if (item.cpfEntregador && 
        item.cpfEntregador !== EXPORT_CONFIG.LABELS.NOT_AVAILABLE && 
        item.cpfEntregador !== EXPORT_CONFIG.LABELS.NO_APPOINTMENTS &&
        !validarCPF(item.cpfEntregador.replace(',', ''))) {
      warnings.push(`Linha ${index + 1}: CPF inválido - ${item.cpfEntregador}`);
    }
  });
  
  if (errors.length > 0) {
    logger.error('❌ Erros de validação encontrados', { errors });
  }
  
  if (warnings.length > 0) {
    logger.warn('⚠️ Avisos de validação', { warnings });
  }
  
  return { valid: errors.length === 0, errors, warnings };
};

// Função para criar dados no formato específico solicitado (somente agendados, sem reservas)
const criarDadosFormatoEspecifico = (agendas: any[], agendamentos: any[]): ExportData[] => {
  const dadosFormatados: ExportData[] = [];
  
  // Filtrar apenas agendamentos confirmados (sem reservas)
  const agendamentosConfirmados = agendamentos.filter(a => a.status === 'agendado');
  
  // Agrupar agendamentos confirmados por agenda_id
  const agendamentosPorAgenda = agendamentosConfirmados.reduce((acc, agendamento) => {
    const agendaId = agendamento.agenda_id;
    if (!acc[agendaId]) acc[agendaId] = [];
    acc[agendaId].push(agendamento);
    return acc;
  }, {});
  
  // Processar cada agenda
  agendas.forEach(agenda => {
    const agendamentosAgenda = agendamentosPorAgenda[agenda.id] || [];
    
    if (agendamentosAgenda.length === 0) {
      // Sem agendamentos confirmados
      dadosFormatados.push({
        data: formatSafeDate(agenda.data),
        cidade: agenda.regioes?.cidades?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
        regiao: agenda.regioes?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
        turno: agenda.turnos?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
        cpfEntregador: EXPORT_CONFIG.LABELS.NO_APPOINTMENTS,
        nomeEntregador: EXPORT_CONFIG.LABELS.NO_APPOINTMENTS
      });
    } else {
      // Com agendamentos confirmados - agrupar CPFs e nomes
      const cpfs = agendamentosAgenda
        .map(a => a.entregadores?.cpf)
        .filter(Boolean);
      const nomes = agendamentosAgenda
        .map(a => a.entregadores?.nome)
        .filter(Boolean);
      
      dadosFormatados.push({
        data: formatSafeDate(agenda.data),
        cidade: agenda.regioes?.cidades?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
        regiao: agenda.regioes?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
        turno: agenda.turnos?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
        cpfEntregador: cpfs.length > 0 ? cpfs.join(', ') + ',' : EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
        nomeEntregador: nomes.length > 0 ? nomes.join(', ') : EXPORT_CONFIG.LABELS.NOT_AVAILABLE
      });
    }
  });
  
  return dadosFormatados;
};

export function useExportAgendamentos() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: '' });
  const { empresa } = useEmpresaUnificado();

  const exportarAgendamentos = async (dataInicio?: string, dataFim?: string) => {
    if (!empresa?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    setLoading(true);
    const startTime = performance.now();
    setProgress({ current: 0, total: 6, stage: 'Iniciando...' });

    try {
      logger.info('🚀 Iniciando exportação de agendamentos', { 
        empresaId: empresa.id,
        dataInicio, 
        dataFim 
      });

      // Definir período padrão se não fornecido
      const hoje = new Date();
      const dataInicioFiltro = dataInicio || format(hoje, 'yyyy-MM-dd');
      const dataFimFiltro = dataFim || format(
        new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000), 
        'yyyy-MM-dd'
      );

      // Verificar cache primeiro
      const cacheKey = `${empresa.id}_${dataInicioFiltro}_${dataFimFiltro}`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        logger.info('📦 Usando dados do cache', { cacheKey });
        setProgress({ current: 6, total: 6, stage: 'Dados recuperados do cache' });
        // Processar dados do cache e gerar Excel
        await processarEGerarExcel(cachedData.agendas, cachedData.agendamentos, dataInicioFiltro, dataFimFiltro, startTime);
        return;
      }

      setProgress({ current: 1, total: 6, stage: 'Buscando agendas...' });
      
      // Buscar agendas com consulta otimizada
      const { data: agendas, error: errorAgendas } = await supabase
        .from('agendas')
        .select(`
          id,
          data,
          turnos:turno_id(nome, hora_inicio, hora_fim),
          regioes:regiao_id(nome, cidades:cidade_id(nome))
        `)
        .eq('empresa_id', empresa.id)
        .gte('data', dataInicioFiltro)
        .lte('data', dataFimFiltro)
        .order('data', { ascending: true });

      if (errorAgendas) {
        logger.error('💥 Erro ao buscar agendas', { error: errorAgendas });
        throw new Error('Erro ao buscar agendas');
      }

      setProgress({ current: 2, total: 6, stage: 'Buscando agendamentos...' });

      // Buscar agendamentos confirmados
      const { data: agendamentosConfirmados, error: errorConfirmados } = await supabase
        .from('agendamentos')
        .select(`
          id,
          agenda_id,
          tipo,
          status,
          data_agendamento,
          created_at,
          entregadores!agendamentos_entregador_id_fkey (
            nome,
            cpf,
            telefone,
            email,
            estrelas
          )
        `)
        .eq('empresa_id', empresa.id)
        .eq('status', safeStatus('agendado'))
        .gte('data_agendamento', dataInicioFiltro)
        .lte('data_agendamento', dataFimFiltro)
        .order('data_agendamento', { ascending: true });

      if (errorConfirmados) {
        logger.error('❌ Erro ao buscar agendamentos confirmados', { error: errorConfirmados });
        throw new Error('Erro ao buscar agendamentos confirmados');
      }

      setProgress({ current: 3, total: 6, stage: 'Buscando reservas pendentes...' });

      // Buscar reservas pendentes
      const { data: reservasPendentes, error: errorReservas } = await supabase
        .from('agendamentos')
        .select(`
          id,
          agenda_id,
          tipo,
          status,
          data_agendamento,
          created_at,
          entregadores!agendamentos_entregador_id_fkey (
            nome,
            cpf,
            telefone,
            email,
            estrelas
          )
        `)
        .eq('empresa_id', empresa.id)
        .eq('tipo', safeTipo('reserva'))
        .in('status', [safeStatus('pendente'), safeStatus('confirmada')])
        .gte('data_agendamento', dataInicioFiltro)
        .lte('data_agendamento', dataFimFiltro)
        .order('created_at', { ascending: true });

      if (errorReservas) {
        logger.error('❌ Erro ao buscar reservas', { error: errorReservas });
        throw new Error('Erro ao buscar reservas');
      }

      // Salvar dados no cache
      const dadosParaCache = {
        agendas: agendas || [],
        agendamentos: [...(agendamentosConfirmados || []), ...(reservasPendentes || [])]
      };
      setCachedData(cacheKey, dadosParaCache);

      // Processar e gerar Excel
      await processarEGerarExcel(agendas || [], [...(agendamentosConfirmados || []), ...(reservasPendentes || [])], dataInicioFiltro, dataFimFiltro, startTime);
    } catch (error) {
      logger.error('💥 Erro durante exportação', { error });
      throw error;
    } finally {
      setProgress({ current: 0, total: 0, stage: '' });
    }
  };

  // Função auxiliar para processar dados e gerar Excel
  const processarEGerarExcel = async (
    agendas: any[],
    todosAgendamentos: any[],
    dataInicioFiltro: string,
    dataFimFiltro: string,
    startTime: number
  ) => {
    try {
      setProgress({ current: 4, total: 6, stage: 'Validando dados...' });

      // Validar dados
      const validacao = validarDadosExportacao(todosAgendamentos);
      if (validacao.errors.length > 0) {
        logger.warn('⚠️ Dados com problemas encontrados', validacao);
      }

      setProgress({ current: 5, total: 6, stage: 'Processando dados...' });

      // Separar agendamentos por tipo
      const agendamentosConfirmados = todosAgendamentos.filter(a => a.status === 'agendado');
      const reservasPendentes = todosAgendamentos.filter(a => a.tipo === 'entrega');

      // Criar dados no formato específico solicitado
      const dadosFormatoEspecifico = criarDadosFormatoEspecifico(agendas, todosAgendamentos);

      // Processar dados para o Excel (agendamentos confirmados) - nova ordem das colunas
      const dadosExcelConfirmados = agendamentosConfirmados?.map(item => {
        const agenda = agendas.find(a => a.id === item.agenda_id);
        const cpfComVirgula = item.entregadores?.cpf ? item.entregadores.cpf + ',' : EXPORT_CONFIG.LABELS.NOT_AVAILABLE;
        
        return {
          'Data e Hora do Agendamento': formatSafeDate(item.data_agendamento, EXPORT_CONFIG.FORMATS.DATETIME),
          Cidade: agenda?.regioes?.cidades?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Região: agenda?.regioes?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          CPF: cpfComVirgula,
          Nome: item.entregadores?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          ID: item.id,
          Telefone: item.entregadores?.telefone || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Email: item.entregadores?.email || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Data: formatSafeDate(agenda?.data),
          'Hora Início': agenda?.turnos?.hora_inicio || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          'Hora Fim': agenda?.turnos?.hora_fim || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Tipo: item.tipo,
          Status: item.status
        };
      }) || [];

      // Processar dados para o Excel (reservas pendentes)
      const dadosExcelReservas = reservasPendentes?.map((item, index) => {
        const agenda = agendas.find(a => a.id === item.agenda_id);
        return {
          Posição: index + 1,
          Nome: item.entregadores?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          CPF: item.entregadores?.cpf || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Telefone: item.entregadores?.telefone || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Email: item.entregadores?.email || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Estrelas: item.entregadores?.estrelas,
          Data: formatSafeDate(agenda?.data),
          'Hora Início': agenda?.turnos?.hora_inicio || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          'Hora Fim': agenda?.turnos?.hora_fim || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Região: agenda?.regioes?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Cidade: agenda?.regioes?.cidades?.nome || EXPORT_CONFIG.LABELS.NOT_AVAILABLE,
          Tipo: item.tipo,
          Status: item.status,
          'Data Reserva': formatSafeDate(item.created_at, EXPORT_CONFIG.FORMATS.DATETIME)
        };
      }) || [];

      // Calcular métricas para o resumo executivo
      const totalConfirmados = agendamentosConfirmados?.length || 0;
      const totalReservas = reservasPendentes?.length || 0;
      const taxaConversao = totalConfirmados > 0 ? (totalConfirmados / (totalConfirmados + totalReservas)) * 100 : 0;

      // Preparar dados para a aba de Resumo Executivo
      const dadosResumoExecutivo = [
        { Metrica: 'Total Agendamentos Confirmados', Valor: totalConfirmados },
        { Metrica: 'Total Reservas Pendentes', Valor: totalReservas },
        { Metrica: 'Taxa de Conversão (%)', Valor: taxaConversao.toFixed(2) },
        { Metrica: 'Período', Valor: `${formatSafeDate(dataInicioFiltro)} - ${formatSafeDate(dataFimFiltro)}` },
        { Metrica: 'Data de Geração', Valor: formatSafeDate(new Date().toISOString(), EXPORT_CONFIG.FORMATS.DATETIME) }
      ];

      setProgress({ current: 6, total: 6, stage: 'Gerando arquivo Excel...' });

      // Criar WorkSheets
      const wsFormatoEspecifico = XLSX.utils.json_to_sheet(dadosFormatoEspecifico);
      const wsConfirmados = XLSX.utils.json_to_sheet(dadosExcelConfirmados);
      const wsReservas = XLSX.utils.json_to_sheet(dadosExcelReservas);
      const wsResumo = XLSX.utils.json_to_sheet(dadosResumoExecutivo);

      // Criar Workbook e adicionar WorkSheets
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsFormatoEspecifico, EXPORT_CONFIG.EXCEL.SHEET_NAMES.AGENDA_FORMAT);
      XLSX.utils.book_append_sheet(wb, wsConfirmados, EXPORT_CONFIG.EXCEL.SHEET_NAMES.CONFIRMED);
      XLSX.utils.book_append_sheet(wb, wsReservas, EXPORT_CONFIG.EXCEL.SHEET_NAMES.PENDING);
      XLSX.utils.book_append_sheet(wb, wsResumo, EXPORT_CONFIG.EXCEL.SHEET_NAMES.SUMMARY);

      // Converter para arquivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

      // Fazer o download
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      const nomeArquivo = format(new Date(), EXPORT_CONFIG.FORMATS.FILENAME);
      link.setAttribute('download', `agendamentos_${nomeArquivo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Calcular tempo de execução
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      logger.info('✅ Exportação concluída com sucesso', {
        agendamentosConfirmados: agendamentosConfirmados?.length || 0,
        reservasPendentes: reservasPendentes?.length || 0,
        totalRegistros: todosAgendamentos.length,
        duracaoMs: duration,
        formatoEspecifico: dadosFormatoEspecifico.length,
        validacao
      });

      toast.success(`✅ Agendamentos exportados com sucesso! (${duration}ms)`);

    } catch (error) {
      logger.error('💥 Erro no processamento', { error });
      throw error;
    }
  };

  return {
    exportarAgendamentos,
    loading,
    progress
  };
}
