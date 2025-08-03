# 🚀 Guia de Implementação da Monetização

Este guia contém todas as instruções para implementar o sistema de monetização com Mercado Pago no SlotMaster.

## 📋 Status da Implementação

### ✅ Concluído
- [x] Configuração do ambiente (.env.local)
- [x] Tipos TypeScript (src/types/subscription.ts)
- [x] Serviço do Mercado Pago (src/services/mercadopagoService.ts)
- [x] Componentes de interface:
  - [x] PlanoSelector.tsx
  - [x] BillingDashboard.tsx
  - [x] PlanLimitsCard.tsx
  - [x] PlanLimitGuard.tsx
- [x] Hook de limites (src/hooks/usePlanLimits.tsx)
- [x] Configuração do Mercado Pago (src/config/mercadopago.ts)
- [x] Função Edge para webhooks (supabase/functions/mercadopago-webhook/index.ts)
- [x] Migração SQL (supabase/migrations/20250116000000-add-monetization-tables.sql)

### ⏳ Pendente
- [ ] Aplicação da migração no banco de dados
- [ ] Deploy da função Edge
- [ ] Integração com componentes existentes
- [ ] Testes de integração

## 🗄️ Migração do Banco de Dados

### Opção 1: Via Painel do Supabase (Recomendado)

