import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';

interface Regiao {
  id: string;
  nome: string;
  cidade_id: string;
}

export function useRegioes() {
  const { empresa } = useEmpresaUnificado();
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRegioes = async () => {
    if (!empresa) return;
    
    try {
      const { data, error } = await supabase
        .from('regioes')
        .select('id, nome, cidade_id')
        .eq('ativo', true)
        .eq('empresa_id', empresa.id)
        .order('nome');

      if (error) throw error;
      setRegioes(data || []);
    } catch (error) {
      console.error('Erro ao carregar regiões:', error);
      toast.error('Erro ao carregar regiões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (empresa) {
      loadRegioes();
    }
  }, [empresa]);

  return { 
    regioes, 
    loading,
    refetch: loadRegioes
  };
}