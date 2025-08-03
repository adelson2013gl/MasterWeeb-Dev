import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface ConfiguracaoSistema {
  id: string;
  chave: string;
  valor: string | null;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  categoria: string;
  descricao: string | null;
  sensivel: boolean;
  ambiente: 'test' | 'production';
  created_at: string;
  updated_at: string;
}

export interface MercadoPagoConfig {
  publicKey: string;
  accessToken: string;
  environment: 'test' | 'production';
  webhookUrl: string;
  frontendUrl: string;
}

class ConfiguracoesService {
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  async obterConfiguracao(chave: string): Promise<string | null> {
    try {
      // Verificar cache primeiro
      if (this.isValidCache(chave)) {
        return this.cache.get(chave);
      }

      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', chave)
        .single();

      if (error) {
        logger.error('Erro ao obter configuração', { chave, error });
        return null;
      }

      // Atualizar cache
      this.cache.set(chave, data.valor);
      this.cacheExpiry.set(chave, Date.now() + this.CACHE_TTL);

      return data.valor;
    } catch (error) {
      logger.error('Erro ao obter configuração', { chave, error });
      return null;
    }
  }

  async obterConfiguracoesPorCategoria(categoria: string): Promise<ConfiguracaoSistema[]> {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .eq('categoria', categoria)
        .order('chave');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Erro ao obter configurações por categoria', { categoria, error });
      return [];
    }
  }

  async obterTodasConfiguracoes(): Promise<ConfiguracaoSistema[]> {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .order('categoria', { ascending: true })
        .order('chave', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Erro ao obter todas as configurações', { error });
      return [];
    }
  }

  async atualizarConfiguracao(chave: string, valor: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .update({ 
          valor, 
          updated_at: new Date().toISOString() 
        })
        .eq('chave', chave);

      if (error) throw error;

      // Limpar cache
      this.cache.delete(chave);
      this.cacheExpiry.delete(chave);

      logger.info('Configuração atualizada', { chave });
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar configuração', { chave, error });
      return false;
    }
  }

  async atualizarMultiplasConfiguracoes(configuracoes: { chave: string; valor: string }[]): Promise<boolean> {
    try {
      const promises = configuracoes.map(config => 
        this.atualizarConfiguracao(config.chave, config.valor)
      );
      
      const resultados = await Promise.all(promises);
      const sucesso = resultados.every(resultado => resultado);
      
      if (sucesso) {
        logger.info('Múltiplas configurações atualizadas', { 
          quantidade: configuracoes.length,
          chaves: configuracoes.map(c => c.chave)
        });
      }
      
      return sucesso;
    } catch (error) {
      logger.error('Erro ao atualizar múltiplas configurações', { error });
      return false;
    }
  }

  async obterConfigMercadoPago(): Promise<MercadoPagoConfig> {
    try {
      const ambiente = await this.obterConfiguracao('mercadopago_environment') || 'test';
      const suffix = ambiente === 'test' ? '_test' : '_prod';

      const [publicKey, accessToken, webhookUrl, frontendUrl] = await Promise.all([
        this.obterConfiguracao(`mercadopago_public_key${suffix}`),
        this.obterConfiguracao(`mercadopago_access_token${suffix}`),
        this.obterConfiguracao('webhook_url'),
        this.obterConfiguracao('frontend_url')
      ]);

      return {
        publicKey: publicKey || '',
        accessToken: accessToken || '',
        environment: ambiente as 'test' | 'production',
        webhookUrl: webhookUrl || '',
        frontendUrl: frontendUrl || 'http://localhost:8080'
      };
    } catch (error) {
      logger.error('Erro ao obter configurações do Mercado Pago', { error });
      return {
        publicKey: '',
        accessToken: '',
        environment: 'test',
        webhookUrl: '',
        frontendUrl: 'http://localhost:8080'
      };
    }
  }

  async criarConfiguracao(configuracao: Omit<ConfiguracaoSistema, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .insert(configuracao);

      if (error) throw error;

      logger.info('Nova configuração criada', { chave: configuracao.chave });
      return true;
    } catch (error) {
      logger.error('Erro ao criar configuração', { configuracao, error });
      return false;
    }
  }

  async excluirConfiguracao(chave: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .delete()
        .eq('chave', chave);

      if (error) throw error;

      // Limpar cache
      this.cache.delete(chave);
      this.cacheExpiry.delete(chave);

      logger.info('Configuração excluída', { chave });
      return true;
    } catch (error) {
      logger.error('Erro ao excluir configuração', { chave, error });
      return false;
    }
  }

  private isValidCache(chave: string): boolean {
    const expiry = this.cacheExpiry.get(chave);
    return expiry ? Date.now() < expiry : false;
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    logger.info('Cache de configurações limpo');
  }

  // Método para validar configurações críticas
  async validarConfiguracoesCriticas(): Promise<{ validas: boolean; erros: string[] }> {
    const erros: string[] = [];
    
    try {
      const config = await this.obterConfigMercadoPago();
      
      if (!config.publicKey) {
        erros.push('Chave pública do Mercado Pago não configurada');
      }
      
      if (!config.accessToken) {
        erros.push('Token de acesso do Mercado Pago não configurado');
      }
      
      if (!config.webhookUrl) {
        erros.push('URL do webhook não configurada');
      }
      
      if (!config.frontendUrl) {
        erros.push('URL do frontend não configurada');
      }
      
      return {
        validas: erros.length === 0,
        erros
      };
    } catch (error) {
      logger.error('Erro ao validar configurações críticas', { error });
      return {
        validas: false,
        erros: ['Erro interno ao validar configurações']
      };
    }
  }
}

export const configuracoesService = new ConfiguracoesService();