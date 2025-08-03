-- =====================================================
-- INVESTIGAR RLS POLICIES QUE BLOQUEIAM ACESSO À EMPRESA
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR SE A EMPRESA EXISTE NA TABELA
SELECT 
    'EMPRESA_EXISTE' as verificacao,
    e.id,
    e.nome,
    e.email,
    e.ativa,
    e.created_at
FROM empresas e
WHERE e.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- 2. VERIFICAR TODAS AS EMPRESAS EXISTENTES
SELECT 
    'TODAS_EMPRESAS' as verificacao,
    e.id,
    e.nome,
    e.email,
    e.ativa,
    COUNT(ent.id) as total_entregadores
FROM empresas e
LEFT JOIN entregadores ent ON e.id = ent.empresa_id
GROUP BY e.id, e.nome, e.email, e.ativa
ORDER BY e.created_at;

-- 3. VERIFICAR RLS POLICIES NA TABELA EMPRESAS
SELECT 
    'POLICIES_EMPRESAS' as tipo,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'empresas'
ORDER BY policyname;

-- 4. VERIFICAR ENTREGADOR QUE ESTÁ TENTANDO ACESSAR
SELECT 
    'ENTREGADOR_LOGADO' as verificacao,
    e.id as entregador_id,
    e.user_id,
    e.empresa_id,
    e.nome,
    e.email,
    e.perfil,
    e.status,
    emp.nome as empresa_nome,
    emp.ativa as empresa_ativa
FROM entregadores e
LEFT JOIN empresas emp ON e.empresa_id = emp.id
WHERE e.user_id = '2207666a-7d5c-4d47-b39f-4d3688b17da9'
   OR e.email LIKE '%adelson%';

-- 5. VERIFICAR MAPEAMENTO DE EMAILS INCONSISTENTE
SELECT 
    'MAPEAMENTO_AUTH_ENTREGADORES' as verificacao,
    'AUTH_USERS' as fonte,
    au.id as user_id,
    au.email,
    au.created_at,
    'N/A' as entregador_nome,
    'N/A' as empresa_id
FROM auth.users au
WHERE au.email LIKE '%adelson%' OR au.email LIKE '%admin%'

UNION ALL

SELECT 
    'MAPEAMENTO_AUTH_ENTREGADORES' as verificacao,
    'ENTREGADORES' as fonte,
    e.user_id,
    e.email,
    e.created_at,
    e.nome as entregador_nome,
    e.empresa_id::text
FROM entregadores e
WHERE e.email LIKE '%adelson%' OR e.email LIKE '%admin%'
ORDER BY fonte, email;

-- 6. TESTAR ACESSO COM DIFERENTES CONTEXTOS DE USUÁRIO
-- Simular acesso como usuário específico
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '2207666a-7d5c-4d47-b39f-4d3688b17da9';

-- Tentar acessar empresa com contexto do usuário
SELECT 
    'TESTE_ACESSO_COM_CONTEXTO' as teste,
    e.id,
    e.nome,
    e.ativa
FROM empresas e
WHERE e.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Resetar contexto
RESET ROLE;

-- 7. VERIFICAR SE RLS ESTÁ HABILITADO E FUNCIONANDO
SELECT 
    'RLS_STATUS' as verificacao,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'empresas') as total_policies
FROM pg_tables 
WHERE tablename = 'empresas' AND schemaname = 'public';

-- 8. VERIFICAR FUNÇÃO auth.uid() NO CONTEXTO ATUAL
SELECT 
    'CONTEXTO_AUTH' as verificacao,
    auth.uid() as user_id_atual,
    current_user as usuario_postgres,
    session_user as usuario_sessao;

-- 9. VERIFICAR SE O PROBLEMA É NA POLICY ESPECÍFICA
-- Tentar query que deveria funcionar baseada nas policies existentes
SELECT 
    'TESTE_POLICY_LOGIC' as teste,
    e.id as empresa_id,
    e.nome as empresa_nome,
    (
        SELECT COUNT(*) 
        FROM entregadores ent 
        WHERE ent.empresa_id = e.id 
          AND ent.user_id = '2207666a-7d5c-4d47-b39f-4d3688b17da9'
    ) as entregador_pertence_empresa
FROM empresas e
WHERE e.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';