# 🚀 Guia Completo de Migração Supabase

## ✅ **VIABILIDADE CONFIRMADA**

**Sim, é totalmente possível migrar este sistema para outra conta Supabase!** 

O sistema foi bem arquitetado com poucos hardcoded references e é altamente portável.

---

## 📋 **Análise de Portabilidade**

### ✅ **Componentes Totalmente Portáveis**

1. **Schema do Banco de Dados**
   - 24 migrações SQL organizadas cronologicamente
   - Todas usam comandos SQL padrão
   - RLS policies usando `auth.uid()` (padrão Supabase)
   - Triggers e funções em PL/pgSQL padrão

2. **Edge Functions**
   - 6 edge functions usando Deno padrão
   - Todas usam variáveis de ambiente (não hardcoded)
   - Configuração via `Deno.env.get()`

3. **Frontend Application**
   - Configuração via environment variables
   - Cliente Supabase configurado dinamicamente
   - Sem referências hardcoded (exceto fallbacks)

### ⚠️ **Pontos que Precisam Ajuste**

#### 1. **Hardcoded Project IDs (12 ocorrências)**
```
Arquivo: supabase/config.toml
project_id = "nfwdgkjrkmrjsfnbmsrd"

Arquivos com URL hardcoded:
- run-monetization-migration.js
- run-migration.js  
- createUser.js
- createAdminUser.js
- FORCE_REBUILD.md
- MONETIZATION_SETUP.md
- CHECK_SUPABASE_FUNCTIONS.md
- src/services/expirySchedulerService.ts (fallback)
- public/cadastro-admin.html
```

#### 2. **Environment Variables Necessárias**
```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://novo-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=novo_anon_key

# Supabase Secrets (via CLI)
SUPABASE_URL=https://novo-projeto.supabase.co
SUPABASE_ANON_KEY=novo_anon_key
SUPABASE_SERVICE_ROLE_KEY=novo_service_key
ABACATEPAY_API_KEY_PROD=sua_chave
ABACATEPAY_API_KEY_DEV=sua_chave_dev
SCHEDULER_TOKEN=token_personalizado
```

---

## 🛠️ **Processo de Migração Completa**

### **Fase 1: Preparação do Novo Projeto**

#### 1.1. Criar Novo Projeto Supabase
```bash
# Via dashboard ou CLI
npx supabase projects create "nome-do-projeto"
```

#### 1.2. Configurar CLI Local
```bash
# Login no Supabase
npx supabase login

# Linkar ao novo projeto
npx supabase link --project-ref NOVO_PROJECT_ID
```

### **Fase 2: Migração do Schema**

#### 2.1. Executar Migrações em Ordem
```bash
# As migrações estão numeradas cronologicamente
npx supabase db push

# Ou manualmente via SQL Editor no dashboard
```

#### 2.2. Verificar Schema
```sql
-- Verificar se todas as tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar RLS policies
SELECT * FROM pg_policies;

-- Verificar functions e triggers
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### **Fase 3: Deploy das Edge Functions**

#### 3.1. Atualizar config.toml
```toml
project_id = "NOVO_PROJECT_ID"

[functions.cadastro-admin-empresa]
verify_jwt = false

[functions.abacatepay-create-pix]
verify_jwt = true

[functions.abacatepay-check-pix]
verify_jwt = true

[functions.abacatepay-list-billings]
verify_jwt = true

[functions.check-expiry-scheduler]
verify_jwt = false

[functions.create-entregador]
verify_jwt = true
```

#### 3.2. Deploy Functions
```bash
# Deploy todas as functions
npx supabase functions deploy

# Ou individualmente
npx supabase functions deploy abacatepay-create-pix
npx supabase functions deploy abacatepay-check-pix
npx supabase functions deploy abacatepay-list-billings
npx supabase functions deploy cadastro-admin-empresa
npx supabase functions deploy check-expiry-scheduler
npx supabase functions deploy create-entregador
```

### **Fase 4: Configurar Environment Variables**

#### 4.1. Secrets do Supabase
```bash
# AbacatePay
npx supabase secrets set ABACATEPAY_API_KEY_PROD=sua_chave_producao
npx supabase secrets set ABACATEPAY_API_KEY_DEV=sua_chave_desenvolvimento

# Scheduler Token
npx supabase secrets set SCHEDULER_TOKEN=seu_token_seguro

# Verificar
npx supabase secrets list
```

#### 4.2. Frontend Environment
```bash
# Atualizar .env
VITE_SUPABASE_URL=https://NOVO_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=nova_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=nova_service_key

