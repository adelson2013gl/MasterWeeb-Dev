
export type Database = {
  public: {
    Tables: {
      entregadores: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string;
          cpf: string;
          status: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';
          empresa_id: string;
          created_at: string;
          updated_at: string;
          estrelas?: number;
          cidade_id?: string;
          data_aprovacao?: string;
          data_cadastro?: string;
          data_rejeicao?: string;
          motivo_rejeicao?: string;
          perfil?: 'entregador' | 'admin';
          user_id?: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          telefone: string;
          cpf: string;
          status?: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';
          empresa_id: string;
          created_at?: string;
          updated_at?: string;
          estrelas?: number;
          cidade_id?: string;
          data_aprovacao?: string;
          data_cadastro?: string;
          data_rejeicao?: string;
          motivo_rejeicao?: string;
          perfil?: 'entregador' | 'admin';
          user_id?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          telefone?: string;
          cpf?: string;
          status?: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';
          empresa_id?: string;
          created_at?: string;
          updated_at?: string;
          estrelas?: number;
          cidade_id?: string;
          data_aprovacao?: string;
          data_cadastro?: string;
          data_rejeicao?: string;
          motivo_rejeicao?: string;
          perfil?: 'entregador' | 'admin';
          user_id?: string;
        };
      };
      cidades: {
        Row: {
          id: string;
          nome: string;
          estado: string;
          empresa_id: string;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          estado: string;
          empresa_id: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          estado?: string;
          empresa_id?: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      regioes: {
        Row: {
          id: string;
          nome: string;
          cidade_id: string;
          empresa_id: string;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cidade_id: string;
          empresa_id: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cidade_id?: string;
          empresa_id?: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      turnos: {
        Row: {
          id: string;
          nome: string;
          inicio: string;
          fim: string;
          hora_inicio: string;
          hora_fim: string;
          empresa_id: string;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          inicio: string;
          fim: string;
          hora_inicio: string;
          hora_fim: string;
          empresa_id: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          inicio?: string;
          fim?: string;
          hora_inicio?: string;
          hora_fim?: string;
          empresa_id?: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      empresas: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          email: string;
          data_vencimento: string | null;
          status: string;
          plano: string;
          max_entregadores: number | null;
          max_agendas_mes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          slug: string;
          email: string;
          data_vencimento?: string | null;
          status?: string;
          plano?: string;
          max_entregadores?: number | null;
          max_agendas_mes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          slug?: string;
          email?: string;
          data_vencimento?: string | null;
          status?: string;
          plano?: string;
          max_entregadores?: number | null;
          max_agendas_mes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      logs_sistema: {
        Row: {
          id: string;
          evento: string;
          detalhes: any;
          created_at: string;
          empresa_id?: string;
        };
        Insert: {
          id?: string;
          evento: string;
          detalhes?: any;
          created_at?: string;
          empresa_id?: string;
        };
        Update: {
          id?: string;
          evento?: string;
          detalhes?: any;
          created_at?: string;
          empresa_id?: string;
        };
      };
      configuracoes: {
        Row: {
          id: string;
          empresa_id: string;
          chave: string;
          valor: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          chave: string;
          valor: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          chave?: string;
          valor?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
