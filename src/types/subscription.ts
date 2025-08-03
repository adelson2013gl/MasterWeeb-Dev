// Tipos para o sistema de monetização

export type PlanoType = 'basico' | 'pro' | 'enterprise';

export type StatusAssinatura = 'pending' | 'active' | 'paused' | 'cancelled' | 'expired';

export type StatusTransacao = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';



// Interface para assinatura (baseada no schema do Supabase)
export interface Assinatura {
  id: string;
  empresa_id: string;
  abacatepay_bill_id?: string | null; // ID da cobrança no AbacatePay
  plano: string; // PlanoType como string no banco
  status: string; // StatusAssinatura como string no banco
  valor_mensal?: number | null;
  data_proximo_pagamento?: string | null;
  metadata?: any | null; // JSON no banco
  created_at?: string | null;
  updated_at?: string | null;
}

// Interface para transação (baseada no schema do Supabase)
export interface Transacao {
  id: string;
  assinatura_id: string;
  abacatepay_bill_id?: string | null; // ID da cobrança no AbacatePay
  status: string; // StatusTransacao como string no banco
  valor: number;
  metodo_pagamento?: 'PIX' | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Interface para webhook do AbacatePay
export interface AbacatePayWebhookRecord {
  id: string;
  evento: string; // 'bill.paid', 'bill.cancelled', etc.
  bill_id: string;
  empresa_id?: string;
  payload: Record<string, any>;
  processado: boolean;
  erro?: string;
  created_at: string;
  updated_at: string;
}

// Configuração dos planos disponíveis
export interface PlanoConfig {
  id: PlanoType;
  nome: string;
  descricao: string;
  preco: number;
  max_entregadores: number;
  max_agendas_mes: number;
  recursos: string[];
  popular?: boolean;
}

export const PLANOS_DISPONIVEIS: PlanoConfig[] = [
  {
    id: 'basico',
    nome: 'Básico',
    descricao: 'Ideal para pequenas empresas',
    preco: 49.90,
    max_entregadores: 5,
    max_agendas_mes: 100,
    recursos: [
      'Até 5 entregadores',
      'Até 100 agendamentos/mês',
      'Dashboard básico',
      'Suporte por email'
    ]
  },
  {
    id: 'pro',
    nome: 'Profissional',
    descricao: 'Para empresas em crescimento',
    preco: 99.90,
    max_entregadores: 20,
    max_agendas_mes: 500,
    recursos: [
      'Até 20 entregadores',
      'Até 500 agendamentos/mês',
      'Dashboard avançado',
      'Relatórios detalhados',
      'Suporte prioritário',
      'Integração com APIs'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    descricao: 'Para grandes operações',
    preco: 199.90,
    max_entregadores: 100,
    max_agendas_mes: 2000,
    recursos: [
      'Até 100 entregadores',
      'Até 2000 agendamentos/mês',
      'Dashboard completo',
      'Relatórios personalizados',
      'Suporte 24/7',
      'Integração completa',
      'Gerente de conta dedicado',
      'SLA garantido'
    ]
  }
];

// Interface para dados de checkout
export interface CheckoutData {
  plano: PlanoType;
  empresa_id: string;
  email: string;
  nome_empresa: string;
  cnpj?: string;
}

// Interface para resposta de criação de cobrança AbacatePay
export interface AbacatePayBillingResponse {
  id: string;
  url: string; // URL para pagamento
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  methods: ['PIX'];
  frequency: 'ONE_TIME';
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

// Interface para dados de pagamento
export interface PaymentData {
  subscription_id: string;
  payment_id: string;
  status: string;
  transaction_amount: number;
  currency_id: string;
  payment_method_id: string;
  date_approved?: string;
  date_created: string;
}

// Interface para limites baseados no plano
export interface LimitesPlano {
  max_entregadores: number;
  max_agendas_mes: number;
  recursos_disponivel: string[];
}

// Função helper para obter configuração do plano
export function getPlanoConfig(plano: PlanoType): PlanoConfig {
  return PLANOS_DISPONIVEIS.find(p => p.id === plano) || PLANOS_DISPONIVEIS[0];
}

// Função helper para verificar se empresa pode criar mais entregadores
export function podeAdicionarEntregador(plano: PlanoType, entregadoresAtuais: number): boolean {
  const config = getPlanoConfig(plano);
  return entregadoresAtuais < config.max_entregadores;
}

// Função helper para verificar se empresa pode criar mais agendamentos
export function podeAdicionarAgendamento(plano: PlanoType, agendamentosNoMes: number): boolean {
  const config = getPlanoConfig(plano);
  return agendamentosNoMes < config.max_agendas_mes;
}