# Guia de Onboarding - Desenvolvedores

## Bem-vindo ao SlotMaster! 🚀

Este guia foi criado para facilitar sua integração ao projeto SlotMaster e acelerar sua produtividade como desenvolvedor.

## Visão Geral do Projeto

### O que é o SlotMaster?

O SlotMaster é um sistema completo de gestão de agendamentos para empresas, com funcionalidades avançadas de:
- **Gestão de Administradores**: CRUD completo com controle de permissões
- **Sistema de Agendamentos**: Criação e gestão de agendas e horários
- **Auditoria e Segurança**: Log detalhado de todas as operações
- **Dashboard Analytics**: Métricas e relatórios em tempo real

### Tecnologias Principais

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Estado**: React Query + Context API
- **Validação**: Zod + React Hook Form
- **Testes**: Jest + React Testing Library + Cypress

## Configuração do Ambiente

### Pré-requisitos

```bash
# Versões recomendadas
Node.js: 18.x ou superior
npm: 9.x ou superior
Git: 2.x ou superior
```

### Ferramentas Recomendadas

#### Editor de Código
- **VS Code** (recomendado)
- Extensões essenciais:
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Auto Rename Tag
  - Bracket Pair Colorizer
  - GitLens

#### Navegador
- **Chrome** ou **Firefox** com DevTools
- Extensões úteis:
  - React Developer Tools
  - Redux DevTools (se aplicável)

### Setup Inicial

#### 1. Clone do Repositório
```bash
# Clone o projeto
git clone <REPOSITORY_URL>
cd slotmaster-21

# Instale as dependências
npm install
```

#### 2. Configuração de Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite com suas credenciais
# Solicite as credenciais do Supabase ao tech lead
```

#### 3. Primeiro Build
```bash
# Teste se tudo está funcionando
npm run dev

# Em outro terminal, execute os testes
npm run test
```

#### 4. Verificação da Configuração
```bash
# Build de produção
npm run build

# Verificação de tipos
npm run type-check

# Linting
npm run lint
```

## Estrutura do Projeto

### Organização de Diretórios

```
src/
├── components/          # Componentes React
│   ├── admin/          # Componentes específicos de admin
│   ├── auth/           # Componentes de autenticação
│   ├── entregador/     # Componentes do entregador
│   └── ui/             # Componentes de interface reutilizáveis
├── hooks/              # Custom hooks
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
├── services/           # Serviços e APIs
├── types/              # Definições de tipos TypeScript
└── utils/              # Funções utilitárias
```

### Convenções de Nomenclatura

#### Arquivos e Diretórios
```
# Componentes: PascalCase
GestaoAdministradores.tsx
EditAdminDialog.tsx

# Hooks: camelCase com prefixo 'use'
useAdminPermissions.tsx
useAuth.tsx

# Serviços: camelCase com sufixo 'Service'
adminManagementService.ts
configuracoes.service.ts

# Utilitários: camelCase
cpfUtils.ts
validationUtils.ts

# Tipos: camelCase com sufixo '.types'
agendamento.types.ts
user.types.ts
```

#### Variáveis e Funções
```typescript
// Variáveis: camelCase
const userName = 'João';
const isLoading = false;

// Funções: camelCase
const handleSubmit = () => {};
const validateForm = () => {};

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Interfaces: PascalCase
interface UserData {
  id: string;
  name: string;
}

