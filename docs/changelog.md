
# Changelog

Todas as mudanças significativas neste projeto são documentadas neste arquivo.

## [Janeiro/2025] - PWA e Funcionalidades Mobile

### ✅ Implementado
- **Progressive Web App (PWA)**
  - Service Worker para cache e funcionamento offline
  - Web App Manifest para instalação nativa
  - Hook `useInstallPrompt` para detecção de instalação
  - Componente `InstallButton` adaptativo para iOS/Android
  - Suporte completo a modo standalone

- **Funcionalidades Mobile**
  - Hook `useIsMobile` para detecção responsiva
  - Componente `MobileBottomNav` para navegação inferior
  - `AdminMobileBottomNav` para painel administrativo
  - `MobileNavDrawer` para navegação lateral
  - `ResponsiveTable` com adaptação automática para mobile
  - `MobileOptimizedLogin` para tela de login otimizada

- **Sistema de Sincronização Offline**
  - Hook `useOnlineStatus` para detecção de conectividade
  - Serviço `SyncService` para sincronização automática
  - Componente `SyncStatus` para controle manual
  - `ConnectionStatus` para indicador visual
  - Background sync via Service Worker

- **Otimizações de UX**
  - Animações com Framer Motion
  - Touch optimization para dispositivos móveis
  - Performance melhorada com lazy loading
  - Cache estratégico de recursos

## [Janeiro/2025] - Implementação Completa de Gestão de Administradores

### ✅ Funcionalidades Implementadas

#### **Edição de Administradores**
- **Componente EditAdminDialog**: Interface completa para edição de administradores
- **Validação de formulário**: Validação em tempo real com feedback visual
- **Controle de permissões**: Verificação granular baseada em roles
- **Auditoria completa**: Log detalhado de todas as alterações

#### **Exclusão de Administradores**
- **Exclusão segura**: Implementação com múltiplas validações de segurança
- **Prevenção de auto-exclusão**: Proteção contra exclusão acidental da própria conta
- **Confirmação obrigatória**: Diálogo de confirmação antes da exclusão
- **Log de auditoria**: Registro completo da operação de exclusão

#### **Sistema de Permissões Aprimorado**
- **Controle granular**: Permissões específicas para edição e exclusão
- **Validação por empresa**: Admins empresariais só podem gerenciar da própria empresa
- **Função canManageAdmin**: Verificação dinâmica de permissões por administrador

### 🔧 Componentes Criados/Modificados

#### **Novos Componentes**
- `src/components/admin/EditAdminDialog.tsx`: Diálogo de edição completo

#### **Componentes Modificados**
- `src/components/admin/GestaoAdministradores.tsx`: Adição de botões de edição e exclusão
- `src/services/adminManagementService.ts`: Implementação dos métodos updateAdmin e deleteAdmin
- `src/lib/auditLogger.ts`: Adição do método logAdminDeleted
- `src/hooks/useAdminPermissions.tsx`: Aprimoramento das permissões

### 🛡️ Melhorias de Segurança

#### **Validações Implementadas**
- **Verificação de permissões**: Validação em múltiplas camadas (frontend + backend)
- **Prevenção de auto-exclusão**: Impossibilidade de excluir a própria conta
- **Validação de empresa**: Admins empresariais limitados à própria empresa
- **Sanitização de dados**: Limpeza de dados sensíveis nos logs

#### **Sistema de Auditoria**
- **Log de edições**: Registro detalhado de todas as alterações
- **Log de exclusões**: Registro completo de administradores removidos
- **Informações contextuais**: IP, navegador, timestamp de todas as operações
- **Dados do alvo**: Informações do administrador afetado pela operação

### 📊 Funcionalidades de Interface

#### **Experiência do Usuário**
- **Feedback visual**: Loading states e mensagens de sucesso/erro
- **Validação em tempo real**: Feedback imediato durante preenchimento
- **Confirmações de segurança**: Diálogos de confirmação para operações críticas
- **Toasts informativos**: Notificações não-intrusivas de status