# Outras variáveis específicas do projeto
VITE_ABACATEPAY_API_URL=https://api.abacatepay.com/v1
VITE_ABACATEPAY_API_KEY_DEV=sua_chave_dev
VITE_ABACATEPAY_API_KEY_PROD=sua_chave_prod
```

### **Fase 5: Atualizar Hardcoded References**

#### 5.1. Script de Substituição Automática
```bash
#!/bin/bash
# replace-project-id.sh

OLD_PROJECT_ID="nfwdgkjrkmrjsfnbmsrd"
NEW_PROJECT_ID="seu_novo_project_id"

# Substituir em todos os arquivos relevantes
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.md" -o -name "*.html" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -exec sed -i "s/${OLD_PROJECT_ID}/${NEW_PROJECT_ID}/g" {} \;

echo "✅ Project ID atualizado de ${OLD_PROJECT_ID} para ${NEW_PROJECT_ID}"
```

#### 5.2. Arquivos a Serem Atualizados
```bash
# Atualizar manualmente ou via script:
- supabase/config.toml
- run-monetization-migration.js  
- run-migration.js
- createUser.js
- createAdminUser.js
- src/services/expirySchedulerService.ts
- public/cadastro-admin.html
- Arquivos de documentação (*.md)
```

### **Fase 6: Migração de Dados (Opcional)**

#### 6.1. Exportar Dados do Projeto Original
```sql
-- Via SQL Editor ou pg_dump
COPY empresas TO '/tmp/empresas.csv' DELIMITER ',' CSV HEADER;
COPY user_roles TO '/tmp/user_roles.csv' DELIMITER ',' CSV HEADER;
COPY assinaturas TO '/tmp/assinaturas.csv' DELIMITER ',' CSV HEADER;
-- Etc...
```

#### 6.2. Importar no Novo Projeto
```sql
-- Desabilitar RLS temporariamente
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;

-- Importar dados
COPY empresas FROM '/tmp/empresas.csv' DELIMITER ',' CSV HEADER;

-- Reabilitar RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
```

### **Fase 7: Testes e Validação**

#### 7.1. Checklist de Validação
```bash
# ✅ Edge Functions funcionando
curl -X POST https://NOVO_PROJECT_ID.supabase.co/functions/v1/abacatepay-create-pix

# ✅ Authentication funcionando
# Testar login/registro via app

# ✅ RLS Policies funcionando
# Testar acesso aos dados via app

# ✅ Triggers funcionando
# Testar operações que disparam triggers

# ✅ Webhooks funcionando
# Testar integração AbacatePay
```

#### 7.2. Build e Deploy do Frontend
```bash
# Atualizar variáveis de ambiente
# Build da aplicação
npm run build

# Deploy no seu servidor (Hostinger, Vercel, etc.)
```

---

## 🎯 **Resumo da Migração**

### **Complexidade: BAIXA/MÉDIA** ⭐⭐⭐☆☆

### **Tempo Estimado: 2-4 horas**

### **Checklist Final**
- [ ] ✅ Novo projeto Supabase criado
- [ ] ✅ Schema migrado (24 migrations)
- [ ] ✅ 6 Edge functions deployadas
- [ ] ✅ Environment variables configuradas
- [ ] ✅ Hardcoded IDs atualizados
- [ ] ✅ Dados migrados (se necessário)
- [ ] ✅ Aplicação testada
- [ ] ✅ Build e deploy finalizados

### **Principais Vantagens da Arquitetura**
1. **Migrações Organizadas**: SQL scripts numerados e incrementais
2. **Environment Variables**: Poucas dependências hardcoded
3. **Edge Functions Portáveis**: Padrão Deno com env vars
4. **RLS Policies Genéricas**: Usam `auth.uid()` padrão
5. **Frontend Configurável**: Variáveis de ambiente dinâmicas

### **Riscos Mínimos**
- Apenas atualizar IDs e URLs em ~12 arquivos
- Schema 100% compatível entre projetos Supabase
- Políticas de segurança mantidas intactas

---

## 🚨 **Importante**

1. **Backup**: Sempre faça backup do projeto original antes da migração
2. **Teste**: Teste thoroughly em ambiente de desenvolvimento primeiro
3. **Environment**: Mantenha environments separados (dev/prod)
4. **Secrets**: Nunca commite chaves de API no Git

---

**Conclusão: A migração é TOTALMENTE VIÁVEL e relativamente simples!** 🎉

O sistema foi bem projetado para portabilidade, com mínimas dependências hardcoded e arquitetura baseada em padrões Supabase universais.