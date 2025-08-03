# Testes - Gestão de Administradores

## Visão Geral

Este documento detalha os cenários de teste para as funcionalidades de gestão de administradores do SlotMaster, incluindo testes manuais, automatizados e de segurança.

## Cenários de Teste

### 1. Testes de Permissões

#### 1.1 Super Admin - Acesso Total

**Cenário**: Super Admin pode gerenciar todos os administradores

**Pré-condições**:
- Usuário logado como super_admin
- Existem administradores de diferentes empresas no sistema

**Passos**:
1. Acessar a página de Gestão de Administradores
2. Verificar se todos os administradores são listados
3. Tentar editar um administrador de qualquer empresa
4. Tentar excluir um administrador de qualquer empresa

**Resultado Esperado**:
- ✅ Todos os administradores são visíveis
- ✅ Botões de edição e exclusão estão habilitados para todos
- ✅ Operações de edição e exclusão são executadas com sucesso
- ✅ Logs de auditoria são criados corretamente

#### 1.2 Admin Empresa - Acesso Restrito

**Cenário**: Admin Empresa só pode gerenciar administradores da própria empresa

**Pré-condições**:
- Usuário logado como admin_empresa
- Usuário pertence à empresa ID "123"
- Existem administradores de diferentes empresas no sistema

**Passos**:
1. Acessar a página de Gestão de Administradores
2. Verificar quais administradores são listados
3. Tentar editar um administrador da mesma empresa
4. Tentar editar um administrador de empresa diferente
5. Tentar excluir um administrador da mesma empresa
6. Tentar excluir um administrador de empresa diferente

**Resultado Esperado**:
- ✅ Apenas administradores da empresa "123" são visíveis
- ✅ Botões de edição/exclusão habilitados apenas para admins da mesma empresa
- ✅ Operações em admins da mesma empresa são executadas com sucesso
- ❌ Tentativas de operações em outras empresas são bloqueadas
- ✅ Logs de auditoria registram tentativas de acesso negado

#### 1.3 Usuário Sem Permissão

**Cenário**: Usuário sem permissões administrativas não pode acessar gestão

**Pré-condições**:
- Usuário logado com role diferente de super_admin ou admin_empresa

**Passos**:
1. Tentar acessar a página de Gestão de Administradores
2. Tentar fazer chamadas diretas à API de gestão

**Resultado Esperado**:
- ❌ Acesso à página é negado
- ❌ Chamadas à API retornam erro 403
- ✅ Usuário é redirecionado ou recebe mensagem de erro

### 2. Testes de Edição

#### 2.1 Edição Válida

**Cenário**: Edição bem-sucedida de administrador

**Pré-condições**:
- Usuário com permissões adequadas
- Administrador alvo existe e é gerenciável pelo usuário

**Passos**:
1. Clicar no botão "Editar" de um administrador
2. Verificar se o diálogo abre com dados corretos
3. Alterar o nome para "Novo Nome Teste"
4. Alterar o status de "ativo" para "inativo"
5. Clicar em "Salvar Alterações"

**Resultado Esperado**:
- ✅ Diálogo abre com dados do administrador
- ✅ Campos são editáveis conforme permissões
- ✅ Validação em tempo real funciona
- ✅ Alterações são salvas no banco de dados
- ✅ Interface é atualizada com novos dados
- ✅ Toast de sucesso é exibido
- ✅ Log de auditoria é criado com detalhes das alterações

#### 2.2 Validação de Campos

**Cenário**: Validação de campos obrigatórios e formatos

**Passos**:
1. Abrir diálogo de edição
2. Limpar o campo "Nome"
3. Tentar salvar
4. Inserir nome com apenas 1 caractere
5. Tentar salvar
6. Inserir nome válido (2+ caracteres)
7. Salvar

**Resultado Esperado**:
- ❌ Erro exibido para campo nome vazio
- ❌ Erro exibido para nome muito curto
- ✅ Salvamento bem-sucedido com nome válido
- ✅ Mensagens de erro são claras e específicas

#### 2.3 Tratamento de Erros

**Cenário**: Comportamento durante falhas de rede ou servidor

**Passos**:
1. Simular falha de rede (desconectar internet)
2. Tentar editar um administrador
3. Reconectar e tentar novamente
4. Simular erro 500 do servidor
5. Verificar comportamento

**Resultado Esperado**:
- ❌ Erro de rede é capturado e exibido
- ✅ Retry automático funciona quando conexão é restaurada
- ❌ Erro de servidor é tratado adequadamente
- ✅ Interface permanece responsiva durante erros
- ✅ Dados não são perdidos durante falhas temporárias

### 3. Testes de Exclusão

#### 3.1 Exclusão Válida

**Cenário**: Exclusão bem-sucedida de administrador

