# 🛠️ Scripts JavaScript - MasterWeeb

## 🎯 Visão Geral

Este diretório contém scripts JavaScript para automação, migração e utilitários do projeto MasterWeeb.

---

## 📁 Estrutura

```
/scripts/
├── migrations/         # Scripts de migração
│   ├── core/          # Migrações centrais
│   ├── integrations/  # Integrações (Iugu, AbacatePay, etc)
│   └── utilities/     # Utilitários de migração
├── user-management/   # Gerenciamento de usuários
└── testing/          # Scripts de teste
```

---

## 🚀 Scripts Disponíveis

### 📦 Migrations - Core
- **`run-migration.js`** - Executar migração principal
- **`simple-migration.js`** - Migração simplificada
- **`execute-migration-browser.js`** - Migração via browser

### 🔌 Migrations - Integrations
- **`run-iugu-migration.js`** - Migração Iugu
- **`run-monetization-migration.js`** - Migração de monetização
- **`run-webhook-migration.js`** - Migração de webhooks

### ⚙️ Migrations - Utilities
- **`execute-sql-via-edge-function.js`** - Executar SQL via Edge Function

### 👥 User Management
- **`bootstrap-super-admin.js`** - Criar super admin inicial
- **`createAdminUser.js`** - Criar usuário administrador
- **`createUser.js`** - Criar usuário comum

### 🧪 Testing
- **`test-webhook.js`** - Testar webhooks

---

## 📋 Como Usar

### Exemplo - Criar Super Admin:
```bash
node scripts/user-management/bootstrap-super-admin.js
```

### Exemplo - Executar Migração:
```bash
node scripts/migrations/core/run-migration.js
```

### Exemplo - Testar Webhook:
```bash
node scripts/testing/test-webhook.js
```

---

## ⚠️ Pré-requisitos

- Node.js instalado
- Variáveis de ambiente configuradas
- Acesso ao Supabase configurado
- Dependências do projeto instaladas (`npm install`)

---

## 🔐 Configuração

Certifique-se de que as seguintes variáveis estejam configuradas:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📞 Suporte

**Documentação SQL:** `/docs/sql/README.md`
**Documentação completa:** `DOCUMENTACAO_COMPLETA_MIGRACAO_MASTERWEEB.md`

---

**📅 Atualizado:** Julho 2025 | **🔗 Projeto:** MasterWeeb