-- =====================================================
-- CORRIGIR TABELA user_roles VAZIA - CAUSA RAIZ DO PROBLEMA
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR ESTADO ATUAL DA TABELA user_roles
SELECT 
    'USER_ROLES_ATUAL' as verificacao,
    COUNT(*) as total_registros
FROM user_roles;

-- 2. VERIFICAR ESTRUTURA DA TABELA user_roles
SELECT 
    'ESTRUTURA_USER_ROLES' as verificacao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. CRIAR REGISTROS FALTANTES BASEADOS NOS ENTREGADORES
-- Super Admin (adelson2013gl@gmail.com)
INSERT INTO user_roles (
    user_id, 
    empresa_id, 
    role,
    created_at
) VALUES (
    '2207666a-7d5c-4d47-b39f-4d3688b17da9',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'super_admin',
    NOW()
) ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- Admin da Empresa Modelo 1 (adminempresa1@gmail.com)
INSERT INTO user_roles (
    user_id, 
    empresa_id, 
    role,
    created_at
) VALUES (
    '62374243-9316-42b7-9590-46c3d431eb2e',
    'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a',
    'admin_empresa',
    NOW()
) ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- Entregador ADELSON NASCIMENTO (diferente do Super Admin)
INSERT INTO user_roles (
    user_id, 
    empresa_id, 
    role,
    created_at
) VALUES (
    '86d3d082-090b-46a2-8c7c-0c795c67c728',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'entregador',
    NOW()
) ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- 4. VERIFICAR SE OS REGISTROS FORAM CRIADOS
SELECT 
    'USER_ROLES_APOS_INSERCAO' as verificacao,
    ur.user_id,
    ur.empresa_id,
    ur.role,
    au.email as user_email,
    e.nome as empresa_nome,
    ent.nome as entregador_nome
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN empresas e ON ur.empresa_id = e.id
LEFT JOIN entregadores ent ON ur.user_id = ent.user_id
ORDER BY ur.role, au.email;

-- 5. TESTAR SE AS POLICIES AGORA FUNCIONAM
-- Simular contexto do Super Admin
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '2207666a-7d5c-4d47-b39f-4d3688b17da9';

SELECT 
    'TESTE_POLICY_SUPER_ADMIN' as teste,
    e.id,
    e.nome,
    e.ativa,
    'Super Admin deveria ver esta empresa' as observacao
FROM empresas e
WHERE e.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Resetar contexto
RESET ROLE;

-- 6. TESTAR CONTEXTO DO ADMIN EMPRESA
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '62374243-9316-42b7-9590-46c3d431eb2e';

SELECT 
    'TESTE_POLICY_ADMIN_EMPRESA' as teste,
    e.id,
    e.nome,
    e.ativa,
    'Admin empresa deveria ver apenas sua empresa' as observacao
FROM empresas e
WHERE e.id = 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a';

-- Resetar contexto
RESET ROLE;

-- 7. VERIFICAR VAZAMENTO DE DADOS (não deveria ver empresa de outros)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '62374243-9316-42b7-9590-46c3d431eb2e';

SELECT 
    'TESTE_VAZAMENTO_DADOS' as teste,
    COUNT(*) as empresas_visiveis,
    'Deveria ser 1 (apenas sua empresa)' as observacao
FROM empresas e;

-- Resetar contexto final
RESET ROLE;

-- 8. RESUMO DA CORREÇÃO
SELECT 
    'RESUMO_CORRECAO' as tipo,
    'user_roles criados' as acao,
    COUNT(*) as quantidade
FROM user_roles

UNION ALL

SELECT 
    'RESUMO_CORRECAO' as tipo,
    'super_admins' as acao,
    COUNT(*) as quantidade
FROM user_roles 
WHERE role = 'super_admin'

UNION ALL

SELECT 
    'RESUMO_CORRECAO' as tipo,
    'admin_empresas' as acao,
    COUNT(*) as quantidade
FROM user_roles 
WHERE role = 'admin_empresa'

UNION ALL

SELECT 
    'RESUMO_CORRECAO' as tipo,
    'entregadores' as acao,
    COUNT(*) as quantidade
FROM user_roles 
WHERE role = 'entregador';