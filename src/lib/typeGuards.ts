
// Type guards e utilitários de conversão de tipos

export type PlanoType = 'basico' | 'pro' | 'enterprise';

// Type guard para verificar se um valor unknown é um Error
export function isError(error: unknown): error is Error {
  return error instanceof Error || (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

// Converte uma string para PlanoType de forma segura
export function safeStringToPlanoType(value: string): PlanoType {
  const normalizedValue = value.toLowerCase().trim();
  
  switch (normalizedValue) {
    case 'basico':
    case 'básico':
      return 'basico';
    case 'pro':
    case 'profissional':
      return 'pro';
    case 'enterprise':
    case 'empresarial':
      return 'enterprise';
    default:
      return 'basico'; // Fallback para plano básico
  }
}

// Extrai mensagem de erro de forma type-safe
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Ocorreu um erro inesperado';
}

// Função para validar status de badge
export function safeBadgeVariant(variant: string): "default" | "destructive" | "outline" | "secondary" {
  switch (variant) {
    case 'destructive':
      return 'destructive';
    case 'outline':
      return 'outline';
    case 'secondary':
      return 'secondary';
    default:
      return 'default';
  }
}
