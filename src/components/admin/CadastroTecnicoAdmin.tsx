import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { adminManagementService } from "@/services/adminManagementService";
import { toast } from "sonner";
import { Loader2, UserPlus, Users } from "lucide-react";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { Database } from "@/integrations/supabase/types";

type Setor = Database['public']['Tables']['setores']['Row'];

export function CadastroTecnicoAdmin() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    setor_id: "",
    password: "",
    confirmPassword: "",
  });
  
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSetores, setLoadingSetores] = useState(true);
  const [stats, setStats] = useState({ total: 0 });
  
  const { empresa, empresasDisponiveis } = useEmpresaUnificado();

  useEffect(() => {
    if (empresa) {
      fetchSetores();
      fetchStats();
    }
  }, [empresa]);

  const fetchSetores = async () => {
    if (!empresa) return;
    
    try {
      console.log('CadastroTecnicoAdmin: Carregando setores da empresa:', empresa.id);
      
      const { data, error } = await (supabase as any)
        .from('setores')
        .select('*')
        .eq('ativo', true)
        .eq('empresa_id', empresa.id)
        .order('nome');

      if (error) {
        console.error('CadastroTecnicoAdmin: Erro ao carregar setores:', error);
        throw error;
      }
      
      console.log('CadastroTecnicoAdmin: Setores carregados:', data?.length);
      setSetores(data || []);
    } catch (error) {
      console.error('CadastroTecnicoAdmin: Erro ao carregar setores:', error);
      toast.error("Não foi possível carregar os setores");
    } finally {
      setLoadingSetores(false);
    }
  };

  const fetchStats = async () => {
    if (!empresa) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('tecnicos')
        .select('id')
        .eq('empresa_id', empresa.id);

      if (error) throw error;
      
      setStats({
        total: data?.length || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Email é obrigatório");
      return false;
    }

    if (!formData.telefone.trim()) {
      toast.error("Telefone é obrigatório");
      return false;
    }

    if (!formData.cpf.trim()) {
      toast.error("CPF é obrigatório");
      return false;
    }

    if (!formData.setor_id) {
      toast.error("Selecione um setor");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!empresa) {
      toast.error("Empresa não identificada. Tente recarregar a página.");
      return;
    }

    setLoading(true);

    try {
      console.log('CadastroTecnicoAdmin: Iniciando cadastro para:', formData.email);
      console.log('CadastroTecnicoAdmin: Empresa atual:', empresa.id, empresa.nome);
      
      const allowedEmpresaIds = empresasDisponiveis.map(emp => emp.id);
      
      const result = await adminManagementService.createTecnico({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cpf: formData.cpf,
        setor_id: formData.setor_id,
        empresa_id: empresa.id,
        senha: formData.password
      }, allowedEmpresaIds);
      
      if (result.success) {
        console.log('CadastroTecnicoAdmin: Cadastro realizado com sucesso para empresa:', empresa.nome);
        toast.success(result.message);
        
        setFormData({
          nome: "",
          email: "",
          telefone: "",
          cpf: "",
          setor_id: "",
          password: "",
          confirmPassword: "",
        });
        
        fetchStats();
      }
    } catch (error) {
      console.error('CadastroTecnicoAdmin: Erro no cadastro:', error);
      
      let errorMessage = "Ocorreu um erro no cadastro";
      
      if (error instanceof Error) {
        if (error.message.includes("já está cadastrado")) {
          errorMessage = "Este email já está cadastrado";
        } else if (error.message.includes("duplicate key")) {
          errorMessage = "Já existe um cadastro com esses dados";
        } else if (error.message.includes("foreign key")) {
          errorMessage = "Erro na seleção do setor. Tente novamente.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cadastro de Técnicos</h2>
        <p className="text-gray-600">
          Cadastre novos técnicos para {empresa?.nome}
        </p>
      </div>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estatísticas de Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">Total de técnicos:</span>{' '}
              <span className="text-green-600">
                {stats.total}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Técnico
          </CardTitle>
          <CardDescription>
            Preencha os dados do novo técnico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Nome completo do técnico"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
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
                  required
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
                  required
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
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {setores.map((setor) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        {setor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha Temporária</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Confirme a senha"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || loadingSetores}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Técnico"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
