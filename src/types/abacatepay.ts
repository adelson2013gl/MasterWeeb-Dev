// Tipos para integração com AbacatePay

export type AbacatePayFrequency = 'ONE_TIME' | 'RECURRING';
export type AbacatePayStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
export type AbacatePayMethod = 'PIX';

// Interface para resposta da API AbacatePay
export interface AbacatePayResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Interface para criar QR Code PIX
export interface CreatePixQrCodeRequest {
  amount: number;
  expiresIn?: number; // em segundos, padrão 24h
  description: string;
  customer: {
    name: string;
    cellphone: string;
    email: string;
    taxId: string; // CPF/CNPJ obrigatório
  };
}

// Interface para criar uma cobrança (método antigo - manter compatibilidade)
export interface CreateBillingRequest {
  amount: number;
  description: string;
  customer?: {
    name?: string;
    email?: string;
    taxId?: string; // CPF/CNPJ
  };
  metadata?: Record<string, any>;
  frequency?: AbacatePayFrequency;
  externalId?: string; // Referência externa da empresa
}

// Interface para resposta do PIX QR Code
export interface PixQrCodeResponse {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  devMode: boolean;
  brCode: string; // Código PIX copia e cola
  brCodeBase64: string; // QR Code em base64
  platformFee: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

// Interface para resposta de criação de cobrança (compatibilidade)
export interface BillingResponse {
  id: string;
  url: string;
  amount: number;
  status: AbacatePayStatus;
  methods: AbacatePayMethod[];
  frequency: AbacatePayFrequency;
  description: string;
  customer?: {
    id: string;
    name?: string;
    email?: string;
  };
  metadata?: Record<string, any>;
  externalId?: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  expiresAt?: string;
}

// Interface para consultar uma cobrança específica
export interface GetBillingRequest {
  billId: string;
}

// Interface para webhook do AbacatePay
export interface AbacatePayWebhook {
  event: 'bill.paid' | 'bill.cancelled' | 'bill.expired';
  data: BillingResponse;
  timestamp: string;
  signature?: string;
}

// Interface para criar cliente
export interface CreateCustomerRequest {
  name: string;
  email: string;
  taxId?: string; // CPF/CNPJ
  metadata?: Record<string, any>;
}

// Interface para resposta de cliente
export interface CustomerResponse {
  id: string;
  name: string;
  email: string;
  taxId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

// Interface para configuração do serviço
export interface AbacatePayConfig {
  apiUrl: string;
  apiKey: string;
  isDevelopment: boolean;
}

// Interface para dados da empresa (para validação)
export interface EmpresaDataForPayment {
  name: string;
  email: string;
  cellphone?: string;
  taxId?: string; // CPF/CNPJ
}

// Interface para dados coletados no popup
export interface CollectedPaymentData {
  cellphone: string;
  taxId: string;
}

// Interface para erro do AbacatePay
export interface AbacatePayError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}