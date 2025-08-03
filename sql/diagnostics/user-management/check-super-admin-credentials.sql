-- =====================================================
-- VERIFICAR CREDENCIAIS DO SUPER ADMIN
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR USUÁRIOS COM PAPEL DE SUPER_ADMIN
SELECT 
    'SUPER_ADMINS' as tipo,
    u.id as user_id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at,
    u.role as auth_role,
    u.raw_user_meta_data
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'super_admin';

-- 2. VERIFICAR SE EXISTEM TABELAS DE ADMIN
SELECT 
    'TABELAS_ADMIN' as tipo,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%admin%' OR table_name LIKE '%user%');

-- 3. VERIFICAR SE EXISTE USUÁRIO PADRÃO CRIADO NA MIGRAÇÃO
SELECT 
    'USUARIOS_AUTH' as tipo,
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    COALESCE(u.raw_user_meta_data->>'role', 'sem_role') as user_role,
    u.raw_user_meta_data
FROM auth.users u
ORDER BY u.created_at
LIMIT 10;

-- 4. VERIFICAR ENTREGADORES QUE PODEM TER ACESSO ADMIN
SELECT 
    'ENTREGADORES_ADMIN' as tipo,
    e.id,
    e.email,
    e.nome,
    e.user_id,
    e.empresa_id,
    emp.nome as empresa_nome
FROM entregadores e
LEFT JOIN empresas emp ON e.empresa_id = emp.id
WHERE e.email IS NOT NULL
ORDER BY e.created_at
LIMIT 5;

-- 5. VERIFICAR EMPRESAS ATIVAS PARA TESTAR LOGIN ADMIN
SELECT 
    'EMPRESAS_ATIVAS' as tipo,
    emp.id as empresa_id,
    emp.nome as empresa_nome,
    emp.email as empresa_email,
    emp.ativa,
    COUNT(e.id) as total_entregadores
FROM empresas emp
LEFT JOIN entregadores e ON emp.id = e.empresa_id
WHERE emp.ativa = true
GROUP BY emp.id, emp.nome, emp.email, emp.ativa
ORDER BY emp.created_at;

-- 6. VERIFICAR SE PRECISA CRIAR UM SUPER ADMIN
SELECT 
    'VERIFICACAO_SUPER_ADMIN' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.raw_user_meta_data->>'role' = 'super_admin'
        ) THEN 'Super admin já existe'
        ELSE 'Precisa criar super admin'
    END as resultado;