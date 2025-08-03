import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FormField from './FormField';
import { ValidationAlert } from './ErrorAlert';
import {
  validateFieldRealTime,
  validateSubscriptionForm,
  sanitizeSubscriptionData,
  type SubscriptionFormData,
  type ValidationError
} from '@/utils/subscriptionValidation';

interface SubscriptionFormProps {
  initialData?: Partial<SubscriptionFormData>;
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  onDataChange?: (data: SubscriptionFormData, isValid: boolean) => void;
  disabled?: boolean;
  showTitle?: boolean;
  className?: string;
}

export function SubscriptionForm({
  initialData = {},
  onSubmit,
  onDataChange,
  disabled = false,
  showTitle = true,
  className
}: SubscriptionFormProps) {
  const [formData, setFormData] = useState<SubscriptionFormData>({
    empresaId: initialData.empresaId || '',
    empresaNome: initialData.empresaNome || '',
    empresaEmail: initialData.empresaEmail || ''
  });
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({
    empresaId: null,
    empresaNome: null,
    empresaEmail: null
  });
  
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { toast } = useToast();

  // Validação em tempo real
  useEffect(() => {
    if (!hasInteracted) return;
    
    const errors = validateSubscriptionForm(formData);
    setValidationErrors(errors);
    
    const isValid = errors.length === 0;
    onDataChange?.(formData, isValid);
  }, [formData, hasInteracted, onDataChange]);

  const handleFieldChange = (field: keyof SubscriptionFormData, value: string) => {
    setHasInteracted(true);
    
    // Atualizar dados do formulário
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Validação em tempo real do campo específico
    const fieldError = validateFieldRealTime(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const handleFieldBlur = (field: keyof SubscriptionFormData) => {
    setHasInteracted(true);
    
    // Revalidar o campo quando perde o foco
    const fieldError = validateFieldRealTime(field, formData[field]);
    setFieldErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasInteracted(true);
    
    // Validação final
    const errors = validateSubscriptionForm(formData);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast({
        title: 'Dados inválidos',
        description: 'Corrija os erros antes de continuar.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const sanitizedData = sanitizeSubscriptionData(formData);
      await onSubmit(sanitizedData);
      
      toast({
        title: 'Dados salvos',
        description: 'As informações foram atualizadas com sucesso.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as informações. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = validationErrors.length === 0 && hasInteracted;
  const hasErrors = validationErrors.length > 0 && hasInteracted;

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>
            Verifique e atualize as informações da sua empresa para continuar.
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent>
        {hasErrors && (
          <ValidationAlert
            errors={validationErrors.map(error => error.message)}
            className="mb-6"
          />
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="ID da Empresa"
            value={formData.empresaId}
            error={fieldErrors.empresaId}
            isValid={!fieldErrors.empresaId && formData.empresaId.length > 0}
            required
            disabled={disabled}
            placeholder="Digite o ID da empresa"
            onChange={(value) => handleFieldChange('empresaId', value)}
            onBlur={() => handleFieldBlur('empresaId')}
            description="Identificador único da empresa no sistema"
          />
          
          <FormField
            label="Nome da Empresa"
            value={formData.empresaNome}
            error={fieldErrors.empresaNome}
            isValid={!fieldErrors.empresaNome && formData.empresaNome.length >= 2}
            required
            disabled={disabled}
            placeholder="Digite o nome da empresa"
            onChange={(value) => handleFieldChange('empresaNome', value)}
            onBlur={() => handleFieldBlur('empresaNome')}
            description="Nome completo da empresa (2-100 caracteres)"
          />
          
          <FormField
            label="Email da Empresa"
            type="email"
            value={formData.empresaEmail}
            error={fieldErrors.empresaEmail}
            isValid={!fieldErrors.empresaEmail && formData.empresaEmail.length > 0}
            required
            disabled={disabled}
            placeholder="empresa@exemplo.com"
            onChange={(value) => handleFieldChange('empresaEmail', value)}
            onBlur={() => handleFieldBlur('empresaEmail')}
            description="Email principal para comunicações e faturamento"
          />
          
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={disabled || isSubmitting || !isFormValid}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default SubscriptionForm;