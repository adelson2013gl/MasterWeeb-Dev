
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Função para fazer parsing de uma data string no formato 'YYYY-MM-DD' como data local
 * Evita problemas de fuso horário que fazem a data aparecer como o dia anterior
 * 
 * @param dateString - String no formato 'YYYY-MM-DD' 
 * @returns Date object interpretado como data local
 */
export const parseLocalDate = (dateString: string): Date => {
  // Parse a data como local adicionando horário explícito
  // Isso evita que seja interpretada como UTC
  return new Date(dateString + 'T00:00:00');
};

/**
 * Função para formatar timestamps do Supabase de forma segura
 * Aceita tanto timestamps completos quanto datas simples
 * 
 * @param timestamp - String de timestamp do Supabase ou data simples
 * @returns String formatada em português brasileiro ou "-" se inválida
 */
export const formatarTimestamp = (timestamp: string | null | undefined): string => {
  if (!timestamp) {
    return "-";
  }

  try {
    const data = new Date(timestamp);
    
    // Verificar se a data é válida
    if (isNaN(data.getTime())) {
      console.warn('Data inválida recebida:', timestamp);
      return "Data inválida";
    }

    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar timestamp:', error, timestamp);
    return "Erro na data";
  }
};

// NOVA FUNÇÃO: Obter data atual no horário local do Brasil
export const getDataAtualLocalBrasil = () => {
  const agora = new Date();
  // Forçar horário local brasileiro
  const dataLocal = agora.toLocaleDateString('pt-BR').split('/').reverse().join('-');
  return dataLocal; // YYYY-MM-DD
};

// 🔥 FUNÇÃO CORRIGIDA: Obter hora atual no formato HH:MM:SS para comparação consistente
export const getHoraAtualLocalBrasil = () => {
  const agora = new Date();
  // Forçar horário local brasileiro com formato HH:MM:SS
  const horaLocal = agora.toLocaleTimeString('pt-BR', { hour12: false });
  return horaLocal; // HH:MM:SS
};

// 🔥 NOVA FUNÇÃO: Normalizar horário para formato HH:MM:SS
export const normalizarHorario = (horario: string): string => {
  if (!horario) {
    console.log('🔥 NORMALIZAR HORÁRIO - Horário vazio, usando padrão', { horario });
    return '00:00:00';
  }
  
  // Se já está no formato HH:MM:SS, retornar como está
  if (horario.match(/^\d{2}:\d{2}:\d{2}$/)) {
    console.log('🔥 NORMALIZAR HORÁRIO - Já no formato correto HH:MM:SS', { horario });
    return horario;
  }
  
  // Se está no formato HH:MM, adicionar :00
  if (horario.match(/^\d{2}:\d{2}$/)) {
    const normalizado = horario + ':00';
    console.log('🔥 NORMALIZAR HORÁRIO - Convertido de HH:MM para HH:MM:SS', { 
      original: horario, 
      normalizado 
    });
    return normalizado;
  }
  
  // Fallback: retornar horário padrão
  console.warn('🔥 NORMALIZAR HORÁRIO - Formato inválido, usando padrão', { horario });
  return '00:00:00';
};

// 🔥 NOVA FUNÇÃO: Comparar horários de forma segura
export const compararHorarios = (horaAtual: string, horarioLiberacao: string): boolean => {
  try {
    const horaAtualNormalizada = normalizarHorario(horaAtual);
    const horarioLiberacaoNormalizado = normalizarHorario(horarioLiberacao);
    
    console.log('🔍 Comparando horários:', {
      horaAtual: horaAtual,
      horaAtualNormalizada,
      horarioLiberacao: horarioLiberacao,
      horarioLiberacaoNormalizado,
      resultado: horaAtualNormalizada >= horarioLiberacaoNormalizado
    });
    
    return horaAtualNormalizada >= horarioLiberacaoNormalizado;
  } catch (error) {
    console.error('Erro ao comparar horários:', error, { horaAtual, horarioLiberacao });
    return true; // Em caso de erro, permitir acesso
  }
};

