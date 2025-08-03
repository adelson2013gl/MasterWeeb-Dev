import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FormCriacaoAgenda, FormEdicaoAgenda } from '@/types/agenda';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { safeStatus } from "@/lib/enumSafety";

interface Cidade {
  id: string;
  nome: string;
  estado: string;
}

interface Regiao {
  id: string;
  nome: string;
  cidade_id: string;
}

interface Turno {
  id: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
}

export function useCriacaoAgendas() {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { empresa } = useEmpresaUnificado();

  useEffect(() => {
    loadCidades();
    loadTurnos();
  }, []);

  useEffect(() => {
    if (cidadeSelecionada && cidadeSelecionada !== 'all') {
      loadRegioes(cidadeSelecionada);
    } else {
      loadTodasRegioes();
    }
  }, [cidadeSelecionada]);

  const loadCidades = async () => {
    try {
      const { data, error } = await supabase
        .from('cidades')
        .select('id, nome, estado')
        .eq('ativo', true)
        .eq('empresa_id', empresa.id)
        .order('nome');

      if (error) throw error;
      setCidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      toast.error('Erro ao carregar cidades');
    }
  };

  const loadRegioes = async (cidadeId: string) => {
    if (!empresa) return;
    
    try {
      const { data, error } = await supabase
        .from('regioes')
        .select('id, nome, cidade_id')
        .eq('cidade_id', cidadeId)
        .eq('ativo', true)
        .eq('empresa_id', empresa.id)
        .order('nome');

      if (error) throw error;
      setRegioes(data || []);
    } catch (error) {
      console.error('Erro ao carregar regiões:', error);
      toast.error('Erro ao carregar regiões');
    }
  };

  const loadTodasRegioes = async () => {
    try {
      const { data, error } = await supabase
        .from('regioes')
        .select('id, nome, cidade_id')
        .eq('ativo', true)
        .eq('empresa_id', empresa.id)
        .order('nome');

      if (error) throw error;
      setRegioes(data || []);
    } catch (error) {
      console.error('Erro ao carregar regiões:', error);
      toast.error('Erro ao carregar regiões');
    }
  };

  const loadTurnos = async () => {
    try {
      const { data, error } = await supabase
        .from('turnos')
        .select('id, nome, hora_inicio, hora_fim')
        .eq('ativo', true)
        .eq('empresa_id', empresa.id)
        .order('hora_inicio');

      if (error) throw error;
      setTurnos(data || []);
    } catch (error) {
      console.error('Erro ao carregar turnos:', error);
      toast.error('Erro ao carregar turnos');
    }
  };

  const criarAgenda = async (data: FormCriacaoAgenda) => {
    if (!data.data) {
      toast.error('Selecione uma data');
      return;
    }

    if (data.turno_ids.length === 0) {
      toast.error('Selecione pelo menos um turno');
      return;
    }

    setLoading(true);
    try {
      const dataFormatada = format(data.data, 'yyyy-MM-dd');
      console.log('Criando agendas para data:', dataFormatada);
  
      // Verificar se já existem agendas para esta data, turnos e região
      const { data: existingAgendas } = await supabase
        .from('agendas')
        .select('id, turno_id')
        .eq('data_agenda', dataFormatada)
        .eq('regiao_id', data.regiao_id)
        .in('turno_id', data.turno_ids);
  
      if (existingAgendas && existingAgendas.length > 0) {
        const turnosComConflito = existingAgendas.map(agenda => {
          const turno = turnos.find(t => t.id === agenda.turno_id);
          return turno ? turno.nome : 'Desconhecido';
        });
        toast.error(`Já existem agendas para os turnos: ${turnosComConflito.join(', ')}`);
        return;
      }
  
      // Criar uma agenda para cada turno selecionado
      const agendas = data.turno_ids.map(turno_id => ({
        data_agenda: dataFormatada,  // CORRIGIDO: campo correto do banco
        turno_id,
        regiao_id: data.regiao_id,
        vagas_disponiveis: data.vagas_disponiveis,
        vagas_ocupadas: 0,  // ADICIONADO: valor inicial
        permite_reserva: data.permite_reserva || false,  // CORRIGIDO: valor padrão
        ativo: true,  // ADICIONADO: valor padrão
        empresa_id: empresa.id,
      }));
  
      const { error } = await supabase
        .from('agendas')
        .insert(agendas);
  
      if (error) throw error;
  
      toast.success(`${agendas.length} agenda(s) criada(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao criar agendas:', error);
      toast.error('Erro ao criar agendas');
    } finally {
      setLoading(false);
    }
  };

  const atualizarAgenda = async (agendaId: string, data: FormEdicaoAgenda, vagasOcupadas: number) => {
    setLoading(true);
    try {
      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('agenda_id', agendaId)
        .eq('status', safeStatus('agendado'));

      const hasAgendamentos = agendamentos && agendamentos.length > 0;

      if (data.vagas_disponiveis < vagasOcupadas) {
        toast.error(`Não é possível reduzir as vagas para menos que ${vagasOcupadas} (vagas já ocupadas)`);
        return;
      }

      const { error } = await supabase
        .from('agendas')
        .update({
          vagas_disponiveis: data.vagas_disponiveis,
          permite_reserva: data.permite_reserva,
          turno_id: data.turno_id,
          regiao_id: data.regiao_id,
        })
        .eq('id', agendaId);

      if (error) throw error;

      toast.success('Agenda atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar agenda:', error);
      toast.error('Erro ao atualizar agenda');
    } finally {
      setLoading(false);
    }
  };

  const cancelarAgenda = async (agendaId: string) => {
    try {
      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('agenda_id', agendaId)
        .eq('status', safeStatus('agendado'));
      if (agendamentos && agendamentos.length > 0) {
        toast.error('Não é possível cancelar uma agenda que possui agendamentos ativos');
        return;
      }

      const { error } = await supabase
        .from('agendas')
        .update({ ativo: false })
        .eq('id', agendaId);

      if (error) throw error;

      toast.success('Agenda cancelada com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar agenda:', error);
      toast.error('Erro ao cancelar agenda');
    }
  };

  return {
    cidades,
    regioes,
    turnos,
    cidadeSelecionada,
    loading,
    setCidadeSelecionada,
    criarAgenda,
    atualizarAgenda,
    cancelarAgenda,
    refetch: () => {
      loadCidades();
      loadTurnos();
      if (cidadeSelecionada) {
        loadRegioes(cidadeSelecionada);
      }
    }
  };
}
