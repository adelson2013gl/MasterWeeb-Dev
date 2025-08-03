-- =====================================================
-- DIAGNÓSTICO URGENTE: PROBLEMAS DE SCHEMA AGENDAMENTOS
-- Investigar estrutura real vs código da aplicação
-- =====================================================

-- 1. MOSTRAR ESTRUTURA COMPLETA DA TABELA AGENDAMENTOS
SELECT 
    '=== ESTRUTURA AGENDAMENTOS ===' as secao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. MOSTRAR ENUMS UTILIZADOS
SELECT 
    '=== ENUMS RELACIONADOS ===' as secao,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%agend%' OR t.typname LIKE '%status%'
ORDER BY t.typname, e.enumsortorder;

-- 3. FOREIGN KEYS DA TABELA AGENDAMENTOS
SELECT 
    '=== FOREIGN KEYS AGENDAMENTOS ===' as secao,
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
  AND tc.table_name = 'agendamentos';

-- 4. VERIFICAR SE agenda_id EXISTE
SELECT 
    '=== VERIFICA AGENDA_ID ===' as secao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'agendamentos' 
                      AND column_name = 'agenda_id') 
        THEN 'agenda_id EXISTE'
        ELSE 'agenda_id NÃO EXISTE'
    END as status_agenda_id;

-- 5. MOSTRAR ESTRUTURA DA TABELA AGENDAS
SELECT 
    '=== ESTRUTURA AGENDAS ===' as secao,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. SAMPLE DOS DADOS PARA ENTENDER RELACIONAMENTOS
SELECT 
    '=== SAMPLE AGENDAMENTOS ===' as secao,
    id,
    entregador_id,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'agendamentos' 
                       AND column_name = 'agenda_id') 
         THEN 'agenda_id existe na estrutura'
         ELSE 'agenda_id NÃO existe na estrutura'
    END as agenda_id_status,
    status,
    tipo,
    data_agendamento::date,
    created_at::date
FROM agendamentos
LIMIT 5;

-- 7. VERIFICAR STATUS ENUM REAL
SELECT DISTINCT 
    '=== STATUS REAIS USADOS ===' as secao,
    status,
    COUNT(*) as quantidade
FROM agendamentos
GROUP BY status
ORDER BY quantidade DESC;

-- 8. VERIFICAR TIPO ENUM REAL  
SELECT DISTINCT 
    '=== TIPOS REAIS USADOS ===' as secao,
    tipo,
    COUNT(*) as quantidade
FROM agendamentos
GROUP BY tipo
ORDER BY quantidade DESC;

-- 9. VERIFICAR RLS POLICIES
SELECT 
    '=== POLICIES RLS AGENDAMENTOS ===' as secao,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'agendamentos';

-- 10. ANÁLISE DE CONSULTA PROBLEMÁTICA
-- Simular a consulta do StatusReservas.tsx
SELECT 
    '=== TESTE CONSULTA STATUSRESERVAS ===' as secao,
    'Testando inner joins da consulta...' as descricao;

-- Verificar se os JOINs podem funcionar
SELECT COUNT(*) as total_agendamentos FROM agendamentos;
SELECT COUNT(*) as total_agendas FROM agendas;
SELECT COUNT(*) as total_turnos FROM turnos;
SELECT COUNT(*) as total_regioes FROM regioes;
SELECT COUNT(*) as total_cidades FROM cidades;

-- 11. MOSTRAR PROBLEMAS DE RELACIONAMENTO
SELECT 
    '=== POSSÍVEIS PROBLEMAS ===' as secao,
    'Verificando relacionamentos diretos vs indiretos...' as descricao;