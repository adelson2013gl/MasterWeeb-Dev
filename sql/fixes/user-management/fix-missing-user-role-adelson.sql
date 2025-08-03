-- =====================================================
-- CORRIGIR user_roles PARA USUÁRIO adelson2013gl@gmail.com
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR SITUAÇÃO ATUAL DO USUÁRIO
SELECT 
    'SITUACAO_ATUAL' as verificacao,
    'AUTH_USER' as fonte,
    au.id as user_id,
    au.email,
    NULL::text as role,
    NULL::text as empresa_id
FROM auth.users au
WHERE au.id = '2207666a-7d5c-4d47-b39f-4d3688b17da9'

UNION ALL

SELECT 
    'SITUACAO_ATUAL' as verificacao,
    'ENTREGADOR' as fonte,
    e.user_id,
    e.email,
    e.perfil::text as role,
    e.empresa_id::text
FROM entregadores e
WHERE e.user_id = '2207666a-7d5c-4d47-b39f-4d3688b17da9'

UNION ALL

SELECT 
    'SITUACAO_ATUAL' as verificacao,
    'USER_ROLES' as fonte,
    ur.user_id,
    NULL::text as email,
    ur.role::text,
    COALESCE(ur.empresa_id::text, 'NULL') as empresa_id
FROM user_roles ur
WHERE ur.user_id = '2207666a-7d5c-4d47-b39f-4d3688b17da9';

-- 2. CRIAR REGISTRO FALTANTE PARA O USUÁRIO
-- Como o entregador tem perfil 'admin', vou criar como super_admin
INSERT INTO user_roles (
    user_id, 
    empresa_id, 
    role,
    ativo,
    created_at,
    updated_at
) VALUES (
    '2207666a-7d5c-4d47-b39f-4d3688b17da9',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'super_admin',
    true,
    NOW(),
    NOW()
);

-- 3. VERIFICAR SE O REGISTRO FOI CRIADO
SELECT 
    'REGISTRO_CRIADO' as verificacao,
    ur.id,
    ur.user_id,
    ur.empresa_id,
    ur.role,
    ur.ativo,
    au.email,
    e.nome as empresa_nome
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN empresas e ON ur.empresa_id = e.id
WHERE ur.user_id = '2207666a-7d5c-4d47-b39f-4d3688b17da9';

-- 4. TESTAR SE A POLICY AGORA FUNCIONA
-- Simular contexto do usuário
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '2207666a-7d5c-4d47-b39f-4d3688b17da9';

SELECT 
    'TESTE_ACESSO_EMPRESA' as teste,
    e.id,
    e.nome,
    e.ativa,
    'Usuário deveria ver esta empresa agora' as observacao
FROM empresas e
WHERE e.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Resetar contexto
RESET ROLE;

-- 5. TESTAR ACESSO COMO SUPER ADMIN (deve ver todas as empresas)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '2207666a-7d5c-4d47-b39f-4d3688b17da9';

SELECT 
    'TESTE_SUPER_ADMIN_TODAS_EMPRESAS' as teste,
    e.id,
    e.nome,
    e.ativa,
    'Super admin deve ver todas as empresas' as observacao
FROM empresas e
ORDER BY e.nome;

-- Resetar contexto
RESET ROLE;

-- 6. VERIFICAR ESTRUTURA FINAL DA user_roles
SELECT 
    'ESTRUTURA_FINAL' as verificacao,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
    COUNT(CASE WHEN role = 'admin_empresa' THEN 1 END) as admin_empresas,
    COUNT(CASE WHEN role = 'entregador' THEN 1 END) as entregadores
FROM user_roles;

-- 7. RESUMO DOS USUÁRIOS E SUAS ROLES
SELECT 
    'RESUMO_USUARIOS' as verificacao,
    au.email,
    ur.role,
    e.nome as empresa_nome,
    ur.ativo
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN empresas e ON ur.empresa_id = e.id
WHERE ur.ativo = true
ORDER BY ur.role, au.email;