
export interface Empresa {
  id: string;
  nome: string;
  email?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  plano_atual?: string | null;
  ativa: boolean; // Campo real da tabela
  data_expiracao?: string | null; // Campo real da tabela
  max_entregadores: number | null;
  max_agendas_mes: number | null;
  admin_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmpresaAdminTemp {
  id: string;
  empresa_id: string;
  email: string;
  senha_temporaria: string;
  usado: boolean;
  created_at: string;
  expires_at: string;
}
