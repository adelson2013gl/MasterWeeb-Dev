import { Database } from "@/types/database";

export type Entregador = Database['public']['Tables']['entregadores']['Row'] & {
  cidade?: {
    nome: string;
    estado: string;
  };
};