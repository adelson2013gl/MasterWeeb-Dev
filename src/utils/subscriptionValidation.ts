export interface ValidationError {
  field: string;
  message: string;
}

export interface SubscriptionFormData {
  empresaId: string;
  empresaNome: string;
  empresaEmail: string;
}

/**
 * Valida o formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida se o nome da empresa é válido
 */
export function isValidEmpresaNome(nome: string): boolean {
  return nome.trim().length >= 2 && nome.trim().length <= 100;
}

/**
 * Valida se o ID da empresa é válido
 */
export function isValidEmpresaId(id: string): boolean {
  return id.trim().length > 0;
}

/**
 * Valida todos os dados do formulário de assinatura
 */
export function validateSubscriptionForm(data: SubscriptionFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validar ID da empresa
  if (!data.empresaId || !isValidEmpresaId(data.empresaId)) {
    errors.push({
      field: 'empresaId',
      message: 'ID da empresa é obrigatório'
    });
  }

  // Validar nome da empresa
  if (!data.empresaNome || !isValidEmpresaNome(data.empresaNome)) {
    errors.push({
      field: 'empresaNome',
      message: 'Nome da empresa deve ter entre 2 e 100 caracteres'
    });
  }

  // Validar email da empresa
  if (!data.empresaEmail || data.empresaEmail.trim() === '') {
    errors.push({
      field: 'empresaEmail',
      message: 'Email da empresa é obrigatório'
    });
  } else if (!isValidEmail(data.empresaEmail)) {
    errors.push({
      field: 'empresaEmail',
      message: 'Formato de email inválido'
    });
  }

  return errors;
}

/**
 * Valida dados em tempo real (para validação enquanto o usuário digita)
 */
export function validateFieldRealTime(field: string, value: string): string | null {
  switch (field) {
    case 'empresaEmail':
      if (!value.trim()) {
        return 'Email é obrigatório';
      }
      if (!isValidEmail(value)) {
        return 'Formato de email inválido';
      }
      return null;

    case 'empresaNome':
      if (!value.trim()) {
        return 'Nome da empresa é obrigatório';
      }
      if (!isValidEmpresaNome(value)) {
        return 'Nome deve ter entre 2 e 100 caracteres';
      }
      return null;

    case 'empresaId':
      if (!value.trim()) {
        return 'ID da empresa é obrigatório';
      }
      return null;

    default:
      return null;
  }
}

/**
 * Sanitiza dados de entrada
 */
export function sanitizeSubscriptionData(data: SubscriptionFormData): SubscriptionFormData {
  return {
    empresaId: data.empresaId.trim(),
    empresaNome: data.empresaNome.trim(),
    empresaEmail: data.empresaEmail.trim().toLowerCase()
  };
}

/**
 * Formata mensagens de erro para exibição
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => error.message).join(', ');
}