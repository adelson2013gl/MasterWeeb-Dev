import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Agenda } from '@/types/agenda';
import { useCriacaoAgendas } from './useCriacaoAgendas';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para duplicar agendas existentes
 * Reutiliza a lógica de criação do useCriacaoAgendas
 */
export function useDuplicarAgenda() {
  const [loading, setLoading] = useState(false);
  const { criarAgenda } = useCriacaoAgendas();

  /**
   * Valida se já existe agenda para a data/turno/região especificada
   */
  const validarConflito = async (agenda: Agenda, novaData: Date): Promise<boolean> => {
    try {
      const dataFormatada = format(novaData, 'yyyy-MM-dd');
      
      const { data: existente, error } = await supabase
        .from('agendas')
        .select('id')
        .eq('data_agenda', dataFormatada)
        .eq('turno_id', agenda.turno_id)
        .eq('regiao_id', agenda.regiao_id);

      if (error) {
        console.error('Erro ao validar conflito:', error);
        return false;
      }

      return existente && existente.length > 0;
    } catch (error) {
      console.error('Erro na validação de conflito:', error);
      return false;
    }
  };

  /**
   * Valida se as datas são válidas para duplicação
   */
  const validarDatas = (datas: Date[]): { validas: Date[], invalidas: string[] } => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const validas: Date[] = [];
    const invalidas: string[] = [];
    
    datas.forEach(data => {
      if (data < hoje) {
        invalidas.push(`${format(data, 'dd/MM/yyyy')} (data passada)`);
      } else {
        validas.push(data);
      }
    });
    
    return { validas, invalidas };
  };

  /**
   * Duplica uma agenda para uma ou múltiplas datas
   */
  const duplicarAgenda = async (
    agendaOriginal: Agenda, 
    novasDatas: Date[]
  ): Promise<{ sucesso: number; erros: number; detalhes: string[] }> => {
    
    if (!agendaOriginal) {
      toast.error('Agenda original não encontrada');
      return { sucesso: 0, erros: 1, detalhes: ['Agenda original inválida'] };
    }

    if (novasDatas.length === 0) {
      toast.error('Selecione pelo menos uma data');
      return { sucesso: 0, erros: 1, detalhes: ['Nenhuma data selecionada'] };
    }

    if (novasDatas.length > 7) {
      toast.error('Máximo de 7 agendas por duplicação');
      return { sucesso: 0, erros: 1, detalhes: ['Limite de 7 datas excedido'] };
    }

    setLoading(true);
    
    try {
      // Validar datas
      const { validas, invalidas } = validarDatas(novasDatas);
      
      if (invalidas.length > 0) {
        toast.error(`Datas inválidas: ${invalidas.join(', ')}`);
        return { sucesso: 0, erros: invalidas.length, detalhes: invalidas };
      }

      const sucessos: string[] = [];
      const erros: string[] = [];
      
      // Processar cada data
      for (const novaData of validas) {
        try {
          // Verificar conflitos
          const temConflito = await validarConflito(agendaOriginal, novaData);
          
          if (temConflito) {
            const dataStr = format(novaData, 'dd/MM/yyyy');
            erros.push(`${dataStr} (já existe agenda para este turno/região)`);
            continue;
          }

          // Preparar dados para duplicação
          const dadosDuplicacao = {
            data: novaData,
            turno_ids: [agendaOriginal.turno_id], // Mesmo turno
            regiao_id: agendaOriginal.regiao_id,  // Mesma região
            vagas_disponiveis: agendaOriginal.vagas_disponiveis, // Mesmas vagas
            permite_reserva: agendaOriginal.permite_reserva      // Mesma configuração
          };
          
          // Criar agenda duplicada
          await criarAgenda(dadosDuplicacao);
          sucessos.push(format(novaData, 'dd/MM/yyyy'));
          
        } catch (error) {
          console.error(`Erro ao duplicar para ${format(novaData, 'dd/MM/yyyy')}:`, error);
          erros.push(`${format(novaData, 'dd/MM/yyyy')} (erro na criação)`);
        }
      }
      
      // Feedback para o usuário
      if (sucessos.length > 0) {
        toast.success(`✅ ${sucessos.length} agenda(s) duplicada(s) com sucesso!`);
      }
      
      if (erros.length > 0) {
        toast.warning(`⚠️ ${erros.length} erro(s) encontrado(s). Verifique os detalhes.`);
      }
      
      return { 
        sucesso: sucessos.length, 
        erros: erros.length, 
        detalhes: [...sucessos.map(s => `✅ ${s}`), ...erros.map(e => `❌ ${e}`)]
      };
      
    } catch (error) {
      console.error('Erro inesperado na duplicação:', error);
      toast.error('Erro inesperado na duplicação');
      return { sucesso: 0, erros: 1, detalhes: ['Erro inesperado'] };
    } finally {
      setLoading(false);
    }
  };

  return {
    duplicarAgenda,
    loading
  };
} 