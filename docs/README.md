
# 📚 Documentação do Projeto SlotMaster-21

Esta pasta contém toda a documentação técnica do projeto, **reorganizada e organizada por categorias**.

> 📁 **Nova Estrutura Organizacional**: Confira [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) para detalhes da reorganização.

## 📂 Navegação Rápida por Categoria

### 🏗️ **Arquitetura e Desenvolvimento**
- [`arquitetura-modular.md`](arquitetura-modular.md) - Arquitetura modular do sistema
- [`arquitetura.md`](arquitetura.md) - Visão geral da arquitetura
- [`architecture/AGENDAMENTO_REFACTOR.md`](architecture/AGENDAMENTO_REFACTOR.md) - Refatoração do sistema de agendamentos

### 📖 **Guias e Tutoriais**
- [`guides/ORGANIZACAO_ARQUIVOS_CONCLUIDA.md`](guides/ORGANIZACAO_ARQUIVOS_CONCLUIDA.md) - Organização de arquivos
- [`guides/RESUMO_SCRIPTS_CRIADOS.md`](guides/RESUMO_SCRIPTS_CRIADOS.md) - Resumo dos scripts criados
- [`guides/SLOTMASTER_FIXES_APPLIED.md`](guides/SLOTMASTER_FIXES_APPLIED.md) - Correções aplicadas
- [`guides/SLOTMASTER_RESTORATION_SUMMARY.md`](guides/SLOTMASTER_RESTORATION_SUMMARY.md) - Resumo da restauração

### 🔄 **Migração e Setup**
- [`migration/MIGRATION_GUIDE_MASTERWEEB.md`](migration/MIGRATION_GUIDE_MASTERWEEB.md) - Guia de migração
- [`migration/DOCUMENTACAO_COMPLETA_MIGRACAO_MASTERWEEB.md`](migration/DOCUMENTACAO_COMPLETA_MIGRACAO_MASTERWEEB.md) - Documentação completa
- [`setup/IUGU_INTEGRATION_GUIDE.md`](setup/IUGU_INTEGRATION_GUIDE.md) - Integração com Iugu
- [`setup/MONETIZATION_SETUP.md`](setup/MONETIZATION_SETUP.md) - Configuração de monetização
- [`setup/deploy-edge-function-instructions.md`](setup/deploy-edge-function-instructions.md) - Deploy de edge functions

### 🔧 **Troubleshooting e Suporte**
- [`troubleshooting/CHECK_SUPABASE_FUNCTIONS.md`](troubleshooting/CHECK_SUPABASE_FUNCTIONS.md) - Verificação de funções
- [`troubleshooting/DATABASE_IUGU_CHANGES.md`](troubleshooting/DATABASE_IUGU_CHANGES.md) - Mudanças no banco Iugu
- [`troubleshooting/SUBSCRIPTION_FIXES.md`](troubleshooting/SUBSCRIPTION_FIXES.md) - Correções de assinatura
- [`troubleshooting/SUPABASE_MIGRATION_GUIDE.md`](troubleshooting/SUPABASE_MIGRATION_GUIDE.md) - Guia de migração Supabase

### 🗄️ **SQL e Banco de Dados**
- [`sql/README.md`](sql/README.md) - Documentação específica de SQL

---

## 📋 Documentação Técnica Principal

## 📚 Documentação Disponível

### Arquitetura e Desenvolvimento
- [Arquitetura do Sistema](./arquitetura.md) - Visão geral da arquitetura React/Supabase
- [Componentes](./componentes.md) - Documentação dos componentes React
- [Hooks Customizados](./hooks.md) - Hooks personalizados do projeto
- [Changelog](./changelog.md) - Histórico de mudanças e implementações

### Funcionalidades Específicas
- [Gestão de Administradores](./gestao-administradores.md) - Sistema de administração
- [Configuração do Sistema](./configuracao-sistema.md) - Configurações por empresa
- [Melhorias Admin](./melhorias-admin-sistema.md) - Últimas melhorias implementadas
- [PWA e Mobile](./pwa-mobile.md) - Funcionalidades Progressive Web App e mobile
- [Sistema de Sincronização](./sincronizacao.md) - Funcionamento offline e sincronização
- [Atualizações Recentes](./atualizacoes-recentes.md) - Últimas implementações e melhorias

## 🎯 Visão Geral

Este é um sistema de agendamento para entregadores desenvolvido com React, TypeScript, Tailwind CSS e Supabase. O sistema permite que administradores criem agendas de trabalho e entregadores se inscrevam para turnos disponíveis.

### Principais Funcionalidades

#### ✅ Funcionalidades Básicas
- **Autenticação**: Login/cadastro com Supabase Auth
- **Dashboard Administrativo**: Gestão de cidades, regiões, turnos e agendas
- **Dashboard do Entregador**: Visualização e agendamento de turnos
- **Sistema de Vagas**: Controle automático de vagas disponíveis e ocupadas
- **Histórico**: Acompanhamento de agendamentos ativos, cancelados e concluídos

