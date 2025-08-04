# Hooks Customizados - Master Web

## 📋 Lista de Hooks

### 1. useAuth
**Arquivo:** `src/hooks/useAuth.tsx`

**Funcionalidade:** Gerenciamento de autenticação de usuários

**Retorna:**
```typescript
{
  user: User | null,
  loading: boolean,
  signIn: (email: string, password: string) => Promise<void>,
  signOut: () => Promise<void>,
  signUp: (email: string, password: string, userData: any) => Promise<void>
}
```

**Uso:**
```typescript
const { user, loading, signIn, signOut } = useAuth();
```

### 2. useIsMobile
**Arquivo:** `src/hooks/use-mobile.tsx`

**Funcionalidade:** Detecção responsiva de dispositivos móveis

**Retorna:**
```typescript
boolean // true se a tela for menor que 768px
```

**Uso:**
```typescript
const isMobile = useIsMobile();
```

**Características:**
- Breakpoint configurável (768px)
- Estado reativo com media queries
- Performance otimizada
- Suporte a SSR

### 3. useInstallPrompt
**Arquivo:** `src/hooks/useInstallPrompt.tsx`

**Funcionalidade:** Gerenciamento de instalação PWA

**Retorna:**
```typescript
{
  canInstall: boolean,
  isIOSDevice: () => boolean,
  handleInstall: () => Promise<void>,
  isInstalled: boolean,
  showInstallButton: boolean
}
```

**Uso:**
```typescript
const { canInstall, handleInstall, isInstalled } = useInstallPrompt();
```

**Características:**
- Detecção automática de capacidade de instalação
- Suporte específico para iOS e Android
- Verificação de status de instalação
- Prompt personalizado

### 4. useOnlineStatus
**Arquivo:** `src/hooks/use-online-status.tsx`

**Funcionalidade:** Detecção de status de conectividade

**Retorna:**
```typescript
{
  isOnline: boolean
}
```

**Uso:**
```typescript
const { isOnline } = useOnlineStatus();
```

**Características:**
- Detecção em tempo real
- Eventos de mudança de conectividade
- Integração com Service Worker
- Notificações automáticas

## Visão Geral

Os hooks customizados são funções que encapsulam lógica de estado e efeitos colaterais, seguindo o padrão do React. Eles promovem reutilização de código e separação de responsabilidades.

## Lista de Hooks Legados

### `useAuth` (Versão Legada)
- **Localização**: `src/hooks/useAuth.ts`
- **Descrição**: Gerencia autenticação de usuários
- **Retorna**: Estado de autenticação, funções de login/logout
- **Query Supabase**: `auth.getUser()`, `auth.signInWithPassword()`

### `useEntregadorData`
- **Localização**: `src/hooks/useEntregadorData.ts`
- **Descrição**: Carrega dados específicos do entregador logado
- **Retorna**: Dados do entregador, loading state
- **Query Supabase**: `from('entregadores').select('*').eq('user_id', userId)`

### `useAgendasDisponiveis`
- **Localização**: `src/hooks/useAgendasDisponiveis.ts`
- **Descrição**: Busca agendas disponíveis para agendamento
- **Retorna**: Lista de agendas, loading state
- **Query Supabase**: `from('agendas').select('*').eq('ativo', true)`

### `useMeusAgendamentos`
- **Localização**: `src/hooks/useMeusAgendamentos.ts`
- **Descrição**: Gerencia agendamentos do usuário atual
- **Retorna**: Lista de agendamentos, funções CRUD
- **Query Supabase**: `from('agendamentos').select('*').eq('entregador_id', entregadorId)`

---

## Sistema de Configurações (Arquitetura Modular)

### `useConfiguracoesSistema`
- **Localização**: `src/hooks/useConfiguracoesSistema.tsx`
- **Descrição**: Hook principal que compõe todos os hooks especializados de configuração
- **Retorna**: Interface completa para gerenciar configurações do sistema
- **Arquitetura**: Composição de 4 hooks especializados
- **Uso**: Interface principal para componentes que precisam de configurações

