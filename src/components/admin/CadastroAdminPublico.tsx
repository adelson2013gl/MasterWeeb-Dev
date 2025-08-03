
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Shield, Building2, User, Mail, Lock, CheckCircle } from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
}

export function CadastroAdminPublico() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    empresa_id: '',
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    codigoAcesso: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    try {
      console.log('🔄 Carregando empresas para cadastro público...');
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('ativa', true)
        .order('nome');

      if (error) {
        console.error('❌ Erro ao carregar empresas:', error);
        toast({
          title: "Erro ao carregar empresas",
          description: "Tente novamente em alguns instantes",
          variant: "destructive",
        });
      } else {
        console.log(`✅ ${data.length} empresas carregadas`);
        setEmpresas(data);
      }
    } catch (error: any) {
      console.error('💥 Erro inesperado:', error);
      toast({
        title: "Erro de conexão",
        description: "Verifique sua conexão com a internet",
        variant: "destructive",
      });
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const validarFormulario = () => {
    const novosErros: Record<string, string> = {};

    if (!formData.empresa_id) {
      novosErros.empresa_id = 'Selecione uma empresa';
    }

    if (!formData.nome || formData.nome.trim().length < 2) {
      novosErros.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email || !formData.email.includes('@')) {
      novosErros.email = 'Email válido é obrigatório';
    }

    if (!formData.senha || formData.senha.length < 6) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.senha !== formData.confirmarSenha) {
      novosErros.confirmarSenha = 'As senhas não coincidem';
    }

    if (!formData.codigoAcesso || formData.codigoAcesso.trim().length < 4) {
      novosErros.codigoAcesso = 'Código de acesso é obrigatório';
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      toast({
        title: "Dados incompletos",
        description: "Verifique os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log('🚀 Iniciando cadastro de admin público...');

    try {
      const { data, error } = await supabase.functions.invoke('cadastro-admin-empresa', {
        body: {
          empresa_id: formData.empresa_id,
          nome: formData.nome.trim(),
          email: formData.email.trim().toLowerCase(),
          senha: formData.senha,
          codigo_acesso: formData.codigoAcesso.trim(),
          origem: 'interface_publica'
        }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        toast({
          title: "Erro no cadastro",
          description: error.message || "Tente novamente em alguns instantes",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Admin cadastrado com sucesso:', data);
      setSuccess(true);
      
      // Limpar formulário
      setFormData({
        empresa_id: '',
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        codigoAcesso: ''
      });

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "O administrador foi criado e pode fazer login agora",
      });

    } catch (error: any) {
      console.error('💥 Erro inesperado no cadastro:', error);
      toast({
        title: "Erro de conexão",
        description: "Verifique sua conexão e tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Cadastro Concluído!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  O administrador foi criado com sucesso e já pode fazer login no sistema.
                </p>
              </div>
              <Button 
                onClick={() => setSuccess(false)}
                className="w-full"
              >
                Cadastrar Outro Admin
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Ir para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Área Administrativa Restrita
          </CardTitle>
          <CardDescription>
            Criação de administradores para empresas cadastradas
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Acesso Restrito:</strong> Esta interface é exclusiva para o proprietário do sistema. 
              Requer código de acesso válido fornecido pela administração.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção da Empresa */}
            <div className="space-y-2">
              <Label htmlFor="empresa" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Empresa
              </Label>
              <Select 
                value={formData.empresa_id} 
                onValueChange={(value) => handleInputChange('empresa_id', value)}
                disabled={loadingEmpresas}
              >
                <SelectTrigger className={errors.empresa_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder={loadingEmpresas ? "Carregando..." : "Selecione uma empresa"} />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.empresa_id && (
                <p className="text-sm text-red-600">{errors.empresa_id}</p>
              )}
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo
              </Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Digite seu nome completo"
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-red-600">{errors.nome}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="admin@empresa.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.senha}
                  onChange={(e) => handleInputChange('senha', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={errors.senha ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.senha && (
                <p className="text-sm text-red-600">{errors.senha}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirmar Senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmarSenha}
                  onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                  placeholder="Repita a senha"
                  className={errors.confirmarSenha ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-sm text-red-600">{errors.confirmarSenha}</p>
              )}
            </div>

            {/* Código de Acesso */}
            <div className="space-y-2">
              <Label htmlFor="codigoAcesso" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Código de Acesso
              </Label>
              <Input
                id="codigoAcesso"
                type="text"
                value={formData.codigoAcesso}
                onChange={(e) => handleInputChange('codigoAcesso', e.target.value)}
                placeholder="Código fornecido pela empresa"
                className={errors.codigoAcesso ? 'border-red-500' : ''}
              />
              {errors.codigoAcesso && (
                <p className="text-sm text-red-600">{errors.codigoAcesso}</p>
              )}
              <p className="text-xs text-gray-500">
                Solicite o código de acesso ao responsável da empresa
              </p>
            </div>

            {/* Botão Submit */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || loadingEmpresas}
            >
              {loading ? 'Cadastrando...' : 'Criar Conta de Administrador'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => window.location.href = '/'}
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              Voltar para Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
