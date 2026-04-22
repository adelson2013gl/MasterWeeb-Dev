import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Wrench,
  Search,
  X
} from "lucide-react";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { Database } from "@/integrations/supabase/types";

type Setor = Database['public']['Tables']['setores']['Row'];

export function GestaoSetores() {
  const { empresa, isSuperAdmin } = useEmpresaUnificado();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSetor, setSelectedSetor] = useState<Setor | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ativo: true
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (empresa) {
      fetchSetores();
    }
  }, [empresa]);

  const fetchSetores = async () => {
    if (!empresa) return;
    
    try {
      setLoading(true);
      
      let query = (supabase as any)
        .from('setores')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('nome');

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar setores:', error);
        toast.error("Erro ao carregar setores");
        return;
      }
      
      setSetores(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error("Erro inesperado ao carregar setores");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (setor?: Setor) => {
    if (setor) {
      setIsEditing(true);
      setSelectedSetor(setor);
      setFormData({
        nome: setor.nome,
        descricao: setor.descricao || "",
        ativo: setor.ativo
      });
    } else {
      setIsEditing(false);
      setSelectedSetor(null);
      setFormData({
        nome: "",
        descricao: "",
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedSetor(null);
    setFormData({
      nome: "",
      descricao: "",
      ativo: true
    });
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome do setor é obrigatório");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !empresa) return;

    setSaving(true);

    try {
      if (isEditing && selectedSetor) {
        // Atualizar setor existente
        const { error } = await (supabase as any)
          .from('setores')
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            ativo: formData.ativo,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedSetor.id)
          .eq('empresa_id', empresa.id);

        if (error) throw error;
        
        toast.success("Setor atualizado com sucesso!");
      } else {
        // Criar novo setor
        const { error } = await (supabase as any)
          .from('setores')
          .insert({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            ativo: formData.ativo,
            empresa_id: empresa.id
          });

        if (error) throw error;
        
        toast.success("Setor criado com sucesso!");
      }

      handleCloseModal();
      fetchSetores();
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
      toast.error("Erro ao salvar setor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (setorId: string) => {
    if (!empresa) return;
    
    if (!confirm("Tem certeza que deseja excluir este setor?")) {
      return;
    }

    setDeleting(setorId);

    try {
      const { error } = await (supabase as any)
        .from('setores')
        .delete()
        .eq('id', setorId)
        .eq('empresa_id', empresa.id);

      if (error) throw error;
      
      toast.success("Setor excluído com sucesso!");
      fetchSetores();
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast.error("Erro ao excluir setor");
    } finally {
      setDeleting(null);
    }
  };

  const filteredSetores = setores.filter(setor => 
    setor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (setor.descricao && setor.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!empresa) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Empresa não identificada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Setores</h2>
          <p className="text-gray-600">
            Gerencie os setores industriais da {empresa.nome}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Setor
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Setores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{setores.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Setores Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {setores.filter(s => s.ativo).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Setores Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {setores.filter(s => !s.ativo).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar setores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Lista de Setores
          </CardTitle>
          <CardDescription>
            {filteredSetores.length} setor{filteredSetores.length !== 1 ? 'es' : ''} encontrado{filteredSetores.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredSetores.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm 
                  ? "Nenhum setor encontrado para esta busca" 
                  : "Nenhum setor cadastrado. Clique em 'Novo Setor' para começar."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSetores.map((setor) => (
                  <TableRow key={setor.id}>
                    <TableCell className="font-medium">{setor.nome}</TableCell>
                    <TableCell className="text-gray-600">
                      {setor.descricao || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={setor.ativo ? "default" : "secondary"}>
                        {setor.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(setor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(setor.id)}
                          disabled={deleting === setor.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deleting === setor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criar/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Setor" : "Novo Setor"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Edite as informações do setor" 
                : "Preencha as informações para criar um novo setor"
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Setor *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Manutenção, Produção, Qualidade"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição opcional do setor"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Setor ativo
              </Label>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  isEditing ? "Salvar Alterações" : "Criar Setor"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