### `useConfiguracoesCore`
- **Localização**: `src/hooks/useConfiguracoesCore.ts`
- **Descrição**: Gerencia o estado central das configurações
- **Responsabilidade**: Estado global, flags de controle, refs de inicialização
- **Retorna**: 
  - `configs`: Objeto com todas as configurações
  - `loading`: Estado de carregamento
  - `hasError`: Flag de erro
  - `isLoadingData`: Estado específico de carregamento de dados
  - `hasUnsavedChanges`: Flag de mudanças não salvas
  - `isSaving`: Estado de salvamento
  - Funções setter para todos os estados
- **Padrão**: Estado centralizado com refs para controle de ciclo de vida

### `useConfiguracoesLoader`
- **Localização**: `src/hooks/useConfiguracoesLoader.ts`
- **Descrição**: Responsável pelo carregamento de configurações do banco de dados
- **Responsabilidade**: Fetch de dados, retry logic, proteção contra duplicação
- **Retorna**: 
  - `loadConfiguracoes`: Função para carregar configurações
- **Features**:
  - Sistema de retry automático
  - Proteção contra carregamentos duplos
  - Logs detalhados para debugging
  - Verificação de mudanças não salvas
- **Query Supabase**: Via `ConfiguracoesService.loadConfiguracoesFromDB()`

### `useConfiguracoesSaver`
- **Localização**: `src/hooks/useConfiguracoesSaver.ts`
- **Descrição**: Gerencia o salvamento de configurações
- **Responsabilidade**: Persistência de dados, validação de permissões, feedback
- **Retorna**: 
  - `saveAllConfiguracoes`: Função para salvar todas as configurações
- **Features**:
  - Verificação de permissões de admin
  - Logs detalhados do processo de salvamento
  - Tratamento de erros específicos
  - Feedback de progresso
- **Query Supabase**: Via `ConfiguracoesService.saveConfiguracoesToDB()`

### `useHorariosValidation`
- **Localização**: `src/hooks/useHorariosValidation.ts`
- **Descrição**: Implementa lógica de validação de horários por estrelas
- **Responsabilidade**: Regras de negócio para acesso a horários específicos
- **Retorna**: 
  - `podeVerAgendaPorHorario`: Função que valida se usuário pode ver horário
- **Parâmetros de Validação**:
  - `estrelas`: Número de estrelas do entregador
  - `dataAgenda`: Data do agendamento
  - `horarioInicio`: Horário de início do turno
- **Lógica**: 
  - Se `habilitarPriorizacaoHorarios` estiver desabilitado, permite todos
  - Se habilitado, aplica regras baseadas em estrelas e horários
- **Features**:
  - Logs detalhados da validação
  - Configuração flexível via `habilitarPriorizacaoHorarios`
  - Validação baseada em múltiplos critérios

## 📚 Lista de Hooks Detalhada

### `useAuth`
Gerencia autenticação e estado do usuário.

**Localização**: `src/hooks/useAuth.tsx`

**Funcionalidades:**
- Login/logout de usuários
- Verificação de sessão ativa
- Redirecionamento baseado em perfil

**Retorno:**
```typescript
{
  user: User | null,
  loading: boolean,
  login: (email: string, password: string) => Promise<void>,
  logout: () => Promise<void>
}
```

### `useEntregadorData`
Busca dados do entregador logado e seus próximos agendamentos.

**Localização**: `src/hooks/useEntregadorData.tsx`

**Funcionalidades:**
- Dados pessoais do entregador
- Próximos 5 agendamentos ativos
- Informações da cidade/região

**Query Supabase:**
```sql
SELECT e.*, c.nome as cidade_nome, c.estado
FROM entregadores e
JOIN cidades c ON e.cidade_id = c.id
WHERE e.user_id = $1
```

**Retorno:**
```typescript
{
  entregador: Entregador | null,
  agendamentos: Agendamento[],
  loading: boolean,
  refetch: () => Promise<void>
}
```

**Filtros Aplicados:**
- Apenas agendamentos com `status = 'agendado'`
- Apenas datas futuras (`>= data_atual`)
- Limitado a 5 resultados mais próximos

### `useAgendasDisponiveis`
Lista agendas disponíveis para agendamento.

**Localização**: `src/hooks/useAgendasDisponiveis.tsx`

**Funcionalidades:**
- Filtragem por cidade do entregador
- Filtragem por data específica (opcional)
- Apenas agendas ativas com vagas disponíveis

**Parâmetros:**
```typescript
useAgendasDisponiveis(dataFiltro?: string)
```

