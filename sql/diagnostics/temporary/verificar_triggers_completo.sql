-- =====================================================
-- DIAGNÓSTICO COMPLETO: TRIGGERS E CONTROLE DE VAGAS
-- Para confirmar o controle em tempo real de vagas
-- =====================================================

-- 1. LISTAR TODAS AS TRIGGERS DO BANCO
SELECT 
    '=== TODAS AS TRIGGERS DO BANCO ===' as secao,
    '' as trigger_name,
    '' as table_name,
    '' as event_manipulation,
    '' as action_timing,
    '' as action_statement
UNION ALL
SELECT 
    'TRIGGER' as secao,
    trigger_name,
    event_object_table as table_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY secao, table_name, trigger_name;

-- 2. VERIFICAR TRIGGERS ESPECÍFICAS DE AGENDAMENTO
SELECT 
    '=== TRIGGERS DA TABELA AGENDAMENTOS ===' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'agendamentos'
ORDER BY trigger_name;

-- 3. VERIFICAR TRIGGERS DA TABELA AGENDAS
SELECT 
    '=== TRIGGERS DA TABELA AGENDAS ===' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'agendas'
ORDER BY trigger_name;

-- 4. LISTAR TODAS AS FUNÇÕES QUE CONTENHAM "AGENDAMENTO" OU "VAGAS"
SELECT 
    '=== FUNÇÕES RELACIONADAS A AGENDAMENTO/VAGAS ===' as info,
    routine_name as function_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (routine_name ILIKE '%agendamento%' 
       OR routine_name ILIKE '%vagas%'
       OR routine_definition ILIKE '%vagas%'
       OR routine_definition ILIKE '%agendamento%')
ORDER BY routine_name;

-- 5. VERIFICAR CONSTRAINTS DE INTEGRIDADE NAS TABELAS PRINCIPAIS
SELECT 
    '=== CONSTRAINTS DE INTEGRIDADE ===' as info,
    table_name,
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_type = 'CHECK' THEN 
            (SELECT check_clause 
             FROM information_schema.check_constraints cc 
             WHERE cc.constraint_name = tc.constraint_name)
        ELSE 'N/A'
    END as constraint_definition
FROM information_schema.table_constraints tc
WHERE table_schema = 'public' 
  AND table_name IN ('agendamentos', 'agendas')
  AND constraint_type IN ('CHECK', 'UNIQUE', 'FOREIGN KEY')
ORDER BY table_name, constraint_type, constraint_name;

-- 6. VERIFICAR ÍNDICES ÚNICOS RELACIONADOS A AGENDAMENTOS
SELECT 
    '=== ÍNDICES ÚNICOS RELEVANTES ===' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('agendamentos', 'agendas')
  AND indexdef ILIKE '%unique%'
ORDER BY tablename, indexname;

-- 7. TESTAR SE AS TRIGGERS ESTÃO ATIVAS (usando uma agenda de teste)
-- ATENÇÃO: Esta parte será apenas informativa, não executará modificações
SELECT 
    '=== TESTE DE TRIGGERS (SIMULAÇÃO) ===' as info,
    'Para testar as triggers, execute:' as instrucao,
    '1. INSERT em agendamentos com status=agendado' as passo_1,
    '2. Verificar se vagas_ocupadas incrementou automaticamente' as passo_2,
    '3. Tentar INSERT quando agenda já está lotada' as passo_3,
    '4. Verificar se trigger bloqueia com erro AGENDA LOTADA' as passo_4;

-- 8. VERIFICAR ESTRUTURA ATUAL DE UMA AGENDA REAL PARA TESTE
SELECT 
    '=== EXEMPLO DE AGENDA PARA TESTE ===' as info,
    id as agenda_id,
    data_agenda,
    vagas_disponiveis,
    vagas_ocupadas,
    (vagas_disponiveis - vagas_ocupadas) as vagas_livres,
    CASE 
        WHEN (vagas_disponiveis - vagas_ocupadas) > 0 THEN 'TEM VAGAS'
        ELSE 'LOTADA'
    END as status_vagas
FROM agendas 
WHERE ativo = true 
  AND data_agenda >= CURRENT_DATE
ORDER BY data_agenda 
LIMIT 5;

-- 9. CONTAR AGENDAMENTOS REAIS VS VAGAS_OCUPADAS (para verificar sincronização)
SELECT 
    '=== VERIFICAÇÃO DE SINCRONIZAÇÃO ===' as info,
    a.id as agenda_id,
    a.data_agenda,
    a.vagas_disponiveis,
    a.vagas_ocupadas as vagas_ocupadas_registradas,
    COUNT(ag.id) as agendamentos_reais,
    CASE 
        WHEN a.vagas_ocupadas = COUNT(ag.id) THEN '✅ SINCRONIZADO'
        ELSE '❌ DESSINCRONIZADO'
    END as status_sincronizacao
FROM agendas a
LEFT JOIN agendamentos ag ON a.id = ag.agenda_id AND ag.status = 'agendado'
WHERE a.ativo = true 
  AND a.data_agenda >= CURRENT_DATE
GROUP BY a.id, a.data_agenda, a.vagas_disponiveis, a.vagas_ocupadas
HAVING a.vagas_ocupadas != COUNT(ag.id) OR COUNT(ag.id) > 0
ORDER BY a.data_agenda
LIMIT 10;

-- 10. VERIFICAR LOGS DE TRIGGERS (se disponíveis)
SELECT 
    '=== INFORMAÇÕES FINAIS ===' as info,
    'Total de triggers no sistema:' as descricao,
    COUNT(*)::text as valor
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
UNION ALL
SELECT 
    'TRIGGER RELACIONADAS',
    'Triggers relacionadas a agendamento:',
    COUNT(*)::text
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND (event_object_table IN ('agendamentos', 'agendas')
       OR trigger_name ILIKE '%agendamento%'
       OR trigger_name ILIKE '%vagas%');

-- =====================================================
-- INSTRUÇÕES PARA TESTE MANUAL (NÃO EXECUTAR AUTOMATICAMENTE)
-- =====================================================

/*
TESTE MANUAL PARA CONFIRMAR TRIGGERS:

1. Escolha uma agenda com vagas:
   SELECT id, vagas_disponiveis, vagas_ocupadas 
   FROM agendas 
   WHERE vagas_disponiveis > vagas_ocupadas 
   AND ativo = true 
   LIMIT 1;

2. Tente inserir agendamento:
   INSERT INTO agendamentos (
     agenda_id, 
     entregador_id, 
     status, 
     tipo,
     cliente_nome, 
     cliente_telefone, 
     endereco_coleta, 
     endereco_entrega, 
     data_agendamento,
     empresa_id
   ) VALUES (
     '[ID_DA_AGENDA]', 
     '[ID_ENTREGADOR]', 
     'agendado',
     'entrega',
     'Teste Trigger', 
     '11999999999', 
     'Endereço A', 
     'Endereço B', 
     NOW(),
     '[ID_EMPRESA]'
   );

3. Verificar se vagas_ocupadas incrementou:
   SELECT vagas_ocupadas FROM agendas WHERE id = '[ID_DA_AGENDA]';

4. Para testar bloqueio, tente lotar a agenda e inserir mais um agendamento
   - Deve retornar erro: "AGENDA LOTADA"
*/