#### **Controles de Acesso**
- **Botões condicionais**: Exibição baseada em permissões do usuário
- **Estados desabilitados**: Controles inativos quando não permitidos
- **Mensagens de erro contextuais**: Feedback específico por tipo de erro

### 🎯 Benefícios Alcançados

#### **Para Administradores**
- **Gestão completa**: Capacidade de editar e remover administradores
- **Segurança aprimorada**: Múltiplas camadas de proteção
- **Auditoria transparente**: Rastreabilidade completa de ações
- **Interface intuitiva**: Experiência de usuário otimizada

#### **Para o Sistema**
- **Código modular**: Componentes reutilizáveis e bem estruturados
- **Tipagem rigorosa**: TypeScript em todos os componentes
- **Tratamento de erros**: Gestão robusta de cenários de falha
- **Performance otimizada**: Operações eficientes com feedback adequado

### 🔄 Fluxos Implementados

#### **Fluxo de Edição**
1. Verificação de permissões
2. Abertura do diálogo de edição
3. Validação de formulário
4. Submissão com feedback
5. Log de auditoria
6. Atualização da interface

#### **Fluxo de Exclusão**
1. Verificação de permissões
2. Confirmação do usuário
3. Validações de segurança
4. Exclusão do banco de dados
5. Log de auditoria
6. Atualização da interface

### 📚 Documentação Criada
- **README.md atualizado**: Informações completas sobre gestão de administradores
- **Documentação técnica**: Arquivo detalhado em `docs/gestao-administradores.md`
- **Comentários no código**: Documentação inline em todos os componentes

---

## [15/06/2025] - Refatoração Modular do Sistema de Configurações

### ✅ O que foi alterado
- **Divisão arquitetural**: `useConfiguracoesSistema` refatorado em 4 hooks especializados
- **Service Layer**: Criação do `ConfiguracoesService` para centralizar operações de banco
- **Tipagem consolidada**: Implementação de tipos rigorosos em `configuracoes.ts`
- **Arquitetura de composição**: Hooks modulares com responsabilidades bem definidas
- **Carregamento automático**: Sistema inteligente de inicialização de configurações
- **Proteção contra race conditions**: Implementação de guards para evitar carregamentos duplos

### 🎯 Motivo
O sistema de configurações estava monolítico e difícil de manter:
- Hook gigante com múltiplas responsabilidades misturadas
- Lógica de carregamento, salvamento e validação no mesmo arquivo
- Dificuldade para testar componentes individuais
- Código duplicado entre diferentes funcionalidades
- Falta de separação clara entre estado, lógica de negócio e persistência

### 🏗️ Nova Arquitetura Modular

#### **Hooks Especializados Criados:**

**1. `useConfiguracoesCore.ts`**
- **Responsabilidade**: Gerenciamento do estado central
- **Funcionalidades**: Estado de configs, loading, errors, flags de controle
- **Benefício**: Estado centralizado e consistente

**2. `useConfiguracoesLoader.ts`**
- **Responsabilidade**: Carregamento de dados do banco
- **Funcionalidades**: Fetch com retry, proteção contra duplicação, logs detalhados
- **Benefício**: Carregamento robusto e confiável

**3. `useConfiguracoesSaver.ts`**
- **Responsabilidade**: Persistência de configurações
- **Funcionalidades**: Salvamento com validação, feedback de progresso
- **Benefício**: Operações de escrita seguras e rastreáveis

**4. `useHorariosValidation.ts`**
- **Responsabilidade**: Validação de horários e permissões
- **Funcionalidades**: Lógica de negócio para horários por estrelas
- **Benefício**: Validações reutilizáveis e testáveis

#### **Service Layer:**

**`configuracoes.service.ts`**
- Centralização de operações de banco de dados
- Implementação de políticas RLS corrigidas
- Logs estruturados para debugging
- Tratamento de erros padronizado

#### **Tipagem Consolidada:**

