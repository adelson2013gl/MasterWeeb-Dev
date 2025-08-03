// ========================================================================================
// SERVIÇO IUGU - INTEGRAÇÃO COMPLETA COM API
// ========================================================================================

import { logger } from '@/lib/logger';
import {
  IuguConfiguration,
  IuguPlan,
  IuguPlanCreateRequest,
  IuguCustomer,
  IuguCustomerCreateRequest,
  IuguSubscription,
  IuguSubscriptionCreateRequest,
  IuguInvoice,
  IuguWebhook,
  IuguApiResponse,
  IuguPaginatedResponse,
  IuguMetrics,
  IuguConnectionTest,
  IuguPlanSync,
  IuguEnvironment,
  IUGU_ENDPOINTS,
  IUGU_WEBHOOK_EVENTS
} from '@/types/iugu';
import { toast } from 'sonner';

class IuguService {
  private apiKey: string = '';
  private environment: IuguEnvironment = 'sandbox';
  private baseUrl: string = IUGU_ENDPOINTS.BASE_SANDBOX;

  // ========================================================================================
  // CONFIGURAÇÃO E INICIALIZAÇÃO
  // ========================================================================================
  
  /**
   * Configurar credenciais da Iugu
   */
  configure(apiKey: string, environment: IuguEnvironment = 'sandbox') {
    this.apiKey = apiKey;
    this.environment = environment;
    this.baseUrl = environment === 'production' 
      ? IUGU_ENDPOINTS.BASE_PRODUCTION 
      : IUGU_ENDPOINTS.BASE_SANDBOX;
    
    logger.info('🔧 Iugu Service configurado', {
      environment,
      baseUrl: this.baseUrl,
      hasApiKey: !!apiKey
    });
  }

