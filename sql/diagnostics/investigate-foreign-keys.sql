-- =====================================================
-- DIAGNÓSTICO CRÍTICO: FOREIGN KEYS QUEBRADAS
-- Investigar relacionamento agendamentos -> agendas
-- =====================================================

-- PROBLEMA: "Could not find a relationship between 'agendamentos' and 'agendas' in the schema cache"

-- 1. VERIFICAR SE AS TABELAS EXISTEM
SELECT 
    'TABELAS_EXISTEM' as verificacao,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('agendamentos', 'agendas') 
  AND table_schema = 'public'
ORDER BY table_name;

-- 2. VERIFICAR ESTRUTURA DA TABELA AGENDAMENTOS
SELECT 
    'ESTRUTURA_AGENDAMENTOS' as verificacao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA AGENDAS
SELECT 
    'ESTRUTURA_AGENDAS' as verificacao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agendas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR FOREIGN KEYS EXISTENTES EM AGENDAMENTOS
SELECT 
    'FOREIGN_KEYS_AGENDAMENTOS' as verificacao,
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
  AND tc.table_name = 'agendamentos'
  AND tc.table_schema = 'public';

-- 5. VERIFICAR SE A COLUNA agenda_id EXISTE EM AGENDAMENTOS
SELECT 
    'COLUNA_AGENDA_ID' as verificacao,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND table_schema = 'public'
  AND column_name = 'agenda_id';

-- 6. VERIFICAR SE A COLUNA id EXISTE EM AGENDAS (PK)
SELECT 
    'COLUNA_ID_AGENDAS' as verificacao,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendas' 
  AND table_schema = 'public'
  AND column_name = 'id';

-- 7. TESTAR SE EXISTEM DADOS NAS TABELAS
SELECT 
    'DADOS_AGENDAMENTOS' as verificacao,
    COUNT(*) as total_agendamentos
FROM agendamentos;

SELECT 
    'DADOS_AGENDAS' as verificacao,
    COUNT(*) as total_agendas
FROM agendas;

-- 8. VERIFICAR SE HÁ INCONSISTÊNCIAS NOS DADOS
SELECT 
    'AGENDAMENTOS_ORFAOS' as verificacao,
    COUNT(*) as agendamentos_sem_agenda_valida
FROM agendamentos a
LEFT JOIN agendas ag ON a.agenda_id = ag.id
WHERE ag.id IS NULL;

-- 9. SAMPLE DE DADOS PARA VERIFICAÇÃO
SELECT 
    'SAMPLE_AGENDAMENTOS' as verificacao,
    a.id,
    a.agenda_id,
    a.entregador_id,
    ag.id as agenda_exists
FROM agendamentos a
LEFT JOIN agendas ag ON a.agenda_id = ag.id
LIMIT 5;

-- 10. VERIFICAR CONSTRAINTS ESPECÍFICAS
SELECT 
    'CONSTRAINTS_DETALHADAS' as verificacao,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'agendamentos' 
  AND tc.table_schema = 'public';

-- 11. VERIFICAR NOME EXATO DA FOREIGN KEY (SUPABASE)
SELECT 
    'SUPABASE_FK_NAME' as verificacao,
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    a.attname as column_name,
    af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
WHERE c.contype = 'f'
  AND c.conrelid = 'agendamentos'::regclass;

-- =====================================================
-- POSSÍVEIS SOLUÇÕES (EXECUTAR APENAS SE NECESSÁRIO):
-- =====================================================

-- SE A FOREIGN KEY ESTIVER FALTANDO, CRIAR:
-- ALTER TABLE agendamentos 
-- ADD CONSTRAINT agendamentos_agenda_id_fkey 
-- FOREIGN KEY (agenda_id) REFERENCES agendas(id);

-- SE HOUVER DADOS ÓRFÃOS, LIMPAR PRIMEIRO:
-- DELETE FROM agendamentos WHERE agenda_id NOT IN (SELECT id FROM agendas);
-- =====================================================