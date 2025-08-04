-- =====================================================
-- DIAGNÓSTICO: EMPRESA INATIVA EM PRODUÇÃO
-- Para usuário: adelson2013gl@gmail.com
-- Problema: Empresa inativa apenas em produção, local funciona
-- =====================================================

-- 1. IDENTIFICAR USUÁRIO E SUAS INFORMAÇÕES
SELECT 
    '=== DADOS DO USUÁRIO ===' as secao,
    au.id as user_id,
    au.email,
    au.created_at as user_created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM auth.users au
WHERE au.email = 'adelson2013gl@gmail.com';

-- 2. VERIFICAR ENTREGADOR ASSOCIADO
SELECT 
    '=== DADOS DO ENTREGADOR ===' as secao,
    e.id as entregador_id,
    e.user_id,
    e.nome,
    e.email,
    e.perfil,
    e.status,
    e.empresa_id,
    e.created_at as entregador_created_at
FROM entregadores e
LEFT JOIN auth.users au ON e.user_id = au.id
WHERE au.email = 'adelson2013gl@gmail.com'
   OR e.email = 'adelson2013gl@gmail.com';

-- 3. VERIFICAR USER_ROLES DO USUÁRIO
SELECT 
    '=== USER ROLES ===' as secao,
    ur.id as role_id,
    ur.user_id,
    ur.empresa_id,
    ur.role,
    ur.ativo as role_ativo,
    ur.created_at as role_created_at,
    ur.updated_at as role_updated_at
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'adelson2013gl@gmail.com';

-- 4. VERIFICAR EMPRESA(S) ASSOCIADA(S) AO USUÁRIO
SELECT 
    '=== EMPRESAS ASSOCIADAS ===' as secao,
    emp.id as empresa_id,
    emp.nome as empresa_nome,
    emp.email as empresa_email,
    emp.cnpj,
    emp.ativa,  -- CAMPO CRÍTICO
    emp.plano_atual,
    emp.data_expiracao,
    emp.admin_user_id,
    emp.created_at as empresa_created_at,
    emp.updated_at as empresa_updated_at,
    'Via Entregador' as fonte
FROM empresas emp
INNER JOIN entregadores e ON emp.id = e.empresa_id
LEFT JOIN auth.users au ON e.user_id = au.id
WHERE au.email = 'adelson2013gl@gmail.com'

UNION ALL

SELECT 
    '=== EMPRESAS ASSOCIADAS ===' as secao,
    emp.id as empresa_id,
    emp.nome as empresa_nome,
    emp.email as empresa_email,
    emp.cnpj,
    emp.ativa,  -- CAMPO CRÍTICO
    emp.plano_atual,
    emp.data_expiracao,
    emp.admin_user_id,
    emp.created_at as empresa_created_at,
    emp.updated_at as empresa_updated_at,
    'Via User Roles' as fonte
FROM empresas emp
INNER JOIN user_roles ur ON emp.id = ur.empresa_id
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'adelson2013gl@gmail.com';

-- 5. VERIFICAR SE USUÁRIO É ADMIN DE ALGUMA EMPRESA
SELECT 
    '=== EMPRESAS COMO ADMIN ===' as secao,
    emp.id as empresa_id,
    emp.nome as empresa_nome,
    emp.ativa,  -- CAMPO CRÍTICO
    emp.admin_user_id,
    'Usuário é admin desta empresa' as observacao
FROM empresas emp
LEFT JOIN auth.users au ON emp.admin_user_id = au.id
WHERE au.email = 'adelson2013gl@gmail.com';

-- 6. INVESTIGAR LOGS DE ALTERAÇÃO (se existir tabela de auditoria)
SELECT 
    '=== HISTÓRICO DE ALTERAÇÕES ===' as secao,
    'Verificar se existe tabela de auditoria' as observacao;

-- 7. VERIFICAR CONFIGURAÇÕES DA EMPRESA ESPECÍFICA
-- (usando empresa padrão do sistema baseada nos scripts)
SELECT 
    '=== CONFIGURAÇÕES EMPRESA PADRÃO ===' as secao,
    emp.id,
    emp.nome,
    emp.ativa,
    emp.plano_atual,
    emp.max_entregadores,
    emp.max_agendas_mes,
    emp.data_expiracao,
    CASE 
        WHEN emp.data_expiracao IS NULL THEN 'Sem expiração'
        WHEN emp.data_expiracao > NOW() THEN 'Válida'
        ELSE 'EXPIRADA'
    END as status_expiracao
FROM empresas emp
WHERE emp.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';  -- ID da empresa padrão

-- 8. TESTAR CONTEXTO DE SEGURANÇA (RLS)
-- Simular acesso como o usuário específico
SELECT 
    '=== TESTE RLS CONTEXT ===' as secao,
    'Preparando teste de contexto RLS' as observacao;

-- Definir contexto do usuário
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Buscar UUID do usuário
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'adelson2013gl@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Configurar contexto RLS
        PERFORM set_config('request.jwt.claim.sub', user_uuid::text, true);
        PERFORM set_config('role', 'authenticated', true);
        
        RAISE NOTICE 'Contexto RLS configurado para usuário: %', user_uuid;
    ELSE
        RAISE NOTICE 'Usuário não encontrado: adelson2013gl@gmail.com';
    END IF;
END $$;

-- 9. EMPRESAS VISÍVEIS NO CONTEXTO DO USUÁRIO
SELECT 
    '=== EMPRESAS VISÍVEIS COM RLS ===' as secao,
    e.id,
    e.nome,
    e.ativa,
    e.plano_atual,
    'Empresa visível com RLS ativo' as observacao
FROM empresas e
ORDER BY e.nome;

-- 10. RESUMO DO PROBLEMA
SELECT 
    '=== RESUMO DIAGNÓSTICO ===' as secao,
    COUNT(CASE WHEN emp.ativa = true THEN 1 END) as empresas_ativas,
    COUNT(CASE WHEN emp.ativa = false THEN 1 END) as empresas_inativas,
    COUNT(*) as total_empresas_usuario
FROM empresas emp
WHERE emp.id IN (
    -- Empresas via entregador
    SELECT DISTINCT e.empresa_id 
    FROM entregadores e
    LEFT JOIN auth.users au ON e.user_id = au.id
    WHERE au.email = 'adelson2013gl@gmail.com'
    
    UNION
    
    -- Empresas via user_roles
    SELECT DISTINCT ur.empresa_id 
    FROM user_roles ur
    LEFT JOIN auth.users au ON ur.user_id = au.id
    WHERE au.email = 'adelson2013gl@gmail.com'
    
    UNION
    
    -- Empresas onde é admin
    SELECT DISTINCT emp2.id 
    FROM empresas emp2
    LEFT JOIN auth.users au ON emp2.admin_user_id = au.id
    WHERE au.email = 'adelson2013gl@gmail.com'
);

-- 11. INSTRUÇÕES PARA CORREÇÃO
SELECT 
    '=== INSTRUÇÕES CORREÇÃO ===' as secao,
    'Se empresa estiver com ativa=false, executar:' as instrucao,
    'UPDATE empresas SET ativa = true, updated_at = NOW() WHERE id = [empresa_id];' as comando_sql;

-- Resetar contexto
RESET ROLE;
SELECT pg_advisory_unlock_all();