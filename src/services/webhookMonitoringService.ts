// Serviço para monitoramento e gestão de webhooks do Mercado Pago
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface WebhookStats {
  total: number;
  processados: number;
  falhados: number;
  invalidos: number;
  pendentes: number;
  tempoMedioMs: number;
  tempoMaximoMs: number;
}

export interface WebhookRecord {
  id: string;
  webhook_id: string;
  tipo: string;
  acao?: string;
  status: 'received' | 'processing' | 'processed' | 'failed' | 'invalid';
  request_id?: string;
  error_message?: string;
  processing_time_ms?: number;
  signature_validated: boolean;
  retry_count: number;
  created_at: string;
  updated_at: string;
  payload?: any;
}

export interface WebhookFilter {
  tipo?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  limit?: number;
  offset?: number;
}

class WebhookMonitoringService {
  
  // Obter estatísticas gerais dos webhooks
  async getWebhookStats(dias: number = 7): Promise<WebhookStats> {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - dias);

      const { data, error } = await supabase
        .from('mercadopago_webhooks')
        .select('status, processing_time_ms')
        .gte('created_at', dataInicio.toISOString());

      if (error) {
        logger.error('Erro ao buscar estatísticas de webhooks', error);
        throw error;
      }

      const stats = data.reduce((acc, webhook) => {
        acc.total++;
        switch (webhook.status) {
          case 'processed':
            acc.processados++;
            break;
          case 'failed':
            acc.falhados++;
            break;
          case 'invalid':
            acc.invalidos++;
            break;
          case 'received':
          case 'processing':
            acc.pendentes++;
            break;
        }

        if (webhook.processing_time_ms) {
          acc.tempos.push(webhook.processing_time_ms);
        }

        return acc;
      }, {
        total: 0,
        processados: 0,
        falhados: 0,
        invalidos: 0,
        pendentes: 0,
        tempos: [] as number[]
      });

      const tempoMedioMs = stats.tempos.length > 0 
        ? stats.tempos.reduce((sum, time) => sum + time, 0) / stats.tempos.length 
        : 0;
      
      const tempoMaximoMs = stats.tempos.length > 0 
        ? Math.max(...stats.tempos) 
        : 0;