**Query Supabase:**
```sql
SELECT a.*, t.nome as turno_nome, r.nome as regiao_nome
FROM agendas a
JOIN turnos t ON a.turno_id = t.id
JOIN regioes r ON a.regiao_id = r.id
WHERE a.ativo = true
  AND r.cidade_id = $cidade_entregador
  AND a.data >= $data_atual
  AND a.vagas_ocupadas < a.vagas_disponiveis
```

**Retorno:**
```typescript
{
  agendas: AgendaDisponivel[],
  loading: boolean,
  refetch: () => Promise<void>
}
```

### `useMeusAgendamentos`
Gerencia todos os agendamentos do entregador (ativos, cancelados, concluídos).

**Localização**: `src/hooks/useMeusAgendamentos.tsx`

**Funcionalidades:**
- Listar todos os agendamentos
- Cancelar agendamentos ativos
- Separar por status (ativos vs histórico)

**Métodos:**
```typescript
{
  agendamentos: AgendamentoReal[],
  agendamentosAtivos: AgendamentoReal[],
  agendamentosHistorico: AgendamentoReal[],
  loading: boolean,
  cancelarAgendamento: (id: string) => Promise<boolean>,
  refetch: () => Promise<void>
}
```

**Lógica de Cancelamento:**
```typescript
const cancelarAgendamento = async (agendamentoId: string) => {
  const { error } = await supabase
    .from('agendamentos')
    .update({ 
      status: 'cancelado',
      data_cancelamento: new Date().toISOString(),
      observacoes: 'Cancelado pelo entregador'
    })
    .eq('id', agendamentoId);
};
```

### `useAgendamento`
Processa criação de novos agendamentos.

**Localização**: `src/hooks/useAgendamento.tsx`

**Funcionalidades:**
- Validação de vagas disponíveis
- Prevenção de agendamentos duplicados
- Atualização automática de contadores

**Método Principal:**
```typescript
const agendarTurno = async (agendaId: string, tipo: 'vaga' | 'reserva') => {
  // 1. Verificar se já tem agendamento para esta agenda
  // 2. Verificar disponibilidade de vagas
  // 3. Criar agendamento
  // 4. Invalidar cache do React Query
};
```

### `useConfiguracoesSistema`
**Hook crítico para carregamento de configurações da empresa, especialmente sistema de horários específicos.**

**Localização**: `src/hooks/useConfiguracoesSistema.tsx`

**Funcionalidades:**
- Carregamento de configurações da empresa atual
- Sistema de retry automático com 3 tentativas
- Logs categorizados para debug (`CONFIGURACOES_SISTEMA`)
- Validação de horários específicos por nível de estrelas
- Cache inteligente para evitar requests desnecessários

**Retorno:**
```typescript
{
  configs: ConfiguracoesSistema | null,
  loading: boolean,
  hasError: boolean,
  podeVerAgendaPorHorario: (estrelas: number, data: string, hora: string) => ValidationResult,
  isAgendamentoPermitido: (data: string, hora: string) => ValidationResult
}
```

**Interface ConfiguracoesSistema:**
```typescript
interface ConfiguracoesSistema {
  habilitarPriorizacaoHorarios: boolean;
  permitirAgendamentoMesmoDia: boolean;
  horario_liberacao_5_estrelas: string;
  horario_liberacao_4_estrelas: string;
  horario_liberacao_3_estrelas: string;
  horario_liberacao_2_estrelas: string;
  horario_liberacao_1_estrela: string;
}
```

**Query Supabase:**
```sql
SELECT 
  c.chave,
  c.valor,
  c.tipo,
  c.horario_liberacao_5_estrelas,
  c.horario_liberacao_4_estrelas,
  c.horario_liberacao_3_estrelas,
  c.horario_liberacao_2_estrelas,
  c.horario_liberacao_1_estrela
FROM configuracoes_empresa c
WHERE c.empresa_id = get_current_empresa_id()
```

**Sistema de Retry Automático:**
```typescript
const retryConfig = {
  maxRetries: 3,
  delays: [1000, 2000, 4000], // 1s, 2s, 4s
  timeout: 10000 // 10 segundos
};

const fetchWithRetry = async (attempt = 1) => {
  try {
    const response = await supabase.from('configuracoes_empresa').select();
    return response;
  } catch (error) {
    if (attempt < maxRetries) {
      await delay(delays[attempt - 1]);
      return fetchWithRetry(attempt + 1);
    }
    throw error;
  }
};
```

