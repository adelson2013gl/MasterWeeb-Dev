-- =====================================================
-- VERIFICAR ESTRUTURA DA TABELA AGENDAS
-- Diagnosticar erro 400 Bad Request na consulta de agendas
-- =====================================================

-- 1. VERIFICAR SE A TABELA AGENDAS EXISTE
SELECT 
    'TABELA_EXISTS' as verificacao,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'agendas' 
  AND table_schema = 'public';

-- 2. VERIFICAR ESTRUTURA COMPLETA DA TABELA AGENDAS
SELECT 
    'ESTRUTURA_AGENDAS' as verificacao,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'agendas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR CONSTRAINTS E ÍNDICES DA TABELA AGENDAS
SELECT 
    'CONSTRAINTS_AGENDAS' as verificacao,
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'agendas' 
  AND tc.table_schema = 'public';

-- 4. VERIFICAR FOREIGN KEYS DA TABELA AGENDAS
SELECT 
    'FOREIGN_KEYS_AGENDAS' as verificacao,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'agendas'
  AND tc.table_schema = 'public';

-- 5. VERIFICAR DADOS EXISTENTES NA TABELA (SAMPLE)
SELECT 
    'DADOS_SAMPLE' as verificacao,
    COUNT(*) as total_registros
FROM agendas;

-- 6. VERIFICAR PRIMEIROS REGISTROS (se existirem)
SELECT 
    'SAMPLE_REGISTROS' as verificacao,
    *
FROM agendas
LIMIT 3;

-- 7. VERIFICAR CAMPOS ESPECÍFICOS MENCIONADOS NO ERRO
-- Tentativa de verificar se os campos do erro existem
SELECT 
    'CAMPOS_ESPERADOS' as verificacao,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'id' THEN 1 END) > 0 THEN 'EXISTS'
        ELSE 'NOT_EXISTS'
    END as campo_id,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'data' THEN 1 END) > 0 THEN 'EXISTS'
        ELSE 'NOT_EXISTS'
    END as campo_data,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'vagas_disponiveis' THEN 1 END) > 0 THEN 'EXISTS'
        ELSE 'NOT_EXISTS'
    END as campo_vagas_disponiveis,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'vagas_ocupadas' THEN 1 END) > 0 THEN 'EXISTS'
        ELSE 'NOT_EXISTS'
    END as campo_vagas_ocupadas,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'ativo' THEN 1 END) > 0 THEN 'EXISTS'
        ELSE 'NOT_EXISTS'
    END as campo_ativo,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'ativa' THEN 1 END) > 0 THEN 'EXISTS'
        ELSE 'NOT_EXISTS'
    END as campo_ativa
FROM information_schema.columns 
WHERE table_name = 'agendas' 
  AND table_schema = 'public';

-- 8. VERIFICAR CAMPOS SIMILARES (POSSÍVEIS VARIAÇÕES)
SELECT 
    'CAMPOS_SIMILARES' as verificacao,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'agendas' 
  AND table_schema = 'public'
  AND (
    column_name LIKE '%data%' OR
    column_name LIKE '%vaga%' OR
    column_name LIKE '%ativ%' OR
    column_name LIKE '%disponi%' OR
    column_name LIKE '%ocupad%'
  )
ORDER BY column_name;

-- 9. VERIFICAR RLS (Row Level Security) NA TABELA AGENDAS
SELECT 
    'RLS_STATUS_AGENDAS' as verificacao,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'agendas' 
  AND schemaname = 'public';

-- 10. VERIFICAR POLICIES RLS NA TABELA AGENDAS
SELECT 
    'POLICIES_AGENDAS' as verificacao,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'agendas'
ORDER BY policyname;

-- 11. VERIFICAR TABELAS RELACIONADAS (POSSÍVEIS DEPENDÊNCIAS)
SELECT 
    'TABELAS_RELACIONADAS' as verificacao,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%agenda%'
ORDER BY table_name;

-- 12. VERIFICAR SE EXISTE TABELA AGENDAMENTOS (COMUM CONFUNDIR)
SELECT 
    'TABELA_AGENDAMENTOS' as verificacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'agendamentos' 
              AND table_schema = 'public'
        ) THEN 'EXISTS'
        ELSE 'NOT_EXISTS'
    END as agendamentos_existe,
    (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'agendamentos' 
          AND table_schema = 'public'
    ) as agendamentos_campos;