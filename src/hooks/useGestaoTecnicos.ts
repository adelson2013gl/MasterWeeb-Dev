
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { Tecnico } from "@/components/admin/gestao-tecnicos/types";

export function useGestaoTecnicos() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const { empresa, isSuperAdmin } = useEmpresaUnificado();

  const fetchTecnicos = async () => {
    if (!empresa) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Buscando tecnicos para empresa:', empresa.id);
      
      let query = supabase
        .from('tecnicos')
        .select(`
          *,
          cidades!tecnicos_cidade_id_fkey(nome, estado)
        `)
        .order('created_at', { ascending: false });

      // Se não for Super Admin, filtrar apenas tecnicos da empresa atual
      if (!isSuperAdmin) {
        query = query.eq('empresa_id', empresa.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar tecnicos:', error);
        toast.error('Erro ao carregar tecnicos');
        return;
      }

      console.log('Tecnicos encontrados:', data?.length);
      
      const tecnicosFormatted = data?.map(tecnico => ({
        ...tecnico,
        cidade: tecnico.cidades ? {
          nome: tecnico.cidades.nome,
          estado: tecnico.cidades.estado
        } : undefined
      })) || [];

      setTecnicos(tecnicosFormatted);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar tecnicos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, novoStatus: "aprovado" | "rejeitado") => {
    try {
      console.log(`Alterando status do tecnico ${id} para ${novoStatus}`);

      const updateData: any = {
        status: novoStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('tecnicos')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status do tecnico');
        return;
      }

      setTecnicos(prev => 
        prev.map(tecnico => 
          tecnico.id === id 
            ? { ...tecnico, ...updateData }
            : tecnico
        )
      );
      
      const acao = novoStatus === "aprovado" ? "aprovado" : "rejeitado";
      toast.success(`Tecnico ${acao} com sucesso!`);
    } catch (error) {
      console.error('Erro inesperado ao atualizar status:', error);
      toast.error('Erro inesperado');
    }
  };

  const handleReativar = async (id: string) => {
    try {
      console.log(`Reativando tecnico ${id}`);

      const updateData = {
        status: "aprovado" as const,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('tecnicos')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao reativar tecnico:', error);
        toast.error('Erro ao reativar tecnico');
        return;
      }

      setTecnicos(prev => 
        prev.map(tecnico => 
          tecnico.id === id 
            ? { ...tecnico, ...updateData }
            : tecnico
        )
      );
      
      toast.success('Tecnico reativado com sucesso!');
    } catch (error) {
      console.error('Erro inesperado ao reativar tecnico:', error);
      toast.error('Erro inesperado');
    }
  };

  const handleTecnicoUpdated = (updatedTecnico: Tecnico) => {
    setTecnicos(prev => 
      prev.map(tecnico => 
        tecnico.id === updatedTecnico.id 
          ? updatedTecnico 
          : tecnico
      )
    );
  };

  const getFilteredTecnicos = (searchTerm: string) => {
    return tecnicos.filter(tecnico =>
      tecnico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tecnico.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getTecnicosPorStatus = (filteredTecnicos: Tecnico[]) => {
    return {
      pendente: filteredTecnicos.filter(e => e.status === "pendente"),
      aprovado: filteredTecnicos.filter(e => e.status === "aprovado"),
      rejeitado: filteredTecnicos.filter(e => e.status === "rejeitado"),
      suspenso: filteredTecnicos.filter(e => e.status === "suspenso"),
    };
  };

  useEffect(() => {
    fetchTecnicos();
  }, [empresa, isSuperAdmin]);

  // Função para atualizar estrelas
  const updateEstrelas = async (id: string, estrelas: number) => {
    try {
      const { error } = await supabase
        .from('tecnicos')
        .update({ 
          estrelas,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setTecnicos(prev => 
        prev.map(tecnico => 
          tecnico.id === id 
            ? { ...tecnico, estrelas }
            : tecnico
        )
      );

      toast.success('Estrelas atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar estrelas:', error);
      toast.error('Erro ao atualizar estrelas');
    }
  };

  return {
    tecnicos,
    loading,
    handleStatusChange,
    handleReativar,
    handleTecnicoUpdated,
    getFilteredTecnicos,
    getTecnicosPorStatus,
    updateEstrelas,
    refetch: fetchTecnicos
  };
}
