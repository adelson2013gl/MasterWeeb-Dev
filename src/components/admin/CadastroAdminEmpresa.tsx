
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';

// Schema de validação com Zod
const cadastroAdminSchema = z.object({
  empresa_id: z.string().min(1, 'Selecione uma empresa'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string().min(6, 'Confirmação de senha obrigatória'),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type CadastroAdminForm = z.infer<typeof cadastroAdminSchema>;

interface Empresa {
  id: string;
  nome: string;
  ativa: boolean;
}

export function CadastroAdminEmpresa() {
  const { isSuperAdmin } = useEmpresaUnificado();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [empresasLoading, setEmpresasLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<CadastroAdminForm>({
    resolver: zodResolver(cadastroAdminSchema),
    defaultValues: {
      empresa_id: '',
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
    },
  });

  // Carregar empresas disponíveis
  useEffect(() => {
    const carregarEmpresas = async () => {
      try {
        console.log('🔄 Carregando empresas para cadastro de admin...');
        const { data, error } = await supabase
          .from('empresas')
          .select('id, nome, ativa')
          .eq('ativa', true)
          .order('nome');

        if (error) {
          console.error('❌ Erro ao carregar empresas:', error);
          toast.error('Erro ao carregar empresas');
          return;
        }

        console.log('✅ Empresas carregadas:', data?.length);
        setEmpresas(data || []);
      } catch (error) {
        console.error('💥 Erro inesperado:', error);
        toast.error('Erro inesperado ao carregar empresas');
      } finally {
        setEmpresasLoading(false);
      }
    };

    carregarEmpresas();
  }, []);

  // Verificar disponibilidade do email
  const verificarEmailDisponivel = async (email: string): Promise<boolean> => {
    try {
      console.log('📧 Verificando email na tabela entregadores:', email);
      
      const { data, error } = await supabase
        .from('entregadores')
        .select('id, email, perfil')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar email na tabela entregadores:', error);
        return false;
      }

      if (data) {
        console.warn('⚠️ Email já existe na tabela entregadores:', {
          id: data.id,
          email: data.email,
          perfil: data.perfil
        });
        return false;
      }

      console.log('✅ Email não encontrado na tabela entregadores, está disponível');
      return true;
    } catch (error) {
      console.error('💥 Erro inesperado na verificação de email:', error);
      return false;
    }
  };

  // Submissão do formulário
  const onSubmit = async (data: CadastroAdminForm) => {
    if (!isSuperAdmin) {
      toast.error('Acesso negado: Apenas Super Administradores podem cadastrar novos administradores');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Iniciando cadastro de administrador:', data.email);

      // Verificar se email já está em uso  
      console.log('🔍 Verificando disponibilidade do email...');
      const emailDisponivel = await verificarEmailDisponivel(data.email);
      if (!emailDisponivel) {
        console.warn('❌ Email já existe na tabela entregadores');
        toast.error('Este email já está associado a outro usuário no sistema');
        setLoading(false);
        return;
      }
      console.log('✅ Email disponível na tabela entregadores');

      // Usar Edge Function para criar administrador
      console.log('📧 Criando administrador via Edge Function');
      console.log('📋 Dados enviados:', {
        empresa_id: data.empresa_id,
        nome: data.nome,
        email: data.email,
        senha_length: data.senha.length
      });
      
      const { data: result, error: edgeError } = await supabase.functions.invoke('cadastro-admin-empresa', {
        body: {
          empresa_id: data.empresa_id,
          nome: data.nome,
          email: data.email.toLowerCase().trim(),
          senha: data.senha,
          origem: 'interface_admin'
        }
      });

      if (edgeError) {
        console.error('❌ Erro na Edge Function:', edgeError);
        toast.error(`Erro ao criar administrador: ${edgeError.message}`);
        setLoading(false);
        return;
      }

      if (!result?.success) {
        console.error('❌ Edge Function retornou erro:', result);
        toast.error(result?.error || 'Erro desconhecido ao criar administrador');
        setLoading(false);
        return;
      }

      console.log('✅ Administrador cadastrado com sucesso');
      toast.success(`Administrador ${data.nome} cadastrado com sucesso!`);
      
      // Reset do formulário
      form.reset();

    } catch (error) {
      console.error('💥 Erro inesperado no cadastro:', error);
      toast.error('Erro inesperado durante o cadastro');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se usuário tem permissão
  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>
              Apenas Super Administradores podem acessar esta funcionalidade.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Cadastro de Administrador de Empresa
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Crie uma nova conta de administrador para uma empresa específica
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Administrador
          </CardTitle>
          <CardDescription>
            Preencha os dados para criar um novo administrador de empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Seleção de Empresa */}
              <FormField
                control={form.control}
                name="empresa_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={empresasLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            empresasLoading 
                              ? "Carregando empresas..." 
                              : "Selecione uma empresa"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {empresas.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite o nome completo" 
                        {...field} 
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="admin@empresa.com" 
                        {...field} 
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Senha */}
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres" 
                          {...field} 
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirmar Senha */}
              <FormField
                control={form.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repita a senha" 
                          {...field} 
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botão Submit */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || empresasLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Cadastrar Administrador
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