// Types: PascalCase
type AdminRole = 'super_admin' | 'admin_empresa';
```

## Padrões de Desenvolvimento

### Estrutura de Componentes

```typescript
// Template padrão para componentes
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ComponentProps {
  // Props tipadas
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<ComponentProps> = ({ 
  title, 
  onAction 
}) => {
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  
  // Hooks
  const { toast } = useToast();
  
  // Effects
  useEffect(() => {
    logger.info('Component mounted', { title });
  }, [title]);
  
  // Handlers
  const handleClick = async () => {
    try {
      setIsLoading(true);
      await onAction?.();
      toast({ title: 'Sucesso!' });
    } catch (error) {
      logger.error('Error in handleClick', error);
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{title}</h1>
      <Button 
        onClick={handleClick} 
        disabled={isLoading}
      >
        {isLoading ? 'Carregando...' : 'Ação'}
      </Button>
    </div>
  );
};
```

### Hooks Customizados

```typescript
// Template para hooks
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface UseMyHookOptions {
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useMyHook = (options: UseMyHookOptions = {}) => {
  const { enabled = true, onSuccess, onError } = options;
  
  // Estados
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Funções
  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Lógica do hook
      const result = await someApiCall();
      
      setData(result);
      onSuccess?.(result);
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      logger.error('Error in useMyHook', error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, onSuccess, onError]);
  
  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};
```

### Serviços

```typescript
// Template para serviços
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { auditLogger } from '@/lib/auditLogger';

interface ServiceOptions {
  userId?: string;
  companyId?: string;
}

class MyService {
  private options: ServiceOptions;
  
  constructor(options: ServiceOptions = {}) {
    this.options = options;
  }
  
  async getData(id: string) {
    try {
      logger.info('Fetching data', { id });
      
      const { data, error } = await supabase
        .from('my_table')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      logger.info('Data fetched successfully', { id });
      return data;
      
    } catch (error) {
      logger.error('Error fetching data', { id, error });
      throw error;
    }
  }
  
  async updateData(id: string, updates: any) {
    try {
      // Validações
      this.validatePermissions();
      
      // Operação
      const { data, error } = await supabase
        .from('my_table')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Auditoria
      await auditLogger.logAction('data_updated', {
        target_id: id,
        changes: updates
      });
      
      return data;
      
    } catch (error) {
      logger.error('Error updating data', { id, error });
      throw error;
    }
  }
  
  private validatePermissions() {
    // Lógica de validação
  }
}

export const myService = new MyService();
```

## Sistema de Permissões

### Roles Disponíveis

```typescript
type UserRole = 'super_admin' | 'admin_empresa' | 'entregador';

// Hierarquia de permissões
const ROLE_HIERARCHY = {
  super_admin: ['admin_empresa', 'entregador'],
  admin_empresa: ['entregador'],
  entregador: []
};
```

### Como Implementar Verificações

```typescript
// Hook de permissões
const { canEditAdmins, canDeleteAdmins, canManageAdmin } = useAdminPermissions();

// Verificação em componentes
{canEditAdmins && (
  <Button onClick={handleEdit}>Editar</Button>
)}

// Verificação específica por item
{canManageAdmin(admin) && (
  <Button onClick={() => handleDelete(admin)}>Excluir</Button>
)}

// Verificação em serviços
if (!userPermissions.canEditAdmins) {
  throw new Error('Permissão negada');
}
```

## Sistema de Logs e Auditoria

### Tipos de Log

```typescript
// Log de aplicação
logger.info('User logged in', { userId });
logger.warn('Slow query detected', { query, duration });
logger.error('Database error', error);

// Log de auditoria
auditLogger.logAdminCreated(adminId, adminData);
auditLogger.logAdminUpdated(adminId, changes, targetAdmin);
auditLogger.logAdminDeleted(adminId, targetAdmin);
```

### Quando Logar

- **Sempre**: Operações CRUD em dados sensíveis
- **Sempre**: Mudanças de permissões
- **Sempre**: Tentativas de acesso negado
- **Frequentemente**: Operações de negócio importantes
- **Ocasionalmente**: Debug de problemas específicos

## Testes

### Estrutura de Testes

```typescript
// Teste de componente
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('should handle click events', async () => {
    const onAction = jest.fn();
    render(<MyComponent title="Test" onAction={onAction} />);
    
    fireEvent.click(screen.getByText('Ação'));
    
    await waitFor(() => {
      expect(onAction).toHaveBeenCalled();
    });
  });
});
```

### Comandos de Teste

```bash
# Testes unitários
npm run test

# Testes com watch
npm run test:watch

# Testes com coverage
npm run test:coverage

# Testes E2E
npm run test:e2e
```

## Fluxo de Desenvolvimento

### Git Workflow

```bash
# 1. Criar branch para feature
git checkout -b feature/nova-funcionalidade

# 2. Fazer commits pequenos e descritivos
git add .
git commit -m "feat: adiciona validação de email"

# 3. Push da branch
git push origin feature/nova-funcionalidade

# 4. Criar Pull Request
# 5. Code Review
# 6. Merge após aprovação
```

### Convenção de Commits

```bash
# Tipos de commit
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas de build/config

