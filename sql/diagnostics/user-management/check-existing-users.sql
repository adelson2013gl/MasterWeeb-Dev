-- Verificar se email já existe na tabela entregadores
SELECT 
    id,
    nome,
    email,
    perfil,
    status,
    empresa_id,
    created_at
FROM entregadores 
WHERE email = 'adminempresa1@masterweeb.com';

-- Verificar configurações de Auth no Supabase
-- Execute este SQL no Supabase Dashboard para verificar users cadastrados:
-- SELECT id, email, created_at FROM auth.users WHERE email = 'adminempresa1@masterweeb.com';