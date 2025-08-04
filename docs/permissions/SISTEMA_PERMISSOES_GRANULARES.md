# 🏗️ Sistema de Controle de Permissões por Tela/Usuário - Árvore de Privilégios

> **Documento Técnico**: Arquitetura para implementação de controle granular de permissões no Master Web  
> **Data**: 22/07/2025  
> **Status**: Proposta - Aguardando Implementação  

---

## 📊 Análise da Estrutura Atual

### 🔍 **Estado Atual do Sistema**

Após análise detalhada do código, identifiquei a estrutura atual de autenticação e permissões:

#### **Sistema de Autenticação**
- **Base**: Supabase Auth com JWT tokens
- **Provider**: `AuthProvider` em `/src/hooks/useAuth.tsx`
- **Contexto**: `EmpresaUnificadoContext` para dados empresariais
- **Validação**: `useUserPermissions` e `useAdminPermissions`

#### **Estrutura de Roles Atual**
- **Tabela**: `user_roles` com campos:
  - `user_id` (UUID) - Referência ao usuário
  - `empresa_id` (UUID) - Referência à empresa 
  - `role` (string) - Papel do usuário
  - `created_at`, `updated_at` - Timestamps

#### **Roles Identificados**
1. **`super_admin`** - Acesso total ao sistema
2. **`admin_empresa`** - Administrador de empresa específica
3. **`entregador`** - Usuário operacional

#### **Telas Administrativas Mapeadas**
Identificadas 12+ telas no `AdminDashboard.tsx`:

| Tela | Component | Acesso Atual |
|------|-----------|--------------|
| `dashboard` | DashboardContent | Todos |
| `entregadores` | GestaoEntregadores | Admin+ |
| `agendas-ativas` | AgendasAtivas | Admin+ |
| `criar-agendas` | CriacaoAgendas | Admin+ |
| `cidades` | GestaoCidades | Admin+ |
| `turnos` | GestaoTurnos | Admin+ |
| `empresas` | GestaoEmpresas | Super Admin |
| `billing` | BillingDashboard | Admin+ |
| `configuracoes` | ConfiguracoesPage | Admin+ |
| `administradores` | GestaoAdministradores | Super Admin |
| `dashboard-prioridades` | DashboardPrioridades | Super Admin |
| `database-expiry` | DatabaseExpiryStatus | Super Admin |

### 🎯 **Limitações Identificadas**

1. **Controle Binário**: Sistema atual é "tudo ou nada" por role
2. **Falta de Granularidade**: Não há controle por tela específica
3. **Rigidez**: Empresas não podem personalizar acessos
4. **Auditoria Limitada**: Pouco controle sobre mudanças de permissões
5. **Escalabilidade**: Dificuldade para adicionar novas telas com permissões específicas

---

## 🚀 Plano de Implementação

### **FASE 1: Estrutura de Banco de Dados** ⏱️ (2-3 horas)

#### 1.1 Nova Tabela: `screens` (Catálogo de Telas)
```sql
-- Catálogo de todas as telas do sistema
CREATE TABLE screens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  screen_key VARCHAR(100) UNIQUE NOT NULL, -- 'dashboard', 'entregadores', etc.
  screen_name VARCHAR(200) NOT NULL,
  screen_description TEXT,
  category VARCHAR(100), -- 'gestao', 'operacional', 'configuracao', 'admin'
  icon VARCHAR(50), -- Nome do ícone Lucide React
  is_system_screen BOOLEAN DEFAULT false, -- Telas críticas do sistema
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_screens_category ON screens(category);
CREATE INDEX idx_screens_active ON screens(is_active);
```

#### 1.2 Nova Tabela: `screen_permissions` (Permissões Granulares)
```sql
-- Permissões específicas por empresa/usuário/tela
CREATE TABLE screen_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) DEFAULT 'read', -- 'none', 'read', 'write', 'admin'
  granted_by UUID REFERENCES auth.users(id), -- Quem concedeu a permissão
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Permissões temporárias
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- Dados adicionais específicos da tela
  
  -- Garantir que não há duplicatas
  UNIQUE(empresa_id, user_id, screen_id),
  
  -- Validar níveis de permissão
  CONSTRAINT valid_permission_level 
    CHECK (permission_level IN ('none', 'read', 'write', 'admin'))
);

-- Índices para queries frequentes
CREATE INDEX idx_screen_permissions_user ON screen_permissions(user_id);
CREATE INDEX idx_screen_permissions_empresa ON screen_permissions(empresa_id);
CREATE INDEX idx_screen_permissions_screen ON screen_permissions(screen_id);
CREATE INDEX idx_screen_permissions_active ON screen_permissions(is_active);
```