      return {
        total: stats.total,
        processados: stats.processados,
        falhados: stats.falhados,
        invalidos: stats.invalidos,
        pendentes: stats.pendentes,
        tempoMedioMs: Math.round(tempoMedioMs),
        tempoMaximoMs
      };

    } catch (error) {
      logger.error('Erro ao obter estatísticas de webhooks', error);
      throw new Error('Erro ao obter estatísticas de webhooks');
    }
  }

  // Obter lista de webhooks com filtros
  async getWebhooks(filter: WebhookFilter = {}): Promise<{ data: WebhookRecord[]; total: number }> {
    try {
      let query = supabase
        .from('mercadopago_webhooks')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filter.tipo) {
        query = query.eq('tipo', filter.tipo);
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.dataInicio) {
        query = query.gte('created_at', filter.dataInicio);
      }

      if (filter.dataFim) {
        query = query.lte('created_at', filter.dataFim);
      }

      // Paginação
      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Erro ao buscar webhooks', error);
        throw error;
      }

      return {
        data: data || [],
        total: count || 0
      };

    } catch (error) {
      logger.error('Erro ao obter lista de webhooks', error);
      throw new Error('Erro ao obter lista de webhooks');
    }
  }

  // Obter detalhes de um webhook específico
  async getWebhookById(id: string): Promise<WebhookRecord | null> {
    try {
      const { data, error } = await supabase
        .from('mercadopago_webhooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Webhook não encontrado
        }
        logger.error('Erro ao buscar webhook por ID', error);
        throw error;
      }

      return data;

    } catch (error) {
      logger.error('Erro ao obter webhook por ID', error);
      throw new Error('Erro ao obter webhook');
    }
  }

  // Reprocessar webhook falhado
  async reprocessWebhook(webhookId: string): Promise<boolean> {
    try {
      // Buscar webhook
      const webhook = await this.getWebhookById(webhookId);
      
      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      if (webhook.status === 'processed') {
        throw new Error('Webhook já foi processado com sucesso');
      }

      // Incrementar contador de retry
      const { error: updateError } = await supabase
        .from('mercadopago_webhooks')
        .update({
          status: 'received',
          retry_count: webhook.retry_count + 1,
          last_retry_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', webhookId);

      if (updateError) {
        logger.error('Erro ao atualizar webhook para reprocessamento', updateError);
        throw updateError;
      }

      // Aqui você pode implementar a lógica para reenviar o webhook
      // para a Edge Function ou reprocessar localmente
      logger.info('Webhook marcado para reprocessamento', { webhookId });

      return true;

    } catch (error) {
      logger.error('Erro ao reprocessar webhook', error);
      throw new Error(`Erro ao reprocessar webhook: ${error.message}`);
    }
  }

  // Marcar webhook como processado manualmente
  async markAsProcessed(webhookId: string, note?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('mercadopago_webhooks')
        .update({
          status: 'processed',
          processado: true,
          error_message: note || 'Marcado como processado manualmente',
          updated_at: new Date().toISOString()
        })
        .eq('id', webhookId);

      if (error) {
        logger.error('Erro ao marcar webhook como processado', error);
        throw error;
      }

      logger.info('Webhook marcado como processado manualmente', { webhookId, note });
      return true;

    } catch (error) {
      logger.error('Erro ao marcar webhook como processado', error);
      throw new Error(`Erro ao marcar webhook como processado: ${error.message}`);
    }
  }

  // Obter estatísticas por período (para gráficos)
  async getStatsTimeSeries(dias: number = 30): Promise<Array<{
    data: string;
    total: number;
    processados: number;
    falhados: number;
    invalidos: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('vw_mercadopago_webhooks_stats')
        .select('*')
        .gte('data', new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('data', { ascending: true });

      if (error) {
        logger.error('Erro ao buscar série temporal de webhooks', error);
        throw error;
      }

      // Agrupar por data
      const groupedData = data.reduce((acc, row) => {
        const key = row.data;
        if (!acc[key]) {
          acc[key] = {
            data: key,
            total: 0,
            processados: 0,
            falhados: 0,
            invalidos: 0
          };
        }

        acc[key].total += row.total;
        acc[key].processados += row.processados;
        acc[key].falhados += row.falhados;
        acc[key].invalidos += row.invalidos;

        return acc;
      }, {} as Record<string, any>);

      return Object.values(groupedData);

    } catch (error) {
      logger.error('Erro ao obter série temporal de webhooks', error);
      throw new Error('Erro ao obter dados de série temporal');
    }
  }

  // Verificar health dos webhooks
  async getWebhookHealth(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const stats = await this.getWebhookStats(1); // Últimas 24 horas
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Verificar taxa de falha
      const failureRate = stats.total > 0 ? (stats.falhados / stats.total) * 100 : 0;
      
      if (failureRate > 10) {
        issues.push(`Taxa de falha alta: ${failureRate.toFixed(1)}%`);
        recommendations.push('Verificar logs de erro e corrigir problemas recorrentes');
      }

      // Verificar webhooks inválidos
      const invalidRate = stats.total > 0 ? (stats.invalidos / stats.total) * 100 : 0;
      
      if (invalidRate > 5) {
        issues.push(`Taxa de webhooks inválidos alta: ${invalidRate.toFixed(1)}%`);
        recommendations.push('Verificar configuração do secret e validação de assinatura');
      }

      // Verificar tempo de processamento
      if (stats.tempoMedioMs > 5000) {
        issues.push(`Tempo de processamento alto: ${stats.tempoMedioMs}ms`);
        recommendations.push('Otimizar processamento de webhooks');
      }

      // Verificar webhooks pendentes
      if (stats.pendentes > 10) {
        issues.push(`Muitos webhooks pendentes: ${stats.pendentes}`);
        recommendations.push('Verificar se o processamento está funcionando corretamente');
      }

      const isHealthy = issues.length === 0;

      return {
        isHealthy,
        issues,
        recommendations
      };

    } catch (error) {
      logger.error('Erro ao verificar health dos webhooks', error);
      return {
        isHealthy: false,
        issues: ['Erro ao verificar status dos webhooks'],
        recommendations: ['Verificar conectividade com o banco de dados']
      };
    }
  }

  // Limpar webhooks antigos (manutenção)
  async cleanupOldWebhooks(diasParaManter: number = 90): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasParaManter);

      const { data, error } = await supabase
        .from('mercadopago_webhooks')
        .delete()
        .lt('created_at', dataLimite.toISOString())
        .select('id');

      if (error) {
        logger.error('Erro ao limpar webhooks antigos', error);
        throw error;
      }

      const deletedCount = data?.length || 0;
      logger.info(`Limpeza de webhooks concluída: ${deletedCount} registros removidos`);

      return deletedCount;

    } catch (error) {
      logger.error('Erro ao limpar webhooks antigos', error);
      throw new Error('Erro ao executar limpeza de webhooks');
    }
  }
}

// Instância singleton do serviço
export const webhookMonitoringService = new WebhookMonitoringService();
export default webhookMonitoringService; 