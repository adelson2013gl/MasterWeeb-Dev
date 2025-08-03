-- =====================================================
-- AUDITORIA E CORREÇÃO DE VAZAMENTO DE DADOS
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR VAZAMENTO DE DADOS ENTRE EMPRESAS
-- Cidades de diferentes empresas sendo vistas por admin
SELECT 
    'VAZAMENTO_CIDADES' as tipo_problema,
    c1.empresa_id as empresa_cidade,
    COUNT(*) as total_cidades_visiveis
FROM cidades c1
CROSS JOIN (
    -- Simular um admin logado de uma empresa específica
    SELECT 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a' as empresa_admin
) admin
WHERE c1.empresa_id != admin.empresa_admin
GROUP BY c1.empresa_id;

-- 2. VERIFICAR TURNOS DE DIFERENTES EMPRESAS
SELECT 
    'VAZAMENTO_TURNOS' as tipo_problema,
    t.empresa_id as empresa_turno,
    COUNT(*) as total_turnos_visiveis
FROM turnos t
CROSS JOIN (
    SELECT 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a' as empresa_admin
) admin
WHERE t.empresa_id != admin.empresa_admin
GROUP BY t.empresa_id;

-- 3. CORRIGIR CONSULTAS QUE NÃO FILTRAM POR empresa_id
-- Verificar se existem registros sem empresa_id
SELECT 
    'DADOS_ORFAOS' as tipo_problema,
    'cidades' as tabela,
    COUNT(*) as registros_sem_empresa_id
FROM cidades 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
    'DADOS_ORFAOS' as tipo_problema,
    'turnos' as tabela,
    COUNT(*) as registros_sem_empresa_id
FROM turnos 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
    'DADOS_ORFAOS' as tipo_problema,
    'entregadores' as tabela,
    COUNT(*) as registros_sem_empresa_id
FROM entregadores 
WHERE empresa_id IS NULL;

-- 4. VERIFICAR REGIÕES ÓRFÃS (agora que adicionamos empresa_id)
SELECT 
    'REGIOES_ORFAS' as tipo_problema,
    COUNT(*) as regioes_sem_empresa
FROM regioes 
WHERE empresa_id IS NULL;

-- 5. CORRIGIR REGIÕES ÓRFÃS baseado nas cidades
UPDATE regioes 
SET empresa_id = (
    SELECT empresa_id 
    FROM cidades 
    WHERE cidades.id = regioes.cidade_id
    LIMIT 1
)
WHERE empresa_id IS NULL
  AND cidade_id IS NOT NULL;

-- 6. VERIFICAR INTEGRIDADE REFERENCIAL
-- Regiões que referenciam cidades de outras empresas
SELECT 
    'INTEGRIDADE_PROBLEMA' as tipo_problema,
    r.id as regiao_id,
    r.empresa_id as regiao_empresa,
    c.empresa_id as cidade_empresa
FROM regioes r
JOIN cidades c ON r.cidade_id = c.id
WHERE r.empresa_id != c.empresa_id;

-- 7. CORRIGIR PROBLEMA DE INTEGRIDADE
-- Atualizar empresa_id das regiões para corresponder à cidade
UPDATE regioes 
SET empresa_id = cidades.empresa_id
FROM cidades 
WHERE regioes.cidade_id = cidades.id 
  AND regioes.empresa_id != cidades.empresa_id;

-- 8. VERIFICAR POLICIES DE SEGURANÇA EXISTENTES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('cidades', 'turnos', 'regioes', 'entregadores', 'empresas')
ORDER BY tablename, policyname;

-- 9. RESUMO DE SEGURANÇA POR EMPRESA
SELECT 
    e.nome as empresa_nome,
    e.id as empresa_id,
    COUNT(DISTINCT c.id) as total_cidades,
    COUNT(DISTINCT r.id) as total_regioes,
    COUNT(DISTINCT t.id) as total_turnos,
    COUNT(DISTINCT ent.id) as total_entregadores
FROM empresas e
LEFT JOIN cidades c ON e.id = c.empresa_id
LEFT JOIN regioes r ON e.id = r.empresa_id  
LEFT JOIN turnos t ON e.id = t.empresa_id
LEFT JOIN entregadores ent ON e.id = ent.empresa_id
GROUP BY e.id, e.nome
ORDER BY e.nome;

-- 10. VERIFICAR SE ADMIN VÊ APENAS DADOS DA SUA EMPRESA
-- Simulação de consulta de admin específico
WITH admin_empresa AS (
    SELECT 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a' as empresa_id
)
SELECT 
    'VISIBILIDADE_ADMIN' as verificacao,
    'cidades_visiveis' as recurso,
    COUNT(*) as total_registros
FROM cidades c, admin_empresa ae
WHERE c.empresa_id = ae.empresa_id

UNION ALL

SELECT 
    'VISIBILIDADE_ADMIN' as verificacao,
    'turnos_visiveis' as recurso,
    COUNT(*) as total_registros
FROM turnos t, admin_empresa ae
WHERE t.empresa_id = ae.empresa_id

UNION ALL

SELECT 
    'VISIBILIDADE_ADMIN' as verificacao,
    'regioes_visiveis' as recurso,
    COUNT(*) as total_registros
FROM regioes r, admin_empresa ae
WHERE r.empresa_id = ae.empresa_id;