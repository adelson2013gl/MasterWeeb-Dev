import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { isError, getErrorMessage } from "@/lib/typeGuards";
import { logger } from "@/lib/logger";

type Cidade = Database['public']['Tables']['cidades']['Row'];

interface RealCadastroFormProps {
  onBack: () => void;
}

export function RealCadastroForm({ onBack }: RealCadastroFormProps) {
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
  const { signUp } = useAuth();

  useEffect(() => {
    fetchCidades();
  }, []);

  const fetchCidades = async () => {
    try {
      logger.debug('Carregando cidades para cadastro', {}, 'AUTH');
      
      const { data, error } = await supabase
        .from('cidades')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        logger.error('Erro ao carregar cidades', { error: getErrorMessage(error) }, 'AUTH');
        throw error;
      }
      
      logger.info('Cidades carregadas', { quantidade: data?.length }, 'AUTH');
      setCidades(data || []);
    } catch (error) {
      logger.error('Erro ao carregar cidades', { error: getErrorMessage(error) }, 'AUTH');
      toast({
        title: "Erro",
        description: "Não foi possível carregar as cidades",
        variant: "destructive",
      });
    } finally {
      setLoadingCidades(false);
    }
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Email é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.telefone.trim()) {
      toast({
        title: "Erro",
        description: "Telefone é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.cpf.trim()) {
      toast({
        title: "Erro",
        description: "CPF é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.cidade_id) {
      toast({
        title: "Erro",
        description: "Selecione uma cidade",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      logger.info('Iniciando cadastro', { email: formData.email }, 'AUTH');
      
      const { error } = await signUp(formData.email, formData.password, {
        nome: formData.nome,
        telefone: formData.telefone,
        cpf: formData.cpf,
        cidade_id: formData.cidade_id,
      });
      
      if (error) {
        logger.error('Erro no cadastro', { email: formData.email, error: getErrorMessage(error) }, 'AUTH');
        
        let errorMessage = "Ocorreu um erro no cadastro";
        const errorMsg = getErrorMessage(error);
        
        if (errorMsg === "User already registered") {
          errorMessage = "Este email já está cadastrado";
        } else if (errorMsg.includes("duplicate key")) {
          errorMessage = "Já existe um cadastro com esses dados";
        } else if (errorMsg.includes("foreign key")) {
          errorMessage = "Erro na seleção da cidade. Tente novamente.";
        } else {
          errorMessage = errorMsg;
        }
        
        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        logger.info('Cadastro realizado com sucesso', { email: formData.email }, 'AUTH');
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email e aguarde a aprovação do cadastro.",
        });
        
        setFormData({
          nome: "",
          email: "",
          telefone: "",
          cpf: "",
          cidade_id: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      logger.error('Erro inesperado no cadastro', { email: formData.email, error: getErrorMessage(error) }, 'AUTH');
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="relative overflow-visible">
      <Card className="w-full max-w-md relative overflow-visible">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Cadastro de Entregador</CardTitle>
              <CardDescription>
                Preencha seus dados para se cadastrar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative overflow-visible">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
                disabled={loading}
                placeholder="Seu nome completo"
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
                placeholder="seu@email.com"
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

            <div className="space-y-2 relative">
              <Label htmlFor="cidade">Cidade</Label>
              <div className="relative overflow-visible">
                <Select 
                  value={formData.cidade_id} 
                  onValueChange={(value) => {
                    logger.debug('Cidade selecionada', { cidadeId: value }, 'AUTH');
                    handleInputChange('cidade_id', value);
                  }}
                  disabled={loading || loadingCidades}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione sua cidade" />
                  </SelectTrigger>
                  <SelectContent 
                    position="popper"
                    className="z-[9999] bg-white border shadow-lg"
                    sideOffset={5}
                  >
                    {cidades.map((cidade) => (
                      <SelectItem key={cidade.id} value={cidade.id}>
                        {cidade.nome} - {cidade.estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                disabled={loading}
                placeholder="Confirme sua senha"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading || loadingCidades}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
