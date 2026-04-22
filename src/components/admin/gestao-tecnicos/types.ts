import { Database } from "@/types/database";

export type Tecnico = Database['public']['Tables']['tecnicos']['Row'] & {
  setor?: {
    nome: string;
    descricao: string;
  };
};