-- =========================================
-- VERIFICAÇÃO DA ESTRUTURA REAL DAS TABELAS
-- =========================================

-- 1. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('agendas', 'agendamentos', 'turnos', 'regioes', 'cidades', 'entregadores')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. VERIFICAR SE AS TABELAS EXISTEM
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('agendas', 'agendamentos', 'turnos', 'regioes', 'cidades', 'entregadores')
ORDER BY tablename;

-- 3. VERIFICAR FOREIGN KEYS EXISTENTES
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. LISTAR TODAS AS TABELAS NO SCHEMA PUBLIC
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;