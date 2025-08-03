# Base de Dados

## 🗄️ Esquema do Banco de Dados

O sistema utiliza PostgreSQL através do Supabase com as seguintes tabelas principais:

### Diagrama de Relacionamentos

```
cidades (1) ──────────── (N) regioes
   │                         │
   │                         │
   └── (N) entregadores      │
                             │
                             └── (N) agendas ──── (N) turnos
                                      │
                                      │
                                      └── (N) agendamentos
```

## 📋 Tabelas

### `cidades`
Armazena as cidades onde o serviço está disponível.

```sql
CREATE TABLE cidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  estado TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id`: Identificador único
- `nome`: Nome da cidade
- `estado`: Estado (UF)
- `ativo`: Se a cidade está ativa no sistema
- `empresa_id`: Referência à empresa proprietária da cidade

**Observações:**
- Cada cidade pertence a uma empresa específica
- O filtro por `empresa_id` deve ser aplicado em todas as consultas para garantir isolamento de dados

### `regioes`
Define regiões dentro de cada cidade para organizar as entregas.

```sql
CREATE TABLE regioes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade_id UUID REFERENCES cidades(id),
  ativo BOOLEAN DEFAULT true,
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id`: Identificador único
- `nome`: Nome da região
- `cidade_id`: Referência à cidade
- `ativo`: Se a região está ativa
- `empresa_id`: Referência à empresa proprietária da região

**Observações:**
- Cada região está associada a uma empresa específica
- Sempre filtrar por `empresa_id` nas consultas para garantir isolamento de dados entre empresas

### `turnos`
Define os períodos de trabalho disponíveis.

```sql
CREATE TABLE turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN DEFAULT true,
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id`: Identificador único
- `nome`: Nome do turno (ex: "Manhã", "Tarde")
- `hora_inicio`: Horário de início
- `hora_fim`: Horário de término
- `empresa_id`: Referência à empresa proprietária do turno

**Observações:**
- Cada turno está associado a uma empresa específica
- Sempre filtrar por `empresa_id` nas consultas para garantir isolamento de dados entre empresas

### `entregadores`
Dados dos entregadores cadastrados no sistema.

