# Gestão de Administradores - Documentação Técnica

## Visão Geral

O sistema de gestão de administradores do Master Web permite o controle completo de usuários administrativos com diferentes níveis de permissão, auditoria detalhada e validações de segurança robustas.

## Arquitetura

### Componentes Principais

#### 1. GestaoAdministradores.tsx
**Localização**: `src/components/admin/GestaoAdministradores.tsx`

**Responsabilidades**:
- Interface principal para listagem de administradores
- Controle de ações (editar, excluir)
- Gerenciamento de estado dos diálogos
- Integração com sistema de permissões

**Estados Principais**:
```typescript
const [showEditDialog, setShowEditDialog] = useState(false);
const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
```

**Funções Principais**:
- `handleEditAdmin(admin)`: Abre o diálogo de edição
- `handleAdminUpdated()`: Callback após atualização bem-sucedida
- `handleDeleteAdmin(admin)`: Executa exclusão com confirmação

#### 2. EditAdminDialog.tsx
**Localização**: `src/components/admin/EditAdminDialog.tsx`

**Responsabilidades**:
- Interface de edição de administradores
- Validação de formulário
- Integração com API de atualização
- Tratamento de erros

**Estados do Formulário**:
```typescript
interface FormData {
  nome: string;
  status: 'ativo' | 'inativo';
}

interface FormErrors {
  nome?: string;
  status?: string;
  general?: string;
}
```

**Validações**:
- Nome obrigatório (mínimo 2 caracteres)
- Status obrigatório
- Validação de permissões antes da submissão

### Serviços

#### adminManagementService.ts
**Localização**: `src/services/adminManagementService.ts`

**Métodos Principais**:

##### `updateAdmin(adminId, updateData)`
```typescript
export const updateAdmin = async (
  adminId: string, 
  updateData: { nome?: string; status?: 'ativo' | 'inativo' }
) => {
  // Validações de permissão
  // Atualização no banco
  // Log de auditoria
  // Retorno dos dados atualizados
}
```

**Validações**:
- Verificação de permissões do usuário atual
- Validação de empresa para admins empresariais
- Prevenção de auto-edição de status

##### `deleteAdmin(adminId)`
```typescript
export const deleteAdmin = async (adminId: string) => {
  // Validações de permissão
  // Prevenção de auto-exclusão
  // Exclusão do banco
  // Log de auditoria
}
```

**Validações**:
- Verificação de permissões do usuário atual
- Prevenção de auto-exclusão
- Validação de empresa para admins empresariais

### Sistema de Permissões

#### useAdminPermissions.tsx
**Localização**: `src/hooks/useAdminPermissions.tsx`

**Permissões Retornadas**:
```typescript
interface AdminPermissions {
  canViewAdmins: boolean;
  canCreateAdmins: boolean;
  canEditAdmins: boolean;
  canDeleteAdmins: boolean;
  allowedCompanyIds: string[];
  canManageAdmin: (admin: Admin) => boolean;
}
```

**Lógica de Permissões**:
- **Super Admin**: Acesso total a todos os administradores
- **Admin Empresa**: Acesso apenas aos administradores da própria empresa

#### Função canManageAdmin
```typescript
const canManageAdmin = useCallback((admin: Admin) => {
  if (userRole === 'super_admin') return true;
  if (userRole === 'admin_empresa') {
    return admin.empresa_id === userCompanyId;
  }
  return false;
}, [userRole, userCompanyId]);
```

### Sistema de Auditoria

#### auditLogger.ts
**Localização**: `src/lib/auditLogger.ts`

**Métodos de Log**:

##### `logAdminUpdated(adminId, changes, targetAdmin)`
```typescript
async logAdminUpdated(
  adminId: string,
  changes: Record<string, any>,
  targetAdmin?: any
) {
  const details = {
    admin_id: adminId,
    changes: this.sanitizeDetails(changes),
    target_admin_name: targetAdmin?.nome,
    target_admin_email: targetAdmin?.email,
    target_empresa_id: targetAdmin?.empresa_id
  };
  
  await this.logAction('admin_updated', details);
}
```

##### `logAdminDeleted(adminId, targetAdmin)`
```typescript
async logAdminDeleted(
  adminId: string,
  targetAdmin?: any
) {
  const details = {
    deleted_admin_id: adminId,
    deleted_admin_name: targetAdmin?.nome,
    deleted_admin_email: targetAdmin?.email,
    deleted_empresa_id: targetAdmin?.empresa_id
  };
  
  await this.logAction('admin_deleted', details);
}
```

**Informações Registradas**:
- Timestamp da ação
- ID do usuário que executou a ação
- Detalhes da operação
- Informações do navegador
- IP do usuário (quando disponível)

## Fluxo de Dados

### Edição de Administrador

1. **Usuário clica em "Editar"**
   - `GestaoAdministradores` → `handleEditAdmin()`
   - Verifica permissões via `canManageAdmin()`
   - Define `selectedAdmin` e abre `EditAdminDialog`

2. **Preenchimento do formulário**
   - `EditAdminDialog` carrega dados do admin selecionado
   - Validação em tempo real dos campos
   - Verificação de permissões para campos específicos

3. **Submissão do formulário**
   - Validação completa via `validateForm()`
   - Chamada para `adminManagementService.updateAdmin()`
   - Log de auditoria via `auditLogger.logAdminUpdated()`
   - Atualização da interface via `onAdminUpdated()`

### Exclusão de Administrador

