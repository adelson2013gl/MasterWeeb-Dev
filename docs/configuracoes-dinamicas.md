# Sistema de Configurações Dinâmicas do Mercado Pago

Este documento descreve como usar o novo sistema de configurações dinâmicas para o Mercado Pago, que permite gerenciar credenciais e configurações através de uma interface administrativa ao invés de variáveis de ambiente estáticas.

## Visão Geral

O sistema de configurações dinâmicas oferece:

- **Interface administrativa** para gerenciar credenciais do Mercado Pago
- **Configurações por ambiente** (teste e produção)
- **Cache inteligente** para performance
- **Fallback automático** para variáveis de ambiente
- **Validação de configurações** em tempo real
- **Segurança aprimorada** para dados sensíveis

## Componentes do Sistema

### 1. Banco de Dados

**Tabela:** `configuracoes_sistema`

```sql
CREATE TABLE configuracoes_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    categoria VARCHAR(50) NOT NULL,
    descricao TEXT,
    sensivel BOOLEAN DEFAULT FALSE,
    ambiente VARCHAR(20) DEFAULT 'production' CHECK (ambiente IN ('test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Serviço de Configurações

**Arquivo:** `src/services/configuracoesService.ts`

Gerencia todas as operações relacionadas às configurações:

- Buscar configurações por chave ou categoria
- Atualizar configurações individuais ou em lote
- Cache com TTL de 5 minutos
- Validação de configurações críticas

### 3. Interface Administrativa

**Componente:** `ConfiguracoesMercadoPago.tsx`

Interface React para gerenciar configurações do Mercado Pago:

- Abas separadas para teste e produção
- Campos sensíveis com toggle de visibilidade
- Validação em tempo real
- Indicadores de status das configurações

### 4. Configuração Atualizada

**Arquivo:** `src/config/mercadopago.ts`

Sistema híbrido que:

- Carrega configurações dinâmicas primeiro
- Usa variáveis de ambiente como fallback
- Mantém cache para performance
- Oferece funções síncronas e assíncronas

## Como Usar

### 1. Executar Migração

```bash
# Aplicar a migração do banco de dados
supabase db push
```

### 2. Acessar Interface Administrativa

1. Navegue para a página de configurações administrativas
2. Acesse a aba "Mercado Pago"
3. Configure as credenciais para teste e/ou produção
4. Defina as URLs necessárias
5. Salve as configurações

### 3. Configurações Disponíveis

#### Credenciais de Teste
- `mercadopago_public_key_test`: Chave pública de teste
- `mercadopago_access_token_test`: Token de acesso de teste

#### Credenciais de Produção
- `mercadopago_public_key_prod`: Chave pública de produção
- `mercadopago_access_token_prod`: Token de acesso de produção

#### Configurações Gerais
- `mercadopago_environment`: Ambiente ativo (test/production)
- `frontend_url`: URL base da aplicação
- `webhook_url`: URL do webhook do Mercado Pago

### 4. Usar no Código

#### Obter Configurações (Recomendado)

```typescript
import { getMercadoPagoConfig } from '@/config/mercadopago';

// Função assíncrona
async function exemploUso() {
  const config = await getMercadoPagoConfig();
  console.log('Ambiente:', config.environment);
  console.log('Chave pública:', config.publicKey);
}
```

#### Validar Configurações

```typescript
import { validateMercadoPagoConfig } from '@/config/mercadopago';

async function validarConfigs() {
  const { isValid, errors } = await validateMercadoPagoConfig();
  
  if (!isValid) {
    console.error('Configurações inválidas:', errors);
  }
}
```

#### Limpar Cache

```typescript
import { clearConfigCache } from '@/config/mercadopago';
import { mercadoPagoService } from '@/services/mercadopagoService';

// Limpar cache após atualizar configurações
clearConfigCache();
mercadoPagoService.clearConfigCache();
```

## Segurança

### Dados Sensíveis

- Tokens de acesso são marcados como `sensivel: true`
- Interface administrativa oculta valores sensíveis por padrão
- Logs não expõem valores completos de tokens

### Validação

- Formato das chaves é validado (TEST-* ou APP_USR-*)
- Consistência entre ambiente e tipo de credenciais
- Validação de URLs e formatos de email

### Fallback

- Sistema sempre tenta carregar configurações dinâmicas primeiro
- Em caso de erro, usa variáveis de ambiente como fallback
- Logs detalhados para debugging

## Migração de Variáveis de Ambiente

### Antes (Estático)

```env
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx
VITE_MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx
VITE_MERCADOPAGO_WEBHOOK_URL=https://example.com/webhook
VITE_FRONTEND_URL=https://example.com
```

### Depois (Dinâmico)

1. **Manter variáveis de ambiente** como fallback
2. **Configurar via interface** para uso principal
3. **Benefícios:**
   - Mudança de ambiente sem redeploy
   - Configurações por usuário/empresa
   - Auditoria de mudanças
   - Interface amigável

## Troubleshooting

### Configurações não carregam

1. Verificar se a migração foi aplicada
2. Verificar logs do navegador
3. Verificar permissões do usuário
4. Verificar se as variáveis de ambiente estão configuradas como fallback

### Cache não atualiza

```typescript
// Forçar limpeza do cache
clearConfigCache();
mercadoPagoService.clearConfigCache();
configuracoesService.clearCache();
```

### Validação falha

1. Verificar formato das chaves (TEST-* ou APP_USR-*)
2. Verificar consistência entre ambiente e credenciais
3. Verificar se todas as configurações obrigatórias estão preenchidas

## Próximos Passos

1. **Configurações por empresa:** Permitir configurações específicas por empresa
2. **Auditoria:** Log de mudanças nas configurações
3. **Backup/Restore:** Funcionalidade de backup das configurações
4. **Notificações:** Alertas quando configurações críticas estão faltando
5. **Testes automatizados:** Validação automática das credenciais

## Exemplo Completo

```typescript
import { getMercadoPagoConfig, validateMercadoPagoConfig } from '@/config/mercadopago';
import { configuracoesService } from '@/services/configuracoesService';

async function exemploCompleto() {
  try {
    // 1. Validar configurações
    const validacao = await validateMercadoPagoConfig();
    if (!validacao.isValid) {
      console.error('Configurações inválidas:', validacao.errors);
      return;
    }

    // 2. Obter configurações
    const config = await getMercadoPagoConfig();
    console.log('Configurações carregadas:', {
      environment: config.environment,
      hasCredentials: !!(config.publicKey && config.accessToken)
    });

    // 3. Usar configurações
    const headers = {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json'
    };

    // 4. Fazer requisição para API do Mercado Pago
    // ...

  } catch (error) {
    console.error('Erro ao usar configurações:', error);
  }
}
```