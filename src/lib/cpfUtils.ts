
/**
 * Utilitários para formatação de CPF
 */

/**
 * Formata um CPF para o padrão xxx.xxx.xxx-xx, com vírgula no final
 * Mantém zeros à esquerda e adiciona vírgula para facilitar cópia
 * 
 * @param cpf - CPF sem formatação (apenas números)
 * @returns CPF formatado com pontos, hífen e vírgula
 */
export const formatarCpfComVirgula = (cpf: string): string => {
  // Se for texto especial (sem agendamentos), retorna sem vírgula
  if (cpf.includes('---') || cpf.includes('Sem agendamentos')) {
    return cpf;
  }

  // Remove caracteres não numéricos
  const apenasNumeros = cpf.replace(/\D/g, '');
  
  // Garante que tenha 11 dígitos, preenchendo com zeros à esquerda
  const cpfCompleto = apenasNumeros.padStart(11, '0');
  
  // Aplica formatação xxx.xxx.xxx-xx,
  const cpfFormatado = cpfCompleto.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    '$1.$2.$3-$4,'
  );
  
  return cpfFormatado;
};

/**
 * Valida se um CPF é válido
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se o CPF for válido, false caso contrário
 */
export function validarCPF(cpf: string): boolean {
  if (!cpf) return false;

  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digitoVerificador1 = resto < 2 ? 0 : resto;

  if (parseInt(cpfLimpo.charAt(9)) !== digitoVerificador1) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digitoVerificador2 = resto < 2 ? 0 : resto;

  if (parseInt(cpfLimpo.charAt(10)) !== digitoVerificador2) return false;

  return true;
}

/**
 * Formata CPF sem vírgula (para outros usos)
 * 
 * @param cpf - CPF sem formatação (apenas números)
 * @returns CPF formatado com pontos e hífen
 */
export const formatarCpf = (cpf: string): string => {
  // Se for texto especial, retorna como está
  if (cpf.includes('---') || cpf.includes('Sem agendamentos')) {
    return cpf;
  }

  // Remove caracteres não numéricos
  const apenasNumeros = cpf.replace(/\D/g, '');
  
  // Garante que tenha 11 dígitos, preenchendo com zeros à esquerda
  const cpfCompleto = apenasNumeros.padStart(11, '0');
  
  // Aplica formatação xxx.xxx.xxx-xx
  const cpfFormatado = cpfCompleto.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    '$1.$2.$3-$4'
  );
  
  return cpfFormatado;
};
