
# Componentes - SlotMaster

## 🎯 Visão Geral

Este documento descreve a arquitetura de componentes React do SlotMaster, organizados por funcionalidade e responsabilidade.

## 📁 Estrutura de Componentes

### `/src/components/`

#### 🔐 Autenticação (`/auth/`)
- **LoginForm**: Formulário de login com validação
- **AuthGuard**: Proteção de rotas autenticadas
- **PermissionGuard**: Controle de permissões por tipo de usuário
- **FullScreenLayout**: Layout responsivo para autenticação
- **MobileOptimizedLogin**: Tela de login otimizada para mobile

#### 👥 Administração (`/admin/`)
- **AdminDashboard**: Dashboard principal do administrador
- **GestaoEntregadores**: Gestão completa de entregadores
- **GestaoAdministradores**: Sistema de administração de usuários admin
- **AgendasAtivas**: Visualização e controle de agendas ativas
- **AdminMobileBottomNav**: Navegação inferior para mobile (admin)
- **ResponsiveTable**: Tabelas adaptáveis para mobile

#### 📱 PWA e Mobile
- **InstallButton**: Botão de instalação PWA adaptativo
- **MobileBottomNav**: Navegação inferior para entregadores
- **MobileNavDrawer**: Menu lateral para navegação mobile
- **ConnectionStatus**: Indicador de status de conexão
- **SyncStatus**: Controle de sincronização offline

## 🔐 Componentes de Autenticação

### `LoginForm` / `RealLoginForm`
Formulário de login com validação.

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: () => void;
}
```

**Funcionalidades:**
- Validação de email/senha
- Estados de loading
- Tratamento de erros
- Redirecionamento automático

### `CadastroForm` / `RealCadastroForm`
Formulário de cadastro de novos entregadores.

**Campos:**
- Dados pessoais (nome, email, telefone, CPF)
- Seleção de cidade
- Validação de campos obrigatórios

## 👨‍💼 Componentes Administrativos

### `AdminDashboard`
Layout principal do dashboard administrativo.

**Estrutura:**
```jsx
<div className="flex">
  <AdminSidebar />
  <main className="flex-1">
    <Outlet /> {/* Renderiza a página atual */}
  </main>
</div>
```

### `AdminSidebar`
Navegação lateral para administradores.

**Menu Items:**
- Dashboard (estatísticas)
- Gestão de Entregadores
- Gestão de Cidades
- Gestão de Turnos
- Criação de Agendas
- Configurações do Sistema

### `GestaoEntregadores`
Interface para aprovar/rejeitar entregadores.

**Funcionalidades:**
- Lista de entregadores por status
- Ações: Aprovar, Rejeitar, Suspender
- Filtros por status e cidade
- Modal de confirmação para ações

**Estados de Entregador:**
- `pendente`: Aguardando aprovação
- `aprovado`: Ativo no sistema
- `rejeitado`: Negado acesso
- `suspenso`: Temporariamente inativo

### `GestaoCidades`
CRUD de cidades e regiões.

**Operações:**
- Criar/editar/desativar cidades
- Gerenciar regiões por cidade
- Validação de unicidade
- Cascade de dependências

### `GestaoTurnos`
Gerenciamento de períodos de trabalho.

**Campos do Turno:**
- Nome (ex: "Manhã", "Tarde", "Noite")
- Hora início/fim
- Status ativo/inativo

### `CriacaoAgendas`
Interface para criar oportunidades de trabalho.

**Fluxo de Criação:**
1. Seleção de data
2. Escolha de turno
3. Seleção de região
4. Definição de vagas disponíveis
5. Confirmação e criação

**Validações:**
- Data não pode ser no passado
- Não duplicar agenda para mesma data/turno/região
- Vagas deve ser número positivo

## 🚚 Componentes do Entregador

### `EntregadorDashboard`
Layout principal para entregadores.

**Seções:**
- Resumo de agendamentos próximos
- Calendário de agendamento
- Histórico de trabalhos

### `AgendamentoCalendar`
Calendário interativo para agendamento de turnos.

**Funcionalidades:**
- Visualização mensal
- Destaque de datas com vagas
- Modal de detalhes por data
- Agendamento direto

**Props:**
```typescript
interface AgendamentoCalendarProps {
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}
```

**Estados Visuais:**
- Verde: Vagas disponíveis
- Amarelo: Poucas vagas restantes
- Cinza: Sem vagas ou data passada
- Azul: Já agendado pelo usuário

### `MeusAgendamentos`
Lista de agendamentos do entregador.

**Seções:**
- **Ativos**: Agendamentos confirmados
- **Histórico**: Cancelados e concluídos

**Ações Disponíveis:**
- Cancelar agendamento (até data limite)
- Visualizar detalhes
- Filtrar por período

**Card de Agendamento:**
```jsx
<Card>
  <CardHeader>
    <Badge status={agendamento.status} />
    <h3>{formatarData(agendamento.data)}</h3>
  </CardHeader>
  <CardContent>
    <p>Turno: {agendamento.turno.nome}</p>
    <p>Região: {agendamento.regiao.nome}</p>
    <p>Horário: {agendamento.turno.hora_inicio} - {agendamento.turno.hora_fim}</p>
  </CardContent>
  <CardFooter>
    {agendamento.status === 'agendado' && (
      <Button onClick={() => cancelar(agendamento.id)}>
        Cancelar
      </Button>
    )}
  </CardFooter>