**Pré-condições**:
- Usuário com permissões adequadas
- Administrador alvo existe e é gerenciável pelo usuário
- Administrador alvo não é o próprio usuário

**Passos**:
1. Clicar no botão "Excluir" de um administrador
2. Verificar se diálogo de confirmação aparece
3. Confirmar a exclusão
4. Verificar se administrador é removido da lista

**Resultado Esperado**:
- ✅ Diálogo de confirmação é exibido
- ✅ Administrador é removido do banco de dados
- ✅ Interface é atualizada (admin removido da lista)
- ✅ Toast de sucesso é exibido
- ✅ Log de auditoria é criado com detalhes da exclusão

#### 3.2 Prevenção de Auto-exclusão

**Cenário**: Sistema impede que usuário exclua própria conta

**Pré-condições**:
- Usuário logado como administrador
- Usuário tenta excluir sua própria conta

**Passos**:
1. Localizar própria conta na lista de administradores
2. Verificar se botão "Excluir" está disponível
3. Se disponível, tentar clicar
4. Verificar comportamento do sistema

**Resultado Esperado**:
- ❌ Botão "Excluir" deve estar desabilitado para própria conta
- ❌ Se tentativa for feita, erro deve ser exibido
- ✅ Mensagem clara explicando a restrição
- ✅ Log de tentativa de auto-exclusão é registrado

#### 3.3 Cancelamento de Exclusão

**Cenário**: Usuário cancela operação de exclusão

**Passos**:
1. Clicar no botão "Excluir" de um administrador
2. No diálogo de confirmação, clicar "Cancelar"
3. Verificar se nenhuma alteração foi feita

**Resultado Esperado**:
- ✅ Diálogo é fechado sem ação
- ✅ Administrador permanece na lista
- ✅ Nenhuma alteração no banco de dados
- ✅ Nenhum log de exclusão é criado

### 4. Testes de Interface

#### 4.1 Responsividade

**Cenário**: Interface funciona em diferentes tamanhos de tela

**Passos**:
1. Testar em desktop (1920x1080)
2. Testar em tablet (768x1024)
3. Testar em mobile (375x667)
4. Verificar usabilidade em cada tamanho

**Resultado Esperado**:
- ✅ Layout se adapta adequadamente
- ✅ Botões permanecem acessíveis
- ✅ Diálogos são responsivos
- ✅ Texto permanece legível

#### 4.2 Estados de Loading

**Cenário**: Feedback visual durante operações

**Passos**:
1. Iniciar operação de edição
2. Observar estados de loading
3. Iniciar operação de exclusão
4. Observar feedback visual

**Resultado Esperado**:
- ✅ Spinners/loading aparecem durante operações
- ✅ Botões ficam desabilitados durante processamento
- ✅ Feedback visual é claro e não ambíguo

#### 4.3 Acessibilidade

**Cenário**: Interface é acessível para usuários com deficiências

**Passos**:
1. Testar navegação por teclado
2. Testar com leitor de tela
3. Verificar contraste de cores
4. Testar foco visual

**Resultado Esperado**:
- ✅ Navegação por Tab funciona corretamente
- ✅ Elementos têm labels apropriados
- ✅ Contraste atende padrões WCAG
- ✅ Foco visual é claro

### 5. Testes de Segurança

#### 5.1 Injeção de Dados

**Cenário**: Sistema resiste a tentativas de injeção

**Passos**:
1. Tentar inserir script malicioso no campo nome
2. Tentar SQL injection em parâmetros
3. Verificar sanitização de dados

**Resultado Esperado**:
- ✅ Scripts são sanitizados ou rejeitados
- ✅ SQL injection é prevenida
- ✅ Dados maliciosos não são persistidos

#### 5.2 Manipulação de Tokens

**Cenário**: Sistema valida tokens de autenticação

**Passos**:
1. Tentar operações com token expirado
2. Tentar operações com token inválido
3. Verificar renovação automática de tokens

**Resultado Esperado**:
- ❌ Operações com tokens inválidos são rejeitadas
- ✅ Usuário é redirecionado para login quando necessário
- ✅ Tokens são renovados automaticamente quando possível

#### 5.3 Rate Limiting

**Cenário**: Sistema previne abuso de APIs

**Passos**:
1. Fazer múltiplas requisições rapidamente
2. Verificar se há limitação de taxa
3. Testar comportamento após limite

**Resultado Esperado**:
- ✅ Rate limiting está ativo
- ❌ Requisições excessivas são bloqueadas
- ✅ Mensagens de erro apropriadas são retornadas

### 6. Testes de Performance

#### 6.1 Tempo de Resposta

**Cenário**: Operações são executadas em tempo adequado

**Métricas Esperadas**:
- Carregamento da lista: < 2 segundos
- Abertura de diálogo de edição: < 500ms
- Salvamento de alterações: < 1 segundo
- Exclusão de administrador: < 1 segundo

