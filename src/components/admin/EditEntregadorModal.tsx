
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Edit } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { EditorEstrelas } from "./gestao-entregadores/EditorEstrelas";
import { Entregador } from "./gestao-entregadores/types";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";

type Cidade = Database['public']['Tables']['cidades']['Row'];

interface EditEntregadorModalProps {
  entregador: Entregador;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntregadorUpdated: (entregador: Entregador) => void;
}

export function EditEntregadorModal({ entregador, open, onOpenChange, onEntregadorUpdated }: EditEntregadorModalProps) {
  const { empresa, isSuperAdmin } = useEmpresaUnificado();
  const [formData, setFormData] = useState({
    nome: entregador.nome,
    email: entregador.email,
    telefone: entregador.telefone,
    cpf: entregador.cpf,
    cidade_id: entregador.cidade_id,
    status: entregador.status,
    estrelas: entregador.estrelas || 1,
  });
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCidades, setLoadingCidades] = useState(true);

  useEffect(() => {
    if (open) {
      fetchCidades();
      setFormData({
        nome: entregador.nome,
        email: entregador.email,
        telefone: entregador.telefone,
        cpf: entregador.cpf,
        cidade_id: entregador.cidade_id,
        status: entregador.status,
        estrelas: entregador.estrelas || 1,
      });
    }
  }, [open, entregador]);

  const fetchCidades = async () => {
    if (!empresa) {
      toast.error('Empresa não identificada');
      setLoadingCidades(false);
      return;
    }

    try {
      let query = supabase
        .from('cidades')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      // Se não é Super Admin, filtrar por empresa
      if (!isSuperAdmin) {
        query = query.eq('empresa_id', empresa.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar cidades:', error);
        toast.error('Erro ao carregar cidades');
        return;
      }

      setCidades(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar cidades');
    } finally {
      setLoadingCidades(false);
    }
  };

  const formatarCPF = (cpf: string) => {
    const apenasNumeros = cpf.replace(/\D/g, '');
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarTelefone = (telefone: string) => {
    const apenasNumeros = telefone.replace(/\D/g, '');
    if (apenasNumeros.length === 11) {
      return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cpf') {
      const apenasNumeros = value.replace(/\D/g, '');
      if (apenasNumeros.length <= 11) {
        setFormData(prev => ({ ...prev, [field]: formatarCPF(apenasNumeros) }));
      }
    } else if (field === 'telefone') {
      const apenasNumeros = value.replace(/\D/g, '');
      if (apenasNumeros.length <= 11) {
        setFormData(prev => ({ ...prev, [field]: formatarTelefone(apenasNumeros) }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validatePermissions = () => {
    if (!empresa) {
      toast.error('Empresa não identificada');
      return false;
    }

    // Verificar se o entregador pertence à empresa atual (exceto Super Admin)
    if (!isSuperAdmin && entregador.empresa_id !== empresa.id) {
      toast.error('Você não tem permissão para editar este entregador');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePermissions()) {
      return;
    }

    if (!formData.nome.trim() || !formData.email.trim() || !formData.telefone.trim() || !formData.cpf.trim()) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      console.log('EditEntregadorModal: Atualizando entregador:', entregador.id);

      const updateData = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.replace(/\D/g, ''),
        cpf: formData.cpf.replace(/\D/g, ''),
        cidade_id: formData.cidade_id,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      // Construir query com filtros de segurança
      let updateQuery = supabase
        .from('entregadores')
        .update(updateData)
        .eq('id', entregador.id);

      // Se não é Super Admin, adicionar filtro por empresa
      if (!isSuperAdmin && empresa) {
        updateQuery = updateQuery.eq('empresa_id', empresa.id);
      }

      const { error } = await updateQuery;

      if (error) {
        console.error('EditEntregadorModal: Erro ao atualizar:', error);
        if (error.code === '23505') {
          toast.error('Este email ou CPF já está em uso por outro entregador');
        } else {
          toast.error('Erro ao atualizar entregador');
        }
        return;
      }

      // Buscar os dados atualizados com filtros de segurança
      let fetchQuery = supabase
        .from('entregadores')
        .select(`
          *,
          cidades!entregadores_cidade_id_fkey(nome, estado)
        `)
        .eq('id', entregador.id);

      // Se não é Super Admin, adicionar filtro por empresa
      if (!isSuperAdmin && empresa) {
        fetchQuery = fetchQuery.eq('empresa_id', empresa.id);
      }

      const { data: updatedData, error: fetchError } = await fetchQuery.single();

      if (fetchError) {
        console.error('EditEntregadorModal: Erro ao buscar dados atualizados:', fetchError);
        toast.error('Erro ao buscar dados atualizados');
      } else if (updatedData) {
        const updatedEntregador = {
          ...updatedData,
          cidade: updatedData.cidades ? {
            nome: updatedData.cidades.nome,
            estado: updatedData.cidades.estado
          } : undefined
        };
        onEntregadorUpdated(updatedEntregador);
      }

      console.log('EditEntregadorModal: Entregador atualizado com sucesso');
      toast.success('Entregador atualizado com sucesso!');
      onOpenChange(false);

    } catch (error) {
      console.error('EditEntregadorModal: Erro inesperado:', error);
      toast.error('Erro inesperado ao atualizar entregador');
    } finally {
      setLoading(false);
    }
  };

  const handleEntregadorUpdate = () => {
    // Recarregar dados após atualização das estrelas
    onEntregadorUpdated({ ...entregador, estrelas: formData.estrelas });
  };

  // Se não há empresa identificada, não renderizar
  if (!empresa) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Entregador
          </DialogTitle>
          <DialogDescription>
            Edite as informações do entregador {entregador.nome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              disabled={loading}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              disabled={loading}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => handleInputChange('cpf', e.target.value)}
              disabled={loading}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Select
              value={formData.cidade_id}
              onValueChange={(value) => handleInputChange('cidade_id', value)}
              disabled={loading || loadingCidades}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCidades ? "Carregando..." : "Selecione uma cidade"} />
              </SelectTrigger>
              <SelectContent>
                {cidades.map((cidade) => (
                  <SelectItem key={cidade.id} value={cidade.id}>
                    {cidade.nome} - {cidade.estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nível de Estrelas</Label>
            <EditorEstrelas 
              entregador={{
                id: entregador.id,
                nome: entregador.nome,
                estrelas: entregador.estrelas || 1
              }}
              onUpdate={handleEntregadorUpdate}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
