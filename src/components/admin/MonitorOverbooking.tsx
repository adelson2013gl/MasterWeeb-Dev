import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { safeStatus } from "@/lib/enumSafety";

interface AgendaInconsistency {
  agenda_id: string;
  data_agenda: string;
  vagas_disponiveis: number;
  vagas_ocupadas: number;
  agendamentos_reais: number;
  ocupacao_percentual: number;
  inconsistente: boolean;
}

/**
 * Componente para monitorar inconsistências de overbooking
 * CORRIGIDO: Agora com tratamento robusto de erros e fallback
 */
export function MonitorOverbooking() {
  const [inconsistencias, setInconsistencias] = useState<AgendaInconsistency[]>([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarInconsistencias = async () => {
    try {
      setLoading(true);
      setErro(null);
      logger.info('🔍 Verificando inconsistências de agendas (modo simplificado)');

      // Implementação simplificada sem RPC
      await verificacaoManualFallback();

    } catch (error: any) {
      logger.error('💥 Erro inesperado ao verificar consistência', { error });
      setErro(`Erro inesperado: ${error.message}`);
      toast.error('Erro inesperado ao verificar consistência');
    } finally {
      setLoading(false);
    }
  };

  const verificacaoManualFallback = async () => {
    try {
      logger.info('🔄 Executando verificação manual');

      // Buscar todas as agendas ativas
      const { data: agendas, error: agendasError } = await supabase
        .from('agendas')
        .select('id, data_agenda, vagas_disponiveis, vagas_ocupadas')
        .eq('ativo', true);

      if (agendasError) {
        throw new Error(`Erro ao buscar agendas: ${agendasError.message}`);
      }

      const inconsistenciasManual: AgendaInconsistency[] = [];

      // Verificar cada agenda individualmente
      for (const agenda of agendas || []) {
        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('id')
          .eq('agenda_id', agenda.id)
          .eq('status', safeStatus('agendado'));

        if (agendamentosError) {
          logger.error(`❌ Erro ao contar agendamentos da agenda ${agenda.id}`, { error: agendamentosError });
          continue;
        }

        const agendamentosReais = agendamentos?.length || 0;
        const ocupacaoPercentual = agenda.vagas_disponiveis > 0 
          ? (agenda.vagas_ocupadas / agenda.vagas_disponiveis) * 100 
          : 0;
        const inconsistente = agenda.vagas_ocupadas !== agendamentosReais || agenda.vagas_ocupadas > agenda.vagas_disponiveis;

        if (inconsistente) {
          inconsistenciasManual.push({
            agenda_id: agenda.id,
            data_agenda: agenda.data_agenda,
            vagas_disponiveis: agenda.vagas_disponiveis,
            vagas_ocupadas: agenda.vagas_ocupadas,
            agendamentos_reais: agendamentosReais,
            ocupacao_percentual: Number(ocupacaoPercentual.toFixed(1)),
            inconsistente: true
          });
        }
      }

      setInconsistencias(inconsistenciasManual);
      
      if (inconsistenciasManual.length > 0) {
        toast.warning(`⚠️ ${inconsistenciasManual.length} inconsistência(s) detectada(s)`);
      } else {
        toast.success('✅ Todas as agendas estão consistentes!');
      }
      
      logger.info('✅ Verificação manual concluída', {
        totalAgendas: agendas?.length || 0,
        inconsistencias: inconsistenciasManual.length
      });

    } catch (error: any) {
      logger.error('💥 Erro na verificação manual', { error });
      setErro(`Erro na verificação: ${error.message}`);
    }
  };

  const sincronizarVagas = async () => {
    try {
      setSincronizando(true);
      logger.info('🔄 Iniciando sincronização de vagas');

      // Buscar todas as agendas ativas
      const { data: agendas, error: agendasError } = await supabase
        .from('agendas')
        .select('id')
        .eq('ativo', true);

      if (agendasError) {
        logger.error('❌ Erro ao buscar agendas', { error: agendasError });
        toast.error('Erro ao buscar agendas para sincronização');
        return;
      }

      // Sincronizar cada agenda individualmente
      let sincronizadas = 0;
      for (const agenda of agendas || []) {
        // Contar agendamentos reais
        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('id')
          .eq('agenda_id', agenda.id)
          .eq('status', safeStatus('agendado'));

        if (agendamentosError) {
          logger.error('❌ Erro ao contar agendamentos', { agendaId: agenda.id, error: agendamentosError });
          continue;
        }

        const vagasOcupadasReais = agendamentos?.length || 0;

        // Atualizar a agenda com o valor correto
        const { error: updateError } = await supabase
          .from('agendas')
          .update({ 
            vagas_ocupadas: vagasOcupadasReais,
            updated_at: new Date().toISOString()
          })
          .eq('id', agenda.id);

        if (updateError) {
          logger.error('❌ Erro ao atualizar agenda', { agendaId: agenda.id, error: updateError });
        } else {
          sincronizadas++;
        }
      }

      logger.info('✅ Sincronização de vagas concluída', { 
        totalAgendas: agendas?.length || 0,
        sincronizadas 
      });
      
      toast.success(`✅ Sincronização concluída: ${sincronizadas} agendas atualizadas`);
      
      // Recarregar dados após sincronização
      await carregarInconsistencias();

    } catch (error: any) {
      logger.error('💥 Erro inesperado na sincronização', { error });
      toast.error('Erro inesperado na sincronização');
    } finally {
      setSincronizando(false);
    }
  };

  useEffect(() => {
    carregarInconsistencias();
    
    // Verificar inconsistências a cada 30 segundos
    const interval = setInterval(carregarInconsistencias, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (item: AgendaInconsistency) => {
    if (item.vagas_ocupadas > item.vagas_disponiveis) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        OVERBOOKING
      </Badge>;
    }
    
    if (item.vagas_ocupadas !== item.agendamentos_reais) {
      return <Badge variant="secondary">DESSINCRONIA</Badge>;
    }

    return <Badge variant="default">OK</Badge>;
  };

  const getOcupacaoColor = (percentual: number) => {
    if (percentual > 100) return 'text-red-600 font-bold';
    if (percentual > 80) return 'text-orange-600 font-semibold';
    if (percentual > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monitor de Overbooking
            {erro && <AlertCircle className="h-4 w-4 text-red-500" />}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Detecta e corrige inconsistências em tempo real
          </p>
          {erro && (
            <p className="text-sm text-red-600 mt-1 font-medium">
              ⚠️ {erro}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarInconsistencias}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
          
          {inconsistencias.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={sincronizarVagas}
              disabled={sincronizando}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Verificando consistência...</span>
          </div>
        )}

        {!loading && erro && inconsistencias.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600">
              ⚠️ Erro na Verificação
            </h3>
            <p className="text-muted-foreground mb-4">
              {erro}
            </p>
            <Button variant="outline" onClick={carregarInconsistencias}>
              Tentar Novamente
            </Button>
          </div>
        )}

        {!loading && !erro && inconsistencias.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600">
              ✅ Tudo Consistente!
            </h3>
            <p className="text-muted-foreground">
              Nenhuma inconsistência detectada nas agendas
            </p>
          </div>
        )}

        {!loading && inconsistencias.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-600">
                ⚠️ {inconsistencias.length} Inconsistência(s) Detectada(s)
              </h3>
            </div>

            <div className="space-y-3">
              {inconsistencias.map((item, index) => (
                <div 
                  key={index}
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-600">
                        {item.agenda_id.slice(0, 8)}...
                      </span>
                      <span className="text-sm">
                        {new Date(item.data_agenda).toLocaleDateString('pt-BR')}
                      </span>
                      {getStatusBadge(item)}
                    </div>
                    <span className={`text-sm ${getOcupacaoColor(item.ocupacao_percentual)}`}>
                      {item.ocupacao_percentual}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Vagas Disponíveis:</span>
                      <div className="font-semibold">{item.vagas_disponiveis}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Vagas Ocupadas (Sistema):</span>
                      <div className={`font-semibold ${
                        item.vagas_ocupadas > item.vagas_disponiveis ? 'text-red-600' : ''
                      }`}>
                        {item.vagas_ocupadas}

                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Agendamentos Reais:</span>
                      <div className="font-semibold">{item.agendamentos_reais}</div>
                    </div>
                  </div>

                  {item.vagas_ocupadas > item.vagas_disponiveis && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                      <strong>🚨 OVERBOOKING CRÍTICO:</strong> Mais vagas ocupadas que disponíveis!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
