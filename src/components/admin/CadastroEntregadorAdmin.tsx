
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { adminManagementService } from "@/services/adminManagementService";
import { toast } from "sonner";
import { Loader2, UserPlus, Users, AlertTriangle } from "lucide-react";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { Database } from "@/integrations/supabase/types";
import { PlanLimitGuard, PlanLimitAlert } from "@/components/billing/PlanLimitGuard";
import { safeStringToPlanoType } from "@/lib/typeGuards";

type Cidade = Database['public']['Tables']['cidades']['Row'];

export function CadastroEntregadorAdmin() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    cidade_id: "",
    password: "",
    confirmPassword: "",
  });
  
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCidades, setLoadingCidades] = useState(true);
  const [stats, setStats] = useState({ total: 0, limite: 0 });
  
  // CORREÇÃO: Mover useEmpresaUnificado para o nível superior
  const { empresa, empresasDisponiveis } = useEmpresaUnificado();

  useEffect(() => {
    if (empresa) {
      fetchCidades();
      fetchStats();
    }
  }, [empresa]);

  const fetchCidades = async () => {
    if (!empresa) return;
    
    try {
      console.log('CadastroEntregadorAdmin: Carregando cidades da empresa:', empresa.id);
      
      const { data, error } = await supabase
        .from('cidades')
        .select('*')
        .eq('ativo', true)
        .eq('empresa_id', empresa.id)
        .order('nome');

      if (error) {
        console.error('CadastroEntregadorAdmin: Erro ao carregar cidades:', error);
        throw error;
      }
      
      console.log('CadastroEntregadorAdmin: Cidades carregadas:', data?.length);
      setCidades(data || []);
    } catch (error) {
      console.error('CadastroEntregadorAdmin: Erro ao carregar cidades:', error);
      toast.error("Não foi possível carregar as cidades");
    } finally {
      setLoadingCidades(false);
    }
  };

  const fetchStats = async () => {
    if (!empresa) return;
    
    try {
      const { data, error } = await supabase
        .from('entregadores')
        .select('id')
        .eq('empresa_id', empresa.id);

      if (error) throw error;
      
      setStats({
        total: data?.length || 0,
        limite: empresa.max_entregadores || 0
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

    if (!formData.cidade_id) {
      toast.error("Selecione uma cidade");
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

    // Verificar limite de entregadores
    if (stats.limite > 0 && stats.total >= stats.limite) {
      toast.error(`Limite de ${stats.limite} entregadores atingido para esta empresa`);
      return;
    }

    if (!empresa) {
      toast.error("Empresa não identificada. Tente recarregar a página.");
      return;
    }

    setLoading(true);

    try {
      console.log('CadastroEntregadorAdmin: Iniciando cadastro para:', formData.email);
      console.log('CadastroEntregadorAdmin: Empresa atual:', empresa.id, empresa.nome);
      
      // CORREÇÃO: Usar empresasDisponiveis da variável extraída no início
      const allowedEmpresaIds = empresasDisponiveis.map(emp => emp.id);
      
      const result = await adminManagementService.createEntregador({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cpf: formData.cpf,
        cidade_id: formData.cidade_id,
        empresa_id: empresa.id,
        senha: formData.password
      }, allowedEmpresaIds);
      
      if (result.success) {
        console.log('CadastroEntregadorAdmin: Cadastro realizado com sucesso para empresa:', empresa.nome);
        toast.success(result.message);
        
        setFormData({
          nome: "",
          email: "",
          telefone: "",
          cpf: "",
          cidade_id: "",
          password: "",
          confirmPassword: "",
        });
        
        fetchStats(); // Atualizar estatísticas
      }
    } catch (error) {
      console.error('CadastroEntregadorAdmin: Erro no cadastro:', error);
      
      let errorMessage = "Ocorreu um erro no cadastro";
      
      if (error instanceof Error) {
        if (error.message.includes("já está cadastrado")) {
          errorMessage = "Este email já está cadastrado";
        } else if (error.message.includes("duplicate key")) {
          errorMessage = "Já existe um cadastro com esses dados";
        } else if (error.message.includes("foreign key")) {
          errorMessage = "Erro na seleção da cidade. Tente novamente.";
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
        <h2 className="text-2xl font-bold text-gray-900">Cadastro de Entregadores</h2>
        <p className="text-gray-600">
          Cadastre novos entregadores para {empresa?.nome}
        </p>
      </div>

      {/* Alerta de limite próximo */}
      {empresa && (
        <PlanLimitAlert
          empresaId={empresa.id}
          plano={safeStringToPlanoType(empresa.plano || 'basico')}
          action="add_entregador"
          threshold={80}
        />
      )}

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estatísticas de Entregadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">Total de entregadores:</span>{' '}
              <span className="text-green-600">
                {stats.total}
              </span>
              {stats.limite > 0 && (
                <span className="text-gray-500">
                  {' '}/ {stats.limite}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Entregador
          </CardTitle>
          <CardDescription>
            Preencha os dados do novo entregador
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
                  placeholder="Nome completo do entregador"
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
                <Label htmlFor="cidade">Cidade</Label>
                <Select 
                  value={formData.cidade_id} 
                  onValueChange={(value) => handleInputChange('cidade_id', value)}
                  disabled={loading || loadingCidades}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {cidades.map((cidade) => (
                      <SelectItem key={cidade.id} value={cidade.id}>
                        {cidade.nome}
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
            
            {empresa ? (
              <PlanLimitGuard
                empresaId={empresa.id}
                plano={safeStringToPlanoType(empresa.plano || 'basico')}
                action="add_entregador"
              >
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || loadingCidades}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Cadastrar Entregador"
                  )}
                </Button>
              </PlanLimitGuard>
            ) : (
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || loadingCidades}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar Entregador"
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