**Logs Categorizados:**
```typescript
// Logs de sucesso
logger.info('Configurações carregadas com sucesso', {
  totalConfigs: configs.length,
  habilitarPriorizacaoHorarios: configs.habilitarPriorizacaoHorarios,
  horarios: extractedHorarios
}, 'CONFIGURACOES_SISTEMA');

// Logs de erro
logger.error('Erro ao carregar configurações', {
  error: error.message,
  attempt: currentAttempt,
  willRetry: currentAttempt < maxRetries
}, 'CONFIGURACOES_SISTEMA');

// Logs de debug
logger.debug('Tentativa de carregamento', {
  attempt: currentAttempt,
  empresa_id: empresaId,
  timestamp: Date.now()
}, 'CONFIGURACOES_SISTEMA');
```

**Função de Validação Principal:**
```typescript
const isAgendamentoPermitido = (data: string, horaInicioTurno: string): ValidationResult => {
  if (!configs?.habilitarPriorizacaoHorarios) {
    return { permitido: true };
  }

  const entregadorEstrelas = user?.estrelas || 3;
  const horarioAtual = new Date();
  const [hora, minuto] = horaInicioTurno.split(':').map(Number);
  
  // Buscar horário de liberação baseado nas estrelas
  const horarioLiberacao = getHorarioLiberacaoByEstrelas(entregadorEstrelas);
  
  // Comparar horários
  if (horarioAtual.getHours() * 60 + horarioAtual.getMinutes() < 
      parseInt(horarioLiberacao.split(':')[0]) * 60 + parseInt(horarioLiberacao.split(':')[1])) {
    return {
      permitido: false,
      motivo: `Horário de liberação: ${horarioLiberacao} para ${entregadorEstrelas} estrelas`
    };
  }
  
  return { permitido: true };
};
```

**Mapeamento de Horários por Estrelas:**
```typescript
const getHorarioLiberacaoByEstrelas = (estrelas: number): string => {
  const mapeamento = {
    5: configs.horario_liberacao_5_estrelas,
    4: configs.horario_liberacao_4_estrelas,
    3: configs.horario_liberacao_3_estrelas,
    2: configs.horario_liberacao_2_estrelas,
    1: configs.horario_liberacao_1_estrela
  };
  
  return mapeamento[estrelas] || configs.horario_liberacao_3_estrelas;
};
```

**Configurações Padrão (Fallback):**
```typescript
const defaultConfigs = {
  habilitarPriorizacaoHorarios: false,
  permitirAgendamentoMesmoDia: true,
  horario_liberacao_5_estrelas: '08:00:00',
  horario_liberacao_4_estrelas: '08:45:00',
  horario_liberacao_3_estrelas: '09:20:00',
  horario_liberacao_2_estrelas: '10:00:00',
  horario_liberacao_1_estrela: '10:30:00'
};
```

**Correções Implementadas (14/06/2025):**
- ✅ Sistema de retry robusto com backoff exponencial
- ✅ Logs categorizados para debug facilitado
- ✅ Timeout de segurança para evitar travamentos
- ✅ Fallback graceful para configurações padrão
- ✅ Cache inteligente para reduzir requests
- ✅ Gestão de estado consolidada

### `useDashboardStats`
Estatísticas para o dashboard administrativo.

**Localização**: `src/hooks/useDashboardStats.tsx`

**Funcionalidades:**
- Contadores de entregadores por status
- Agendamentos do dia atual
- Métricas de ocupação

**Queries Agregadas:**
```sql
-- Total de entregadores por status
SELECT status, COUNT(*) FROM entregadores GROUP BY status;

-- Agendamentos hoje
SELECT COUNT(*) FROM agendamentos a
JOIN agendas ag ON a.agenda_id = ag.id
WHERE ag.data = CURRENT_DATE;
```

## 🔄 Padrões de Implementação

