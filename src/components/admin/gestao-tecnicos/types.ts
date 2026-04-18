import { Database } from "@/types/database";

export type Tecnico = Database['public']['Tables']['tecnicos']['Row'] & {
  cidade?: {
    nome: string;
    estado: string;
  };
};