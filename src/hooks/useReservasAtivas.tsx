import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { logger } from "@/lib/logger";
import { safeStatus, safeTipo } from "@/lib/enumSafety";

interface ReservaAtiva {
  id: string;
  agenda_id: string;
  status: 'pendente' | 'confirmada';
  created_at: string;
  entregador: {
    nome: string;
    estrelas: number;
  };
  agenda: {
    data: string;
    turno: {
      nome: string;
      hora_inicio: string;
      hora_fim: string;
    };
    regiao: {
      nome: string;
      cidade: {
        nome: string;
      };
    };
  };
}

interface ReservasStats {
  totalReservas: number;
  reservasPendentes: number;
  reservasConfirmadas: number;
  reservasHoje: number;
  reservasProximos7Dias: number;
}

export function useReservasAtivas() {
  const { empresa } = useEmpresaUnificado();
  const [reservas, setReservas] = useState<ReservaAtiva[]>([]);
  const [stats, setStats] = useState<ReservasStats>({
    totalReservas: 0,
    reservasPendentes: 0,
    reservasConfirmadas: 0,
    reservasHoje: 0,
    reservasProximos7Dias: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchReservasAtivas = async () => {
    if (!empresa?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('🔍 Buscando reservas ativas para empresa:', { empresaId: empresa.id }, 'RESERVAS_ATIVAS');

      const hoje = new Date().toISOString().split('T')[0];
      const seteDiasFrente = new Date();
      seteDiasFrente.setDate(seteDiasFrente.getDate() + 7);
      const seteDiasFrenteStr = seteDiasFrente.toISOString().split('T')[0];

      // Buscar agendamentos ativos (pendentes e confirmados) 
      const { data: reservasData, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          status,
          created_at,
          cliente_nome,
          endereco_coleta,
          endereco_entrega,
          data_agendamento,
          entregadores!agendamentos_entregador_id_fkey (
            nome
          )
        `)
        .eq('empresa_id', empresa.id)
        .in('status', [safeStatus('pendente'), safeStatus('confirmada')])
        .gte('data_agendamento', hoje)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Erro ao buscar reservas ativas', { error }, 'RESERVAS_ATIVAS');
        throw error;
      }

      // Processar dados das reservas
      const reservasFormatadas: ReservaAtiva[] = reservasData?.map(item => ({
        id: item.id,
        agenda_id: item.agenda_id,
        status: item.status as 'pendente' | 'confirmada',
        created_at: item.created_at,
        entregador: {
          nome: item.entregadores?.nome || 'N/A'
        },
        agenda: {
          data: item.agendas?.data_agenda || '',
          turno: {
            nome: item.agendas?.turnos?.nome || 'N/A',
            hora_inicio: item.agendas?.turnos?.hora_inicio || '',
            hora_fim: item.agendas?.turnos?.hora_fim || ''
          },
          regiao: {
            nome: item.agendas?.regioes?.nome || 'N/A',
            cidade: {
              nome: item.agendas?.regioes?.cidades?.nome || 'N/A'
            }
          }
        }
      })) || [];

      // Calcular estatísticas
      const totalReservas = reservasFormatadas.length;
      const reservasPendentes = reservasFormatadas.filter(r => r.status === 'pendente').length;
      const reservasConfirmadas = reservasFormatadas.filter(r => r.status === 'confirmada').length;
      const reservasHoje = reservasFormatadas.filter(r => r.agenda.data === hoje).length;
      const reservasProximos7Dias = reservasFormatadas.filter(r => 
        r.agenda.data >= hoje && r.agenda.data <= seteDiasFrenteStr
      ).length;

      const novasStats: ReservasStats = {
        totalReservas,
        reservasPendentes,
        reservasConfirmadas,
        reservasHoje,
        reservasProximos7Dias
      };

      setReservas(reservasFormatadas);
      setStats(novasStats);

      logger.info('✅ Reservas ativas carregadas', {
        total: totalReservas,
        pendentes: reservasPendentes,
        confirmadas: reservasConfirmadas,
        hoje: reservasHoje,
        proximos7Dias: reservasProximos7Dias
      }, 'RESERVAS_ATIVAS');

    } catch (error) {
      logger.error('💥 Erro ao buscar reservas ativas', { error }, 'RESERVAS_ATIVAS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservasAtivas();
  }, [empresa?.id]);

  return {
    reservas,
    stats,
    loading,
    refetch: fetchReservasAtivas
  };
}