-- =========================================
-- SISTEMA DE PRIORIZAÇÃO POR ESTRELAS
-- Adicionar campos necessários para controle de horários por estrelas
-- =========================================

-- 1. Adicionar campo categoria
ALTER TABLE configuracoes_empresa 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

-- 2. Adicionar campos de horários específicos por estrelas
ALTER TABLE configuracoes_empresa 
ADD COLUMN IF NOT EXISTS horario_liberacao_5_estrelas TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_4_estrelas TIME DEFAULT '08:45:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_3_estrelas TIME DEFAULT '09:20:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_2_estrelas TIME DEFAULT '10:00:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_1_estrela TIME DEFAULT '10:30:00';

-- 3. Adicionar campo estrelas na tabela entregadores se não existir
ALTER TABLE entregadores 
ADD COLUMN IF NOT EXISTS estrelas INTEGER DEFAULT 5 CHECK (estrelas >= 1 AND estrelas <= 5);

-- 4. Atualizar registros existentes com categoria baseada na chave
UPDATE configuracoes_empresa 
SET categoria = CASE 
    WHEN chave LIKE '%horario%' OR chave = 'horarios' OR chave = 'horarios_configurados' THEN 'horarios'
    WHEN chave LIKE '%agendamento%' OR chave = 'permitirAgendamentoMesmoDia' THEN 'agendamento'
    WHEN chave LIKE '%priorizacao%' OR chave = 'habilitarPriorizacao' THEN 'priorizacao'
    ELSE 'geral'
END
WHERE categoria IS NULL;

-- 5. Inserir configurações padrão de priorização para todas as empresas
INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo, categoria, descricao, 
                                 horario_liberacao_5_estrelas, horario_liberacao_4_estrelas, 
                                 horario_liberacao_3_estrelas, horario_liberacao_2_estrelas, 
                                 horario_liberacao_1_estrela)
SELECT 
    e.id as empresa_id,
    'sistema_priorizacao_estrelas' as chave,
    'true' as valor,
    'boolean' as tipo,
    'priorizacao' as categoria,
    'Sistema de priorização por estrelas - controle de horários de acesso às agendas' as descricao,
    '08:00:00' as horario_liberacao_5_estrelas,  -- 5 estrelas: acesso imediato às 8h
    '08:45:00' as horario_liberacao_4_estrelas,  -- 4 estrelas: acesso às 8h45
    '09:20:00' as horario_liberacao_3_estrelas,  -- 3 estrelas: acesso às 9h20
    '10:00:00' as horario_liberacao_2_estrelas,  -- 2 estrelas: acesso às 10h
    '10:30:00' as horario_liberacao_1_estrela    -- 1 estrela: acesso às 10h30
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM configuracoes_empresa ce 
    WHERE ce.empresa_id = e.id AND ce.chave = 'sistema_priorizacao_estrelas'
)
ON CONFLICT (empresa_id, chave) DO NOTHING;

-- 6. Atualizar entregadores existentes com estrelas padrão (5 estrelas para todos inicialmente)
UPDATE entregadores 
SET estrelas = 5 
WHERE estrelas IS NULL;

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa_categoria ON configuracoes_empresa(categoria);
CREATE INDEX IF NOT EXISTS idx_entregadores_estrelas ON entregadores(estrelas);
CREATE INDEX IF NOT EXISTS idx_entregadores_empresa_estrelas ON entregadores(empresa_id, estrelas);

-- 8. Comentários explicativos
COMMENT ON COLUMN configuracoes_empresa.categoria IS 'Categoria da configuração: horarios, agendamento, priorizacao, geral';
COMMENT ON COLUMN configuracoes_empresa.horario_liberacao_5_estrelas IS 'Horário que entregadores 5 estrelas podem ver agendas';
COMMENT ON COLUMN configuracoes_empresa.horario_liberacao_4_estrelas IS 'Horário que entregadores 4 estrelas podem ver agendas';
COMMENT ON COLUMN configuracoes_empresa.horario_liberacao_3_estrelas IS 'Horário que entregadores 3 estrelas podem ver agendas';
COMMENT ON COLUMN configuracoes_empresa.horario_liberacao_2_estrelas IS 'Horário que entregadores 2 estrelas podem ver agendas';
COMMENT ON COLUMN configuracoes_empresa.horario_liberacao_1_estrela IS 'Horário que entregadores 1 estrela podem ver agendas';
COMMENT ON COLUMN entregadores.estrelas IS 'Classificação do entregador (1-5 estrelas) para controle de prioridade';

-- 9. Verificar resultados
SELECT 'CONFIGURAÇÕES POR CATEGORIA' as info, categoria, COUNT(*) as total 
FROM configuracoes_empresa 
WHERE categoria IS NOT NULL
GROUP BY categoria
UNION ALL
SELECT 'ENTREGADORES POR ESTRELAS' as info, CAST(estrelas AS VARCHAR) as categoria, COUNT(*) as total 
FROM entregadores 
WHERE estrelas IS NOT NULL
GROUP BY estrelas
ORDER BY info, categoria;