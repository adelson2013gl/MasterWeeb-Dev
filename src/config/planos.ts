// Configuração centralizada dos planos de assinatura

export type PlanoType = 'basico' | 'pro' | 'enterprise';

export interface PlanoConfig {
  id: PlanoType;
  nome: string;
  preco: number;
  descricao: string;
  recursos: string[];
  limites: {
    agendamentos_mes: number;
    usuarios: number;
    armazenamento_gb: number;
    suporte: 'basico' | 'prioritario' | 'dedicado';
  };
  popular?: boolean;
}

// Configuração dos planos disponíveis
export const PLANOS_CONFIG: Record<PlanoType, PlanoConfig> = {
  basico: {
    id: 'basico',
    nome: 'Plano Básico',
    preco: 49.90,
    descricao: 'Ideal para pequenas empresas que estão começando',
    recursos: [
      'Até 100 agendamentos por mês',
      '1 usuário administrador',
      '1GB de armazenamento',
      'Suporte por email',
      'Relatórios básicos'
    ],
    limites: {
      agendamentos_mes: 100,
      usuarios: 1,
      armazenamento_gb: 1,
      suporte: 'basico'
    }
  },
  pro: {
    id: 'pro',
    nome: 'Plano Profissional',
    preco: 99.90,
    descricao: 'Para empresas em crescimento que precisam de mais recursos',
    recursos: [
      'Até 500 agendamentos por mês',
      'Até 5 usuários',
      '5GB de armazenamento',
      'Suporte prioritário',
      'Relatórios avançados',
      'Integração com calendários',
      'Notificações automáticas'
    ],
    limites: {
      agendamentos_mes: 500,
      usuarios: 5,
      armazenamento_gb: 5,
      suporte: 'prioritario'
    },
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    nome: 'Plano Enterprise',
    preco: 199.90,
    descricao: 'Solução completa para grandes empresas',
    recursos: [
      'Agendamentos ilimitados',
      'Usuários ilimitados',
      '20GB de armazenamento',
      'Suporte dedicado 24/7',
      'Relatórios personalizados',
      'API completa',
      'Integração avançada',
      'Backup automático',
      'Customização de marca'
    ],
    limites: {
      agendamentos_mes: -1, // -1 = ilimitado
      usuarios: -1, // -1 = ilimitado
      armazenamento_gb: 20,
      suporte: 'dedicado'
    }
  }
};

// Funções utilitárias
export const getPlanoConfig = (plano: PlanoType): PlanoConfig => {
  return PLANOS_CONFIG[plano];
};

export const getPlanoPreco = (plano: PlanoType): number => {
  return PLANOS_CONFIG[plano]?.preco || 0;
};

export const getPlanoNome = (plano: PlanoType): string => {
  return PLANOS_CONFIG[plano]?.nome || 'Plano Desconhecido';
};

export const getPlanosDisponiveis = (): PlanoConfig[] => {
  return Object.values(PLANOS_CONFIG);
};

export const isPlanoValido = (plano: string): plano is PlanoType => {
  return Object.keys(PLANOS_CONFIG).includes(plano);
};

// Validação de limites
export const verificarLimiteAgendamentos = (plano: PlanoType, agendamentosAtual: number): boolean => {
  const config = getPlanoConfig(plano);
  if (config.limites.agendamentos_mes === -1) return true; // Ilimitado
  return agendamentosAtual < config.limites.agendamentos_mes;
};

export const verificarLimiteUsuarios = (plano: PlanoType, usuariosAtual: number): boolean => {
  const config = getPlanoConfig(plano);
  if (config.limites.usuarios === -1) return true; // Ilimitado
  return usuariosAtual < config.limites.usuarios;
};

// Constantes para validação
export const PLANOS_VALIDOS: PlanoType[] = Object.keys(PLANOS_CONFIG) as PlanoType[];
export const PLANO_PADRAO: PlanoType = 'basico';