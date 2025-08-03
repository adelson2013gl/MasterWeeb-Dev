-- =====================================================
-- URGENTE: VERIFICAR ESTRUTURA REAL DA TABELA AGENDAMENTOS
-- Descobrir qual campo faz ligação com agendas
-- =====================================================

-- PROBLEMA: Campo agenda_id não existe em agendamentos
-- NECESSÁRIO: Descobrir estrutura real

-- 1. MOSTRAR ESTRUTURA COMPLETA DA TABELA AGENDAMENTOS
SELECT 
    'ESTRUTURA_AGENDAMENTOS' as verificacao,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. MOSTRAR TODAS AS FOREIGN KEYS DA TABELA AGENDAMENTOS
SELECT 
    'FOREIGN_KEYS_AGENDAMENTOS' as verificacao,
    kcu.column_name as local_column,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'agendamentos'
  AND tc.table_schema = 'public';

-- 3. BUSCAR CAMPOS QUE PODEM REFERENCIAR AGENDAS
SELECT 
    'CAMPOS_POSSIVEIS_REFERENCIA' as verificacao,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND table_schema = 'public'
  AND (
    column_name LIKE '%agenda%' OR
    column_name LIKE '%uuid%' OR
    data_type LIKE '%uuid%'
  )
ORDER BY column_name;

-- 4. MOSTRAR CONSTRAINT DEFINITION COMPLETA (PostgreSQL específico)
SELECT 
    'CONSTRAINT_DEFINITIONS' as verificacao,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'agendamentos'::regclass
  AND contype = 'f';

-- 5. SAMPLE DE DADOS DA TABELA AGENDAMENTOS
SELECT 
    'SAMPLE_AGENDAMENTOS' as verificacao,
    *
FROM agendamentos
LIMIT 3;

-- 6. VERIFICAR SE EXISTE UMA TABELA DE JUNÇÃO OU ESTRUTURA DIFERENTE
SELECT 
    'TABELAS_RELACIONADAS' as verificacao,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%agend%' OR
    table_name LIKE '%schedule%' OR
    table_name LIKE '%booking%'
  )
ORDER BY table_name;