#### 1.3 Tabela: `permission_templates` (Templates de Permissão)
```sql
-- Templates reutilizáveis de permissões
CREATE TABLE permission_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name VARCHAR(200) NOT NULL,
  template_description TEXT,
  template_data JSONB NOT NULL, -- {screenKey: permissionLevel}
  is_system_template BOOLEAN DEFAULT false, -- Templates do sistema
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.4 Dados Iniciais das Telas
```sql
INSERT INTO screens (screen_key, screen_name, screen_description, category, icon, is_system_screen) VALUES
  ('dashboard', 'Dashboard Principal', 'Visão geral do sistema e estatísticas', 'visualizacao', 'LayoutDashboard', true),
  ('entregadores', 'Gestão de Entregadores', 'Gerenciar cadastros e aprovações de entregadores', 'gestao', 'Users', false),
  ('agendas-ativas', 'Agendas Ativas', 'Visualizar e gerenciar agendas em andamento', 'operacional', 'Calendar', false),
  ('criar-agendas', 'Criar Agendas', 'Criar novas agendas e horários', 'operacional', 'CalendarPlus', false),
  ('cidades', 'Cidades & Regiões', 'Configurar localidades e regiões de atendimento', 'configuracao', 'MapPin', false),
  ('turnos', 'Gestão de Turnos', 'Configurar horários e turnos de trabalho', 'configuracao', 'Clock', false),
  ('empresas', 'Gestão de Empresas', 'Administrar empresas do sistema', 'admin', 'Building2', true),
  ('billing', 'Planos e Cobrança', 'Gerenciar assinaturas e pagamentos', 'financeiro', 'CreditCard', false),
  ('configuracoes', 'Configurações do Sistema', 'Configurações gerais e integrações', 'sistema', 'Settings', false),
  ('administradores', 'Gestão de Administradores', 'Gerenciar usuários administrativos', 'admin', 'UserCog', true),
  ('dashboard-prioridades', 'Dashboard de Prioridades', 'Métricas e alertas do sistema', 'admin', 'Star', true),
  ('database-expiry', 'Gestão de Vencimentos', 'Monitorar e gerenciar expirações', 'admin', 'CalendarClock', true),
  ('cadastro-entregadores', 'Cadastro de Entregadores', 'Formulário de cadastro de novos entregadores', 'gestao', 'UserPlus', false);
```

#### 1.5 Templates Padrão
```sql
INSERT INTO permission_templates (template_name, template_description, template_data, is_system_template) VALUES
  ('Admin Básico', 'Permissões básicas para administrador de empresa', 
   '{"dashboard": "read", "entregadores": "write", "agendas-ativas": "write", "criar-agendas": "write", "cidades": "read", "turnos": "read", "billing": "read", "configuracoes": "read"}', 
   true),
  ('Admin Completo', 'Permissões completas para administrador de empresa', 
   '{"dashboard": "admin", "entregadores": "admin", "agendas-ativas": "admin", "criar-agendas": "admin", "cidades": "admin", "turnos": "admin", "billing": "write", "configuracoes": "write", "cadastro-entregadores": "admin"}', 
   true),
  ('Operacional', 'Permissões para usuário operacional', 
   '{"dashboard": "read", "agendas-ativas": "read", "criar-agendas": "write", "entregadores": "read"}', 
   true),
  ('Financeiro', 'Permissões para gestão financeira', 
   '{"dashboard": "read", "billing": "admin", "entregadores": "read"}', 
   true);
```

---

### **FASE 2: Hooks de Permissões Granulares** ⏱️ (3-4 horas)

#### 2.1 Hook Principal: `useScreenPermissions`
```typescript
// /src/hooks/useScreenPermissions.tsx

interface ScreenPermission {
  screenKey: string;
  screenName: string;
  permissionLevel: 'none' | 'read' | 'write' | 'admin';
  category: string;
  icon: string;
  hasAccess: boolean;
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
  expiresAt?: Date;
}

interface UseScreenPermissionsReturn {
  permissions: Record<string, ScreenPermission>;
  loading: boolean;
  hasAccess: (screenKey: string, requiredLevel?: string) => boolean;
  getPermissionLevel: (screenKey: string) => string;
  getAllowedScreens: () => ScreenPermission[];
  isExpired: (screenKey: string) => boolean;
  refetch: () => Promise<void>;
}

