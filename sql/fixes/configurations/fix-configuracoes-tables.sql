-- =========================================
-- FIX: Corrigir estrutura das tabelas de configurações
-- =========================================

-- 1. Adicionar campos faltantes na tabela configuracoes_empresa
ALTER TABLE configuracoes_empresa 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS horario_liberacao_5_estrelas TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_4_estrelas TIME DEFAULT '08:45:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_3_estrelas TIME DEFAULT '09:20:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_2_estrelas TIME DEFAULT '10:00:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_1_estrela TIME DEFAULT '10:30:00';

-- 2. Criar tabela configuracoes (geral) se não existe - algumas partes do código tentam acessar
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(255) NOT NULL UNIQUE,
    valor TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    categoria VARCHAR(100),
    descricao TEXT,
    editavel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir configurações padrão se a tabela estava vazia
INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo, categoria, descricao)
SELECT 
    e.id as empresa_id,
    'habilitarPriorizacao' as chave,
    'false' as valor,
    'boolean' as tipo,
    'priorizacao' as categoria,
    'Habilitar sistema de priorização por estrelas' as descricao
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM configuracoes_empresa ce 
    WHERE ce.empresa_id = e.id AND ce.chave = 'habilitarPriorizacao'
)
ON CONFLICT (empresa_id, chave) DO NOTHING;

INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo, categoria, descricao)
SELECT 
    e.id as empresa_id,
    'permitirAgendamentoMesmoDia' as chave,
    'true' as valor,
    'boolean' as tipo,
    'agendamento' as categoria,
    'Permitir agendamentos para o mesmo dia' as descricao
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM configuracoes_empresa ce 
    WHERE ce.empresa_id = e.id AND ce.chave = 'permitirAgendamentoMesmoDia'
)
ON CONFLICT (empresa_id, chave) DO NOTHING;

INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo, categoria, descricao)
SELECT 
    e.id as empresa_id,
    'horarios' as chave,
    '{"inicio": "08:00", "fim": "18:00"}' as valor,
    'json' as tipo,
    'horarios' as categoria,
    'Horários de funcionamento do sistema' as descricao
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM configuracoes_empresa ce 
    WHERE ce.empresa_id = e.id AND ce.chave = 'horarios'
)
ON CONFLICT (empresa_id, chave) DO NOTHING;

-- 4. Atualizar categoria para configurações existentes que não têm
UPDATE configuracoes_empresa 
SET categoria = CASE 
    WHEN chave LIKE '%horario%' THEN 'horarios'
    WHEN chave LIKE '%agendamento%' THEN 'agendamento'
    WHEN chave LIKE '%priorizacao%' THEN 'priorizacao'
    ELSE 'geral'
END
WHERE categoria IS NULL;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa_categoria ON configuracoes_empresa(categoria);
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa_chave ON configuracoes_empresa(chave);
CREATE INDEX IF NOT EXISTS idx_configuracoes_categoria ON configuracoes(categoria);

-- Log da correção
COMMENT ON TABLE configuracoes IS 'Tabela de configurações gerais do sistema';
COMMENT ON TABLE configuracoes_empresa IS 'Configurações específicas por empresa (corrigida com campos categoria e horários)';

-- Verificar se as correções foram aplicadas
SELECT 'configuracoes_empresa' as tabela, count(*) as total_registros FROM configuracoes_empresa
UNION ALL
SELECT 'configuracoes' as tabela, count(*) as total_registros FROM configuracoes;