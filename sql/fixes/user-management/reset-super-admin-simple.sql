-- =====================================================
-- RESETAR SENHA DO SUPER ADMIN - VERSÃO SIMPLES
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. CONFIRMAR EMAIL E DEFINIR COMO SUPER ADMIN
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb,
    updated_at = NOW()
WHERE email = 'admin@masterweeb.com';

-- 2. VERIFICAR O USUÁRIO ATUALIZADO
SELECT 
    'USUARIO_ATUALIZADO' as status,
    u.id,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmado,
    u.raw_user_meta_data->>'role' as role,
    u.created_at,
    u.updated_at
FROM auth.users u
WHERE u.email = 'admin@masterweeb.com';

-- 3. VERIFICAR ENTREGADOR CORRESPONDENTE
SELECT 
    'ENTREGADOR_INFO' as tipo,
    e.id,
    e.nome,
    e.email,
    e.perfil,
    e.status,
    e.user_id,
    emp.nome as empresa_nome
FROM entregadores e
LEFT JOIN empresas emp ON e.empresa_id = emp.id
WHERE e.email = 'admin@masterweeb.com';

-- INSTRUÇÕES PARA RESETAR SENHA:
-- Depois de executar este script, vá para:
-- Supabase Dashboard > Authentication > Users
-- Encontre o usuário admin@masterweeb.com
-- Clique nos 3 pontinhos > "Reset Password"
-- Ou use "Send Magic Link" para fazer login sem senha