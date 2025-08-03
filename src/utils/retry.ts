// Utilitário para implementar retry logic em operações que podem falhar

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTimeMs: number;
}

// Função principal de retry
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<RetryResult<T>> {
  const {
    maxAttempts,
    delayMs,
    backoffMultiplier = 2,
    maxDelayMs = 30000, // 30 segundos máximo
    retryCondition = () => true
  } = options;

  const startTime = Date.now();
  let lastError: Error;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[RETRY] Tentativa ${attempt}/${maxAttempts}`);
      
      const result = await operation();
      
      console.log(`[RETRY] Sucesso na tentativa ${attempt}`);
      
      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTimeMs: Date.now() - startTime
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.warn(`[RETRY] Falha na tentativa ${attempt}/${maxAttempts}:`, {
        error: lastError.message,
        willRetry: attempt < maxAttempts && retryCondition(lastError)
      });

      // Se é a última tentativa ou a condição de retry não é atendida, falha
      if (attempt === maxAttempts || !retryCondition(lastError)) {
        break;
      }

      // Aguardar antes da próxima tentativa
      await delay(Math.min(currentDelay, maxDelayMs));
      currentDelay *= backoffMultiplier;
    }
  }

  return {
    success: false,
    error: lastError!,
    attempts: maxAttempts,
    totalTimeMs: Date.now() - startTime
  };
}

// Função auxiliar para delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Condições de retry pré-definidas
export const retryConditions = {
  // Retry em erros de rede e timeouts
  networkErrors: (error: any): boolean => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Erro de rede
    }
    if (error.message?.includes('timeout')) {
      return true; // Timeout
    }
    return false;
  },

  // Retry em erros HTTP específicos (5xx, 429, 408)
  httpErrors: (error: any): boolean => {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    
    // Se o erro tem um status HTTP
    if (error.status && retryableStatuses.includes(error.status)) {
      return true;
    }
    
    // Se a mensagem contém indicação de erro temporário
    const message = error.message?.toLowerCase() || '';
    if (message.includes('timeout') || 
        message.includes('network') || 
        message.includes('connection') ||
        message.includes('temporary')) {
      return true;
    }
    
    return false;
  },

  // Retry em todos os erros exceto erros de validação (4xx exceto 408 e 429)
  allExceptValidation: (error: any): boolean => {
    const nonRetryableStatuses = [400, 401, 403, 404, 409, 422];
    
    if (error.status && nonRetryableStatuses.includes(error.status)) {
      return false; // Não retry em erros de validação
    }
    
    return true; // Retry em todos os outros casos
  }
};

// Configurações pré-definidas
export const retryConfigs = {
  // Para operações críticas (ex: pagamentos)
  critical: {
    maxAttempts: 5,
    delayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
    retryCondition: retryConditions.httpErrors
  },

  // Para operações normais
  standard: {
    maxAttempts: 3,
    delayMs: 500,
    backoffMultiplier: 2,
    maxDelayMs: 5000,
    retryCondition: retryConditions.networkErrors
  },

  // Para operações rápidas
  fast: {
    maxAttempts: 2,
    delayMs: 200,
    backoffMultiplier: 1.5,
    maxDelayMs: 1000,
    retryCondition: retryConditions.networkErrors
  }
};

// Função específica para operações de API
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  config: 'critical' | 'standard' | 'fast' = 'standard'
): Promise<T> {
  const result = await withRetry(apiCall, retryConfigs[config]);
  
  if (result.success) {
    return result.data!;
  } else {
    console.error(`[RETRY] Operação falhou após ${result.attempts} tentativas em ${result.totalTimeMs}ms`);
    throw result.error;
  }
}

// Exemplo de uso:
// const resultado = await retryApiCall(
//   () => fetch('/api/endpoint').then(r => r.json()),
//   'critical'
// );