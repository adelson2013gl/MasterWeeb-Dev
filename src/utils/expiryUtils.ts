
import { differenceInDays } from 'date-fns';

export interface DaysRemainingInfo {
  days: number;
  isExpired: boolean;
  isUrgent: boolean;
  isWarning: boolean;
  displayText: string;
  colorClass: string;
}

export const calcularDiasRestantes = (dataVencimento: string | null): DaysRemainingInfo | null => {
  if (!dataVencimento) {
    return null;
  }

  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diasDiferenca = differenceInDays(vencimento, hoje);

  const isExpired = diasDiferenca < 0;
  const isUrgent = diasDiferenca <= 7 && diasDiferenca >= 0;
  const isWarning = diasDiferenca > 7 && diasDiferenca <= 30;

  let displayText: string;
  let colorClass: string;

  if (isExpired) {
    const diasVencidos = Math.abs(diasDiferenca);
    displayText = `(vencido há ${diasVencidos} ${diasVencidos === 1 ? 'dia' : 'dias'})`;
    colorClass = 'text-red-600';
  } else if (diasDiferenca === 0) {
    displayText = '(vence hoje)';
    colorClass = 'text-red-600 font-semibold';
  } else if (isUrgent) {
    displayText = `(em ${diasDiferenca} ${diasDiferenca === 1 ? 'dia' : 'dias'})`;
    colorClass = 'text-red-600';
  } else if (isWarning) {
    displayText = `(em ${diasDiferenca} dias)`;
    colorClass = 'text-yellow-600';
  } else {
    displayText = `(em ${diasDiferenca} dias)`;
    colorClass = 'text-green-600';
  }

  return {
    days: diasDiferenca,
    isExpired,
    isUrgent,
    isWarning,
    displayText,
    colorClass
  };
};
