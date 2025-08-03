// Modal para coleta de dados adicionais do cliente para PIX
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CollectedPaymentData, EmpresaDataForPayment } from '@/types/abacatepay';
import { abacatePayService, AbacatePayService } from '@/services/abacatePayService';
import { AlertTriangle, User, Phone, CreditCard } from 'lucide-react';

interface DataCollectionModalProps {
  open: boolean;
  onClose: () => void;
  onDataCollected: (data: CollectedPaymentData) => void;
  dadosEmpresa: EmpresaDataForPayment;
}

export function DataCollectionModal({
  open,
  onClose,
  onDataCollected,
  dadosEmpresa
}: DataCollectionModalProps) {
  const [cellphone, setCellphone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatCellphone = (value: string) => {
    // Remove tudo que não é número
    const cleaned = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (cleaned.length <= 11) {
      let formatted = cleaned;
      if (cleaned.length > 2) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      }
      if (cleaned.length > 7) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
      }
      return formatted;
    }
    return value;
  };

  const formatTaxId = (value: string) => {
    // Remove tudo que não é número
    const cleaned = value.replace(/\D/g, '');
    
    // Aplica máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)
    if (cleaned.length <= 11) {
      // CPF
      let formatted = cleaned;
      if (cleaned.length > 3) {
        formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
      }
      if (cleaned.length > 6) {
        formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
      }
      if (cleaned.length > 9) {
        formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
      }
      return formatted;
    } else {
      // CNPJ
      let formatted = cleaned;
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
      }
      if (cleaned.length > 5) {
        formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
      }
      if (cleaned.length > 8) {
        formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
      }
      if (cleaned.length > 12) {
        formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
      }
      return formatted;
    }
  };

  const handleCellphoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCellphone(e.target.value);
    setCellphone(formatted);
  };

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTaxId(e.target.value);
    setTaxId(formatted);
  };

  const validateData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validar celular
    const cleanPhone = cellphone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.push('Celular deve ter 10 ou 11 dígitos');
    }
    
    // Validar CPF/CNPJ
    const cleanTaxId = taxId.replace(/\D/g, '');
    if (!cleanTaxId || (cleanTaxId.length !== 11 && cleanTaxId.length !== 14)) {
      errors.push('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async () => {
    const validation = validateData();
    
    if (!validation.isValid) {
      toast({
        title: 'Dados inválidos',
        description: validation.errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Limpar os dados e validar com o serviço
      const cleanCellphone = cellphone.replace(/\D/g, '');
      const cleanTaxId = taxId.replace(/\D/g, '');
      
      const dadosParaValidacao = {
        name: dadosEmpresa.name,
        email: dadosEmpresa.email,
        cellphone: cleanCellphone,
        taxId: cleanTaxId
      };
      
      const serviceValidation = AbacatePayService.validatePaymentData(dadosParaValidacao);
      
      if (!serviceValidation.isValid) {
        toast({
          title: 'Dados ainda inválidos',
          description: `Campos faltando: ${serviceValidation.missingFields.join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      // Validar formato do telefone
      const formattedCellphone = AbacatePayService.formatCellphone(cleanCellphone);
      
      // Validar CPF/CNPJ
      if (!AbacatePayService.isValidTaxId(cleanTaxId)) {
        toast({
          title: 'CPF/CNPJ inválido',
          description: 'Verifique se o CPF ou CNPJ está correto',
          variant: 'destructive'
        });
        return;
      }

      console.log('Dados validados com sucesso:', {
        cellphone: formattedCellphone.substring(0, 7) + '***',
        taxId: '***' + cleanTaxId.slice(-3)
      });

      // Retornar dados coletados
      onDataCollected({
        cellphone: formattedCellphone,
        taxId: cleanTaxId
      });

      toast({
        title: 'Dados coletados',
        description: 'Prosseguindo com a criação do PIX...',
        variant: 'default'
      });

    } catch (error) {
      console.error('Erro ao validar dados:', error);
      toast({
        title: 'Erro na validação',
        description: 'Ocorreu um erro ao validar os dados. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCellphone('');
    setTaxId('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Dados Adicionais Necessários
          </DialogTitle>
          <DialogDescription>
            Para processar o pagamento PIX, precisamos de algumas informações adicionais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dados já coletados */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Dados da empresa:</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{dadosEmpresa.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📧</span>
              <span>{dadosEmpresa.email}</span>
            </div>
          </div>

          {/* Campos para coletar */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cellphone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Celular/WhatsApp *
              </Label>
              <Input
                id="cellphone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={cellphone}
                onChange={handleCellphoneChange}
                maxLength={15}
              />
              <p className="text-xs text-gray-500">
                Necessário para receber notificações do pagamento
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                CPF ou CNPJ *
              </Label>
              <Input
                id="taxId"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={taxId}
                onChange={handleTaxIdChange}
                maxLength={18}
              />
              <p className="text-xs text-gray-500">
                Obrigatório para transações PIX
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !cellphone || !taxId}
          >
            {loading ? 'Validando...' : 'Continuar com PIX'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}