# Exemplos
git commit -m "feat: adiciona botão de editar admin"
git commit -m "fix: corrige validação de permissões"
git commit -m "docs: atualiza README com novas instruções"
```

### Code Review Checklist

- [ ] Código segue padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Não há console.logs esquecidos
- [ ] Tratamento de erros adequado
- [ ] Performance considerada
- [ ] Acessibilidade considerada
- [ ] Responsividade testada

## Debugging

### Ferramentas de Debug

```typescript
// Debug de estado
console.log('State:', { user, permissions, isLoading });

// Debug de props
console.log('Props received:', props);

// Debug de API calls
console.log('API Response:', response);

// Debug condicional
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', debugData);
}
```

### React DevTools

- Instalar extensão React DevTools
- Usar para inspecionar componentes
- Verificar props e estado
- Profiling de performance

### Network Tab

- Monitorar chamadas de API
- Verificar headers de autenticação
- Analisar tempo de resposta
- Debug de erros de rede

## Recursos Úteis

### Documentação Interna

- [Arquitetura do Sistema](./arquitetura.md)
- [Sistema de Autenticação](./autenticacao.md)
- [Gestão de Administradores](./gestao-administradores.md)
- [Testes](./testes-gestao-admin.md)
- [Troubleshooting](./troubleshooting.md)

### Documentação Externa

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Comunidades

- [React Discord](https://discord.gg/react)
- [TypeScript Discord](https://discord.gg/typescript)
- [Supabase Discord](https://discord.supabase.com/)

## Primeiros Passos

### Semana 1: Familiarização

**Dia 1-2: Setup e Exploração**
- [ ] Configurar ambiente de desenvolvimento
- [ ] Executar projeto localmente
- [ ] Explorar estrutura de diretórios
- [ ] Ler documentação principal

**Dia 3-4: Código Base**
- [ ] Analisar componentes principais
- [ ] Entender sistema de permissões
- [ ] Estudar fluxo de autenticação
- [ ] Revisar testes existentes

**Dia 5: Primeira Contribuição**
- [ ] Escolher issue simples (good first issue)
- [ ] Implementar solução
- [ ] Criar testes
- [ ] Submeter PR

### Semana 2: Desenvolvimento

**Objetivos**:
- [ ] Implementar feature pequena
- [ ] Participar de code reviews
- [ ] Entender processo de deploy
- [ ] Contribuir para documentação

### Semana 3-4: Autonomia

**Objetivos**:
- [ ] Trabalhar em features médias
- [ ] Fazer code reviews
- [ ] Propor melhorias
- [ ] Mentorear outros desenvolvedores

## Contatos e Suporte

### Equipe Técnica

- **Tech Lead**: [Nome] - [email]
- **Senior Developer**: [Nome] - [email]
- **DevOps**: [Nome] - [email]
- **QA Lead**: [Nome] - [email]

### Canais de Comunicação

- **Slack**: #slotmaster-dev
- **Email**: dev-team@slotmaster.com
- **Issues**: GitHub Issues
- **Documentação**: Confluence/Notion

### Horários de Suporte

- **Horário Comercial**: 9h às 18h (GMT-3)
- **Plantão**: Disponível para emergências
- **Daily Standup**: 9h30 (segunda a sexta)
- **Planning**: Quintas-feiras 14h

## FAQ

### Problemas Comuns

**Q: Erro de permissão ao instalar dependências**
```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

**Q: Erro de conexão com Supabase**
- Verificar se as variáveis de ambiente estão corretas
- Confirmar se o projeto Supabase está ativo
- Verificar conectividade de rede

**Q: Testes falhando localmente**
```bash
# Limpar cache de testes
npm run test -- --clearCache

# Executar testes específicos
npm run test -- --testNamePattern="MyComponent"
```

**Q: Build falhando**
- Verificar erros de TypeScript
- Confirmar se todas as dependências estão instaladas
- Verificar se não há imports circulares

### Dicas de Produtividade

1. **Use snippets do VS Code** para templates comuns
2. **Configure auto-save** para evitar perder código
3. **Use extensões** para formatação automática
4. **Mantenha terminal aberto** com `npm run dev`
5. **Use React DevTools** para debug eficiente

---

**Bem-vindo à equipe! 🎉**

Este guia é um documento vivo. Sinta-se à vontade para sugerir melhorias e atualizações.

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
**Responsável**: Equipe de Desenvolvimento SlotMaster