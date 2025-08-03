
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { adminManagementService, type AdminData, type UpdateAdminRequest } from '@/services/adminManagementService';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface EditAdminDialogProps {
  admin: AdminData;
  empresas: Array<{ id: string; nome: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdminUpdated: () => void;
}

interface FormData {
  nome: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';
}

interface FormErrors {
  nome?: string;
  status?: string;
  general?: string;
}

export const EditAdminDialog: React.FC<EditAdminDialogProps> = ({
  admin,
  empresas,
  open,
  onOpenChange,
  onAdminUpdated
}) => {
  const { permissions } = useAdminPermissions();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    nome: admin.nome,
    status: admin.status
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetar formulário quando o admin mudar
  useEffect(() => {
    setFormData({
      nome: admin.nome,
      status: admin.status
    });
    setErrors({});
  }, [admin]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.nome.trim().length > 100) {
      newErrors.nome = 'Nome deve ter no máximo 100 caracteres';
    }

    // Validar status
    const validStatuses = ['pendente', 'aprovado', 'rejeitado', 'suspenso'];
    if (!validStatuses.includes(formData.status)) {
      newErrors.status = 'Status inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Verificar se houve mudanças
      const hasChanges = formData.nome.trim() !== admin.nome || formData.status !== admin.status;
      
      if (!hasChanges) {
        toast({
          title: 'Informação',
          description: 'Nenhuma alteração foi feita.'
        });
        onOpenChange(false);
        return;
      }

      // Preparar dados para atualização
      const updateData: UpdateAdminRequest = {};
      
      if (formData.nome.trim() !== admin.nome) {
        updateData.nome = formData.nome.trim();
      }
      
      if (formData.status !== admin.status) {
        updateData.status = formData.status;
      }

      // Atualizar administrador
      await adminManagementService.updateAdmin(
        admin.id,
        updateData,
        permissions?.allowedEmpresaIds || []
      );

      logger.info('Administrador atualizado via dialog', {
        adminId: admin.id,
        updatedFields: Object.keys(updateData)
      });

      onAdminUpdated();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar administrador';
      
      logger.error('Erro ao atualizar administrador via dialog', {
        error: errorMessage,
        adminId: admin.id,
        formData
      });
      
      setErrors({ general: errorMessage });
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nome: admin.nome,
      status: admin.status
    });
    setErrors({});
    onOpenChange(false);
  };

  const getEmpresaNome = () => {
    const empresa = empresas.find(e => e.id === admin.empresa_id);
    return empresa?.nome || admin.empresa_nome || 'Empresa não encontrada';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Administrador</DialogTitle>
          <DialogDescription>
            Atualize as informações do administrador abaixo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações não editáveis */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-600">Email</Label>
              <p className="text-sm text-gray-900">{admin.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Empresa</Label>
              <p className="text-sm text-gray-900">{getEmpresaNome()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Perfil</Label>
              <p className="text-sm text-gray-900">Administrador</p>
            </div>
          </div>

          {/* Campos editáveis */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Digite o nome do administrador"
                disabled={isSubmitting}
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-red-600 mt-1">{errors.nome}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-600 mt-1">{errors.status}</p>
              )}
            </div>
          </div>

          {/* Erro geral */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdminDialog;
