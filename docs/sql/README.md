# 📚 Documentação SQL - MasterWeeb

## 🎯 Índice de Scripts SQL Organizados

Esta documentação centraliza todos os scripts SQL do projeto MasterWeeb, organizados por categoria e propósito.

---

## 📁 Estrutura de Diretórios

```
/sql/
├── migrations/         # Migrações principais do banco
├── diagnostics/        # Scripts de diagnóstico
├── fixes/             # Correções específicas
└── maintenance/       # Scripts de manutenção
```

---

## 🚀 MIGRAÇÕES (/sql/migrations/)

### 🏗️ Core (Migrações Principais)
- **`migration-completa-masterweeb.sql`** - Migração completa do banco de dados
  - **Uso:** Primeira execução para criar toda estrutura
  - **Conteúdo:** 20+ tabelas, índices, constraints, dados de exemplo
  - **Status:** ✅ Obrigatório para novo ambiente

### 🔒 Security (Migrações de Segurança)
- **`fix-security-critical-regioes-assinaturas-v2.sql`** - Correção crítica de isolamento
  - **Uso:** Adicionar empresa_id em tabelas críticas
  - **Problema resolvido:** Vazamento de dados entre empresas
  - **Status:** ✅ Crítico para produção

- **`fix-security-critical-regioes-assinaturas.sql`** - Primeira versão da correção
  - **Uso:** Histórico, usar v2 ao invés desta
  - **Status:** 📋 Depreciado

- **`fix-security-regioes-final.sql`** - Correção final de isolamento
  - **Uso:** Completar isolamento entre empresas
  - **Status:** ✅ Recomendado após v2

- **`remove-conflicting-policies.sql`** - Remoção de policies conflitantes
  - **Uso:** Remover RLS policies que permitiam acesso global
  - **Status:** ✅ Crítico para segurança

### 🔌 Integrations (Migrações de Integração)
- **`migration-abacatepay.sql`** - Integração com AbacatePay
  - **Uso:** Configurar pagamentos PIX
  - **Status:** ✅ Necessário para pagamentos

- **`fix-missing-expiry-functions.sql`** - Funções de expiração
  - **Uso:** Corrigir funções faltantes do sistema
  - **Status:** ✅ Manutenção

---

## 🔍 DIAGNÓSTICOS (/sql/diagnostics/)

### 🏗️ Structure Checks (Verificação de Estrutura)
- **`check-assinaturas-structure.sql`** - Verificar estrutura da tabela assinaturas
- **`check-empresas-structure.sql`** - Verificar estrutura da tabela empresas
- **`check-entregadores-structure.sql`** - Verificar estrutura da tabela entregadores
- **`check-regioes-structure.sql`** - Verificar estrutura da tabela regioes
- **`check-turnos-structure.sql`** - Verificar estrutura da tabela turnos
- **`check-user-roles-structure.sql`** - Verificar estrutura da tabela user_roles
- **`consulta-estrutura-banco.sql`** - Consulta geral de estrutura do banco
- **`verify-table-structure.sql`** - Verificação completa de todas as tabelas

**Uso geral:** Diagnosticar problemas de estrutura antes de aplicar correções

### 👥 User Management (Gerenciamento de Usuários)
- **`check-existing-users.sql`** - Verificar usuários existentes no sistema
- **`check-super-admin-credentials.sql`** - Verificar credenciais de super admin

**Uso geral:** Diagnosticar problemas de autenticação e permissões

### 🔍 Investigations (Investigações)
- **`investigate-rls-blocking-issue.sql`** - Investigar problemas de RLS
  - **Uso:** Diagnosticar erro 406 "Not Acceptable"
  - **Problema:** RLS policies bloqueando acesso legítimo

- **`audit-data-leakage-fix.sql`** - Auditoria de vazamento de dados
  - **Uso:** Verificar isolamento entre empresas
  - **Status:** ✅ Crítico para segurança

- **`debug-functions.sql`** - Debug de funções do sistema
  - **Uso:** Diagnosticar problemas em funções SQL

---

## 🔧 CORREÇÕES (/sql/fixes/)

### 🏗️ Database Structure (Estrutura do Banco)
- **`fix-empresa-status.sql`** - Corrigir campo status → ativa
- **`fix-database-corrected.sql`** - Correções gerais do banco
- **`fix-database-final.sql`** - Correções finais
- **`fix-database-no-inserts.sql`** - Correções sem inserções
- **`fix-database-relationships.sql`** - Correções de relacionamentos
- **`final-fix-entregadores-corrected.sql`** - Correção final na tabela entregadores
- **`final-fix-entregadores.sql`** - Primeira versão da correção