// 🔥 NOVA FUNÇÃO FASE 1: Verificar se um turno já iniciou
export const turnoJaIniciou = (dataAgenda: string, horaInicio: string): boolean => {
  try {
    const dataAtual = getDataAtualLocalBrasil();
    const horaAtual = getHoraAtualLocalBrasil();
    
    // Se a data da agenda é anterior a hoje, o turno já passou
    if (dataAgenda < dataAtual) {
      return true;
    }
    
    // Se é hoje, verificar se a hora de início já passou
    if (dataAgenda === dataAtual) {
      const horaInicioNormalizada = normalizarHorario(horaInicio);
      const horaAtualNormalizada = normalizarHorario(horaAtual);
      
      // Se a hora atual é maior ou igual à hora de início, o turno já começou
      return horaAtualNormalizada >= horaInicioNormalizada;
    }
    
    // Se a data é futura, o turno ainda não iniciou
    return false;
  } catch (error) {
    console.error('Erro ao verificar se turno iniciou:', error, { dataAgenda, horaInicio });
    // Em caso de erro, assumir que não iniciou para não bloquear desnecessariamente
    return false;
  }
};

// 🔥 NOVA FUNÇÃO FASE 1: Verificar se um turno já terminou
export const turnoJaTerminou = (dataAgenda: string, horaFim: string): boolean => {
  try {
    const dataAtual = getDataAtualLocalBrasil();
    const horaAtual = getHoraAtualLocalBrasil();
    
    // Se a data da agenda é anterior a hoje, o turno já terminou
    if (dataAgenda < dataAtual) {
      return true;
    }
    
    // Se é hoje, verificar se a hora de fim já passou
    if (dataAgenda === dataAtual) {
      const horaFimNormalizada = normalizarHorario(horaFim);
      const horaAtualNormalizada = normalizarHorario(horaAtual);
      
      // Se a hora atual é maior que a hora de fim, o turno já terminou
      return horaAtualNormalizada > horaFimNormalizada;
    }
    
    // Se a data é futura, o turno ainda não terminou
    return false;
  } catch (error) {
    console.error('Erro ao verificar se turno terminou:', error, { dataAgenda, horaFim });
    // Em caso de erro, assumir que não terminou
    return false;
  }
};

// NOVA FUNÇÃO: Verificar se data é hoje (no horário local)
export const isDataHojeLocal = (dataString: string) => {
  const dataAtualLocal = getDataAtualLocalBrasil();
  return dataString === dataAtualLocal;
};

// ATUALIZAR função existente para usar horário local
export const getDataAtualFormatada = () => {
  // Usar a nova função que garante horário local
  return getDataAtualLocalBrasil();
};

// Função helper para formatar data corretamente evitando problemas de fuso horário
export const formatarDataCorreta = (dataString: string) => {
  const data = parseLocalDate(dataString);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    weekday: 'long'
  });
};

// Função helper para formatar data simples
export const formatarDataSimples = (dataString: string) => {
  const data = parseLocalDate(dataString);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Função helper para verificar se uma data é hoje
export const isDataHoje = (dataString: string) => {
  const dataAtual = getDataAtualFormatada();
  return dataString === dataAtual;
};

// Função helper para verificar se uma data é amanhã
export const isDataAmanha = (dataString: string) => {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const ano = amanha.getFullYear();
  const mes = String(amanha.getMonth() + 1).padStart(2, '0');
  const dia = String(amanha.getDate()).padStart(2, '0');
  const amanhaFormatada = `${ano}-${mes}-${dia}`;
  return dataString === amanhaFormatada;
};

// 🔥 ADICIONANDO as funções que estão faltando para AgendamentoCalendar
export const formatarData = (dataString: string): string => {
  return formatarDataSimples(dataString);
};

export const formatarHorario = (horario: string): string => {
  if (!horario) return '00:00';
  
  // Se já está no formato HH:MM, retornar como está
  if (horario.match(/^\d{2}:\d{2}$/)) {
    return horario;
  }
  
  // Se está no formato HH:MM:SS, remover os segundos
  if (horario.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return horario.substring(0, 5);
  }
  
  return horario;
};
