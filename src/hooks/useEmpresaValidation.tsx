
import { useMemo } from 'react';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { addDays, differenceInDays, isAfter, isBefore } from 'date-fns';

export interface EmpresaValidationResult {
  isExpired: boolean;
  daysUntilExpiry: number | null;
  isNearExpiry: boolean;
  shouldShowWarning: boolean;
  canAccess: boolean;
  warningMessage: string | null;
  expiryDate: Date | null;
}

export function useEmpresaValidation(): EmpresaValidationResult {
  const { empresa } = useEmpresaUnificado();
  
  const result = useMemo(() => {
    // Se não há empresa ou data de vencimento, permitir acesso
    if (!empresa?.data_expiracao) {
      return {
        isExpired: false,
        daysUntilExpiry: null,
        isNearExpiry: false,
        shouldShowWarning: false,
        canAccess: true,
        warningMessage: null,
        expiryDate: null,
      };
    }

    const today = new Date();
    const expiryDate = new Date(empresa.data_expiracao);
    const daysUntilExpiry = differenceInDays(expiryDate, today);
    
    const isExpired = isBefore(expiryDate, today);
    const isNearExpiry = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    const shouldShowWarning = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    
    // Empresa vencida não pode acessar
    const canAccess = !isExpired;
    
    let warningMessage: string | null = null;
    if (isExpired) {
      warningMessage = `Empresa vencida desde ${expiryDate.toLocaleDateString('pt-BR')}`;
    } else if (isNearExpiry) {
      warningMessage = `Vencimento em ${daysUntilExpiry} dias (${expiryDate.toLocaleDateString('pt-BR')})`;
    } else if (shouldShowWarning) {
      warningMessage = `Vencimento em ${daysUntilExpiry} dias`;
    }

    return {
      isExpired,
      daysUntilExpiry,
      isNearExpiry,
      shouldShowWarning,
      canAccess,
      warningMessage,
      expiryDate,
    };
  }, [empresa?.data_expiracao]);

  return result;
}
