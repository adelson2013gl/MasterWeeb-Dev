export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ordens_servico: {
        Row: {
          created_at: string
          data_abertura: string
          data_cancelamento: string | null
          data_conclusao: string | null
          data_inicio_execucao: string | null
          descricao_problema: string
          descricao_solucao: string | null
          empresa_id: string
          equipamento: string | null
          id: string
          motivo_cancelamento: string | null
          numero_os: number
          observacoes: string | null
          prioridade: Database["public"]["Enums"]["prioridade_os"]
          setor_id: string | null
          status: Database["public"]["Enums"]["status_os"]
          tecnico_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_abertura?: string
          data_cancelamento?: string | null
          data_conclusao?: string | null
          data_inicio_execucao?: string | null
          descricao_problema: string
          descricao_solucao?: string | null
          empresa_id: string
          equipamento?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero_os?: number
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_os"]
          setor_id?: string | null
          status?: Database["public"]["Enums"]["status_os"]
          tecnico_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_abertura?: string
          data_cancelamento?: string | null
          data_conclusao?: string | null
          data_inicio_execucao?: string | null
          descricao_problema?: string
          descricao_solucao?: string | null
          empresa_id?: string
          equipamento?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero_os?: number
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_os"]
          setor_id?: string | null
          status?: Database["public"]["Enums"]["status_os"]
          tecnico_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          created_at: string | null
          data_proximo_pagamento: string | null
          empresa_id: string
          id: string
          mercadopago_subscription_id: string | null
          metadata: Json | null
          plano: string
          status: string
          updated_at: string | null
          valor_mensal: number | null
          iugu_subscription_id: string | null
          iugu_customer_id: string | null
          iugu_plan_id: string | null
          gateway: string | null
          ambiente: string | null
        }
        Insert: {
          created_at?: string | null
          data_proximo_pagamento?: string | null
          empresa_id: string
          id?: string
          mercadopago_subscription_id?: string | null
          metadata?: Json | null
          plano: string
          status?: string
          updated_at?: string | null
          valor_mensal?: number | null
          iugu_subscription_id?: string | null
          iugu_customer_id?: string | null
          iugu_plan_id?: string | null
          gateway?: string | null
          ambiente?: string | null
        }
        Update: {
          created_at?: string | null
          data_proximo_pagamento?: string | null
          empresa_id?: string
          id?: string
          mercadopago_subscription_id?: string | null
          metadata?: Json | null
          plano?: string
          status?: string
          updated_at?: string | null
          valor_mensal?: number | null
          iugu_subscription_id?: string | null
          iugu_customer_id?: string | null
          iugu_plan_id?: string | null
          gateway?: string | null
          ambiente?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          id: string
          chave: string
          valor: string | null
          tipo: string
          categoria: string
          descricao: string | null
          sensivel: boolean | null
          ambiente: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          chave: string
          valor?: string | null
          tipo: string
          categoria: string
          descricao?: string | null
          sensivel?: boolean | null
          ambiente?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          chave?: string
          valor?: string | null
          tipo?: string
          categoria?: string
          descricao?: string | null
          sensivel?: boolean | null
          ambiente?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      iugu_customers: {
        Row: {
          id: string
          empresa_id: string
          iugu_customer_id: string
          email: string
          nome: string
          cpf_cnpj: string | null
          telefone: string | null
          notas: string | null
          variaveis_customizadas: Json | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          iugu_customer_id: string
          email: string
          nome: string
          cpf_cnpj?: string | null
          telefone?: string | null
          notas?: string | null
          variaveis_customizadas?: Json | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          iugu_customer_id?: string
          email?: string
          nome?: string
          cpf_cnpj?: string | null
          telefone?: string | null
          notas?: string | null
          variaveis_customizadas?: Json | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iugu_customers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      iugu_invoices: {
        Row: {
          id: string
          empresa_id: string
          assinatura_id: string | null
          iugu_invoice_id: string
          iugu_subscription_id: string | null
          iugu_customer_id: string | null
          status: string
          valor_centavos: number
          valor_pago_centavos: number | null
          moeda: string | null
          data_vencimento: string | null
          data_pagamento: string | null
          url_fatura: string | null
          url_pdf: string | null
          metodo_pagamento: string | null
          pix_qrcode: string | null
          pix_qrcode_text: string | null
          boleto_linha_digitavel: string | null
          boleto_codigo_barras: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          assinatura_id?: string | null
          iugu_invoice_id: string
          iugu_subscription_id?: string | null
          iugu_customer_id?: string | null
          status: string
          valor_centavos: number
          valor_pago_centavos?: number | null
          moeda?: string | null
          data_vencimento?: string | null
          data_pagamento?: string | null
          url_fatura?: string | null
          url_pdf?: string | null
          metodo_pagamento?: string | null
          pix_qrcode?: string | null
          pix_qrcode_text?: string | null
          boleto_linha_digitavel?: string | null
          boleto_codigo_barras?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          assinatura_id?: string | null
          iugu_invoice_id?: string
          iugu_subscription_id?: string | null
          iugu_customer_id?: string | null
          status?: string
          valor_centavos?: number
          valor_pago_centavos?: number | null
          moeda?: string | null
          data_vencimento?: string | null
          data_pagamento?: string | null
          url_fatura?: string | null
          url_pdf?: string | null
          metodo_pagamento?: string | null
          pix_qrcode?: string | null
          pix_qrcode_text?: string | null
          boleto_linha_digitavel?: string | null
          boleto_codigo_barras?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iugu_invoices_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iugu_invoices_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      iugu_plans: {
        Row: {
          id: string
          iugu_plan_id: string
          identificador: string
          nome: string
          intervalo: string
          tipo_intervalo: number | null
          valor_centavos: number
          moeda: string | null
          recursos: string[] | null
          metadata: Json | null
          ativo: boolean | null
          sincronizado_em: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          iugu_plan_id: string
          identificador: string
          nome: string
          intervalo: string
          tipo_intervalo?: number | null
          valor_centavos: number
          moeda?: string | null
          recursos?: string[] | null
          metadata?: Json | null
          ativo?: boolean | null
          sincronizado_em?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          iugu_plan_id?: string
          identificador?: string
          nome?: string
          intervalo?: string
          tipo_intervalo?: number | null
          valor_centavos?: number
          moeda?: string | null
          recursos?: string[] | null
          metadata?: Json | null
          ativo?: boolean | null
          sincronizado_em?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      iugu_webhooks: {
        Row: {
          id: string
          evento_tipo: string
          recurso_id: string | null
          iugu_id: string | null
          payload: Json
          processado: boolean | null
          data_recebimento: string | null
          data_processamento: string | null
          erro: string | null
          tentativas: number | null
        }
        Insert: {
          id?: string
          evento_tipo: string
          recurso_id?: string | null
          iugu_id?: string | null
          payload: Json
          processado?: boolean | null
          data_recebimento?: string | null
          data_processamento?: string | null
          erro?: string | null
          tentativas?: number | null
        }
        Update: {
          id?: string
          evento_tipo?: string
          recurso_id?: string | null
          iugu_id?: string | null
          payload?: Json
          processado?: boolean | null
          data_recebimento?: string | null
          data_processamento?: string | null
          erro?: string | null
          tentativas?: number | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          categoria: string | null
          chave: string
          created_at: string | null
          descricao: string | null
          empresa_id: string
          id: string
          tipo: Database["public"]["Enums"]["tipo_configuracao"]
          updated_at: string | null
          valor: string
        }
        Insert: {
          categoria?: string | null
          chave: string
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          tipo: Database["public"]["Enums"]["tipo_configuracao"]
          updated_at?: string | null
          valor: string
        }
        Update: {
          categoria?: string | null
          chave?: string
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_configuracao"]
          updated_at?: string | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string | null
          created_at: string | null
          data_vencimento: string | null
          dominio: string | null
          email: string | null
          id: string
          logo: string | null
          max_agendas_mes: number | null
          max_entregadores: number | null
          nome: string
          plano: string
          slug: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          dominio?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          max_agendas_mes?: number | null
          max_entregadores?: number | null
          nome: string
          plano?: string
          slug?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          dominio?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          max_agendas_mes?: number | null
          max_entregadores?: number | null
          nome?: string
          plano?: string
          slug?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tecnicos: {
        Row: {
          ativo: boolean | null
          cpf: string | null
          created_at: string | null
          email: string
          empresa_id: string
          estrelas: number | null
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil_usuario"] | null
          placa: string | null
          status: Database["public"]["Enums"]["status_tecnico"] | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
          veiculo: string | null
        }
        Insert: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email: string
          empresa_id: string
          estrelas?: number | null
          id?: string
          nome: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"] | null
          placa?: string | null
          status?: Database["public"]["Enums"]["status_tecnico"] | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
          veiculo?: string | null
        }
        Update: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          empresa_id?: string
          estrelas?: number | null
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"] | null
          placa?: string | null
          status?: Database["public"]["Enums"]["status_tecnico"] | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
          veiculo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tecnicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          assinatura_id: string
          created_at: string | null
          id: string
          mercadopago_payment_id: string | null
          status: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          assinatura_id: string
          created_at?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          status?: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          assinatura_id?: string
          created_at?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          status?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_empresas: {
        Args: {
          user_uuid: string
        }
        Returns: {
          id: string
          nome: string
          role: string
        }[]
      }
    }
    Enums: {
      perfil_usuario: "tecnico" | "admin"
      prioridade_os: "baixa" | "media" | "alta" | "urgente"
      status_os: "aberta" | "em_andamento" | "finalizada" | "cancelada"
      status_tecnico: "pendente" | "aprovado" | "rejeitado" | "suspenso"
      tipo_configuracao: "boolean" | "integer" | "string" | "decimal" | "json"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
    ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      perfil_usuario: ["tecnico", "admin"],
      prioridade_os: ["baixa", "media", "alta", "urgente"],
      status_os: ["aberta", "em_andamento", "finalizada", "cancelada"],
      status_tecnico: ["pendente", "aprovado", "rejeitado", "suspenso"],
      tipo_configuracao: ["boolean", "integer", "string", "decimal", "json"],
    },
  },
} as const
