
/**
 * Utilitários para o perfil do entregador
 */

/**
 * Mascara o CPF para exibição segura
 * Exemplo: 12345678901 -> ***.***.***-01
 */
export const maskCPF = (cpf: string): string => {
  if (!cpf || cpf.length !== 11) return 'CPF inválido';
  
  // Remove caracteres não numéricos
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Mascara mantendo apenas os 2 últimos dígitos
  return `***.***.**${cleanCpf.slice(-2)}`;
};

/**
 * Formata telefone para exibição
 * Exemplo: 11999999999 -> (11) 99999-9999
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return 'Não informado';
  
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  }
  
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }
  
  return phone;
};
