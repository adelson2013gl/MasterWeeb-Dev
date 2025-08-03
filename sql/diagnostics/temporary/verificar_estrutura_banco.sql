-- =====================================================
-- SCRIPT DE DIAGNÓSTICO: VERIFICAR ESTRUTURA DO BANCO
-- Para identificar a causa dos erros 400 em StatusReservas
-- =====================================================

-- 1. VERIFICAR SE COLUNA agenda_id EXISTE NA TABELA agendamentos
SELECT 
    'COLUNA agenda_id' as verificacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'agendamentos' 
              AND column_name = 'agenda_id'
              AND table_schema = 'public'
        ) THEN 'EXISTE ✅'
        ELSE 'NÃO EXISTE ❌'
    END as status;

-- 2. VERIFICAR FOREIGN KEY entre agendamentos e agendas
SELECT 
    'FOREIGN KEY agenda_id' as verificacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'agendamentos_agenda_id_fkey'
              AND table_name = 'agendamentos'
              AND table_schema = 'public'
        ) THEN 'EXISTE ✅'
        ELSE 'NÃO EXISTE ❌'
    END as status;

-- 3. VERIFICAR NOME DO CAMPO DE DATA NA TABELA agendas
SELECT 
    column_name,
    data_type,
    'CAMPO DE DATA na tabela agendas' as observacao
FROM information_schema.columns 
WHERE table_name = 'agendas' 
  AND table_schema = 'public'
  AND (column_name LIKE '%data%' OR column_name LIKE '%date%')
ORDER BY column_name;

-- 4. VERIFICAR ESTRUTURA COMPLETA DA TABELA agendamentos
SELECT 
    column_name,
    data_type,
    is_nullable,
    'ESTRUTURA agendamentos' as tabela
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR RELACIONAMENTOS EXISTENTES
SELECT DISTINCT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    'RELACIONAMENTOS' as observacao
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('agendamentos', 'agendas', 'turnos', 'regioes', 'cidades')
ORDER BY tc.table_name, tc.constraint_name;

-- 6. CONTAR REGISTROS NAS TABELAS PRINCIPAIS
SELECT 'agendamentos' as tabela, COUNT(*) as total_registros FROM public.agendamentos
UNION ALL
SELECT 'agendas' as tabela, COUNT(*) as total_registros FROM public.agendas
UNION ALL
SELECT 'turnos' as tabela, COUNT(*) as total_registros FROM public.turnos
UNION ALL
SELECT 'regioes' as tabela, COUNT(*) as total_registros FROM public.regioes
UNION ALL
SELECT 'cidades' as tabela, COUNT(*) as total_registros FROM public.cidades;

-- 7. TESTAR QUERY SIMILAR À QUE ESTÁ FALHANDO (sem filtros específicos)
SELECT 
    'TESTE QUERY StatusReservas' as teste,
    CASE 
        WHEN EXISTS (
            SELECT 1
            FROM agendamentos a
            LEFT JOIN agendas ag ON a.agenda_id = ag.id
            LEFT JOIN turnos t ON ag.turno_id = t.id
            LEFT JOIN regioes r ON ag.regiao_id = r.id  
            LEFT JOIN cidades c ON r.cidade_id = c.id
            LIMIT 1
        ) THEN 'QUERY FUNCIONA ✅'
        ELSE 'QUERY FALHA ❌'
    END as resultado;