**`types/configuracoes.ts`**
- Interfaces TypeScript rigorosas
- Tipos para todas as operações de configuração
- Validação em tempo de compilação
- Documentação inline dos tipos

### 📁 Arquivos afetados

#### **Novos Arquivos:**
- `src/hooks/useConfiguracoesCore.ts`
- `src/hooks/useConfiguracoesLoader.ts`
- `src/hooks/useConfiguracoesSaver.ts`
- `src/hooks/useHorariosValidation.ts`
- `src/services/configuracoes.service.ts`
- `src/types/configuracoes.ts`

#### **Arquivos Refatorados:**
- `src/hooks/useConfiguracoesSistema.tsx` (simplificado para composição)
- `src/components/admin/ConfiguracoesSistema.tsx` (uso dos novos hooks)

### 🔧 Mudanças técnicas específicas

#### **1. Composição de Hooks**
**Antes (Monolítico):**
```typescript
// useConfiguracoesSistema.tsx - 993 linhas
const useConfiguracoesSistema = () => {
  // Estado + Carregamento + Salvamento + Validação
  // Tudo misturado em um hook gigante
};
```

**Depois (Modular):**
```typescript
// useConfiguracoesSistema.tsx - 106 linhas
const useConfiguracoesSistema = () => {
  const coreState = useConfiguracoesCore();
  const { loadConfiguracoes } = useConfiguracoesLoader(coreState);
  const { saveAllConfiguracoes } = useConfiguracoesSaver(coreState);
  const { podeVerAgendaPorHorario } = useHorariosValidation(coreState);
  
  return { ...coreState, loadConfiguracoes, saveAllConfiguracoes, podeVerAgendaPorHorario };
};
```

#### **2. Service Layer Centralizado**
```typescript
// configuracoes.service.ts
export class ConfiguracoesService {
  static async loadConfiguracoesFromDB(empresaId: string) {
    // Lógica centralizada com RLS corrigida
  }
  
  static async saveConfiguracoesToDB(configs: ConfiguracoesSistema) {
    // Operações de escrita padronizadas
  }
}
```

#### **3. Carregamento Automático Inteligente**
```typescript
// useConfiguracoesSistema.tsx
useEffect(() => {
  if (empresa?.id && !hasInitializedRef.current && !isLoadingRef.current) {
    hasInitializedRef.current = true;
    loadConfiguracoes();
  }
}, [empresa?.id, loadConfiguracoes]);
```

### 🎯 Benefícios da Refatoração

#### **1. Manutenibilidade**
- Código 90% menor em cada hook especializado
- Responsabilidades claras e bem definidas
- Fácil localização de bugs específicos

#### **2. Testabilidade**
- Cada hook pode ser testado independentemente
- Mocks mais simples e focados
- Cobertura de testes mais granular

#### **3. Reutilização**
- Hooks especializados podem ser usados em outros componentes
- Service layer reutilizável em diferentes contextos
- Validações padronizadas em todo o sistema

#### **4. Performance**
- Carregamento otimizado com proteções
- Evita re-renders desnecessários
- Estado mais eficiente

#### **5. Developer Experience**
- Código mais legível e organizados
- IntelliSense melhorado com tipos rigorosos
- Debugging facilitado com logs estruturados

### 🧪 Como testar
1. **Teste de Modularidade**: Importar hooks individuais em componentes de teste
2. **Teste de Composição**: Verificar se `useConfiguracoesSistema` funciona como antes
3. **Teste de Performance**: Monitorar re-renders e requests duplicados
4. **Teste de Tipos**: Verificar IntelliSense e validação TypeScript
5. **Teste de Logs**: Confirmar logs estruturados nos novos hooks

### ⚠️ Impactos
- **Positivo**: Arquitetura muito mais limpa e manutenível
- **Positivo**: Base sólida para futuras funcionalidades
- **Positivo**: Padrão estabelecido para outros refatoramentos
- **Neutro**: Interface pública mantida, sem breaking changes
- **Consideração**: Desenvolvedores precisam entender nova estrutura modular

