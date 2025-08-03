# 🗄️ Mudanças no Banco de Dados - Integração Iugu

## 📋 Resumo das Alterações

A integração com a **Iugu** requer **mudanças específicas** no banco de dados para suportar:
- ✅ Pagamentos recorrentes via Iugu
- ✅ Sincronização de clientes, planos e faturas
- ✅ Webhooks da Iugu
- ✅ Configurações dinâmicas
- ✅ Coexistência com Mercado Pago

---

## 🔧 Como Executar as Mudanças

### ⚡ **Opção 1: Script Automático** (Recomendado)

```bash
# Via npm
npm run migrate:iugu

# Ou diretamente
node run-iugu-migration.js
```

### 🖥️ **Opção 2: Manual no Dashboard Supabase**

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo: `supabase/migrations/20250126000000-add-iugu-integration.sql`

---

## 📊 Mudanças Detalhadas

### 1. **🔧 Tabela `assinaturas` - MODIFICADA**

**Colunas adicionadas:**
```sql
ALTER TABLE assinaturas ADD COLUMN:
- iugu_subscription_id VARCHAR(255)  -- ID da assinatura na Iugu
- iugu_customer_id VARCHAR(255)      -- ID do cliente na Iugu  
- iugu_plan_id VARCHAR(255)          -- ID do plano na Iugu
- gateway VARCHAR(20) DEFAULT 'mercadopago' -- Gateway usado (mercadopago/iugu)
- ambiente VARCHAR(20) DEFAULT 'production' -- Ambiente (sandbox/production)
```

**Benefícios:**
- ✅ Suporte a **múltiplos gateways** na mesma tabela
- ✅ **Migração automática** de dados existentes
- ✅ **Compatibilidade total** com Mercado Pago

---

### 2. **📋 Tabela `configuracoes_sistema` - EXPANDIDA**

**Configurações adicionadas (12 novas):**
```sql
-- API Credentials
iugu_api_key_test/prod      -- Chaves da API Iugu
iugu_account_id_test/prod   -- IDs da conta Iugu
iugu_environment            -- Ambiente ativo

-- Webhooks  
iugu_webhook_url            -- URL do webhook
iugu_webhook_token          -- Token de segurança

-- Funcionalidades
iugu_enabled                -- Integração habilitada
iugu_auto_create_customers  -- Criar clientes automaticamente
iugu_auto_suspend_overdue   -- Suspender por atraso
iugu_overdue_days_limit     -- Dias para suspensão

-- Outros
iugu_default_currency       -- Moeda padrão
iugu_test_mode             -- Modo de teste
iugu_notification_emails    -- E-mails para notificações
```

---

### 3. **🆕 Tabela `iugu_webhooks` - NOVA**

```sql
CREATE TABLE iugu_webhooks (
    id UUID PRIMARY KEY,
    evento_tipo VARCHAR(100) NOT NULL,
    recurso_id VARCHAR(255),
    iugu_id VARCHAR(255),
    payload JSONB NOT NULL,
    processado BOOLEAN DEFAULT FALSE,
    data_recebimento TIMESTAMP,
    data_processamento TIMESTAMP,
    erro TEXT,
    tentativas INTEGER DEFAULT 0
);
```

**Finalidade:**
- 📝 Log de todos os webhooks recebidos da Iugu
- 🔄 Controle de processamento e reprocessamento
- 🐛 Debugging e auditoria

---

### 4. **👥 Tabela `iugu_customers` - NOVA**

