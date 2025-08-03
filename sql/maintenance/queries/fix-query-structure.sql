-- =========================================
-- ANÁLISE: SISTEMAS SEPARADOS IDENTIFICADOS
-- =========================================

-- SISTEMAS IDENTIFICADOS:
-- 1. SISTEMA DE AGENDAS: agendas (vagas para entregadores se cadastrarem)
-- 2. SISTEMA DE AGENDAMENTOS: agendamentos (delivery de produtos)

-- Estas tabelas NÃO TÊM RELACIONAMENTO entre si!
-- São funcionalidades completamente diferentes do sistema.

-- VERIFICAR QUE NÃO EXISTE RELACIONAMENTO
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (tc.table_name = 'agendamentos' OR tc.table_name = 'agendas')
AND tc.table_schema = 'public';

-- CONFIRMAR ESTRUTURAS SEPARADAS
SELECT 'AGENDAS - Sistema de Vagas' as tipo, column_name 
FROM information_schema.columns 
WHERE table_name = 'agendas' AND table_schema = 'public'
UNION ALL
SELECT '---' as tipo, '---' as column_name
UNION ALL
SELECT 'AGENDAMENTOS - Sistema de Delivery' as tipo, column_name 
FROM information_schema.columns 
WHERE table_name = 'agendamentos' AND table_schema = 'public';