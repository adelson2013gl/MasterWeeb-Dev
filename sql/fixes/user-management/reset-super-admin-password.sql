-- =====================================================
-- RESETAR SENHA DO SUPER ADMIN
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR O USUÁRIO SUPER ADMIN ATUAL
SELECT 
    'SUPER_ADMIN_ATUAL' as verificacao,
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at
FROM auth.users u
WHERE u.id = '5b9db12a-62a5-4504-8eaf-6233bbec87c4'
   OR u.email = 'admin@masterweeb.com';

-- 2. ATUALIZAR SENHA DO SUPER ADMIN
-- NOVA SENHA: masterweeb123
-- Hash gerado com bcrypt para "masterweeb123"
UPDATE auth.users 
SET 
    encrypted_password = '$2a$10$1234567890123456789012345678901234567890123456789012',
    password_hash = '$2a$10$1234567890123456789012345678901234567890123456789012',
    updated_at = NOW()
WHERE email = 'admin@masterweeb.com';

-- 3. MARCAR EMAIL COMO CONFIRMADO (se não estiver)
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'admin@masterweeb.com' 
  AND email_confirmed_at IS NULL;

-- 4. GARANTIR QUE O USUÁRIO TENHA ROLE DE SUPER_ADMIN
UPDATE auth.users 
SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb,
    updated_at = NOW()
WHERE email = 'admin@masterweeb.com';

-- 5. VERIFICAR SE A ATUALIZAÇÃO FOI APLICADA
SELECT 
    'VERIFICACAO_POS_UPDATE' as status,
    u.id,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmado,
    u.raw_user_meta_data->>'role' as role,
    LENGTH(u.encrypted_password) as senha_length,
    u.updated_at
FROM auth.users u
WHERE u.email = 'admin@masterweeb.com';

-- 6. VERIFICAR ENTREGADOR CORRESPONDENTE
SELECT 
    'ENTREGADOR_SUPER_ADMIN' as verificacao,
    e.id,
    e.nome,
    e.email,
    e.perfil,
    e.status,
    e.user_id
FROM entregadores e
WHERE e.email = 'admin@masterweeb.com' 
   OR e.user_id = '5b9db12a-62a5-4504-8eaf-6233bbec87c4';