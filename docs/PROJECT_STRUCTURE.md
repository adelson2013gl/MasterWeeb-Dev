# 📁 Estrutura Organizacional do Projeto

Este documento descreve a nova estrutura organizacional do projeto SlotMaster-21.

## 🎯 Objetivos da Reorganização

- ✅ Seguir padrões da indústria
- ✅ Facilitar navegação e manutenção
- ✅ Separar concerns (documentação, código, scripts)
- ✅ Melhorar experiência do desenvolvedor

## 📂 Estrutura de Pastas

### `/docs/` - Documentação Completa
```
docs/
├── README.md                    # Índice geral da documentação
├── PROJECT_STRUCTURE.md        # Este arquivo
├── architecture/               # Documentação de arquitetura
│   ├── arquitetura-modular.md
│   ├── arquitetura.md
│   └── AGENDAMENTO_REFACTOR.md
├── guides/                     # Guias e tutoriais
│   ├── ORGANIZACAO_ARQUIVOS_CONCLUIDA.md
│   ├── RESUMO_SCRIPTS_CRIADOS.md
│   ├── SLOTMASTER_FIXES_APPLIED.md
│   └── SLOTMASTER_RESTORATION_SUMMARY.md
├── migration/                  # Documentação de migração
│   ├── DOCUMENTACAO_COMPLETA_MIGRACAO_MASTERWEEB.md
│   └── MIGRATION_GUIDE_MASTERWEEB.md
├── setup/                      # Guias de configuração
│   ├── deploy-edge-function-instructions.md
│   ├── IUGU_INTEGRATION_GUIDE.md
│   └── MONETIZATION_SETUP.md
├── troubleshooting/           # Solução de problemas
│   ├── CHECK_SUPABASE_FUNCTIONS.md
│   ├── DATABASE_IUGU_CHANGES.md
│   ├── FORCE_REBUILD.md
│   ├── SUBSCRIPTION_FIXES.md
│   └── SUPABASE_MIGRATION_GUIDE.md
└── sql/                       # Documentação SQL específica
    └── README.md
```

### `/src/` - Código Fonte
```
src/
├── components/                # Componentes React organizados por funcionalidade
├── hooks/                    # Custom hooks
├── services/                 # Lógica de negócio e integrações
├── types/                    # Definições TypeScript
├── utils/                    # Utilitários e helpers
├── lib/                      # Bibliotecas e configurações
├── pages/                    # Páginas da aplicação
└── contexts/                 # Context providers do React
```

### `/sql/` - Scripts SQL Organizados
```
sql/
├── README.md                 # Documentação dos scripts SQL
├── diagnostics/              # Scripts de diagnóstico
│   ├── temporary/           # Scripts temporários de diagnóstico
│   │   ├── diagnostico_agendamentos.sql
│   │   ├── fix-missing-functions.sql
│   │   ├── temp_schema_check.sql
│   │   ├── verificar_estrutura_banco.sql
│   │   └── verificar_triggers_completo.sql
│   ├── investigations/      # Investigações específicas
│   └── structure-checks/    # Verificações de estrutura
├── fixes/                   # Scripts de correção
├── maintenance/             # Scripts de manutenção
└── migrations/              # Scripts de migração
```

### `/scripts/` - Scripts JavaScript/Node.js
```
scripts/
├── README.md                # Documentação dos scripts
├── migrations/              # Scripts de migração
├── testing/                 # Scripts de teste
└── user-management/         # Scripts de gestão de usuários
```

### `/temp/` - Arquivos Temporários
```
temp/
└── api/                     # Pasta api movida temporariamente
    ├── test-env.js
    └── webhook.js
```

## 🗂️ Arquivos na Raiz (Mantidos)

Arquivos essenciais que permanecem na raiz:
- `README.md` - Documentação principal do projeto
- `CLAUDE.md` - Instruções para o Claude Code
- `package.json` - Configuração do Node.js
- `tsconfig.json` - Configuração TypeScript
- `vite.config.ts` - Configuração do Vite
- `tailwind.config.ts` - Configuração do Tailwind
- `eslint.config.js` - Configuração do ESLint
- `vercel.json` - Configuração de deploy

## 🧹 Arquivos Removidos/Organizados

### Documentação Markdown (Movida para `/docs/`)
- ✅ `AGENDAMENTO_REFACTOR.md` → `docs/architecture/`
- ✅ `MIGRATION_GUIDE_MASTERWEEB.md` → `docs/migration/`
- ✅ `IUGU_INTEGRATION_GUIDE.md` → `docs/setup/`
- ✅ `SLOTMASTER_FIXES_APPLIED.md` → `docs/guides/`
- ✅ E mais 15+ arquivos organizados

### Scripts SQL (Movidos para `/sql/diagnostics/temporary/`)
- ✅ `diagnostico_agendamentos.sql`
- ✅ `verificar_estrutura_banco.sql`
- ✅ `verificar_triggers_completo.sql`
- ✅ `temp_schema_check.sql`
- ✅ `fix-missing-functions.sql`

### Arquivos Temporários (Removidos)
- ✅ `vite.config.ts.timestamp-*` (7 arquivos)

### Arquivos Movidos para `/temp/`
- ✅ `api/` → `temp/api/`

## 📋 Benefícios da Nova Estrutura

### ✅ Para Desenvolvedores
- **Navegação mais fácil**: Documentação organizada por categoria
- **Menos poluição visual**: Raiz do projeto limpa
- **Padrões da indústria**: Estrutura familiar para qualquer dev

### ✅ Para Manutenção
- **Scripts organizados**: SQL e JS em pastas dedicadas
- **Versionamento melhor**: Arquivos relacionados agrupados
- **Backup seletivo**: Fácil identificar o que fazer backup

### ✅ Para CI/CD
- **Builds mais rápidos**: Menos arquivos na raiz para analisar
- **Deploys seletivos**: Possível ignorar `/docs/` e `/temp/`
- **Cache otimizado**: Estrutura previsível para cache de dependências

## 🔄 Próximos Passos Recomendados

1. **Atualizar .gitignore** para incluir `/temp/`
2. **Revisar links de documentação** nos READMEs
3. **Atualizar CI/CD** se necessário
4. **Considerar mover** `/mercadopagoPix-main/` para `/services/` ou `/integrations/`

## 📝 Convenções Adotadas

- **Pastas em inglês**: Para compatibilidade internacional
- **Nomes descritivos**: Fácil entender o conteúdo
- **Separação clara**: Código vs Documentação vs Scripts vs Temporários
- **README em cada pasta**: Documentação local quando necessário

---

**Data da Reorganização**: 2025-07-21  
**Responsável**: Claude Code Assistant  
**Status**: ✅ Concluída