### 🔍 Próximos passos
- [ ] Aplicar mesmo padrão modular em outros hooks complexos
- [ ] Implementar testes unitários para cada hook especializado
- [ ] Considerar extrair mais service layers para outras funcionalidades
- [ ] Documentar padrões de composição de hooks no projeto

---

## [14/06/2025] - Correção Crítica do Sistema de Horários Específicos

### ✅ O que foi alterado
- Reformulação completa da função `get_current_empresa_id()` no banco de dados
- Correção das políticas RLS na tabela `configuracoes_empresa` usando SECURITY DEFINER
- Implementação de sistema de retry automático no hook `useConfiguracoesSistema`
- Melhoria significativa no carregamento de configurações com logs detalhados
- Correção de problemas de autenticação com auth.uid() em contextos RLS

### 🎯 Motivo
O sistema de horários específicos por estrelas estava completamente quebrado devido a:
- Função SQL `get_current_empresa_id()` não conseguia acessar dados por RLS recursivo
- Políticas RLS mal configuradas impediam carregamento de configurações
- Hook falhava silenciosamente sem retry, deixando configurações sempre null
- Entregadores conseguiam agendar em horários restritos, violando regras de negócio

### 📁 Arquivos afetados
- Função SQL: `get_current_empresa_id()` (banco de dados)
- Políticas RLS: `configuracoes_empresa` (banco de dados)
- `src/hooks/useConfiguracoesSistema.tsx`
- `src/components/entregador/AgendamentoCalendar.tsx` (logs de debug)

### 🔧 Mudanças técnicas específicas

#### 1. Correção da Função SQL
**Antes:**
```sql
-- Função com problemas de RLS recursivo
CREATE OR REPLACE FUNCTION get_current_empresa_id()
RETURNS UUID AS $$
-- Implementação problemática
```

**Depois:**
```sql
-- Função com SECURITY DEFINER para evitar RLS
CREATE OR REPLACE FUNCTION get_current_empresa_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT e.empresa_id 
  FROM entregadores e 
  WHERE e.user_id = auth.uid()
  LIMIT 1;
$$;
```

#### 2. Correção das Políticas RLS
**Adicionado:**
```sql
-- Política específica para leitura de configurações
CREATE POLICY "Users can read own company configs"
ON configuracoes_empresa FOR SELECT
TO authenticated
USING (empresa_id = get_current_empresa_id());
```

#### 3. Melhoria no Hook
**Adicionado:**
- Sistema de retry automático com 3 tentativas
- Logs categorizados para debug (`CONFIGURACOES_SISTEMA`)
- Timeout de segurança de 10 segundos
- Fallback graceful para configurações padrão

### 🧪 Como testar
1. **Login Entregador**: Fazer login como entregador aprovado
2. **Verificar Logs**: Console deve mostrar configurações carregadas corretamente
3. **Testar Horários**: Tentar agendar antes do horário permitido para o nível de estrelas
4. **Validar Bloqueio**: Sistema deve bloquear e mostrar motivo específico
5. **Teste Cross-estrelas**: Testar com entregadores de diferentes níveis (1-5 estrelas)

### ⚠️ Impactos
- **Positivo**: Sistema de horários específicos funciona corretamente
- **Positivo**: Performance melhorada com retry inteligente
- **Positivo**: Logs detalhados facilitam debugging futuro
- **Positivo**: Configurações são carregadas de forma consistente
- **Crítico**: Regras de negócio agora são realmente aplicadas
- **Consideração**: Entregadores podem notar mudança no comportamento de agendamento

### 🔍 Investigações futuras
- [ ] Implementar cache Redis para configurações frequentes
- [ ] Considerar sistema de notificações quando horários são liberados
- [ ] Avaliar impacto na experiência do usuário com horários muito restritivos

---

## [14/06/2025] - Correção da Inconsistência Visual no Calendário de Agendamento