1. **Usuário clica em "Excluir"**
   - `GestaoAdministradores` → `handleDeleteAdmin()`
   - Verifica permissões via `canManageAdmin()`
   - Exibe diálogo de confirmação

2. **Confirmação da exclusão**
   - Chamada para `adminManagementService.deleteAdmin()`
   - Validações de segurança (auto-exclusão, permissões)
   - Log de auditoria via `auditLogger.logAdminDeleted()`
   - Atualização da interface

## Validações de Segurança

### Validações de Permissão

1. **Verificação de Role**
   ```typescript
   if (!['super_admin', 'admin_empresa'].includes(userRole)) {
     throw new Error('Permissão negada');
   }
   ```

2. **Validação de Empresa (Admin Empresa)**
   ```typescript
   if (userRole === 'admin_empresa' && admin.empresa_id !== userCompanyId) {
     throw new Error('Você só pode gerenciar administradores da sua empresa');
   }
   ```

3. **Prevenção de Auto-exclusão**
   ```typescript
   if (adminId === currentUser.id) {
     throw new Error('Você não pode excluir sua própria conta');
   }
   ```

### Validações de Dados

1. **Validação de Nome**
   ```typescript
   if (!nome || nome.trim().length < 2) {
     errors.nome = 'Nome deve ter pelo menos 2 caracteres';
   }
   ```

2. **Validação de Status**
   ```typescript
   if (!['ativo', 'inativo'].includes(status)) {
     errors.status = 'Status inválido';
   }
   ```

## Tratamento de Erros

### Tipos de Erro

1. **Erros de Permissão**
   - Código: 403
   - Mensagem: "Permissão negada"
   - Ação: Redirecionamento ou toast de erro

2. **Erros de Validação**
   - Código: 400
   - Mensagem: Específica do campo
   - Ação: Exibição no formulário

3. **Erros de Rede**
   - Código: 500/502/503
   - Mensagem: "Erro interno do servidor"
   - Ação: Toast de erro genérico

### Estratégias de Recuperação

1. **Retry Automático**
   - Para erros de rede temporários
   - Máximo 3 tentativas
   - Backoff exponencial

2. **Fallback de Interface**
   - Desabilitação de botões durante operações
   - Loading states apropriados
   - Mensagens de erro claras

## Performance e Otimizações

### Otimizações Implementadas

1. **Memoização de Permissões**
   ```typescript
   const canManageAdmin = useCallback((admin: Admin) => {
     // Lógica de permissão
   }, [userRole, userCompanyId]);
   ```

2. **Validação Debounced**
   - Validação de formulário com delay
   - Redução de chamadas desnecessárias

3. **Cache de Empresas**
   - Uso do `empresaCacheService`
   - Redução de consultas ao banco

### Métricas de Performance

- **Tempo de carregamento**: < 200ms para listagem
- **Tempo de edição**: < 500ms para atualização
- **Tempo de exclusão**: < 300ms para remoção

## Testes

### Cenários de Teste

#### Testes de Permissão
1. Super admin pode editar qualquer administrador
2. Admin empresa só pode editar admins da própria empresa
3. Usuário sem permissão não pode acessar funcionalidades

#### Testes de Validação
1. Nome obrigatório e com mínimo de caracteres
2. Status deve ser válido
3. Prevenção de auto-exclusão

#### Testes de Interface
1. Formulário de edição carrega dados corretos
2. Mensagens de erro são exibidas adequadamente
3. Loading states funcionam corretamente

### Comandos de Teste
```bash
# Testes unitários
npm run test

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e
```

## Monitoramento

### Métricas Coletadas

1. **Operações por Tipo**
   - Edições realizadas
   - Exclusões realizadas
   - Tentativas de acesso negado

2. **Performance**
   - Tempo de resposta das operações
   - Taxa de erro por operação
   - Uso de recursos

3. **Segurança**
   - Tentativas de acesso não autorizado
   - Operações suspeitas
   - Logs de auditoria

### Alertas Configurados

1. **Alta taxa de erro** (> 5%)
2. **Tempo de resposta elevado** (> 2s)
3. **Tentativas de acesso suspeitas**
4. **Falhas de auditoria**

## Manutenção

### Tarefas Regulares

1. **Limpeza de Logs**
   - Remoção de logs antigos (> 90 dias)
   - Arquivamento de dados históricos

2. **Revisão de Permissões**
   - Auditoria mensal de acessos
   - Verificação de administradores inativos

3. **Atualização de Dependências**
   - Verificação semanal de vulnerabilidades
   - Atualização de bibliotecas

### Procedimentos de Backup

1. **Backup de Dados**
   - Backup diário automático
   - Retenção de 30 dias

2. **Backup de Logs**
   - Arquivamento mensal
   - Retenção de 1 ano

## Roadmap

### Próximas Funcionalidades

1. **Gestão de Roles Customizadas**
   - Criação de roles personalizadas
   - Permissões granulares

2. **Auditoria Avançada**
   - Dashboard de auditoria
   - Relatórios automatizados

3. **Notificações**
   - Notificações por email
   - Alertas em tempo real

4. **API REST**
   - Endpoints públicos
   - Documentação OpenAPI

### Melhorias Planejadas

1. **Performance**
   - Paginação virtual
   - Cache inteligente

2. **UX/UI**
   - Interface mais intuitiva
   - Modo escuro

3. **Segurança**
   - Autenticação 2FA
   - Rate limiting

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
**Responsável**: Equipe de Desenvolvimento Master Web