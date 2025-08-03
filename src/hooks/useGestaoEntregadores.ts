
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { Entregador } from "@/components/admin/gestao-entregadores/types";

export function useGestaoEntregadores() {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [loading, setLoading] = useState(true);
  const { empresa, isSuperAdmin } = useEmpresaUnificado();

  const fetchEntregadores = async () => {
    if (!empresa) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Buscando entregadores para empresa:', empresa.id);
      
      let query = supabase
        .from('entregadores')
        .select(`
          *,
          cidades!entregadores_cidade_id_fkey(nome, estado)
        `)
        .order('created_at', { ascending: false });

      // Se não for Super Admin, filtrar apenas entregadores da empresa atual
      if (!isSuperAdmin) {
        query = query.eq('empresa_id', empresa.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar entregadores:', error);
        toast.error('Erro ao carregar entregadores');
        return;
      }

      console.log('Entregadores encontrados:', data?.length);
      
      const entregadoresFormatted = data?.map(entregador => ({
        ...entregador,
        cidade: entregador.cidades ? {
          nome: entregador.cidades.nome,
          estado: entregador.cidades.estado
        } : undefined
      })) || [];

      setEntregadores(entregadoresFormatted);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar entregadores');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, novoStatus: "aprovado" | "rejeitado") => {
    try {
      console.log(`Alterando status do entregador ${id} para ${novoStatus}`);

      const updateData: any = {
        status: novoStatus,
        updated_at: new Date().toISOString(),
      };

      if (novoStatus === "aprovado") {
        updateData.data_aprovacao = new Date().toISOString().split('T')[0];
        updateData.data_rejeicao = null;
        updateData.motivo_rejeicao = null;
      } else {
        updateData.data_rejeicao = new Date().toISOString().split('T')[0];
        updateData.data_aprovacao = null;
        updateData.motivo_rejeicao = "Rejeitado pelo administrador";
      }

      const { error } = await supabase
        .from('entregadores')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status do entregador');
        return;
      }

      setEntregadores(prev => 
        prev.map(entregador => 
          entregador.id === id 
            ? { ...entregador, ...updateData }
            : entregador
        )
      );
      
      const acao = novoStatus === "aprovado" ? "aprovado" : "rejeitado";
      toast.success(`Entregador ${acao} com sucesso!`);
    } catch (error) {
      console.error('Erro inesperado ao atualizar status:', error);
      toast.error('Erro inesperado');
    }
  };

  const handleReativar = async (id: string) => {
    try {
      console.log(`Reativando entregador ${id}`);

      const updateData = {
        status: "aprovado" as const,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('entregadores')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao reativar entregador:', error);
        toast.error('Erro ao reativar entregador');
        return;
      }

      setEntregadores(prev => 
        prev.map(entregador => 
          entregador.id === id 
            ? { ...entregador, ...updateData }
            : entregador
        )
      );
      
      toast.success('Entregador reativado com sucesso!');
    } catch (error) {
      console.error('Erro inesperado ao reativar entregador:', error);
      toast.error('Erro inesperado');
    }
  };

  const handleEntregadorUpdated = (updatedEntregador: Entregador) => {
    setEntregadores(prev => 
      prev.map(entregador => 
        entregador.id === updatedEntregador.id 
          ? updatedEntregador 
          : entregador
      )
    );
  };

  const getFilteredEntregadores = (searchTerm: string) => {
    return entregadores.filter(entregador =>
      entregador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entregador.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getEntregadoresPorStatus = (filteredEntregadores: Entregador[]) => {
    return {
      pendente: filteredEntregadores.filter(e => e.status === "pendente"),
      aprovado: filteredEntregadores.filter(e => e.status === "aprovado"),
      rejeitado: filteredEntregadores.filter(e => e.status === "rejeitado"),
      suspenso: filteredEntregadores.filter(e => e.status === "suspenso"),
    };
  };

  useEffect(() => {
    fetchEntregadores();
  }, [empresa, isSuperAdmin]);

  // Função para atualizar estrelas
  const updateEstrelas = async (id: string, estrelas: number) => {
    try {
      const { error } = await supabase
        .from('entregadores')
        .update({ 
          estrelas,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setEntregadores(prev => 
        prev.map(entregador => 
          entregador.id === id 
            ? { ...entregador, estrelas }
            : entregador
        )
      );

      toast.success('Estrelas atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar estrelas:', error);
      toast.error('Erro ao atualizar estrelas');
    }
  };

  return {
    entregadores,
    loading,
    handleStatusChange,
    handleReativar,
    handleEntregadorUpdated,
    getFilteredEntregadores,
    getEntregadoresPorStatus,
    updateEstrelas,
    refetch: fetchEntregadores
  };
}
