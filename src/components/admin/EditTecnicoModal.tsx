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
import { EditorEstrelas } from "./gestao-tecnicos/EditorEstrelas";
import { Tecnico } from "./gestao-tecnicos/types";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";

type Setor = Database['public']['Tables']['setores']['Row'];

interface EditTecnicoModalProps {
  tecnico: Tecnico;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTecnicoUpdated: (tecnico: Tecnico) => void;
}

export function EditTecnicoModal({ tecnico, open, onOpenChange, onTecnicoUpdated }: EditTecnicoModalProps) {
  const { empresa, isSuperAdmin } = useEmpresaUnificado();
  const [formData, setFormData] = useState({
    nome: tecnico.nome,
    email: tecnico.email,
    telefone: tecnico.telefone,
    cpf: tecnico.cpf,
    setor_id: tecnico.setor_id || '',
    status: tecnico.status,
    estrelas: tecnico.estrelas || 1,
  });
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSetores, setLoadingSetores] = useState(true);

  useEffect(() => {
    if (open) {
      fetchSetores();
      setFormData({
        nome: tecnico.nome,
        email: tecnico.email,
        telefone: tecnico.telefone,
        cpf: tecnico.cpf,
        setor_id: tecnico.setor_id || '',
        status: tecnico.status,
        estrelas: tecnico.estrelas || 1,
      });
    }
  }, [open, tecnico]);

  const fetchSetores = async () => {
    if (!empresa) {
      toast.error('Empresa não identificada');
      setLoadingSetores(false);
      return;
    }

    try {
      let query = (supabase as any)
        .from('setores')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      // Se não é Super Admin, filtrar por empresa
      if (!isSuperAdmin) {
        query = query.eq('empresa_id', empresa.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar setores:', error);
        toast.error('Erro ao carregar setores');
        return;
      }

      setSetores(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar setores');
    } finally {
      setLoadingSetores(false);
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

    // Verificar se o tecnico pertence à empresa atual (exceto Super Admin)
    if (!isSuperAdmin && tecnico.empresa_id !== empresa.id) {
      toast.error('Você não tem permissão para editar este tecnico');
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
      console.log('EditTecnicoModal: Atualizando tecnico:', tecnico.id);

      const updateData = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.replace(/\D/g, ''),
        cpf: formData.cpf.replace(/\D/g, ''),
        setor_id: formData.setor_id || null,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      // Construir query com filtros de segurança
      let updateQuery = (supabase as any)
        .from('tecnicos')
        .update(updateData)
        .eq('id', tecnico.id);

      // Se não é Super Admin, adicionar filtro por empresa
      if (!isSuperAdmin && empresa) {
        updateQuery = updateQuery.eq('empresa_id', empresa.id);
      }

      const { error } = await updateQuery;

      if (error) {
        console.error('EditTecnicoModal: Erro ao atualizar:', error);
        if (error.code === '23505') {
          toast.error('Este email ou CPF já está em uso por outro tecnico');
        } else {
          toast.error('Erro ao atualizar tecnico');
        }
        return;
      }

      // Buscar os dados atualizados com filtros de segurança
      let fetchQuery = (supabase as any)
        .from('tecnicos')
        .select(`*`)
        .eq('id', tecnico.id);

      // Se não é Super Admin, adicionar filtro por empresa
      if (!isSuperAdmin && empresa) {
        fetchQuery = fetchQuery.eq('empresa_id', empresa.id);
      }

      const { data: updatedData, error: fetchError } = await fetchQuery.single();

      if (fetchError) {
        console.error('EditTecnicoModal: Erro ao buscar dados atualizados:', fetchError);
        toast.error('Erro ao buscar dados atualizados');
      } else if (updatedData) {
        onTecnicoUpdated(updatedData);
      }

      console.log('EditTecnicoModal: Tecnico atualizado com sucesso');
      toast.success('Tecnico atualizado com sucesso!');
      onOpenChange(false);

    } catch (error) {
      console.error('EditTecnicoModal: Erro inesperado:', error);
      toast.error('Erro inesperado ao atualizar tecnico');
    } finally {
      setLoading(false);
    }
  };

  const handleTecnicoUpdate = () => {
    // Recarregar dados após atualização das estrelas
    onTecnicoUpdated({ ...tecnico, estrelas: formData.estrelas });
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
            Editar Tecnico
          </DialogTitle>
          <DialogDescription>
            Edite as informações do tecnico {tecnico.nome}
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
            <Label htmlFor="setor">Setor</Label>
            <Select
              value={formData.setor_id}
              onValueChange={(value) => handleInputChange('setor_id', value)}
              disabled={loading || loadingSetores}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingSetores ? "Carregando..." : "Selecione um setor"} />
              </SelectTrigger>
              <SelectContent>
                {setores.map((setor) => (
                  <SelectItem key={setor.id} value={setor.id}>
                    {setor.nome} - {setor.descricao || 'Sem descrição'}
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
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nível de Estrelas</Label>
            <EditorEstrelas 
              tecnico={{
                id: tecnico.id,
                nome: tecnico.nome,
                estrelas: tecnico.estrelas || 1
              }}
              onUpdate={handleTecnicoUpdate}
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
