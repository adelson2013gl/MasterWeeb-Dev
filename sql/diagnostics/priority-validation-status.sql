-- =========================================
-- DIAGNÓSTICO: Status da validação de priorização
-- =========================================

-- 🔍 1. VERIFICAR STATUS ATUAL DAS CONFIGURAÇÕES
SELECT 
    'DIAGNÓSTICO CONFIGURAÇÕES DE PRIORIZAÇÃO' as secao,
    '=====================================' as separador;

-- 🏢 2. STATUS POR EMPRESA
SELECT 
    e.nome as empresa_nome,
    e.ativa as empresa_ativa,
    CASE 
        WHEN ce_prio.valor = 'true' THEN '✅ ATIVO'
        WHEN ce_prio.valor = 'false' THEN '❌ DESATIVO'
        ELSE '⚠️ SEM CONFIG'
    END as status_priorizacao,
    CASE 
        WHEN ce_horarios.chave IS NOT NULL THEN '✅ CONFIGURADO'
        ELSE '❌ FALTANDO'
    END as status_horarios,
    ce_horarios.horario_liberacao_1_estrela as horario_1_estrela,
    COUNT(ent.id) FILTER (WHERE ent.estrelas = 1 AND ent.ativo = true) as entregadores_1_estrela
FROM empresas e
LEFT JOIN configuracoes_empresa ce_prio ON ce_prio.empresa_id = e.id 
    AND ce_prio.chave = 'habilitarPriorizacaoHorarios'
LEFT JOIN configuracoes_empresa ce_horarios ON ce_horarios.empresa_id = e.id 
    AND ce_horarios.chave = 'horarios_configurados'
LEFT JOIN entregadores ent ON ent.empresa_id = e.id
WHERE e.ativa = true
GROUP BY e.id, e.nome, e.ativa, ce_prio.valor, ce_horarios.chave, ce_horarios.horario_liberacao_1_estrela
ORDER BY e.nome;

-- 🎯 3. ENTREGADORES 1 ESTRELA QUE SERÃO AFETADOS
SELECT 
    'ENTREGADORES 1 ESTRELA ATUALMENTE AFETADOS' as secao;

SELECT 
    ent.nome as entregador_nome,
    e.nome as empresa_nome,
    ent.estrelas,
    CASE 
        WHEN ce.valor = 'true' THEN '🚫 BLOQUEADO até 10:30'
        WHEN ce.valor = 'false' THEN '✅ SEM RESTRIÇÃO'
        ELSE '⚠️ SEM CONFIG (sem restrição)'
    END as status_atual,
    ce_horarios.horario_liberacao_1_estrela as horario_liberacao
FROM entregadores ent
JOIN empresas e ON e.id = ent.empresa_id
LEFT JOIN configuracoes_empresa ce ON ce.empresa_id = e.id 
    AND ce.chave = 'habilitarPriorizacaoHorarios'
LEFT JOIN configuracoes_empresa ce_horarios ON ce_horarios.empresa_id = e.id 
    AND ce_horarios.chave = 'horarios_configurados'
WHERE ent.estrelas = 1 
    AND ent.ativo = true 
    AND e.ativa = true
ORDER BY e.nome, ent.nome;

-- 📊 4. RESUMO GERAL
SELECT 
    'RESUMO ESTATÍSTICO' as secao;

SELECT 
    COUNT(DISTINCT e.id) as total_empresas_ativas,
    COUNT(DISTINCT CASE WHEN ce_prio.valor = 'true' THEN e.id END) as empresas_com_priorizacao_ativa,
    COUNT(DISTINCT CASE WHEN ce_prio.valor = 'false' THEN e.id END) as empresas_com_priorizacao_desativa,
    COUNT(DISTINCT CASE WHEN ce_prio.chave IS NULL THEN e.id END) as empresas_sem_configuracao,
    COUNT(DISTINCT CASE WHEN ce_horarios.chave IS NOT NULL THEN e.id END) as empresas_com_horarios_configurados,
    COUNT(ent.id) FILTER (WHERE ent.estrelas = 1 AND ent.ativo = true) as total_entregadores_1_estrela
FROM empresas e
LEFT JOIN configuracoes_empresa ce_prio ON ce_prio.empresa_id = e.id 
    AND ce_prio.chave = 'habilitarPriorizacaoHorarios'
LEFT JOIN configuracoes_empresa ce_horarios ON ce_horarios.empresa_id = e.id 
    AND ce_horarios.chave = 'horarios_configurados'
LEFT JOIN entregadores ent ON ent.empresa_id = e.id
WHERE e.ativa = true;

-- 🚨 5. PROBLEMAS IDENTIFICADOS
SELECT 
    'PROBLEMAS ENCONTRADOS' as secao;

-- Empresas sem configuração de priorização
SELECT 
    'FALTA CONFIG PRIORIZAÇÃO' as problema,
    e.nome as empresa_nome,
    'INSERT configuração habilitarPriorizacaoHorarios' as solucao
FROM empresas e
WHERE e.ativa = true
    AND NOT EXISTS (
        SELECT 1 FROM configuracoes_empresa ce 
        WHERE ce.empresa_id = e.id 
        AND ce.chave = 'habilitarPriorizacaoHorarios'
    )

UNION ALL

-- Empresas sem configuração de horários
SELECT 
    'FALTA CONFIG HORÁRIOS' as problema,
    e.nome as empresa_nome,
    'INSERT configuração horarios_configurados' as solucao
FROM empresas e
WHERE e.ativa = true
    AND NOT EXISTS (
        SELECT 1 FROM configuracoes_empresa ce 
        WHERE ce.empresa_id = e.id 
        AND ce.chave = 'horarios_configurados'
    )

UNION ALL

-- Empresas com priorização desabilitada
SELECT 
    'PRIORIZAÇÃO DESABILITADA' as problema,
    e.nome as empresa_nome,
    'UPDATE valor = true na configuração existente' as solucao
FROM empresas e
JOIN configuracoes_empresa ce ON ce.empresa_id = e.id
WHERE e.ativa = true
    AND ce.chave = 'habilitarPriorizacaoHorarios'
    AND ce.valor = 'false';

-- 💡 6. PRÓXIMOS PASSOS RECOMENDADOS
SELECT 
    'AÇÕES RECOMENDADAS' as secao,
    'Execute o script enable-priority-validation.sql para corrigir' as acao;