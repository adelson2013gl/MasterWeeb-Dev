-- =====================================================
-- VERIFICAR ESTRUTURA DA TABELA user_roles
-- Executar no Supabase Dashboard > SQL Editor  
-- =====================================================

-- 1. VERIFICAR SE A TABELA user_roles EXISTE
SELECT 
    'TABELA_EXISTS' as verificacao,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'user_roles' 
  AND table_schema = 'public';

-- 2. VERIFICAR ESTRUTURA COMPLETA DA TABELA
SELECT 
    'ESTRUTURA_TABELA' as verificacao,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR CONSTRAINTS E ÍNDICES
SELECT 
    'CONSTRAINTS' as verificacao,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_roles' 
  AND table_schema = 'public';

-- 4. VERIFICAR CHAVES PRIMÁRIAS E ÚNICAS
SELECT 
    'UNIQUE_CONSTRAINTS' as verificacao,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_roles' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');

-- 5. VERIFICAR REGISTROS EXISTENTES
SELECT 
    'REGISTROS_EXISTENTES' as verificacao,
    COUNT(*) as total_registros
FROM user_roles;

-- 6. SE EXISTEM REGISTROS, MOSTRAR ALGUNS EXEMPLOS
SELECT 
    'EXEMPLOS_REGISTROS' as verificacao,
    *
FROM user_roles
LIMIT 5;