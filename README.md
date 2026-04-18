# Master Web - Sistema de Gestão de Agendamentos

Sistema completo de gestão de agendamentos para empresas, com funcionalidades avançadas de administração, controle de permissões e auditoria.

## 🚀 Funcionalidades

### Para Entregadores
- ✅ **Agendamento de Turnos**: Interface intuitiva para reservar horários
- ✅ **Visualização de Agenda**: Calendário com turnos disponíveis e ocupados
- ✅ **Gestão de Reservas**: Visualizar, cancelar e gerenciar agendamentos
- ✅ **Sistema de Notificações**: Alertas sobre status das reservas
- ✅ **Dashboard Personalizado**: Visão geral das atividades
- ✅ **App Mobile PWA**: Instalação como app nativo no dispositivo
- ✅ **Modo Offline**: Funcionalidade completa sem conexão à internet
- ✅ **Navegação Mobile**: Interface otimizada para dispositivos móveis

### Para Administradores
- ✅ **Criação de Agendas**: Definir turnos, horários e vagas disponíveis
- ✅ **Gestão de Entregadores**: Cadastro, edição e controle de acesso
- ✅ **Monitoramento em Tempo Real**: Acompanhar reservas e disponibilidade
- ✅ **Relatórios e Analytics**: Dados sobre utilização e performance
- ✅ **Configurações Avançadas**: Personalização do sistema por empresa
- ✅ **Interface Responsiva**: Painel administrativo adaptável a qualquer dispositivo

### Funcionalidades PWA
- ✅ **Instalação Nativa**: Botão de instalação inteligente para iOS e Android
- ✅ **Service Worker**: Cache automático e funcionamento offline
- ✅ **Sincronização**: Dados sincronizados automaticamente quando online
- ✅ **Notificações**: Sistema de alertas integrado
- ✅ **Performance**: Carregamento rápido e experiência fluida

### Gestão de Administradores
- **Criação de Administradores**: Cadastro de novos administradores com diferentes níveis de permissão
- **Edição de Administradores**: Atualização de informações como nome e status
- **Exclusão de Administradores**: Remoção segura com validações de permissão
- **Controle de Permissões**: Sistema granular baseado em roles (super_admin, admin_empresa)
- **Auditoria Completa**: Log detalhado de todas as ações administrativas

### Sistema de Agendamentos
- Criação e gestão de agendas
- Controle de vagas e horários
- Dashboard com métricas em tempo real
- Exportação de dados

### Segurança e Permissões
- Autenticação via Supabase
- Controle de acesso baseado em roles
- Validações de segurança em todas as operações
- Prevenção de auto-exclusão de administradores

## 🏗️ Arquitetura

### Tecnologias Utilizadas
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Estado**: React Query + Context API
- **Validação**: Zod
- **Logs**: Sistema customizado de auditoria
- **PWA**: Service Worker + Web App Manifest
- **Animações**: Framer Motion
- **Mobile**: Touch Optimization + Responsive Design

### Estrutura do Projeto
```
src/
├── components/
│   ├── admin/              # Componentes de administração
│   │   ├── GestaoAdministradores.tsx
│   │   └── EditAdminDialog.tsx
│   └── ui/                 # Componentes de interface
├── hooks/                  # Hooks customizados
│   ├── useAdminPermissions.tsx
│   └── useUserPermissions.tsx
├── services/               # Serviços e APIs
│   ├── adminManagementService.ts
│   └── empresaCache.ts
├── lib/                    # Utilitários e configurações
│   ├── auditLogger.ts
│   └── logger.ts
└── types/                  # Definições de tipos TypeScript
```

## 🔧 Configuração e Desenvolvimento

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Instalação
```bash
# Clone o repositório
git clone <YOUR_GIT_URL>

# Navegue para o diretório
cd master-web

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Inicie o servidor de desenvolvimento (frontend apenas)
npm run dev
```

### 💳 Sistema de Pagamentos
O sistema está preparado para integração com plataformas de pagamento:

```bash
# Apenas o servidor de desenvolvimento
npm run dev
```

**Configuração de Pagamentos:**
- Funcionalidades preparadas para nova plataforma
- Interfaces definidas em `/src/types/subscription.ts`
- Componentes em `/src/components/billing/`

### Scripts Disponíveis
```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build
npm run lint             # Verificação de código
npm run migrate:iugu     # Migração de dados (se necessário)
```

## 👥 Gestão de Administradores

### Permissões
- **Super Admin**: Acesso total ao sistema, pode gerenciar todos os administradores
- **Admin Empresa**: Pode gerenciar apenas administradores da própria empresa

### Funcionalidades Disponíveis
1. **Visualização**: Lista todos os administradores com filtros e paginação
2. **Criação**: Formulário para cadastro de novos administradores
3. **Edição**: Atualização de nome e status dos administradores
4. **Exclusão**: Remoção com confirmação e validações de segurança

### Validações de Segurança
- Verificação de permissões antes de cada operação
- Prevenção de auto-exclusão
- Validação de empresa para admins empresariais
- Log completo de todas as ações

## 📊 Monitoramento e Logs

### Sistema de Auditoria
Todas as ações administrativas são registradas com:
- Timestamp da ação
- Usuário responsável
- Detalhes da operação
- Informações do navegador
- IP do usuário

### Métricas Disponíveis
- Total de administradores por empresa
- Ações realizadas por período
- Status dos administradores
- Performance do sistema

## 🚀 Deploy

### Lovable (Recomendado)
1. Acesse [Lovable Project](https://lovable.dev/projects/28493152-6687-483a-a3d0-0c23e6dd8300)
2. Clique em Share → Publish
3. Configure domínio customizado se necessário

### Deploy Manual
```bash
# Build do projeto
npm run build

# Deploy para seu provedor preferido
# (Vercel, Netlify, etc.)
```

## 📚 Documentação Adicional

- [Arquitetura do Sistema](./docs/arquitetura.md)
- [Sistema de Autenticação](./docs/autenticacao.md)
- [Configurações](./docs/configuracao.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Changelog](./docs/changelog.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte técnico ou dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação em `./docs/`
- Verifique os logs de auditoria para debugging

---

**Desenvolvido para otimizar a gestão de agendamentos empresariais**
