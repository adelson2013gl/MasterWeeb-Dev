// ========================================================================================
// TIPOS IUGU - INTEGRAÇÃO COMPLETA
// ========================================================================================

// Tipos básicos da API Iugu
export type IuguEnvironment = 'sandbox' | 'production';
export type IuguPlanInterval = 'weekly' | 'monthly' | 'annually';
export type IuguSubscriptionStatus = 'active' | 'suspended' | 'inactive' | 'expired';
export type IuguPaymentMethod = 'credit_card' | 'bank_slip' | 'pix';
export type IuguInvoiceStatus = 'pending' | 'paid' | 'canceled' | 'expired' | 'refunded';

// ========================================================================================
// CONFIGURAÇÕES IUGU
// ========================================================================================
export interface IuguConfiguration {
  id: string;
  empresa_id: string;
  api_key: string;
  account_id: string;
  environment: IuguEnvironment;
  webhook_url?: string;
  webhook_token?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================================================================
// PLANOS IUGU
// ========================================================================================
export interface IuguPlan {
  id: string;
  name: string;
  identifier: string;
  interval: IuguPlanInterval;
  interval_type: number;
  value_cents: number;
  currency: string;
  features: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IuguPlanCreateRequest {
  name: string;
  identifier: string;
  interval: IuguPlanInterval;
  interval_type: number;
  value_cents: number;
  currency?: string;
  features?: string[];
  metadata?: Record<string, any>;
}

// ========================================================================================
// CLIENTES IUGU
// ========================================================================================
export interface IuguCustomer {
  id: string;
  email: string;
  name: string;
  cpf_cnpj?: string;
  phone?: string;
  notes?: string;
  custom_variables?: Array<{
    name: string;
    value: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface IuguCustomerCreateRequest {
  email: string;
  name: string;
  cpf_cnpj?: string;
  phone?: string;
  notes?: string;
  custom_variables?: Array<{
    name: string;
    value: string;
  }>;
}

// ========================================================================================
// ASSINATURAS IUGU
// ========================================================================================
export interface IuguSubscription {
  id: string;
  plan_identifier: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  status: IuguSubscriptionStatus;
  recent_invoices: IuguInvoice[];
  expires_at?: string;
  created_at: string;
  updated_at: string;
  suspended_at?: string;
  custom_variables?: Array<{
    name: string;
    value: string;
  }>;
}

export interface IuguSubscriptionCreateRequest {
  plan_identifier: string;
  customer_id: string;
  expires_at?: string;
  only_on_charge_success?: boolean;
  payable_with?: IuguPaymentMethod[];
  credits_based?: boolean;
  price_cents?: number;
  custom_variables?: Array<{
    name: string;
    value: string;
  }>;
}

// ========================================================================================
// FATURAS IUGU
// ========================================================================================
export interface IuguInvoice {
  id: string;
  due_date: string;
  currency: string;
  discount_cents: number;
  email: string;
  items_total_cents: number;
  notification_url?: string;
  return_url?: string;
  status: IuguInvoiceStatus;
  tax_cents: number;
  total_cents: number;
  total_paid_cents: number;
  taxes_paid_cents: number;
  paid_at?: string;
  canceled_at?: string;
  refunded_at?: string;
  url: string;
  pdf?: string;
  bank_slip?: {
    digitable_line: string;
    barcode_data: string;
    barcode: string;
  };
  pix?: {
    qrcode: string;
    qrcode_text: string;
  };
  customer_id?: string;
  subscription_id?: string;
  custom_variables?: Array<{
    name: string;
    value: string;
  }>;
  created_at: string;
  updated_at: string;
}

// ========================================================================================
// WEBHOOKS IUGU
// ========================================================================================
export interface IuguWebhook {
  id: string;
  url: string;
  authorization?: string;
  events?: string[];
  created_at: string;
  updated_at: string;
}

export interface IuguWebhookEvent {
  event: string;
  data: {
    id: string;
    [key: string]: any;
  };
  created_at: string;
}

// ========================================================================================
// RESPOSTAS DA API IUGU
// ========================================================================================
export interface IuguApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface IuguPaginatedResponse<T> {
  items: T[];
  total_items: number;
  total_pages: number;
  page: number;
  per_page: number;
}

// ========================================================================================
// MÉTRICAS E DASHBOARD
// ========================================================================================
export interface IuguMetrics {
  total_customers: number;
  active_subscriptions: number;
  suspended_subscriptions: number;
  canceled_subscriptions: number;
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  churn_rate: number;
  conversion_rate: number;
  pending_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
}

export interface IuguRevenueMetrics {
  period: string;
  revenue_cents: number;
  subscriptions_count: number;
  new_customers: number;
  churned_customers: number;
}

// ========================================================================================
// CONFIGURAÇÕES DO SISTEMA PARA IUGU
// ========================================================================================
export interface IuguSystemConfig {
  enabled: boolean;
  environment: IuguEnvironment;
  api_key: string;
  account_id: string;
  webhook_url: string;
  webhook_token: string;
  default_currency: string;
  auto_create_customers: boolean;
  auto_suspend_overdue: boolean;
  overdue_days_limit: number;
  notification_emails: string[];
  test_mode: boolean;
}

// ========================================================================================
// INTEGRAÇÕES LOCAIS (BANCO DE DADOS)
// ========================================================================================
export interface IuguLocalSubscription {
  id: string;
  empresa_id: string;
  iugu_subscription_id: string;
  iugu_customer_id: string;
  iugu_plan_id: string;
  status: IuguSubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IuguLocalInvoice {
  id: string;
  empresa_id: string;
  subscription_id: string;
  iugu_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: IuguInvoiceStatus;
  due_date: string;
  paid_at?: string;
  payment_method?: IuguPaymentMethod;
  failure_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ========================================================================================
// HELPERS E UTILITÁRIOS
// ========================================================================================
export interface IuguConnectionTest {
  success: boolean;
  account_id?: string;
  account_name?: string;
  environment: IuguEnvironment;
  error?: string;
}

export interface IuguPlanSync {
  local_plans: number;
  iugu_plans: number;
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

// ========================================================================================
// CONSTANTES IUGU
// ========================================================================================
export const IUGU_ENDPOINTS = {
  BASE_SANDBOX: 'https://api.iugu.com/v1',
  BASE_PRODUCTION: 'https://api.iugu.com/v1',
  PLANS: '/plans',
  CUSTOMERS: '/customers',
  SUBSCRIPTIONS: '/subscriptions',
  INVOICES: '/invoices',
  WEBHOOKS: '/web_hooks',
  ACCOUNT: '/account'
} as const;

export const IUGU_WEBHOOK_EVENTS = [
  'invoice.status_changed',
  'invoice.payment_failed',
  'invoice.created',
  'invoice.due',
  'invoice.payment_received',
  'subscription.suspended',
  'subscription.activated',
  'subscription.expired',
  'subscription.canceled',
  'customer.created',
  'customer.updated'
] as const;

export const IUGU_PLAN_INTERVALS = {
  weekly: { label: 'Semanal', days: 7 },
  monthly: { label: 'Mensal', days: 30 },
  annually: { label: 'Anual', days: 365 }
} as const;

// ========================================================================================
// FUNÇÕES HELPER
// ========================================================================================
export function formatIuguCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100);
}

export function getIuguStatusColor(status: IuguSubscriptionStatus | IuguInvoiceStatus): string {
  const colors: Record<string, string> = {
    active: 'green',
    paid: 'green',
    pending: 'yellow',
    suspended: 'orange',
    canceled: 'red',
    expired: 'red',
    refunded: 'gray'
  };
  
  return colors[status] || 'gray';
}

export function getIuguStatusLabel(status: IuguSubscriptionStatus | IuguInvoiceStatus): string {
  const labels: Record<string, string> = {
    active: 'Ativa',
    paid: 'Paga',
    pending: 'Pendente',
    suspended: 'Suspensa',
    canceled: 'Cancelada',
    expired: 'Expirada',
    refunded: 'Reembolsada',
    inactive: 'Inativa'
  };
  
  return labels[status] || status;
} 