</Card>
```

## 🎨 Componentes de UI (shadcn/ui)

### Componentes Base Utilizados
- `Button`: Ações e navegação
- `Card`: Containers de conteúdo
- `Dialog`: Modais e overlays
- `Form`: Formulários com validação
- `Input`: Campos de entrada
- `Select`: Seleção de opções
- `Badge`: Status e categorias
- `Calendar`: Seleção de datas
- `Tabs`: Navegação em abas
- `Alert`: Mensagens de feedback

### Customizações Aplicadas
- Paleta de cores personalizada
- Responsividade mobile-first
- Estados de loading consistentes
- Animações suaves com Tailwind

## 🔄 Padrões de Componentes

### 1. Estrutura Padrão
```typescript
interface ComponentProps {
  // Props tipadas
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks e estado local
  const [state, setState] = useState(initialValue);
  
  // Efeitos e lógica
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Handlers
  const handleAction = () => {
    // Event handling
  };

  // Render
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
}
```

### 2. Loading States
```jsx
{loading ? (
  <div className="flex items-center justify-center p-8">
    <Spinner size="lg" />
    <span className="ml-2">Carregando...</span>
  </div>
) : (
  <ActualContent />
)}
```

### 3. Error Boundaries
```jsx
{error ? (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Erro</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
) : (
  <SuccessContent />
)}
```

### 4. Responsive Design
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards responsivos */}
</div>
```

## 📱 Responsividade

### Breakpoints Utilizados
- `sm`: 640px+ (mobile landscape)
- `md`: 768px+ (tablet)
- `lg`: 1024px+ (desktop)
- `xl`: 1280px+ (large desktop)

### Padrões Mobile-First
- Layout em coluna única no mobile
- Navegação drawer em telas pequenas
- Botões touch-friendly (44px mínimo)
- Modais fullscreen no mobile

## 🎯 Performance

### Otimizações Aplicadas
- Lazy loading de componentes pesados
- Memoização com `React.memo` quando necessário
- Debounce em inputs de busca
- Paginação para listas grandes

### Code Splitting
```typescript
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const EntregadorDashboard = lazy(() => import('./EntregadorDashboard'));
```

## 🧪 Testabilidade

### Data Attributes
Componentes incluem atributos para testes:

```jsx
<button 
  data-testid="cancelar-agendamento"
  onClick={handleCancel}
>
  Cancelar
</button>
```

### Props de Teste
```typescript
interface ComponentProps {
  'data-testid'?: string;
  // outras props
}
```

---
*Última atualização: 30/05/2025*