  /**
   * Testar conexão com a API Iugu
   */
  async testConnection(): Promise<IuguConnectionTest> {
    try {
      logger.info('🧪 Testando conexão com Iugu API');
      
      const response = await this.makeRequest('GET', IUGU_ENDPOINTS.ACCOUNT);
      
      if (response.success && response.data) {
        logger.info('✅ Conexão Iugu estabelecida com sucesso', response.data);
        return {
          success: true,
          account_id: response.data.id,
          account_name: response.data.name,
          environment: this.environment
        };
      }
      
      throw new Error(response.message || 'Falha na conexão');
      
    } catch (error) {
      logger.error('❌ Erro ao testar conexão Iugu', { error });
      return {
        success: false,
        environment: this.environment,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // ========================================================================================
  // GERENCIAMENTO DE PLANOS
  // ========================================================================================
  
  /**
   * Listar todos os planos
   */
  async getPlans(page = 1, limit = 100): Promise<IuguPaginatedResponse<IuguPlan>> {
    try {
      logger.info('📋 Buscando planos Iugu', { page, limit });
      
      const response = await this.makeRequest('GET', `${IUGU_ENDPOINTS.PLANS}?page=${page}&limit=${limit}`);
      
      if (response.success) {
        return {
          items: response.data?.items || [],
          total_items: response.data?.totalItems || 0,
          total_pages: response.data?.totalPages || 0,
          page: page,
          per_page: limit
        };
      }
      
      throw new Error(response.message || 'Erro ao buscar planos');
      
    } catch (error) {
      logger.error('❌ Erro ao buscar planos Iugu', { error });
      throw error;
    }
  }

  /**
   * Criar novo plano
   */
  async createPlan(planData: IuguPlanCreateRequest): Promise<IuguPlan> {
    try {
      logger.info('➕ Criando plano Iugu', planData);
      
      const response = await this.makeRequest('POST', IUGU_ENDPOINTS.PLANS, planData);
      
      if (response.success && response.data) {
        logger.info('✅ Plano criado com sucesso', response.data);
        toast.success(`Plano "${planData.name}" criado com sucesso!`);
        return response.data;
      }
      
      throw new Error(response.message || 'Erro ao criar plano');
      
    } catch (error) {
      logger.error('❌ Erro ao criar plano Iugu', { error, planData });
      toast.error('Erro ao criar plano');
      throw error;
    }
  }

  /**
   * Atualizar plano existente
   */
  async updatePlan(planId: string, planData: Partial<IuguPlanCreateRequest>): Promise<IuguPlan> {
    try {
      logger.info('✏️ Atualizando plano Iugu', { planId, planData });
      
      const response = await this.makeRequest('PUT', `${IUGU_ENDPOINTS.PLANS}/${planId}`, planData);
      
      if (response.success && response.data) {
        logger.info('✅ Plano atualizado com sucesso', response.data);
        toast.success('Plano atualizado com sucesso!');
        return response.data;
      }
      
      throw new Error(response.message || 'Erro ao atualizar plano');
      
    } catch (error) {
      logger.error('❌ Erro ao atualizar plano Iugu', { error, planId });
      toast.error('Erro ao atualizar plano');
      throw error;
    }
  }

  /**
   * Deletar plano
   */
  async deletePlan(planId: string): Promise<boolean> {
    try {
      logger.info('🗑️ Deletando plano Iugu', { planId });
      
      const response = await this.makeRequest('DELETE', `${IUGU_ENDPOINTS.PLANS}/${planId}`);
      
      if (response.success) {
        logger.info('✅ Plano deletado com sucesso', { planId });
        toast.success('Plano deletado com sucesso!');
        return true;
      }
      
      throw new Error(response.message || 'Erro ao deletar plano');
      
    } catch (error) {
      logger.error('❌ Erro ao deletar plano Iugu', { error, planId });
      toast.error('Erro ao deletar plano');
      throw error;
    }
  }

  // ========================================================================================
  // GERENCIAMENTO DE CLIENTES
  // ========================================================================================
  
  /**
   * Criar cliente
   */
  async createCustomer(customerData: IuguCustomerCreateRequest): Promise<IuguCustomer> {
    try {
      logger.info('👤 Criando cliente Iugu', customerData);
      
      const response = await this.makeRequest('POST', IUGU_ENDPOINTS.CUSTOMERS, customerData);
      
      if (response.success && response.data) {
        logger.info('✅ Cliente criado com sucesso', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Erro ao criar cliente');
      
    } catch (error) {
      logger.error('❌ Erro ao criar cliente Iugu', { error, customerData });
      throw error;
    }
  }

  /**
   * Buscar cliente por ID
   */
  async getCustomer(customerId: string): Promise<IuguCustomer> {
    try {
      const response = await this.makeRequest('GET', `${IUGU_ENDPOINTS.CUSTOMERS}/${customerId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Cliente não encontrado');
      
    } catch (error) {
      logger.error('❌ Erro ao buscar cliente Iugu', { error, customerId });
      throw error;
    }
  }

  // ========================================================================================
  // GERENCIAMENTO DE ASSINATURAS
  // ========================================================================================
  
  /**
   * Criar assinatura
   */
  async createSubscription(subscriptionData: IuguSubscriptionCreateRequest): Promise<IuguSubscription> {
    try {
      logger.info('📝 Criando assinatura Iugu', subscriptionData);
      
      const response = await this.makeRequest('POST', IUGU_ENDPOINTS.SUBSCRIPTIONS, subscriptionData);
      
      if (response.success && response.data) {
        logger.info('✅ Assinatura criada com sucesso', response.data);
        toast.success('Assinatura criada com sucesso!');
        return response.data;
      }
      
      throw new Error(response.message || 'Erro ao criar assinatura');
      
    } catch (error) {
      logger.error('❌ Erro ao criar assinatura Iugu', { error, subscriptionData });
      toast.error('Erro ao criar assinatura');
      throw error;
    }
  }

  /**
   * Buscar assinatura por ID
   */
  async getSubscription(subscriptionId: string): Promise<IuguSubscription> {
    try {
      const response = await this.makeRequest('GET', `${IUGU_ENDPOINTS.SUBSCRIPTIONS}/${subscriptionId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Assinatura não encontrada');
      
    } catch (error) {
      logger.error('❌ Erro ao buscar assinatura Iugu', { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Suspender assinatura
   */
  async suspendSubscription(subscriptionId: string): Promise<boolean> {
    try {
      logger.info('⏸️ Suspendendo assinatura Iugu', { subscriptionId });
      
      const response = await this.makeRequest('POST', `${IUGU_ENDPOINTS.SUBSCRIPTIONS}/${subscriptionId}/suspend`);
      
      if (response.success) {
        logger.info('✅ Assinatura suspensa com sucesso', { subscriptionId });
        toast.success('Assinatura suspensa com sucesso!');
        return true;
      }
      
      throw new Error(response.message || 'Erro ao suspender assinatura');
      
    } catch (error) {
      logger.error('❌ Erro ao suspender assinatura Iugu', { error, subscriptionId });
      toast.error('Erro ao suspender assinatura');
      throw error;
    }
  }

  /**
   * Reativar assinatura
   */
  async activateSubscription(subscriptionId: string): Promise<boolean> {
    try {
      logger.info('▶️ Reativando assinatura Iugu', { subscriptionId });
      
      const response = await this.makeRequest('POST', `${IUGU_ENDPOINTS.SUBSCRIPTIONS}/${subscriptionId}/activate`);
      
      if (response.success) {
        logger.info('✅ Assinatura reativada com sucesso', { subscriptionId });
        toast.success('Assinatura reativada com sucesso!');
        return true;
      }
      
      throw new Error(response.message || 'Erro ao reativar assinatura');
      
    } catch (error) {
      logger.error('❌ Erro ao reativar assinatura Iugu', { error, subscriptionId });
      toast.error('Erro ao reativar assinatura');
      throw error;
    }
  }

  // ========================================================================================
  // GERENCIAMENTO DE WEBHOOKS
  // ========================================================================================
  
  /**
   * Criar webhook
   */
  async createWebhook(url: string, events: string[] = [], authorization?: string): Promise<IuguWebhook> {
    try {
      logger.info('🔗 Criando webhook Iugu', { url, events, hasAuth: !!authorization });
      
      const webhookData = {
        url,
        authorization,
        events: events.length > 0 ? events : [...IUGU_WEBHOOK_EVENTS]
      };
      
      const response = await this.makeRequest('POST', IUGU_ENDPOINTS.WEBHOOKS, webhookData);
      
      if (response.success && response.data) {
        logger.info('✅ Webhook criado com sucesso', response.data);
        toast.success('Webhook configurado com sucesso!');
        return response.data;
      }
      
      throw new Error(response.message || 'Erro ao criar webhook');
      
    } catch (error) {
      logger.error('❌ Erro ao criar webhook Iugu', { error, url });
      toast.error('Erro ao configurar webhook');
      throw error;
    }
  }

  /**
   * Listar webhooks
   */
  async getWebhooks(): Promise<IuguWebhook[]> {
    try {
      const response = await this.makeRequest('GET', IUGU_ENDPOINTS.WEBHOOKS);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
      
    } catch (error) {
      logger.error('❌ Erro ao buscar webhooks Iugu', { error });
      return [];
    }
  }

  // ========================================================================================
  // MÉTRICAS E DASHBOARD
  // ========================================================================================
  
  /**
   * Obter métricas do dashboard
   */
  async getMetrics(): Promise<IuguMetrics> {
    try {
      logger.info('📊 Buscando métricas Iugu');
      
      // Em uma implementação real, isso seria chamadas separadas para diferentes endpoints
      const [subscriptions, invoices] = await Promise.all([
        this.makeRequest('GET', `${IUGU_ENDPOINTS.SUBSCRIPTIONS}?limit=1000`),
        this.makeRequest('GET', `${IUGU_ENDPOINTS.INVOICES}?limit=1000`)
      ]);
      
      // Calcular métricas básicas
      const metrics: IuguMetrics = {
        total_customers: 0,
        active_subscriptions: 0,
        suspended_subscriptions: 0,
        canceled_subscriptions: 0,
        monthly_recurring_revenue: 0,
        annual_recurring_revenue: 0,
        churn_rate: 0,
        conversion_rate: 0,
        pending_invoices: 0,
        paid_invoices: 0,
        overdue_invoices: 0
      };
      
      // Processar dados das assinaturas
      if (subscriptions.success && subscriptions.data?.items) {
        const subs = subscriptions.data.items as IuguSubscription[];
        metrics.active_subscriptions = subs.filter(s => s.status === 'active').length;
        metrics.suspended_subscriptions = subs.filter(s => s.status === 'suspended').length;
        metrics.canceled_subscriptions = subs.filter(s => s.status === 'inactive').length;
      }
      
      // Processar dados das faturas
      if (invoices.success && invoices.data?.items) {
        const invs = invoices.data.items as IuguInvoice[];
        metrics.pending_invoices = invs.filter(i => i.status === 'pending').length;
        metrics.paid_invoices = invs.filter(i => i.status === 'paid').length;
        
        // Calcular MRR aproximado baseado nas faturas pagas
        const paidInvoices = invs.filter(i => i.status === 'paid');
        metrics.monthly_recurring_revenue = paidInvoices.reduce((sum, inv) => sum + inv.total_cents, 0) / 100;
        metrics.annual_recurring_revenue = metrics.monthly_recurring_revenue * 12;
      }
      
      logger.info('📊 Métricas calculadas', metrics);
      return metrics;
      
    } catch (error) {
      logger.error('❌ Erro ao buscar métricas Iugu', { error });
      throw error;
    }
  }

  // ========================================================================================
  // SINCRONIZAÇÃO DE DADOS
  // ========================================================================================
  
  /**
   * Sincronizar planos locais com Iugu
   */
  async syncPlans(localPlans: any[]): Promise<IuguPlanSync> {
    try {
      logger.info('🔄 Sincronizando planos com Iugu');
      
      const iuguPlans = await this.getPlans();
      const result: IuguPlanSync = {
        local_plans: localPlans.length,
        iugu_plans: iuguPlans.items.length,
        synced: 0,
        created: 0,
        updated: 0,
        errors: []
      };
      
      // Implementar lógica de sincronização aqui
      // Por exemplo, comparar planos locais com remotos e criar/atualizar conforme necessário
      
      return result;
      
    } catch (error) {
      logger.error('❌ Erro na sincronização de planos', { error });
      throw error;
    }
  }

  // ========================================================================================
  // MÉTODO AUXILIAR PARA CHAMADAS HTTP
  // ========================================================================================
  
  private async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<IuguApiResponse<T>> {
    try {
      if (!this.apiKey) {
        throw new Error('API Key da Iugu não configurada');
      }

      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const options: RequestInit = {
        method,
        headers,
        ...(data && method !== 'GET' && { body: JSON.stringify(data) })
      };

      logger.info(`🌐 Iugu API Request: ${method} ${url}`, { data });

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: responseData,
        message: 'Sucesso'
      };

    } catch (error) {
      logger.error('❌ Erro na requisição Iugu API', { method, endpoint, error });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }
}

// Instância singleton do serviço
export const iuguService = new IuguService();

// Export da classe para casos onde precisamos de múltiplas instâncias
export { IuguService }; 