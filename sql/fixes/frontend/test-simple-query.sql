-- =====================================================
-- TESTE SIMPLES: CONSULTA SEM JOINS
-- Para verificar se o problema é nas foreign keys
-- =====================================================

-- 1. TESTE BÁSICO - BUSCAR AGENDAMENTOS SEM JOIN
SELECT 
    'TESTE_AGENDAMENTOS_SIMPLES' as teste,
    COUNT(*) as total
FROM agendamentos
WHERE entregador_id = '63217003-59a5-410c-8ae7-3221d27c7643';

-- 2. TESTE BÁSICO - BUSCAR AGENDAS SEM JOIN  
SELECT 
    'TESTE_AGENDAS_SIMPLES' as teste,
    COUNT(*) as total
FROM agendas
WHERE empresa_id = 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a';

-- 3. TESTE DE FOREIGN KEY MANUAL
SELECT 
    'TESTE_FK_MANUAL' as teste,
    a.id as agendamento_id,
    a.agenda_id,
    ag.id as agenda_encontrada,
    ag.data_agenda
FROM agendamentos a
JOIN agendas ag ON a.agenda_id = ag.id
WHERE a.entregador_id = '63217003-59a5-410c-8ae7-3221d27c7643'
LIMIT 3;

-- 4. VERIFICAR SE EXISTE agendamentos_agenda_id_fkey
SELECT 
    'VERIFICAR_FK_NAME' as teste,
    conname as constraint_name
FROM pg_constraint 
WHERE conname LIKE '%agendamentos_agenda_id%';

-- 5. ESTRUTURA ATUAL DA TABELA AGENDAMENTOS
\d agendamentos;

-- 6. ESTRUTURA ATUAL DA TABELA AGENDAS  
\d agendas;