
# Configuração e Deploy

## ⚙️ Configuração de Desenvolvimento

### 1. Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Editor de código (VS Code recomendado)

### 2. Configuração Local
```bash
# 1. Clonar repositório
git clone <url-do-repositorio>
cd sistema-agendamento

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
```

### 3. Variáveis de Ambiente
```env
# .env.local
VITE_SUPABASE_URL=https://sua-url.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. Configuração do Supabase

#### Criação do Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Configure senha do banco
4. Copie URL e chave anônima

#### Configuração de Autenticação
```sql
-- No SQL Editor do Supabase
-- Configurar políticas de autenticação
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
```

#### Configurações de Auth no Dashboard
```json
{
  "SITE_URL": "http://localhost:5173",
  "REDIRECT_URLS": [
    "http://localhost:5173/**",
    "https://yourdomain.com/**"
  ],
  "MAILER_AUTOCONFIRM": false,
  "DISABLE_SIGNUP": false
}
```

### 5. Executar Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Servidor estará disponível em http://localhost:5173
```

## 🗄️ Configuração do Banco de Dados

### 1. Schema Inicial
Execute os scripts SQL na ordem:

```sql
-- 1. Tipos enumerados
CREATE TYPE perfil_usuario AS ENUM ('entregador', 'admin');
CREATE TYPE status_entregador AS ENUM ('pendente', 'aprovado', 'rejeitado', 'suspenso');
CREATE TYPE status_agendamento AS ENUM ('agendado', 'cancelado', 'concluido');
CREATE TYPE tipo_agendamento AS ENUM ('vaga', 'reserva');
CREATE TYPE tipo_configuracao AS ENUM ('boolean', 'integer', 'string', 'decimal', 'json');
```

### 2. Tabelas Principais
```sql
-- 2. Criar tabelas (ver arquivo database.md para scripts completos)
-- Ordem de criação:
-- cidades → regioes → turnos → entregadores → agendas → agendamentos
```

### 3. Funções e Triggers
```sql
-- 3. Funções do sistema
CREATE OR REPLACE FUNCTION handle_updated_at()...
CREATE OR REPLACE FUNCTION handle_agendamento_vagas()...
CREATE OR REPLACE FUNCTION is_admin()...

-- 4. Triggers
CREATE TRIGGER trigger_updated_at...
CREATE TRIGGER trigger_agendamento_vagas...
```

### 4. Dados Iniciais
```sql
-- Inserir dados básicos
INSERT INTO cidades (nome, estado) VALUES 
('São Paulo', 'SP'),
('Rio de Janeiro', 'RJ');

INSERT INTO turnos (nome, hora_inicio, hora_fim) VALUES
('Manhã', '08:00', '12:00'),
('Tarde', '13:00', '17:00'),
('Noite', '18:00', '22:00');
```

## 🚀 Deploy em Produção

### 1. Build da Aplicação
```bash
# Gerar build otimizado
npm run build

# Testar build localmente
npm run preview
```

### 2. Deploy na Lovable
O projeto já está configurado para deploy automático:

1. **Via Interface Lovable**:
   - Clique em "Publish" no editor
   - A aplicação será deployada automaticamente

2. **Via Git**:
   - Conecte o repositório GitHub
   - Push para branch main ativa deploy

### 3. Deploy em Outros Provedores

#### Vercel
```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no dashboard
```

#### Netlify
```bash
# Build settings
Build command: npm run build
Publish directory: dist

# Environment variables
VITE_SUPABASE_URL=sua-url-producao
VITE_SUPABASE_ANON_KEY=sua-chave-producao
```

## 🔒 Configurações de Segurança em Produção

### 1. Supabase Settings
```json
{
  "SITE_URL": "https://seudominio.com",
  "REDIRECT_URLS": ["https://seudominio.com/**"],
  "MAILER_AUTOCONFIRM": true,
  "DISABLE_SIGNUP": true,
  "SECURITY_CAPTCHA_ENABLED": true
}
```

### 2. Row Level Security
```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE entregadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;

-- Criar políticas (ver autenticacao.md)
```

### 3. Headers de Segurança
Configure no seu provedor de hosting:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 📊 Monitoramento

### 1. Analytics
```typescript
// Configurar Google Analytics ou similar
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <Router />
      <Analytics />
    </>
  );
}
```

### 2. Error Tracking
```typescript
// Sentry ou similar para tracking de erros
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN",
  environment: import.meta.env.MODE,
});
```

### 3. Performance Monitoring
```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 🔧 Manutenção

### 1. Backup do Banco
```bash
# Configurar backup automático no Supabase Dashboard
# ou via CLI
supabase db dump > backup.sql
```

### 2. Atualizações de Dependências
```bash
# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências
npm update

# Audit de segurança
npm audit
```

### 3. Logs e Debugging
```typescript
// Configurar diferentes níveis de log
const LOG_LEVEL = import.meta.env.PROD ? 'error' : 'debug';

const logger = {
  debug: (msg: string) => LOG_LEVEL === 'debug' && console.log(msg),
  error: (msg: string) => console.error(msg),
};
```

## 🌍 Domínio Personalizado

### 1. Configurar DNS
```
# Adicionar registros CNAME
www.seudominio.com → sua-app.vercel.app
seudominio.com → sua-app.vercel.app
```

### 2. Certificado SSL
- Automaticamente configurado pelos provedores modernos
- Verificar renovação automática

### 3. Configurar no Supabase
Atualizar `SITE_URL` e `REDIRECT_URLS` no Auth Settings

## 📋 Checklist de Deploy

### Pré-Deploy
- [ ] Testes locais passando
- [ ] Build sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] RLS policies ativas
- [ ] Backup do banco atual

### Pós-Deploy
- [ ] Testar login/logout
- [ ] Verificar funcionalidades principais
- [ ] Monitorar logs por 24h
- [ ] Confirmar analytics funcionando
- [ ] Testar em diferentes browsers/devices

---
*Última atualização: 30/05/2025*