```sql
CREATE TABLE iugu_customers (
    id UUID PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id),
    iugu_customer_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20),
    telefone VARCHAR(20),
    notas TEXT,
    variaveis_customizadas JSONB,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Finalidade:**
- 🔄 Sincronização automática de clientes entre SlotMaster e Iugu
- 📊 Cache local para performance
- 🎯 Dados customizados por empresa

---

### 5. **💰 Tabela `iugu_plans` - NOVA**

```sql
CREATE TABLE iugu_plans (
    id UUID PRIMARY KEY,
    iugu_plan_id VARCHAR(255) UNIQUE,
    identificador VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    intervalo VARCHAR(20) CHECK (intervalo IN ('weekly', 'monthly', 'annually')),
    tipo_intervalo INTEGER DEFAULT 1,
    valor_centavos INTEGER NOT NULL,
    moeda VARCHAR(10) DEFAULT 'BRL',
    recursos TEXT[],
    metadata JSONB,
    ativo BOOLEAN DEFAULT TRUE,
    sincronizado_em TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Finalidade:**
- 📋 Sincronização de planos entre SlotMaster e Iugu
- 🎛️ Cache local para interface administrativa
- 🔄 Controle de sincronização

---

### 6. **🧾 Tabela `iugu_invoices` - NOVA**

```sql
CREATE TABLE iugu_invoices (
    id UUID PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id),
    assinatura_id UUID REFERENCES assinaturas(id),
    iugu_invoice_id VARCHAR(255) UNIQUE,
    iugu_subscription_id VARCHAR(255),
    iugu_customer_id VARCHAR(255),
    status VARCHAR(50) CHECK (status IN ('pending', 'paid', 'canceled', 'expired', 'refunded')),
    valor_centavos INTEGER NOT NULL,
    valor_pago_centavos INTEGER DEFAULT 0,
    moeda VARCHAR(10) DEFAULT 'BRL',
    data_vencimento TIMESTAMP,
    data_pagamento TIMESTAMP,
    url_fatura VARCHAR(500),
    url_pdf VARCHAR(500),
    metodo_pagamento VARCHAR(50),
    pix_qrcode TEXT,
    pix_qrcode_text TEXT,
    boleto_linha_digitavel VARCHAR(500),
    boleto_codigo_barras VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Finalidade:**
- 🧾 Sincronização completa de faturas da Iugu
- 💳 Suporte a PIX, Boleto e Cartão
- 📊 Métricas e dashboard

---

## 🛡️ Segurança (RLS - Row Level Security)

### **Políticas Aplicadas:**

```sql
-- iugu_customers: Acesso por empresa
"Usuarios podem ver clientes de suas empresas"

-- iugu_invoices: Acesso por empresa  
"Usuarios podem ver faturas de suas empresas"

-- iugu_plans: Acesso público (leitura)
"Todos podem ver planos Iugu"

-- iugu_webhooks: Apenas super admins
"Apenas super admins podem acessar webhooks Iugu"
```

### **Benefícios de Segurança:**
- 🔒 **Isolamento por empresa** - Cada empresa vê apenas seus dados
- 👨‍💼 **Controle de acesso** - Super admins têm acesso total
- 🛡️ **Proteção automática** - RLS aplicado em todas as consultas

---

## 📈 Índices de Performance

### **Índices Criados:**

```sql
-- Tabela assinaturas (novos)
idx_assinaturas_iugu_subscription_id
idx_assinaturas_iugu_customer_id  
idx_assinaturas_gateway

-- Tabela iugu_webhooks
idx_iugu_webhooks_evento_tipo
idx_iugu_webhooks_processado
idx_iugu_webhooks_recurso_id

-- Tabela iugu_customers
idx_iugu_customers_empresa_id
idx_iugu_customers_iugu_id
idx_iugu_customers_email

-- Tabela iugu_plans
idx_iugu_plans_iugu_id
idx_iugu_plans_identificador

-- Tabela iugu_invoices  
idx_iugu_invoices_empresa_id
idx_iugu_invoices_status
idx_iugu_invoices_data_vencimento
```

### **Benefícios:**
- ⚡ **Consultas rápidas** por ID da Iugu
- 🔍 **Filtros eficientes** por status e data
- 📊 **Dashboard responsivo** mesmo com muitos dados

---

## 🔄 Compatibilidade e Migração

### **✅ Compatibilidade Total:**
- **Mercado Pago** continua funcionando normalmente
- **Dados existentes** permanecem intactos
- **APIs atuais** não são afetadas
- **Interface atual** continua operacional

### **🛠️ Migração Automática:**
- Assinaturas existentes recebem `gateway = 'mercadopago'`
- Configurações são adicionadas com valores padrão
- Políticas de segurança são aplicadas automaticamente
- Triggers de `updated_at` são configurados

---

## 📋 Checklist de Verificação

Após executar a migração, verifique:

- [ ] ✅ Tabela `assinaturas` tem as novas colunas
- [ ] ✅ Tabelas `iugu_*` foram criadas
- [ ] ✅ Configurações da Iugu estão na `configuracoes_sistema`
- [ ] ✅ Índices foram criados corretamente
- [ ] ✅ Políticas RLS estão ativas
- [ ] ✅ Triggers `updated_at` funcionam

### **Comandos de Verificação:**

```sql
-- Verificar colunas da tabela assinaturas
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'assinaturas' AND column_name LIKE 'iugu%';

-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'iugu_%';

-- Verificar configurações
SELECT COUNT(*) FROM configuracoes_sistema 
WHERE categoria = 'iugu';
```

---

## 🚨 Troubleshooting

### **Problemas Comuns:**

1. **❌ Erro: "tabela assinaturas não existe"**
   - **Solução:** Execute primeiro as migrações básicas de monetização

2. **❌ Erro: "tabela configuracoes_sistema não existe"**  
   - **Solução:** Execute a migração `20250122000000-add-system-configurations.sql`

3. **❌ Erro de permissão**
   - **Solução:** Use credenciais de administrador do Supabase

4. **⚠️ Função exec_sql não encontrada**
   - **Solução:** Execute manualmente no SQL Editor do dashboard

---

## 🎯 Próximos Passos

Após a migração do banco:

1. **Configure** as credenciais da Iugu na interface
2. **Teste** a conexão com a API
3. **Sincronize** os planos existentes  
4. **Configure** os webhooks
5. **Monitore** o dashboard de métricas

---

## 📞 Suporte

- **Documentação Iugu:** https://docs.iugu.com
- **Dashboard Supabase:** https://supabase.com/dashboard
- **Logs de Error:** Verificar tabela `iugu_webhooks` com `erro IS NOT NULL`

---

**✅ Banco de dados pronto para a integração Iugu!** 