
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock, Info } from 'lucide-react';
import { useEmpresaValidation } from '@/hooks/useEmpresaValidation';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';

export function ExpiryAlert() {
  const { isExpired, isNearExpiry, shouldShowWarning, warningMessage, expiryDate } = useEmpresaValidation();
  const { empresa } = useEmpresaUnificado();

  if (!expiryDate || !warningMessage) {
    return null;
  }

  if (isExpired) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>🚨 Empresa Vencida</AlertTitle>
        <AlertDescription>
          A assinatura da empresa <strong>{empresa?.nome}</strong> venceu em {expiryDate.toLocaleDateString('pt-BR')}. 
          O acesso foi bloqueado automaticamente. Entre em contato para renovar sua assinatura.
        </AlertDescription>
      </Alert>
    );
  }

  if (isNearExpiry) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚠️ Vencimento Iminente</AlertTitle>
        <AlertDescription>
          <strong>ATENÇÃO:</strong> {warningMessage}. Renove urgentemente para evitar interrupção dos serviços.
        </AlertDescription>
      </Alert>
    );
  }

  if (shouldShowWarning) {
    return (
      <Alert className="mb-4 border-yellow-500 bg-yellow-50 text-yellow-800">
        <Clock className="h-4 w-4" />
        <AlertTitle>📅 Lembrete de Renovação</AlertTitle>
        <AlertDescription>
          {warningMessage}. Planeje a renovação para evitar interrupções.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
