-- =====================================================
-- REMOVER POLICIES CONFLITANTES QUE COMPROMETEM SEGURANÇA
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR POLICIES ATUAIS ANTES DA REMOÇÃO
SELECT 
    'ANTES_REMOCAO' as momento,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('regioes', 'assinaturas')
ORDER BY tablename, policyname;

-- 2. REMOVER POLICY CONFLITANTE NA TABELA regioes
-- Esta policy permite que qualquer um veja regiões ativas (PERIGOSO!)
DROP POLICY IF EXISTS "Qualquer um pode ver regiões ativas" ON regioes;

-- 3. REMOVER POLICY CONFLITANTE NA TABELA assinaturas  
-- Esta policy permite que usuários vejam assinaturas com Asaas (PERIGOSO!)
DROP POLICY IF EXISTS "Usuários podem ver suas assinaturas com Asaas" ON assinaturas;

-- 4. VERIFICAR SE EXISTEM OUTRAS POLICIES PROBLEMÁTICAS
-- Buscar policies que não filtram por empresa_id
SELECT 
    'POLICIES_SUSPEITAS' as tipo,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual -- Esta coluna mostra a condição USING da policy
FROM pg_policies 
WHERE tablename IN ('cidades', 'turnos', 'regioes', 'assinaturas', 'entregadores')
  AND (
    qual NOT LIKE '%empresa_id%' 
    OR qual IS NULL
    OR policyname LIKE '%qualquer%'
    OR policyname LIKE '%todos%'
    OR policyname LIKE '%geral%'
  )
ORDER BY tablename, policyname;

-- 5. VERIFICAR POLICIES RESTANTES APÓS REMOÇÃO
SELECT 
    'APOS_REMOCAO' as momento,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename IN ('regioes', 'assinaturas')
ORDER BY tablename, policyname;

-- 6. VERIFICAR SE AINDA EXISTEM POLICIES GLOBAIS PERIGOSAS
-- Listar todas as policies que NÃO filtram por empresa_id
SELECT 
    'POLICIES_PERIGOSAS_RESTANTES' as alerta,
    tablename,
    policyname,
    qual
FROM pg_policies 
WHERE tablename IN ('cidades', 'turnos', 'regioes', 'assinaturas', 'entregadores')
  AND (
    qual NOT LIKE '%empresa_id%' 
    AND qual IS NOT NULL
    AND qual != ''
  )
ORDER BY tablename, policyname;

-- 7. TESTAR ISOLAMENTO DE DADOS
-- Simular consulta de admin específico para verificar se vê apenas dados da sua empresa
WITH admin_teste AS (
    SELECT 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a'::uuid as empresa_id_admin
)
SELECT 
    'TESTE_ISOLAMENTO' as verificacao,
    'regioes' as tabela,
    COUNT(*) as registros_visiveis,
    COUNT(DISTINCT empresa_id) as empresas_distintas
FROM regioes r, admin_teste at
WHERE r.empresa_id = at.empresa_id_admin

UNION ALL

SELECT 
    'TESTE_ISOLAMENTO' as verificacao,
    'assinaturas' as tabela,
    COUNT(*) as registros_visiveis,
    COUNT(DISTINCT empresa_id) as empresas_distintas
FROM assinaturas a, admin_teste at
WHERE a.empresa_id = at.empresa_id_admin;

-- 8. VERIFICAR VAZAMENTO DE DADOS APÓS CORREÇÃO
-- Este deve retornar 0 registros para cada empresa diferente
WITH admin_teste AS (
    SELECT 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a'::uuid as empresa_admin
)
SELECT 
    'VAZAMENTO_REGIOES_APOS_CORRECAO' as teste,
    r.empresa_id,
    COUNT(*) as regioes_de_outras_empresas
FROM regioes r, admin_teste at
WHERE r.empresa_id != at.empresa_admin
GROUP BY r.empresa_id

UNION ALL

SELECT 
    'VAZAMENTO_ASSINATURAS_APOS_CORRECAO' as teste,
    a.empresa_id,
    COUNT(*) as assinaturas_de_outras_empresas
FROM assinaturas a, admin_teste at
WHERE a.empresa_id != at.empresa_admin
GROUP BY a.empresa_id;

-- 9. RELATÓRIO FINAL DE SEGURANÇA
SELECT 
    'RELATORIO_SEGURANCA_FINAL' as tipo,
    COUNT(CASE WHEN qual LIKE '%empresa_id%' THEN 1 END) as policies_com_isolamento,
    COUNT(CASE WHEN qual NOT LIKE '%empresa_id%' AND qual IS NOT NULL THEN 1 END) as policies_sem_isolamento,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('cidades', 'turnos', 'regioes', 'assinaturas', 'entregadores');

-- 10. RESUMO DAS TABLES COM RLS HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('cidades', 'turnos', 'regioes', 'assinaturas', 'entregadores', 'empresas')
  AND schemaname = 'public'
ORDER BY tablename;