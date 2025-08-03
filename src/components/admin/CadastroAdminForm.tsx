import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, User, Mail, Lock, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { adminManagementService, type CreateAdminRequest } from '@/services/adminManagementService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface CadastroAdminFormProps {
  onSuccess: () => void;
  allowedEmpresaIds: string[];
  empresas: Array<{ id: string; nome: string }>;
}

interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  empresa_id: string;
  codigo_acesso: string;
}

interface FormErrors {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
  empresa_id?: string;
  general?: string;
}

const CadastroAdminForm: React.FC<CadastroAdminFormProps> = ({
  onSuccess,
  allowedEmpresaIds,
  empresas
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    empresa_id: '',
    codigo_acesso: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Formato de email inválido';
      }
    }

    // Validar senha
    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) {
      newErrors.senha = 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número';
    }

    // Validar confirmação de senha
    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    // Validar empresa
    if (!formData.empresa_id) {
      newErrors.empresa_id = 'Empresa é obrigatória';
    } else if (!allowedEmpresaIds.includes(formData.empresa_id)) {
      newErrors.empresa_id = 'Empresa não permitida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const adminData: CreateAdminRequest = {
        nome: formData.nome.trim(),
        email: formData.email.toLowerCase().trim(),
        senha: formData.senha,
        empresa_id: formData.empresa_id,
        codigo_acesso: formData.codigo_acesso.trim()
      };

      const result = await adminManagementService.createAdmin(
        adminData,
        allowedEmpresaIds
      );

      if (result.success) {
        logger.info('Administrador criado com sucesso via formulário', {
          admin_id: result.admin_id,
          empresa_id: adminData.empresa_id
        });
        
        toast({
          title: 'Sucesso!',
          description: result.message
        });
        
        onSuccess();
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      logger.error('Erro ao criar administrador via formulário', {
        error: errorMessage,
        empresa_id: formData.empresa_id
      });
      
      // Verificar se é um erro específico de validação
      if (errorMessage.includes('Email já cadastrado')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.includes('Empresa')) {
        setErrors({ empresa_id: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^\w\s]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, label: 'Fraca', color: 'bg-red-500' };
    if (strength <= 4) return { strength, label: 'Média', color: 'bg-yellow-500' };
    return { strength, label: 'Forte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.senha);

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="nome"
                type="text"
                placeholder="Digite o nome completo"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className={`pl-10 ${errors.nome ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Digite o email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa *</Label>
            <Select
              value={formData.empresa_id}
              onValueChange={(value) => handleInputChange('empresa_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.empresa_id ? 'border-red-500' : ''}>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecione a empresa" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {empresas
                  .filter(empresa => allowedEmpresaIds.includes(empresa.id))
                  .map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.empresa_id && (
              <p className="text-sm text-red-500">{errors.empresa_id}</p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="senha">Senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite a senha"
                value={formData.senha}
                onChange={(e) => handleInputChange('senha', e.target.value)}
                className={`pl-10 pr-10 ${errors.senha ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Indicador de força da senha */}
            {formData.senha && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{passwordStrength.label}</span>
                </div>
              </div>
            )}
            
            {errors.senha && (
              <p className="text-sm text-red-500">{errors.senha}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmarSenha"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme a senha"
                value={formData.confirmarSenha}
                onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                className={`pl-10 pr-10 ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Indicador de confirmação */}
            {formData.confirmarSenha && (
              <div className="flex items-center gap-2">
                {formData.senha === formData.confirmarSenha ? (
                  <><CheckCircle className="h-4 w-4 text-green-500" /><span className="text-sm text-green-500">Senhas coincidem</span></>
                ) : (
                  <><AlertCircle className="h-4 w-4 text-red-500" /><span className="text-sm text-red-500">Senhas não coincidem</span></>
                )}
              </div>
            )}
            
            {errors.confirmarSenha && (
              <p className="text-sm text-red-500">{errors.confirmarSenha}</p>
            )}
          </div>

          {/* Código de Acesso (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="codigo_acesso">Código de Acesso (Opcional)</Label>
            <Input
              id="codigo_acesso"
              type="text"
              placeholder="Código especial de acesso (se aplicável)"
              value={formData.codigo_acesso}
              onChange={(e) => handleInputChange('codigo_acesso', e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco se não houver código especial
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                'Criar Administrador'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { CadastroAdminForm };
