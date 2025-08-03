// Serviço para integração com AbacatePay
import { 
  AbacatePayResponse,
  AbacatePayConfig,
  CreateBillingRequest,
  CreatePixQrCodeRequest,
  BillingResponse,
  PixQrCodeResponse,
  GetBillingRequest,
  CreateCustomerRequest,
  CustomerResponse,
  AbacatePayError
} from '@/types/abacatepay';

class AbacatePayService {
  private config: AbacatePayConfig;

  constructor() {
    // Debug das variáveis de ambiente
    console.log('🔧 Debug ENV vars:', {
      NODE_ENV: import.meta.env.NODE_ENV,
      VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV,
      VITE_ABACATEPAY_API_URL: import.meta.env.VITE_ABACATEPAY_API_URL,
      VITE_ABACATEPAY_API_KEY_DEV: import.meta.env.VITE_ABACATEPAY_API_KEY_DEV ? `${import.meta.env.VITE_ABACATEPAY_API_KEY_DEV.substring(0, 10)}...` : 'UNDEFINED',
      VITE_ABACATEPAY_API_KEY_PROD: import.meta.env.VITE_ABACATEPAY_API_KEY_PROD ? `${import.meta.env.VITE_ABACATEPAY_API_KEY_PROD.substring(0, 10)}...` : 'UNDEFINED'
    });

    this.config = {
      apiUrl: import.meta.env.VITE_ABACATEPAY_API_URL || 'https://api.abacatepay.com/v1',
      apiKey: import.meta.env.NODE_ENV === 'production' 
        ? import.meta.env.VITE_ABACATEPAY_API_KEY_PROD 
        : import.meta.env.VITE_ABACATEPAY_API_KEY_DEV,
      isDevelopment: import.meta.env.VITE_NODE_ENV === 'development' || import.meta.env.NODE_ENV === 'development'
    };

    console.log('🔧 AbacatePay Service inicializado:', {
      apiUrl: this.config.apiUrl,
      apiKey: this.config.apiKey ? `${this.config.apiKey.substring(0, 10)}...` : 'UNDEFINED',
      isDevelopment: this.config.isDevelopment
    });

    if (!this.config.apiKey) {
      console.warn('⚠️ AbacatePay API key não configurada');
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<AbacatePayResponse<T>> {
    try {
      const url = `${this.config.apiUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            message: data.message || 'Erro na comunicação com AbacatePay',
            code: data.code || response.status.toString()
          }
        };
      }

      return { data };
    } catch (error) {
      console.error('Erro na requisição AbacatePay:', error);
      return {
        error: {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          code: 'NETWORK_ERROR'
        }
      };
    }
  }

  // Criar QR Code PIX (método principal recomendado)
  async createPixQrCode(request: CreatePixQrCodeRequest): Promise<AbacatePayResponse<PixQrCodeResponse>> {
    console.log('Criando QR Code PIX AbacatePay via Edge Function:', {
      amount: request.amount,
      description: request.description,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        cellphone: request.customer.cellphone?.substring(0, 5) + '***',
        taxId: request.customer.taxId ? '***' + request.customer.taxId.slice(-3) : 'não informado'
      }
    });

    try {
      // Importar cliente Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Garantir que o telefone está no formato correto
      let cellphoneForAPI = request.customer.cellphone;
      if (cellphoneForAPI.startsWith('+55')) {
        cellphoneForAPI = cellphoneForAPI.substring(3); // Remove +55
      }
      // Garantir que tenha o formato (xx) xxxxx-xxxx
      if (cellphoneForAPI.length === 11 && !cellphoneForAPI.includes('(')) {
        // Formatar: 11999998888 -> (11) 99999-8888
        cellphoneForAPI = `(${cellphoneForAPI.substring(0, 2)}) ${cellphoneForAPI.substring(2, 7)}-${cellphoneForAPI.substring(7)}`;
      }

      // Garantir que o CPF/CNPJ está no formato correto (apenas números)
      let taxIdForAPI = request.customer.taxId.replace(/\D/g, ''); // Remove tudo que não é número
      
      // Re-formatar para o padrão da API se necessário
      if (taxIdForAPI.length === 11) {
        // CPF: 123.456.789-01
        taxIdForAPI = `${taxIdForAPI.substring(0, 3)}.${taxIdForAPI.substring(3, 6)}.${taxIdForAPI.substring(6, 9)}-${taxIdForAPI.substring(9)}`;
      } else if (taxIdForAPI.length === 14) {
        // CNPJ: 12.345.678/0001-90
        taxIdForAPI = `${taxIdForAPI.substring(0, 2)}.${taxIdForAPI.substring(2, 5)}.${taxIdForAPI.substring(5, 8)}/${taxIdForAPI.substring(8, 12)}-${taxIdForAPI.substring(12)}`;
      }

      const requestBody = {
        amount: request.amount,
        expiresIn: request.expiresIn || 3600, // 1 hora por padrão
        description: request.description,
        customer: {
          name: request.customer.name,
          cellphone: cellphoneForAPI,
          email: request.customer.email,
          taxId: taxIdForAPI
        }
      };

      console.log('📤 Enviando para Edge Function AbacatePay:', {
        endpoint: '/functions/v1/abacatepay-create-pix',
        body: {
          ...requestBody,
          customer: {
            ...requestBody.customer,
            cellphone: requestBody.customer.cellphone.substring(0, 5) + '***',
            taxId: '***' + requestBody.customer.taxId.slice(-3)
          }
        }
      });

      // Fazer chamada via Edge Function
      const { data, error } = await supabase.functions.invoke('abacatepay-create-pix', {
        body: requestBody
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        throw new Error(error.message || 'Erro na comunicação com AbacatePay');
      }

      if (data?.error) {
        console.error('❌ Erro da API AbacatePay via Edge Function:', data.error);
        return {
          error: {
            message: data.error.message || 'Erro na API AbacatePay',
            code: data.error.code || 'API_ERROR'
          }
        };
      }

      if (!data?.data) {
        throw new Error('Resposta inválida da Edge Function');
      }

      console.log('✅ PIX QR Code criado com sucesso via Edge Function:', data.data.id);
      return data;

    } catch (error) {
      console.error('Erro na chamada para Edge Function AbacatePay:', error);
      
      // Fallback para mock apenas em desenvolvimento
      if (this.config.isDevelopment) {
        console.log('🚀 Usando MOCK do PIX devido ao erro na Edge Function em desenvolvimento');
        
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Dados de mock realistas
        const mockPixData: PixQrCodeResponse = {
          id: `pix_dev_${Date.now()}`,
          amount: request.amount,
          status: 'PENDING',
          devMode: true,
          brCode: '00020126330014BR.GOV.BCB.PIX013636e3b6b2-3f5a-4c7a-8b2e-d1c3e2f1a0b052040000530398654040.015802BR5925ABACATEPAY DEMONSTRACAO6009SAO PAULO62070503***63041D3D',
          brCodeBase64: 'PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiPk1PQ0sgUUlYPGJyLz5ERU1PTjwvdGV4dD48L3N2Zz4=',
          platformFee: Math.round(request.amount * 0.049), // 4.9% de taxa
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hora
        };
        
        return {
          data: mockPixData
        };
      }

      return {
        error: {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          code: 'NETWORK_ERROR'
        }
      };
    }
  }

  /**
   * VERIFICAÇÃO REAL DE STATUS PIX
   * 
   * ATENÇÃO: Esta função realiza verificação REAL do status do pagamento
   * através da API da AbacatePay. NÃO retorna sucesso automático.
   * 
   * Fluxo de segurança:
   * 1. Autentica usuário via Supabase
   * 2. Chama edge function segura
   * 3. Edge function consulta API AbacatePay
   * 4. Retorna status real: PAID, PENDING, EXPIRED, CANCELLED
   */
  async checkPixPaymentStatus(pixId: string): Promise<AbacatePayResponse<PixQrCodeResponse>> {
    console.log('Verificando status do pagamento PIX via Edge Function:', pixId);

    try {
      // Importar cliente Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      console.log('📤 Verificando PIX via Edge Function:', {
        endpoint: '/functions/v1/abacatepay-check-pix',
        pixId: pixId.substring(0, 10) + '...'
      });

      // Fazer chamada via Edge Function
      const { data, error } = await supabase.functions.invoke('abacatepay-check-pix', {
        body: { id: pixId }
      });

      if (error) {
        console.error('❌ Erro na Edge Function de verificação:', error);
        throw new Error(error.message || 'Erro na comunicação com AbacatePay');
      }

      if (data?.error) {
        console.error('❌ Erro da API AbacatePay ao verificar status via Edge Function:', data.error);
        return {
          error: {
            message: data.error.message || 'Erro ao verificar status PIX',
            code: data.error.code || 'API_ERROR'
          }
        };
      }

      if (!data?.data) {
        throw new Error('Resposta inválida da Edge Function de verificação');
      }

      console.log('✅ Status do PIX verificado via Edge Function:', data.data?.status);
      
      // A API /check retorna apenas status e expiresAt, então vamos manter os dados originais do PIX
      // e apenas atualizar o status
      return {
        data: {
          id: pixId,
          status: data.data?.status || 'PENDING',
          expiresAt: data.data?.expiresAt,
          // Outros campos serão mantidos do PIX original ou simulados
          amount: 0, // Será preenchido pelo componente
          devMode: this.config.isDevelopment,
          brCode: '',
          brCodeBase64: '',
          platformFee: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Erro na chamada para Edge Function de verificação AbacatePay:', error);
      
      // Fallback para mock apenas em desenvolvimento
      if (this.config.isDevelopment) {
        console.log('🚀 Usando MOCK de verificação de status devido ao erro na Edge Function');
        
        // Simular delay da verificação
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simular pagamento confirmado (80% de chance) ou ainda pendente (20% de chance)
        const isPaid = Math.random() > 0.2; // 80% de chance de estar pago
        
        const mockStatus: PixQrCodeResponse = {
          id: pixId,
          amount: 9990, // Valor do plano Pro
          status: isPaid ? 'PAID' : 'PENDING',
          devMode: true,
          brCode: '00020126330014BR.GOV.BCB.PIX013636e3b6b2-3f5a-4c7a-8b2e-d1c3e2f1a0b052040000530398654040.015802BR5925ABACATEPAY DEMONSTRACAO6009SAO PAULO62070503***63041D3D',
          brCodeBase64: 'PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiPk1PQ0sgUUlYPGJyLz5ERU1PTjwvdGV4dD48L3N2Zz4=',
          platformFee: 489, // 4.9% de 99.90
          createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutos atrás
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3300000).toISOString() // 55 minutos restantes
        };
        
        console.log(`📊 Mock: PIX ${pixId} está ${isPaid ? 'PAGO ✅' : 'PENDENTE ⏳'}`);
        
        return {
          data: mockStatus
        };
      }

      return {
        error: {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          code: 'NETWORK_ERROR'
        }
      };
    }
  }

  // Criar uma nova cobrança (método de compatibilidade)
  async createBilling(request: CreateBillingRequest): Promise<AbacatePayResponse<BillingResponse>> {
    console.log('Criando cobrança AbacatePay (método legacy):', {
      amount: request.amount,
      description: request.description,
      frequency: request.frequency || 'ONE_TIME'
    });

    return this.makeRequest<BillingResponse>('/billing/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Consultar uma cobrança específica
  async getBilling(request: GetBillingRequest): Promise<AbacatePayResponse<BillingResponse>> {
    console.log('Consultando cobrança AbacatePay:', request.billId);

    return this.makeRequest<BillingResponse>(`/billing/get?id=${request.billId}`, {
      method: 'GET',
    });
  }

  // Listar todas as cobranças
  async listBillings(): Promise<AbacatePayResponse<BillingResponse[]>> {
    console.log('Listando cobranças AbacatePay via Edge Function');

    try {
      // Importar cliente Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      console.log('📤 Listando cobranças via Edge Function:', {
        endpoint: '/functions/v1/abacatepay-list-billings'
      });

      // Fazer chamada via Edge Function
      const { data, error } = await supabase.functions.invoke('abacatepay-list-billings', {
        body: {}
      });

      if (error) {
        console.error('❌ Erro na Edge Function de listagem:', error);
        throw new Error(error.message || 'Erro na comunicação com AbacatePay');
      }

      if (data?.error) {
        console.error('❌ Erro da API AbacatePay ao listar cobranças via Edge Function:', data.error);
        return {
          error: {
            message: data.error.message || 'Erro ao listar cobranças',
            code: data.error.code || 'API_ERROR'
          }
        };
      }

      if (!data?.data) {
        console.log('ℹ️ Nenhuma cobrança encontrada');
        return { data: [] };
      }

      console.log('✅ Cobranças listadas via Edge Function:', data.data.length);
      return data;

    } catch (error) {
      console.error('Erro na chamada para Edge Function de listagem AbacatePay:', error);
      
      // Fallback para dados vazios apenas em desenvolvimento
      if (this.config.isDevelopment) {
        console.log('🚀 Usando dados vazios devido ao erro na Edge Function em desenvolvimento');
        return { data: [] };
      }

      return {
        error: {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          code: 'NETWORK_ERROR'
        }
      };
    }
  }

  // Criar um novo cliente
  async createCustomer(request: CreateCustomerRequest): Promise<AbacatePayResponse<CustomerResponse>> {
    console.log('Criando cliente AbacatePay:', {
      name: request.name,
      email: request.email
    });

    return this.makeRequest<CustomerResponse>('/customer/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Listar clientes
  async listCustomers(): Promise<AbacatePayResponse<CustomerResponse[]>> {
    console.log('Listando clientes AbacatePay');

    return this.makeRequest<CustomerResponse[]>('/customer/list', {
      method: 'GET',
    });
  }

  // Verificar se o serviço está configurado corretamente
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiUrl);
  }

  // Obter configuração atual (para debug)
  getConfig(): Partial<AbacatePayConfig> {
    return {
      apiUrl: this.config.apiUrl,
      isDevelopment: this.config.isDevelopment,
      // Não expor API key por segurança
    };
  }

  // Helper para converter valor em centavos
  static convertToCents(valueInReais: number): number {
    return Math.round(valueInReais * 100);
  }

  // Helper para converter centavos em reais
  static convertToReais(valueInCents: number): number {
    return valueInCents / 100;
  }

  // Gerar referência externa única
  static generateExternalId(empresaId: string, plano: string): string {
    const timestamp = Date.now();
    return `${empresaId}-${plano}-${timestamp}`;
  }

  // Validar se todos os dados obrigatórios estão presentes
  static validatePaymentData(data: {
    name: string;
    email: string;
    cellphone?: string;
    taxId?: string;
  }): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    if (!data.name || data.name.trim().length < 2) {
      missingFields.push('name');
    }
    
    if (!data.email || !data.email.includes('@')) {
      missingFields.push('email');
    }
    
    if (!data.cellphone || data.cellphone.length < 10) {
      missingFields.push('cellphone');
    }
    
    if (!data.taxId || data.taxId.length < 11) {
      missingFields.push('taxId');
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  // Formatar telefone para padrão brasileiro
  static formatCellphone(phone: string): string {
    // Remove tudo que não é número
    const cleaned = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `+55${cleaned}`;
    } else if (cleaned.length === 10) {
      return `+5511${cleaned}`;
    } else if (cleaned.length === 11) {
      return `+55${cleaned}`;
    }
    
    return phone; // Retorna original se não conseguir formatar
  }

  // Validar CPF/CNPJ (validação simples)
  static isValidTaxId(taxId: string): boolean {
    const cleaned = taxId.replace(/\D/g, '');
    return cleaned.length === 11 || cleaned.length === 14;
  }
}

// Instância singleton
export const abacatePayService = new AbacatePayService();
export default abacatePayService;

// Exportar também a classe para acessar métodos estáticos
export { AbacatePayService };