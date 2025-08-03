import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  value: string;
  error?: string | null;
  isValid?: boolean;
  required?: boolean;
  type?: 'text' | 'email';
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  description?: string;
}

export function FormField({
  label,
  value,
  error,
  isValid,
  required = false,
  type = 'text',
  placeholder,
  disabled = false,
  onChange,
  onBlur,
  className,
  description
}: FormFieldProps) {
  const hasError = !!error;
  const showValidation = value.length > 0;
  const showSuccess = showValidation && isValid && !hasError;
  const showError = showValidation && hasError;

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="obrigatório">
            *
          </span>
        )}
      </label>
      
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            {
              'border-destructive focus-visible:ring-destructive': showError,
              'border-green-500 focus-visible:ring-green-500': showSuccess,
              'pr-10': showValidation
            }
          )}
          aria-invalid={hasError}
          aria-describedby={error ? `${label}-error` : description ? `${label}-description` : undefined}
        />
        
        {/* Ícone de validação */}
        {showValidation && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {showSuccess && (
              <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
            )}
            {showError && (
              <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
            )}
          </div>
        )}
      </div>
      
      {/* Descrição do campo */}
      {description && !error && (
        <p id={`${label}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      {/* Mensagem de erro */}
      {error && (
        <p id={`${label}-error`} className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;