### ✅ O que foi alterado
- Aplicação de validação de horários específicos no Step 1 do `AgendamentoCalendar`
- Reformulação da lógica `datasComAgendasLiberadas` para usar `isAgendamentoPermitido()`
- Sincronização completa entre interface visual (Step 1) e funcionalidade (Step 2)
- Implementação de feedback visual consistente para datas bloqueadas/liberadas
- Correção específica do botão "HOJE" para entregador Adelson

### 🎯 Motivo
Existia uma inconsistência crítica na interface onde:
- Step 1 (calendário) mostrava datas como disponíveis (botões azuis)
- Step 2 (seleção de turno) bloqueava as mesmas datas por restrições de horário
- Entregador Adelson via "HOJE" como disponível mesmo antes das 23:50
- Usuários ficavam confusos com interface mentirosa

### 📁 Arquivos afetados
- `src/components/entregador/AgendamentoCalendar.tsx`

### 🔧 Mudanças técnicas específicas

#### 1. Validação no Step 1
**Antes:**
```typescript
// Apenas verificava se existiam agendas na data
const datasComAgendas = new Set(agendas.map(a => a.data));
```

**Depois:**
```typescript
// Verifica se existem agendas E se estão liberadas por horário
const datasComAgendasLiberadas = new Set<string>();
agendas.forEach(agenda => {
  const validacao = isAgendamentoPermitido(agenda.data, agenda.turno.hora_inicio);
  if (validacao.permitido) {
    datasComAgendasLiberadas.add(agenda.data);
  }
});
```

#### 2. Aplicação Consistente
**Implementado:**
- Mesma função `isAgendamentoPermitido()` usada em Step 1 e Step 2
- Logs detalhados para debug da validação
- Feedback visual imediato para usuário

#### 3. Correção do Botão HOJE
**Resultado:**
- Adelson só vê botão "HOJE" azul/clicável a partir das 23:50
- Antes das 23:50, botão fica cinza/desabilitado
- Comportamento consistente com sistema de horários

### 🧪 Como testar
1. **Teste Adelson (5 estrelas)**: 
   - Login antes das 23:50
   - Verificar botão "HOJE" desabilitado
   - Aguardar 23:50 e verificar habilitação
2. **Teste Outros Níveis**: Testar com entregadores 1-4 estrelas
3. **Validação Visual**: Confirmar consistência entre Step 1 e Step 2
4. **Cross-browser**: Testar em diferentes dispositivos e navegadores

### ⚠️ Impactos
- **Positivo**: Interface agora é honesta e consistente
- **Positivo**: Eliminação de frustraç ão do usuário
- **Positivo**: Redução de tentativas de agendamento falhadas
- **UX**: Usuários veem imediatamente quais datas estão realmente disponíveis
- **Consideração**: Pode reduzir percepção de disponibilidade (mas é mais precisa)

### 🔍 Investigações futuras
- [ ] Implementar tooltip explicando por que data está bloqueada
- [ ] Considerar countdown até liberação da data
- [ ] Avaliar feedback de usuários sobre nova interface

---

## [14/06/2025] - Refatoração Crítica do Hook useConfiguracoesSistema

### ✅ O que foi alterado
- Implementação de sistema de retry robusto com 3 tentativas automáticas
- Adição de logs categorizados detalhados para debug (`CONFIGURACOES_SISTEMA`)
- Correção de problemas de timeout com limite de 10 segundos
- Melhoria no tratamento de erros com fallbacks graceful
- Implementação de cache inteligente para evitar requests desnecessários
- Correção de race conditions no carregamento de configurações

### 🎯 Motivo
O hook `useConfiguracoesSistema` era crítico para o funcionamento do sistema mas tinha problemas graves:
- Falhava silenciosamente deixando configurações sempre null/undefined
- Não tinha retry, causando inconsistências intermitentes
- Logs insuficientes dificultavam debugging
- Dependências mal gerenciadas causavam loops infinitos
- Performance ruim com requests duplicados

