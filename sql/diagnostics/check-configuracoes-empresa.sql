-- =========================================
-- DIAGNÓSTICO: Verificar configurações da empresa
-- =========================================

-- 1. Estrutura da tabela configuracoes_empresa
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'configuracoes_empresa' 
ORDER BY ordinal_position;

-- 2. Listar todas as configurações existentes por empresa
SELECT 
    ce.empresa_id,
    e.nome as empresa_nome,
    ce.chave,
    ce.valor,
    ce.tipo,
    ce.categoria,
    ce.descricao,
    ce.horario_liberacao_5_estrelas,
    ce.horario_liberacao_4_estrelas,
    ce.horario_liberacao_3_estrelas,
    ce.horario_liberacao_2_estrelas,
    ce.horario_liberacao_1_estrela,
    ce.created_at
FROM configuracoes_empresa ce
JOIN empresas e ON e.id = ce.empresa_id
ORDER BY e.nome, ce.categoria, ce.chave;

-- 3. Verificar especificamente as configurações de priorização
SELECT 
    e.nome as empresa_nome,
    ce.chave,
    ce.valor,
    ce.tipo,
    CASE 
        WHEN ce.chave = 'habilitarPriorizacao' AND ce.valor = 'true' THEN 'HABILITADO'
        WHEN ce.chave = 'habilitarPriorizacao' AND ce.valor = 'false' THEN 'DESABILITADO'
        WHEN ce.chave = 'habilitarPriorizacaoHorarios' AND ce.valor = 'true' THEN 'HABILITADO'
        WHEN ce.chave = 'habilitarPriorizacaoHorarios' AND ce.valor = 'false' THEN 'DESABILITADO'
        ELSE 'N/A'
    END as status_priorizacao
FROM configuracoes_empresa ce
JOIN empresas e ON e.id = ce.empresa_id
WHERE ce.chave IN ('habilitarPriorizacao', 'habilitarPriorizacaoHorarios')
ORDER BY e.nome;

-- 4. Contar configurações por empresa
SELECT 
    e.nome as empresa_nome,
    COUNT(ce.id) as total_configuracoes,
    COUNT(CASE WHEN ce.categoria = 'priorizacao' THEN 1 END) as configs_priorizacao,
    COUNT(CASE WHEN ce.categoria = 'horarios' THEN 1 END) as configs_horarios,
    COUNT(CASE WHEN ce.categoria = 'agendamento' THEN 1 END) as configs_agendamento
FROM empresas e
LEFT JOIN configuracoes_empresa ce ON e.id = ce.empresa_id
GROUP BY e.id, e.nome
ORDER BY e.nome;

-- 5. Verificar empresas SEM configurações de priorização
SELECT 
    e.id,
    e.nome,
    'FALTANDO CONFIG' as status
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM configuracoes_empresa ce 
    WHERE ce.empresa_id = e.id 
    AND ce.chave IN ('habilitarPriorizacao', 'habilitarPriorizacaoHorarios')
)
AND e.ativa = true;

-- 6. Verificar entregadores com 1 estrela que podem estar sendo afetados
SELECT 
    ent.id,
    ent.nome,
    ent.estrelas,
    e.nome as empresa_nome,
    CASE 
        WHEN ce.valor = 'true' THEN 'PRIORIZAÇÃO ATIVA - deve bloquear'
        WHEN ce.valor = 'false' THEN 'PRIORIZAÇÃO INATIVA - não bloqueia'
        ELSE 'SEM CONFIGURAÇÃO'
    END as status_bloqueio_esperado
FROM entregadores ent
JOIN empresas e ON e.id = ent.empresa_id
LEFT JOIN configuracoes_empresa ce ON ce.empresa_id = e.id 
    AND ce.chave IN ('habilitarPriorizacao', 'habilitarPriorizacaoHorarios')
WHERE ent.estrelas = 1 
AND ent.ativo = true
ORDER BY e.nome, ent.nome;

-- 7. Sugestão de configurações que devem ser inseridas
SELECT 
    'INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo, categoria, descricao) VALUES' as sql_sugerido,
    '(''' || e.id || ''', ''habilitarPriorizacaoHorarios'', ''true'', ''boolean'', ''priorizacao'', ''Habilitar sistema de horários específicos por estrelas'');' as insert_statement
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM configuracoes_empresa ce 
    WHERE ce.empresa_id = e.id 
    AND ce.chave = 'habilitarPriorizacaoHorarios'
)
AND e.ativa = true;