```sql
CREATE TABLE entregadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL UNIQUE, -- Deve ser único no sistema
  cpf TEXT NOT NULL UNIQUE, -- Deve ser único no sistema
  cidade_id UUID REFERENCES cidades(id),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  perfil perfil_usuario DEFAULT 'entregador',
  status status_entregador DEFAULT 'pendente',
  data_cadastro DATE DEFAULT CURRENT_DATE,
  data_aprovacao DATE,
  data_rejeicao DATE,
  motivo_rejeicao TEXT,
  estrelas INTEGER DEFAULT 0, -- Nível de estrelas/pontuação do entregador
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Enums:**
- `perfil_usuario`: 'entregador' | 'admin'
- `status_entregador`: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso'

**Observações:**
- Os campos `telefone` e `cpf` possuem restrição de unicidade no banco de dados.
- Para usuários administradores, são gerados valores únicos para `telefone` e `cpf` durante o cadastro.
- O sistema possui configurações que permitem habilitar/desabilitar a validação de CPF e a confirmação de telefone.

### `agendas`
Representa as oportunidades de trabalho criadas pelos administradores.

```sql
CREATE TABLE agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  turno_id UUID REFERENCES turnos(id),
  regiao_id UUID REFERENCES regioes(id),
  vagas_disponiveis INTEGER NOT NULL,
  vagas_ocupadas INTEGER DEFAULT 0,
  permite_reserva BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES entregadores(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `data`: Data da agenda
- `vagas_disponiveis`: Total de vagas criadas
- `vagas_ocupadas`: Vagas já preenchidas (calculado automaticamente)
- `permite_reserva`: Se permite agendamento de entregadores

### `agendamentos`
Registra os agendamentos dos entregadores nas agendas.

```sql
CREATE TABLE agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID REFERENCES agendas(id),
  entregador_id UUID REFERENCES entregadores(id),
  tipo tipo_agendamento DEFAULT 'vaga',
  status status_agendamento DEFAULT 'agendado',
  data_agendamento TIMESTAMPTZ DEFAULT NOW(),
  data_cancelamento TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Enums:**
- `tipo_agendamento`: 'vaga' | 'reserva'
- `status_agendamento`: 'agendado' | 'cancelado' | 'concluido'

### `configuracoes_empresa`
Define configurações específicas por empresa, incluindo sistema de horários específicos.

```sql
CREATE TABLE configuracoes_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  chave TEXT NOT NULL,
  valor TEXT NOT NULL,
  tipo config_tipo NOT NULL,
  categoria TEXT,
  descricao TEXT,
  -- Horários específicos por nível de estrelas
  horario_liberacao_5_estrelas TIME DEFAULT '08:00:00',
  horario_liberacao_4_estrelas TIME DEFAULT '08:45:00',
  horario_liberacao_3_estrelas TIME DEFAULT '09:20:00',
  horario_liberacao_2_estrelas TIME DEFAULT '10:00:00',
  horario_liberacao_1_estrela TIME DEFAULT '10:30:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id`: Identificador único
- `empresa_id`: Referência à empresa proprietária
- `chave`: Nome da configuração (ex: 'habilitarPriorizacaoHorarios')
- `valor`: Valor da configuração como string
- `tipo`: Tipo da configuração ('boolean', 'string', 'integer', etc.)
- `categoria`: Agrupamento da configuração (ex: 'sistema', 'horarios')
- `descricao`: Descrição da configuração

**Colunas de Horários Específicos:**
- `horario_liberacao_5_estrelas`: Horário que entregadores 5⭐ podem agendar (padrão: 08:00)
- `horario_liberacao_4_estrelas`: Horário que entregadores 4⭐ podem agendar (padrão: 08:45)
- `horario_liberacao_3_estrelas`: Horário que entregadores 3⭐ podem agendar (padrão: 09:20)
- `horario_liberacao_2_estrelas`: Horário que entregadores 2⭐ podem agendar (padrão: 10:00)
- `horario_liberacao_1_estrela`: Horário que entregadores 1⭐ podem agendar (padrão: 10:30)

**Configurações Principais:**
```sql
-- Habilitar sistema de horários específicos
INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo, categoria)
VALUES ('empresa-id', 'habilitarPriorizacaoHorarios', 'true', 'boolean', 'sistema');

-- Permitir agendamento no mesmo dia
INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo, categoria)  
VALUES ('empresa-id', 'permitirAgendamentoMesmoDia', 'true', 'boolean', 'sistema');
```

**Observações:**
- Sistema de horários específicos permite controlar quando entregadores podem agendar baseado em suas estrelas
- Horários são comparados com horário atual para liberar agendamento de turnos
- Configurações são isoladas por empresa para permitir customização

## ⚡ Triggers e Funções

### `get_current_empresa_id()`
**Função crítica para isolamento de dados por empresa.**

```sql
CREATE OR REPLACE FUNCTION get_current_empresa_id()
RETURNS UUID
LANGUAGE plpgsql
STABILITY STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_empresa uuid;
BEGIN
  -- Buscar empresa do entregador logado PRIMEIRO
  SELECT e.empresa_id INTO user_empresa
  FROM public.entregadores e
  WHERE e.user_id = auth.uid()
  AND e.status = 'aprovado'
  LIMIT 1;
  
  IF user_empresa IS NOT NULL THEN
    RETURN user_empresa;
  END IF;
  
  -- Fallback via user_roles
  SELECT ur.empresa_id INTO user_empresa
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
  IF user_empresa IS NOT NULL THEN
    RETURN user_empresa;
  END IF;
  
  -- Fallback para empresa padrão
  RETURN 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;
END;
$$;
```

**Características:**
- `SECURITY DEFINER`: Executa com privilégios do owner da função, evitando problemas de RLS recursivo
- `STABLE`: Resultado não muda durante a transação, permite otimizações
- **Correção 14/06/2025**: Prioriza busca por `entregadores.empresa_id` antes de `user_roles`
- Usado em políticas RLS para garantir isolamento de dados por empresa

### `handle_agendamento_vagas()`
Trigger que atualiza automaticamente o campo `vagas_ocupadas` na tabela `agendas` quando há inserção, atualização ou deleção em `agendamentos`.

```sql
CREATE OR REPLACE FUNCTION handle_agendamento_vagas()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar vagas ocupadas
    UPDATE agendas 
    SET vagas_ocupadas = vagas_ocupadas + 1 
    WHERE id = NEW.agenda_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar vagas ocupadas
    UPDATE agendas 
    SET vagas_ocupadas = vagas_ocupadas - 1 
    WHERE id = OLD.agenda_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Lidar com mudanças de status
    IF OLD.status = 'agendado' AND NEW.status = 'cancelado' THEN
      UPDATE agendas 
      SET vagas_ocupadas = vagas_ocupadas - 1 
      WHERE id = OLD.agenda_id;
    ELSIF OLD.status = 'cancelado' AND NEW.status = 'agendado' THEN
      UPDATE agendas 
      SET vagas_ocupadas = vagas_ocupadas + 1 
      WHERE id = NEW.agenda_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### `is_admin()`
Função para verificar se o usuário autenticado é um administrador.

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM entregadores 
    WHERE user_id = auth.uid() AND perfil = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

## 🔐 Políticas RLS (Row Level Security)

### Política para configuracoes_empresa
```sql
-- Permite leitura de configurações da própria empresa
CREATE POLICY "Users can read own company configs"
ON configuracoes_empresa FOR SELECT
TO authenticated
USING (empresa_id = get_current_empresa_id());

-- Permite escrita apenas para admins da empresa
CREATE POLICY "Admins can manage company configs"
ON configuracoes_empresa FOR ALL
TO authenticated
USING (empresa_id = get_current_empresa_id() AND is_admin_empresa());
```

**Observações:**
- Política usa `get_current_empresa_id()` para garantir isolamento
- Apenas admins podem modificar configurações
- Leitura permitida para todos usuários autenticados da empresa

## 📊 Consultas Comuns

### Agendas Disponíveis para um Entregador
```sql
SELECT a.*, t.nome as turno_nome, r.nome as regiao_nome, c.nome as cidade_nome
FROM agendas a
JOIN turnos t ON a.turno_id = t.id
JOIN regioes r ON a.regiao_id = r.id
JOIN cidades c ON r.cidade_id = c.id
JOIN entregadores e ON e.cidade_id = c.id
WHERE e.user_id = $1
  AND a.ativo = true
  AND a.data >= CURRENT_DATE
  AND a.vagas_ocupadas < a.vagas_disponiveis;
```

### Histórico de Agendamentos de um Entregador
```sql
SELECT ag.*, a.data, t.nome as turno, r.nome as regiao
FROM agendamentos ag
JOIN agendas a ON ag.agenda_id = a.id
JOIN turnos t ON a.turno_id = t.id
JOIN regioes r ON a.regiao_id = r.id
WHERE ag.entregador_id = $1
ORDER BY a.data DESC, t.hora_inicio DESC;
```

### Buscar Configurações da Empresa
```sql
-- Buscar todas as configurações da empresa atual
SELECT * FROM configuracoes_empresa 
WHERE empresa_id = get_current_empresa_id();

-- Buscar configuração específica
SELECT valor FROM configuracoes_empresa 
WHERE empresa_id = get_current_empresa_id() 
AND chave = 'habilitarPriorizacaoHorarios';

-- Buscar horários de liberação
SELECT 
  horario_liberacao_5_estrelas,
  horario_liberacao_4_estrelas,
  horario_liberacao_3_estrelas,
  horario_liberacao_2_estrelas,
  horario_liberacao_1_estrela
FROM configuracoes_empresa 
WHERE empresa_id = get_current_empresa_id()
LIMIT 1;
```

## 🔄 Manutenção e Backup

### Limpeza de Dados Antigos
Recomenda-se implementar um processo para arquivar agendamentos antigos:

```sql
-- Mover agendamentos concluídos de mais de 6 meses para tabela de histórico
INSERT INTO agendamentos_historico 
SELECT * FROM agendamentos 
WHERE status = 'concluido' 
  AND created_at < NOW() - INTERVAL '6 months';
```

### Índices Recomendados
```sql
-- Melhorar performance das consultas mais comuns
CREATE INDEX idx_agendas_data_ativo ON agendas(data, ativo);
CREATE INDEX idx_agendamentos_entregador_status ON agendamentos(entregador_id, status);
CREATE INDEX idx_entregadores_user_id ON entregadores(user_id);
CREATE INDEX idx_regioes_cidade_id ON regioes(cidade_id);
```

### Índices Específicos para Performance
```sql
-- Índices para configurações
CREATE INDEX idx_configuracoes_empresa_empresa_chave ON configuracoes_empresa(empresa_id, chave);
CREATE INDEX idx_configuracoes_empresa_tipo ON configuracoes_empresa(empresa_id, tipo);

-- Índices para função get_current_empresa_id()
CREATE INDEX idx_entregadores_user_empresa ON entregadores(user_id, empresa_id, status);
CREATE INDEX idx_user_roles_user_empresa ON user_roles(user_id, empresa_id);
```

### Configurações de Sistema
```sql
-- Backup de configurações por empresa
COPY (
  SELECT * FROM configuracoes_empresa 
  WHERE empresa_id = 'target-empresa-id'
) TO '/backup/configs_empresa.csv' WITH CSV HEADER;

-- Restaurar configurações padrão
INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo, categoria)
VALUES 
  ('empresa-id', 'habilitarPriorizacaoHorarios', 'true', 'boolean', 'sistema'),
  ('empresa-id', 'permitirAgendamentoMesmoDia', 'true', 'boolean', 'sistema')
ON CONFLICT (empresa_id, chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  updated_at = NOW();
```

---
*Última atualização: 14/06/2025*
