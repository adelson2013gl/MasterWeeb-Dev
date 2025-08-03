import React from 'react';
import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type AlertType = 'error' | 'warning' | 'info' | 'validation';

interface ErrorAlertProps {
  type?: AlertType;
  title: string;
  description?: string;
  errors?: string[];
  className?: string;
  onDismiss?: () => void;
}

const alertConfig = {
  error: {
    icon: XCircle,
    className: 'border-destructive bg-destructive/5 text-destructive',
    iconClassName: 'text-destructive'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-orange-500 bg-orange-50 text-orange-800',
    iconClassName: 'text-orange-500'
  },
  info: {
    icon: Info,
    className: 'border-blue-500 bg-blue-50 text-blue-800',
    iconClassName: 'text-blue-500'
  },
  validation: {
    icon: AlertCircle,
    className: 'border-destructive bg-destructive/5 text-destructive',
    iconClassName: 'text-destructive'
  }
};

export function ErrorAlert({
  type = 'error',
  title,
  description,
  errors = [],
  className,
  onDismiss
}: ErrorAlertProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <Alert className={cn(config.className, className)}>
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <AlertTitle className="flex items-center justify-between">
        {title}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Fechar alerta"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </AlertTitle>
      
      {description && (
        <AlertDescription className="mt-2">
          {description}
        </AlertDescription>
      )}
      
      {errors.length > 0 && (
        <AlertDescription className="mt-2">
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </li>
            ))}
          </ul>
        </AlertDescription>
      )}
    </Alert>
  );
}

// Componente específico para erros de validação
export function ValidationAlert({
  errors,
  className,
  onDismiss
}: {
  errors: string[];
  className?: string;
  onDismiss?: () => void;
}) {
  if (errors.length === 0) return null;

  return (
    <ErrorAlert
      type="validation"
      title="Dados inválidos detectados"
      description="Corrija os seguintes problemas antes de continuar:"
      errors={errors}
      className={className}
      onDismiss={onDismiss}
    />
  );
}

// Componente específico para erros de sistema
export function SystemErrorAlert({
  error,
  className,
  onDismiss
}: {
  error: string;
  className?: string;
  onDismiss?: () => void;
}) {
  return (
    <ErrorAlert
      type="error"
      title="Erro do sistema"
      description={error}
      className={className}
      onDismiss={onDismiss}
    />
  );
}

// Componente específico para avisos
export function WarningAlert({
  title,
  description,
  className,
  onDismiss
}: {
  title: string;
  description?: string;
  className?: string;
  onDismiss?: () => void;
}) {
  return (
    <ErrorAlert
      type="warning"
      title={title}
      description={description}
      className={className}
      onDismiss={onDismiss}
    />
  );
}

export default ErrorAlert;