### 👥 User Management (Gerenciamento de Usuários)
- **`fix-missing-user-role-adelson.sql`** - Criar registro user_roles faltante
  - **Problema:** Usuário sem acesso devido a user_roles vazio
  - **Status:** ✅ Aplicado com sucesso

- **`fix-missing-user-roles.sql`** - Correção geral de user_roles
- **`reset-super-admin-password.sql`** - Reset de senha do super admin
- **`reset-super-admin-simple.sql`** - Versão simplificada do reset

### ⚙️ Features (Funcionalidades)
- **`add-categoria-field.sql`** - Adicionar campo categoria
- **`create-categoria-horarios-estrelas.sql`** - Sistema de estrelas e horários
- **`activate-empresa.sql`** - Ativação de empresa

### ⚙️ Configurations (Configurações)
- **`fix-configuracoes-tables.sql`** - Correções nas tabelas de configuração
- **`fix-rls-and-functions.sql`** - Correções em RLS e funções

---

## 🛠️ MANUTENÇÃO (/sql/maintenance/)

### 📊 Queries (Consultas)
- **`check-agendas-agendamentos.sql`** - Verificar relacionamento agendas/agendamentos
- **`check-only-agendamentos.sql`** - Verificar apenas agendamentos
- **`fix-query-structure.sql`** - Corrigir estrutura de queries
- **`check-columns.sql`** - Verificar colunas das tabelas

### 🔗 Relationships (Relacionamentos)
- Scripts para manutenção de relacionamentos entre tabelas

---

## 📋 ORDEM DE EXECUÇÃO RECOMENDADA

### 🚀 Para Novo Ambiente (Migração Completa):

1. **`/sql/migrations/core/migration-completa-masterweeb.sql`**
2. **`/sql/migrations/security/fix-security-critical-regioes-assinaturas-v2.sql`**
3. **`/sql/migrations/security/fix-security-regioes-final.sql`**
4. **`/sql/migrations/security/remove-conflicting-policies.sql`**
5. **`/sql/migrations/integrations/migration-abacatepay.sql`**
6. **`/sql/fixes/user-management/fix-missing-user-role-adelson.sql`**

### 🔧 Para Troubleshooting:

1. **Diagnóstico:** Executar scripts de `/sql/diagnostics/`
2. **Identificação:** Analisar resultados e identificar problema
3. **Correção:** Aplicar scripts específicos de `/sql/fixes/`
4. **Validação:** Re-executar diagnósticos para confirmar correção

---

## ⚠️ CUIDADOS IMPORTANTES

### 🛡️ Segurança
- **SEMPRE** fazer backup antes de executar scripts de migração
- **TESTAR** scripts em ambiente de desenvolvimento primeiro
- **VERIFICAR** impacto em dados existentes

### 📊 Monitoramento
- **EXECUTAR** scripts de diagnóstico regularmente
- **MONITORAR** logs de erro após aplicar correções
- **VALIDAR** isolamento de dados entre empresas

### 🔄 Versionamento
- **DOCUMENTAR** todas as mudanças aplicadas
- **MANTER** histórico de execução de scripts
- **TESTAR** compatibilidade com versões anteriores

---

## 🆘 TROUBLESHOOTING RÁPIDO

### ❌ Erro: "Column does not exist"
**Diagnóstico:** `/sql/diagnostics/structure-checks/`
**Correção:** `/sql/fixes/database-structure/`

### ❌ Erro: 406 "Not Acceptable"
**Diagnóstico:** `/sql/diagnostics/investigations/investigate-rls-blocking-issue.sql`
**Correção:** `/sql/fixes/user-management/fix-missing-user-role-*.sql`

### ❌ Vazamento de dados entre empresas
**Diagnóstico:** `/sql/diagnostics/investigations/audit-data-leakage-fix.sql`
**Correção:** `/sql/migrations/security/` (todos os scripts)

### ❌ Problemas de autenticação
**Diagnóstico:** `/sql/diagnostics/user-management/`
**Correção:** `/sql/fixes/user-management/`

---

## 📞 SUPORTE

**Documentação completa:** `DOCUMENTACAO_COMPLETA_MIGRACAO_MASTERWEEB.md`
**Resumo de scripts:** `RESUMO_SCRIPTS_CRIADOS.md`
**Instruções do projeto:** `CLAUDE.md`

---

**📅 Última atualização:** Julho 2025  
**👨‍💻 Sistema:** MasterWeeb  
**📊 Status:** Produção ✅