### 1. Estrutura Padrão com Retry
```typescript
export function useHookComRetry(parametros?) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    hasError: false,
    retryCount: 0
  });

  const fetchWithRetry = async (attempt = 1) => {
    try {
      setState(prev => ({ ...prev, loading: true, hasError: false }));
      
      const response = await supabase.from('tabela').select();
      
      if (response.error) throw response.error;
      
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        retryCount: attempt - 1
      }));
      
      logger.info('Dados carregados com sucesso', {
        itemCount: response.data?.length,
        attempt
      }, 'HOOK_CATEGORY');
      
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        logger.warn('Tentativa falhou, tentando novamente', {
          error: error.message,
          attempt,
          nextAttempt: attempt + 1
        }, 'HOOK_CATEGORY');
        
        await delay(attempt * 1000);
        return fetchWithRetry(attempt + 1);
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        hasError: true,
        retryCount: attempt - 1
      }));
      
      logger.error('Falha final após tentativas', {
        error: error.message,
        totalAttempts: attempt
      }, 'HOOK_CATEGORY');
    }
  };

  useEffect(() => {
    fetchWithRetry();
  }, [dependencias]);

  return { ...state, refetch: () => fetchWithRetry() };
}
```

### 2. Gerenciamento de Estado Robusto
```typescript
// Estado consolidado
interface HookState<T> {
  data: T | null;
  loading: boolean;
  hasError: boolean;
  lastFetch: number | null;
  retryCount: number;
}

// Reducer para mudanças de estado
const stateReducer = <T>(state: HookState<T>, action: StateAction): HookState<T> => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, hasError: false };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        data: action.payload,
        loading: false,
        hasError: false,
        lastFetch: Date.now()
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, hasError: true };
    default:
      return state;
  }
};
```

### 3. Logs Estruturados
Todos os hooks seguem padrão de logs categorizados:

```typescript
// Categorias padrão
const LOG_CATEGORIES = {
  AUTH: 'AUTH',
  CONFIGURACOES: 'CONFIGURACOES_SISTEMA',
  AGENDAS: 'AGENDAS_DISPONIVEIS',
  AGENDAMENTOS: 'AGENDAMENTOS',
  DEBUG_ADELSON: 'DEBUG_ADELSON', // Para debugging específico
  PERFORMANCE: 'PERFORMANCE'
};

// Uso nos hooks
logger.info('Operação iniciada', { params }, LOG_CATEGORIES.AGENDAS);
logger.error('Falha na operação', { error }, LOG_CATEGORIES.AGENDAS);
logger.debug('Debug específico', { details }, LOG_CATEGORIES.DEBUG_ADELSON);
```

## 🔧 Debugging e Performance

### Monitoramento de Hooks
```typescript
// Métricas de performance
const useHookMetrics = (hookName: string) => {
  const startTime = useRef(Date.now());
  
  useEffect(() => {
    return () => {
      const duration = Date.now() - startTime.current;
      logger.info('Hook performance', {
        hookName,
        duration,
        renderCount: renderCount.current
      }, 'PERFORMANCE');
    };
  }, []);
};

// Debug de re-renders
const useWhyDidYouUpdate = (name: string, props: any) => {
  const previous = useRef();
  
  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changedKeys = allKeys.filter(key => 
        previous.current[key] !== props[key]
      );
      
      if (changedKeys.length) {
        logger.debug('Props que mudaram', {
          component: name,
          changedKeys,
          previous: pick(previous.current, changedKeys),
          current: pick(props, changedKeys)
        }, 'DEBUG_RENDERS');
      }
    }
    
    previous.current = props;
  });
};
```

## 🎯 Melhores Práticas Atualizadas

### 1. Sistema de Retry Obrigatório
Todos os hooks que fazem requests devem implementar retry:

```typescript
const useDataWithRetry = () => {
  const MAX_RETRIES = 3;
  const TIMEOUT = 10000;
  
  // Implementação obrigatória de retry
};
```

### 2. Logs Categorizados
Sempre usar categorias específicas para facilitar debug:

```typescript
logger.info('Mensagem', dados, 'CATEGORIA_ESPECIFICA');
```

### 3. Fallbacks Graceful
Sempre fornecer valores padrão seguros:

```typescript
const configs = loadedConfigs || defaultConfigs;
```

### 4. TypeScript Rigoroso
Todos os retornos devem ter tipos explícitos:

```typescript
interface UseConfigReturn {
  configs: ConfiguracoesSistema | null;
  loading: boolean;
  hasError: boolean;
  isAgendamentoPermitido: (data: string, hora: string) => ValidationResult;
}
```

---
*Última atualização: 14/06/2025*