### 📁 Arquivos afetados
- `src/hooks/useConfiguracoesSistema.tsx`
- `src/components/entregador/AgendamentoCalendar.tsx` (uso do hook)

### 🔧 Mudanças técnicas específicas

#### 1. Sistema de Retry
**Implementado:**
```typescript
const retryConfig = {
  maxRetries: 3,
  delay: 1000, // 1 segundo entre tentativas
  backoff: 'exponential' // 1s, 2s, 4s
};

const fetchWithRetry = async (attempt = 1) => {
  try {
    // Lógica de fetch
  } catch (error) {
    if (attempt < maxRetries) {
      await delay(attempt * 1000);
      return fetchWithRetry(attempt + 1);
    }
    throw error;
  }
};
```

#### 2. Logs Estruturados
**Adicionado:**
```typescript
logger.info('Configurações carregadas com sucesso', {
  totalConfigs: configs.length,
  habilitarPriorizacaoHorarios: configs.habilitarPriorizacaoHorarios,
  permitirAgendamentoMesmoDia: configs.permitirAgendamentoMesmoDia,
  horarios: extractedHorarios
}, 'CONFIGURACOES_SISTEMA');
```

#### 3. Gestão de Estado Melhorada
**Antes:**
```typescript
// Estado fragmentado e inconsistente
const [configs, setConfigs] = useState(null);
const [loading, setLoading] = useState(true);
```

**Depois:**
```typescript
// Estado consolidado com fallbacks
const [state, setState] = useState({
  configs: defaultConfigs,
  loading: true,
  hasError: false,
  lastFetch: null
});
```

### 🧪 Como testar
1. **Teste de Reliability**: Refresh página múltiplas vezes rapidamente
2. **Teste de Network**: Simular conexão lenta/instável no DevTools
3. **Teste de Error**: Desabilitar temporariamente conexão
4. **Logs**: Verificar logs categorizados no console
5. **Performance**: Monitorar número de requests com Network tab

### ⚠️ Impactos
- **Positivo**: Sistema muito mais estável e confiável
- **Positivo**: Debug facilitado com logs estruturados
- **Positivo**: Performance melhorada com menos requests
- **Positivo**: UX mais consistente sem falhas intermitentes
- **Técnico**: Base sólida para futuras funcionalidades
- **Consideração**: Pode mascarar problemas de rede (retry automático)

### 🔍 Investigações futuras
- [ ] Implementar cache persistente com localStorage
- [ ] Adicionar métricas de performance do hook
- [ ] Considerar WebSocket para configurações em tempo real
- [ ] Avaliar implementação de service worker para cache offline

---

## [30/05/2025] - Simplificação do Dashboard do Entregador

### ✅ O que foi alterado
- Remoção da seção "Próximos Agendamentos" do dashboard principal
- Substituição por seção de "Cuidados Necessários no Trânsito"
- Simplificação da interface e remoção de dependências complexas
- Eliminação do hook `useEntregadorData` do dashboard principal

### 🎯 Motivo
A seção de próximos agendamentos estava causando problemas de carregamento devido a queries complexas com relacionamentos ambíguos. Para melhorar a experiência do usuário e estabilidade da aplicação, optou-se por simplificar o dashboard e focar em informações de segurança relevantes para entregadores.

### 📁 Arquivos afetados
- `src/components/EntregadorDashboard.tsx`

### 🔧 Mudanças técnicas específicas

#### 1. Remoção de Complexidade
**Removido:**
- Hook `useEntregadorData` e suas queries complexas
- Seção "Próximos Agendamentos" com formatação de dados
- Lógica de `formatAgendamentoDisplay`
- Estados de loading relacionados a agendamentos

#### 2. Nova Seção de Segurança
**Adicionado:**
- Card dedicado aos "Cuidados Necessários no Trânsito"
- Lista de dicas de segurança para entregadores
- Design com ícones de alerta e cores apropriadas
- Mensagem principal: "🚛 Dirija com segurança! Use sempre cinto de segurança, capacete e respeite as leis de trânsito."

