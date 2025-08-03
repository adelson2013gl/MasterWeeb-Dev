
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getCronJobStatus } from '@/utils/verifyExpiryFunctions';

export interface ExpirySchedulerResult {
  success: boolean;
  message: string;
  stats?: any;
  companiesSuspended?: number;
  errors?: string[];
  timestamp: string;
  method?: 'cron' | 'edge_function';
}

export interface ExpirySchedulerConfig {
  enabled: boolean;
  token: string;
  lastExecution?: string;
  nextExecution?: string;
  autoScheduleUrl?: string;
  preferredMethod?: 'cron' | 'edge_function';
}

class ExpirySchedulerService {
  private functionUrl: string;

  constructor() {
    // Construir URL da Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nfwdgkjrkmrjsfnbmsrd.supabase.co';
    this.functionUrl = `${supabaseUrl}/functions/v1/check-expiry-scheduler`;
  }

  async executeManual(token?: string): Promise<ExpirySchedulerResult> {
    try {
      logger.info('Executando verificação manual de vencimento', {}, 'EXPIRY_SCHEDULER');

      // Verificar se CRON está ativo e preferir ele
      const cronStatus = await getCronJobStatus();
      
      if (cronStatus.success && cronStatus.job?.active) {
        // Usar método direto (CRON está ativo)
        return await this.executeDirectly();
      } else {
        // Usar Edge Function como fallback
        if (!token) {
          throw new Error('Token obrigatório para execução via Edge Function');
        }
        return await this.executeViaEdgeFunction(token);
      }

    } catch (error: any) {
      logger.error('Erro na execução manual', { error: error.message }, 'EXPIRY_SCHEDULER');
      throw error;
    }
  }

  private async executeDirectly(): Promise<ExpirySchedulerResult> {
    try {
      // Obter estatísticas antes
      const { data: preStats } = await supabase.rpc('get_expiry_stats');
      
      // Executar verificação de vencimento
      const { error: checkError } = await supabase.rpc('check_empresa_expiry');
      
      if (checkError) {
        throw checkError;
      }
      
      // Obter estatísticas depois
      const { data: postStats } = await supabase.rpc('get_expiry_stats');
      
      const companiesSuspended = preStats && postStats 
        ? Math.max(0, (preStats.total || 0) - (postStats.total || 0))
        : 0;

      const result: ExpirySchedulerResult = {
        success: true,
        message: `Verificação executada via CRON (${companiesSuspended} empresas suspensas)`,
        stats: postStats,
        companiesSuspended,
        timestamp: new Date().toISOString(),
        method: 'cron'
      };

      logger.info('Verificação via CRON concluída', { result }, 'EXPIRY_SCHEDULER');
      return result;

    } catch (error: any) {
      logger.error('Erro na execução direta via CRON', { error: error.message }, 'EXPIRY_SCHEDULER');
      throw error;
    }
  }

  private async executeViaEdgeFunction(token: string): Promise<ExpirySchedulerResult> {
    try {
      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-scheduler-token': token,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          source: 'manual_admin',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: ExpirySchedulerResult = await response.json();
      result.method = 'edge_function';
      
      logger.info('Verificação via Edge Function concluída', { result }, 'EXPIRY_SCHEDULER');
      return result;

    } catch (error: any) {
      logger.error('Erro na execução via Edge Function', { error: error.message }, 'EXPIRY_SCHEDULER');
      throw error;
    }
  }

  async getConfig(): Promise<ExpirySchedulerConfig | null> {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', 'expiry_scheduler_config')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data?.valor || null;
    } catch (error: any) {
      logger.error('Erro ao obter configuração do scheduler', { error: error.message }, 'EXPIRY_SCHEDULER');
      return null;
    }
  }

  async saveConfig(config: ExpirySchedulerConfig): Promise<void> {
    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .upsert({
          chave: 'expiry_scheduler_config',
          valor: config,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      logger.info('Configuração do scheduler salva', { config }, 'EXPIRY_SCHEDULER');
    } catch (error: any) {
      logger.error('Erro ao salvar configuração do scheduler', { error: error.message }, 'EXPIRY_SCHEDULER');
      throw error;
    }
  }

  async getSystemStatus(): Promise<{
    cronAvailable: boolean;
    cronActive: boolean;
    edgeFunctionAvailable: boolean;
    preferredMethod: 'cron' | 'edge_function';
  }> {
    const cronStatus = await getCronJobStatus();
    const config = await this.getConfig();
    
    return {
      cronAvailable: cronStatus.success,
      cronActive: cronStatus.success && cronStatus.job?.active === true,
      edgeFunctionAvailable: true, // Edge Function sempre disponível
      preferredMethod: cronStatus.success && cronStatus.job?.active ? 'cron' : 'edge_function'
    };
  }

  generateCronJobUrl(token: string): string {
    return `curl -X POST "${this.functionUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-scheduler-token: ${token}" \\
  -d '{"source": "external_cron", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'`;
  }

  generateZapierWebhookData(token: string) {
    return {
      url: this.functionUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-scheduler-token': token
      },
      body: {
        source: 'zapier',
        timestamp: '{{zap_meta_human_now}}'
      }
    };
  }

  async getExecutionHistory(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('logs_sistema')
        .select('evento, detalhes, created_at')
        .in('evento', ['scheduler_expiry_check', 'empresa_suspensa_vencimento', 'cron_expiry_configured'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      logger.error('Erro ao obter histórico de execuções', { error: error.message }, 'EXPIRY_SCHEDULER');
      return [];
    }
  }
}

export const expirySchedulerService = new ExpirySchedulerService();