#### 🚀 Funcionalidades Avançadas (Implementadas)
- **Validação Temporal**: Sistema que impede agendamentos em turnos já iniciados
- **Horários Específicos por Estrelas**: Liberação de horários baseada no nível de experiência
- **Sistema de Reservas**: Lista de espera quando agendas estão lotadas
- **Detecção de Inconsistências**: Monitoramento automático de discrepâncias de vagas
- **Sistema de Sincronização**: Funcionalidade offline com sincronização automática
- **Logs Estruturados**: Sistema completo de debugging e monitoramento
- **Validação de Conflitos**: Prevenção de agendamentos sobrepostos
- **Sistema de Retry**: Recuperação automática de falhas de rede

#### 🔧 Sistemas de Suporte
- **Enum Safety**: Validação segura de enums do banco de dados
- **Performance Monitoring**: Métricas de performance e tempos de resposta
- **Error Boundaries**: Tratamento robusto de erros na interface
- **Mobile Responsivo**: Interface adaptada para dispositivos móveis
- **Notificações**: Sistema de feedback visual com Sonner
- **Filtros Avançados**: Múltiplas opções de filtragem para admin
- **Export de Dados**: Funcionalidade de exportação em Excel

### Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Estado**: React Query (@tanstack/react-query)
- **Roteamento**: React Router DOM
- **Notificações**: Sonner
- **Logs**: Sistema personalizado com categorização
- **Offline**: IndexedDB com sincronização automática
- **Export**: XLSX para exportação de dados

### Arquitetura Modular

O sistema foi refatorado em uma arquitetura modular com separação clara de responsabilidades:

#### 📁 Estrutura de Serviços
```
src/services/
├── agendamentoService.ts    # Operações de agendamento
├── agendasService.ts        # Busca e processamento de agendas
└── syncService.ts           # Sincronização offline
```

#### 🔧 Utilitários Especializados
```
src/utils/
├── agendamentoValidation.ts # Validações de agendamento
├── agendaValidation.ts      # Validações de agenda
├── agendaProcessor.ts       # Processamento de agendas
└── enumSafety.ts           # Validação segura de enums
```

#### 📊 Tipos TypeScript
```
src/types/
├── agendaDisponivel.ts     # Tipos para agendas disponíveis
├── agendamento.ts          # Tipos para agendamentos
└── database.ts             # Tipos do banco de dados
```

## 🔐 Sistema de Validações

### Validação Temporal (FASE 1)
Sistema implementado que previne agendamentos em turnos já iniciados:
- Verificação automática de data/hora atual vs. horário de início
- Bloqueio visual e funcional de turnos indisponíveis
- Logs detalhados para debugging

### Validação de Horários Específicos
Sistema de liberação de horários baseado em estrelas:
- 5 estrelas: 08:00
- 4 estrelas: 08:45 (+45min)
- 3 estrelas: 09:20 (+1h20min)
- 2 estrelas: 10:00 (+2h)
- 1 estrela: 10:30 (+2h30min)

### Validação de Conflitos
Prevenção de agendamentos sobrepostos:
- Verificação de horários conflitantes na mesma data
- Validação cross-turnos e cross-regiões
- Mensagens específicas de erro

## 📊 Sistema de Monitoramento

### Logs Categorizados
- `CONFIGURACOES_SISTEMA`: Carregamento de configurações
- `DEBUG_ADELSON`: Logs específicos para sistema de horários
- `AGENDAS_FILTRO`: Filtros e processamento de agendas
- `PERFORMANCE`: Métricas de performance

### Detecção de Inconsistências
- Monitoramento automático de vagas ocupadas vs. reais
- Alertas visuais para inconsistências
- Correção automática quando possível

### Performance Monitoring
- Medição de tempos de carregamento
- Retry automático em falhas
- Timeouts configuráveis

## 🔄 Sistema de Sincronização

### Funcionalidade Offline
- Armazenamento local com IndexedDB
- Sincronização automática quando online
- Status de conexão visível para usuário

### Retry Automático
- 3 tentativas automáticas em falhas
- Backoff exponencial
- Logs detalhados de tentativas

## 🚀 Início Rápido

```bash
# Clonar o repositório
git clone <url-do-repo>

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes React
│   ├── admin/           # Componentes do dashboard admin
│   ├── entregador/      # Componentes do dashboard entregador
│   └── ui/              # Componentes de UI reutilizáveis
├── hooks/               # Hooks customizados
├── lib/                 # Utilitários e helpers
├── pages/               # Páginas principais
├── services/            # Camada de serviços
├── utils/               # Utilitários especializados
├── types/               # Definições de tipos TypeScript
└── integrations/        # Integrações externas (Supabase)
```

## 🤝 Como Contribuir

1. **Documentação Contínua**: Toda alteração significativa deve ser documentada
2. **Padrões de Código**: Seguir as convenções TypeScript e React
3. **Testes**: Testar funcionalidades antes de fazer commit
4. **Commits**: Usar mensagens descritivas e organizadas
5. **Logs**: Implementar logs categorizados para novas funcionalidades
6. **Modularidade**: Manter arquitetura modular com responsabilidades claras

### Template para Documentar Mudanças

```markdown
## [Data] - Funcionalidade/Correção

### O que foi alterado
- Descrição clara da mudança

### Motivo
- Explicação do racional técnico/negócio

### Arquivos afetados
- Lista de arquivos modificados

### Como testar
- Instruções para validar a mudança

### Impactos
- Possíveis efeitos colaterais ou considerações
```

## 📞 Suporte

Para dúvidas técnicas, consulte a documentação específica nos links acima ou abra uma issue no repositório.

---
*Documentação atualizada em: 16/06/2025*
