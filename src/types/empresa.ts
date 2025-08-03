/**
 * Tipos e constantes para empresas
 */

// Status possíveis para empresas
export const EMPRESA_STATUS = {
  ATIVO: 'ativo',
  INATIVO: 'inativo',
  SUSPENSO: 'suspenso'
} as const;

export type EmpresaStatus = typeof EMPRESA_STATUS[keyof typeof EMPRESA_STATUS];

// Interface para empresa
export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  admin_user_id?: string;
  ativa: boolean; // Campo real da tabela
  max_entregadores?: number;
  max_agendas_mes?: number;
  plano_atual?: string;
  data_expiracao?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para empresa básica (apenas id e nome)
export interface EmpresaBasica {
  id: string;
  nome: string;
}

// Função helper para validar status
export const isValidEmpresaStatus = (status: string): status is EmpresaStatus => {
  return Object.values(EMPRESA_STATUS).includes(status as EmpresaStatus);
};

// Função helper para verificar se empresa está ativa
export const isEmpresaAtiva = (empresa: { ativa: boolean }): boolean => {
  return empresa.ativa === true;
};