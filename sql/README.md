# 📚 Scripts SQL - MasterWeeb

## 🎯 Visão Geral

Este diretório contém todos os scripts SQL do projeto MasterWeeb, organizados por categoria e propósito.

---

## 📁 Estrutura

```
/sql/
├── migrations/         # Migrações principais
│   ├── core/          # Migrações centrais
│   ├── security/      # Correções de segurança  
│   └── integrations/  # Integrações externas
├── diagnostics/       # Scripts de diagnóstico
│   ├── structure-checks/   # Verificações de estrutura
│   ├── user-management/    # Diagnósticos de usuários
│   └── investigations/     # Investigações profundas
├── fixes/            # Correções específicas
│   ├── database-structure/ # Correções de estrutura
│   ├── user-management/    # Correções de usuários
│   ├── features/          # Correções de funcionalidades
│   └── configurations/    # Correções de configuração
└── maintenance/      # Scripts de manutenção
    ├── queries/      # Consultas de manutenção
    └── relationships/ # Manutenção de relacionamentos
```

---

## 🚀 Início Rápido

### Para Novo Ambiente:
```bash
# 1. Migração completa
sql/migrations/core/migration-completa-masterweeb.sql

# 2. Segurança crítica
sql/migrations/security/fix-security-critical-regioes-assinaturas-v2.sql

# 3. Configurar usuário
sql/fixes/user-management/fix-missing-user-role-adelson.sql
```

### Para Troubleshooting:
```bash
# 1. Diagnosticar problema
sql/diagnostics/*/[script-relevante].sql

# 2. Aplicar correção
sql/fixes/*/[script-correção].sql
```

---

## 📖 Documentação Completa

**Consulte:** `/docs/sql/README.md` para documentação detalhada

---

## ⚠️ Importante

- ✅ **SEMPRE** fazer backup antes de executar
- 🧪 **TESTAR** em desenvolvimento primeiro  
- 📊 **MONITORAR** resultados após execução
- 📚 **DOCUMENTAR** mudanças aplicadas

---

**📅 Atualizado:** Julho 2025 | **🔗 Projeto:** MasterWeeb