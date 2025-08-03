-- =====================================================
-- INVESTIGAÇÃO: ESTRUTURA REAL DAS TABELAS
-- Descobrir quais colunas realmente existem
-- =====================================================

-- 1. ESTRUTURA COMPLETA DA TABELA AGENDAS
SELECT 
    'ESTRUTURA_AGENDAS' as investigacao,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'agendas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. ESTRUTURA COMPLETA DA TABELA AGENDAMENTOS
SELECT 
    'ESTRUTURA_AGENDAMENTOS' as investigacao,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE agenda_id JÁ EXISTE EM AGENDAMENTOS
SELECT 
    'VERIFICAR_AGENDA_ID' as investigacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'agendamentos' 
              AND column_name = 'agenda_id'
              AND table_schema = 'public'
        ) THEN 'AGENDA_ID_EXISTE'
        ELSE 'AGENDA_ID_NAO_EXISTE'
    END as status;

-- 4. FOREIGN KEYS EXISTENTES EM AGENDAMENTOS
SELECT 
    'FOREIGN_KEYS_AGENDAMENTOS' as investigacao,
    kcu.column_name as coluna_local,
    ccu.table_name AS tabela_referenciada,
    ccu.column_name AS coluna_referenciada,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'agendamentos'
  AND tc.table_schema = 'public';

-- 5. FOREIGN KEYS EXISTENTES EM AGENDAS
SELECT 
    'FOREIGN_KEYS_AGENDAS' as investigacao,
    kcu.column_name as coluna_local,
    ccu.table_name AS tabela_referenciada,
    ccu.column_name AS coluna_referenciada,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'agendas'
  AND tc.table_schema = 'public';

-- 6. SAMPLE DE DADOS DAS TABELAS PARA ENTENDER A ESTRUTURA
SELECT 
    'SAMPLE_AGENDAS' as investigacao,
    *
FROM agendas
LIMIT 2;

SELECT 
    'SAMPLE_AGENDAMENTOS' as investigacao,
    *
FROM agendamentos
LIMIT 2;

-- 7. VERIFICAR TABELAS RELACIONADAS (turnos, regioes, cidades)
SELECT 
    'ESTRUTURA_TURNOS' as investigacao,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'turnos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'ESTRUTURA_REGIOES' as investigacao,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'regioes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'ESTRUTURA_CIDADES' as investigacao,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'cidades' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. VERIFICAR RELACIONAMENTOS ENTRE TABELAS
SELECT 
    'RELACIONAMENTOS_AGENDAS' as investigacao,
    'agendas -> turnos' as relacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'agendas' 
              AND column_name = 'turno_id'
              AND table_schema = 'public'
        ) THEN 'turno_id EXISTE'
        ELSE 'turno_id NAO EXISTE'
    END as status_turno_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'agendas' 
              AND column_name = 'regiao_id'
              AND table_schema = 'public'
        ) THEN 'regiao_id EXISTE'
        ELSE 'regiao_id NAO EXISTE'
    END as status_regiao_id;

-- 9. CONTAR REGISTROS DAS TABELAS
SELECT 'CONTAGEM_REGISTROS' as investigacao,
       'agendas' as tabela,
       COUNT(*) as total
FROM agendas
UNION ALL
SELECT 'CONTAGEM_REGISTROS',
       'agendamentos',
       COUNT(*)
FROM agendamentos
UNION ALL
SELECT 'CONTAGEM_REGISTROS',
       'turnos',
       COUNT(*)
FROM turnos
UNION ALL
SELECT 'CONTAGEM_REGISTROS',
       'regioes',
       COUNT(*)
FROM regioes;