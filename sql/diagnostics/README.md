# 🔍 Scripts de Diagnóstico - MasterWeeb

## 🎯 Propósito

Scripts para diagnosticar problemas no banco de dados e sistema antes de aplicar correções.

---

## 📁 Categorias

### 🏗️ Structure Checks
**Verificação de estrutura de tabelas**

- **Quando usar:** Antes de aplicar correções de estrutura
- **Como interpretar:** Verificar se campos existem conforme esperado
- **Scripts disponíveis:**
  - `check-*-structure.sql` - Verificar estrutura de tabelas específicas
  - `consulta-estrutura-banco.sql` - Visão geral do banco
  - `verify-table-structure.sql` - Verificação completa

### 👥 User Management
**Diagnóstico de problemas de usuários**

- **Quando usar:** Problemas de login ou permissões
- **Como interpretar:** Verificar mapeamentos entre auth.users e entregadores
- **Scripts disponíveis:**
  - `check-existing-users.sql` - Usuários existentes
  - `check-super-admin-credentials.sql` - Credenciais de admin

### 🔍 Investigations
**Investigações profundas de problemas**

- **Quando usar:** Problemas complexos que requerem análise detalhada
- **Como interpretar:** Analisar resultados para identificar causa raiz
- **Scripts disponíveis:**
  - `investigate-rls-blocking-issue.sql` - Problemas de RLS
  - `audit-data-leakage-fix.sql` - Vazamento entre empresas
  - `debug-functions.sql` - Debug de funções SQL

---

## 📋 Fluxo de Diagnóstico

### 1. Identificar Sintoma
- ❌ Erro "Column does not exist" → Structure Checks
- ❌ Erro "Not Acceptable" (406) → Investigations
- ❌ Problemas de login → User Management
- ❌ Dados de outras empresas → Investigations

### 2. Executar Diagnóstico
```sql
-- Exemplo para problema de estrutura
\i sql/diagnostics/structure-checks/check-empresas-structure.sql
```

### 3. Analisar Resultados
- **Campos faltantes** → Aplicar correção de estrutura
- **Políticas bloqueando** → Aplicar correção de RLS
- **Usuários órfãos** → Aplicar correção de user_roles

### 4. Aplicar Correção
Baseado no diagnóstico, aplicar script apropriado em `/sql/fixes/`

---

## 🔧 Padrões de Problemas Identificados

### Campo Inexistente
**Sintoma:** `ERROR: column "campo" does not exist`
**Diagnóstico:** `structure-checks/check-*-structure.sql`
**Correção:** `../fixes/database-structure/`

### RLS Bloqueando Acesso
**Sintoma:** `406 Not Acceptable`
**Diagnóstico:** `investigations/investigate-rls-blocking-issue.sql`
**Correção:** `../fixes/user-management/fix-missing-user-role-*.sql`

### Vazamento de Dados
**Sintoma:** Admin vê dados de outras empresas
**Diagnóstico:** `investigations/audit-data-leakage-fix.sql`
**Correção:** `../migrations/security/`

### Usuário Sem Acesso
**Sintoma:** Login não funciona
**Diagnóstico:** `user-management/check-existing-users.sql`
**Correção:** `../fixes/user-management/`

---

## 📊 Como Interpretar Resultados

### ✅ Resultados Normais
- Tabelas com todas as colunas esperadas
- Usuários mapeados corretamente
- RLS policies permitindo acesso apropriado
- Dados isolados por empresa

### ❌ Resultados Problemáticos
- Colunas faltantes em tabelas
- Usuários órfãos sem mapeamento
- Policies bloqueando acesso legítimo
- Dados vazando entre empresas

---

## 🆘 Troubleshooting Rápido

### Problema: Sistema não carrega
1. `structure-checks/verify-table-structure.sql`
2. Verificar se todas as tabelas existem
3. Aplicar migração se necessário

### Problema: Login falha
1. `user-management/check-existing-users.sql`
2. Verificar mapeamento auth.users ↔ entregadores
3. Aplicar correção de user_roles se necessário

### Problema: Erro 406
1. `investigations/investigate-rls-blocking-issue.sql`
2. Verificar se user_roles está populado
3. Aplicar correção de RLS se necessário

---

**📅 Última atualização:** Julho 2025