#### 3. Simplificação da Interface
- Interface mais limpa e focada
- Carregamento mais rápido sem queries complexas
- Mantidas as funcionalidades essenciais (botões de ação e navegação)
- Preservado o card de boas-vindas

### 🧪 Como testar
1. **Dashboard**: Verificar se carrega rapidamente sem erros
2. **Navegação**: Confirmar que os botões "Agendar" e "Meus Agendamentos" funcionam
3. **Responsividade**: Testar em dispositivos móveis
4. **Console**: Verificar ausência de erros relacionados a queries

### ⚠️ Impactos
- **Positivo**: Interface mais estável e rápida
- **Positivo**: Foco em segurança do entregador
- **Positivo**: Eliminação de pontos de falha complexos
- **Neutro**: Funcionalidade de agendamentos ainda disponível via menu
- **Consideração**: Informações de próximos agendamentos agora apenas em "Meus Agendamentos"

### 🔍 Benefícios da simplificação
- [x] Elimina problemas de carregamento de dados
- [x] Interface mais limpa e focada
- [x] Carregamento mais rápido da tela principal
- [x] Menos pontos de falha
- [x] Experiência do usuário mais consistente
- [x] Foco em segurança e bem-estar do entregador

---

## [30/05/2025] - Correção de Relacionamentos Ambíguos no Hook useEntregadorData

### ✅ O que foi alterado
- Correção de foreign keys explícitas no hook `useEntregadorData`
- Resolução do erro "Could not embed because more than one relationship was found"
- Implementação de foreign keys específicas para queries Supabase
- Melhoria na estrutura de queries para relacionamentos complexos

### 🎯 Motivo
O hook `useEntregadorData` estava falhando ao buscar agendamentos devido a relacionamentos ambíguos no banco de dados. O Supabase não conseguia determinar qual foreign key usar automaticamente quando múltiplos relacionamentos existem entre as mesmas tabelas.

### 📁 Arquivos afetados
- `src/hooks/useEntregadorData.tsx`

### 🔧 Mudanças técnicas específicas

#### 1. Correção de Foreign Keys Explícitas
**Antes:**
```typescript
agendas (
  data,
  turnos (nome, hora_inicio, hora_fim),
  regioes (
    nome,
    cidades (nome)
  )
)
```

**Depois:**
```typescript
agendas!agenda_id (
  data,
  turnos!turno_id (nome, hora_inicio, hora_fim),
  regioes!regiao_id (
    nome,
    cidades!cidade_id (nome)
  )
)
```

#### 2. Estrutura de Query Corrigida
A query agora especifica explicitamente qual foreign key usar em cada nível:
- `agendas!agenda_id`: especifica que queremos agendar através do campo `agenda_id`
- `turnos!turno_id`: especifica que queremos turnos através do campo `turno_id`
- `regioes!regiao_id`: especifica que queremos regiões através do campo `regiao_id`
- `cidades!cidade_id`: especifica que queremos cidades através do campo `cidade_id`

### 🧪 Como testar
1. **Dashboard Entregador**: Verificar se a seção "Próximos Agendamentos" carrega corretamente
2. **Console Logs**: Verificar se não há mais erros relacionados a relacionamentos ambíguos
3. **Dados**: Confirmar que os 3 agendamentos existentes no banco aparecem na interface
4. **Filtragem**: Validar que apenas agendamentos futuros são exibidos

### ⚠️ Impactos
- **Positivo**: Hook funciona corretamente sem erros de relacionamento
- **Positivo**: Agendamentos são carregados e exibidos na interface
- **Positivo**: Performance melhorada com queries mais específicas
- **Neutro**: Mudança transparente para usuários finais
- **Consideração**: Sintaxe mais específica requer manutenção cuidadosa

### 🔍 Investigações futuras
- [ ] Aplicar padrão de foreign keys explícitas em outros hooks
- [ ] Documentar padrões de query Supabase para relacionamentos complexos
- [ ] Considerar criação de tipos TypeScript específicos para respostas de queries

