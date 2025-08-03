
# Sistema de Logs e Debugging - Documentação Técnica

## 🎯 Visão Geral

O sistema implementa um robusto sistema de logs categorizados que facilita o debugging, monitoramento e resolução de problemas em produção.

## 🔧 Implementação do Logger

### Estrutura Base
```typescript
// src/lib/logger.ts
interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  category?: string;
  timestamp: Date;
}
```

### Métodos Disponíveis
```typescript
logger.info('Mensagem', { dados }, 'CATEGORIA');
logger.error('Erro', { error }, 'CATEGORIA');
logger.warn('Aviso', { dados }, 'CATEGORIA');
logger.debug('Debug', { dados }, 'CATEGORIA');
logger.performance('operacao', duration, dados);

// Métodos especializados por contexto
logger.auth('info', 'Login realizado', { userId });
logger.api('error', 'Falha na API', { endpoint, error });
logger.admin('info', 'Ação administrativa', { action });
logger.billing('warn', 'Limite atingido', { limite });
logger.database('error', 'Erro na query', { query, error });
```

## 📊 Categorias de Log Implementadas

### Categorias Principais

#### `AUTH` - Autenticação e Autorização
```typescript
logger.auth('info', 'Usuário logado com sucesso', { userId, email });
logger.auth('error', 'Falha na autenticação', { error, email });
logger.authError(action, error, context); // Método especializado
```

#### `API` - Chamadas de API e Integrações
```typescript
logger.api('info', 'Requisição realizada', { endpoint, method, status });
logger.api('error', 'Erro na API', { endpoint, error });
logger.apiError(endpoint, error, context); // Método especializado
```

#### `ADMIN` - Ações Administrativas
```typescript
logger.admin('info', 'Empresa criada', { empresaId, nome });
logger.admin('warn', 'Tentativa de acesso negado', { userId, action });
```

#### `BILLING` - Sistema de Cobrança
```typescript
logger.billing('info', 'Plano alterado', { empresaId, planoNovo });
logger.billing('error', 'Falha no pagamento', { subscriptionId, error });
```

#### `DATABASE` - Operações de Banco de Dados
```typescript
logger.database('info', 'Query executada', { table, operation, duration });
logger.database('error', 'Erro na query', { query, error });
```

#### `AGENDAS` - Sistema de Agendas
```typescript
logger.info('Agendas carregadas', { totalAgendas, empresaId }, 'AGENDAS');
logger.debug('Buscando agendas disponíveis', { empresaId }, 'AGENDAS');
```

#### `AGENDAMENTO` - Processo de Agendamento
```typescript
logger.info('Agendamento criado', { agendamentoId, entregadorId }, 'AGENDAMENTO');
logger.error('Erro ao criar agendamento', { payload, error }, 'AGENDAMENTO');
```

#### `AUDIT` - Auditoria do Sistema
```typescript
logger.info('Ação de auditoria registrada', { action, resourceId }, 'AUDIT');
logger.warn('Tentativa de auditoria sem usuário', { action }, 'AUDIT');
```

## 🚀 Configuração por Ambiente

### Log Levels por Ambiente
```typescript
- Development: 'debug' (todos os logs)
- Staging: 'info' (info, warn, error)
- Production: 'warn' (apenas warn e error)
```

### Segurança em Produção
- Sanitização automática de dados sensíveis
- Redução de logs para performance
- Armazenamento seguro de logs críticos

## 📈 Performance Tracking

```typescript
// Rastreamento automático de performance
const startTime = Date.now();
// ... operação
const duration = Date.now() - startTime;
logger.performance('operacao_critica', duration, { contexto });
```

## 🔍 Debugging por Funcionalidade

### Sistema de Autenticação
```typescript
// Login/Logout
logger.auth('info', 'Tentativa de login', { email });
logger.auth('error', 'Falha na autenticação', { error, email });

// Verificação de permissões  
logger.debug('Verificando permissões', { userId, role }, 'AUTH');
```

### Sistema de Agendamento
```typescript
// Processo completo
logger.info('Iniciando agendamento', { agendaId, entregadorId }, 'AGENDAMENTO');
logger.debug('Verificando conflitos', { entregadorId, data }, 'AGENDAMENTO');
logger.performance('agendamento_criado', duration, { agendamentoId });
```

### Sistema Administrativo
```typescript
// Gestão de empresas
logger.admin('info', 'Carregando empresas', { filtros });
logger.admin('warn', 'Acesso negado', { userId, action });
logger.performance('empresas_carregadas', duration, { totalEmpresas });
```

## 🛠️ Ferramentas de Debug

### Configuração do Logger
```typescript
// Obter configuração atual
const config = logger.getConfig();
console.log(config); // { environment: 'development', logLevel: 'debug', ... }

// Métricas de performance
const metrics = logger.getPerformanceMetrics();

// Limpar métricas
logger.clearPerformanceMetrics();
```

### Console Commands (Development)
```javascript
// Filtrar logs por categoria no console do navegador
// (Implementar se necessário)
```

## 📊 Status da Migração

### ✅ Convertido para Logger Estruturado
- `src/lib/logger.ts` - Sistema base expandido
- `src/services/agendamentoService.ts` - Convertido completamente
- `src/services/agendasService.ts` - Convertido completamente  
- `src/components/admin/GestaoEntregadores.tsx` - Convertido
- `src/components/admin/GestaoEmpresas.tsx` - Convertido (parcial)
- `src/lib/auditLogger.ts` - Convertido completamente

### ⏳ Pendente de Conversão
- Console.logs diretos em ~400+ arquivos
- Logs de debug específicos por usuário
- Sistema de configurações (configuracoes.service.ts)
- Edge functions do Supabase

### 🎯 Próximos Passos
1. Converter logs restantes por prioridade
2. Implementar dashboard de logs em produção
3. Integração com serviços externos (Sentry, LogRocket)
4. Remover console.logs diretos completamente

## ⚙️ Configurações Avançadas

### Sanitização de Dados
```typescript
// Campos automaticamente sanitizados
const sensitiveFields = [
  'senha', 'password', 'token', 'secret', 'key', 
  'access_token', 'refresh_token'
];
```

### Limites e Performance
- Logs em memória: máximo 100 registros de performance
- Logs de erro em localStorage: máximo 50 registros
- Truncamento de strings: 500 caracteres
- Cache de configuração: 5 minutos TTL

### Integração com Monitoramento
```typescript
// Em produção, logs de erro são enviados para:
- localStorage (backup local)
- Serviço de logging externo (futuro)
- Metrics tracking (futuro)
```

---
*Documentação atualizada após Fase 2 da migração - Data: Janeiro 2025*