1. Acesse o [painel do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo do arquivo `supabase/migrations/20250116000000-add-monetization-tables.sql`
5. Execute o SQL

### Opção 2: Via CLI (se configurado)

```bash
# Fazer link do projeto (se necessário)
npx supabase link --project-ref nfwdgkjrkmrjsfnbmsrd

# Aplicar migração
npx supabase db push
```

### Opção 3: Via Script Node.js

1. Obtenha a chave `service_role` do Supabase:
   - Painel > Settings > API > service_role key

2. Configure a variável de ambiente:
   ```bash
   set SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
   ```

3. Execute o script:
   ```bash
   node run-monetization-migration.js
   ```

## 🔧 Configuração do Mercado Pago

### 1. Credenciais de Teste (Já Configuradas)

As credenciais de teste já estão no `.env.local`:
- `VITE_MERCADOPAGO_PUBLIC_KEY`: Chave pública para frontend
- `VITE_MERCADOPAGO_ACCESS_TOKEN`: Token de acesso para backend
- `VITE_MERCADOPAGO_WEBHOOK_URL`: URL para receber webhooks

### 2. Configuração de Produção

Quando for para produção, substitua pelas credenciais reais:
1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Obtenha as credenciais de produção
4. Atualize as variáveis de ambiente

## 🚀 Deploy da Função Edge

### 1. Deploy via CLI

```bash
# Deploy da função webhook
npx supabase functions deploy mercadopago-webhook
```

### 2. Deploy via Painel

1. Acesse o painel do Supabase
2. Vá em **Edge Functions**
3. Crie uma nova função chamada `mercadopago-webhook`
4. Copie o código de `supabase/functions/mercadopago-webhook/index.ts`
5. Faça o deploy

### 3. Configurar URL do Webhook

Após o deploy, atualize a URL no `.env.local`:
```
VITE_MERCADOPAGO_WEBHOOK_URL=https://nfwdgkjrkmrjsfnbmsrd.supabase.co/functions/v1/mercadopago-webhook
```

## 🔗 Integração com Componentes Existentes

### 1. Dashboard Principal

Adicione o card de limites ao dashboard:

```tsx
// Em src/pages/Dashboard.tsx ou componente similar
import { PlanLimitsCard } from '@/components/billing/PlanLimitsCard';
import { useAuth } from '@/hooks/useAuth';

function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="grid gap-6">
      {/* Outros componentes */}
      
      <PlanLimitsCard 
        empresaId={user?.empresa_id}
        plano={user?.empresa?.plano || 'basico'}
        onUpgradeClick={() => {
          // Navegar para página de planos
          window.location.href = '/billing/plans';
        }}
      />
    </div>
  );
}
```

### 2. Formulário de Entregadores

Proteja a adição de entregadores:

```tsx
// Em componentes de criação de entregadores
import { PlanLimitGuard } from '@/components/billing/PlanLimitGuard';

function AddEntregadorForm() {
  const { user } = useAuth();
  
  return (
    <PlanLimitGuard
      empresaId={user?.empresa_id}
      plano={user?.empresa?.plano || 'basico'}
      action="add_entregador"
      onUpgradeClick={() => window.location.href = '/billing/plans'}
    >
      <Button onClick={handleAddEntregador}>
        Adicionar Entregador
      </Button>
    </PlanLimitGuard>
  );
}
```

### 3. Formulário de Agendamentos

Proteja a criação de agendamentos:

```tsx
// Em componentes de criação de agendamentos
import { PlanLimitGuard } from '@/components/billing/PlanLimitGuard';

function AddAgendamentoForm() {
  const { user } = useAuth();
  
  return (
    <PlanLimitGuard
      empresaId={user?.empresa_id}
      plano={user?.empresa?.plano || 'basico'}
      action="add_agendamento"
      onUpgradeClick={() => window.location.href = '/billing/plans'}
    >
      <Button onClick={handleCreateAgendamento}>
        Criar Agendamento
      </Button>
    </PlanLimitGuard>
  );
}
```

### 4. Páginas de Billing

Crie as rotas para gerenciamento de planos:

```tsx
// src/pages/billing/PlansPage.tsx
import { PlanoSelector } from '@/components/billing/PlanoSelector';

export function PlansPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Escolha seu Plano</h1>
      <PlanoSelector />
    </div>
  );
}

// src/pages/billing/BillingPage.tsx
import { BillingDashboard } from '@/components/billing/BillingDashboard';

export function BillingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Gerenciar Assinatura</h1>
      <BillingDashboard />
    </div>
  );
}
```

## 🧪 Testes

### 1. Teste de Criação de Assinatura

```javascript
// Teste no console do navegador
import { criarAssinatura } from '@/services/mercadopagoService';

const testeAssinatura = async () => {
  try {
    const resultado = await criarAssinatura({
      empresaId: 'sua_empresa_id',
      plano: 'pro',
      email: 'teste@exemplo.com',
      nome: 'Teste Usuario'
    });
    console.log('Assinatura criada:', resultado);
  } catch (error) {
    console.error('Erro:', error);
  }
};

testeAssinatura();
```

### 2. Teste de Limites

```javascript
// Teste no console do navegador
import { usePlanLimits } from '@/hooks/usePlanLimits';

// Use em um componente React para testar
function TesteLimites() {
  const { data, loading } = usePlanLimits({
    empresaId: 'sua_empresa_id',
    plano: 'basico'
  });
  
  if (loading) return <div>Carregando...</div>;
  
  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );
}
```

## 🔍 Verificação

### 1. Verificar Tabelas no Supabase

No SQL Editor do Supabase, execute:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('assinaturas', 'transacoes', 'mercadopago_webhooks');

-- Verificar estrutura da tabela assinaturas
\d assinaturas;
```

### 2. Verificar Políticas RLS

```sql
-- Verificar políticas de segurança
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('assinaturas', 'transacoes', 'mercadopago_webhooks');
```

### 3. Verificar Função Edge

Teste a função webhook:

```bash
curl -X POST https://nfwdgkjrkmrjsfnbmsrd.supabase.co/functions/v1/mercadopago-webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {"id": "123"}}'
```

## 🚨 Troubleshooting

### Erro: "Cannot find project ref"
```bash
npx supabase link --project-ref nfwdgkjrkmrjsfnbmsrd
```

### Erro: "Failed SASL auth"
- Verifique se o Docker está rodando
- Use o painel web do Supabase para executar SQL

### Erro: "Mercado Pago API"
- Verifique se as credenciais estão corretas
- Confirme se está usando credenciais de teste

### Erro: "RLS Policy"
- Verifique se o usuário tem permissão
- Confirme se as políticas RLS foram criadas

## 📚 Documentação Adicional

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Edge Functions](https://supabase.com/docs/guides/functions)

## 🎯 Próximos Passos

1. **Aplicar migração do banco**
2. **Deploy da função Edge**
3. **Integrar componentes**
4. **Testar fluxo completo**
5. **Configurar webhooks em produção**
6. **Implementar analytics de uso**
7. **Adicionar notificações por email**

---

**⚠️ Importante**: Este sistema está configurado para ambiente de teste. Antes de ir para produção, certifique-se de:
- Usar credenciais de produção do Mercado Pago
- Configurar SSL/HTTPS para webhooks
- Implementar logs de auditoria
- Testar todos os cenários de pagamento