export const useScreenPermissions = (): UseScreenPermissionsReturn => {
  const { user } = useAuth();
  const { empresa } = useEmpresaUnificado();
  
  // Cache com React Query
  const { data: permissions, isLoading, refetch } = useQuery({
    queryKey: ['screen-permissions', user?.id, empresa?.id],
    queryFn: async () => {
      if (!user?.id || !empresa?.id) return {};
      
      // Buscar permissões específicas do usuário
      const { data: userPermissions } = await supabase
        .from('screen_permissions')
        .select(`
          *,
          screens (
            screen_key,
            screen_name,
            category,
            icon,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('empresa_id', empresa.id)
        .eq('is_active', true);
      
      // Processar permissões e aplicar regras de herança
      return processPermissions(userPermissions, user, empresa);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!user?.id && !!empresa?.id
  });

  const hasAccess = useCallback((screenKey: string, requiredLevel = 'read') => {
    const permission = permissions?.[screenKey];
    if (!permission) return false;
    
    // Verificar expiração
    if (permission.expiresAt && new Date() > permission.expiresAt) {
      return false;
    }
    
    // Hierarquia: admin > write > read > none
    const levels = ['none', 'read', 'write', 'admin'];
    const userLevel = levels.indexOf(permission.permissionLevel);
    const requiredLevelIndex = levels.indexOf(requiredLevel);
    
    return userLevel >= requiredLevelIndex;
  }, [permissions]);

  return {
    permissions: permissions || {},
    loading: isLoading,
    hasAccess,
    getPermissionLevel: (screenKey) => permissions?.[screenKey]?.permissionLevel || 'none',
    getAllowedScreens: () => Object.values(permissions || {}).filter(p => p.hasAccess),
    isExpired: (screenKey) => {
      const permission = permissions?.[screenKey];
      return permission?.expiresAt ? new Date() > permission.expiresAt : false;
    },
    refetch
  };
};

// Função para processar permissões com regras de herança
const processPermissions = (userPermissions: any[], user: any, empresa: any) => {
  // Implementar regras:
  // 1. Super admin = acesso total a tudo
  // 2. Admin empresa = acesso a telas não-administrativas
  // 3. Permissões específicas = override das regras padrão
  // 4. Templates aplicados = base de permissões
};
```

#### 2.2 Hook Administrativo: `useManageScreenPermissions`
```typescript
// /src/hooks/useManageScreenPermissions.tsx

interface UseManageScreenPermissionsReturn {
  // Listagem
  getAllScreens: () => Promise<Screen[]>;
  getUserPermissions: (userId: string, empresaId: string) => Promise<ScreenPermission[]>;
  getCompanyUsers: (empresaId: string) => Promise<User[]>;
  
  // Gestão de permissões
  updateUserPermissions: (userId: string, empresaId: string, permissions: Record<string, string>) => Promise<void>;
  copyPermissions: (fromUserId: string, toUserId: string, empresaId: string) => Promise<void>;
  applyTemplate: (userId: string, empresaId: string, templateId: string) => Promise<void>;
  
  // Permissões em massa
  bulkUpdatePermissions: (userIds: string[], empresaId: string, permissions: Record<string, string>) => Promise<void>;
  setCompanyDefaultPermissions: (empresaId: string, permissions: Record<string, string>) => Promise<void>;
  
  // Templates
  createTemplate: (template: CreateTemplateData) => Promise<void>;
  updateTemplate: (templateId: string, data: UpdateTemplateData) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  getTemplates: () => Promise<PermissionTemplate[]>;
  
  // Auditoria
  getPermissionHistory: (userId?: string, screenKey?: string) => Promise<PermissionAudit[]>;
  
  loading: boolean;
  error: Error | null;
}

export const useManageScreenPermissions = (): UseManageScreenPermissionsReturn => {
  // Implementação completa de todas as funções administrativas
};
```

#### 2.3 Hook de Auditoria: `usePermissionAudit`
```typescript
// /src/hooks/usePermissionAudit.tsx

export const usePermissionAudit = () => {
  const logPermissionChange = async (action: string, details: any) => {
    await supabase.from('permission_audit').insert({
      user_id: details.currentUserId,
      target_user_id: details.targetUserId,
      screen_key: details.screenKey,
      action, // 'granted', 'revoked', 'modified', 'expired'
      old_permission: details.oldPermission,
      new_permission: details.newPermission,
      reason: details.reason,
      metadata: details.metadata
    });
  };

  return { logPermissionChange };
};
```

---

### **FASE 3: Interface de Gestão** ⏱️ (4-5 horas)

#### 3.1 Componente Principal: `ScreenPermissionsManager`
```typescript
// /src/components/admin/permissions/ScreenPermissionsManager.tsx

export const ScreenPermissionsManager = () => {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [viewMode, setViewMode] = useState<'tree' | 'matrix' | 'templates'>('tree');
  
  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Permissões</h1>
        <div className="flex gap-4">
          <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
            {/* Lista de empresas */}
          </Select>
          <Button onClick={() => setViewMode('matrix')}>
            Visualização Matriz
          </Button>
        </div>
      </div>

      {/* Tabs de visualização */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList>
          <TabsTrigger value="tree">Árvore Hierárquica</TabsTrigger>
          <TabsTrigger value="matrix">Matriz de Permissões</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="tree">
          <PermissionTreeView empresaId={selectedEmpresa} />
        </TabsContent>

        <TabsContent value="matrix">
          <PermissionMatrixView empresaId={selectedEmpresa} />
        </TabsContent>

        <TabsContent value="templates">
          <PermissionTemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

#### 3.2 Componente: `PermissionTreeView`
```typescript
// /src/components/admin/permissions/PermissionTreeView.tsx

export const PermissionTreeView = ({ empresaId }: { empresaId: string }) => {
  const { data: companyUsers } = useQuery(['company-users', empresaId]);
  const { data: screens } = useQuery(['screens']);
  
  return (
    <div className="space-y-4">
      {/* Estrutura hierárquica expandível */}
      {companyUsers?.map(user => (
        <Card key={user.id} className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{user.nome?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{user.nome}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => openEditModal(user)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Permissões
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {screens?.map(screen => {
                const permission = getUserPermission(user.id, screen.key);
                return (
                  <PermissionBadge 
                    key={screen.key}
                    screen={screen}
                    permission={permission}
                    onChange={(newLevel) => updatePermission(user.id, screen.key, newLevel)}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
```

#### 3.3 Componente: `PermissionMatrixView`
```typescript
// /src/components/admin/permissions/PermissionMatrixView.tsx

export const PermissionMatrixView = ({ empresaId }: { empresaId: string }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            {screens?.map(screen => (
              <TableHead key={screen.key} className="text-center min-w-32">
                <div className="flex items-center justify-center gap-2">
                  <Icon name={screen.icon} className="h-4 w-4" />
                  <span className="text-xs">{screen.name}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map(user => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.nome?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.nome}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              {screens?.map(screen => (
                <TableCell key={screen.key} className="text-center">
                  <PermissionSelector
                    userId={user.id}
                    screenKey={screen.key}
                    currentLevel={getUserPermission(user.id, screen.key)}
                    onChange={(level) => updatePermission(user.id, screen.key, level)}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```

#### 3.4 Modal: `EditUserPermissionsModal`
```typescript
// /src/components/admin/permissions/EditUserPermissionsModal.tsx

export const EditUserPermissionsModal = ({ 
  user, 
  isOpen, 
  onClose 
}: EditUserPermissionsModalProps) => {
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [changes, setChanges] = useState<PermissionChange[]>([]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Permissões - {user.nome}</DialogTitle>
          <DialogDescription>
            Gerencie as permissões de acesso às telas do sistema para este usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aplicar template */}
          <div className="grid gap-4">
            <Label>Aplicar Template de Permissões</Label>
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => applyTemplate(selectedTemplate)}
                disabled={!selectedTemplate}
              >
                Aplicar Template
              </Button>
            </div>
          </div>

          {/* Permissões por categoria */}
          {screenCategories.map(category => (
            <Card key={category.key}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name={category.icon} className="h-5 w-5" />
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getScreensByCategory(category.key).map(screen => (
                    <div key={screen.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon name={screen.icon} className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{screen.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {screen.description}
                          </div>
                        </div>
                      </div>
                      <PermissionSelector
                        value={permissions[screen.key] || 'none'}
                        onChange={(level) => handlePermissionChange(screen.key, level)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Preview das mudanças */}
          {changes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview das Mudanças</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {changes.map(change => (
                    <div key={change.screenKey} className="flex items-center justify-between text-sm">
                      <span>{getScreenName(change.screenKey)}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{change.oldLevel}</Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge variant="default">{change.newLevel}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSave}
            disabled={changes.length === 0}
          >
            Salvar Mudanças ({changes.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

### **FASE 4: Controle de Acesso Dinâmico** ⏱️ (2-3 horas)

#### 4.1 Componente de Proteção: `ProtectedScreen`
```typescript
// /src/components/permissions/ProtectedScreen.tsx

interface ProtectedScreenProps {
  screenKey: string;
  requiredLevel?: 'read' | 'write' | 'admin';
  fallback?: ReactNode;
  children: ReactNode;
  showPartialAccess?: boolean; // Mostrar conteúdo limitado se não tem acesso total
}

export const ProtectedScreen: React.FC<ProtectedScreenProps> = ({
  screenKey,
  requiredLevel = 'read',
  fallback,
  children,
  showPartialAccess = false
}) => {
  const { hasAccess, getPermissionLevel, isExpired } = useScreenPermissions();
  const userLevel = getPermissionLevel(screenKey);
  
  // Verificar se a permissão expirou
  if (isExpired(screenKey)) {
    return (
      <AccessExpired 
        screenKey={screenKey}
        onRequestRenewal={() => requestPermissionRenewal(screenKey)}
      />
    );
  }
  
  // Verificar se tem acesso mínimo
  if (!hasAccess(screenKey, requiredLevel)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <AccessDenied 
        screenKey={screenKey}
        requiredLevel={requiredLevel}
        userLevel={userLevel}
        onRequestAccess={() => requestAccess(screenKey, requiredLevel)}
      />
    );
  }
  
  // Se tem acesso, renderizar com contexto de permissão
  return (
    <PermissionContext.Provider value={{ 
      screenKey, 
      permissionLevel: userLevel,
      canRead: hasAccess(screenKey, 'read'),
      canWrite: hasAccess(screenKey, 'write'),
      canAdmin: hasAccess(screenKey, 'admin')
    }}>
      {children}
    </PermissionContext.Provider>
  );
};
```

#### 4.2 Hook de Contexto: `usePermissionContext`
```typescript
// /src/hooks/usePermissionContext.tsx

interface PermissionContextValue {
  screenKey: string;
  permissionLevel: string;
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export const usePermissionContext = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext must be used within ProtectedScreen');
  }
  return context;
};

// Componentes condicionais baseados em permissão
export const CanRead = ({ children }: { children: ReactNode }) => {
  const { canRead } = usePermissionContext();
  return canRead ? <>{children}</> : null;
};

export const CanWrite = ({ children }: { children: ReactNode }) => {
  const { canWrite } = usePermissionContext();
  return canWrite ? <>{children}</> : null;
};

export const CanAdmin = ({ children }: { children: ReactNode }) => {
  const { canAdmin } = usePermissionContext();
  return canAdmin ? <>{children}</> : null;
};
```

#### 4.3 Navegação Dinâmica Atualizada
```typescript
// /src/components/AdminSidebar.tsx - Atualização

export function AdminSidebar({ onMenuClick, activeMenu }: AdminSidebarProps) {
  const { isSuperAdmin } = useEmpresaUnificado();
  const { getAllowedScreens } = useScreenPermissions();
  
  // Gerar menu baseado nas permissões do usuário
  const menuItems = useMemo(() => {
    const allowedScreens = getAllowedScreens();
    
    return allowedScreens
      .filter(screen => screen.hasAccess)
      .map(screen => ({
        id: screen.screenKey,
        icon: screen.icon,
        label: screen.screenName,
        badge: getScreenBadge(screen),
        permissionLevel: screen.permissionLevel,
        category: screen.category
      }))
      .sort((a, b) => {
        // Ordenar por categoria e depois por nome
        if (a.category !== b.category) {
          return categoryOrder[a.category] - categoryOrder[b.category];
        }
        return a.label.localeCompare(b.label);
      });
  }, [getAllowedScreens]);

  return (
    <div className="flex flex-col w-64 bg-white border-r">
      {/* Header */}
      <div className="flex items-center justify-center h-16 border-b">
        <h2 className="text-xl font-bold">Master Web</h2>
      </div>
      
      {/* Navigation with categories */}
      <div className="flex-1 overflow-y-auto p-4">
        {groupBy(menuItems, 'category').map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {getCategoryName(category)}
            </h3>
            <nav className="space-y-1">
              {items.map(item => (
                <MenuItem 
                  key={item.id}
                  item={item}
                  isActive={activeMenu === item.id}
                  onClick={() => onMenuClick(item.id)}
                />
              ))}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 4.4 Componentes de Feedback de Acesso
```typescript
// /src/components/permissions/AccessDenied.tsx

export const AccessDenied = ({ 
  screenKey, 
  requiredLevel, 
  userLevel,
  onRequestAccess 
}: AccessDeniedProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Acesso Negado
        </h2>
        
        <p className="text-gray-600 mb-6">
          Você não tem permissão para acessar esta tela. 
          É necessário nível <strong>{requiredLevel}</strong>, 
          mas você possui apenas <strong>{userLevel}</strong>.
        </p>
        
        <div className="space-y-3">
          <Button onClick={onRequestAccess} className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            Solicitar Acesso
          </Button>
          
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          Entre em contato com o administrador para solicitar permissões adicionais.
        </p>
      </div>
    </div>
  );
};

// /src/components/permissions/AccessExpired.tsx

export const AccessExpired = ({ 
  screenKey, 
  onRequestRenewal 
}: AccessExpiredProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <Clock className="h-16 w-16 text-orange-400 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Acesso Expirado
        </h2>
        
        <p className="text-gray-600 mb-6">
          Sua permissão para acessar esta tela expirou. 
          Solicite a renovação do acesso ao administrador.
        </p>
        
        <Button onClick={onRequestRenewal} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Solicitar Renovação
        </Button>
      </div>
    </div>
  );
};
```

---

### **FASE 5: Auditoria e Logs** ⏱️ (1-2 horas)

#### 5.1 Tabela de Auditoria
```sql
-- Log completo de mudanças de permissões
CREATE TABLE permission_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id), -- Quem fez a ação
  target_user_id UUID REFERENCES auth.users(id), -- Quem foi afetado
  empresa_id UUID REFERENCES empresas(id),
  screen_key VARCHAR(100),
  action VARCHAR(50), -- 'granted', 'revoked', 'modified', 'expired', 'renewed'
  old_permission VARCHAR(20),
  new_permission VARCHAR(20),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para consultas de auditoria
CREATE INDEX idx_permission_audit_user ON permission_audit(user_id);
CREATE INDEX idx_permission_audit_target ON permission_audit(target_user_id);
CREATE INDEX idx_permission_audit_screen ON permission_audit(screen_key);
CREATE INDEX idx_permission_audit_action ON permission_audit(action);
CREATE INDEX idx_permission_audit_date ON permission_audit(created_at);
```

#### 5.2 Logger de Permissões
```typescript
// /src/lib/permissionLogger.ts

interface PermissionLogEntry {
  userId: string;
  targetUserId: string;
  empresaId: string;
  screenKey: string;
  action: 'granted' | 'revoked' | 'modified' | 'expired' | 'renewed';
  oldPermission?: string;
  newPermission?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export class PermissionLogger {
  static async log(entry: PermissionLogEntry) {
    try {
      // Capturar informações do contexto
      const userAgent = navigator.userAgent;
      const ipAddress = await this.getCurrentIP();
      
      await supabase.from('permission_audit').insert({
        user_id: entry.userId,
        target_user_id: entry.targetUserId,
        empresa_id: entry.empresaId,
        screen_key: entry.screenKey,
        action: entry.action,
        old_permission: entry.oldPermission,
        new_permission: entry.newPermission,
        reason: entry.reason,
        metadata: entry.metadata,
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      // Log local para debugging em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Permission change logged:', entry);
      }
      
    } catch (error) {
      console.error('Failed to log permission change:', error);
    }
  }
  
  static async getCurrentIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }
}
```

#### 5.3 Interface de Auditoria
```typescript
// /src/components/admin/permissions/PermissionAuditLog.tsx

export const PermissionAuditLog = () => {
  const [filters, setFilters] = useState({
    userId: '',
    targetUserId: '',
    screenKey: '',
    action: '',
    dateRange: { from: null, to: null }
  });
  
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['permission-audit', filters],
    queryFn: () => fetchAuditLogs(filters)
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Log de Auditoria de Permissões</h2>
        <Button onClick={() => exportAuditLog(filters)}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label>Usuário que fez a ação</Label>
              <UserSelector 
                value={filters.userId}
                onChange={(value) => setFilters(f => ({ ...f, userId: value }))}
              />
            </div>
            
            <div>
              <Label>Usuário afetado</Label>
              <UserSelector
                value={filters.targetUserId}
                onChange={(value) => setFilters(f => ({ ...f, targetUserId: value }))}
              />
            </div>
            
            <div>
              <Label>Tela</Label>
              <ScreenSelector
                value={filters.screenKey}
                onChange={(value) => setFilters(f => ({ ...f, screenKey: value }))}
              />
            </div>
            
            <div>
              <Label>Ação</Label>
              <Select 
                value={filters.action}
                onValueChange={(value) => setFilters(f => ({ ...f, action: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as ações</SelectItem>
                  <SelectItem value="granted">Permissão Concedida</SelectItem>
                  <SelectItem value="revoked">Permissão Revogada</SelectItem>
                  <SelectItem value="modified">Permissão Modificada</SelectItem>
                  <SelectItem value="expired">Permissão Expirada</SelectItem>
                  <SelectItem value="renewed">Permissão Renovada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Período</Label>
              <DateRangePicker
                value={filters.dateRange}
                onChange={(range) => setFilters(f => ({ ...f, dateRange: range }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de eventos */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Carregando logs de auditoria...</p>
            </div>
          ) : (
            <div className="divide-y">
              {auditLogs?.map(log => (
                <AuditLogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AuditLogEntry = ({ log }: { log: PermissionAuditEntry }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'granted': return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'revoked': return <UserMinus className="h-4 w-4 text-red-600" />;
      case 'modified': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'expired': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'renewed': return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getActionIcon(log.action)}
          <div>
            <div className="font-medium">
              {log.user_name} {getActionText(log.action)} permissão 
              para {log.target_user_name}
            </div>
            <div className="text-sm text-gray-600">
              Tela: <strong>{log.screen_name}</strong>
              {log.old_permission && log.new_permission && (
                <span>
                  {' • '}
                  <Badge variant="outline" className="mr-1">{log.old_permission}</Badge>
                  →
                  <Badge variant="default" className="ml-1">{log.new_permission}</Badge>
                </span>
              )}
            </div>
            {log.reason && (
              <div className="text-sm text-gray-500 mt-1">
                <strong>Motivo:</strong> {log.reason}
              </div>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</div>
          <div className="text-xs">{log.ip_address}</div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🎯 Funcionalidades Principais

### **🔐 Para Super Admin:**

1. **Gestão Global de Permissões**
   - Visualizar todas as empresas e usuários do sistema
   - Controle granular por tela/usuário/empresa
   - Override temporário para suporte técnico

2. **Templates de Permissão**
   - Criar perfis reutilizáveis (Admin Básico, Admin Completo, Operacional)
   - Aplicar templates em massa para novos usuários
   - Versionamento de templates com histórico

3. **Operações em Massa**
   - Aplicar permissões para múltiplos usuários simultaneamente
   - Copiar permissões entre usuários
   - Migração de permissões entre empresas

4. **Auditoria Completa**
   - Ver todos os logs de mudanças de permissões
   - Relatórios de acesso por usuário/tela/período
   - Alertas para mudanças sensíveis

5. **Gestão de Telas**
   - Adicionar novas telas ao sistema
   - Configurar categorias e hierarquias
   - Ativar/desativar telas globalmente

### **🏢 Para Admin Empresa:**

1. **Gestão de Usuários da Empresa**
   - Gerenciar permissões apenas dos usuários da sua empresa
   - Aplicar templates pré-aprovados pelo super admin
   - Visualização em árvore hierárquica

2. **Templates Corporativos**
   - Criar templates específicos da empresa
   - Definir permissões padrão para novos usuários
   - Aplicar configurações em massa

3. **Relatórios de Uso**
   - Ver estatísticas de acesso às telas
   - Identificar telas mais/menos utilizadas
   - Relatório de produtividade por usuário

4. **Solicitações de Acesso**
   - Aprovar/negar solicitações de permissões adicionais
   - Definir permissões temporárias
   - Notificações de mudanças

### **👤 Para Usuários Finais:**

1. **Interface Personalizada**
   - Menu lateral mostra apenas telas permitidas
   - Indicadores visuais de nível de permissão
   - Navegação inteligente baseada em acesso

2. **Solicitação de Acesso**
   - Botão para solicitar acesso a telas bloqueadas
   - Justificativa obrigatória para solicitações
   - Acompanhamento do status das solicitações

3. **Notificações de Mudanças**
   - Alertas quando permissões são alteradas
   - Notificação de expirações próximas
   - Dicas de uso das novas funcionalidades liberadas

4. **Feedback de Acesso**
   - Mensagens claras quando acesso é negado
   - Instruções sobre como solicitar permissões
   - Informações sobre expiração de acessos

---

## 🔧 Benefícios do Sistema

### **🛡️ Segurança**
- **Controle Granular**: Permissões por tela individual, não apenas roles genéricos
- **Auditoria Completa**: Rastreamento de todas as mudanças com IP e timestamp
- **Expiração Automática**: Permissões temporárias com renovação controlada
- **Segregação de Dados**: Isolamento total entre empresas diferentes

### **⚡ Performance**
- **Cache Inteligente**: React Query com invalidação seletiva
- **Lazy Loading**: Carregamento sob demanda de permissões
- **Queries Otimizadas**: Índices específicos para consultas frequentes
- **Bundle Splitting**: Componentes de gestão carregados apenas quando necessário

### **🎨 UX/UI**
- **Interface Intuitiva**: Visualização em árvore e matriz
- **Feedback Visual**: Indicadores claros de nível de acesso
- **Operações em Massa**: Aplicação eficiente de mudanças múltiplas
- **Responsivo**: Funciona perfeitamente em mobile e desktop

### **📈 Escalabilidade**
- **Arquitetura Modular**: Fácil adição de novas telas e permissões
- **Sistema de Templates**: Reutilização de configurações
- **API Extensível**: Hooks personalizáveis para casos específicos
- **Multi-tenant**: Suporte nativo a múltiplas empresas

### **🔍 Observabilidade**
- **Logs Detalhados**: Informações completas sobre mudanças
- **Métricas de Uso**: Estatísticas de acesso por tela/usuário
- **Alertas Proativos**: Notificações para ações sensíveis
- **Relatórios Customizáveis**: Dashboards adaptáveis por necessidade

---

## ⏱️ Cronograma de Implementação

### **Semana 1** (12-15 horas)
- **Dias 1-2**: Estrutura de banco de dados (Fase 1)
- **Dias 3-4**: Hooks de permissões (Fase 2)
- **Dia 5**: Proteção de rotas (Fase 4)

### **Semana 2** (10-12 horas)
- **Dias 1-3**: Interface de gestão (Fase 3)
- **Dia 4**: Sistema de auditoria (Fase 5)
- **Dia 5**: Testes e refinamentos

### **Recursos Necessários**
- **1 Desenvolvedor Senior**: React/TypeScript/Supabase
- **Acesso ao banco**: Para criação de tabelas e índices
- **Ambiente de testes**: Para validação das funcionalidades

### **Dependências**
- Supabase com RLS configurado
- React Query já implementado
- Sistema de autenticação atual funcionando
- shadcn/ui components disponíveis

---

## 🚀 Próximos Passos

### **Implementação Imediata**
1. ✅ **Aprovação da arquitetura** proposta
2. 🔄 **Setup do ambiente** de desenvolvimento
3. 📊 **Criação das tabelas** de banco de dados
4. 🔧 **Desenvolvimento dos hooks** base

### **Validação e Testes**
1. **Testes unitários** para hooks de permissões
2. **Testes de integração** com Supabase
3. **Testes de UI** para componentes de gestão
4. **Testes de performance** com grandes volumes de dados

### **Deploy e Monitoramento**
1. **Deploy incremental** por fases
2. **Migração** gradual dos usuários existentes
3. **Monitoramento** de logs e performance
4. **Coleta de feedback** dos administradores

---

## 📚 Referências Técnicas

### **Documentação Relacionada**
- [Sistema de Autenticação Atual](/docs/autenticacao.md)
- [Estrutura do Banco de Dados](/docs/database.md)
- [Hooks e Contextos](/docs/hooks.md)
- [Componentes shadcn/ui](/docs/components.md)

### **Arquivos de Código Principais**
- `/src/hooks/useAuth.tsx` - Autenticação base
- `/src/hooks/useUserPermissions.tsx` - Permissões atuais
- `/src/components/AdminDashboard.tsx` - Dashboard principal
- `/src/components/AdminSidebar.tsx` - Navegação lateral
- `/src/integrations/supabase/types.ts` - Tipos do banco

### **Scripts SQL Relevantes**
- `/sql/diagnostics/structure-checks/check-user-roles-structure.sql`
- `/sql/fixes/user-management/fix-missing-user-roles.sql`

---

**Última atualização**: 22/07/2025  
**Próxima revisão**: Após aprovação para implementação  
**Responsável**: Equipe de Desenvolvimento Master Web