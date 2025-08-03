
# Arquitetura do Sistema

## 📐 Visão Geral da Arquitetura

O sistema segue uma arquitetura cliente-servidor com frontend React e backend Supabase.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │────│   Supabase       │────│   PostgreSQL    │
│                 │    │                  │    │                 │
│ • Components    │    │ • Auth           │    │ • Tables        │
│ • Hooks         │    │ • RLS Policies   │    │ • Functions     │
│ • Pages         │    │ • Edge Functions │    │ • Triggers      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🏗️ Camadas da Aplicação

### 1. Camada de Apresentação (UI)
- **Componentes React**: Interface do usuário reativa
- **shadcn/ui**: Sistema de design components
- **Tailwind CSS**: Estilização utilitária
- **React Router**: Navegação entre páginas

### 2. Camada de Lógica de Negócio
- **Hooks Customizados**: Encapsulam lógica de estado e API
- **React Query**: Cache e sincronização de dados
- **Utilitários**: Funções helper para formatação e validação

### 3. Camada de Dados
- **Supabase Client**: Interface com o backend
- **PostgreSQL**: Banco de dados relacional
- **RLS (Row Level Security)**: Segurança a nível de linha

## 🔄 Fluxo de Dados

```
User Action → Component → Hook → Supabase → Database
     ↑                                         ↓
UI Update ← React Query ← Response ← API ← Query Result
```

### Exemplo: Agendamento de Turno

1. **Usuário** clica em "Agendar" no componente `AgendamentoCalendar`
2. **Hook** `useAgendamento` processa a ação
3. **Supabase** recebe a requisição via `supabase.from('agendamentos').insert()`
4. **Database** executa a inserção e trigger `handle_agendamento_vagas`
5. **React Query** invalida cache e refetch dados
6. **UI** atualiza automaticamente com novo estado

## 🎭 Padrões Arquiteturais

### 1. Separação de Responsabilidades
- **Componentes**: Apenas renderização e eventos de UI
- **Hooks**: Lógica de estado e efeitos colaterais
- **Utilitários**: Funções puras reutilizáveis

### 2. Composição sobre Herança
- Componentes pequenos e focados
- Hooks compostos a partir de hooks menores
- Reutilização através de composição

### 3. Declarativo vs Imperativo
- Estado derivado automaticamente
- Efeitos colaterais explícitos
- UI como função do estado

## 🔐 Modelo de Segurança

### 1. Autenticação
- Supabase Auth com JWT tokens
- Sessões persistentes no localStorage
- Refresh automático de tokens

### 2. Autorização
- RLS policies no banco de dados
- Verificação de perfil (admin/entregador)
- Filtragem automática por cidade/região

### 3. Validação
- TypeScript para type safety
- Validação no frontend e backend
- Sanitização de inputs

## 📊 Gerenciamento de Estado

### 1. Estado Local
- `useState` para estado de componente
- `useReducer` para lógica complexa
- `useRef` para valores mutáveis

### 2. Estado Global
- React Query para dados do servidor
- Context API para configurações globais
- Props drilling minimizado

### 3. Estado do Servidor
- Cache automático com React Query
- Invalidação inteligente
- Otimistic updates quando apropriado

## 🔧 Padrões de Código

### 1. Naming Conventions
- **Componentes**: PascalCase (`AgendamentoCalendar`)
- **Hooks**: camelCase com prefixo `use` (`useEntregadorData`)
- **Utilitários**: camelCase (`formatarDataCorreta`)
- **Tipos**: PascalCase (`AgendaDisponivel`)

### 2. Estrutura de Arquivos
- Um componente por arquivo
- Hooks agrupados por funcionalidade
- Índices para facilitar imports

### 3. TypeScript
- Tipos explícitos para props
- Interfaces para objetos complexos
- Enums para valores fixos

---
*Última atualização: 30/05/2025*