#### 6.2 Uso de Memória

**Cenário**: Interface não causa vazamentos de memória

**Passos**:
1. Abrir e fechar diálogos múltiplas vezes
2. Fazer várias operações de edição
3. Monitorar uso de memória

**Resultado Esperado**:
- ✅ Memória é liberada adequadamente
- ✅ Não há vazamentos detectáveis
- ✅ Performance permanece estável

## Automação de Testes

### Testes Unitários

```bash
# Executar testes unitários
npm run test

# Executar com coverage
npm run test:coverage

# Executar em modo watch
npm run test:watch
```

**Componentes Testados**:
- `EditAdminDialog.tsx`
- `adminManagementService.ts`
- `useAdminPermissions.tsx`
- `auditLogger.ts`

### Testes de Integração

```bash
# Executar testes de integração
npm run test:integration
```

**Cenários Cobertos**:
- Fluxo completo de edição
- Fluxo completo de exclusão
- Integração com sistema de permissões
- Integração com auditoria

### Testes E2E

```bash
# Executar testes E2E
npm run test:e2e

# Executar em modo headless
npm run test:e2e:headless
```

**Cenários E2E**:
- Jornada completa do super admin
- Jornada completa do admin empresa
- Cenários de erro e recuperação
- Testes de acessibilidade

## Ferramentas de Teste

### Ferramentas Utilizadas

- **Jest**: Testes unitários e de integração
- **React Testing Library**: Testes de componentes
- **Cypress**: Testes E2E
- **MSW**: Mock de APIs para testes
- **Axe**: Testes de acessibilidade

### Configuração de Ambiente

```bash
# Instalar dependências de teste
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev cypress @cypress/react
npm install --save-dev msw @axe-core/react
```

### Dados de Teste

```typescript
// Mock data para testes
const mockAdmins = [
  {
    id: '1',
    nome: 'Admin Teste 1',
    email: 'admin1@teste.com',
    status: 'ativo',
    empresa_id: '123',
    role: 'admin_empresa'
  },
  {
    id: '2',
    nome: 'Super Admin Teste',
    email: 'super@teste.com',
    status: 'ativo',
    empresa_id: null,
    role: 'super_admin'
  }
];
```

## Relatórios de Teste

### Métricas de Cobertura

**Metas de Cobertura**:
- Statements: > 90%
- Branches: > 85%
- Functions: > 90%
- Lines: > 90%

### Relatórios Gerados

- **Coverage Report**: HTML detalhado da cobertura
- **Test Results**: Resultados de todos os testes
- **Performance Report**: Métricas de performance
- **Accessibility Report**: Resultados de acessibilidade

## Procedimentos de Teste

### Antes de Cada Release

1. **Executar suite completa de testes**
   ```bash
   npm run test:all
   ```

2. **Verificar cobertura de código**
   ```bash
   npm run test:coverage
   ```

3. **Executar testes E2E**
   ```bash
   npm run test:e2e
   ```

4. **Teste manual de cenários críticos**
   - Permissões de super admin
   - Permissões de admin empresa
   - Prevenção de auto-exclusão
   - Auditoria de operações

### Teste de Regressão

**Quando Executar**:
- Após mudanças no sistema de permissões
- Após alterações na interface
- Após atualizações de dependências
- Antes de releases importantes

**Cenários Prioritários**:
1. Fluxos de edição e exclusão
2. Validações de segurança
3. Sistema de auditoria
4. Responsividade da interface

## Troubleshooting de Testes

### Problemas Comuns

#### Testes Falhando por Timeout
```bash
# Aumentar timeout para testes lentos
jest.setTimeout(10000);
```

#### Problemas de Mock
```typescript
// Limpar mocks entre testes
afterEach(() => {
  jest.clearAllMocks();
});
```

#### Problemas de Estado
```typescript
// Reset de estado entre testes
beforeEach(() => {
  cleanup();
});
```

### Logs de Debug

```typescript
// Habilitar logs detalhados durante testes
process.env.NODE_ENV = 'test';
process.env.DEBUG = 'true';
```

## Checklist de Qualidade

### Antes do Deploy

- [ ] Todos os testes unitários passando
- [ ] Todos os testes de integração passando
- [ ] Todos os testes E2E passando
- [ ] Cobertura de código > 90%
- [ ] Testes de acessibilidade passando
- [ ] Performance dentro dos limites
- [ ] Testes de segurança passando
- [ ] Documentação atualizada
- [ ] Changelog atualizado

### Critérios de Aceitação

- [ ] Funcionalidades implementadas conforme especificação
- [ ] Validações de segurança funcionando
- [ ] Sistema de auditoria operacional
- [ ] Interface responsiva e acessível
- [ ] Performance adequada
- [ ] Tratamento de erros robusto
- [ ] Documentação completa

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
**Responsável**: Equipe de QA SlotMaster