---

## [30/05/2025] - Correção de Discrepâncias de Datas Entre Painéis

### ✅ O que foi alterado
- Padronização de filtros de data em todos os hooks
- Correção de inconsistências entre dashboard admin e entregador
- Implementação de funções utilitárias para formatação de datas
- Melhoria na exibição de agendamentos futuros

### 🎯 Motivo
Os painéis administrativo e do entregador estavam mostrando dados diferentes devido a:
- Filtros de data inconsistentes entre hooks
- Problemas com fuso horário nas comparações de data
- Lógica divergente para determinar agendamentos "ativos"

### 📁 Arquivos afetados
- `src/hooks/useEntregadorData.tsx`
- `src/hooks/useMeusAgendamentos.tsx` 
- `src/hooks/useAgendasDisponiveis.tsx`
- `src/components/admin/CriacaoAgendas.tsx`

### 🔧 Mudanças técnicas específicas

#### 1. Padronização de Filtros de Data
**Antes:**
```typescript
// Filtros inconsistentes em diferentes hooks
.gte('data', new Date().toISOString().split('T')[0])
.gte('agendas.data', today)
```

**Depois:**
```typescript
// Uso consistente da função utilitária
const dataAtual = getDataAtualFormatada();
.gte('agendas.data', dataAtual)
```

#### 2. Filtragem de Agendamentos Ativos
**Antes:**
```typescript
// Buscava todos os agendamentos
const { data } = await supabase
  .from('agendamentos')
  .select('*')
```

**Depois:**
```typescript
// Filtra apenas agendamentos ativos para o dashboard
const { data } = await supabase
  .from('agendamentos')
  .select('*')
  .eq('status', 'agendado')
  .gte('agendas.data', dataAtual)
```

#### 3. Melhoria nas Foreign Keys
Adicionado foreign keys explícitas nas queries:
```typescript
agendas!agendamentos_agenda_id_fkey(...)
turnos!agendas_turno_id_fkey(...)
regioes!agendas_regiao_id_fkey(...)
```

### 🧪 Como testar
1. **Dashboard Admin**: Verificar se mostra apenas agendas futuras
2. **Dashboard Entregador**: Confirmar que próximos agendamentos são apenas os ativos
3. **Calendário**: Validar que datas são consistentes entre visualizações
4. **Cross-browser**: Testar em diferentes fusos horários

### ⚠️ Impactos
- **Positivo**: Dados consistentes entre painéis
- **Positivo**: Melhor performance com filtros mais específicos
- **Neutro**: Mudança transparente para usuários finais
- **Consideração**: Logs mais detalhados podem gerar mais volume

### 🔍 Investigações futuras
- [ ] Implementar testes automatizados para validação de datas
- [ ] Considerar uso de bibliotecas como date-fns para manipulação mais robusta
- [ ] Avaliar implementação de cache para consultas frequentes de datas

---

## [Template para Próximas Mudanças]

### ✅ O que foi alterado
- Lista descritiva das mudanças

### 🎯 Motivo
- Explicação do racional técnico/negócio

### 📁 Arquivos afetados
- Lista de arquivos modificados

### 🔧 Mudanças técnicas específicas
- Detalhes de implementação
- Códigos antes/depois quando relevante

### 🧪 Como testar
- Instruções para validar a mudança

### ⚠️ Impactos
- Possíveis efeitos colaterais
- Considerações importantes

### 🔍 Investigações futuras
- Melhorias ou investigações pendentes

---

## 📋 Categorias de Mudanças

- **✨ Feature**: Nova funcionalidade
- **🐛 Bug Fix**: Correção de erro
- **🔧 Refactor**: Reestruturação de código
- **📚 Docs**: Atualização de documentação
- **🎨 Style**: Mudanças de UI/UX
- **⚡ Performance**: Otimizações
- **🔒 Security**: Melhorias de segurança
- **🗄️ Database**: Mudanças no banco de dados

---
*Documentação mantida continuamente*
